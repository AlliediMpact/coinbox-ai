#!/bin/bash
# filepath: /workspaces/coinbox-ai/scripts/performance-test.sh

echo "=== CoinBox AI Performance Testing Script ==="
echo "Running comprehensive performance tests..."
echo ""

# Test concurrent users
echo "== Testing User Concurrency =="
echo "1. Testing with 100 concurrent users..."
node ./src/tests/performance/user-concurrency-test.js --users=100

echo "2. Testing with 250 concurrent users..."
node ./src/tests/performance/user-concurrency-test.js --users=250

echo "3. Testing with 500 concurrent users..."
node ./src/tests/performance/user-concurrency-test.js --users=500

# Test trading system performance
echo ""
echo "== Testing Trading System Performance =="
echo "1. Testing ticket creation throughput..."
node ./src/tests/performance/ticket-creation-test.js

echo "2. Testing matching algorithm performance..."
node ./src/tests/performance/matching-algorithm-test.js

echo "3. Testing escrow system throughput..."
node ./src/tests/performance/escrow-throughput-test.js

# Test payment system performance
echo ""
echo "== Testing Payment System Performance =="
echo "1. Testing payment processing throughput..."
node ./src/tests/performance/payment-processing-test.js

echo "2. Testing receipt generation performance..."
node ./src/tests/performance/receipt-generation-test.js

# Test analytics system performance
echo ""
echo "== Testing Analytics System Performance =="
echo "1. Testing data export with large datasets..."
node ./src/tests/performance/data-export-test.js

echo "2. Testing dashboard rendering performance..."
node ./src/tests/performance/dashboard-rendering-test.js

# Test notification system performance
echo ""
echo "== Testing Notification System Performance =="
echo "1. Testing bulk notification throughput..."
node ./src/tests/performance/notification-throughput-test.js

# Test database performance
echo ""
echo "== Testing Database Performance =="
echo "1. Testing read performance..."
node ./src/tests/performance/database-read-test.js

echo "2. Testing write performance..."
node ./src/tests/performance/database-write-test.js

echo "3. Testing query performance..."
node ./src/tests/performance/database-query-test.js

# Generate performance report
echo ""
echo "== Generating Performance Report =="
node ./src/scripts/generate-performance-report.js

echo ""
echo "Performance testing complete. Please review the report in ./performance-report.html"
