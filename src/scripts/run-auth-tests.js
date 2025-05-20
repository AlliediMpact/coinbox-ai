/**
 * CoinBox Authentication Testing Tool
 * 
 * This script provides a command-line interface for testing different aspects
 * of the CoinBox authentication system.
 */

const readline = require('readline');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Banner display
const displayBanner = () => {
  console.log('=======================================');
  console.log('CoinBox Authentication Testing Tool');
  console.log('=======================================\n');
};

// Display menu and get user choice
const showMenu = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('CoinBox Authentication Testing Tool\n');
  console.log('Choose a test to run:');
  console.log('1. Run All Authentication Tests');
  console.log('2. Test Standard Login Flow');
  console.log('3. Test Rate Limiting');
  console.log('4. Test MFA Functionality');
  console.log('5. Test Authentication Logging');
  console.log('6. Start Auth Test UI');
  console.log('7. Run Security Tests');
  console.log('8. Exit\n');

  return new Promise((resolve) => {
    rl.question('Enter your choice: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Execute tests based on user choice
const runTests = async (choice) => {
  try {
    switch (choice) {
      case '1':
        console.log('\nRunning all authentication tests...\n');
        execSync('npm test -- --testPathPattern=src/tests/auth', { stdio: 'inherit' });
        break;

      case '2':
        console.log('\nTesting standard login flow...\n');
        // Start the development server in the background
        console.log('Starting development server...');
        const serverProcess = require('child_process').spawn('npm', ['run', 'dev'], {
          stdio: 'ignore',
          detached: true
        });
        
        // Give the server time to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('\nNavigate to http://localhost:3000/dashboard/test-auth to test the standard login flow');
        console.log('Press Ctrl+C when finished to stop the server');
        
        // Wait for user input before continuing
        await new Promise(resolve => {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          rl.question('\nPress Enter when finished testing...', () => {
            rl.close();
            resolve();
          });
        });
        
        // Kill the server process
        if (serverProcess && !serverProcess.killed) {
          process.kill(-serverProcess.pid);
        }
        break;

      case '3':
        console.log('\nTesting rate limiting...\n');
        execSync('node src/tests/rate-limit-test.js', { stdio: 'inherit' });
        break;

      case '4':
        console.log('\nTesting MFA functionality...\n');
        console.log('Starting development server for MFA testing...');
        console.log('Navigate to http://localhost:3000/dashboard/security/mfa after the server starts');
        execSync('npm run dev', { stdio: 'inherit' });
        break;

      case '5':
        console.log('\nTesting authentication logging...\n');
        execSync('node src/tests/auth-logging-test.js', { stdio: 'inherit' });
        break;

      case '6':
        console.log('\nStarting Authentication Test UI...\n');
        console.log('Navigate to http://localhost:3000/dashboard/test-auth after the server starts');
        execSync('npm run dev', { stdio: 'inherit' });
        break;

      case '7':
        console.log('\nRunning Security Tests...\n');
        execSync('bash scripts/test-auth-system.sh security', { stdio: 'inherit' });
        break;

      case '8':
        console.log('\nExiting...\n');
        break;

      default:
        console.log('\nInvalid choice. Please try again.\n');
        break;
    }
  } catch (error) {
    console.error(`\nError running tests: ${error.message}`);
  }
};

// Check if we have command line arguments
const handleCommandLineArgs = () => {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const testType = args[0];
    
    switch (testType) {
      case 'standard':
        return '2';
      case 'rate-limiting':
        return '3';
      case 'mfa':
        return '4';
      case 'logging':
        return '5';
      case 'ui':
        return '6';
      case 'security':
        return '7';
      case 'all':
        return '1';
      default:
        return null;
    }
  }
  return null;
};

// Main function
const main = async () => {
  displayBanner();
  
  // Check for command line args first
  const commandChoice = handleCommandLineArgs();
  
  if (commandChoice) {
    await runTests(commandChoice);
  } else {
    // Interactive mode
    const choice = await showMenu();
    await runTests(choice);
  }
};

// Run the main function
main().catch(console.error);