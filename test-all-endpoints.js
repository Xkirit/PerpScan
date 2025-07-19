#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TIMEOUT = 30000; // 30 seconds timeout

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log results
function logResult(endpoint, method, status, response, error = null) {
  const result = {
    endpoint,
    method,
    status,
    success: status >= 200 && status < 300,
    response: response ? (typeof response === 'object' ? JSON.stringify(response).substring(0, 200) + '...' : response) : null,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  
  testResults.details.push(result);
  testResults.total++;
  
  if (result.success) {
    testResults.passed++;
    console.log(`✅ ${method} ${endpoint} - ${status}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${method} ${endpoint} - ${status}${error ? ` (${error.message})` : ''}`);
  }
}

// Test function
async function testEndpoint(endpoint, method = 'GET', params = {}, body = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      timeout: TIMEOUT,
      params: method === 'GET' ? params : undefined,
      data: method === 'POST' ? body : undefined
    };

    const response = await axios[method.toLowerCase()](url, config);
    logResult(endpoint, method, response.status, response.data);
    return response.data;
  } catch (error) {
    const status = error.response?.status || 0;
    const data = error.response?.data || null;
    logResult(endpoint, method, status, data, error);
    return null;
  }
}

// Test all endpoints
async function runAllTests() {
  console.log('🚀 Starting comprehensive API endpoint tests...\n');

  // 1. Health Check (should always work)
  console.log('📋 Testing Health Endpoints...');
  await testEndpoint('/health');

  // 2. Basic Market Data
  console.log('\n📊 Testing Market Data Endpoints...');
  await testEndpoint('/btc-price');
  await testEndpoint('/btc-price', 'GET', { symbol: 'ETHUSDT' });
  await testEndpoint('/tickers');
  await testEndpoint('/tickers', 'GET', { symbol: 'BTCUSDT', limit: 5 });

  // 3. Trending and Analysis
  console.log('\n📈 Testing Analysis Endpoints...');
  await testEndpoint('/trending-coins');
  await testEndpoint('/account-ratio');
  await testEndpoint('/institutional-flows');

  // 4. Technical Analysis
  console.log('\n🔍 Testing Technical Analysis Endpoints...');
  await testEndpoint('/fibonacci-scanner');
  await testEndpoint('/fibonacci-scanner', 'GET', { 
    minRetracement: 30, 
    maxRetracement: 70, 
    limit: 10 
  });
  
  // Test Fibonacci POST endpoint
  await testEndpoint('/fibonacci-scanner', 'POST', {}, { symbol: 'BTCUSDT' });

  // 5. Candlestick Analysis
  console.log('\n🕯️ Testing Candlestick Endpoints...');
  await testEndpoint('/candlestick-screener');
  await testEndpoint('/candlestick-screener', 'GET', { force: 'true' });
  await testEndpoint('/candlestick-compute');
  await testEndpoint('/candlestick-init');

  // 6. Historical Data
  console.log('\n📚 Testing Historical Data Endpoints...');
  await testEndpoint('/historical');
  await testEndpoint('/historical-oi');

  // 7. On-chain Data
  console.log('\n⛓️ Testing On-chain Endpoints...');
  await testEndpoint('/onchain-screener');

  // 8. Kline Data
  console.log('\n📉 Testing Kline Endpoints...');
  await testEndpoint('/kline');

  // 9. Binance Data
  console.log('\n🪙 Testing Binance Endpoints...');
  await testEndpoint('/binance-ls-ratio');

  // 10. AI Chat
  console.log('\n🤖 Testing AI Chat Endpoints...');
  await testEndpoint('/ai-chat', 'POST', {}, { 
    message: 'What is the current Bitcoin price?' 
  });

  // 11. Analysis
  console.log('\n📊 Testing Analysis Endpoints...');
  await testEndpoint('/analyze');

  // 12. Redis and Debug Endpoints
  console.log('\n🔧 Testing Debug Endpoints...');
  await testEndpoint('/redis-info');
  await testEndpoint('/debug-redis');
  await testEndpoint('/clear-redis');

  // 13. Auto-update endpoints
  console.log('\n🔄 Testing Auto-update Endpoints...');
  await testEndpoint('/candlestick-compute/candlestick-auto-update');

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(result => !result.success)
      .forEach(result => {
        console.log(`  - ${result.method} ${result.endpoint}: ${result.status}${result.error ? ` (${result.error})` : ''}`);
      });
  }

  console.log('\n✅ PASSED TESTS:');
  testResults.details
    .filter(result => result.success)
    .forEach(result => {
      console.log(`  - ${result.method} ${result.endpoint}: ${result.status}`);
    });

  // Save detailed results to file
  const fs = require('fs');
  const resultsFile = `test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsFile}`);

  return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testEndpoint }; 