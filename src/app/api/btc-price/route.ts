import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const interval = searchParams.get('interval') || '4h';

    const bybitInterval = interval === '1d' ? 'D' : '60';
    const points = interval === '1d' ? 30 : 24;
    
    const endTime = Date.now();
    const startTime = endTime - (points * (interval === '1d' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));
    
    const response = await axios.get(
      `https://api.bybit.com/v5/market/kline`,
      {
        params: {
          category: 'linear',
          symbol: 'BTCUSDT',
          interval: bybitInterval,
          start: startTime,
          end: endTime,
          limit: points
        },
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      }
    );

    if (response.data.retCode !== 0) {
      throw new Error(`API error: ${response.data.retMsg}`);
    }

    const klineData = response.data.result?.list || [];
    const sortedData = klineData.reverse();
    
    let btcChange = 0;
    if (sortedData.length > 0) {
      const basePrice = parseFloat(sortedData[0][4]); // First close price
      const lastPrice = parseFloat(sortedData[sortedData.length - 1][4]); // Last close price
      btcChange = ((lastPrice - basePrice) / basePrice) * 100;
    }

    return NextResponse.json({
      success: true,
      data: {
        priceChange: btcChange,
        interval: interval
      }
    });

  } catch (error) {
    console.error('BTC price fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 