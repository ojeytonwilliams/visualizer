import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base configuration for root-level files only
  js.configs.recommended,

  // Configuration for root-level TypeScript files (if any)
  {
    files: ['*.{ts,js}'],
    rules: {
      // Minimal rules for root configuration files
      'no-unused-vars': 'warn',
    },
  },

  // Prettier configuration to avoid conflicts
  prettierConfig,

  // Ignore patterns - packages have their own ESLint configs
  {
    ignores: [
      'node_modules/**',
      'packages/**', // Each package manages its own ESLint
      'dist/**',
      '.turbo/**'
    ],
  },
];
