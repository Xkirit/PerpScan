import axios from 'axios';
import { BybitTicker, KlineData, CoinAnalysis, BybitAPIResponse, AnalysisResult } from '@/types';

export class BybitService {
  private baseUrl = 'https://api.bybit.com';
  private excludedStableCoins = ['USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];
  
  private getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryRequest<T>(requestFn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms delay`);
          await this.delay(delayMs);
        }
        
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : error);
        
        if (axios.isAxiosError(error)) {
          // Don't retry on certain error codes
          if (error.response?.status === 404 || error.response?.status === 401) {
            throw error;
          }
        }
      }
    }
    
    throw lastError!;
  }
  
  async getPerpetualFuturesTickers(): Promise<BybitTicker[]> {
    return this.retryRequest(async () => {
      try {
        const response = await axios.get<BybitAPIResponse<BybitTicker>>(
          `${this.baseUrl}/v5/market/tickers`,
          {
            params: {
              category: 'linear'
            },
            timeout: 30000,
            headers: this.getHeaders()
          }
        );

        // Check if response is valid JSON and has expected structure
        if (!response.data || typeof response.data !== 'object') {
          throw new Error('Invalid response format from Bybit API');
        }

        if (response.data.retCode !== 0) {
          throw new Error(`API Error: ${response.data.retMsg}`);
        }

        return response.data.result?.list || [];
      } catch (error) {
        console.error('Error fetching tickers:', error);
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout - Bybit API is not responding');
          }
          if (error.response && error.response.status === 429) {
            throw new Error('Rate limit exceeded - please try again later');
          }
          if (error.response && error.response.status === 403) {
            throw new Error('Access denied - API may be blocking requests from this server');
          }
          if (error.response && error.response.status >= 500) {
            throw new Error('Bybit API server error - please try again later');
          }
        }
        throw error;
      }
    });
  }

  async getKlineData(symbol: string, interval: string = '1', limit: number = 240): Promise<KlineData[]> {
    return this.retryRequest(async () => {
      try {
        const response = await axios.get<BybitAPIResponse<string[]>>(
          `${this.baseUrl}/v5/market/kline`,
          {
            params: {
              category: 'linear',
              symbol,
              interval,
              limit
            },
            timeout: 30000,
            headers: this.getHeaders()
          }
        );

        // Check if response is valid JSON and has expected structure
        if (!response.data || typeof response.data !== 'object') {
          console.error(`Invalid response format for ${symbol}`);
          return [];
        }

        if (response.data.retCode !== 0) {
          console.error(`API Error for ${symbol}: ${response.data.retMsg}`);
          return [];
        }

        // Convert string array to KlineData objects
        return (response.data.result?.list || []).map(candle => ({
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5]
        }));
      } catch (error) {
        console.error(`Error fetching kline data for ${symbol}:`, error);
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            console.error(`Timeout fetching data for ${symbol}`);
          }
          if (error.response && error.response.status === 429) {
            console.error(`Rate limit exceeded for ${symbol}`);
          }
          if (error.response && error.response.status === 403) {
            console.error(`Access denied for ${symbol} - API may be blocking requests`);
          }
        }
        return [];
      }
    }, 2); // Fewer retries for kline data
  }

  calculate4hMetrics(klineData: KlineData[]): { priceChange4h: number; volumeChange4h: number } {
    if (klineData.length < 240) {
      return { priceChange4h: 0, volumeChange4h: 0 };
    }

    // Sort by timestamp (oldest first)
    const sortedData = [...klineData].sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));

    // Get prices from 4 hours ago and current
    const price4hAgo = parseFloat(sortedData[0].open);
    const currentPrice = parseFloat(sortedData[sortedData.length - 1].close);

    // Calculate price change percentage
    const priceChange4h = ((currentPrice - price4hAgo) / price4hAgo) * 100;

    // Calculate volume change (first 2 hours vs last 2 hours)
    const midPoint = Math.floor(sortedData.length / 2);
    const volumeFirst2h = sortedData.slice(0, midPoint)
      .reduce((sum, candle) => sum + parseFloat(candle.volume), 0);
    const volumeLast2h = sortedData.slice(midPoint)
      .reduce((sum, candle) => sum + parseFloat(candle.volume), 0);

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

  calculate1dMetrics(klineData: KlineData[]): { priceChange1d: number; volumeChange1d: number } {
    if (klineData.length < 2) {
      return { priceChange1d: 0, volumeChange1d: 0 };
    }
    // Sort by timestamp (oldest first)
    const sortedData = [...klineData].sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
    const price1dAgo = parseFloat(sortedData[0].open);
    const currentPrice = parseFloat(sortedData[sortedData.length - 1].close);
    const priceChange1d = ((currentPrice - price1dAgo) / price1dAgo) * 100;
    const volume1d = sortedData.reduce((sum, candle) => sum + parseFloat(candle.volume), 0);
    const volumePrev = sortedData.slice(0, -1).reduce((sum, candle) => sum + parseFloat(candle.volume), 0);
    const volumeChange1d = volumePrev > 0 ? ((volume1d - volumePrev) / volumePrev) * 100 : 0;
    return { priceChange1d, volumeChange1d };
  }

  async analyzeCoins(interval: '4h' | '1d' = '4h'): Promise<CoinAnalysis[]> {
    console.log('Starting coin analysis for interval:', interval);
    const tickers = await this.getPerpetualFuturesTickers();
    if (!tickers.length) {
      throw new Error('No ticker data available');
    }
    const filteredTickers = tickers
      .filter(ticker => {
        const symbol = ticker.symbol;
        return symbol.endsWith('USDT') && 
               !this.excludedStableCoins.some(stable => symbol.includes(stable)) &&
               parseFloat(ticker.volume24h) > 0;
      })
      .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
      .slice(0, 150);
    console.log(`Analyzing top ${filteredTickers.length} coins by volume...`);
    const coinAnalyses: CoinAnalysis[] = [];
    let processed = 0;
    const batchSize = 10;
    for (let i = 0; i < filteredTickers.length; i += batchSize) {
      const batch = filteredTickers.slice(i, i + batchSize);
      const batchPromises = batch.map(async (ticker) => {
        try {
          const symbol = ticker.symbol;
          let klineData;
          if (interval === '1d') {
            klineData = await this.getKlineData(symbol, 'D', 2);
          } else {
            klineData = await this.getKlineData(symbol);
          }
          if (!klineData.length) {
            return null;
          }
          if (interval === '1d') {
            const { priceChange1d, volumeChange1d } = this.calculate1dMetrics(klineData);
            return {
              symbol,
              priceChange24h: parseFloat(ticker.price24hPcnt) * 100,
              volume24h: parseFloat(ticker.volume24h),
              priceChange4h: 0,
              volumeChange4h: 0,
              priceChange1d,
              volumeChange1d,
              currentPrice: parseFloat(ticker.lastPrice),
              trendScore: priceChange1d // For 1d, use priceChange1d as trendScore
            };
          } else {
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
          }
        } catch (error) {
          console.error(`Error analyzing ${ticker.symbol}:`, error);
          return null;
        }
      });
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        if (result) {
          coinAnalyses.push(result);
          processed++;
        }
      });
      console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filteredTickers.length/batchSize)} - ${processed} coins completed`);
      if (i + batchSize < filteredTickers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    console.log(`Analysis completed: ${processed} coins analyzed`);
    return coinAnalyses;
  }

  getTopPerformers(analyses: CoinAnalysis[], limit: number = 10, interval: '4h' | '1d' = '4h'): AnalysisResult {
    let trending, strongest, weakest;
    if (interval === '1d') {
      trending = [...analyses]
        .sort((a, b) => b.priceChange1d - a.priceChange1d)
        .slice(0, limit)
        .map((coin, index) => ({ ...coin, rank: index + 1 }));
      strongest = trending;
      weakest = [...analyses]
        .sort((a, b) => a.priceChange1d - b.priceChange1d)
        .slice(0, limit)
        .map((coin, index) => ({ ...coin, rank: index + 1 }));
    } else {
      trending = [...analyses]
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, limit)
        .map((coin, index) => ({ ...coin, rank: index + 1 }));
      strongest = [...analyses]
        .sort((a, b) => b.priceChange4h - a.priceChange4h)
        .slice(0, limit)
        .map((coin, index) => ({ ...coin, rank: index + 1 }));
      weakest = [...analyses]
        .sort((a, b) => a.priceChange4h - b.priceChange4h)
        .slice(0, limit)
        .map((coin, index) => ({ ...coin, rank: index + 1 }));
    }
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