import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.wrangler/**',
      '**/*.log'
    ]
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      // 1. Mandatory no-undef rule to catch missing imports (like useEffect, useState, etc.)
      'no-undef': 'error',

      // 2. React Hooks plugin rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // 3. React plugin variables & JSX scope rules
      'react/jsx-uses-vars': 'error',
      'react/react-in-jsx-scope': 'off'
    }
  }
];
