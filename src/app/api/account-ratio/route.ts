import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const period = searchParams.get('period') || '1h';
    const limit = searchParams.get('limit') || '1';
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Build query parameters
    const params = new URLSearchParams({
      category: 'linear',
      symbol,
      period,
      limit,
    });

    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);

    // Add timeout to prevent Vercel function timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const bybitUrl = `https://api.bybit.com/v5/market/account-ratio?${params.toString()}`;
    
    const response = await fetch(bybitUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Bybit Account Ratio API error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ 
        error: 'Failed to fetch account ratio from Bybit',
        status: response.status 
      }, { status: response.status });
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      console.error(`Bybit Account Ratio API retCode error: ${data.retMsg}`);
      return NextResponse.json({ 
        error: `Bybit API Error: ${data.retMsg}`,
        retCode: data.retCode 
      }, { status: 400 });
    }

    // Return the account ratio data
    return NextResponse.json({
      success: true,
      data: data.result || null,
      symbol
    });

  } catch (error: any) {
    console.error('Account Ratio API Error:', error);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Request timeout - Bybit API took too long to respond' 
      }, { status: 408 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
} 