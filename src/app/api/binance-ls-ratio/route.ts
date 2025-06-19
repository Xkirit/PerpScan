import { NextRequest, NextResponse } from 'next/server';

const ALLORIGINS_PROXY = 'https://api.allorigins.win/get?url=';

async function fetchWithAllorigins(url: string, symbol: string): Promise<any> {
  const encodedUrl = encodeURIComponent(url);
  const proxyUrl = `${ALLORIGINS_PROXY}${encodedUrl}`;
  
  console.log(`🌐 Using Allorigins proxy for ${symbol}: ${proxyUrl}`);
  
  const response = await fetch(proxyUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Allorigins proxy failed: ${response.status} - ${response.statusText}`);
  }

  const proxyData = await response.json();
  
  if (!proxyData.contents) {
    throw new Error('Invalid response from Allorigins proxy');
  }

  // Parse the actual API response from the proxy
  return JSON.parse(proxyData.contents);
}

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

    // 🔄 ATTEMPT 1: Direct API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      console.log(`📡 Direct API call for ${symbol}...`);
      
      const response = await fetch(binanceUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Success case
      if (response.ok) {
        const data = await response.json();
        
        // Validate response structure
        if (Array.isArray(data) && data.length > 0) {
          console.log(`✅ Direct API success for ${symbol}`);
          return NextResponse.json(data);
        }
      }

      // If direct call fails or returns invalid data, fall back to proxy
      console.log(`⚠️ Direct API failed for ${symbol}: ${response.status} - ${response.statusText}`);
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.log(`⚠️ Direct API error for ${symbol}:`, fetchError.message);
    }

    // 🔄 ATTEMPT 2: Allorigins Proxy Fallback
    try {
      console.log(`🌐 Fallback to Allorigins proxy for ${symbol}...`);
      
      const proxyData = await fetchWithAllorigins(binanceUrl, symbol);
      
      // Validate proxy response structure
      if (Array.isArray(proxyData) && proxyData.length > 0) {
        console.log(`✅ Allorigins proxy success for ${symbol}`);
        return NextResponse.json(proxyData);
      } else {
        throw new Error('Invalid response structure from proxied API');
      }

    } catch (proxyError: any) {
      console.log(`❌ Allorigins proxy failed for ${symbol}:`, proxyError.message);
      
      // Final fallback - return service unavailable
      return NextResponse.json({ 
        error: 'Both direct API and proxy failed', 
        fallback: true,
        message: `Unable to fetch data for ${symbol}. Both Binance API and Allorigins proxy are unavailable.`,
        attempts: ['direct_api', 'allorigins_proxy']
      }, { status: 503 });
    }

  } catch (error: any) {
    console.error(`💥 Unexpected error:`, error.message);
    return NextResponse.json({ 
      error: 'Internal server error', 
      fallback: true,
      message: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 