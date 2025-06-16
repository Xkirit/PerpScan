# Redis Setup for Bybit Institutional Activity Tracker

The application has been updated to use **Redis** instead of Vercel Edge Config Store for better performance and real-time capabilities.

## Quick Setup Options

### Option 1: Local Redis (Development)
```bash
# Install Redis locally (macOS)
brew install redis

# Start Redis server
redis-server

# Test connection
redis-cli ping
# Should respond: PONG
```

Add to your `.env.local`:
```env
REDIS_URL=redis://localhost:6379
```

### Option 2: Railway Redis (Recommended for Production)
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project
4. Add a **Redis** service
5. Copy the connection URL from the Redis service
6. Add to your `.env.local`:
```env
REDIS_URL=redis://containers-us-west-xxx.railway.app:6379
```

### Option 3: Redis Cloud (Upstash Alternative)
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create a free account (30MB free)
3. Create a new database
4. Copy the connection URL
5. Add to your `.env.local`:
```env
REDIS_URL=redis://default:password@redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com:port
```

### Option 4: Heroku Redis
If deploying to Heroku:
```bash
heroku addons:create heroku-redis:mini
```
Heroku will automatically set the `REDIS_URL` environment variable.

## Environment Variables

Create a `.env.local` file in your project root:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Optional: Redis Password (if required)
# REDIS_PASSWORD=your_password

# Optional: Bybit API credentials (if needed)
# BYBIT_API_KEY=your_api_key
# BYBIT_API_SECRET=your_api_secret
```

## Benefits of Redis over Edge Config

✅ **Real-time updates** - No sync delays  
✅ **Higher throughput** - No rate limiting  
✅ **Better performance** - Sub-millisecond operations  
✅ **Automatic expiry** - Built-in TTL support  
✅ **Priority queues** - Sorted sets for top flows  
✅ **Cost effective** - Many free tiers available  

## Testing the Setup

After setting up Redis and updating your `.env.local`:

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Check the logs:**
   Look for: `✅ Redis Client Connected` and `✅ Redis Client Ready`

3. **Test the API:**
   ```bash
   curl http://localhost:3000/api/institutional-flows
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "flows": [],
     "debug": {
       "redisConnected": true,
       "redisUrl": true
     }
   }
   ```

## Troubleshooting

**Connection Error:**
- Verify `REDIS_URL` is correct
- Check if Redis server is running
- Ensure no firewall blocking the connection

**Authentication Error:**
- Add `REDIS_PASSWORD` if required
- Check connection string format

**Performance Issues:**
- Monitor Redis memory usage
- Consider upgrading Redis plan if hitting limits

## Migration from Edge Config

Your existing data will be lost during the migration (this is expected). The new Redis system will:
- Start fresh with real-time institutional flow detection
- Update every 10 seconds with new flows
- Maintain top 10 highest priority flows automatically
- Provide better performance and reliability

The migration is complete! Your application now uses Redis for institutional flow tracking. 