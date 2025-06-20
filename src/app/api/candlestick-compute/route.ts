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
  bodyRatio: number;
  priceChange: number;
  detectedAt: number;
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

  // Current body must be bigger than previous body
  if (currentBody <= prevBody) {
    return null;
  }

  // Determine if previous candle was bullish or bearish
  const prevIsBullish = prevClose > prevOpen;
  const currentIsBullish = currentClose > currentOpen;

  // Must be opposite direction
  if (prevIsBullish === currentIsBullish) {
    return null;
  }

  // More practical engulfing pattern: current candle body must completely contain previous candle body
  let isEngulfing = false;
  let type: 'bullish' | 'bearish';

  if (currentIsBullish && !prevIsBullish) {
    // Bullish engulfing: current candle's range engulfs previous bearish candle
    // Current open should be <= previous close, current close should be >= previous open
    isEngulfing = currentOpen <= Math.max(prevOpen, prevClose) && currentClose >= Math.min(prevOpen, prevClose);
    type = 'bullish';
  } else if (!currentIsBullish && prevIsBullish) {
    // Bearish engulfing: current candle's range engulfs previous bullish candle
    // Current open should be >= previous close, current close should be <= previous open
    isEngulfing = currentOpen >= Math.min(prevOpen, prevClose) && currentClose <= Math.max(prevOpen, prevClose);
    type = 'bearish';
  } else {
    return null;
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
    priceChange: Math.round(priceChange * 100) / 100, // Round to 2 decimal places
    detectedAt: Date.now() // Add the missing detectedAt timestamp
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

// Compute patterns for a specific timeframe
async function computePatternsForTimeframe(timeframe: '1h' | '4h' | '1d', interval: string, symbols: string[]): Promise<EngulfingPattern[]> {
  console.log(`🔍 Computing ${timeframe} patterns for ${symbols.length} symbols...`);
  
  const patterns: EngulfingPattern[] = [];
  const batchSize = 15; // Slightly larger batches for background processing
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    
    const batchPromises = batch.map(symbol => 
      scanSymbolForEngulfing(symbol, interval)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Add valid patterns to results
    batchResults.forEach(pattern => {
      if (pattern) {
        patterns.push(pattern);
      }
    });
    
    // Progress logging
    if (i % (batchSize * 10) === 0) {
      console.log(`📊 ${timeframe}: Processed ${Math.min(i + batchSize, symbols.length)}/${symbols.length} symbols, found ${patterns.length} patterns`);
    }
    
    // Small delay between batches to be respectful to the API
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay for background processing
    }
  }
  
  // Sort by body ratio (strongest patterns first)
  patterns.sort((a, b) => b.bodyRatio - a.bodyRatio);
  
  console.log(`✅ ${timeframe}: Found ${patterns.length} patterns, top 20 will be stored`);
  
  return patterns.slice(0, 20); // Top 20 patterns per timeframe
}

export async function POST(request: NextRequest) {
  console.log('🚀 Starting candlestick pattern computation...');
  const startTime = Date.now();
  
  try {
    // Parse request body to see which timeframes to compute
    const body = await request.json().catch(() => ({}));
    const timeframes = body.timeframes || ['1h', '4h', '1d'];
    const forceCompute = body.force || false;
    
    // Check auth (simple secret key for cron jobs)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.CANDLESTICK_CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Invalid authorization header'
      }, { status: 401 });
    }
    
    // Get symbols once for all timeframes
    const symbols = await getAllUSDTSymbols();
    
    if (symbols.length === 0) {
      return NextResponse.json({ 
        error: 'No symbols found',
        message: 'Failed to fetch USDT symbols'
      }, { status: 500 });
    }
    
    // Define timeframe mappings
    const timeframeIntervals = {
      '1h': '60',    // 1 hour
      '4h': '240',   // 4 hours  
      '1d': 'D'      // 1 day
    };
    
    // Check which timeframes actually need updating (unless forced)
    const timeframesToCompute: Array<'1h' | '4h' | '1d'> = [];
    
    if (forceCompute) {
      timeframesToCompute.push(...timeframes);
      console.log('🔄 Force compute enabled, processing all requested timeframes');
    } else {
      for (const tf of timeframes) {
        const needsUpdate = await CandlestickCache.needsUpdate(tf);
        if (needsUpdate) {
          timeframesToCompute.push(tf);
          console.log(`⏰ ${tf} timeframe needs update`);
        } else {
          console.log(`✅ ${tf} timeframe is up to date`);
        }
      }
    }
    
    if (timeframesToCompute.length === 0) {
      console.log('📊 All timeframes are up to date, no computation needed');
      return NextResponse.json({
        success: true,
        message: 'All timeframes are up to date',
        skipped: true,
        nextUpdate: CandlestickCache.getNextUpdateTimes()
      });
    }
    
    // Compute patterns for each timeframe that needs updating
    const results: { [key: string]: EngulfingPattern[] } = {};
    
    for (const timeframe of timeframesToCompute) {
      const interval = timeframeIntervals[timeframe];
      const patterns = await computePatternsForTimeframe(timeframe, interval, symbols);
      results[timeframe] = patterns;
    }
    
    // Get existing patterns for timeframes we didn't compute
    const existingData = await CandlestickCache.getPatterns();
    
    // Merge new results with existing data
    const finalResult = {
      '1h': results['1h'] || existingData?.['1h'] || [],
      '4h': results['4h'] || existingData?.['4h'] || [],
      '1d': results['1d'] || existingData?.['1d'] || [],
      timestamp: new Date().toISOString(),
      totalScanned: symbols.length,
      nextUpdate: CandlestickCache.getNextUpdateTimes()
    };
    
    // Save to cache
    await CandlestickCache.savePatterns(finalResult);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const totalPatterns = finalResult['1h'].length + finalResult['4h'].length + finalResult['1d'].length;
    
    console.log(`🎉 Candlestick computation completed in ${duration}s`);
    console.log(`📈 Results: 1h=${finalResult['1h'].length}, 4h=${finalResult['4h'].length}, 1d=${finalResult['1d'].length} (total: ${totalPatterns})`);
    
    return NextResponse.json({
      success: true,
      duration,
      totalScanned: symbols.length,
      timeframesComputed: timeframesToCompute,
      patterns: {
        '1h': finalResult['1h'].length,
        '4h': finalResult['4h'].length,
        '1d': finalResult['1d'].length,
        total: totalPatterns
      },
      nextUpdate: finalResult.nextUpdate,
      timestamp: finalResult.timestamp
    });
    
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.error('❌ Error in candlestick computation:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Failed to compute candlestick patterns',
      details: error instanceof Error ? error.message : 'Unknown error',
      duration
    }, { status: 500 });
  }
}

// GET endpoint for manual triggering and status checks
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'status';
    
    if (action === 'status') {
      // Return cache status
      const data = await CandlestickCache.getPatterns();
      const dataAge = await CandlestickCache.getDataAge();
      const nextUpdate = CandlestickCache.getNextUpdateTimes();
      
      return NextResponse.json({
        success: true,
        cached: !!data,
        patterns: data ? {
          '1h': data['1h'].length,
          '4h': data['4h'].length,
          '1d': data['1d'].length,
          total: data['1h'].length + data['4h'].length + data['1d'].length
        } : null,
        dataAge,
        nextUpdate,
        lastUpdate: data?.timestamp,
        totalScanned: data?.totalScanned
      });
    }
    
    if (action === 'trigger') {
      // Manual trigger (for testing)
      const force = url.searchParams.get('force') === 'true';
      const timeframes = url.searchParams.get('timeframes')?.split(',') || ['1h', '4h', '1d'];
      
      // Create a POST request to self
      const response = await fetch(request.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CANDLESTICK_CRON_SECRET || 'default-secret'}`
        },
        body: JSON.stringify({ timeframes, force })
      });
      
      return response;
    }
    
    return NextResponse.json({ 
      error: 'Invalid action',
      validActions: ['status', 'trigger']
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Error in candlestick compute GET:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 