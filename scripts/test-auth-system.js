#!/usr/bin/env node

/**
 * Authentication System Test Script
 * 
 * This script tests various aspects of the CoinBox authentication system to ensure
 * that the fixes we've made are working correctly.
 */

const { execSync } = require('child_process');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const readline = require('readline');

// Test configuration
const config = {
  apiBaseUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:9005',
  testCredentials: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  }
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Main test function
 */
async function runTests() {
  console.log('='.repeat(50));
  console.log('CoinBox Authentication System Test');
  console.log('='.repeat(50));
  
  // Test 1: Start the development server
  console.log('\n📋 Test 1: Starting dev server...');
  try {
    // Start the server in the background
    console.log('Server should be started manually using "npm run dev" in another terminal');
    rl.question('\nIs the dev server running? (y/n): ', async (answer) => {
      if (answer.toLowerCase() !== 'y') {
        console.log('❌ Please start the dev server and run this script again.');
        rl.close();
        return;
      }
      
      await runRemainingTests();
    });
  } catch (error) {
    console.error('❌ Error starting dev server:', error);
    process.exit(1);
  }
}

async function runRemainingTests() {
  // Test 2: Verify API endpoints are responding
  console.log('\n📋 Test 2: Testing API endpoints...');
  try {
    const response = await fetch(`${config.apiBaseUrl}/auth/session`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API endpoints are responding correctly');
    } else {
      console.log('⚠️ API responded with status:', response.status);
      console.log('Response data:', data);
    }
  } catch (error) {
    console.error('❌ API endpoint test failed:', error);
  }
  
  // Test 3: Test WebSocket connection
  console.log('\n📋 Test 3: Testing WebSocket connection...');
  try {
    const ws = new WebSocket(config.wsUrl);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established successfully');
      setTimeout(() => {
        ws.close();
        testFirebaseImports();
      }, 1000);
    });
    
    ws.on('message', (data) => {
      console.log('Received WebSocket message:', data.toString());
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket connection failed:', error);
      testFirebaseImports();
    });
  } catch (error) {
    console.error('❌ WebSocket test failed:', error);
    testFirebaseImports();
  }
}

function testFirebaseImports() {
  // Test 4: Test Firebase imports with Node
  console.log('\n📋 Test 4: Testing Firebase imports in Node environment...');
  try {
    // Create a temporary test file
    const fs = require('fs');
    const testFilePath = './firebase-import-test.js';
    
    fs.writeFileSync(testFilePath, `
      const { adminDb } = require('../src/lib/firebase-admin');
      console.log('✅ Firebase Admin imported successfully in Node');
      process.exit(0);
    `);
    
    try {
      execSync('node ' + testFilePath, { stdio: 'inherit' });
      console.log('✅ Firebase Admin imports are working correctly in Node');
    } catch (error) {
      console.error('❌ Firebase Admin import test failed:', error);
    }
    
    // Clean up
    fs.unlinkSync(testFilePath);
    
    console.log('\n='.repeat(50));
    console.log('Authentication System Test Completed');
    console.log('='.repeat(50));
    rl.close();
  } catch (error) {
    console.error('❌ Error in Firebase import test:', error);
    rl.close();
  }
}

// Run the tests
runTests();
