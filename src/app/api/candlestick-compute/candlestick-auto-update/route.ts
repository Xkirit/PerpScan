import { NextRequest, NextResponse } from 'next/server';
import CandlestickCache from '@/lib/candlestick-cache';

export async function POST(request: NextRequest) {
  console.log('🚀 Auto-update check triggered...');
  
  try {
    // Check auth (simple secret key for cron jobs)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.CANDLESTICK_CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Invalid authorization header'
      }, { status: 401 });
    }

    // Check which timeframes need updating based on current time
    const timeframesToUpdate = CandlestickCache.getTimeframesToUpdate();
    
    if (timeframesToUpdate.length === 0) {
      console.log('⏰ No timeframes need updating at this time');
      return NextResponse.json({
        success: true,
        message: 'No timeframes need updating',
        currentTime: new Date().toISOString(),
        nextUpdate: CandlestickCache.getNextUpdateTimes()
      });
    }

    console.log(`⏰ Timeframes to update: ${timeframesToUpdate.join(', ')}`);

    // Trigger computation for the specific timeframes
    const computeResponse = await fetch(`${request.nextUrl.origin}/api/candlestick-compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${expectedAuth}`
      },
      body: JSON.stringify({ 
        timeframes: timeframesToUpdate,
        force: true // Force update since we know these timeframes need clearing
      })
    });

    if (!computeResponse.ok) {
      const errorText = await computeResponse.text();
      console.error('❌ Failed to trigger computation:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Failed to trigger computation',
        details: errorText
      }, { status: 500 });
    }

    const computeResult = await computeResponse.json();
    console.log('✅ Auto-update completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Auto-update completed',
      timeframesUpdated: timeframesToUpdate,
      computeResult,
      currentTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in auto-update:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Auto-update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get next update schedule
    const timeframesToUpdate = CandlestickCache.getTimeframesToUpdate();
    const nextUpdate = CandlestickCache.getNextUpdateTimes();
    const now = new Date();
    
    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      currentUTCHour: now.getUTCHours(),
      currentUTCMinute: now.getUTCMinutes(),
      timeframesToUpdateNow: timeframesToUpdate,
      nextUpdateTimes: nextUpdate,
      updateSchedule: {
        '1h': 'Every hour at minute 0-2',
        '4h': 'Every 4 hours (0, 4, 8, 12, 16, 20 UTC) at minute 0-2',
        '1d': 'Daily at 00:00-00:02 UTC'
      }
    });
  } catch (error) {
    console.error('❌ Error getting auto-update status:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 