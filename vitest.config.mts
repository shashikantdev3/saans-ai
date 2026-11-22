import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
      'server-only': path.resolve(import.meta.dirname, 'tests/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    env: { SAANS_FIXTURES: '1' },
    include: [
      'tests/unit/**/*.test.ts',
      'tests/api/**/*.test.ts',
      'tests/components/**/*.test.tsx',
    ],
    setupFiles: ['tests/components/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'app/api/**/*.ts', 'components/**/*.tsx', 'hooks/**/*.ts'],
      exclude: ['lib/data/fixtures/**'],
      thresholds: { lines: 88, functions: 88, branches: 75, statements: 88 },
      reporter: ['text-summary', 'html'],
    },
  },
});
