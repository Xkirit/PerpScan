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
    // Validate timestamps
    const startMs = parseInt(startTime as string);
    const endMs = parseInt(endTime as string);
    
    if (isNaN(startMs) || isNaN(endMs)) {
      return res.status(400).json({ message: 'Invalid timestamp format' });
    }

    // Bybit API URL
    const bybitUrl = `https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbol}&intervalTime=1h&startTime=${startMs}&endTime=${endMs}&limit=50`;

    const proxyOrigin = process.env.PROXY_ORIGIN;
    let fetchUrl = bybitUrl;
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
    };

    if (proxyOrigin) {
      fetchUrl = `${proxyOrigin.replace(/\/$/, '')}/fetch?url=${encodeURIComponent(bybitUrl)}`;
      if (process.env.PROXY_SECRET) {
        headers['Authorization'] = `Bearer ${process.env.PROXY_SECRET}`;
      }
    }

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        message: 'Bybit API error',
        error: `HTTP ${response.status}: ${response.statusText}`,
        symbol: symbol
      });
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      return res.status(502).json({ 
        message: 'Bybit API business error',
        error: data.retMsg || 'Unknown business error',
        symbol: symbol
      });
    }

    // Validate response structure
    if (!data.result || !data.result.list) {
      return res.status(502).json({ 
        message: 'Invalid response structure',
        error: 'Bybit API returned unexpected data format',
        symbol: symbol
      });
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Bybit OI History API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      symbol: symbol
    });
  }
} 