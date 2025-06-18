import { NextRequest, NextResponse } from 'next/server';
import InstitutionalFlowsRedis from '@/lib/redis-client';

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  
  // Override console.log to capture logs
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args) => {
    logs.push(`[LOG] ${args.join(' ')}`);
    originalLog(...args);
  };
  
  console.error = (...args) => {
    logs.push(`[ERROR] ${args.join(' ')}`);
    originalError(...args);
  };
  
  try {
    logs.push('[DEBUG] Starting Redis connection test...');
    
    // Force a fresh Redis connection by testing health
    const isHealthy = await InstitutionalFlowsRedis.healthCheck();
    logs.push(`[DEBUG] Health check result: ${isHealthy}`);
    
    // Get current flows count
    const flowsCount = await InstitutionalFlowsRedis.getFlowsCount();
    logs.push(`[DEBUG] Current flows count: ${flowsCount}`);
    
    // Try to get actual flows
    const flows = await InstitutionalFlowsRedis.getFlows();
    logs.push(`[DEBUG] Retrieved ${flows.length} flows from Redis`);
    
    // Get Redis URL info
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    let databaseType = 'UNKNOWN';
    
    if (redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) {
      databaseType = 'LOCAL Redis (localhost)';
    } else if (redisUrl.includes('redis-cloud.com') || redisUrl.includes('redislabs.com')) {
      databaseType = 'REDIS CLOUD (Vercel-managed)';
    } else if (redisUrl.includes('upstash.io')) {
      databaseType = 'UPSTASH Redis';
    } else {
      databaseType = 'EXTERNAL Redis';
    }
    
    logs.push(`[DEBUG] Database type: ${databaseType}`);
    logs.push(`[DEBUG] Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Restore original console functions
    console.log = originalLog;
    console.error = originalError;
    
    return NextResponse.json({
      success: true,
      redis: {
        isConnected: isHealthy,
        flowsCount,
        databaseType,
        environment: process.env.NODE_ENV || 'development',
        redisUrl: redisUrl.includes('localhost') ? redisUrl : redisUrl.replace(/\/\/.*@/, '//[HIDDEN]@')
      },
      capturedLogs: logs,
      flows: flows.slice(0, 3).map(f => ({
        symbol: f.symbol,
        priority: f.priorityScore?.toFixed(0) || '0'
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Restore original console functions
    console.log = originalLog;
    console.error = originalError;
    
    logs.push(`[ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return NextResponse.json({
      success: false,
      error: 'Redis debug failed',
      capturedLogs: logs,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 