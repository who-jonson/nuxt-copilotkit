/**
 * Server-side CopilotKit runtime factory and accessor.
 * Provides memoized runtime initialization with default BuiltInAgent registration.
 */
import type { H3Event } from 'h3';
import { useRuntimeConfig, useNitroApp } from 'nitropack/runtime';
import { DEFAULT_AGENT_ID } from '@copilotkit/shared';
import { BuiltInAgent, CopilotRuntime, type BasicAgent } from '@copilotkit/runtime/v2';
import type {} from '../hooks';

type CopilotRuntimeFactory = (event: H3Event) => CopilotRuntime | Promise<CopilotRuntime>;

let runtimeMemoized: CopilotRuntime | null = null;
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
 * Gets the CopilotKit runtime configuration, initializing it lazily on first call.
 * Registers a default BuiltInAgent under DEFAULT_AGENT_ID with the configured model.
 *
 * @param event - H3Event from the incoming request
 * @returns CopilotRuntime instance
 */
export async function getCopilotRuntime(event: H3Event): Promise<CopilotRuntime> {
  if (runtimeMemoized) {
    return runtimeMemoized;
  }

  let runtime: CopilotRuntime;

  // If user provided a custom factory, use it
  if (userFactory) {
    runtime = await userFactory(event);
  }
  else {
    // Default: create runtime with a BuiltInAgent
    const config = useRuntimeConfig(event);
    const model = config.copilotkit.model || 'openai/gpt-4o';

    // Determine API key based on provider prefix
    let apiKey: string | undefined;
    if (model.startsWith('anthropic/')) {
      apiKey = config.copilotkit.anthropicApiKey || undefined;
    }
    else {
      apiKey = config.copilotkit.openaiApiKey || undefined;
    }

    // Create default BuiltInAgent
    const defaultAgent = new BuiltInAgent({
      model,
      ...(apiKey && { apiKey })
    });

    // Build agents registry
    const agentsRegistry: Record<string, BuiltInAgent | BasicAgent> = {
      [DEFAULT_AGENT_ID]: defaultAgent
    };

    // Fire the copilotkit:runtime hook to allow user customization
    await useNitroApp().hooks.callHook('copilotkit:runtime', {
      event,
      agents: agentsRegistry
    });

    // Create CopilotRuntime instance with the agents
    runtime = new CopilotRuntime({
      agents: agentsRegistry
    });

    // Optional debug logging
    if (config.public.copilotkit.debug) {
      console.debug('[nuxt-copilotkit] Runtime initialized with model:', model);
    }
  }

  runtimeMemoized = runtime;
  return runtime;
}
