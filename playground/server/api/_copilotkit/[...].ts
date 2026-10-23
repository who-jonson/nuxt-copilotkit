/**
 * Playground CopilotKit runtime endpoint with a deterministic mock agent.
 * No network calls, no real API key — streams a canned tool call for CI-safe testing.
 */
import { defineEventHandler, fromNodeMiddleware } from 'h3';
import type { H3Event } from 'h3';
import { CopilotRuntime } from '@copilotkit/runtime/v2';
import { createCopilotNodeListener } from '@copilotkit/runtime/v2/node';
import { DEFAULT_AGENT_ID } from '@copilotkit/shared';

/**
 * Mock agent that streams a canned GreetingCard tool call.
 * No live model provider — deterministic output for GenUI demo.
 */
class MockAgent {
  async runAgentSession(_input: unknown) {
    // Deterministic mock response: stream a tool call for GreetingCard
    return {
      async* [Symbol.asyncIterator]() {
        // Mock message with a tool call
        yield {
          type: 'tool-call',
          toolCallId: 'mock-001',
          toolName: 'GreetingCard',
          args: {
            name: 'Playground User',
            message: 'Welcome to nuxt-copilotkit!'
          }
        };

        // Mock assistant message
        yield {
          type: 'text-delta',
          textDelta: 'I\'ve created a greeting card for you!'
        };
      }
    };
  }
}

// Create the mock runtime
const mockAgent = new MockAgent();
const runtime = new CopilotRuntime({
  agents: {
    [DEFAULT_AGENT_ID]: mockAgent
  }
});

// Create the handler
const handler = fromNodeMiddleware(createCopilotNodeListener({ runtime }));

export default defineEventHandler(async (event: H3Event) => {
  return handler(event);
});
