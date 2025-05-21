import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mjs,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/transaction-monitoring-service.ts',
        'src/middleware/trading-rate-limit.ts',
        'src/components/TransactionSecurity.tsx',
        'src/components/admin/TransactionMonitoring.tsx'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
