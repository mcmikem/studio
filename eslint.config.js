import eslintJs from '@eslint/js';
import nextLint from '@next/eslint-config-next';

export default [
  eslintJs.configs.recommended,
  ...nextLint,
  {
    rules: {
      'no-console': 'error',
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
    }
  }
];