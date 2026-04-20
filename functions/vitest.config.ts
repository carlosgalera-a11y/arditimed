import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/types.ts', 'src/askAi.ts'],
      thresholds: {
        // Líneas y statements se mantienen altos; functions y branches admiten
        // menos porque los closures de routing.ts construyen providers que se
        // testean vía providers/*.test.ts, no a través de buildProviderChain.
        lines: 95,
        functions: 60,
        branches: 80,
        statements: 95,
      },
    },
  },
});
