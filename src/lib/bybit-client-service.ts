import { BybitTicker, CoinAnalysis, AnalysisResult } from '@/types';

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
      const response = await fetch(`${this.baseUrl}/v5/market/tickers?category=linear`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BybitTickerResponse = await response.json();

      if (data.retCode !== 0) {
        throw new Error(`API Error: ${data.retMsg}`);
      }

      return data.result?.list || [];
    } catch (error) {
      console.error('Client-side error fetching tickers:', error);
      throw error;
    }
  }

  async getKlineData(symbol: string, interval: string = '1', limit: number = 240): Promise<string[][]> {
    try {
      const url = `${this.baseUrl}/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        console.error(`Failed to fetch kline for ${symbol}: ${response.status}`);
        return [];
      }

      const data: KlineResponse = await response.json();

      if (data.retCode !== 0) {
        console.error(`API Error for ${symbol}: ${data.retMsg}`);
        return [];
      }

      return data.result?.list || [];
    } catch (error) {
      console.error(`Error fetching kline data for ${symbol}:`, error);
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
    console.log('Starting client-side coin analysis for interval:', interval);
    
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

    console.log(`Analyzing top ${filteredTickers.length} coins by volume (client-side)...`);
    
    const coinAnalyses: CoinAnalysis[] = [];
    const batchSize = 5; // Smaller batches for client-side

    for (let i = 0; i < filteredTickers.length; i += batchSize) {
      const batch = filteredTickers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (ticker) => {
        try {
          const symbol = ticker.symbol;
          const klineData = await this.getKlineData(symbol);
          
          if (!klineData.length) {
            return null;
          }

          const { priceChange4h, volumeChange4h } = this.calculate4hMetrics(klineData);
          const trendScore = this.calculateTrendScore(ticker, priceChange4h, volumeChange4h);
          
          return {
            symbol,
            priceChange24h: parseFloat(ticker.price24hPcnt) * 100,
            volume24h: parseFloat(ticker.volume24h),
            priceChange4h,
            volumeChange4h,
            priceChange1d: 0,
            volumeChange1d: 0,
            currentPrice: parseFloat(ticker.lastPrice),
            trendScore
          };
        } catch (error) {
          console.error(`Error analyzing ${ticker.symbol} (client-side):`, error);
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

    console.log(`Client-side analysis completed: ${coinAnalyses.length} coins analyzed`);
    return coinAnalyses;
  }

  getTopPerformers(analyses: CoinAnalysis[], limit: number = 10): AnalysisResult {
    const trending = [...analyses]
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    const strongest = [...analyses]
      .sort((a, b) => b.priceChange4h - a.priceChange4h)
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    const weakest = [...analyses]
      .sort((a, b) => a.priceChange4h - b.priceChange4h)
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

  async runCompleteAnalysis(limit: number = 10): Promise<AnalysisResult> {
    const analyses = await this.analyzeCoins('4h');
    return this.getTopPerformers(analyses, limit);
  }
} 