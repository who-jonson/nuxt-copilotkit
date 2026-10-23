/**
 * Smoke test for the DevTools server RPC: `getConfig` must return a sanitized snapshot
 * (key presence booleans only, never key values) and the right runtime mode.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type RpcHandlers = { getConfig: () => Record<string, unknown> };
let rpc: RpcHandlers;
let runtimeConfig: Record<string, unknown>;

vi.mock('@nuxt/devtools-kit', () => ({
  addCustomTab: vi.fn(),
  onDevToolsInitialized: (cb: () => void) => cb(),
  extendServerRpc: (_name: string, handlers: RpcHandlers) => {
    rpc = handlers;
  }
}));
vi.mock('@nuxt/kit', () => ({
  extendViteConfig: vi.fn(),
  useRuntimeConfig: () => runtimeConfig
}));

const { setupDevToolsUI } = await import('../src/devtools');

/** Minimal Nuxt stand-in exposing only what setupDevToolsUI reads. */
function setup(copilotkit: Record<string, unknown>) {
  const nuxt = { options: { copilotkit }, hook: vi.fn() };
  setupDevToolsUI(nuxt as never, { resolve: () => '/nonexistent-client' } as never);
}

describe('devtools getConfig', () => {
  beforeEach(() => {
    runtimeConfig = {
      public: { copilotkit: { runtimeUrl: '/api/_copilotkit', debug: false } },
      copilotkit: { openaiApiKey: 'sk-secret', anthropicApiKey: '' }
    };
  });

  it('reports builtin mode and key presence without leaking key values', () => {
    setup({ runtime: { enabled: true, path: '/api/_copilotkit' } });
    const snapshot = rpc.getConfig();
    expect(snapshot.runtimeMode).toBe('builtin');
    expect(snapshot.apiKeys).toEqual({ openaiSet: true, anthropicSet: false });
    expect(JSON.stringify(snapshot)).not.toContain('sk-secret');
  });

  it('reports external and disabled modes', () => {
    setup({ runtime: { enabled: true, path: '/x', url: 'https://rt.example.com' } });
    expect(rpc.getConfig().runtimeMode).toBe('external');
    setup({ runtime: false });
    expect(rpc.getConfig().runtimeMode).toBe('disabled');
  });
});
