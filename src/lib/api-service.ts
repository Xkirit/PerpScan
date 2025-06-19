// Centralized API service to eliminate duplicate Bybit API calls
interface BybitTickerData {
  symbol: string;
  lastPrice: string;
  price24hPcnt: string;
  volume24h: string;
  turnover24h: string;
  openInterest: string;
  openInterestValue: string;
  fundingRate: string;
  [key: string]: any;
}

interface BybitTickersResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: BybitTickerData[];
  };
}

interface BybitKlineResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: string[][];
  };
}

interface BybitAccountRatioResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: Array<{
      symbol: string;
      buyRatio: string;
      sellRatio: string;
      timestamp: string;
    }>;
  };
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

class APIService {
  private baseUrl = 'https://api.bybit.com';
  private cache = new Map<string, CachedData<any>>();
  private readonly ALLORIGINS_PROXY = 'https://api.allorigins.win/get?url=';
  private readonly CACHE_DURATION = {
    TICKERS: 30 * 1000, // 30 seconds for tickers (high frequency)
    KLINE: 60 * 1000, // 1 minute for kline data
    ACCOUNT_RATIO: 5 * 60 * 1000, // 5 minutes for account ratio
    OI_HISTORY: 5 * 60 * 1000, // 5 minutes for OI history
  };

  private getCacheKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }

  private isCacheValid<T>(cached: CachedData<T> | undefined, duration: number): cached is CachedData<T> {
    if (!cached) return false;
    return Date.now() - cached.timestamp < duration;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    // 🔄 ATTEMPT 1: Direct API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      console.log(`📡 Direct API call: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
        },
        signal: controller.signal,
        cache: 'no-cache',
        ...options,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Direct API success`);
        return data;
      }

      console.log(`⚠️ Direct API failed: ${response.status} - ${response.statusText}`);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.log(`⚠️ Direct API error:`, error.message);
    }

    // 🔄 ATTEMPT 2: Allorigins Proxy Fallback
    try {
      console.log(`🌐 Fallback to Allorigins proxy...`);
      
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `${this.ALLORIGINS_PROXY}${encodedUrl}`;
      
      const proxyController = new AbortController();
      const proxyTimeoutId = setTimeout(() => proxyController.abort(), 15000); // 15 second timeout for proxy

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
        },
        signal: proxyController.signal,
        ...options,
      });

      clearTimeout(proxyTimeoutId);

      if (!response.ok) {
        throw new Error(`Allorigins proxy failed: ${response.status} - ${response.statusText}`);
      }

      const proxyData = await response.json();
      
      if (!proxyData.contents) {
        throw new Error('Invalid response from Allorigins proxy');
      }

      console.log(`✅ Allorigins proxy success`);
      return JSON.parse(proxyData.contents);

    } catch (proxyError: any) {
      console.log(`❌ Allorigins proxy failed:`, proxyError.message);
      throw new Error(`Both direct API and proxy failed: ${proxyError.message}`);
    }
  }

  // Consolidated tickers endpoint - used by multiple components
  async getTickers(useCache: boolean = true): Promise<BybitTickerData[]> {
    const cacheKey = this.getCacheKey('/v5/market/tickers', { category: 'linear' });
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached, this.CACHE_DURATION.TICKERS)) {
        return cached.data;
      }
    }

    try {
      const url = `${this.baseUrl}/v5/market/tickers?category=linear`;
      const response = await this.makeRequest<BybitTickersResponse>(url);

      if (response.retCode !== 0) {
        throw new Error(`API Error: ${response.retMsg}`);
      }

      const tickers = response.result?.list || [];
      this.setCache(cacheKey, tickers);
      return tickers;
    } catch (error) {
      // If cache exists, return cached data as fallback
      const cached = this.cache.get(cacheKey);
      if (cached?.data) {
        console.warn('Using cached tickers data due to API error:', error);
        return cached.data;
      }
      throw error;
    }
  }

  // Consolidated kline endpoint - used by multiple components for price history
  async getKlineData(
    symbol: string,
    interval: string = '60',
    limit: number = 24,
    startTime?: number,
    endTime?: number,
    useCache: boolean = true
  ): Promise<string[][]> {
    const params: Record<string, any> = {
      category: 'linear',
      symbol,
      interval,
      limit,
    };

    if (startTime) params.start = startTime;
    if (endTime) params.end = endTime;

    const cacheKey = this.getCacheKey('/v5/market/kline', params);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached, this.CACHE_DURATION.KLINE)) {
        return cached.data;
      }
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value.toString());
      });

      const url = `${this.baseUrl}/v5/market/kline?${queryParams.toString()}`;
      const response = await this.makeRequest<BybitKlineResponse>(url);

      if (response.retCode !== 0) {
        throw new Error(`API Error: ${response.retMsg}`);
      }

      const klineData = response.result?.list || [];
      this.setCache(cacheKey, klineData);
      return klineData;
    } catch (error) {
      // If cache exists, return cached data as fallback
      const cached = this.cache.get(cacheKey);
      if (cached?.data) {
        console.warn(`Using cached kline data for ${symbol} due to API error:`, error);
        return cached.data;
      }
      return []; // Return empty array instead of throwing for kline data
    }
  }

  // Consolidated account ratio endpoint - used by InstitutionalActivity
  async getAccountRatio(
    symbol: string,
    period: string = '1h',
    limit: number = 1,
    startTime?: number,
    endTime?: number,
    useCache: boolean = true
  ): Promise<{
    buyRatio: number;
    sellRatio: number;
    bias: 'bullish' | 'bearish' | 'neutral';
    biasStrength: 'weak' | 'moderate' | 'strong';
    timestamp: number;
    source: 'bybit';
  } | null> {
    const params: Record<string, any> = {
      category: 'linear',
      symbol,
      period,
      limit,
    };

    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const cacheKey = this.getCacheKey('/v5/market/account-ratio', params);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached, this.CACHE_DURATION.ACCOUNT_RATIO)) {
        return cached.data;
      }
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value.toString());
      });

      const url = `${this.baseUrl}/v5/market/account-ratio?${queryParams.toString()}`;
      const response = await this.makeRequest<BybitAccountRatioResponse>(url);

      if (response.retCode !== 0 || !response.result?.list?.length) {
        this.setCache(cacheKey, null);
        return null;
      }

      const latestData = response.result.list[0];
      const buyRatio = parseFloat(latestData.buyRatio);
      const sellRatio = parseFloat(latestData.sellRatio);

      // Calculate directional bias
      const ratioDiff = buyRatio - sellRatio;
      let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let biasStrength: 'weak' | 'moderate' | 'strong' = 'weak';

      if (Math.abs(ratioDiff) > 0.15) {
        biasStrength = 'strong';
      } else if (Math.abs(ratioDiff) > 0.08) {
        biasStrength = 'moderate';
      }

      if (buyRatio > 0.55) {
        bias = 'bullish';
      } else if (sellRatio > 0.55) {
        bias = 'bearish';
      }

      const result = {
        buyRatio,
        sellRatio,
        bias,
        biasStrength,
        timestamp: parseInt(latestData.timestamp),
        source: 'bybit' as const,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      // If cache exists, return cached data as fallback
      const cached = this.cache.get(cacheKey);
      if (cached?.data !== undefined) {
        console.warn(`Using cached account ratio for ${symbol} due to API error:`, error);
        return cached.data;
      }
      return null; // Return null instead of throwing
    }
  }

  // Helper method to get filtered USDT tickers (commonly used)
  async getUSDTTickers(minOIValue: number = 1000000, useCache: boolean = true): Promise<BybitTickerData[]> {
    const allTickers = await this.getTickers(useCache);
    return allTickers
      .filter(ticker => 
        ticker.symbol.endsWith('USDT') && 
        parseFloat(ticker.openInterestValue || '0') > minOIValue
      )
      .sort((a, b) => parseFloat(b.openInterestValue || '0') - parseFloat(a.openInterestValue || '0'));
  }

  // Helper method to get BTC price change (commonly used)
  async getBTCPriceChange(
    interval: '4h' | '1d',
    useCache: boolean = true
  ): Promise<number> {
    const bybitInterval = interval === '1d' ? 'D' : '60';
    const points = interval === '1d' ? 30 : 24;
    
    const endTime = Date.now();
    const startTime = endTime - (points * (interval === '1d' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));

    const klineData = await this.getKlineData('BTCUSDT', bybitInterval, points, startTime, endTime, useCache);
    
    if (klineData.length === 0) return 0;

    const sortedData = klineData.reverse(); // Chronological order
    if (sortedData.length === 0) return 0;

    const basePrice = parseFloat(sortedData[0][4]); // First close price
    const lastPrice = parseFloat(sortedData[sortedData.length - 1][4]); // Last close price
    
    if (basePrice === 0) return 0;
    
    return ((lastPrice - basePrice) / basePrice) * 100;
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService; 