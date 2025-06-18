import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface KlineData {
  startTime: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  turnover: string;
}

interface HistoricalDataPoint {
  timestamp: number;
  time: string;
  [symbol: string]: number | string;
}

export async function POST(request: NextRequest) {
  try {
    const { symbols, interval = '4h' } = await request.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: 'Symbols array is required' }, { status: 400 });
    }

    // Determine Bybit interval and number of points
    let bybitInterval = '60'; // 1 hour
    let points = 24; // 24 hours
    if (interval === 'D') {
      bybitInterval = 'D';
      points = 30; // 30 days
    }

    // console.log('Fetching historical data for symbols:', symbols, 'interval:', interval);

    // Calculate timestamp for the required period
    const endTime = Date.now();
    const startTime = endTime - (points * (interval === 'D' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));

    // Fetch historical data for each symbol
    const historicalPromises = symbols.map(async (symbol: string) => {
      try {
        const response = await axios.get('https://api.bybit.com/v5/market/kline', {
          params: {
            category: 'linear',
            symbol: symbol,
            interval: bybitInterval,
            start: startTime,
            end: endTime,
            limit: points
          }
        });

        const klineData: KlineData[] = response.data.result.list.map((item: string[]) => ({
          startTime: item[0],
          openPrice: item[1],
          highPrice: item[2],
          lowPrice: item[3],
          closePrice: item[4],
          volume: item[5],
          turnover: item[6]
        }));

        // Sort to get chronological order
        const sortedData = klineData.reverse();
        
        // Calculate percentage changes from the first price
        const basePrice = parseFloat(sortedData[0]?.closePrice || '0');
        
        const percentageData = sortedData.map(point => ({
          timestamp: parseInt(point.startTime),
          percentage: basePrice > 0 ? ((parseFloat(point.closePrice) - basePrice) / basePrice) * 100 : 0
        }));

        return {
          symbol,
          data: percentageData
        };
      } catch (error) {
        //console.error(`Error fetching data for ${symbol}:`, error);
        return {
          symbol,
          data: []
        };
      }
    });

    const allHistoricalData = await Promise.all(historicalPromises);

    // Transform data into the format needed for the chart
    const timePoints = new Set<number>();
    allHistoricalData.forEach(({ data }) => {
      data.forEach((point) => {
        timePoints.add(point.timestamp);
      });
    });

    const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);

    const chartData: HistoricalDataPoint[] = sortedTimePoints.map(timestamp => {
      const dataPoint: HistoricalDataPoint = {
        timestamp,
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      };

      // Add percentage change data for each symbol at this timestamp
      allHistoricalData.forEach(({ symbol, data }) => {
        const pointAtTime = data.find(d => d.timestamp === timestamp);
        if (pointAtTime) {
          dataPoint[symbol] = pointAtTime.percentage;
        }
      });

      return dataPoint;
    });

    // console.log('Historical data processed:', {
    //   symbols: symbols.length,
    //   timePoints: chartData.length,
    //   samplePoint: chartData[0]
    // });

    return NextResponse.json(chartData);

  } catch (error) {
    // //console.error('Error in historical API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
} 