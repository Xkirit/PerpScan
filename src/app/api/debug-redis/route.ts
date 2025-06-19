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
    logs.push('[DEBUG] Starting Upstash Redis connection test...');
    
    // Force a fresh Redis connection by testing health
    const isHealthy = await InstitutionalFlowsRedis.healthCheck();
    logs.push(`[DEBUG] Health check result: ${isHealthy}`);
    
    // Get current flows count
    const flowsCount = await InstitutionalFlowsRedis.getFlowsCount();
    logs.push(`[DEBUG] Current flows count: ${flowsCount}`);
    
    // Try to get actual flows
    const flows = await InstitutionalFlowsRedis.getFlows();
    logs.push(`[DEBUG] Retrieved ${flows.length} flows from Upstash Redis`);
    
    // Get Upstash Redis URL info
    const upstashUrl = process.env.KV_REST_API_URL || '';
    const upstashToken = process.env.KV_REST_API_TOKEN || '';
    const databaseType = 'UPSTASH Redis (REST API)';
    
    logs.push(`[DEBUG] Database type: ${databaseType}`);
    logs.push(`[DEBUG] Environment: ${process.env.NODE_ENV || 'development'}`);
    logs.push(`[DEBUG] Has URL: ${!!upstashUrl}`);
    logs.push(`[DEBUG] Has Token: ${!!upstashToken}`);
    
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
        hasCredentials: !!(upstashUrl && upstashToken),
        upstashUrl: upstashUrl ? upstashUrl.replace(/\/\/.*@/, '//[HIDDEN]@') : '[NOT SET]',
        apiType: 'REST API (Serverless-optimized)'
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
      error: 'Upstash Redis debug failed',
      capturedLogs: logs,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 