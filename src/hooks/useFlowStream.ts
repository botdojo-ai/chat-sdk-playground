/**
 * Shared Hook: useFlowStream
 * 
 * Consolidates SSE event handling and eventBus logging for flow runs.
 * Used by all flow examples to avoid code duplication.
 */

import { useRef } from 'react';
import { eventBus } from '@/utils/eventBus';

export interface ToolCall {
  name: string;
  arguments: any;
  result?: string;
  timestamp: string;
}

export interface Step {
  stepId?: string;
  stepLabel: string;
  stepStatus: string;
  content?: string;
  timestamp: string;
}

export interface FlowStreamCallbacks {
  onToken?: (token: string) => void;
  onStep?: (step: Step) => void;
  onToolStart?: (tool: { name: string; arguments: any }) => void;
  onToolEnd?: (tool: { name: string; arguments: any; result: any }) => void;
  onComplete?: () => void;
  onFlowRequestStart?: (request: any) => void;
  onFlowRequestEnd?: (request: any) => void;
  onError?: (error: string) => void;
  onSessionId?: (sessionId: string) => void;
}

/**
 * Process SSE stream from flow API response
 * Automatically logs all events to eventBus
 * Calls provided callbacks for state updates
 */
export async function processFlowStream(
  response: Response,
  callbacks: FlowStreamCallbacks
): Promise<void> {
  const {
    onToken,
    onStep,
    onToolStart,
    onToolEnd,
    onComplete,
    onFlowRequestStart,
    onFlowRequestEnd,
    onError,
    onSessionId,
  } = callbacks;

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

      for (const line of lines) {
        try {
          const eventData = JSON.parse(line.substring(5).trim());
          console.log(`[FlowStream] Received event: ${eventData.type}`, eventData);

          switch (eventData.type) {
            case 'token':
              const tokenStr = typeof eventData.token === 'string' 
                ? eventData.token 
                : JSON.stringify(eventData.token);
              eventBus.logToken(tokenStr);
              onToken?.(tokenStr);
              break;

            case 'complete':
              eventBus.logInfo('Flow completed');
              onComplete?.();
              break;

            case 'step':
              const { step } = eventData;
              eventBus.logStep(step);
              
              const stepInfo: Step = {
                stepId: step.stepId,
                stepLabel: step.stepLabel || 'Step',
                stepStatus: step.stepStatus || 'processing',
                content: step.content,
                timestamp: eventData.timestamp || new Date().toISOString(),
              };
              
              onStep?.(stepInfo);

              // Handle legacy tool calls embedded in step.content
              if (step.content) {
                try {
                  const parsed = JSON.parse(step.content);
                  if (parsed.tool_calls) {
                    parsed.tool_calls.forEach((tc: any) => {
                      const toolName = tc.function?.name || tc.name;
                      const toolArgs = tc.function?.arguments || tc.arguments;
                      const toolResult = tc.result;
                      
                      if (toolName) {
                        eventBus.logToolCall(toolName, toolArgs);
                        if (toolResult) {
                          onToolEnd?.({ name: toolName, arguments: toolArgs, result: toolResult });
                        } else {
                          onToolStart?.({ name: toolName, arguments: toolArgs });
                        }
                      }
                    });
                  }
                } catch (e) {
                  // Not JSON, ignore
                }
              }
              break;

            case 'toolStart':
              const { tool: toolStart } = eventData;
              eventBus.logToolCall(toolStart.name, toolStart.arguments);
              onToolStart?.(toolStart);
              break;

            case 'toolEnd':
              const { tool: toolEnd } = eventData;
              eventBus.logToolCall(toolEnd.name, toolEnd.arguments);
              onToolEnd?.(toolEnd);
              break;

            case 'flowRequestStart':
              const data = eventData;
              const requestSessionId = data.request?.flow_session_id 
                || data.request?.session_id 
                || data.request?.sessionId;
              
              if (requestSessionId) {
                onSessionId?.(requestSessionId);
              }
              
              eventBus.logInfo('Flow started', data.request);
              onFlowRequestStart?.(data.request);
              break;

            case 'flowRequestEnd':
              const endData = eventData;
              const endSessionId = endData.request?.flow_session_id 
                || endData.request?.session_id 
                || endData.request?.sessionId;
              
              if (endSessionId) {
                onSessionId?.(endSessionId);
              }
              
              eventBus.logInfo('Flow completed', endData.request);
              onFlowRequestEnd?.(endData.request);
              break;

            case 'error':
              const errorMessage = eventData.error || 'Unknown error';
              eventBus.logError(errorMessage);
              onError?.(errorMessage);
              throw new Error(errorMessage);

            default:
              // Handle legacy error format
              if (eventData.error) {
                eventBus.logError(eventData.error);
                onError?.(eventData.error);
                throw new Error(eventData.error);
              } else {
                // Log unknown events
                eventBus.logInfo('Event received', eventData);
              }
          }
        } catch (parseError: any) {
          console.error(`[FlowStream] Failed to parse SSE event: ${line}. Error: ${parseError.message}`);
          // Don't throw - continue processing other events
        }
      }
    }

    eventBus.logInfo('Stream ended');
  } catch (err: any) {
    const errorMessage = err.message || 'Unknown error';
    eventBus.logError(err);
    onError?.(errorMessage);
    throw err;
  }
}

/**
 * Hook to manage flow stream processing state
 */
export function useFlowStream() {
  const toolCallsMapRef = useRef<Map<string, ToolCall>>(new Map());
  const stepsRef = useRef<Step[]>([]);
  const responseTextRef = useRef<string>('');

  const reset = () => {
    toolCallsMapRef.current.clear();
    stepsRef.current = [];
    responseTextRef.current = '';
  };

  return {
    toolCallsMap: toolCallsMapRef.current,
    steps: stepsRef.current,
    responseText: responseTextRef.current,
    reset,
  };
}

