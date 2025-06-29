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

    const binanceUrl = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`;
    
    // 🚀 PRIMARY APPROACH: Direct API call
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

      const response = await fetch(binanceUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      } else if (response.status === 451) {
        // Geographic restriction detected, fallback to proxy
        throw new Error('Geographic restriction');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (directError: any) {
      console.log(`Direct Binance API failed for ${symbol}: ${directError.message}, attempting proxy...`);
      
      // 🔄 FALLBACK APPROACH: Allorigins proxy for geographic restrictions
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(binanceUrl)}`;
        
        const proxyController = new AbortController();
        const proxyTimeoutId = setTimeout(() => proxyController.abort(), 6000); // 6 second timeout for proxy

        const proxyResponse = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: proxyController.signal,
        });

        clearTimeout(proxyTimeoutId);

        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          return NextResponse.json({ ...proxyData, fallback: true });
        } else {
          throw new Error(`Proxy failed: HTTP ${proxyResponse.status}`);
        }
      } catch (proxyError: any) {
        console.error(`Both direct and proxy requests failed for ${symbol}:`, proxyError);
        return NextResponse.json({ 
          error: 'Service temporarily unavailable',
          fallback: true,
          details: `Direct: ${directError.message}, Proxy: ${proxyError.message}`
        }, { status: 503 });
      }
    }

  } catch (error: any) {
    console.error('Binance LS Ratio API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
} 