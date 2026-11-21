import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    testTimeout: 25000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['shared/**', 'functions/api/**', 'src/utils/**', 'src/services/**'],
      exclude: ['node_modules/**', 'dist/**', 'tests/**', 'src/main.jsx'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70
      }
    }
  }
});
