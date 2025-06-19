import { Redis } from '@upstash/redis';

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

// Upstash Redis client singleton
let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  // Upstash Redis configuration (Vercel KV format)
  const upstashUrl = process.env.KV_REST_API_URL;
  const upstashToken = process.env.KV_REST_API_TOKEN;
  
  if (!upstashUrl || !upstashToken) {
    throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables');
  }

  // 🔍 DATABASE CONNECTION LOGGING
  console.log('🔗 Upstash Redis Database Connection Info:');
  console.log('   Environment:', process.env.NODE_ENV || 'development');
  console.log('   📍 Database Type: UPSTASH Redis (REST API)');
  console.log('   🌐 Host:', upstashUrl);
  console.log('   🔑 Authentication: Yes (with token)');
  console.log('   🌍 Connection Mode:', process.env.NODE_ENV === 'production' ? 'Production' : 'Development');
  console.log('   🚀 API Type: REST API (Serverless-optimized)');

  // Create Upstash Redis client
  redisClient = new Redis({
    url: upstashUrl,
    token: upstashToken,
  });

  console.log('✅ Upstash Redis Client Initialized');
  console.log('🎯 Successfully configured Upstash Redis!\n');
  
  return redisClient;
}

const FLOWS_KEY = 'institutional:flows';
const PRIORITY_KEY = 'institutional:priority';
const TTL_SECONDS = 3600; // 1 hour TTL

export class InstitutionalFlowsRedis {
  
  // Save flows to Redis with automatic expiry
  static async saveFlows(flows: InstitutionalFlow[]): Promise<void> {
    try {
      const client = getRedisClient();
      
      const data = {
        flows,
        lastUpdated: Date.now(),
        totalFlows: flows.length
      };
      
      // Store main data with TTL using Upstash Redis
      await client.setex(FLOWS_KEY, TTL_SECONDS, JSON.stringify(data));
      
      // Clear existing priority sorted set
      await client.del(PRIORITY_KEY);
      
      // Add flows to sorted set by priority
      if (flows.length > 0) {
        const zaddArgs: Array<{ score: number; member: string }> = flows.map(flow => ({
          score: flow.priorityScore || 0,
          member: JSON.stringify(flow)
        }));
        
        // Use pipeline for batch operations
        const pipeline = client.pipeline();
        
        // Add all flows to sorted set
        for (const arg of zaddArgs) {
          pipeline.zadd(PRIORITY_KEY, { score: arg.score, member: arg.member });
        }
        
        // Keep only top 10 flows
        pipeline.zremrangebyrank(PRIORITY_KEY, 0, -11);
        
        // Set TTL on sorted set
        pipeline.expire(PRIORITY_KEY, TTL_SECONDS);
        
        await pipeline.exec();
      }
      
      console.log(`✅ Upstash Redis: Saved ${flows.length} flows with TTL ${TTL_SECONDS}s`);
    } catch (error) {
      console.error('❌ Upstash Redis save error:', error);
      throw error;
    }
  }
  
  // Get flows from Redis
  static async getFlows(): Promise<InstitutionalFlow[]> {
    try {
      const client = getRedisClient();
      
      // Try to get from main key first
      const dataResult = await client.get(FLOWS_KEY);
      
      if (dataResult) {
        try {
          // Handle both string and object responses from Upstash
          let data;
          if (typeof dataResult === 'string') {
            data = JSON.parse(dataResult);
          } else if (typeof dataResult === 'object') {
            data = dataResult;
          }
          
          if (data && data.flows && Array.isArray(data.flows)) {
            console.log(`📊 Upstash Redis: Retrieved ${data.flows.length} flows from main key`);
            return data.flows;
          }
        } catch (parseError) {
          console.log('📊 Upstash Redis: Main key data parse error, trying sorted set');
        }
      }
      
      // Fallback: get from sorted set (highest priority first)
      const flowsData = await client.zrange(PRIORITY_KEY, 0, 9, { rev: true });
      
      if (flowsData && flowsData.length > 0) {
        try {
          const flows = flowsData.map((item: any) => {
            // Handle both string and object responses
            if (typeof item === 'string') {
              return JSON.parse(item);
            } else if (typeof item === 'object') {
              return item;
            } else {
              throw new Error('Invalid item type');
            }
          });
          console.log(`📊 Upstash Redis: Retrieved ${flows.length} flows from sorted set`);
          return flows;
        } catch (parseError) {
          console.error('❌ Upstash Redis: Error parsing sorted set data:', parseError);
        }
      }
      
      console.log('📊 Upstash Redis: No flows found');
      return [];
      
    } catch (error) {
      console.error('❌ Upstash Redis get error:', error);
      return [];
    }
  }
  
  // Get flows count
  static async getFlowsCount(): Promise<number> {
    try {
      const client = getRedisClient();
      const count = await client.zcard(PRIORITY_KEY);
      return count || 0;
    } catch (error) {
      console.error('❌ Upstash Redis count error:', error);
      return 0;
    }
  }
  
  // Clear all flows
  static async clearFlows(): Promise<void> {
    try {
      const client = getRedisClient();
      const pipeline = client.pipeline();
      pipeline.del(FLOWS_KEY);
      pipeline.del(PRIORITY_KEY);
      await pipeline.exec();
      console.log('🗑️ Upstash Redis: Cleared all flows');
    } catch (error) {
      console.error('❌ Upstash Redis clear error:', error);
    }
  }
  
  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const client = getRedisClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Upstash Redis health check failed:', error);
      return false;
    }
  }
  
  // Close connection (for Upstash REST API, no connection to close)
  static async close(): Promise<void> {
    try {
      // Upstash REST API doesn't require connection closing
      redisClient = null;
      console.log('🔌 Upstash Redis client reference cleared');
    } catch (error) {
      console.error('❌ Upstash Redis close error:', error);
    }
  }
}

export default InstitutionalFlowsRedis; 