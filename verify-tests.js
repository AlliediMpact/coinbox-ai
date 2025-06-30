#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== CoinBox AI Testing Environment Verification ===\n');

// Check if we're in the right directory
console.log('Current working directory:', process.cwd());

// Check if package.json exists
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('✓ package.json found');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('✓ Project name:', packageJson.name);
  console.log('✓ Available test scripts:');
  Object.keys(packageJson.scripts).filter(key => key.includes('test')).forEach(script => {
    console.log(`  - ${script}: ${packageJson.scripts[script]}`);
  });
} else {
  console.log('✗ package.json not found');
}

// Check if test files exist
const testDirs = ['src/tests', 'src/lib/__tests__', 'src/e2e-tests'];
testDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${dir} directory exists`);
    const files = fs.readdirSync(fullPath).filter(file => file.includes('.test.'));
    console.log(`  - Found ${files.length} test files`);
    files.slice(0, 5).forEach(file => console.log(`    ${file}`));
    if (files.length > 5) console.log(`    ... and ${files.length - 5} more`);
  } else {
    console.log(`✗ ${dir} directory not found`);
  }
});

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✓ node_modules directory exists');
} else {
  console.log('✗ node_modules directory not found');
}

// Check for vitest
const vitestPath = path.join(process.cwd(), 'node_modules', '.bin', 'vitest');
if (fs.existsSync(vitestPath)) {
  console.log('✓ vitest binary found');
} else {
  console.log('✗ vitest binary not found');
}

console.log('\n=== Verification Complete ===');
