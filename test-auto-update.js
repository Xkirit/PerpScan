#!/usr/bin/env node

/**
 * Test script for candlestick auto-update functionality
 * Usage: node test-auto-update.js [action] [timeframes]
 * 
 * Actions:
 * - status: Check current status and schedule
 * - trigger: Manually trigger auto-update
 * - force: Force update specific timeframes
 * 
 * Examples:
 * node test-auto-update.js status
 * node test-auto-update.js trigger
 * node test-auto-update.js force 1h,4h
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const SECRET = process.env.CANDLESTICK_CRON_SECRET || 'default-secret';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}/api/${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SECRET}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`🔗 ${method} ${url}`);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}:`, data);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function checkStatus() {
  console.log('📊 Checking auto-update status...\n');
  
  const status = await makeRequest('candlestick-auto-update');
  if (status) {
    console.log('⏰ Current Status:');
    console.log(`  Time: ${status.currentTime}`);
    console.log(`  UTC Hour: ${status.currentUTCHour}`);
    console.log(`  UTC Minute: ${status.currentUTCMinute}`);
    console.log(`  Timeframes to update now: ${status.timeframesToUpdateNow.join(', ') || 'none'}`);
    
    console.log('\n📅 Update Schedule:');
    Object.entries(status.updateSchedule).forEach(([tf, schedule]) => {
      console.log(`  ${tf}: ${schedule}`);
    });
    
    console.log('\n⏭️ Next Update Times:');
    Object.entries(status.nextUpdateTimes).forEach(([tf, timestamp]) => {
      const date = new Date(timestamp);
      console.log(`  ${tf}: ${date.toISOString()}`);
    });
  }
}

async function triggerUpdate() {
  console.log('🚀 Triggering auto-update...\n');
  
  const result = await makeRequest('candlestick-auto-update', 'POST');
  if (result) {
    if (result.success) {
      console.log('✅ Auto-update completed successfully');
      if (result.timeframesUpdated?.length > 0) {
        console.log(`📈 Updated timeframes: ${result.timeframesUpdated.join(', ')}`);
      } else {
        console.log('📊 No timeframes needed updating');
      }
    } else {
      console.log('❌ Auto-update failed:', result.error);
    }
  }
}

async function forceUpdate(timeframes) {
  console.log(`🔄 Forcing update for timeframes: ${timeframes.join(', ')}\n`);
  
  const result = await makeRequest('candlestick-compute', 'POST', {
    timeframes,
    force: true
  });
  
  if (result) {
    if (result.success) {
      console.log('✅ Force update completed successfully');
      console.log(`⏱️ Duration: ${result.duration}s`);
      console.log(`📊 Total scanned: ${result.totalScanned}`);
      console.log('📈 Patterns found:');
      Object.entries(result.patterns).forEach(([tf, count]) => {
        console.log(`  ${tf}: ${count}`);
      });
    } else {
      console.log('❌ Force update failed:', result.error);
    }
  }
}

async function main() {
  const action = process.argv[2] || 'status';
  const timeframes = process.argv[3] ? process.argv[3].split(',') : ['1h', '4h', '1d'];
  
  console.log(`🎯 Action: ${action}\n`);
  
  switch (action) {
    case 'status':
      await checkStatus();
      break;
      
    case 'trigger':
      await triggerUpdate();
      break;
      
    case 'force':
      await forceUpdate(timeframes);
      break;
      
    default:
      console.log('❌ Invalid action. Use: status, trigger, or force');
      console.log('Examples:');
      console.log('  node test-auto-update.js status');
      console.log('  node test-auto-update.js trigger');
      console.log('  node test-auto-update.js force 1h,4h');
      process.exit(1);
  }
}

main().catch(console.error); 