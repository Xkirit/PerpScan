#!/usr/bin/env node

const https = require('https');

const BASE_URL = process.argv[2] || 'http://localhost:3000';

async function testScanNow() {
  console.log('🧪 Testing Scan Now functionality...\n');
  
  // Test 1: Regular fetch (should return cached data)
  console.log('1️⃣ Testing regular fetch...');
  const start1 = Date.now();
  
  try {
    const response1 = await fetch(`${BASE_URL}/api/candlestick-screener`);
    const data1 = await response1.json();
    const duration1 = Date.now() - start1;
    
    console.log(`✅ Regular fetch: ${duration1}ms`);
    console.log(`   Patterns: 1h=${data1['1h']?.length || 0}, 4h=${data1['4h']?.length || 0}, 1d=${data1['1d']?.length || 0}`);
    console.log(`   Message: ${data1.message || 'None'}\n`);
  } catch (error) {
    console.log(`❌ Regular fetch failed: ${error.message}\n`);
  }
  
  // Test 2: Force scan (should trigger background processing)
  console.log('2️⃣ Testing force scan...');
  const start2 = Date.now();
  
  try {
    const response2 = await fetch(`${BASE_URL}/api/candlestick-screener?force=true`);
    const data2 = await response2.json();
    const duration2 = Date.now() - start2;
    
    console.log(`✅ Force scan: ${duration2}ms`);
    console.log(`   Patterns: 1h=${data2['1h']?.length || 0}, 4h=${data2['4h']?.length || 0}, 1d=${data2['1d']?.length || 0}`);
    console.log(`   Message: ${data2.message || 'None'}`);
    console.log(`   Scanning: ${data2.scanning || false}`);
    console.log(`   Warning: ${data2.warning || 'None'}\n`);
    
    if (data2.scanning) {
      console.log('🔄 Background scan was triggered successfully!');
      console.log('⏱️  Wait 45-60 seconds then refresh to see updated results.\n');
    }
  } catch (error) {
    console.log(`❌ Force scan failed: ${error.message}\n`);
  }
  
  // Test 3: Check if compute endpoint is accessible (should timeout on Vercel)
  console.log('3️⃣ Testing direct compute endpoint (should timeout on Vercel)...');
  const start3 = Date.now();
  
  try {
    const response3 = await fetch(`${BASE_URL}/api/candlestick-compute?action=status`);
    const data3 = await response3.json();
    const duration3 = Date.now() - start3;
    
    console.log(`✅ Compute status: ${duration3}ms`);
    console.log(`   Success: ${data3.success}`);
    console.log(`   Cached: ${data3.cached}`);
    console.log(`   Total patterns: ${data3.patterns?.total || 0}\n`);
  } catch (error) {
    console.log(`❌ Compute status failed: ${error.message}\n`);
  }
}

// Run the test
testScanNow().catch(console.error); 