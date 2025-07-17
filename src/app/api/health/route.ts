import { NextResponse } from 'next/server';
import InstitutionalFlowsRedis from '@/lib/redis-client';

export async function GET() {
  try {
    // Check Redis connection
    const redisStatus = await InstitutionalFlowsRedis.healthCheck();
    
    // Check basic app functionality
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      redis: redisStatus ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    }, { status: 503 });
  }
} 