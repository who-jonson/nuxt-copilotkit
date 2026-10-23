// Plain-Vite Vitest config for pure unit tests (*.unit.test.ts) that must NOT go through the Nuxt vite plugin.
// Why: under defineVitestConfig the Nuxt plugin resolves '#imports' to the real Nuxt runtime, so vi.mock('#imports')
// is never intercepted; here '#imports' is aliased to a stub that tests can mock.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Nuxt normally statically defines import.meta.server; here tests flip globalThis.__NUXT_SERVER__ to simulate SSR.
  plugins: [{
    name: 'unit-import-meta-server',
    enforce: 'pre',
    transform: (code, id) => id.includes('/src/runtime/') ? code.replaceAll('import.meta.server', 'Boolean(globalThis.__NUXT_SERVER__)') : null
  }],
  resolve: {
    alias: { '#imports': fileURLToPath(new URL('./test/__mocks__/imports.ts', import.meta.url)) }
  },
  test: {
    environment: 'node',
    include: ['test/**/*.unit.test.ts']
  }
});
