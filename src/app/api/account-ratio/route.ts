import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const period = searchParams.get('period');
    const limit = searchParams.get('limit');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol is required parameter'
        },
        { status: 400 }
      );
    }

    const params: any = {
      category: 'linear',
      symbol: symbol,
    };

    if (period) params.period = period;
    if (limit) params.limit = limit;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const response = await axios.get(
      'https://api.bybit.com/v5/market/account-ratio',
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
    console.error('Account ratio fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 