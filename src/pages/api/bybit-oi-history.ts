import { NextRequest } from 'next/server';

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

export default async function handler(req: NextRequest) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ message: 'Method not allowed' }), 
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol');
  const startTime = url.searchParams.get('startTime');
  const endTime = url.searchParams.get('endTime');

  if (!symbol || !startTime || !endTime) {
    return new Response(
      JSON.stringify({ message: 'Missing required parameters: symbol, startTime, endTime' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Validate timestamps
    const startMs = parseInt(startTime);
    const endMs = parseInt(endTime);
    
    if (isNaN(startMs) || isNaN(endMs)) {
      return new Response(
        JSON.stringify({ message: 'Invalid timestamp format' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🌍 Edge Function running in region: ${process.env.VERCEL_REGION || 'unknown'}`);
    console.log(`📡 Fetching OI history for ${symbol} from unrestricted region...`);

    // Bybit API URL
    const bybitUrl = `https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbol}&intervalTime=1h&startTime=${startMs}&endTime=${endMs}&limit=50`;
    
    // Make API call from unrestricted region
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(bybitUrl, {
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
        console.log(`⚠️ Bybit API response not OK: ${response.status} - ${response.statusText}`);
        return new Response(
          JSON.stringify({ 
            message: 'Bybit API error',
            error: `HTTP ${response.status}: ${response.statusText}`,
            symbol: symbol,
            region: process.env.VERCEL_REGION || 'unknown'
          }), 
          { status: response.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();

      if (data.retCode !== 0) {
        console.log(`⚠️ Bybit business error: ${data.retMsg}`);
        return new Response(
          JSON.stringify({ 
            message: 'Bybit API business error',
            error: data.retMsg || 'Unknown business error',
            symbol: symbol,
            region: process.env.VERCEL_REGION || 'unknown'
          }), 
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate response structure
      if (!data.result || !data.result.list) {
        console.log(`⚠️ Invalid response structure from Bybit API`);
        return new Response(
          JSON.stringify({ 
            message: 'Invalid response structure',
            error: 'Bybit API returned unexpected data format',
            symbol: symbol,
            region: process.env.VERCEL_REGION || 'unknown'
          }), 
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Success from region ${process.env.VERCEL_REGION || 'unknown'} for ${symbol}`);

      // Return successful response with region info
      return new Response(
        JSON.stringify(data), 
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'X-Edge-Region': process.env.VERCEL_REGION || 'unknown',
            'X-Cache-Status': 'MISS',
          } 
        }
      );

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      console.log(`❌ Fetch error in region ${process.env.VERCEL_REGION || 'unknown'}:`, fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            message: 'Request timeout',
            error: 'Bybit API took too long to respond',
            symbol: symbol,
            region: process.env.VERCEL_REGION || 'unknown'
          }), 
          { status: 504, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: 'Network error',
          error: fetchError.message,
          symbol: symbol,
          region: process.env.VERCEL_REGION || 'unknown'
        }), 
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error(`💥 Unexpected error in region ${process.env.VERCEL_REGION || 'unknown'}:`, error.message);
    return new Response(
      JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        symbol: symbol,
        region: process.env.VERCEL_REGION || 'unknown'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 