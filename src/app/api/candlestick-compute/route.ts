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
  
  // 1. Current body must be significantly bigger than previous body (at least 1.2x)
  if (currentBody <= prevBody * 1.2) {
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

// Optimized function to get filtered USDT symbols with better volume/liquidity filtering
async function getOptimizedUSDTSymbols(): Promise<string[]> {
  try {
    console.log('📊 Fetching and filtering USDT symbols...');
    const tickers = await apiService.getTickers(false);
    
    // Pre-filter symbols for better performance
    const filteredSymbols = tickers
      .filter(ticker => {
        // Only USDT pairs
        if (!ticker.symbol.endsWith('USDT')) return false;
        
        // Volume filtering - minimum 24h volume of $100k
        const volume24h = parseFloat(ticker.volume24h || '0');
        if (volume24h < 100000) return false;
        
        // Price filtering - exclude very low value coins (< $0.0001)
        const price = parseFloat(ticker.lastPrice || '0');
        if (price < 0.0001) return false;
        
        // Open Interest filtering for perpetual contracts
        const openInterestValue = parseFloat(ticker.openInterestValue || '0');
        if (openInterestValue < 50000) return false; // Minimum $50k OI
        
        return true;
      })
      .sort((a, b) => {
        // Sort by 24h volume descending for better pattern quality
        const volumeA = parseFloat(a.volume24h || '0');
        const volumeB = parseFloat(b.volume24h || '0');
        return volumeB - volumeA;
      })
      .map(ticker => ticker.symbol)
      .slice(0, 200); // Reduced from 300 to 200 but higher quality symbols
    
    console.log(`✅ Filtered to ${filteredSymbols.length} high-quality symbols`);
    return filteredSymbols;
  } catch (error) {
    console.error('Error fetching USDT symbols:', error);
    return [];
  }
}

// Optimized batch processing with parallel execution
async function processSymbolBatch(
  symbols: string[], 
  interval: string, 
  timeframe: string
): Promise<EngulfingPattern[]> {
  const batchPromises = symbols.map(async (symbol) => {
    try {
      return await scanSymbolForEngulfing(symbol, interval);
    } catch (error) {
      console.error(`Error processing ${symbol} for ${timeframe}:`, error);
      return null;
    }
  });
  
  const results = await Promise.allSettled(batchPromises);
  
  // Extract successful results
  return results
    .filter((result): result is PromiseFulfilledResult<EngulfingPattern | null> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value!)
    .filter(Boolean);
}

// Ultra-optimized compute function for Vercel deployment (respects 10s timeout)
async function computePatternsForTimeframeVercel(
  timeframe: '1h' | '4h' | '1d', 
  interval: string, 
  symbols: string[],
  maxProcessingTime: number = 8000 // 8 seconds max to stay under Vercel limit
): Promise<{ patterns: EngulfingPattern[], completed: boolean, processed: number }> {
  console.log(`🚀 Computing ${timeframe} patterns for ${symbols.length} symbols (Vercel optimized)...`);
  
  const patterns: EngulfingPattern[] = [];
  const batchSize = 25; // Smaller batches for faster iteration
  const maxConcurrentBatches = 5; // Higher concurrency for speed
  const startTime = Date.now();
  let processed = 0;
  
  // Split symbols into batches
  const batches: string[][] = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    batches.push(symbols.slice(i, i + batchSize));
  }
  
  console.log(`📦 Processing ${batches.length} batches of ${batchSize} symbols each`);
  
  // Process batches with time limit enforcement
  for (let i = 0; i < batches.length; i += maxConcurrentBatches) {
    // Check if we're approaching timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > maxProcessingTime) {
      console.log(`⏰ Timeout protection: stopping at ${processed}/${symbols.length} symbols`);
      break;
    }
    
    const currentBatches = batches.slice(i, i + maxConcurrentBatches);
    
    const batchPromises = currentBatches.map(async (batch) => {
      const batchStartTime = Date.now();
      try {
        const batchPatterns = await processSymbolBatch(batch, interval, timeframe);
        processed += batch.length;
        console.log(`📊 Batch completed in ${Date.now() - batchStartTime}ms: +${batchPatterns.length} patterns`);
        return batchPatterns;
      } catch (error) {
        console.error(`❌ Batch error:`, error);
        processed += batch.length;
        return [];
      }
    });
    
    try {
      const batchResults = await Promise.race([
        Promise.all(batchPromises),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Batch timeout')), maxProcessingTime - elapsed)
        )
      ]);
      
      // Flatten and add to patterns
      batchResults.forEach(batchPatterns => {
        patterns.push(...batchPatterns);
      });
      
    } catch (error) {
      console.error(`❌ Batch group timeout or error:`, error);
      break;
    }
  }
  
  // Sort by body ratio (strongest patterns first)
  patterns.sort((a, b) => b.bodyRatio - a.bodyRatio);
  
  const completed = processed >= symbols.length;
  console.log(`✅ ${timeframe}: Processed ${processed}/${symbols.length} symbols, found ${patterns.length} patterns (completed: ${completed})`);
  
  return { 
    patterns: patterns.slice(0, 20), // Top 20 patterns per timeframe
    completed,
    processed
  };
}

export async function POST(request: NextRequest) {
  console.log('🚀 Starting candlestick computation...');
  const startTime = Date.now();
  const maxExecutionTime = 8000; // 8 seconds max for Vercel safety
  
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const timeframe = body.timeframe as '1h' | '4h' | '1d'; // Single timeframe only
    const forceCompute = body.force || false;
    
    // Validate timeframe
    if (!timeframe || !['1h', '4h', '1d'].includes(timeframe)) {
      return NextResponse.json({ 
        error: 'Invalid timeframe',
        message: 'Timeframe must be one of: 1h, 4h, 1d'
      }, { status: 400 });
    }
    
    // Check auth
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.CANDLESTICK_CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Invalid authorization header'
      }, { status: 401 });
    }
    
    console.log(`🎯 Processing single timeframe: ${timeframe}`);
    
    // Get filtered symbols
    const symbols = await getOptimizedUSDTSymbols();
    if (symbols.length === 0) {
      return NextResponse.json({ 
        error: 'No symbols found',
        message: 'Failed to fetch filtered USDT symbols'
      }, { status: 500 });
    }
    
    // Check if timeframe needs updating (unless forced)
    if (!forceCompute) {
      const needsUpdate = await CandlestickCache.needsUpdate(timeframe);
      if (!needsUpdate) {
        console.log(`✅ ${timeframe} timeframe is up to date`);
        
        // Return current data
        const existingData = await CandlestickCache.getPatterns();
        return NextResponse.json({
          success: true,
          message: `${timeframe} timeframe is up to date`,
          skipped: true,
          timeframe,
          duration: 0,
          patterns: existingData?.[timeframe] || [],
          nextUpdate: CandlestickCache.getNextUpdateTimes()
        });
      }
    }
    
    // Define interval mapping
    const intervalMap = {
      '1h': '60',
      '4h': '240', 
      '1d': 'D'
    };
    
    const interval = intervalMap[timeframe];
    
    // Clear existing cache for this timeframe
    console.log(`🗑️ Clearing ${timeframe} cache...`);
    await CandlestickCache.clearTimeframe(timeframe);
    
    // Compute patterns for the single timeframe
    console.log(`🔄 Computing ${timeframe} patterns for ${symbols.length} symbols...`);
    const result = await computePatternsForTimeframeVercel(
      timeframe, 
      interval, 
      symbols, 
      maxExecutionTime - 1000 // Leave 1s buffer
    );
    
    // Get existing data for other timeframes
    const existingData = await CandlestickCache.getPatterns();
    
    // Create updated result
    const updatedResult = {
      '1h': timeframe === '1h' ? result.patterns : (existingData?.['1h'] || []),
      '4h': timeframe === '4h' ? result.patterns : (existingData?.['4h'] || []),
      '1d': timeframe === '1d' ? result.patterns : (existingData?.['1d'] || []),
      timestamp: new Date().toISOString(),
      totalScanned: symbols.length,
      nextUpdate: CandlestickCache.getNextUpdateTimes()
    };
    
    // Save to cache
    await CandlestickCache.savePatterns(updatedResult);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`✅ ${timeframe} computation completed in ${duration}s`);
    console.log(`📊 Found ${result.patterns.length} patterns (processed ${result.processed}/${symbols.length} symbols)`);
    
    return NextResponse.json({
      success: true,
      timeframe,
      duration,
      totalScanned: symbols.length,
      processedSymbols: result.processed,
      completed: result.completed,
      patternsFound: result.patterns.length,
      patterns: result.patterns,
      performance: {
        symbolsPerSecond: Math.round(result.processed / Math.max(duration, 1)),
        completionRate: Math.round((result.processed / symbols.length) * 100)
      },
      nextUpdate: CandlestickCache.getNextUpdateTimes(),
      timestamp: new Date().toISOString()
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
      
      console.log(`⚡ Manual trigger: ${timeframes.join(', ')} timeframes (force: ${force})`);
      
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
    
    if (action === 'benchmark') {
      // Performance benchmark test
      console.log('🏃‍♂️ Starting performance benchmark...');
      const benchmarkStart = Date.now();
      
      try {
        const symbols = await getOptimizedUSDTSymbols();
        const sampleSize = Math.min(50, symbols.length); // Test with 50 symbols
        const sampleSymbols = symbols.slice(0, sampleSize);
        
        console.log(`📊 Benchmarking with ${sampleSize} symbols`);
        
                 // Test single timeframe performance
         const testStart = Date.now();
         const testResult = await computePatternsForTimeframeVercel('1h', '60', sampleSymbols);
         const testDuration = Date.now() - testStart;
        
        const benchmarkDuration = Date.now() - benchmarkStart;
        
        return NextResponse.json({
          success: true,
                     benchmark: {
             totalDuration: benchmarkDuration,
             testDuration,
             symbolsProcessed: sampleSize,
             patternsFound: testResult.patterns.length,
             performance: {
               symbolsPerSecond: Math.round(sampleSize / (testDuration / 1000)),
               msPerSymbol: Math.round(testDuration / sampleSize),
               estimatedFullScanTime: Math.round((testDuration / sampleSize) * 200 / 1000) // For 200 symbols
             }
           },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Benchmark failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - benchmarkStart
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Invalid action',
      validActions: ['status', 'trigger', 'benchmark']
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