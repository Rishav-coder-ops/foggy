import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    isolate: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    testTimeout: 10000,
    env: {
      TZ: 'Asia/Kolkata',
      VITE_FIREBASE_API_KEY: 'mock-firebase-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'foggy-mock-app.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'foggy-mock-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'foggy-mock-project.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '9876543210',
      VITE_FIREBASE_APP_ID: '1:9876543210:web:abcdef123456'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['shared/**', 'functions/api/**', 'src/utils/**', 'src/services/**'],
      exclude: ['node_modules/**', 'dist/**', 'tests/**', 'src/main.jsx'],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 70
      }
    }
  }
});
