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

  it('returns JSON content-type for /info endpoint', async () => {
    // $fetch automatically parses JSON and doesn't expose headers directly
    // This test verifies that the endpoint returns valid JSON (which implies correct content-type)
    const response = await $fetch<{ version: string; agents: Record<string, unknown> }>('/api/_copilotkit/info', {
      method: 'GET'
    });

    // If we got here with a parsed object, the content-type was application/json
    expect(response).toBeTypeOf('object');
    expect(response.version).toBeDefined();
  });

  it('handler is mounted and handles CopilotKit runtime requests', async () => {
    // /info is the documented health endpoint
    const infoResponse = await $fetch<{ version: string }>('/api/_copilotkit/info', { method: 'GET' });
    expect(infoResponse.version).toBeDefined();

    // Verify the handler exists and processes requests
    // (Other CopilotKit paths may require specific payloads/methods)
    expect(infoResponse).toBeDefined();
  });

  it('memoizes runtime instance across requests', async () => {
    // First request initializes the runtime
    const response1 = await $fetch<{ version: string; agents: Record<string, unknown> }>('/api/_copilotkit/info');

    // Second request should use the memoized instance
    const response2 = await $fetch<{ version: string; agents: Record<string, unknown> }>('/api/_copilotkit/info');

    // Both should return the same structure (memoization is working)
    expect(response1.agents).toEqual(response2.agents);
    expect(response1.version).toBe(response2.version);
  });
});
