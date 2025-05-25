#!/bin/bash

# Performance test script for notification delivery
# This script tests notification delivery performance under load

# Configuration
CONCURRENT_USERS=100
TEST_DURATION=60  # seconds
BASE_URL="http://localhost:3000"
API_ENDPOINT="/api/notifications/test"
TOKEN_FILE="./test-token.txt"
RESULTS_FILE="./notification-performance-results.txt"
LOG_FILE="./notification-performance.log"

# Print header
echo "===================================="
echo "Notification System Performance Test"
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
cat > notification-test.js << EOL
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const notificationDeliveryTime = new Trend('notification_delivery_time');
const notificationSuccessRate = new Rate('notification_success_rate');
const notificationsSent = new Counter('notifications_sent');

// Test configuration
export const options = {
  vus: ${CONCURRENT_USERS},
  duration: '${TEST_DURATION}s',
  thresholds: {
    'notification_delivery_time': ['p95<1000'], // 95% of notifications should be delivered in under 1 second
    'notification_success_rate': ['rate>0.95'],  // 95% success rate
  },
};

// Test scenario
export default function() {
  // Generate random notification data
  const userId = \`user_\${Math.floor(Math.random() * 10000)}\`;
  const notificationType = ['payment', 'system', 'security', 'dispute'][Math.floor(Math.random() * 4)];
  
  // Payload for test notification
  const payload = {
    userId: userId,
    type: notificationType,
    title: \`Test Notification \${Date.now()}\`,
    message: 'This is a test notification for performance testing.',
    priority: Math.random() > 0.8 ? 'high' : 'normal',
    data: {
      testId: Date.now(),
      testRun: true
    }
  };
  
  // Headers with auth token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${TEST_TOKEN}'
  };
  
  // Record start time
  const startTime = new Date();
  
  // Send notification
  const response = http.post('${BASE_URL}${API_ENDPOINT}', JSON.stringify(payload), {
    headers: headers,
  });
  
  // Calculate delivery time
  const deliveryTime = new Date() - startTime;
  notificationDeliveryTime.add(deliveryTime);
  
  // Check success
  const success = check(response, {
    'Status is 200': (r) => r.status === 200,
    'Response has notification ID': (r) => JSON.parse(r.body).id !== undefined,
  });
  
  notificationSuccessRate.add(success);
  notificationsSent.add(1);
  
  // Brief pause between requests
  sleep(0.1);
}
EOL

echo "Starting load test with k6..."
k6 run notification-test.js | tee $RESULTS_FILE

echo ""
echo "Test completed at $(date)"

# Parse results
LATENCY_AVG=$(grep -A 1 "notification_delivery_time" $RESULTS_FILE | grep avg | awk '{print $2}')
SUCCESS_RATE=$(grep -A 1 "notification_success_rate" $RESULTS_FILE | grep rate | awk '{print $2}')
TOTAL_NOTIFICATIONS=$(grep -A 1 "notifications_sent" $RESULTS_FILE | grep count | awk '{print $2}')

# Format and display summary
echo ""
echo "==== NOTIFICATION PERFORMANCE TEST SUMMARY ===="
echo "Total notifications sent: $TOTAL_NOTIFICATIONS"
echo "Average delivery time: $LATENCY_AVG ms"
echo "Success rate: $SUCCESS_RATE"

if (( $(echo "$SUCCESS_RATE > 0.95" | bc -l) )); then
  echo "✅ TEST PASSED: Success rate above 95%"
else
  echo "❌ TEST FAILED: Success rate below 95%"
fi

if (( $(echo "$LATENCY_AVG < 500" | bc -l) )); then
  echo "✅ TEST PASSED: Average latency under 500ms"
else
  echo "❌ TEST FAILED: Average latency above 500ms"
fi

echo ""
echo "Detailed results saved to: $RESULTS_FILE"
echo "Test logs saved to: $LOG_FILE"