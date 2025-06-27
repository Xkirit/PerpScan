import { NextRequest, NextResponse } from 'next/server';
import { FibonacciService } from '@/lib/fibonacci-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with defaults
    const minRetracement = parseInt(searchParams.get('minRetracement') || '30');
    const maxRetracement = parseInt(searchParams.get('maxRetracement') || '80');
    const requirePocConfluence = searchParams.get('requirePocConfluence') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '50');
    const minVolume = parseInt(searchParams.get('minVolume') || '100000');

    // Validate parameters
    if (minRetracement < 0 || minRetracement > 100) {
      return NextResponse.json(
        { error: 'minRetracement must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (maxRetracement < 0 || maxRetracement > 100) {
      return NextResponse.json(
        { error: 'maxRetracement must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (minRetracement >= maxRetracement) {
      return NextResponse.json(
        { error: 'minRetracement must be less than maxRetracement' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 200' },
        { status: 400 }
      );
    }

    if (minVolume < 1000) {
      return NextResponse.json(
        { error: 'minVolume must be at least 1000' },
        { status: 400 }
      );
    }

    console.log(`🎯 Starting Fibonacci scanner with params:`, {
      minRetracement,
      maxRetracement,
      requirePocConfluence,
      limit,
      minVolume
    });

    const fibService = new FibonacciService();
    
    const result = await fibService.scanFibonacciRetracements(
      minRetracement,
      maxRetracement,
      requirePocConfluence,
      limit,
      minVolume
    );

    // Add some metadata for the frontend
    const response = {
      ...result,
      metadata: {
        scanCompleted: new Date().toISOString(),
        parameters: {
          minRetracement,
          maxRetracement,
          requirePocConfluence,
          limit
        },
        description: `Scanned ${result.totalScanned} coins for fibonacci retracements between ${minRetracement}% and ${maxRetracement}% (min volume: $${minVolume.toLocaleString()})${requirePocConfluence ? ' with POC confluence' : ''}`,
        targetLevels: '0.618 - 0.66 fibonacci levels (Golden Ratio zone)',
        strategy: 'Bidding retrace on pumped/dumped coins at 0.618-0.66 fib with POC confluence'
      }
    };

    console.log(`✅ Fibonacci scan completed: ${result.filteredCount}/${result.totalScanned} coins found in ${result.scanTime}ms`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in fibonacci scanner:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        { error: 'Symbol is required and must be a string' },
        { status: 400 }
      );
    }

    console.log(`🔍 Getting detailed fibonacci analysis for ${symbol}`);

    const fibService = new FibonacciService();
    const analysis = await fibService.getDetailedFibonacciAnalysis(symbol.toUpperCase());

    if (!analysis) {
      return NextResponse.json(
        { 
          error: 'Analysis not available',
          message: `Could not generate fibonacci analysis for ${symbol}. This could be due to insufficient data, no significant swings, or symbol not found.`,
          symbol: symbol.toUpperCase()
        },
        { status: 404 }
      );
    }

    // Add additional context for the detailed analysis
    const response = {
      analysis,
      metadata: {
        analysisCompleted: new Date().toISOString(),
        symbol: symbol.toUpperCase(),
        interpretation: {
          trend: analysis.trend === 'bullish' ? 'Bullish retracement (price retracing up from low)' : 'Bearish retracement (price retracing down from high)',
          retracement: `${analysis.retracePercent.toFixed(1)}% retraced from swing`,
          targetZone: '0.618-0.66 fibonacci levels (Golden Ratio zone)',
          pocConfluence: analysis.confluence ? 'POC aligns with fibonacci levels (HIGH PROBABILITY)' : 'No POC confluence detected',
          quality: analysis.quality.toUpperCase(),
          recommendation: analysis.confluence && analysis.quality === 'high' ? 
            'HIGH PROBABILITY SETUP - Monitor for entry' : 
            analysis.confluence ? 'MEDIUM PROBABILITY - Wait for confirmation' : 'LOW PROBABILITY - Consider other setups'
        }
      }
    };

    console.log(`✅ Detailed analysis completed for ${symbol}: ${analysis.quality} quality, ${analysis.confluence ? 'with' : 'without'} POC confluence`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in detailed fibonacci analysis:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 