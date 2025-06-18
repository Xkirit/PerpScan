import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const period = searchParams.get('period') || '1h';
    const limit = searchParams.get('limit') || '1';

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Try to fetch from Binance with timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(
        `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.status === 451) {
        // Binance is blocking the request - return graceful fallback
        return NextResponse.json({ 
          error: 'Binance API unavailable', 
          fallback: true,
          message: 'Geographic restrictions or rate limiting detected'
        }, { status: 503 });
      }

      if (!response.ok) {
        return NextResponse.json({ 
          error: 'Failed to fetch from Binance', 
          status: response.status,
          fallback: true 
        }, { status: response.status });
      }

      const data = await response.json();
      
      // Validate response structure
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ 
          error: 'Invalid response from Binance', 
          fallback: true 
        }, { status: 502 });
      }

      return NextResponse.json(data);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ 
          error: 'Request timeout', 
          fallback: true,
          message: 'Binance API took too long to respond'
        }, { status: 504 });
      }
      
      throw fetchError; // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      fallback: true,
      message: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 