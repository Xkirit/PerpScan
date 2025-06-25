import crypto from 'crypto';

// Test Bybit API key authentication
async function testBybitAuth() {
  console.log('🔐 Testing Bybit API Key Authentication...\n');

  // Check if environment variables are set
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.log('❌ Missing API credentials');
    console.log('Please set environment variables:');
    console.log('export BYBIT_API_KEY="your_api_key"');
    console.log('export BYBIT_API_SECRET="your_api_secret"');
    console.log('\nTo get Bybit API credentials:');
    console.log('1. Go to https://www.bybit.com/app/user/api-management');
    console.log('2. Create a new API key');
    console.log('3. Enable "Read" permissions (no trading needed)');
    console.log('4. Copy the API key and secret');
    return;
  }

  console.log('✅ API credentials found');
  console.log(`API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

  // Generate signature for test request
  function generateSignature(params, timestamp, apiSecret) {
    const hmac = crypto.createHmac('sha256', apiSecret);
    hmac.update(timestamp + apiKey + '5000' + params);
    return hmac.digest('hex');
  }

  // Test 1: Basic ticker request with authentication
  try {
    console.log('\n🧪 Test 1: Authenticated ticker request...');
    
    const params = 'category=linear&limit=5';
    const timestamp = Date.now().toString();
    const signature = generateSignature(params, timestamp, apiSecret);
    
    const url = `https://api.bybit.com/v5/market/tickers?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000',
        'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.retCode === 0) {
      console.log('✅ Authenticated request successful!');
      console.log(`📊 Received ${data.result.list.length} tickers`);
      console.log(`Sample: ${data.result.list[0].symbol} = $${data.result.list[0].lastPrice}`);
    } else {
      console.log('❌ Authenticated request failed');
      console.log('Status:', response.status);
      console.log('Response:', data);
    }
    
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
  }

  // Test 2: Compare with unauthenticated request
  try {
    console.log('\n🧪 Test 2: Unauthenticated request (for comparison)...');
    
    const url = 'https://api.bybit.com/v5/market/tickers?category=linear&limit=5';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Unauthenticated request also works (no blocking currently)');
      console.log(`📊 Received ${data.result.list.length} tickers`);
    } else {
      console.log('❌ Unauthenticated request blocked');
      console.log('Status:', response.status, response.statusText);
      console.log('🎯 This confirms API key authentication will help!');
    }
    
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
    console.log('🎯 This suggests network/blocking issues that API keys should resolve');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Add your API credentials to Vercel environment variables');
  console.log('2. Deploy the updated code');
  console.log('3. Test the candlestick screener with authentication');
}

testBybitAuth().catch(console.error); 