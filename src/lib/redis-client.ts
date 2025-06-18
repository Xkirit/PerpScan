import { createClient } from 'redis';

interface InstitutionalFlow {
  symbol: string;
  openInterest: number;
  openInterestValue: number;
  oiChange24h: number;
  oiChangePercent: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  fundingRate: number;
  timestamp: number;
  historicalOI?: number[];
  oiVelocity?: number;
  oiAcceleration?: number;
  abnormalityScore?: number;
  whaleRating?: 'mega' | 'large' | 'medium' | 'small';
  priorityScore?: number;
  volumeCategory?: 'low' | 'medium' | 'high';
  manipulationConfidence?: number;
}

// Redis client singleton
let redisClient: any = null;

async function getRedisClient(): Promise<any> {
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }

  // Create Redis client
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    // For production, you might want to add more config:
    // password: process.env.REDIS_PASSWORD,
    // socket: { tls: process.env.NODE_ENV === 'production' }
  });

  client.on('error', (err) => {
    //console.error('❌ Redis Client Error:', err);
  });

  client.on('connect', () => {
          // console.log('🔗 Redis Client Connected');
  });

  client.on('ready', () => {
          // console.log('✅ Redis Client Ready');
  });

  client.on('end', () => {
          // console.log('🔌 Redis Client Connection Ended');
  });

  await client.connect();
  redisClient = client;
  return client;
}

const FLOWS_KEY = 'institutional:flows';
const PRIORITY_KEY = 'institutional:priority';
const TTL_SECONDS = 3600; // 1 hour TTL

export class InstitutionalFlowsRedis {
  
  // Save flows to Redis with automatic expiry
  static async saveFlows(flows: InstitutionalFlow[]): Promise<void> {
    try {
      const client = await getRedisClient();
      
      const data = {
        flows,
        lastUpdated: Date.now(),
        totalFlows: flows.length
      };
      
      // Store main data with TTL
      await client.setEx(FLOWS_KEY, TTL_SECONDS, JSON.stringify(data));
      
      // Clear existing priority sorted set
      await client.del(PRIORITY_KEY);
      
      // Add flows to sorted set by priority
      if (flows.length > 0) {
        const zaddArgs: Array<{ score: number; value: string }> = flows.map(flow => ({
          score: flow.priorityScore || 0,
          value: JSON.stringify(flow)
        }));
        
        await client.zAdd(PRIORITY_KEY, zaddArgs);
        
        // Keep only top 10 flows
        await client.zRemRangeByRank(PRIORITY_KEY, 0, -11);
        
        // Set TTL on sorted set
        await client.expire(PRIORITY_KEY, TTL_SECONDS);
      }
      
      // console.log(`✅ Redis: Saved ${flows.length} flows with TTL ${TTL_SECONDS}s`);
    } catch (error) {
      //console.error('❌ Redis save error:', error);
      throw error;
    }
  }
  
  // Get flows from Redis
  static async getFlows(): Promise<InstitutionalFlow[]> {
    try {
      const client = await getRedisClient();
      
      // Try to get from main key first
      const dataString = await client.get(FLOWS_KEY);
      
      if (dataString) {
        const data = JSON.parse(dataString);
        if (data && data.flows && Array.isArray(data.flows)) {
          // console.log(`📊 Redis: Retrieved ${data.flows.length} flows from main key`);
          return data.flows;
        }
      }
      
      // Fallback: get from sorted set (highest priority first)
      const flowsData = await client.zRange(PRIORITY_KEY, 0, 9, { REV: true });
      
      if (flowsData && flowsData.length > 0) {
        const flows = flowsData.map((item: string) => JSON.parse(item));
        // console.log(`📊 Redis: Retrieved ${flows.length} flows from sorted set`);
        return flows;
      }
      
      //console.log('📊 Redis: No flows found');
      return [];
      
    } catch (error) {
      //console.error('❌ Redis get error:', error);
      return [];
    }
  }
  
  // Get flows count
  static async getFlowsCount(): Promise<number> {
    try {
      const client = await getRedisClient();
      const count = await client.zCard(PRIORITY_KEY);
      return count || 0;
    } catch (error) {
      ////console.error('❌ Redis count error:', error);
      return 0;
    }
  }
  
  // Clear all flows
  static async clearFlows(): Promise<void> {
    try {
      const client = await getRedisClient();
      await client.del(FLOWS_KEY);
      await client.del(PRIORITY_KEY);
      //console.log('🗑️ Redis: Cleared all flows');
    } catch (error) {
      //console.error('❌ Redis clear error:', error);
    }
  }
  
  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const client = await getRedisClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
     // //console.error('❌ Redis health check failed:', error);
      return false;
    }
  }
  
  // Close connection (for cleanup)
  static async close(): Promise<void> {
    try {
      if (redisClient && redisClient.isReady) {
        await redisClient.quit();
        redisClient = null;
        //console.log('🔌 Redis connection closed');
      }
    } catch (error) {
      //console.error('❌ Redis close error:', error);
    }
  }
}

export default InstitutionalFlowsRedis; 