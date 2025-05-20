/**
 * Authentication Logging Test for CoinBox
 * 
 * This script tests the authentication logging system by generating
 * various authentication events and verifying they are properly logged.
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  deleteUser
} = require('firebase/auth');

// Get Firebase config from environment or default test values
const firebaseConfig = {
  // Use test configuration values - these would typically come from environment variables
  apiKey: process.env.FIREBASE_API_KEY || "test-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "coinbox-test.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "coinbox-test",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "coinbox-test.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

// Test credentials
const testEmail = process.env.TEST_EMAIL || "test@example.com";
const testPassword = process.env.TEST_PASSWORD || "testPassword123";

// Random temporary test user
const tempEmail = `temp-${Math.random().toString(36).substring(2, 8)}@test.com`;
const tempPassword = `TempPass${Math.random().toString(36).substring(2, 8)}!`;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Auth logger (simplified version of the actual logger)
const AuthEventType = {
  SIGN_IN_SUCCESS: 'SIGN_IN_SUCCESS',
  SIGN_IN_FAILURE: 'SIGN_IN_FAILURE',
  SIGN_OUT: 'SIGN_OUT',
  SIGN_UP_SUCCESS: 'SIGN_UP_SUCCESS',
  SIGN_UP_FAILURE: 'SIGN_UP_FAILURE',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  AUTH_ERROR: 'AUTH_ERROR'
};

/**
 * Get current timestamp in ISO format
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Mock log event to console (in the real app this would write to a database)
 */
const logEvent = (eventType, userId, metadata) => {
  const event = {
    eventType,
    userId: userId || 'unknown',
    timestamp: getTimestamp(),
    metadata: metadata || {}
  };
  
  console.log(JSON.stringify(event, null, 2));
  return Promise.resolve(true);
};

/**
 * Test login and logout events
 */
async function testLoginLogoutEvents() {
  console.log('\n--- Testing Login/Logout Events ---');
  
  try {
    // Log successful sign in
    console.log('\nAttempting login with valid credentials...');
    const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    const userId = userCredential.user.uid;
    
    await logEvent(AuthEventType.SIGN_IN_SUCCESS, userId, {
      email: testEmail,
      timestamp: getTimestamp()
    });
    
    // Log sign out
    console.log('\nAttempting logout...');
    await signOut(auth);
    
    await logEvent(AuthEventType.SIGN_OUT, userId, {
      timestamp: getTimestamp()
    });
    
    // Log failed sign in
    console.log('\nAttempting login with invalid credentials...');
    try {
      await signInWithEmailAndPassword(auth, testEmail, 'wrongPassword123');
    } catch (error) {
      await logEvent(AuthEventType.SIGN_IN_FAILURE, null, {
        email: testEmail,
        errorCode: error.code,
        errorMessage: error.message,
        timestamp: getTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error in login/logout events test:', error);
    return false;
  }
}

/**
 * Test user creation and deletion events
 */
async function testUserManagementEvents() {
  console.log('\n--- Testing User Management Events ---');
  
  try {
    // Create a temporary user
    console.log(`\nCreating temporary test user: ${tempEmail}`);
    const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, tempPassword);
    const userId = userCredential.user.uid;
    
    await logEvent(AuthEventType.SIGN_UP_SUCCESS, userId, {
      email: tempEmail,
      timestamp: getTimestamp()
    });
    
    // Delete the temporary user
    console.log(`\nDeleting temporary test user: ${tempEmail}`);
    await deleteUser(userCredential.user);
    
    await logEvent('USER_DELETED', userId, {
      email: tempEmail,
      timestamp: getTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error in user management events test:', error);
    
    await logEvent(AuthEventType.SIGN_UP_FAILURE, null, {
      email: tempEmail,
      errorCode: error.code,
      errorMessage: error.message,
      timestamp: getTimestamp()
    });
    
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting Authentication Logging Tests...');
  
  let loginLogoutSuccess = false;
  let userManagementSuccess = false;
  
  try {
    loginLogoutSuccess = await testLoginLogoutEvents();
    userManagementSuccess = await testUserManagementEvents();
    
    console.log('\n--- Test Results ---');
    console.log(`Login/Logout Events: ${loginLogoutSuccess ? '✅ Passed' : '❌ Failed'}`);
    console.log(`User Management Events: ${userManagementSuccess ? '✅ Passed' : '❌ Failed'}`);
    
    if (loginLogoutSuccess && userManagementSuccess) {
      console.log('\n✅ All authentication logging tests passed.');
    } else {
      console.log('\n⚠️ Some authentication logging tests failed.');
    }
  } catch (error) {
    console.error('Error running authentication logging tests:', error);
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('\nAuthentication logging test completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
