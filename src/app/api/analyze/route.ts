import { NextRequest, NextResponse } from 'next/server';
import { BybitService } from '@/lib/bybit-service';

const bybitService = new BybitService();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // console.log('Starting Bybit analysis...');
    const result = await bybitService.runCompleteAnalysis(limit);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    //console.error('Analysis error:', error);
    
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
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      //console.error('Invalid JSON in request body:', jsonError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body'
        },
        { status: 400 }
      );
    }

    const { limit = 10, interval = '4h' } = body;

    // console.log('Starting custom Bybit analysis...', 'interval:', interval);
    
    const result = await bybitService.runCompleteAnalysis(limit, interval);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    //console.error('Custom analysis error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 