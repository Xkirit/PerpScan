#!/usr/bin/env node

const BASE_URL = process.argv[2] || 'http://localhost:3000';

async function testSmartScan() {
  console.log('🧪 Testing Smart Scan Logic...\n');
  
  // Get current time info
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  
  console.log(`⏰ Current UTC time: ${now.toISOString()}`);
  console.log(`   Hour: ${currentHour}, Minute: ${currentMinute}`);
  console.log(`   Is new candle time (0-2 min): ${currentMinute <= 2}`);
  console.log(`   Is 4h boundary (0,4,8,12,16,20): ${currentHour % 4 === 0}`);
  console.log(`   Is daily boundary (0 UTC): ${currentHour === 0}\n`);
  
  // Expected timeframes based on current time
  const expectedTimeframes = [];
  if (currentMinute <= 2) {
    expectedTimeframes.push('1h');
    if (currentHour % 4 === 0) expectedTimeframes.push('4h');
    if (currentHour === 0) expectedTimeframes.push('1d');
  }
  
  console.log(`📋 Expected timeframes to update: [${expectedTimeframes.join(', ') || 'none'}]\n`);
  
  // Test 1: Regular fetch
  console.log('1️⃣ Testing regular fetch...');
  try {
    const response1 = await fetch(`${BASE_URL}/api/candlestick-screener`);
    const data1 = await response1.json();
    
    console.log(`   Patterns: 1h=${data1['1h']?.length || 0}, 4h=${data1['4h']?.length || 0}, 1d=${data1['1d']?.length || 0}`);
    console.log(`   Last updated: ${data1.timestamp}`);
    console.log(`   Message: ${data1.message || 'None'}\n`);
  } catch (error) {
    console.log(`❌ Regular fetch failed: ${error.message}\n`);
  }
  
  // Test 2: Smart scan
  console.log('2️⃣ Testing smart scan...');
  const start = Date.now();
  
  try {
    const response2 = await fetch(`${BASE_URL}/api/candlestick-screener?force=true`);
    const data2 = await response2.json();
    const duration = Date.now() - start;
    
    console.log(`✅ Smart scan completed in ${duration}ms`);
    console.log(`   Scanning: ${data2.scanning || false}`);
    console.log(`   Timeframes being scanned: [${data2.scanningTimeframes?.join(', ') || 'none'}]`);
    console.log(`   Message: ${data2.message || 'None'}`);
    console.log(`   Patterns: 1h=${data2['1h']?.length || 0}, 4h=${data2['4h']?.length || 0}, 1d=${data2['1d']?.length || 0}\n`);
    
    // Verify logic
    if (expectedTimeframes.length === 0) {
      if (!data2.scanning) {
        console.log('✅ Logic correct: No candles closed, no scan needed');
      } else {
        console.log('⚠️  Logic check: Expected no scan but scanning=true (may be stale data)');
      }
    } else {
      if (data2.scanning && data2.scanningTimeframes) {
        const actualTfs = data2.scanningTimeframes.sort();
        const expectedTfs = expectedTimeframes.sort();
        if (JSON.stringify(actualTfs) === JSON.stringify(expectedTfs)) {
          console.log('✅ Logic correct: Scanning expected timeframes');
        } else {
          console.log(`⚠️  Logic mismatch: Expected [${expectedTfs.join(', ')}], got [${actualTfs.join(', ')}]`);
        }
      } else {
        console.log('⚠️  Logic check: Expected scanning but no scan initiated');
      }
    }
    
  } catch (error) {
    console.log(`❌ Smart scan failed: ${error.message}\n`);
  }
  
  // Test 3: Check auto-update endpoint for comparison
  console.log('3️⃣ Testing auto-update timeframe detection...');
  try {
    const response3 = await fetch(`${BASE_URL}/api/candlestick-auto-update`);
    const data3 = await response3.json();
    
    console.log(`   Auto-update timeframes: [${data3.timeframesToUpdateNow?.join(', ') || 'none'}]`);
    console.log(`   Current UTC: ${data3.currentUTCHour}:${data3.currentUTCMinute.toString().padStart(2, '0')}`);
    console.log(`   Next updates: 1h=${new Date(data3.nextUpdateTimes?.['1h']).toISOString()}`);
    console.log(`                4h=${new Date(data3.nextUpdateTimes?.['4h']).toISOString()}`);
    console.log(`                1d=${new Date(data3.nextUpdateTimes?.['1d']).toISOString()}\n`);
  } catch (error) {
    console.log(`❌ Auto-update check failed: ${error.message}\n`);
  }
}

// Run the test
testSmartScan().catch(console.error); 