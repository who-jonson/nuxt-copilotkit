/**
 * H3 event handler for the CopilotKit runtime endpoint.
 * Bridges Nitro's h3 event system to CopilotKit's Node.js listener via fromNodeMiddleware.
 */
import { defineEventHandler, fromNodeMiddleware } from 'h3';
import type { H3Event } from 'h3';
import { useNitroApp } from 'nitropack/runtime';
import { createCopilotNodeListener } from '@copilotkit/runtime/v2/node';
import { getCopilotRuntime } from '../utils/defineCopilotRuntime';

let handler: ReturnType<typeof fromNodeMiddleware> | null = null;

export default defineEventHandler(async (event: H3Event) => {
  // Fire the copilotkit:request hook on each request
  await useNitroApp().hooks.callHook('copilotkit:request', event);

  // Lazy-initialize the handler on first request
  if (!handler) {
    const runtime = await getCopilotRuntime(event);
    handler = fromNodeMiddleware(createCopilotNodeListener({ runtime }));
  }

  return handler(event);
});
