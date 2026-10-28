import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import hooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'src/home/**/*.test.ts'] },
  {
    files: ['src/home/**/*.{ts,tsx}'],
    languageOptions: { parser: babelParser, parserOptions: { requireConfigFile: false, babelOptions: { parserOpts: { plugins: ['typescript', 'jsx'] } } } },
    plugins: { 'react-hooks': hooks },
    // The homepage keeps its existing JSX parser and hooks checks.
    rules: { ...js.configs.recommended.rules, 'no-undef': 'off', 'no-unused-vars': 'off', 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' }
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: { parser: tseslint.parser, parserOptions: { project: './tsconfig.tests.json', tsconfigRootDir: import.meta.dirname } },
    plugins: { '@typescript-eslint': tseslint.plugin, playwright },
    rules: {
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/expect-expect': 'error',
      'playwright/no-force-option': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      '@typescript-eslint/no-floating-promises': 'error'
    }
  }
];
