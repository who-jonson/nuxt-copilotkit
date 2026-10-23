/**
 * Remote AG-UI agents: `runtime.agents` replaces the BuiltInAgent and the
 * `copilotkit:runtime` hook can add more via the `createRemoteAgent` server import.
 */
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { setup, $fetch } from '@nuxt/test-utils/e2e';

describe('remote agents', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/remote-agents', import.meta.url)),
    server: true
  });

  it('registers configured remote agents instead of the BuiltInAgent', async () => {
    const info = await $fetch<{ agents: Record<string, { className?: string }> }>('/api/_copilotkit/info');
    // Class names are minified in the bundle, so assert on what it is NOT.
    expect(info.agents.default).toBeDefined();
    expect(info.agents.default?.className).not.toBe('BuiltInAgent');
  });

  it('lets the copilotkit:runtime hook add agents', async () => {
    const info = await $fetch<{ agents: Record<string, { className?: string }> }>('/api/_copilotkit/info');
    expect(info.agents.extra).toBeDefined();
  });
});
