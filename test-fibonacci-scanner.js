// Test script for Fibonacci Retracement Scanner
// Run with: node test-fibonacci-scanner.js

const BASE_URL = 'http://localhost:3000';

async function testFibonacciScanner() {
  console.log('🎯 Testing Fibonacci Retracement Scanner...\n');

  try {
    // Test 1: Basic scan with default parameters
    console.log('📊 Test 1: Basic scan with default parameters');
    const scanResponse = await fetch(`${BASE_URL}/api/fibonacci-scanner?limit=10&minRetracement=30&maxRetracement=80&requirePocConfluence=true`);
    
    if (!scanResponse.ok) {
      throw new Error(`Scan failed: ${scanResponse.status} ${scanResponse.statusText}`);
    }

    const scanData = await scanResponse.json();
    console.log(`✅ Scan completed: ${scanData.filteredCount}/${scanData.totalScanned} coins found in ${scanData.scanTime}ms`);
    
    if (scanData.fibAnalyses && scanData.fibAnalyses.length > 0) {
      console.log('\n🎯 Top Fibonacci Opportunities:');
      scanData.fibAnalyses.slice(0, 3).forEach((analysis, index) => {
        console.log(`${index + 1}. ${analysis.symbol}`);
        console.log(`   Trend: ${analysis.trend.toUpperCase()}`);
        console.log(`   Retracement: ${analysis.retracePercent.toFixed(1)}%`);
        console.log(`   Quality: ${analysis.quality.toUpperCase()}`);
        console.log(`   POC Confluence: ${analysis.confluence ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   Current Price: $${formatPrice(analysis.currentPrice)}`);
        console.log(`   24h Change: ${analysis.priceChange24h >= 0 ? '+' : ''}${analysis.priceChange24h.toFixed(2)}%`);
        console.log('');
      });

      // Test 2: Detailed analysis for the first coin
      const firstCoin = scanData.fibAnalyses[0];
      console.log(`\n🔍 Test 2: Getting detailed analysis for ${firstCoin.symbol}`);
      
      const detailResponse = await fetch(`${BASE_URL}/api/fibonacci-scanner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol: firstCoin.symbol })
      });

      if (!detailResponse.ok) {
        throw new Error(`Detail analysis failed: ${detailResponse.status} ${detailResponse.statusText}`);
      }

      const detailData = await detailResponse.json();
      console.log('✅ Detailed analysis completed');
      console.log(`📊 Analysis for ${detailData.metadata.symbol}:`);
      console.log(`   ${detailData.metadata.interpretation.trend}`);
      console.log(`   ${detailData.metadata.interpretation.retracement}`);
      console.log(`   Quality: ${detailData.metadata.interpretation.quality}`);
      console.log(`   ${detailData.metadata.interpretation.pocConfluence}`);
      console.log(`   💡 ${detailData.metadata.interpretation.recommendation}`);

      // Show fibonacci levels
      if (detailData.analysis.fibLevels) {
        console.log('\n🎯 Fibonacci Levels:');
        detailData.analysis.fibLevels.forEach(level => {
          const isTarget = detailData.analysis.targetLevels.some(t => t.level === level.level);
          const distance = Math.abs(level.price - detailData.analysis.currentPrice) / detailData.analysis.currentPrice * 100;
          console.log(`   ${level.level === 0 ? 'Swing Low' : level.level === 1 ? 'Swing High' : `${(level.level * 100).toFixed(1)}%`}${isTarget ? ' 🎯' : ''}: $${formatPrice(level.price)} (${distance.toFixed(2)}% away)`);
        });
      }

      // Show POC if available
      if (detailData.analysis.pocLevel) {
        console.log(`\n📊 Point of Control (POC): $${formatPrice(detailData.analysis.pocLevel.price)}`);
        console.log(`   Volume: ${detailData.analysis.pocLevel.percentage.toFixed(2)}% of total`);
      }
    } else {
      console.log('📊 No fibonacci opportunities found with current parameters');
    }

    // Test 3: Scan with different parameters
    console.log('\n📊 Test 3: Scan with relaxed parameters (no POC required)');
    const relaxedResponse = await fetch(`${BASE_URL}/api/fibonacci-scanner?limit=15&minRetracement=20&maxRetracement=90&requirePocConfluence=false`);
    
    if (relaxedResponse.ok) {
      const relaxedData = await relaxedResponse.json();
      console.log(`✅ Relaxed scan: ${relaxedData.filteredCount}/${relaxedData.totalScanned} coins found`);
      console.log(`   With POC confluence: ${relaxedData.fibAnalyses.filter(a => a.confluence).length}`);
      console.log(`   High quality: ${relaxedData.fibAnalyses.filter(a => a.quality === 'high').length}`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📖 How to use:');
    console.log('1. Open http://localhost:3000/fibonacci in your browser');
    console.log('2. Adjust scan parameters as needed');
    console.log('3. Run scans to find fibonacci retracement opportunities');
    console.log('4. Click "Analyze" on any coin for detailed fibonacci analysis');
    console.log('5. Look for HIGH quality setups with POC confluence for best probability');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the Next.js server is running: npm run dev');
    console.log('2. Check that the fibonacci-scanner API endpoint is working');
    console.log('3. Verify Bybit API is accessible and not rate-limited');
  }
}

function formatPrice(price) {
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(3);
  return price.toFixed(2);
}

// Run the test
testFibonacciScanner(); 