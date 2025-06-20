import { NextRequest, NextResponse } from 'next/server';
import CandlestickCache from '@/lib/candlestick-cache';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing candlestick pattern cache...');
    
    // Trigger the computation endpoint
    const computeResponse = await fetch(`${request.nextUrl.origin}/api/candlestick-compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CANDLESTICK_CRON_SECRET || 'default-secret'}`
      },
      body: JSON.stringify({ 
        timeframes: ['1h', '4h', '1d'],
        force: true
      })
    });
    
    if (computeResponse.ok) {
      const result = await computeResponse.json();
      
      return NextResponse.json({
        success: true,
        message: 'Candlestick cache initialized successfully',
        computation: result,
        timestamp: new Date().toISOString()
      });
    } else {
      const errorText = await computeResponse.text();
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize cache',
        details: errorText
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error initializing candlestick cache:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize candlestick cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return current cache status
    const data = await CandlestickCache.getPatterns();
    const dataAge = await CandlestickCache.getDataAge();
    const nextUpdate = CandlestickCache.getNextUpdateTimes();
    const health = await CandlestickCache.healthCheck();
    
    return NextResponse.json({
      success: true,
      cacheHealth: health,
      hasData: !!data,
      patterns: data ? {
        '1h': data['1h'].length,
        '4h': data['4h'].length,
        '1d': data['1d'].length,
        total: data['1h'].length + data['4h'].length + data['1d'].length
      } : null,
      dataAge,
      nextUpdate,
      lastUpdate: data?.timestamp,
      totalScanned: data?.totalScanned,
      isInitialized: !!data && data['1h'].length + data['4h'].length + data['1d'].length > 0
    });
    
  } catch (error) {
    console.error('❌ Error checking cache status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check cache status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 