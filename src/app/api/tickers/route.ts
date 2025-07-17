import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Bybit API configuration
const BYBIT_BASE_URL = 'https://api.bybit.com/v5';

// Common cryptocurrency symbols
const COMMON_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
  'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'LINKUSDT',
  'UNIUSDT', 'LTCUSDT', 'BCHUSDT', 'XRPUSDT', 'ATOMUSDT'
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log(`Fetching ticker data from Bybit...`);

    let symbols = COMMON_SYMBOLS;
    
    // If specific symbol requested, prioritize it
    if (symbol) {
      const symbolUpper = symbol.toUpperCase();
      symbols = [symbolUpper, ...COMMON_SYMBOLS.filter(s => s !== symbolUpper)];
    }

    // Fetch ticker data for multiple symbols
    const response = await axios.get(`${BYBIT_BASE_URL}/market/tickers`, {
      params: {
        category: 'spot',
        symbol: symbols.slice(0, limit).join(',')
      },
      timeout: 15000
    });

    if (response.data.retCode !== 0) {
      throw new Error(`Bybit API error: ${response.data.retMsg}`);
    }

    const tickerList = response.data.result.list || [];
    
    if (tickerList.length === 0) {
      throw new Error('No ticker data found');
    }

    // Process and format the data
    const formattedData = tickerList.map((ticker: any) => {
      const lastPrice = parseFloat(ticker.lastPrice);
      const prevPrice24h = parseFloat(ticker.prevPrice24h);
      const change24h = prevPrice24h > 0 ? ((lastPrice - prevPrice24h) / prevPrice24h) * 100 : 0;

      return {
        symbol: ticker.symbol,
        price: parseFloat(ticker.lastPrice).toFixed(4),
        change24h: change24h.toFixed(2),
        volume24h: parseFloat(ticker.volume24h).toFixed(2),
        high24h: parseFloat(ticker.highPrice24h).toFixed(4),
        low24h: parseFloat(ticker.lowPrice24h).toFixed(4),
        marketCap: parseFloat(ticker.marketCap || '0').toFixed(2),
        timestamp: new Date().toISOString()
      };
    });

    // Sort by 24h volume (descending)
    formattedData.sort((a: any, b: any) => parseFloat(b.volume24h) - parseFloat(a.volume24h));

    console.log(`Successfully fetched ${formattedData.length} tickers`);
    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error('Error fetching ticker data:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch ticker data',
      message: error.message,
      data: []
    }, { status: 500 });
  }
} 