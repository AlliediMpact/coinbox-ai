/**
 * Rate Limiting Test for CoinBox Authentication System
 * 
 * This script tests the rate limiting functionality by making
 * multiple rapid authentication attempts to trigger the rate limiter.
 */

const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { initializeApp } = require('firebase/app');

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

// Test email and deliberately wrong password to trigger rate limiting
const testEmail = process.env.TEST_EMAIL || "test@example.com";
const wrongPassword = "deliberatelyWrongPassword123!";
const maxAttempts = 10;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Make multiple failed login attempts to test rate limiting
 */
async function testRateLimiting() {
  console.log(`Starting rate limiting test with ${maxAttempts} attempts...`);
  console.log(`Using test email: ${testEmail}`);
  
  let rateLimitDetected = false;
  const results = [];
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`\nAttempt ${i + 1} of ${maxAttempts}`);
    
    try {
      await signInWithEmailAndPassword(auth, testEmail, wrongPassword);
      results.push(`Attempt ${i + 1}: Login succeeded (unexpected)`);
    } catch (error) {
      const errorMessage = error.message || "Unknown error";
      results.push(`Attempt ${i + 1}: ${errorMessage}`);
      console.log(`Error: ${errorMessage}`);
      
      // Check if we've hit a rate limit
      if (errorMessage.includes('too many requests') || 
          errorMessage.includes('Too many unsuccessful login attempts') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('rate')) {
        console.log('\n✅ Rate limiting detected! Test passed.');
        rateLimitDetected = true;
        break;
      }
      
      // Add a small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n--- Test Results ---');
  results.forEach(result => console.log(result));
  
  if (!rateLimitDetected) {
    console.log('\n⚠️ Rate limiting was not detected after multiple failed login attempts.');
    console.log('This may indicate that rate limiting is not properly configured.');
  }
}

// Run the test
testRateLimiting()
  .then(() => {
    console.log('\nRate limiting test completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
