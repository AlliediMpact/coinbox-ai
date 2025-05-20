#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Configure the interface for command input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Check if test configuration exists
const testConfigPath = path.join(__dirname, '..', 'test-config.json');
const testConfigExamplePath = path.join(__dirname, '..', 'test-config.example.json');

if (!fs.existsSync(testConfigPath)) {
  console.log(`${colors.yellow}Warning: test-config.json not found.${colors.reset}`);
  console.log(`Creating from example template...`);
  
  try {
    const exampleConfig = fs.readFileSync(testConfigExamplePath);
    fs.writeFileSync(testConfigPath, exampleConfig);
    console.log(`${colors.green}Created test-config.json from template.${colors.reset}`);
    console.log(`Please edit ${testConfigPath} with your test credentials.`);
  } catch (error) {
    console.error(`${colors.red}Error creating test config: ${error.message}${colors.reset}`);
  }
}

// Main menu options
const options = [
  { id: 1, name: 'Run All Authentication Tests', cmd: runAllTests },
  { id: 2, name: 'Test Standard Login Flow', cmd: testStandardLogin },
  { id: 3, name: 'Test Rate Limiting', cmd: testRateLimiting },
  { id: 4, name: 'Test MFA Functionality', cmd: testMfa },
  { id: 5, name: 'Test Authentication Logging', cmd: testAuthLogging },
  { id: 6, name: 'Start Auth Test UI', cmd: startTestUi },
  { id: 7, name: 'Run Security Tests', cmd: runSecurityTests },
  { id: 8, name: 'Exit', cmd: exitProgram }
];

// Display the main menu
function showMenu() {
  console.log(`\n${colors.bright}${colors.blue}CoinBox Authentication Testing Tool${colors.reset}\n`);
  console.log('Choose a test to run:');
  
  options.forEach(option => {
    console.log(`${option.id}. ${option.name}`);
  });
  
  rl.question('\nEnter your choice: ', (answer) => {
    const option = options.find(opt => opt.id === parseInt(answer));
    
    if (option) {
      option.cmd();
    } else {
      console.log(`${colors.red}Invalid option. Please try again.${colors.reset}`);
      showMenu();
    }
  });
}

// Function to run a command in the terminal
function runCommand(command, args = [], cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.dim}$ ${command} ${args.join(' ')}${colors.reset}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// Test functions
async function runAllTests() {
  console.log(`\n${colors.bright}Running all authentication tests...${colors.reset}\n`);
  
  try {
    await runCommand('npm', ['test', '--', '--testPathPattern=src/tests/auth']);
    console.log(`\n${colors.green}All tests completed.${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}Error running tests: ${error.message}${colors.reset}`);
  }
  
  returnToMenu();
}

async function testStandardLogin() {
  console.log(`\n${colors.bright}Testing standard login flow...${colors.reset}\n`);
  
  try {
    await runCommand('node', ['-e', `
      const { testStandardLogin } = require('../lib/auth-test-utils');
      const config = require('../test-config.json');
      
      async function run() {
        try {
          const result = await testStandardLogin(config.testUser.email, config.testUser.password);
          console.log(result);
        } catch (error) {
          console.error('Test failed:', error);
        }
      }
      
      run();
    `]);
  } catch (error) {
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
  }
  
  returnToMenu();
}

async function testRateLimiting() {
  console.log(`\n${colors.bright}Testing rate limiting functionality...${colors.reset}\n`);
  
  try {
    await runCommand('node', ['-e', `
      const { testRateLimiting } = require('../lib/auth-test-utils');
      const config = require('../test-config.json');
      
      async function run() {
        try {
          const results = await testRateLimiting(config.testUser.email, 'wrongpassword', 7);
          console.log(results.join('\\n'));
        } catch (error) {
          console.error('Test failed:', error);
        }
      }
      
      run();
    `]);
  } catch (error) {
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
  }
  
  returnToMenu();
}

async function testMfa() {
  console.log(`\n${colors.bright}Testing MFA functionality...${colors.reset}\n`);
  
  try {
    await runCommand('node', ['-e', `
      const { checkMfaStatus } = require('../lib/auth-test-utils');
      
      async function run() {
        try {
          const result = await checkMfaStatus();
          console.log(result);
        } catch (error) {
          console.error('Test failed:', error);
        }
      }
      
      run();
    `]);
  } catch (error) {
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
  }
  
  returnToMenu();
}

async function testAuthLogging() {
  console.log(`\n${colors.bright}Testing authentication logging...${colors.reset}\n`);
  
  try {
    await runCommand('node', ['-e', `
      const { testAuthLogging } = require('../lib/auth-test-utils');
      const config = require('../test-config.json');
      
      async function run() {
        try {
          const result = await testAuthLogging(config.testUser.email, 'SIGN_IN_SUCCESS');
          console.log(result);
        } catch (error) {
          console.error('Test failed:', error);
        }
      }
      
      run();
    `]);
  } catch (error) {
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
  }
  
  returnToMenu();
}

async function startTestUi() {
  console.log(`\n${colors.bright}Starting authentication test UI...${colors.reset}\n`);
  console.log(`Navigate to http://localhost:3000/dashboard/test-auth in your browser`);
  
  try {
    await runCommand('npm', ['run', 'dev']);
  } catch (error) {
    console.error(`\n${colors.red}Error starting dev server: ${error.message}${colors.reset}`);
  }
  
  returnToMenu();
}

async function runSecurityTests() {
  console.log(`\n${colors.bright}Running security test script...${colors.reset}\n`);
  
  try {
    const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'test-auth-system.sh');
    await runCommand('bash', [scriptPath]);
  } catch (error) {
    console.error(`\n${colors.red}Error running security tests: ${error.message}${colors.reset}`);
  }
  
  returnToMenu();
}

function exitProgram() {
  console.log(`\n${colors.green}Exiting authentication test tool.${colors.reset}`);
  rl.close();
  process.exit(0);
}

function returnToMenu() {
  rl.question(`\nPress Enter to return to the main menu...`, () => {
    showMenu();
  });
}

// Start the program
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}CoinBox Authentication Testing Tool${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
showMenu();
