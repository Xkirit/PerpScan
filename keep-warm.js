#!/usr/bin/env node

const https = require('https');

const endpoints = [
  'https://perpflow.vercel.app/api/institutional-flows',
  'https://perpflow.vercel.app/api/redis-info',
  'https://perpflow.vercel.app/api/debug-redis',
  'https://perpflow.vercel.app/api/analyze?interval=4h'
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
};

async function pingEndpoint(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(url, { headers }, (res) => {
      const duration = Date.now() - startTime;
      console.log(`✅ ${url} - Status: ${res.statusCode} - ${duration}ms`);
      
      // Consume response to free up memory
      res.on('data', () => {});
      res.on('end', () => resolve({ success: true, status: res.statusCode, duration }));
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ ${url} - Error: ${error.message} - ${duration}ms`);
      resolve({ success: false, error: error.message, duration });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`⏰ ${url} - Timeout after 10s`);
      resolve({ success: false, error: 'Timeout', duration: 10000 });
    });
  });
}

async function keepWarm() {
  console.log(`🚀 Keep-warm started at ${new Date().toISOString()}`);
  
  // Ping all endpoints in parallel
  const results = await Promise.all(endpoints.map(pingEndpoint));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`📊 Results: ${successful} successful, ${failed} failed`);
  
  // Wait 30 seconds and ping the main endpoint again
  console.log('⏳ Waiting 30 seconds for second ping...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await pingEndpoint(endpoints[0]); // Ping institutional-flows again
  
  console.log(`✨ Keep-warm completed at ${new Date().toISOString()}\n`);
}

if (require.main === module) {
  keepWarm().catch(console.error);
}

module.exports = { keepWarm, pingEndpoint }; 