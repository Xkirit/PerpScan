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

    // If Cloudflare proxy is configured, send request through it
    const proxyOrigin = process.env.PROXY_ORIGIN;
    let fetchUrl = binanceUrl;
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
    };

    if (proxyOrigin) {
      fetchUrl = `${proxyOrigin.replace(/\/$/, '')}/fetch?url=${encodeURIComponent(binanceUrl)}`;
      if (process.env.PROXY_SECRET) {
        headers['Authorization'] = `Bearer ${process.env.PROXY_SECRET}`;
      }
    }

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch data from Binance' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Binance LS Ratio API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 