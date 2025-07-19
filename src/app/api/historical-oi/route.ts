import { NextRequest, NextResponse } from 'next/server';
import { apiService } from '@/lib/api-service';

// This endpoint is designed to get the Open Interest value from ~24 hours ago for a specific symbol.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // We fetch the last 25 hours of hourly data to ensure we have a point for 24h ago.
    const limit = 25;
    const interval = '1h';
    const endTime = Date.now();
    const startTime = endTime - (limit * 60 * 60 * 1000);

    const oiList = await apiService.getOpenInterestHistory(
      symbol,
      interval,
      limit,
      startTime,
      endTime
    );

    if (!oiList || oiList.length < 24) {
      // If we don't have enough data points, we can't reliably get the 24h old value.
      return NextResponse.json({ oldOpenInterestValue: null });
    }

    // The list is sorted from newest to oldest. We want the 24th item.
    const oldDataPoint = oiList[23]; // 0-indexed, so 23 is the 24th item
    const oldOpenInterestValue = oldDataPoint ? parseFloat(oldDataPoint.openInterest) : null;

    return NextResponse.json({ oldOpenInterestValue });

  } catch (error) {
    console.error('Error fetching historical OI:', error);
    // Return null in case of any exception
    return NextResponse.json({ oldOpenInterestValue: null }, { status: 500 });
  }
} 