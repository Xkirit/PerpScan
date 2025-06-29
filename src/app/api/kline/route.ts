import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '60';
    const limit = searchParams.get('limit') || '24';
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Build query parameters
    const params = new URLSearchParams({
      category: 'linear',
      symbol,
      interval,
      limit,
    });

    if (start) params.append('start', start);
    if (end) params.append('end', end);

    // Add timeout to prevent Vercel function timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const bybitUrl = `https://api.bybit.com/v5/market/kline?${params.toString()}`;
    
    const response = await fetch(bybitUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Bybit Kline API error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ 
        error: 'Failed to fetch kline data from Bybit',
        status: response.status 
      }, { status: response.status });
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      console.error(`Bybit Kline API retCode error: ${data.retMsg}`);
      return NextResponse.json({ 
        error: `Bybit API Error: ${data.retMsg}`,
        retCode: data.retCode 
      }, { status: 400 });
    }

    // Return the kline data
    return NextResponse.json({
      success: true,
      data: data.result?.list || [],
      symbol,
      interval,
      count: data.result?.list?.length || 0
    });

  } catch (error: any) {
    console.error('Kline API Error:', error);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Request timeout - Bybit API took too long to respond' 
      }, { status: 408 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
} 