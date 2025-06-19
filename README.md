# Bybit Analyzer

This is a [Next.js](https://nextjs.org) project for analyzing cryptocurrency trading data from Bybit.

## Environment Setup

This project requires Upstash Redis for data storage. You'll need to set up the following environment variables:

```bash
# Upstash Redis Configuration (Vercel KV format)
# Get these values from your Upstash Redis dashboard: https://console.upstash.com/redis
KV_REST_API_URL=https://your-redis-url.upstash.io
KV_REST_API_TOKEN=your-redis-token

# Application Configuration
NODE_ENV=development
```

### Setting up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/redis)
2. Create a new Redis database
3. Copy the REST URL and REST Token from the database details
4. Add them to your `.env.local` file as `KV_REST_API_URL` and `KV_REST_API_TOKEN`

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
- Institutional flow tracking
- Redis-based data caching with Upstash
- Responsive dashboard interface

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
