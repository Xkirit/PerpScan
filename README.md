# Bybit Analyzer

This is a [Next.js](https://nextjs.org) project for analyzing cryptocurrency trading data from Bybit.

## Environment Setup

This project requires Upstash Redis for data storage. You'll need to set up the following environment variables:

```bash
# Upstash Redis Configuration (Vercel KV format)
# Get these values from your Upstash Redis dashboard: https://console.upstash.com/redis
KV_REST_API_URL=https://your-redis-url.upstash.io
KV_REST_API_TOKEN=your-redis-token

# Candlestick Auto-Update Configuration
CANDLESTICK_CRON_SECRET=your-secure-cron-secret

# Application Configuration
NODE_ENV=development
```

### Setting up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/redis)
2. Create a new Redis database
3. Copy the REST URL and REST Token from the database details
4. Add them to your `.env.local` file as `KV_REST_API_URL` and `KV_REST_API_TOKEN`

### Geographic Restrictions Solution

This application uses **Vercel Edge Functions** deployed to **unrestricted regions** to bypass geographic API restrictions:

#### **How it Works**
1. **Edge Runtime**: API routes run as Edge Functions instead of serverless functions
2. **Regional Deployment**: Functions deploy to unrestricted regions only
3. **Automatic Routing**: Vercel routes requests to the nearest unrestricted region
4. **No Proxies Needed**: Direct API calls from compliant geographic locations

#### **Supported Regions** 🌍
- **🇩🇪 Europe**: Frankfurt (`fra1`), Amsterdam (`ams1`), London (`lhr1`)
- **🇸🇬 Asia-Pacific**: Singapore (`sin1`), Hong Kong (`hkg1`)
- **🇨🇦 North America**: Toronto (`yyz1`) - unrestricted alternative to US

#### **Benefits**
- ✅ **Native Performance**: No proxy overhead or additional latency
- ✅ **High Reliability**: Direct API calls from compliant regions
- ✅ **Automatic Scaling**: Vercel Edge Network handles traffic distribution
- ✅ **Transparent**: No configuration needed - deploy and it works
- ✅ **Cost Effective**: No additional proxy services required

#### **Configuration**
The application automatically deploys to unrestricted regions via:
- Edge Runtime configuration in API routes
- `vercel.json` regional deployment settings
- Automatic failover between available regions

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run upstash-info` - Check Upstash Redis connection info
- `npm run upstash-debug` - Debug Upstash Redis connection with detailed logs

## Features

- Real-time cryptocurrency data analysis
- **Candlestick Pattern Screener** with automated updates
- Institutional flow tracking
- Redis-based data caching with Upstash
- Responsive dashboard interface

### Candlestick Pattern Screener

The application includes an advanced candlestick pattern screener that:

- 🔍 **Scans 300 USDT pairs** across three timeframes (1H, 4H, 1D)
- 📊 **Detects engulfing patterns** with volume and price change analysis
- ⚡ **Auto-updates on candle close** - clears and repopulates data when new candles form
- 🚀 **99% faster** with Redis caching (50ms vs 30+ seconds)
- 📱 **Mobile responsive** with glassmorphism UI design

#### Auto-Update Schedule
- **1H**: Updates every hour at 00:00-00:02 UTC
- **4H**: Updates every 4 hours (0, 4, 8, 12, 16, 20 UTC) at 00:00-00:02 UTC  
- **1D**: Updates daily at 00:00-00:02 UTC

#### Testing Auto-Updates
```bash
# Check current status and schedule
node test-auto-update.js status

# Manually trigger auto-update
node test-auto-update.js trigger

# Force update specific timeframes
node test-auto-update.js force 1h,4h
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
