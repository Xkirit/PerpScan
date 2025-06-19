import { NextRequest, NextResponse } from 'next/server';
import InstitutionalFlowsRedis from '@/lib/redis-client';

export async function GET(request: NextRequest) {
  try {
    const upstashUrl = process.env.KV_REST_API_URL || '';
    const upstashToken = process.env.KV_REST_API_TOKEN || '';
    
    // Determine database type and host
    let databaseType = 'UPSTASH Redis (REST API)';
    let host = 'unknown';
    
    if (upstashUrl) {
      try {
        const url = new URL(upstashUrl);
        host = url.hostname;
      } catch {
        host = 'invalid-url';
      }
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
        hasCredentials: !!(upstashUrl && upstashToken),
        isConnected: isHealthy,
        currentFlowsCount: flowsCount,
        upstashUrl: upstashUrl ? upstashUrl.replace(/\/\/.*@/, '//[HIDDEN]@') : '[NOT SET]',
        connectionMode: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
        apiType: 'REST API (Serverless-optimized)'
      },
      timestamp: new Date().toISOString()
    };
    
    // Log to console as well
    console.log('\n🔍 Upstash Redis Database Connection Info:');
    console.log('   Environment:', connectionInfo.redis.environment);
    console.log('   📍 Database Type:', connectionInfo.redis.databaseType);
    console.log('   🌐 Host:', connectionInfo.redis.host);
    console.log('   🔑 Credentials:', connectionInfo.redis.hasCredentials ? 'Yes (URL + Token)' : 'No');
    console.log('   ✅ Connected:', connectionInfo.redis.isConnected);
    console.log('   📊 Current Flows:', connectionInfo.redis.currentFlowsCount);
    console.log('   🌍 Connection Mode:', connectionInfo.redis.connectionMode);
    console.log('   🚀 API Type:', connectionInfo.redis.apiType);
    console.log('');
    
    return NextResponse.json(connectionInfo);
    
  } catch (error) {
    console.error('❌ Upstash Redis info error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get Upstash Redis information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 