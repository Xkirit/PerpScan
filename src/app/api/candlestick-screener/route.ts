import { NextRequest, NextResponse } from 'next/server';
import { apiService } from '@/lib/api-service';
import CandlestickCache from '@/lib/candlestick-cache';

interface EngulfingPattern {
  symbol: string;
  type: 'bullish' | 'bearish';
  currentCandle: {
    open: number;
    close: number;
    high: number;
    low: number;
    timestamp: number;
    volume: number;
  };
  previousCandle: {
    open: number;
    close: number;
    high: number;
    low: number;
    timestamp: number;
    volume: number;
  };
  bodyRatio: number; // How much bigger the current body is compared to previous
  priceChange: number; // Percentage change from previous close to current close
}

interface ScreenerResult {
  '1h': EngulfingPattern[];
  '4h': EngulfingPattern[];
  '1d': EngulfingPattern[];
  timestamp: string;
  totalScanned: number;
}

// Function to check if current candle engulfs previous candle
function isEngulfingPattern(current: string[], previous: string[]): EngulfingPattern | null {
  const currentOpen = parseFloat(current[1]);
  const currentClose = parseFloat(current[4]);
  const currentHigh = parseFloat(current[2]);
  const currentLow = parseFloat(current[3]);
  const currentTimestamp = parseInt(current[0]);
  const currentVolume = parseFloat(current[5]);

  const prevOpen = parseFloat(previous[1]);
  const prevClose = parseFloat(previous[4]);
  const prevHigh = parseFloat(previous[2]);
  const prevLow = parseFloat(previous[3]);
  const prevTimestamp = parseInt(previous[0]);
  const prevVolume = parseFloat(previous[5]);

  // Calculate candle bodies
  const currentBody = Math.abs(currentClose - currentOpen);
  const prevBody = Math.abs(prevClose - prevOpen);

  // Calculate candle ranges (high to low)
  const currentRange = currentHigh - currentLow;
  const prevRange = prevHigh - prevLow;

  // Determine if previous candle was bullish or bearish
  const prevIsBullish = prevClose > prevOpen;
  const currentIsBullish = currentClose > currentOpen;

  // CRITICAL: Must be opposite direction for true reversal pattern
  // We only want bearish engulfing bullish OR bullish engulfing bearish
  if (prevIsBullish === currentIsBullish) {
    return null; // Same direction = not a reversal pattern
  }

  // Enhanced filtering for meaningful patterns:
  
  // 1. Current body must be significantly bigger than previous body (at least 1.5x)
  if (currentBody <= prevBody * 1.5) {
    return null;
  }
  
  // 2. Previous candle must have a meaningful body (not just a doji/small candle)
  // Previous body should be at least 30% of its range
  if (prevRange > 0 && (prevBody / prevRange) < 0.3) {
    return null;
  }
  
  // 3. Current candle body should be at least 50% of its range (strong directional move)
  if (currentRange > 0 && (currentBody / currentRange) < 0.5) {
    return null;
  }
  
  // 4. Minimum price movement requirement (at least 0.5% move)
  const priceChangeAbs = Math.abs((currentClose - prevClose) / prevClose) * 100;
  if (priceChangeAbs < 0.5) {
    return null;
  }

  // Check for true reversal engulfing patterns
  let isEngulfing = false;
  let type: 'bullish' | 'bearish';

  if (currentIsBullish && !prevIsBullish) {
    // BULLISH ENGULFING: Green candle engulfs red candle (bullish reversal)
    // Current bullish candle must completely engulf previous bearish candle
    isEngulfing = currentOpen <= prevClose && currentClose >= prevOpen;
    type = 'bullish';
  } else if (!currentIsBullish && prevIsBullish) {
    // BEARISH ENGULFING: Red candle engulfs green candle (bearish reversal)  
    // Current bearish candle must completely engulf previous bullish candle
    isEngulfing = currentOpen >= prevClose && currentClose <= prevOpen;
    type = 'bearish';
  } else {
    return null; // This should never hit due to earlier check, but safety net
  }

  if (!isEngulfing) {
    return null;
  }

  // Calculate body ratio, handle edge cases
  let bodyRatio = currentBody / prevBody;
  
  // Handle edge cases where ratio might be invalid
  if (!isFinite(bodyRatio) || isNaN(bodyRatio) || bodyRatio <= 0) {
    bodyRatio = 1; // Default to 1x if calculation is invalid
  }
  
  // Cap extremely high ratios to prevent display issues
  if (bodyRatio > 1000) {
    bodyRatio = 1000;
  }

  // Calculate price change percentage
  const priceChange = ((currentClose - prevClose) / prevClose) * 100;

  return {
    symbol: '', // Will be set by caller
    type,
    currentCandle: {
      open: currentOpen,
      close: currentClose,
      high: currentHigh,
      low: currentLow,
      timestamp: currentTimestamp,
      volume: currentVolume
    },
    previousCandle: {
      open: prevOpen,
      close: prevClose,
      high: prevHigh,
      low: prevLow,
      timestamp: prevTimestamp,
      volume: prevVolume
    },
    bodyRatio: Math.round(bodyRatio * 100) / 100, // Round to 2 decimal places
    priceChange: Math.round(priceChange * 100) / 100 // Round to 2 decimal places
  };
}

// Function to scan a single symbol for engulfing patterns
async function scanSymbolForEngulfing(symbol: string, interval: string): Promise<EngulfingPattern | null> {
  try {
    // Get the last 3 candles to ensure we analyze only closed candles
    const klineData = await apiService.getKlineData(symbol, interval, 3, undefined, undefined, false);
    
    if (klineData.length < 3) {
      return null;
    }

    // Sort by timestamp (newest first from API)
    const sortedData = klineData.sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    
    // Use closed candles only: [0] = still forming, [1] = most recent closed, [2] = previous closed
    const currentCandle = sortedData[1];  // Most recent CLOSED candle
    const previousCandle = sortedData[2]; // Previous CLOSED candle

    const pattern = isEngulfingPattern(currentCandle, previousCandle);
    if (pattern) {
      pattern.symbol = symbol;
      return pattern;
    }

    return null;
  } catch (error) {
    console.error(`Error scanning ${symbol} for ${interval}:`, error);
    return null;
  }
}

// Function to get all USDT symbols
async function getAllUSDTSymbols(): Promise<string[]> {
  try {
    const tickers = await apiService.getTickers(false);
    return tickers
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .map(ticker => ticker.symbol)
      .slice(0, 300); // Limit to 300 as requested
  } catch (error) {
    console.error('Error fetching USDT symbols:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const forceCompute = url.searchParams.get('force') === 'true';
    
    // First, try to get cached data
    if (!forceCompute) {
      const cachedData = await CandlestickCache.getPatterns();
      
      if (cachedData) {
        console.log('📊 Serving candlestick patterns from cache');
        return NextResponse.json(cachedData);
      }
      
      console.log('📊 No cached candlestick data found, checking if computation is needed');
    }
    
    // If no cached data or force compute, check if we should trigger background computation
    if (forceCompute) {
      console.log('🔄 Force compute requested, triggering background computation...');
      
      // Trigger background computation
      try {
        const computeResponse = await fetch(`${request.nextUrl.origin}/api/candlestick-compute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CANDLESTICK_CRON_SECRET || 'default-secret'}`
          },
          body: JSON.stringify({ 
            timeframes: ['1h', '4h', '1d'],
            force: true
          })
        });
        
        if (computeResponse.ok) {
          const computeResult = await computeResponse.json();
          console.log('✅ Background computation completed');
          
          // Get the freshly computed data
          const freshData = await CandlestickCache.getPatterns();
          if (freshData) {
            return NextResponse.json(freshData);
          }
        } else {
          console.error('❌ Background computation failed:', await computeResponse.text());
        }
      } catch (computeError) {
        console.error('❌ Error triggering background computation:', computeError);
      }
    }
    
    // If we reach here, we need to provide a fallback response
    // This could happen during initial setup or if computation fails
    
    // Try to use any existing cached data, even if old
    const existingData = await CandlestickCache.getPatterns();
    if (existingData) {
      console.log('📊 Serving potentially stale cached data as fallback');
      return NextResponse.json({
        ...existingData,
        warning: 'Data may be stale - background computation in progress'
      });
    }
    
    // Last resort: return empty results with helpful message
    console.log('📊 No cached data available, returning empty results');
    const nextUpdate = CandlestickCache.getNextUpdateTimes();
    
    return NextResponse.json({
      '1h': [],
      '4h': [],
      '1d': [],
      timestamp: new Date().toISOString(),
      totalScanned: 0,
      nextUpdate,
      message: 'No patterns available yet - initial computation in progress. Please refresh in a few minutes.',
      isInitializing: true
    });
    
  } catch (error) {
    console.error('❌ Error in candlestick screener:', error);
    
    // Try to serve any cached data as fallback on error
    try {
      const fallbackData = await CandlestickCache.getPatterns();
      if (fallbackData) {
        console.log('📊 Serving cached data as error fallback');
        return NextResponse.json({
          ...fallbackData,
          warning: 'Serving cached data due to error'
        });
      }
    } catch (fallbackError) {
      console.error('❌ Fallback cache read also failed:', fallbackError);
    }
    
    return NextResponse.json({ 
      error: 'Failed to load candlestick patterns',
      details: error instanceof Error ? error.message : 'Unknown error',
      '1h': [],
      '4h': [],
      '1d': [],
      timestamp: new Date().toISOString(),
      totalScanned: 0
    }, { status: 500 });
  }
} 