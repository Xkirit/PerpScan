// Centralized API service to eliminate duplicate Bybit API calls
import crypto from 'crypto';

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

  // Generate Bybit API signature for authenticated requests
  private generateSignature(params: string, timestamp: string, apiSecret: string): string {
    const hmac = crypto.createHmac('sha256', apiSecret);
    hmac.update(timestamp + process.env.BYBIT_API_KEY + '5000' + params);
    return hmac.digest('hex');
  }

  // Create authenticated headers for Bybit API
  private createAuthHeaders(params: string = ''): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
    };

    // Add authentication if API credentials are available
    if (process.env.BYBIT_API_KEY && process.env.BYBIT_API_SECRET) {
      const timestamp = Date.now().toString();
      const signature = this.generateSignature(params, timestamp, process.env.BYBIT_API_SECRET);
      
      headers['X-BAPI-API-KEY'] = process.env.BYBIT_API_KEY;
      headers['X-BAPI-SIGN'] = signature;
      headers['X-BAPI-TIMESTAMP'] = timestamp;
      headers['X-BAPI-RECV-WINDOW'] = '5000';
    }

    return headers;
  }

  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    // Extract query parameters for signature generation
    const urlObj = new URL(url);
    const params = urlObj.search.substring(1); // Remove the '?' prefix
    
    const headers = this.createAuthHeaders(params);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Consolidated tickers endpoint - used by multiple components
  async getTickers(useCache: boolean = true): Promise<BybitTickerData[]> {
    const cacheKey = this.getCacheKey('/api/tickers', {});
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached, this.CACHE_DURATION.TICKERS)) {
        return cached.data;
      }
    }

    try {
      // Use internal API route instead of direct external call to avoid CORS issues on Vercel
      const url = '/api/tickers';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(`API Error: ${data.error || 'Unknown error'}`);
      }

      const tickers = data.data || [];
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
      symbol,
      interval,
      limit,
    };

    if (startTime) params.start = startTime;
    if (endTime) params.end = endTime;

    const cacheKey = this.getCacheKey('/api/kline', params);
    
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

      // Use internal API route instead of direct external call to avoid CORS issues on Vercel
      const url = `/api/kline?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(`API Error: ${data.error || 'Unknown error'}`);
      }

      const klineData = data.data || [];
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
      symbol,
      period,
      limit,
    };

    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const cacheKey = this.getCacheKey('/api/account-ratio', params);
    
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

      // Use internal API route instead of direct external call to avoid CORS issues on Vercel
      const url = `/api/account-ratio?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        this.setCache(cacheKey, null);
        return null;
      }

      const data = await response.json();

      if (!data.success || !data.data?.list?.length) {
        this.setCache(cacheKey, null);
        return null;
      }

      const latestData = data.data.list[0];
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