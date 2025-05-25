#!/bin/bash

# Performance test script for payment processing
# This script tests payment processing performance under load

# Configuration
CONCURRENT_USERS=50
TEST_DURATION=60  # seconds
BASE_URL="http://localhost:3000"
API_ENDPOINT="/api/payments/test"
TOKEN_FILE="./test-token.txt"
RESULTS_FILE="./payment-performance-results.txt"
LOG_FILE="./payment-performance.log"

# Print header
echo "===================================="
echo "Payment System Performance Test"
echo "===================================="
echo "Testing with $CONCURRENT_USERS concurrent users for $TEST_DURATION seconds"
echo "Started at $(date)"
echo ""

# Create log file
> $LOG_FILE

# Check if test token exists
if [ ! -f "$TOKEN_FILE" ]; then
  echo "Error: Test token file not found. Please generate a test token first."
  echo "Run 'npm run generate-test-token' to create one."
  exit 1
fi

# Read test token
TEST_TOKEN=$(cat $TOKEN_FILE)
if [ -z "$TEST_TOKEN" ]; then
  echo "Error: Test token is empty."
  exit 1
fi

# Ensure k6 is installed
if ! command -v k6 &> /dev/null; then
  echo "Error: k6 load testing tool not found. Please install k6 first."
  echo "https://k6.io/docs/getting-started/installation/"
  exit 1
fi

# Create k6 script file
cat > payment-test.js << EOL
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const paymentProcessingTime = new Trend('payment_processing_time');
const paymentSuccessRate = new Rate('payment_success_rate');
const receiptGenerationTime = new Trend('receipt_generation_time');
const paymentsMade = new Counter('payments_made');

// Test configuration
export const options = {
  vus: ${CONCURRENT_USERS},
  duration: '${TEST_DURATION}s',
  thresholds: {
    'payment_processing_time': ['p95<2000'],  // 95% of payments should process in under 2 seconds
    'receipt_generation_time': ['p95<1000'],  // 95% of receipts should generate in under 1 second
    'payment_success_rate': ['rate>0.95'],    // 95% success rate
  },
};

// Test scenario
export default function() {
  // Generate random payment data
  const userId = \`user_\${Math.floor(Math.random() * 10000)}\`;
  const amount = Math.floor(Math.random() * 10000) / 100; // Random amount between 0.01 and 100.00
  
  // Payload for test payment
  const payload = {
    userId: userId,
    amount: amount,
    currency: 'ZAR',
    description: \`Test Payment \${Date.now()}\`,
    paymentMethod: 'credit_card',
    receiptRequired: true,
    metadata: {
      testId: Date.now(),
      testRun: true
    }
  };
  
  // Headers with auth token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${TEST_TOKEN}'
  };
  
  // Record start time for payment processing
  const startTime = new Date();
  
  // Process payment
  const response = http.post('${BASE_URL}${API_ENDPOINT}', JSON.stringify(payload), {
    headers: headers,
  });
  
  // Calculate payment processing time
  const processingTime = new Date() - startTime;
  paymentProcessingTime.add(processingTime);
  
  // Check payment success
  const paymentSuccess = check(response, {
    'Status is 200': (r) => r.status === 200,
    'Payment was successful': (r) => JSON.parse(r.body).status === 'success',
    'Payment ID exists': (r) => JSON.parse(r.body).paymentId !== undefined,
  });
  
  paymentSuccessRate.add(paymentSuccess);
  paymentsMade.add(1);

  // If payment was successful, check receipt generation
  if (paymentSuccess) {
    const paymentData = JSON.parse(response.body);
    const receiptStartTime = new Date();
    
    // Request receipt
    const receiptResponse = http.get(
      \`${BASE_URL}/api/receipts/\${paymentData.paymentId}\`,
      { headers: headers }
    );
    
    // Calculate receipt generation time
    const receiptTime = new Date() - receiptStartTime;
    receiptGenerationTime.add(receiptTime);
    
    check(receiptResponse, {
      'Receipt status is 200': (r) => r.status === 200,
      'Receipt has ID': (r) => JSON.parse(r.body).id !== undefined,
      'Receipt matches payment amount': (r) => Math.abs(JSON.parse(r.body).amount - amount) < 0.01,
    });
  }
  
  // Brief pause between requests
  sleep(0.3);
}
EOL

echo "Starting load test with k6..."
k6 run payment-test.js | tee $RESULTS_FILE

echo ""
echo "Test completed at $(date)"

# Parse results
PROCESSING_AVG=$(grep -A 1 "payment_processing_time" $RESULTS_FILE | grep avg | awk '{print $2}')
RECEIPT_AVG=$(grep -A 1 "receipt_generation_time" $RESULTS_FILE | grep avg | awk '{print $2}')
SUCCESS_RATE=$(grep -A 1 "payment_success_rate" $RESULTS_FILE | grep rate | awk '{print $2}')
TOTAL_PAYMENTS=$(grep -A 1 "payments_made" $RESULTS_FILE | grep count | awk '{print $2}')

# Format and display summary
echo ""
echo "==== PAYMENT SYSTEM PERFORMANCE TEST SUMMARY ===="
echo "Total payments processed: $TOTAL_PAYMENTS"
echo "Average payment processing time: $PROCESSING_AVG ms"
echo "Average receipt generation time: $RECEIPT_AVG ms"
echo "Payment success rate: $SUCCESS_RATE"

if (( $(echo "$SUCCESS_RATE > 0.95" | bc -l) )); then
  echo "✅ TEST PASSED: Success rate above 95%"
else
  echo "❌ TEST FAILED: Success rate below 95%"
fi

if (( $(echo "$PROCESSING_AVG < 1000" | bc -l) )); then
  echo "✅ TEST PASSED: Average processing time under 1000ms"
else
  echo "❌ TEST FAILED: Average processing time above 1000ms"
fi

if (( $(echo "$RECEIPT_AVG < 500" | bc -l) )); then
  echo "✅ TEST PASSED: Average receipt generation time under 500ms"
else
  echo "❌ TEST FAILED: Average receipt generation time above 500ms"
fi

echo ""
echo "Detailed results saved to: $RESULTS_FILE"
echo "Test logs saved to: $LOG_FILE"