import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    // Only discover tests inside the `src` folder to avoid running node_modules tests
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,cts,jsx,tsx}'],
    exclude: [
      // Exclude node_modules and Playwright E2E tests from Vitest discovery
      'node_modules/**',
      'src/e2e-tests/**',
      'src/tests/e2e/**',
      '**/*.e2e.*',
      'playwright.config.*',
      'src/tests/**/e2e/**',
      // Exclude integration tests - they run separately with their own config
      'src/tests/integration/**/*.integration.test.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/transaction-monitoring-service.ts',
        'src/middleware/trading-rate-limit.ts',
        'src/components/TransactionSecurity.tsx',
        'src/components/admin/TransactionMonitoring.tsx',
        'src/lib/firebase.ts',
        'src/lib/firebase-admin.ts'
      ]
    },
    // Increase timeout for integration tests
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
