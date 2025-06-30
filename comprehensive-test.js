#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, 'test-results.log');

function log(message) {
  console.log(message);
  fs.appendFileSync(outputFile, message + '\n');
}

// Clear previous results
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

log('=== CoinBox AI Comprehensive Test Suite ===');
log(`Started at: ${new Date().toISOString()}`);
log('');

// Test 1: Environment Check
try {
  log('1. Environment Check:');
  log('   Current directory: ' + process.cwd());
  log('   Node version: ' + process.version);
  
  // Check if essential files exist
  const essentialFiles = [
    'package.json',
    'vitest.config.ts',
    'src/tests/setup.ts'
  ];
  
  essentialFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`   ✓ ${file} exists`);
    } else {
      log(`   ✗ ${file} missing`);
    }
  });
  
} catch (error) {
  log(`   Error in environment check: ${error.message}`);
}

// Test 2: Dependencies Check
try {
  log('\n2. Dependencies Check:');
  const output = execSync('npm list --depth=0', { encoding: 'utf8', timeout: 30000 });
  log('   ✓ Dependencies verified');
} catch (error) {
  log(`   ⚠ Dependencies check failed: ${error.message}`);
}

// Test 3: TypeScript Check
try {
  log('\n3. TypeScript Check:');
  execSync('npx tsc --noEmit', { encoding: 'utf8', timeout: 60000 });
  log('   ✓ TypeScript compilation successful');
} catch (error) {
  log(`   ⚠ TypeScript issues found: ${error.message}`);
}

// Test 4: Lint Check
try {
  log('\n4. Lint Check:');
  execSync('npm run lint', { encoding: 'utf8', timeout: 60000 });
  log('   ✓ Linting passed');
} catch (error) {
  log(`   ⚠ Lint issues found: ${error.message}`);
}

// Test 5: Unit Tests
try {
  log('\n5. Unit Tests:');
  const output = execSync('npm run test', { encoding: 'utf8', timeout: 120000 });
  log('   ✓ Unit tests passed');
  log('   Output: ' + output.substring(0, 500) + '...');
} catch (error) {
  log(`   ⚠ Unit tests failed: ${error.message}`);
}

// Test 6: Build Test
try {
  log('\n6. Build Test:');
  execSync('npm run build', { encoding: 'utf8', timeout: 180000 });
  log('   ✓ Build successful');
} catch (error) {
  log(`   ⚠ Build failed: ${error.message}`);
}

// Test 7: Security Audit
try {
  log('\n7. Security Audit:');
  const output = execSync('npm audit --audit-level=high', { encoding: 'utf8', timeout: 60000 });
  log('   ✓ Security audit passed');
} catch (error) {
  log(`   ⚠ Security vulnerabilities found: ${error.message}`);
}

log('\n=== Test Suite Complete ===');
log(`Completed at: ${new Date().toISOString()}`);
log(`Results saved to: ${outputFile}`);

console.log(`\nTest results have been saved to: ${outputFile}`);
console.log('Please check the file for detailed results.');
