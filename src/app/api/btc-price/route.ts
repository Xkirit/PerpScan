import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Bybit API configuration
const BYBIT_BASE_URL = 'https://api.bybit.com/v5';
const BYBIT_TESTNET_URL = 'https://api-testnet.bybit.com/v5';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT'; // Default to BTCUSDT
    
    console.log(`Fetching ticker data for ${symbol} from Bybit...`);

    // Fetch ticker data from Bybit
    const response = await axios.get(`${BYBIT_BASE_URL}/market/tickers`, {
      params: {
        category: 'spot',
        symbol: symbol
      },
      timeout: 10000
    });

    if (response.data.retCode !== 0) {
      throw new Error(`Bybit API error: ${response.data.retMsg}`);
    }

    const tickerData = response.data.result.list[0];
    
    if (!tickerData) {
      throw new Error(`No ticker data found for ${symbol}`);
    }

    // Calculate 24h change percentage
    const lastPrice = parseFloat(tickerData.lastPrice);
    const prevPrice24h = parseFloat(tickerData.prevPrice24h);
    const change24h = prevPrice24h > 0 ? ((lastPrice - prevPrice24h) / prevPrice24h) * 100 : 0;

    // Format the response
    const formattedData = {
      symbol: tickerData.symbol,
      price: parseFloat(tickerData.lastPrice).toFixed(2),
      change24h: change24h.toFixed(2),
      volume24h: parseFloat(tickerData.volume24h).toFixed(2),
      high24h: parseFloat(tickerData.highPrice24h).toFixed(2),
      low24h: parseFloat(tickerData.lowPrice24h).toFixed(2),
      marketCap: parseFloat(tickerData.marketCap || '0').toFixed(2),
      timestamp: new Date().toISOString()
    };

    console.log(`Successfully fetched ${symbol} data:`, formattedData);
    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error('Error fetching ticker data:', error);
    
    // Return a fallback response with error info
    return NextResponse.json({
      error: 'Failed to fetch ticker data',
      message: error.message,
      symbol: 'BTCUSDT',
      price: '0.00',
      change24h: '0.00',
      volume24h: '0.00',
      high24h: '0.00',
      low24h: '0.00',
      marketCap: '0.00',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 