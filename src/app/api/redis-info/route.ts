import { NextRequest, NextResponse } from 'next/server';
import InstitutionalFlowsRedis from '@/lib/redis-client';

export async function GET(request: NextRequest) {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Determine database type
    let databaseType = 'UNKNOWN';
    let host = 'unknown';
    
    if (redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) {
      databaseType = 'LOCAL Redis (localhost)';
      host = 'localhost';
    } else if (redisUrl.includes('redis-cloud.com') || redisUrl.includes('redislabs.com')) {
      databaseType = 'REDIS CLOUD (Vercel-managed)';
      const hostMatch = redisUrl.match(/@([^:]+)/);
      host = hostMatch ? hostMatch[1] : 'redis-cloud.com';
    } else if (redisUrl.includes('upstash.io')) {
      databaseType = 'UPSTASH Redis';
      host = redisUrl.includes('@') ? redisUrl.split('@')[1].split(':')[0] : 'upstash.io';
    } else {
      databaseType = 'EXTERNAL Redis';
      host = redisUrl.includes('@') ? redisUrl.split('@')[1].split(':')[0] : 'external';
    }
    
    // Test connection
    const isHealthy = await InstitutionalFlowsRedis.healthCheck();
    const flowsCount = await InstitutionalFlowsRedis.getFlowsCount();
    
    const connectionInfo = {
      success: true,
      redis: {
        environment: process.env.NODE_ENV || 'development',
        databaseType,
        host,
        hasPassword: redisUrl.includes('@'),
        isConnected: isHealthy,
        currentFlowsCount: flowsCount,
        redisUrl: redisUrl.includes('localhost') ? redisUrl : redisUrl.replace(/\/\/.*@/, '//[HIDDEN]@'), // Hide credentials for security
        connectionMode: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      },
      timestamp: new Date().toISOString()
    };
    
    // Log to console as well
    console.log('\n🔍 Redis Database Connection Info:');
    console.log('   Environment:', connectionInfo.redis.environment);
    console.log('   📍 Database Type:', connectionInfo.redis.databaseType);
    console.log('   🌐 Host:', connectionInfo.redis.host);
    console.log('   🔑 Authentication:', connectionInfo.redis.hasPassword ? 'Yes (with password)' : 'No');
    console.log('   ✅ Connected:', connectionInfo.redis.isConnected);
    console.log('   📊 Current Flows:', connectionInfo.redis.currentFlowsCount);
    console.log('   🌍 Connection Mode:', connectionInfo.redis.connectionMode);
    console.log('');
    
    return NextResponse.json(connectionInfo);
    
  } catch (error) {
    console.error('❌ Redis info error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get Redis information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 