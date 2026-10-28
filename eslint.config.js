import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default tseslint.config(
  { ignores: ['dist/', '.astro/', 'node_modules/', 'public/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['**/*.{ts,mts,mjs,js}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    // Inline <script> blocks in .astro files are browser code.
    files: ['**/*.astro/*.js', '**/*.astro/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
);
