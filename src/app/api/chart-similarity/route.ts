import { NextRequest, NextResponse } from 'next/server';
import { APIService } from '@/lib/api-service';
import { ChartSimilarityService, SimilarityParameters, SimilarityResult } from '@/lib/chart-similarity-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface KlineData {
  symbol: string;
  prices: number[];
  volumes: number[];
  timestamps: number[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const params: SimilarityParameters = await request.json();
    
    if (!params.reference_symbol) {
      return NextResponse.json(
        { error: 'Reference symbol is required' },
        { status: 400 }
      );
    }

    const similarityService = ChartSimilarityService.getInstance();

    const {
      reference_symbol,
      min_correlation = 0.7,
      max_dtw_distance = 100,
      min_volume = 100000,
      limit = 50,
      timeframe = '4h',
      period_hours = 168, // 7 days
      algorithm = 'hybrid'
    } = params;

    console.log(`🔍 Starting chart similarity scan for ${reference_symbol}`);

    // Get popular trading pairs
    const tickers = await APIService.getTickers();
    const symbols = tickers
      .filter(t => t.symbol !== reference_symbol)
      .map(t => t.symbol)
      .slice(0, 150); // Limit to top 150 for performance

    console.log(`📊 Analyzing ${symbols.length} symbols against ${reference_symbol}`);

    // Get kline data for reference symbol - convert timeframe to interval
    const intervalMap = { '1h': '60', '4h': '240', '1d': 'D' };
    const interval = intervalMap[timeframe] || '240';
    const referenceKlines = await APIService.getKlineData(reference_symbol, interval, limit);
    if (!referenceKlines || referenceKlines.length === 0) {
      return NextResponse.json(
        { error: `No kline data found for reference symbol ${reference_symbol}` },
        { status: 404 }
      );
    }

    if (!referenceKlines || referenceKlines.length === 0) {
      return NextResponse.json(
        { error: `No kline data found for reference symbol ${reference_symbol}` },
        { status: 404 }
      );
    }

    const referencePrices = referenceKlines.map(k => parseFloat(k[4])); // Close price is at index 4
    const normalizedReference = similarityService.normalizePrice(referencePrices);

    // Batch process symbols in chunks to avoid timeout
    const chunkSize = 20;
    const results: SimilarityResult[] = [];
    
    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      console.log(`Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(symbols.length/chunkSize)}`);
      
      const chunkPromises = chunk.map(async (symbol) => {
        try {
          // Get kline data for comparison symbol
          const klines = await APIService.getKlineData(symbol, interval, limit);
          if (!klines || klines.length === 0) return null;

          const prices = klines.map(k => parseFloat(k[4])); // Close price at index 4
          const volumes = klines.map(k => parseFloat(k[5])); // Volume at index 5
          const normalizedPrices = similarityService.normalizePrice(prices);

          // Skip if not enough data points
          if (normalizedPrices.length < 10 || normalizedReference.length < 10) return null;

          // Calculate similarity metrics
          const correlation = similarityService.calculatePearsonCorrelation(normalizedReference, normalizedPrices);
          const dtwDistance = algorithm === 'correlation' ? 0 : 
                            similarityService.calculateDTWDistance(normalizedReference, normalizedPrices);
          
          // Calculate combined similarity score
          const similarity_score = algorithm === 'correlation' ? Math.abs(correlation) :
                                 algorithm === 'dtw' ? (1 - Math.min(dtwDistance / max_dtw_distance, 1)) :
                                 similarityService.calculateSimilarityScore(correlation, dtwDistance, max_dtw_distance);

          // Apply filters
          if (Math.abs(correlation) < min_correlation && algorithm !== 'dtw') return null;
          if (dtwDistance > max_dtw_distance && algorithm !== 'correlation') return null;

          // Get ticker data for additional metrics
          const ticker = tickers.find(t => t.symbol === symbol);
          if (!ticker) return null;

          const volume24h = parseFloat(ticker.volume24h || '0');
          if (volume24h < min_volume) return null;

          // Calculate pattern strength based on price volatility
          const priceChanges = prices.slice(1).map((price, idx) => 
            Math.abs((price - prices[idx]) / prices[idx])
          );
          const avgVolatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
          const pattern_strength = Math.min(avgVolatility * 100, 100); // Cap at 100%

          return {
            symbol,
            correlation,
            dtw_distance: dtwDistance,
            similarity_score,
            pattern_strength,
            price_change_24h: parseFloat(ticker.price24hPcnt || '0'),
            volume_24h: volume24h,
            current_price: parseFloat(ticker.lastPrice)
          } as SimilarityResult;

        } catch (error) {
          console.error(`Error processing ${symbol}:`, error);
          return null;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.filter((result): result is SimilarityResult => result !== null));
    }

    // Sort by similarity score
    const sortedResults = results
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);

    const scanTime = Date.now() - startTime;

    console.log(`✅ Scan completed: Found ${sortedResults.length} similar charts in ${scanTime}ms`);

    return NextResponse.json({
      reference_symbol,
      similar_coins: sortedResults,
      total_analyzed: symbols.length,
      scan_time: scanTime,
      algorithm_used: algorithm,
      parameters: {
        min_correlation,
        max_dtw_distance,
        timeframe,
        period_hours
      }
    });

  } catch (error) {
    console.error('Chart similarity API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform chart similarity analysis', 
        details: error instanceof Error ? error.message : 'Unknown error',
        scan_time: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference_symbol = searchParams.get('reference_symbol');
    
    if (!reference_symbol) {
      return NextResponse.json(
        { error: 'reference_symbol parameter is required' },
        { status: 400 }
      );
    }

    // Convert GET params to POST format and call POST handler
    const params: SimilarityParameters = {
      reference_symbol,
      min_correlation: parseFloat(searchParams.get('min_correlation') || '0.7'),
      max_dtw_distance: parseFloat(searchParams.get('max_dtw_distance') || '100'),
      min_volume: parseFloat(searchParams.get('min_volume') || '100000'),
      limit: parseInt(searchParams.get('limit') || '50'),
      timeframe: (searchParams.get('timeframe') as '1h' | '4h' | '1d') || '4h',
      period_hours: parseInt(searchParams.get('period_hours') || '168'),
      algorithm: (searchParams.get('algorithm') as 'correlation' | 'dtw' | 'hybrid') || 'hybrid'
    };

    // Create mock request for POST handler
    const mockRequest = {
      json: async () => params
    } as NextRequest;

    return await POST(mockRequest);

  } catch (error) {
    console.error('Chart similarity GET error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}