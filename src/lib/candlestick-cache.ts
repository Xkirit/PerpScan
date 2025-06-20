import { Redis } from '@upstash/redis';

interface CandlestickPattern {
  symbol: string;
  type: 'bullish' | 'bearish';
  currentCandle: {
    open: number;
    close: number;
    high: number;
    low: number;
    timestamp: number;
  };
  previousCandle: {
    open: number;
    close: number;
    high: number;
    low: number;
    timestamp: number;
  };
  bodyRatio: number;
  detectedAt: number; // Unix timestamp when pattern was detected
}

interface CandlestickScreenerResult {
  '1h': CandlestickPattern[];
  '4h': CandlestickPattern[];
  '1d': CandlestickPattern[];
  timestamp: string;
  totalScanned: number;
  nextUpdate: {
    '1h': number; // Unix timestamp of next 1h update
    '4h': number; // Unix timestamp of next 4h update  
    '1d': number; // Unix timestamp of next 1d update
  };
}

// Upstash Redis client singleton for candlestick data
let candlestickRedisClient: Redis | null = null;

function getCandlestickRedisClient(): Redis {
  if (candlestickRedisClient) {
    return candlestickRedisClient;
  }

  const upstashUrl = process.env.KV_REST_API_URL;
  const upstashToken = process.env.KV_REST_API_TOKEN;
  
  if (!upstashUrl || !upstashToken) {
    throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables');
  }

  candlestickRedisClient = new Redis({
    url: upstashUrl,
    token: upstashToken,
  });

  return candlestickRedisClient;
}

// Redis keys for different timeframes
const CANDLESTICK_KEYS = {
  '1h': 'candlestick:patterns:1h',
  '4h': 'candlestick:patterns:4h', 
  '1d': 'candlestick:patterns:1d',
  metadata: 'candlestick:metadata',
  lastUpdate: 'candlestick:last_update'
};

// TTL for different timeframes (in seconds)
const CANDLESTICK_TTL = {
  '1h': 65 * 60,      // 65 minutes (5 min buffer after 1h)
  '4h': 4 * 65 * 60,  // 4 hours + 5 min buffer
  '1d': 25 * 60 * 60, // 25 hours (1 hour buffer after 1d)
  metadata: 25 * 60 * 60 // Same as daily
};

export class CandlestickCache {
  
  // Calculate next update times based on current time
  static getNextUpdateTimes(): { '1h': number; '4h': number; '1d': number } {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    // Next 1h update: next hour at :00
    const next1h = new Date(now);
    next1h.setUTCMinutes(0, 0, 0);
    next1h.setUTCHours(next1h.getUTCHours() + 1);
    
    // Next 4h update: next 4-hour boundary (0, 4, 8, 12, 16, 20)
    const next4h = new Date(now);
    const nextFourHourMark = Math.ceil(currentHour / 4) * 4;
    next4h.setUTCHours(nextFourHourMark, 0, 0, 0);
    if (nextFourHourMark === currentHour && currentMinute === 0) {
      next4h.setUTCHours(next4h.getUTCHours() + 4);
    }
    
    // Next 1d update: next day at 00:00 UTC
    const next1d = new Date(now);
    next1d.setUTCHours(24, 0, 0, 0);
    
    return {
      '1h': next1h.getTime(),
      '4h': next4h.getTime(),
      '1d': next1d.getTime()
    };
  }
  
  // Save candlestick patterns to Redis
  static async savePatterns(patterns: CandlestickScreenerResult): Promise<void> {
    try {
      const client = getCandlestickRedisClient();
      const pipeline = client.pipeline();
      
      // Save each timeframe with appropriate TTL
      Object.entries(patterns).forEach(([timeframe, data]) => {
        if (timeframe === '1h' || timeframe === '4h' || timeframe === '1d') {
          const key = CANDLESTICK_KEYS[timeframe];
          const ttl = CANDLESTICK_TTL[timeframe];
          
          pipeline.setex(key, ttl, JSON.stringify({
            patterns: data,
            savedAt: Date.now(),
            nextUpdate: patterns.nextUpdate[timeframe]
          }));
        }
      });
      
      // Save metadata
      pipeline.setex(CANDLESTICK_KEYS.metadata, CANDLESTICK_TTL.metadata, JSON.stringify({
        timestamp: patterns.timestamp,
        totalScanned: patterns.totalScanned,
        nextUpdate: patterns.nextUpdate,
        savedAt: Date.now()
      }));
      
      // Save last update timestamp
      pipeline.set(CANDLESTICK_KEYS.lastUpdate, Date.now());
      
      await pipeline.exec();
      
      console.log(`✅ Candlestick patterns saved to Redis - 1h: ${patterns['1h'].length}, 4h: ${patterns['4h'].length}, 1d: ${patterns['1d'].length}`);
      
    } catch (error) {
      console.error('❌ Error saving candlestick patterns to Redis:', error);
      throw error;
    }
  }
  
  // Get candlestick patterns from Redis
  static async getPatterns(): Promise<CandlestickScreenerResult | null> {
    try {
      const client = getCandlestickRedisClient();
      
      // Get metadata first to check if data exists
      const metadataResult = await client.get(CANDLESTICK_KEYS.metadata);
      if (!metadataResult) {
        console.log('📊 No candlestick patterns found in Redis');
        return null;
      }
      
      const metadata = typeof metadataResult === 'string' 
        ? JSON.parse(metadataResult) 
        : metadataResult;
      
      // Get patterns for each timeframe
      const [data1h, data4h, data1d] = await Promise.all([
        client.get(CANDLESTICK_KEYS['1h']),
        client.get(CANDLESTICK_KEYS['4h']),
        client.get(CANDLESTICK_KEYS['1d'])
      ]);
      
      const parseData = (data: any): CandlestickPattern[] => {
        if (!data) return [];
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return parsed.patterns || [];
      };
      
      const result: CandlestickScreenerResult = {
        '1h': parseData(data1h),
        '4h': parseData(data4h),
        '1d': parseData(data1d),
        timestamp: metadata.timestamp,
        totalScanned: metadata.totalScanned,
        nextUpdate: metadata.nextUpdate || CandlestickCache.getNextUpdateTimes()
      };
      
      console.log(`📊 Retrieved candlestick patterns from Redis - 1h: ${result['1h'].length}, 4h: ${result['4h'].length}, 1d: ${result['1d'].length}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error retrieving candlestick patterns from Redis:', error);
      return null;
    }
  }
  
  // Check if patterns need updating for a specific timeframe
  static async needsUpdate(timeframe: '1h' | '4h' | '1d'): Promise<boolean> {
    try {
      const client = getCandlestickRedisClient();
      const data = await client.get(CANDLESTICK_KEYS[timeframe]);
      
      if (!data) {
        return true; // No data exists, needs update
      }
      
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const nextUpdate = parsed.nextUpdate;
      
      if (!nextUpdate) {
        return true; // No next update time, needs update
      }
      
      const now = Date.now();
      return now >= nextUpdate; // Needs update if current time >= next update time
      
    } catch (error) {
      console.error(`❌ Error checking if ${timeframe} needs update:`, error);
      return true; // On error, assume needs update
    }
  }
  
  // Get the age of cached data in minutes
  static async getDataAge(): Promise<{ '1h': number; '4h': number; '1d': number } | null> {
    try {
      const client = getCandlestickRedisClient();
      const now = Date.now();
      
      const [data1h, data4h, data1d] = await Promise.all([
        client.get(CANDLESTICK_KEYS['1h']),
        client.get(CANDLESTICK_KEYS['4h']),
        client.get(CANDLESTICK_KEYS['1d'])
      ]);
      
      const getAge = (data: any): number => {
        if (!data) return Infinity;
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const savedAt = parsed.savedAt;
        if (!savedAt) return Infinity;
        return Math.round((now - savedAt) / (1000 * 60)); // Age in minutes
      };
      
      return {
        '1h': getAge(data1h),
        '4h': getAge(data4h),
        '1d': getAge(data1d)
      };
      
    } catch (error) {
      console.error('❌ Error getting data age:', error);
      return null;
    }
  }
  
  // Clear all candlestick cache
  static async clearCache(): Promise<void> {
    try {
      const client = getCandlestickRedisClient();
      const pipeline = client.pipeline();
      
      Object.values(CANDLESTICK_KEYS).forEach(key => {
        pipeline.del(key);
      });
      
      await pipeline.exec();
      console.log('🗑️ Candlestick cache cleared');
      
    } catch (error) {
      console.error('❌ Error clearing candlestick cache:', error);
      throw error;
    }
  }
  
  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const client = getCandlestickRedisClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Candlestick cache health check failed:', error);
      return false;
    }
  }
}

export default CandlestickCache; 