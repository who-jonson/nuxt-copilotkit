/**
 * H3 event handler for the CopilotKit runtime endpoint.
 * Bridges Nitro's h3 event system to CopilotKit's Node.js listener via fromNodeMiddleware.
 */
import { defineEventHandler, fromNodeMiddleware } from 'h3';
import type { H3Event } from 'h3';
import { useNitroApp } from 'nitropack/runtime';
import { createCopilotNodeListener } from '@copilotkit/runtime/v2/node';
import { getCopilotRuntime } from '../utils/defineCopilotRuntime';

// Memoize the promise (not the result) so concurrent first requests share one initialization.
let handlerPromise: Promise<ReturnType<typeof fromNodeMiddleware>> | null = null;

export default defineEventHandler(async (event: H3Event) => {
  // Fire the copilotkit:request hook on each request
  await useNitroApp().hooks.callHook('copilotkit:request', event);

  // Lazy-initialize the handler on first request
  handlerPromise ??= getCopilotRuntime(event)
    .then(runtime => fromNodeMiddleware(createCopilotNodeListener({ runtime })))
    .catch((error) => {
      handlerPromise = null; // allow retry after a failed init
      throw error;
    });

  return (await handlerPromise)(event);
});
