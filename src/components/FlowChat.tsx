import { useState, useRef, useEffect } from 'react';
import { eventBus } from '@/utils/eventBus';
import { processFlowStream, type ToolCall, type Step } from '@/hooks/useFlowStream';

const SESSION_STORAGE_KEY = 'botdojo_chat_session_id';

// ToolCall and Step types imported from useFlowStream

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  steps?: Step[];
  isStreaming?: boolean;
}

interface FlowChatProps {
  apiEndpoint: string;
  title: string;
  description: string;
  quickActions?: Array<{
    label: string;
    value: string;
    icon: string;
  }>;
  sessionStorageKey?: string;
  flowType?: 'basic' | 'model-context'; // Which flow API key to use for session history
  className?: string;
  hideHeader?: boolean;
  id?: string;
}

export default function FlowChat(props: FlowChatProps) {
  const {
    apiEndpoint,
    title,
    description,
    quickActions = [],
    sessionStorageKey = SESSION_STORAGE_KEY,
    flowType = 'basic',
    className = '',
    hideHeader = false,
    id,
  } = props;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentToolCalls, setCurrentToolCalls] = useState<Map<string, ToolCall>>(new Map());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load session ID from localStorage on mount and check for newsession query param
  useEffect(() => {
    // Check if URL has ?newsession=true to force new session
    const urlParams = new URLSearchParams(window.location.search);
    const forceNewSession = urlParams.get('newsession') === 'true';
    
    if (forceNewSession) {
      // Clear existing session
      localStorage.removeItem(sessionStorageKey);
      setSessionId(null);
      setMessages([]);
      eventBus.clear();
      eventBus.logInfo('New session started (from URL parameter)');
      console.log('[Frontend] newsession=true detected, starting new session.');
    } else {
      const storedSessionId = localStorage.getItem(sessionStorageKey);
      if (storedSessionId) {
        setSessionId(storedSessionId);
        loadSessionHistory(storedSessionId);
      }
    }
  }, [sessionStorageKey]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessionHistory = async (sessionId: string) => {
    setLoadingHistory(true);
    try {
      console.log('[FlowChat] Loading session history...', { sessionId, flowType });
      
      // Get flowId from environment - using model context flow for all types
      const flowId = process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_FLOW_ID;
      
      if (!flowId) {
        console.warn('[FlowChat] Flow ID not configured for flowType:', flowType);
        eventBus.logError(new Error(`Flow ID not configured for ${flowType}. Run setup script first.`));
        return;
      }
      
      const response = await fetch(`/api/session-history?sessionId=${sessionId}&flowId=${flowId}&flowType=${flowType}`);
      
      if (response.ok) {
        const history = await response.json();
        const flowRequests = history.flowRequests || history.requests || [];
        
        console.log(`[FlowChat] Received ${flowRequests.length} flow requests from API`);
        
        if (flowRequests.length > 0) {
          // Convert history to messages using typed userMessage and aiMessage fields
          const historyMessages: Message[] = [];
          
          flowRequests.forEach((fr: any) => {
            // Add user message if exists
            if (fr.userMessage && fr.userMessage.content) {
              historyMessages.push({
                role: 'user',
                content: fr.userMessage.content,
              });
            }
            
            // Add assistant response if exists
            if (fr.aiMessage && fr.aiMessage.content) {
              historyMessages.push({
                role: 'assistant',
                content: fr.aiMessage.content,
                isStreaming: false,
              });
            }
          });
          
          setMessages(historyMessages);
          console.log(`[FlowChat] Created ${historyMessages.length} messages from ${flowRequests.length} flow requests`);
          eventBus.logInfo(`Loaded ${historyMessages.length} messages from session history`);
        } else {
          console.log('[FlowChat] No history found for this session');
          eventBus.logInfo('No session history found');
        }
      } else {
        const errorText = await response.text();
        console.error('[FlowChat] Failed to load session history:', response.status, errorText);
      }
    } catch (err) {
      console.error('[FlowChat] Failed to load session history:', err);
      eventBus.logError(err instanceof Error ? err : new Error('Failed to load session history'));
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewSession = () => {
    localStorage.removeItem(sessionStorageKey);
    setSessionId(null);
    setMessages([]);
    setError('');
    eventBus.clear();
    eventBus.logInfo('New session started');
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const userInput = input;
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');
    setCurrentToolCalls(new Map());

    // Add a placeholder for the assistant's response
    const assistantMessageIndex = messages.length + 1;
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '', isStreaming: true, toolCalls: [], steps: [] }
    ]);

    try {
      const currentSessionId = localStorage.getItem(sessionStorageKey) || sessionId;
      console.log('[Frontend] Sending request with sessionId:', currentSessionId);
      eventBus.logInfo('Sending message...', { input: userInput, sessionId: currentSessionId });

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          input: userInput,
          sessionId: currentSessionId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run flow');
      }

      // Use shared flow stream processor
      let responseText = '';
      let currentSteps: Step[] = [];
      let toolCallsMap = new Map<string, ToolCall>();

      await processFlowStream(response, {
        onToken: (token) => {
          responseText += token;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[assistantMessageIndex] = {
              ...newMessages[assistantMessageIndex],
              content: responseText,
              isStreaming: true,
              // Preserve toolCalls from map and steps
              toolCalls: Array.from(toolCallsMap.values()),
              steps: newMessages[assistantMessageIndex].steps || [],
            };
            return newMessages;
          });
        },
        onStep: (step) => {
          const existingStepIndex = currentSteps.findIndex(s => 
            s.stepId && step.stepId && s.stepId === step.stepId
          );
          
          if (existingStepIndex !== -1) {
            currentSteps[existingStepIndex] = step;
          } else {
            currentSteps.push(step);
          }

          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[assistantMessageIndex] = {
              ...newMessages[assistantMessageIndex],
              steps: [...currentSteps],
              // Preserve toolCalls from map and content
              toolCalls: Array.from(toolCallsMap.values()),
              content: newMessages[assistantMessageIndex].content || '',
            };
            return newMessages;
          });
        },
        onToolStart: (tool) => {
          console.log('[FlowChat] Tool started:', tool.name, tool.arguments);
          const toolCall: ToolCall = {
            name: tool.name,
            arguments: tool.arguments,
            timestamp: new Date().toISOString(),
          };
          
          // Use tool name as key (same as basic.tsx for consistency)
          toolCallsMap.set(tool.name, toolCall);
          setCurrentToolCalls(new Map(toolCallsMap));
          
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[assistantMessageIndex] = {
              ...newMessages[assistantMessageIndex],
              toolCalls: Array.from(toolCallsMap.values()),
            };
            return newMessages;
          });
        },
        onToolEnd: (tool) => {
          console.log('[FlowChat] Tool ended:', tool.name, tool.result);
          // Always create a new ToolCall object (matching basic.tsx behavior)
          const toolCall: ToolCall = {
            name: tool.name,
            arguments: tool.arguments,
            result: typeof tool.result === 'string' 
              ? tool.result 
              : JSON.stringify(tool.result, null, 2),
            timestamp: new Date().toISOString(),
          };
          toolCallsMap.set(tool.name, toolCall);
          
          setCurrentToolCalls(new Map(toolCallsMap));
          
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[assistantMessageIndex] = {
              ...newMessages[assistantMessageIndex],
              toolCalls: Array.from(toolCallsMap.values()),
            };
            return newMessages;
          });
        },
        onComplete: () => {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[assistantMessageIndex] = {
              ...newMessages[assistantMessageIndex],
              content: responseText || '✓ Flow completed',
              isStreaming: false,
              toolCalls: Array.from(toolCallsMap.values()),
              steps: currentSteps,
            };
            return newMessages;
          });
          setCurrentToolCalls(new Map());
        },
        onFlowRequestStart: (request) => {
          const requestSessionId = request?.flow_session_id || request?.session_id || request?.sessionId;
          console.log('[Frontend] Flow request start - session_id:', requestSessionId);
          if (requestSessionId) {
            console.log('[Frontend] Storing session ID from flow request:', requestSessionId);
            setSessionId(requestSessionId);
            localStorage.setItem(sessionStorageKey, requestSessionId);
          }
        },
        onFlowRequestEnd: (request) => {
          const endSessionId = request?.flow_session_id || request?.session_id || request?.sessionId;
          if (endSessionId && !sessionId) {
            console.log('[Frontend] Storing session ID from flow request end:', endSessionId);
            setSessionId(endSessionId);
            localStorage.setItem(sessionStorageKey, endSessionId);
          }
        },
        onSessionId: (sessionId) => {
          setSessionId(sessionId);
          localStorage.setItem(sessionStorageKey, sessionId);
        },
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      console.error(err);
      eventBus.logError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id={id} className={`p-8 max-w-5xl mx-auto h-full flex flex-col ${className}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-2 text-slate-900">
            {title}
          </h1>
          <p className="text-slate-600 text-base">
            {description}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-6 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        {loadingHistory && (
          <div className="text-center text-slate-500 py-5 animate-pulse">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            Loading session history...
          </div>
        )}
        
        {messages.length === 0 && !loadingHistory && (
          <div className="text-center text-slate-500 py-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-lg">No messages yet. Start a conversation!</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`
              mb-4 p-4 rounded-xl backdrop-blur-sm transition-all duration-200
              ${message.role === 'user' 
                ? 'bg-slate-50 border border-slate-200' 
                : 'bg-white border border-indigo-100'
              }
            `}
          >
            <div className="flex items-center gap-2 text-xs font-semibold mb-2">
              <span className="text-lg">{message.role === 'user' ? '👤' : '🤖'}</span>
              <span className={message.role === 'user' ? 'text-slate-600' : 'text-indigo-600'}>
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              {message.isStreaming && (
                <span className="text-slate-400 animate-pulse">
                  (streaming...)
                </span>
              )}
            </div>
            
            {/* Tool Calls - Show BEFORE message content */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className={message.content ? 'mb-3' : ''}>
                {message.toolCalls.map((toolCall, toolIndex) => (
                  <div
                    key={toolIndex}
                    className="mb-2 p-3 bg-slate-50 rounded-lg border border-amber-100"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔧</span>
                      <span className="font-semibold text-amber-700">{toolCall.name}</span>
                      {toolCall.result && <span className="text-emerald-600">✓</span>}
                    </div>
                    <div className="text-sm text-slate-600">
                      <strong className="text-slate-700">Args:</strong>
                      <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto border border-slate-200">
                        {JSON.stringify(toolCall.arguments, null, 2)}
                      </pre>
                    </div>
                    {toolCall.result && (
                      <div className="text-sm text-slate-600 mt-2">
                        <strong className="text-slate-700">Result:</strong>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto border border-slate-200">
                          {toolCall.result}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message Content - Show AFTER tool calls */}
            <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
              {message.content || (
                <span className="text-slate-400 italic">Thinking...</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <strong>Error:</strong>
          </div>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInput(action.value)}
                disabled={loading}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg
                  transition-all duration-200
                  ${loading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-sm'
                  }
                `}
              >
                <span className="mr-1.5">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session Info & Clear Button */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Session:</span>
          {sessionId ? (
            <span className="text-emerald-700 font-mono text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              {sessionId.substring(0, 8)}...
            </span>
          ) : (
            <span className="text-slate-500 text-xs">No active session</span>
          )}
        </div>
        <button
          onClick={startNewSession}
          disabled={loading || loadingHistory}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-lg
            transition-all duration-200
            ${loading || loadingHistory
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-white text-slate-700 border border-slate-200 hover:border-red-200 hover:text-red-600'
            }
          `}
        >
          🗑️ Clear Session
        </button>
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={loading}
          className="
            flex-1 px-4 py-3 text-base
            bg-white text-slate-900 placeholder-slate-400
            border border-slate-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-150
          "
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className={`
            px-6 py-3 text-base font-semibold rounded-xl
            transition-all duration-200
            ${loading || !input.trim()
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-pulse">⏳</span>
              Running...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>➤</span>
              Send
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
