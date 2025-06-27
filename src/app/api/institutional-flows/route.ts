import { NextRequest, NextResponse } from 'next/server';
import InstitutionalFlowsRedis from '@/lib/redis-client';

interface InstitutionalFlow {
  symbol: string;
  openInterest: number;
  openInterestValue: number;
  oiChange24h: number;
  oiChangePercent: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  fundingRate: number;
  timestamp: number;
  historicalOI?: number[];
  oiVelocity?: number;
  oiAcceleration?: number;
  abnormalityScore?: number;
  whaleRating?: 'mega' | 'large' | 'medium' | 'small';
  priorityScore?: number;
  volumeCategory?: 'low' | 'medium' | 'high';
  manipulationConfidence?: number;
  suspicion?: {
    bullishScore: number;
    bearishScore: number;
    dominantSignal: string;
    signalDetails: string[];
  };
  longShortRatio?: {
    buyRatio: number;
    sellRatio: number;
    bias: 'bullish' | 'bearish' | 'neutral';
    biasStrength: 'weak' | 'moderate' | 'strong';
    timestamp: number;
    source: 'binance' | 'bybit';
  };
}

const MAX_FLOWS = 16;

// Read flows from Redis
async function readFlows(): Promise<InstitutionalFlow[]> {
  try {
    const flows = await InstitutionalFlowsRedis.getFlows();
    // console.log(`📊 Found ${flows.length} flows in Redis`);
    return flows;
  } catch (error) {
    //console.error('Error reading from Redis:', error);
    return [];
  }
}

// Write flows to Redis
async function writeFlows(flows: InstitutionalFlow[]): Promise<void> {
  try {
    await InstitutionalFlowsRedis.saveFlows(flows);
    // console.log(`💾 Successfully saved ${flows.length} flows to Redis`);
  } catch (error) {
    //console.error('Error writing to Redis:', error);
    throw error;
  }
}

// GET - Retrieve current institutional flows
export async function GET(request: NextRequest) {
  try {
    // Check if this is a forced refresh request
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('force') === 'true';
    
    // 🔍 DEBUG: Check Upstash Redis connection
    const redisHealth = await InstitutionalFlowsRedis.healthCheck();
    
    // console.log('🔍 Upstash Redis Connection Debug:');
    // console.log(`   Redis Health: ${redisHealth ? '✅ Connected' : '❌ Disconnected'}`);
    // console.log(`   KV_REST_API_URL: ${process.env.KV_REST_API_URL ? '✅ Set' : '❌ Missing'}`);
    // console.log(`   KV_REST_API_TOKEN: ${process.env.KV_REST_API_TOKEN ? '✅ Set' : '❌ Missing'}`);
  
    // if (!redisHealth) {
    //   console.log('⚠️ Upstash Redis not available');
    // } else {
    //   console.log('✅ Upstash Redis is connected and ready');
    // }
    
    if (forceRefresh) {
      // console.log('🔄 Force refresh requested - bypassing any cache');
      // Add a small delay to ensure Redis writes have propagated
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const flows = await readFlows();
    
    // Sort by suspicion score descending (total of bullish + bearish scores)
    const sortedFlows = flows.sort((a, b) => {
      const totalScoreA = (a.suspicion?.bullishScore || 0) + (a.suspicion?.bearishScore || 0);
      const totalScoreB = (b.suspicion?.bullishScore || 0) + (b.suspicion?.bearishScore || 0);
      
      // Primary sort: Total suspicion score
      if (totalScoreB !== totalScoreA) return totalScoreB - totalScoreA;
      
      // Secondary sort: Max individual score (bullish or bearish)
      const maxScoreA = Math.max(a.suspicion?.bullishScore || 0, a.suspicion?.bearishScore || 0);
      const maxScoreB = Math.max(b.suspicion?.bullishScore || 0, b.suspicion?.bearishScore || 0);
      if (maxScoreB !== maxScoreA) return maxScoreB - maxScoreA;
      
      // Tertiary sort: Open Interest Value
      return b.openInterestValue - a.openInterestValue;
    });
    
    const response = NextResponse.json({
      success: true,
      flows: sortedFlows,
      totalFlows: sortedFlows.length,
      displayCount: sortedFlows.length,
      lastUpdated: sortedFlows.length > 0 ? Math.max(...sortedFlows.map(f => f.timestamp)) : null,
      // Debug info
      debug: {
        upstashConnected: redisHealth,
        hasKvUrl: !!process.env.KV_REST_API_URL,
        hasKvToken: !!process.env.KV_REST_API_TOKEN
      }
    });
    
    // Add no-cache headers to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    //console.error('Error reading institutional flows:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read institutional flows',
      flows: [],
      totalFlows: 0,
      lastUpdated: null
    }, { status: 500 });
  }
}

// POST - Update institutional flows with priority-based replacement
export async function POST(request: NextRequest) {
  try {
    const { flows: newFlows } = await request.json();
    
    if (!Array.isArray(newFlows)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid flows data'
      }, { status: 400 });
    }
    
    // Handle clear request (empty flows array)
    if (newFlows.length === 0) {
      await writeFlows([]);
      console.log('🗑️ All institutional flows cleared from Redis via POST');
      
      return NextResponse.json({
        success: true,
        totalFlows: 0,
        addedCount: 0,
        updatedCount: 0,
        removedCount: 0,
        lastUpdated: Date.now(),
        maxFlows: MAX_FLOWS,
        cleared: true,
        priorityReplacement: false
      });
    }
    
    // Read existing flows from Redis
    const existingFlows = await readFlows();
    const existingFlowsMap = new Map(existingFlows.map(flow => [flow.symbol, flow]));
    
    let addedCount = 0;
    let updatedCount = 0;
    let removedCount = 0;
    
    // Process new flows
    const updatedFlowsMap = new Map(existingFlowsMap);
    const currentTime = Date.now();
    
    // Add or update flows from the new scan
    newFlows.forEach((newFlow: InstitutionalFlow) => {
      const existingFlow = updatedFlowsMap.get(newFlow.symbol);
      
      if (!existingFlow) {
        // New coin
        updatedFlowsMap.set(newFlow.symbol, {
          ...newFlow,
          timestamp: currentTime
        });
        addedCount++;
        // console.log(`🆕 New flow detected: ${newFlow.symbol} (Priority: ${(newFlow.priorityScore || 0).toFixed(0)})`);
      } else {
        // Existing coin - update with latest data
        const oldPriority = existingFlow.priorityScore || 0;
        const newPriority = newFlow.priorityScore || 0;
        
        updatedFlowsMap.set(newFlow.symbol, {
          ...newFlow,
          timestamp: currentTime
        });
        updatedCount++;
        
        // console.log(`🔄 Updated existing flow: ${newFlow.symbol} (Priority: ${oldPriority.toFixed(0)} → ${newPriority.toFixed(0)})`);
      }
    });
    
    // Convert to array and sort by suspicion score
    let finalFlows = Array.from(updatedFlowsMap.values())
      .sort((a, b) => {
        const totalScoreA = (a.suspicion?.bullishScore || 0) + (a.suspicion?.bearishScore || 0);
        const totalScoreB = (b.suspicion?.bullishScore || 0) + (b.suspicion?.bearishScore || 0);
        return totalScoreB - totalScoreA;
      });
    
    // 🎯 SUSPICION-BASED REPLACEMENT LOGIC - Maximum 16 coins
    if (finalFlows.length > MAX_FLOWS) {
      const removedFlows = finalFlows.slice(MAX_FLOWS);
      finalFlows = finalFlows.slice(0, MAX_FLOWS);
      
      removedCount = removedFlows.length;
      
      // console.log(`🔄 Priority-based replacement: Keeping top ${MAX_FLOWS} flows`);
      // console.log(`➕ Top ${MAX_FLOWS} flows (by priority):`);
      // finalFlows.forEach((flow, index) => {
      //   console.log(`   ${index + 1}. ${flow.symbol}: Priority ${(flow.priorityScore || 0).toFixed(0)}`);
      // });
      
      // if (removedFlows.length > 0) {
      //   console.log(`➖ Removed ${removedFlows.length} lower priority flows:`);
      //   removedFlows.forEach((flow) => {
      //     console.log(`   - ${flow.symbol}: Priority ${(flow.priorityScore || 0).toFixed(0)}`);
      //   });
      // }
    }
    
    // Save to Redis
    await writeFlows(finalFlows);
    
    // console.log(`🚀 Redis updated: ${finalFlows.length} flows (${addedCount} new, ${updatedCount} updated, ${removedCount} removed)`);
    
    return NextResponse.json({
      success: true,
      totalFlows: finalFlows.length,
      addedCount,
      updatedCount,
      removedCount,
      lastUpdated: currentTime,
      maxFlows: MAX_FLOWS,
      priorityReplacement: finalFlows.length === MAX_FLOWS
    });
  } catch (error) {
    //console.error('Error updating institutional flows:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update institutional flows'
    }, { status: 500 });
  }
}

// DELETE - Clear all institutional flows from Redis
export async function DELETE(request: NextRequest) {
  try {
    // Clear all flows from Redis
    await writeFlows([]);
    
    console.log('🗑️ All institutional flows cleared from Redis');
    
    return NextResponse.json({
      success: true,
      message: 'All institutional flows cleared successfully',
      clearedAt: Date.now()
    });
  } catch (error) {
    console.error('Error clearing institutional flows:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear institutional flows'
    }, { status: 500 });
  }
} 