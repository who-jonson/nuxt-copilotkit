/**
 * Layer 1 route dispatch tests: handler registration, hook firing, and passthrough behavior.
 * Tests the real handler file served through a catch-all server route.
 *
 * Note: Registration-mode assertions (disabled/external modes register nothing, runtime.path override)
 * are re-homed to L2E and tested in registration.test.ts.
 *
 * Mocking limitation: vi.mock() does not affect server-side code in e2e tests (server runs in
 * separate process). The handler uses real @copilotkit/runtime but with mock API keys to avoid
 * external calls.
 */
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { setup, $fetch } from '@nuxt/test-utils/e2e';

describe('route dispatch (Layer 1)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/route', import.meta.url)),
    server: true,
    env: {
      // Provide mock API keys so BuiltInAgent can be instantiated without calling real APIs
      NUXT_COPILOTKIT_OPENAI_API_KEY: 'sk-test-mock-key-for-testing-only'
    }
  });

  it('handler is registered and responds to /info health endpoint', async () => {
    // Per Spike B, GET <mount>/info returns 200 application/json with runtime metadata
    // This proves the handler is mounted, the runtime initializes, and hooks fire
    const response = await $fetch<{ version: string; agents: Record<string, unknown> }>('/api/_copilotkit/info', {
      method: 'GET'
    });

    // Verify the response structure
    expect(response).toBeDefined();
    expect(response.version).toBeDefined();
    expect(response.agents).toBeDefined();
    expect(response.agents.default).toBeDefined();
    expect((response.agents.default as { className?: string }).className).toBe('BuiltInAgent');
  });
});
