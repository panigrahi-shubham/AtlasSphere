import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'src/home/**/*.test.ts'] },
  {
    files: ['src/home/**/*.{ts,tsx}'],
    languageOptions: { parser: babelParser, parserOptions: { requireConfigFile: false, babelOptions: { parserOpts: { plugins: ['typescript', 'jsx'] } } } },
    plugins: { 'react-hooks': hooks },
    // TypeScript 7 checks names and unused bindings; Babel parses TS for ESLint
    // because typescript-eslint currently only supports TypeScript below 6.1.
    rules: { ...js.configs.recommended.rules, 'no-undef': 'off', 'no-unused-vars': 'off', 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' }
  }
];
