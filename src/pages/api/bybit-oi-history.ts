import { NextApiRequest, NextApiResponse } from 'next';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { symbol, startTime, endTime } = req.query;

  if (!symbol || !startTime || !endTime) {
    return res.status(400).json({ message: 'Missing required parameters: symbol, startTime, endTime' });
  }

  try {
    // Validate parameters
    const symbolStr = Array.isArray(symbol) ? symbol[0] : symbol;
    const startTimeStr = Array.isArray(startTime) ? startTime[0] : startTime;
    const endTimeStr = Array.isArray(endTime) ? endTime[0] : endTime;

    // Validate timestamps
    const startMs = parseInt(startTimeStr);
    const endMs = parseInt(endTimeStr);
    
    if (isNaN(startMs) || isNaN(endMs)) {
      return res.status(400).json({ message: 'Invalid timestamp format' });
    }

    // Bybit API URL
    const bybitUrl = `https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbolStr}&intervalTime=1h&startTime=${startMs}&endTime=${endMs}&limit=50`;
    
    // 🔄 ATTEMPT 1: Direct API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      console.log(`📡 Direct API call for ${symbolStr}...`);
      
      const response = await fetch(bybitUrl, {
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

        if (data.retCode === 0 && data.result && data.result.list) {
          console.log(`✅ Direct API success for ${symbolStr}`);
          return res.status(200).json(data);
        }
      }

      // If direct call fails, fall back to proxy
      console.log(`⚠️ Direct API failed for ${symbolStr}: ${response.status} - ${response.statusText}`);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.log(`⚠️ Direct API error for ${symbolStr}:`, fetchError.message);
    }

    // 🔄 ATTEMPT 2: Allorigins Proxy Fallback
    try {
      console.log(`🌐 Fallback to Allorigins proxy for ${symbolStr}...`);
      
      const proxyData = await fetchWithAllorigins(bybitUrl, symbolStr);
      
      // Validate proxy response structure
      if (proxyData.retCode === 0 && proxyData.result && proxyData.result.list) {
        console.log(`✅ Allorigins proxy success for ${symbolStr}`);
        return res.status(200).json(proxyData);
      } else {
        throw new Error(`Bybit API error: ${proxyData.retMsg || 'Unknown business error'}`);
      }

    } catch (proxyError: any) {
      console.log(`❌ Allorigins proxy failed for ${symbolStr}:`, proxyError.message);
      
      // Final fallback - return service unavailable
      return res.status(503).json({ 
        message: 'Both direct API and proxy failed',
        error: `Unable to fetch OI history for ${symbolStr}. Both Bybit API and Allorigins proxy are unavailable.`,
        symbol: symbolStr,
        attempts: ['direct_api', 'allorigins_proxy']
      });
    }

  } catch (error: any) {
    console.error('💥 Unexpected error:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch OI history',
      error: error instanceof Error ? error.message : 'Unknown error',
      symbol: Array.isArray(symbol) ? symbol[0] : symbol
    });
  }
} 