import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/integration/setup.integration.ts'],
    // Only run integration tests
    include: ['src/tests/integration/*.integration.test.ts'],
    exclude: [
      'node_modules/**',
      'src/e2e-tests/**',
      '**/*.e2e.*',
    ],
    // Increase timeout for integration tests
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
