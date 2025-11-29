/**
 * test.js - MicroGate System Test Suite
 * Run this to verify all components are working
 */

const http = require('http');
const https = require('https');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}
╔═══════════════════════════════════════╗
║   MICROGATE SYSTEM TEST SUITE         ║
╔═══════════════════════════════════════╝
${colors.reset}`);

// Test results
let passed = 0;
let failed = 0;

function log(message, status) {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  console.log(`${color}${icon} ${message}${colors.reset}`);
  if (status === 'pass') passed++;
  if (status === 'fail') failed++;
}

// HTTP GET request helper
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

// Test suite
async function runTests() {
  console.log('\n📡 Testing Backend...\n');

  // Test 1: Backend Health Check
  try {
    const result = await httpGet('http://localhost:3000/api/health');
    if (result.status === 200 && result.data.status === 'healthy') {
      log('Backend health endpoint responding', 'pass');
      log(`  Network: ${result.data.network}`, 'info');
      log(`  Wallet: ${result.data.wallet}`, 'info');
    } else {
      log('Backend health check failed', 'fail');
    }
  } catch (err) {
    log(`Backend not responding: ${err.message}`, 'fail');
  }

  // Test 2: Frontend Available
  console.log('\n🌐 Testing Frontend...\n');
  try {
    const result = await httpGet('http://localhost:5173');
    if (result.status === 200) {
      log('Frontend server responding', 'pass');
    } else {
      log('Frontend returned unexpected status', 'fail');
    }
  } catch (err) {
    log(`Frontend not accessible: ${err.message}`, 'fail');
  }

  // Test 3: Base Sepolia RPC
  console.log('\n⛓️  Testing Blockchain RPC...\n');
  try {
    const result = await httpGet('https://sepolia.base.org');
    if (result.status === 200 || result.status === 405) {
      log('Base Sepolia RPC accessible', 'pass');
    } else {
      log('RPC endpoint issue', 'fail');
    }
  } catch (err) {
    log(`RPC not accessible: ${err.message}`, 'fail');
  }

  // Summary
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${colors.cyan}TEST RESULTS${colors.reset}`);
  console.log(`${'='.repeat(40)}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${'='.repeat(40)}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✓ All tests passed! System is ready.${colors.reset}\n`);
    console.log('Next steps:');
    console.log('  1. Open http://localhost:5173 in your browser');
    console.log('  2. Check the cyberpunk dashboard');
    console.log('  3. Verify balance is loading');
    console.log('  4. Test "ACTIVATE AGENT" button\n');
  } else {
    console.log(`${colors.red}✗ Some tests failed. Check the errors above.${colors.reset}\n`);
    console.log('Troubleshooting:');
    console.log('  1. Ensure npm start is running');
    console.log('  2. Check no port conflicts (3000, 5173)');
    console.log('  3. Verify network connectivity');
    console.log('  4. Check console for errors\n');
  }
}

// Run tests
runTests().catch(err => {
  console.error(`${colors.red}Test suite error:${colors.reset}`, err);
  process.exit(1);
});
