# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production 
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment and Testing
- `npm run upstash-info` - Check Upstash Redis connection info
- `npm run upstash-debug` - Debug Redis connection with detailed logs
- `npm run test-cron` - Test institutional flows cron endpoint

### Testing Scripts
- `node test-auto-update.js status` - Check candlestick auto-update status and schedule
- `node test-auto-update.js trigger` - Manually trigger auto-update
- `node test-auto-update.js force 1h,4h` - Force update specific timeframes
- `node test-fibonacci-scanner.js` - Test Fibonacci pattern scanner
- `node test-api-key.js` - Test API key configuration

### Deployment
- `./deploy/aws-setup.sh` - Set up AWS infrastructure for deployment
- `./deploy/deploy.sh` - Deploy to AWS ECS

## Architecture Overview

### Core Structure
This is a **Next.js 15** cryptocurrency analysis application using:
- **Runtime**: Edge Functions for geographic restriction bypass
- **Data Storage**: Upstash Redis for caching (replaces traditional database)
- **API Integration**: Bybit exchange APIs with centralized service layer
- **UI Framework**: React 19 + Tailwind CSS with glassmorphism design

### Key Service Layer (`src/lib/`)
- `api-service.ts` - Centralized API service with caching to eliminate duplicate Bybit calls
- `bybit-service.ts` - Direct Bybit API integration
- `redis-client.ts` - Upstash Redis client configuration 
- `fibonacci-service.ts` - Technical analysis for pattern detection
- `candlestick-cache.ts` - Specialized caching for candlestick data

### API Architecture (`src/app/api/`)
**Edge Functions** with 60-second timeouts for heavy computation:
- `candlestick-screener/` - Scans 300 USDT pairs for patterns
- `candlestick-compute/` - Processes candlestick calculations
- `candlestick-auto-update/` - Automated updates on candle close
- `fibonacci-scanner/` - Technical pattern analysis
- `institutional-flows/` - Large trader activity tracking

### Core Components (`src/components/`)
- `CandlestickScreenerV2.tsx` - Main pattern screener interface
- `FibonacciScanner.tsx` - Technical analysis interface 
- `InstitutionalActivity.tsx` - Large trader flow visualization
- `Traderchatbot.tsx` - AI chat interface for market analysis

### Regional Deployment Strategy
Uses **Vercel Edge Functions** deployed to unrestricted regions (Europe, Asia-Pacific, Canada) to bypass geographic API restrictions. Configuration in `vercel.json` specifies function timeouts.

## Environment Requirements

### Required Environment Variables
```bash
# Upstash Redis (Primary data storage)
KV_REST_API_URL=https://your-redis-url.upstash.io
KV_REST_API_TOKEN=your-redis-token

# Security
CANDLESTICK_CRON_SECRET=your-secure-cron-secret

# Optional: AI Features
SERPAPI_KEY=your-serpapi-key
```

### Redis as Primary Database
This application uses **Redis as the primary database** rather than traditional SQL/NoSQL:
- Candlestick patterns cached with 1-hour TTL
- Institutional flows stored with timestamp keys  
- Real-time data updates with sub-second latency
- 99% performance improvement (50ms vs 30+ seconds)

## Key Features & Automation

### Candlestick Auto-Update System
**Automated pattern detection** that clears and repopulates data when new candles form:
- **1H**: Updates every hour at 00:00-00:02 UTC
- **4H**: Updates every 4 hours (0, 4, 8, 12, 16, 20 UTC) at 00:00-00:02 UTC  
- **1D**: Updates daily at 00:00-00:02 UTC

### Performance Optimization
- **API Centralization**: Single service eliminates duplicate API calls
- **Edge Caching**: Redis with strategic TTL values
- **Geographic Optimization**: Auto-routing to compliant regions

## Development Notes

### Code Conventions
- **TypeScript**: Strict typing with interfaces in `src/types/`
- **API Routes**: Use Edge Runtime with error handling
- **State Management**: React Context for theme and global state
- **Styling**: Tailwind CSS with custom glassmorphism components

### Import Structure
Use `@/*` path aliases for clean imports:
```typescript
import { APIService } from '@/lib/api-service';
import { BybitTicker } from '@/types';
```

### Security Practices
- Environment secrets never committed to repository
- API endpoints protected with cron secrets where applicable
- Redis queries sanitized and rate-limited