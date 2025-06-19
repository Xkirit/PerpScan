import { NextRequest, NextResponse } from 'next/server';

// Configure Edge Runtime with unrestricted regions
export const runtime = 'edge';
export const regions = [
  'fra1',  // 🇩🇪 Frankfurt (Europe)
  'sin1',  // 🇸🇬 Singapore (Asia-Pacific)
  'ams1',  // 🇳🇱 Amsterdam (Europe)
  'hkg1',  // 🇭🇰 Hong Kong (Asia-Pacific)
  'lhr1',  // 🇬🇧 London (Europe)
  'yyz1',  // 🇨🇦 Toronto (North America - unrestricted)
];

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

    console.log(`🌍 Edge Function running in region: ${process.env.VERCEL_REGION || 'unknown'}`);
    console.log(`📡 Fetching LS ratio for ${symbol} from unrestricted region...`);

    const binanceUrl = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`;

    // Make direct API call from unrestricted region
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(binanceUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`⚠️ API response not OK: ${response.status} - ${response.statusText}`);
        return NextResponse.json({ 
          error: 'Binance API error', 
          status: response.status,
          region: process.env.VERCEL_REGION || 'unknown',
          message: `Failed to fetch from region ${process.env.VERCEL_REGION || 'unknown'}`
        }, { status: response.status });
      }

      const data = await response.json();
      
      // Validate response structure
      if (!Array.isArray(data) || data.length === 0) {
        console.log(`⚠️ Invalid response structure from Binance API`);
        return NextResponse.json({ 
          error: 'Invalid response from Binance', 
          region: process.env.VERCEL_REGION || 'unknown',
          message: 'API returned invalid data structure'
        }, { status: 502 });
      }

      console.log(`✅ Success from region ${process.env.VERCEL_REGION || 'unknown'} for ${symbol}`);
      
      // Add region info to response for debugging
      return NextResponse.json(data, {
        headers: {
          'X-Edge-Region': process.env.VERCEL_REGION || 'unknown',
          'X-Cache-Status': 'MISS',
        }
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      console.log(`❌ Fetch error in region ${process.env.VERCEL_REGION || 'unknown'}:`, fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ 
          error: 'Request timeout', 
          region: process.env.VERCEL_REGION || 'unknown',
          message: 'API request timed out'
        }, { status: 504 });
      }
      
      return NextResponse.json({ 
        error: 'Network error', 
        region: process.env.VERCEL_REGION || 'unknown',
        message: fetchError.message
      }, { status: 503 });
    }

  } catch (error: any) {
    console.error(`💥 Unexpected error in region ${process.env.VERCEL_REGION || 'unknown'}:`, error.message);
    return NextResponse.json({ 
      error: 'Internal server error', 
      region: process.env.VERCEL_REGION || 'unknown',
      message: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 