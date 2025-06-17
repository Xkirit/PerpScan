import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const response = await axios.get(
      'https://api.bybit.com/v5/market/tickers',
      {
        params: {
          category: 'linear'
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

    return NextResponse.json({
      success: true,
      data: response.data.result?.list || []
    });

  } catch (error) {
    console.error('Tickers fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 