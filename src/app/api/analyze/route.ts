import { NextRequest, NextResponse } from 'next/server';
import { BybitService } from '@/lib/bybit-service';

const bybitService = new BybitService();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('Starting Bybit analysis...');
    const result = await bybitService.runCompleteAnalysis(limit);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limit = 10, symbols = [], interval = '4h' } = body;

    console.log('Starting custom Bybit analysis...', 'interval:', interval);
    
    // If specific symbols are requested, we could add custom logic here
    const result = await bybitService.runCompleteAnalysis(limit, interval);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Custom analysis error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 