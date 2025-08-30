import { BybitTicker, CoinAnalysis, AnalysisResult } from '@/types';
import { apiService } from '@/lib/api-service';

interface BybitTickerResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: BybitTicker[];
  };
}

interface KlineResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: string[][];
  };
}

export class BybitClientService {
  private baseUrl = 'https://api.bybit.com';
  private excludedStableCoins = ['USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getPerpetualFuturesTickers(): Promise<BybitTicker[]> {
    try {
      const tickers = await apiService.getTickers(false); // Don't use cache for client-side analysis
      // Map the API response to match expected interface
      return (tickers || []).map(ticker => ({
        symbol: ticker.symbol,
        lastPrice: ticker.lastPrice,
        priceChangePercent24h: ticker.price24hPcnt,
        price24hPcnt: ticker.price24hPcnt, // Required field
        volume24h: ticker.volume24h,
        turnover24h: ticker.turnover24h,
        openInterest: ticker.openInterest || '0',
        openInterestValue: ticker.openInterestValue || '0',
        fundingRate: ticker.fundingRate || '0',
        highPrice24h: '0', // Not available in current API
        lowPrice24h: '0'   // Not available in current API
      }));
    } catch (error) {
      //console.error('Client-side error fetching tickers:', error);
      throw error;
    }
  }

  async getKlineData(symbol: string, interval: string = '1', limit: number = 240): Promise<string[][]> {
    try {
      const klineData = await apiService.getKlineData(symbol, interval, limit, undefined, undefined, false); // Don't use cache for client-side analysis
      return klineData || [];
    } catch (error) {
      //console.error(`Error fetching kline data for ${symbol}:`, error);
      return [];
    }
  }

  calculate4hMetrics(klineData: string[][]): { priceChange4h: number; volumeChange4h: number } {
    if (klineData.length < 240) {
      return { priceChange4h: 0, volumeChange4h: 0 };
    }

    // Sort by timestamp (oldest first)
    const sortedData = [...klineData].sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

    // Get prices from 4 hours ago and current
    const price4hAgo = parseFloat(sortedData[0][1]); // open price
    const currentPrice = parseFloat(sortedData[sortedData.length - 1][4]); // close price

    // Calculate price change percentage
    const priceChange4h = ((currentPrice - price4hAgo) / price4hAgo) * 100;

    // Calculate volume change (first 2 hours vs last 2 hours)
    const midPoint = Math.floor(sortedData.length / 2);
    const volumeFirst2h = sortedData.slice(0, midPoint)
      .reduce((sum, candle) => sum + parseFloat(candle[5]), 0);
    const volumeLast2h = sortedData.slice(midPoint)
      .reduce((sum, candle) => sum + parseFloat(candle[5]), 0);

    const volumeChange4h = volumeFirst2h > 0 
      ? ((volumeLast2h - volumeFirst2h) / volumeFirst2h) * 100 
      : 0;

    return { priceChange4h, volumeChange4h };
  }

  calculateTrendScore(
    ticker: BybitTicker, 
    priceChange4h: number, 
    volumeChange4h: number
  ): number {
    const priceChange24h = parseFloat(ticker.price24hPcnt) * 100;

    // Weighted scoring system
    const priceWeight = 0.4;
    const volumeWeight = 0.3;
    const momentumWeight = 0.3;

    // Price score (4h change is more important for recent trends)
    const priceScore = (priceChange4h * 0.7) + (priceChange24h * 0.3);

    // Volume score (positive volume change indicates interest)
    const volumeScore = Math.min(volumeChange4h / 10, 10);

    // Momentum score (combination of recent vs 24h performance)
    const momentumScore = priceChange4h - (priceChange24h * 0.5);

    const trendScore = (priceScore * priceWeight) + 
                      (volumeScore * volumeWeight) + 
                      (momentumScore * momentumWeight);

    return Math.round(trendScore * 100) / 100;
  }

  async analyzeCoins(interval: '4h' | '1d' = '4h'): Promise<CoinAnalysis[]> {
    // console.log('Starting client-side coin analysis for interval:', interval);
    
    const tickers = await this.getPerpetualFuturesTickers();
    if (!tickers.length) {
      throw new Error('No ticker data available from client-side API');
    }

    const filteredTickers = tickers
      .filter(ticker => {
        const symbol = ticker.symbol;
        return symbol.endsWith('USDT') && 
               !this.excludedStableCoins.some(stable => symbol.includes(stable)) &&
               parseFloat(ticker.volume24h) > 0;
      })
      .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
      .slice(0, 50); // Limit to 50 for faster client-side processing

    // console.log(`Analyzing top ${filteredTickers.length} coins by volume for ${interval} interval (client-side)...`);
    
    const coinAnalyses: CoinAnalysis[] = [];
    const batchSize = 5; // Smaller batches for client-side

    for (let i = 0; i < filteredTickers.length; i += batchSize) {
      const batch = filteredTickers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (ticker) => {
        try {
          const symbol = ticker.symbol;
          
          // Get kline data based on interval
          let klineData: string[][];
          let priceChange4h = 0;
          let volumeChange4h = 0;
          let priceChange1d = 0;
          let volumeChange1d = 0;
          
          if (interval === '4h') {
            // For 4h analysis, get 1-minute data for 4 hours
            klineData = await this.getKlineData(symbol, '1', 240);
            if (klineData.length) {
              const metrics = this.calculate4hMetrics(klineData);
              priceChange4h = metrics.priceChange4h;
              volumeChange4h = metrics.volumeChange4h;
            }
            // Use 24h data from ticker for 1d values
            priceChange1d = parseFloat(ticker.price24hPcnt) * 100;
          } else {
            // For 1d analysis, use the 24h data from ticker
            priceChange1d = parseFloat(ticker.price24hPcnt) * 100;
            
            // For 4h data, get hourly data for last 4 hours
            klineData = await this.getKlineData(symbol, '60', 4);
            if (klineData.length >= 2) {
              const sortedData = [...klineData].sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
              const priceStart = parseFloat(sortedData[0][1]);
              const priceEnd = parseFloat(sortedData[sortedData.length - 1][4]);
              priceChange4h = ((priceEnd - priceStart) / priceStart) * 100;
            }
          }
          
          const trendScore = this.calculateTrendScore(ticker, priceChange4h, volumeChange4h);
          
          return {
            symbol,
            priceChange24h: parseFloat(ticker.price24hPcnt) * 100,
            volume24h: parseFloat(ticker.volume24h),
            priceChange4h,
            volumeChange4h,
            priceChange1d,
            volumeChange1d,
            currentPrice: parseFloat(ticker.lastPrice),
            trendScore
          };
        } catch (error) {
          //console.error(`Error analyzing ${ticker.symbol} (client-side):`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        if (result) {
          coinAnalyses.push(result);
        }
      });

      // Smaller delay for client-side processing
      if (i + batchSize < filteredTickers.length) {
        await this.delay(200);
      }
    }

    // console.log(`Client-side analysis completed: ${coinAnalyses.length} coins analyzed`);
    return coinAnalyses;
  }

  getTopPerformers(analyses: CoinAnalysis[], limit: number = 10, interval: '4h' | '1d' = '4h'): AnalysisResult {
    const trending = [...analyses]
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    // Sort by the appropriate price change field based on interval
    const priceChangeField = interval === '4h' ? 'priceChange4h' : 'priceChange24h';
    
    const strongest = [...analyses]
      .sort((a, b) => b[priceChangeField] - a[priceChangeField])
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    const weakest = [...analyses]
      .sort((a, b) => a[priceChangeField] - b[priceChangeField])
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    return {
      trending,
      strongest,
      weakest,
      timestamp: new Date().toISOString(),
      totalCoins: analyses.length
    };
  }

  async runCompleteAnalysis(limit: number = 10, interval: '4h' | '1d' = '4h'): Promise<AnalysisResult> {
    const analyses = await this.analyzeCoins(interval);
    return this.getTopPerformers(analyses, limit, interval);
  }
} 