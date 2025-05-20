#!/bin/bash

# Script to install all necessary polyfills for browser compatibility

echo "Installing browser polyfills for Node.js modules..."

# Install main polyfills
npm install --save-dev \
  crypto-browserify \
  stream-browserify \
  stream-http \
  https-browserify \
  browserify-zlib \
  path-browserify \
  os-browserify \
  buffer \
  process \
  assert \
  util

echo "All polyfills installed successfully!"
echo "You can now run 'npm run dev' to start the development server."
