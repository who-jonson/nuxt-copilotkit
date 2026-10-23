/**
 * Server-side CopilotKit runtime factory and accessor.
 * Builds the runtime lazily (once) from runtimeConfig: remote AG-UI agents when configured,
 * otherwise a default BuiltInAgent. Users can override via `defineCopilotRuntime` or the
 * `copilotkit:runtime` Nitro hook.
 */
import type { H3Event } from 'h3';
import { useRuntimeConfig, useNitroApp } from 'nitropack/runtime';
import { DEFAULT_AGENT_ID } from '@copilotkit/shared';
import { BuiltInAgent, CopilotRuntime } from '@copilotkit/runtime/v2';
import { HttpAgent, type AbstractAgent } from '@ag-ui/client';

/** Shape of a remote AG-UI agent entry (mirrors `RemoteAgentConfig` in module options). */
export interface RemoteAgentConfig {
  url: string;
  headers?: Record<string, string>;
  description?: string;
}

type CopilotRuntimeFactory = (event: H3Event) => CopilotRuntime | Promise<CopilotRuntime>;

// Memoize the promise (not the result) so concurrent first requests share one initialization.
let runtimePromise: Promise<CopilotRuntime> | null = null;
let userFactory: CopilotRuntimeFactory | null = null;

/**
 * Defines a factory for customizing the CopilotKit runtime.
 * The factory is called once during first request initialization.
 *
 * @param factory - Function that receives the H3Event and returns a CopilotRuntime instance
 */
export function defineCopilotRuntime(factory: CopilotRuntimeFactory): void {
  userFactory = factory;
}

/**
 * Creates an agent that proxies to a remote AG-UI HTTP endpoint (Google ADK, Claude Agent SDK,
 * VoltAgent, LangGraph, A2A bridges, ...). Use inside `defineCopilotRuntime` or the
 * `copilotkit:runtime` hook for dynamic setups; static setups can use `runtime.agents`.
 *
 * @param config - Remote endpoint URL plus optional headers/description
 * @returns An `HttpAgent` registered by the caller under an agent id
 */
export function createRemoteAgent(config: RemoteAgentConfig): AbstractAgent {
  return new HttpAgent({
    url: config.url,
    ...(config.headers && { headers: config.headers }),
    ...(config.description && { description: config.description })
  });
}

/** Builds the runtime from runtimeConfig and the `copilotkit:runtime` hook (no user factory). */
async function createDefaultRuntime(event: H3Event): Promise<CopilotRuntime> {
  const config = useRuntimeConfig(event);
  const remote = config.copilotkit.agents ?? {};
  const agents: Record<string, AbstractAgent> = {};

  if (Object.keys(remote).length > 0) {
    // Remote agents replace the default BuiltInAgent (no model API key required).
    for (const [id, cfg] of Object.entries(remote)) {
      agents[id] = createRemoteAgent(cfg);
    }
  }
  else {
    const model = config.copilotkit.model || 'openai/gpt-4o';
    // Only map keys we know; other providers (google/, ...) fall back to the upstream's own env lookup.
    const apiKey = model.startsWith('anthropic/')
      ? config.copilotkit.anthropicApiKey
      : model.startsWith('openai/')
        ? config.copilotkit.openaiApiKey
        : '';
    agents[DEFAULT_AGENT_ID] = new BuiltInAgent({ model, ...(apiKey && { apiKey }) });
  }

  // Hook consumers mutate `agents` in place; reassigning ctx.agents is ignored.
  await useNitroApp().hooks.callHook('copilotkit:runtime', { event, agents });

  if (config.public.copilotkit.debug) {
    console.debug('[nuxt-copilotkit] Runtime initialized with agents:', Object.keys(agents).join(', '));
  }

  return new CopilotRuntime({ agents });
}

/**
 * Gets the CopilotKit runtime, initializing it lazily on first call.
 *
 * @param event - H3Event from the incoming request
 * @returns CopilotRuntime instance
 */
export function getCopilotRuntime(event: H3Event): Promise<CopilotRuntime> {
  runtimePromise ??= Promise.resolve(userFactory ? userFactory(event) : createDefaultRuntime(event))
    .catch((error) => {
      runtimePromise = null; // allow retry after a failed init
      throw error;
    });
  return runtimePromise;
}
