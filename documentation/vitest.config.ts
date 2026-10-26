// Vitest config for the docs site: `output` checks the generated files, `worker` checks HTTP behaviour.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'output',
          include: ['test/output.test.ts']
        }
      },
      {
        test: {
          name: 'worker',
          include: ['test/worker.e2e.test.ts'],
          // Starts `wrangler dev` unless DOCS_URL points at a running site.
          globalSetup: ['test/wrangler.global.ts'],
          hookTimeout: 120_000
        }
      }
    ]
  }
});
