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
    // Call Bybit API for historical Open Interest data
    const url = `https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbol}&intervalTime=1h&startTime=${startTime}&endTime=${endTime}&limit=50`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`Bybit API error: ${data.retMsg}`);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching OI history:', error);
    res.status(500).json({ 
      message: 'Failed to fetch OI history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 