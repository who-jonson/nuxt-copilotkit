/**
 * Playground CopilotKit runtime endpoint with a deterministic mock agent.
 * No network calls, no real API key — streams a canned GreetingCard tool call as AG-UI events.
 */
import { defineEventHandler, fromNodeMiddleware } from 'h3';
import type { H3Event } from 'h3';
import { AbstractAgent, EventType } from '@ag-ui/client';
import type { BaseEvent, RunAgentInput } from '@ag-ui/client';
import { Observable } from 'rxjs';
import { CopilotRuntime } from '@copilotkit/runtime/v2';
import { createCopilotNodeListener } from '@copilotkit/runtime/v2/node';
import { DEFAULT_AGENT_ID } from '@copilotkit/shared';

/**
 * Mock agent implementing the AG-UI `AbstractAgent.run` contract: one GreetingCard tool call,
 * then a short assistant message. Deterministic, so GenUI pages are CI-safe.
 */
class MockAgent extends AbstractAgent {
  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      const { threadId, runId } = input;
      const emit = (e: Record<string, unknown>) => subscriber.next(e as unknown as BaseEvent);
      emit({ type: EventType.RUN_STARTED, threadId, runId });
      emit({ type: EventType.TOOL_CALL_START, toolCallId: 'mock-001', toolCallName: 'GreetingCard' });
      emit({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: 'mock-001',
        delta: JSON.stringify({ name: 'Playground User', message: 'Welcome to nuxt-copilotkit!' })
      });
      emit({ type: EventType.TOOL_CALL_END, toolCallId: 'mock-001' });
      emit({ type: EventType.TEXT_MESSAGE_START, messageId: 'mock-msg-001', role: 'assistant' });
      emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'mock-msg-001', delta: 'I\'ve created a greeting card for you!' });
      emit({ type: EventType.TEXT_MESSAGE_END, messageId: 'mock-msg-001' });
      emit({ type: EventType.RUN_FINISHED, threadId, runId });
      subscriber.complete();
    });
  }
}

const runtime = new CopilotRuntime({ agents: { [DEFAULT_AGENT_ID]: new MockAgent() } });
const handler = fromNodeMiddleware(createCopilotNodeListener({ runtime }));

export default defineEventHandler(async (event: H3Event) => handler(event));
