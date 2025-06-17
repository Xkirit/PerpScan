import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const limit = searchParams.get('limit');

    if (!symbol || !interval) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol and interval are required parameters'
        },
        { status: 400 }
      );
    }

    const params: any = {
      category: 'linear',
      symbol: symbol,
      interval: interval,
    };

    if (start) params.start = start;
    if (end) params.end = end;
    if (limit) params.limit = limit;

    const response = await axios.get(
      'https://api.bybit.com/v5/market/kline',
      {
        params,
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

    return NextResponse.json({
      success: true,
      data: response.data.result?.list || []
    });

  } catch (error) {
    console.error('Kline fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 