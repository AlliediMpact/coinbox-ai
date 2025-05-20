#!/bin/bash

# Script to start the development server and open it in a browser port forward

echo "====================================="
echo "CoinBox Authentication Test Script"
echo "====================================="

echo "1. Installing required polyfills..."
npm install --save-dev crypto-browserify stream-browserify stream-http https-browserify browserify-zlib path-browserify os-browserify buffer process assert

echo "2. Starting development server..."
echo "If you see 'Ready' in the output, the server has started successfully."
echo "The application will be available at: http://localhost:9008"
echo "====================================="

# Start the development server on a different port
PORT=9008 npm run dev
