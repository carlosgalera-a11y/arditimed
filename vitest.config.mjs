import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.mjs'],
    environment: 'jsdom',
    globals: false,
    // Aisla del workspace de Playwright que ya vive en /tests/e2e.
    exclude: ['node_modules', 'tests/e2e/**', 'functions/**'],
  },
});
