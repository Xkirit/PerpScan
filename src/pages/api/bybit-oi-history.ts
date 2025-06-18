import { NextApiRequest, NextApiResponse } from 'next';

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

    // Call Bybit API for historical Open Interest data with timeout
    const url = `https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbolStr}&intervalTime=1h&startTime=${startMs}&endTime=${endMs}&limit=50`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Bybit API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      if (data.retCode !== 0) {
        throw new Error(`Bybit API error: ${data.retMsg || 'Unknown business error'}`);
      }

      // Validate response structure
      if (!data.result || !data.result.list) {
        throw new Error('Invalid response structure from Bybit API');
      }

      res.status(200).json(data);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ 
          message: 'Request timeout',
          error: 'Bybit API took too long to respond'
        });
      }
      
      throw fetchError; // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    res.status(500).json({ 
      message: 'Failed to fetch OI history',
      error: error instanceof Error ? error.message : 'Unknown error',
      symbol: Array.isArray(symbol) ? symbol[0] : symbol
    });
  }
} 