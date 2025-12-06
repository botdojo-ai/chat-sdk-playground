import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  BotDojoChatProvider,
  McpAppHost,
  ModelContext,
  uiResource,
  textResult,
  useChatActions,
  useChatMessages,
  useChatStatus,
  type ChatMessage,
  type ContentItem,
  type ToolExecutionContext,
  type McpAppData,
} from '@botdojo/chat-sdk';
import { eventBus } from '@/lib/eventBus';
import { useBotDojoChatDebugLogger } from '@/lib/BotDojoChatDebug';
import CodeSnippet from '@/components/CodeSnippet';
import { Tabs } from '@/components/Tabs';

const config = {
  apiKey: process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API || '',
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'http://localhost:3000',
};

// Event types for the monitor
interface AppEvent {
  id: string;
  type: 'ui/open-link' | 'tools/call' | 'ui/message';
  message: string;
  timestamp: Date;
  mcpAppId?: string;
  details?: any;
}

// Inline HTML for the demo MCP App
const INLINE_HTML_APP = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      background: #ffffff;
      color: #0f172a;
      overflow: hidden;
      height: 100%;
    }
    .card {
      background: #ffffff;
      color: #0f172a;
      padding: 16px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      font-family: Inter, system-ui, sans-serif;
      width: 100%;
      box-sizing: border-box;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .title {
      font-weight: 800;
      font-size: 18px;
      color: #0f172a;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .button-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }
    .action-btn {
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      color: #0f172a;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s;
    }
    .action-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .counter-row {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }
    .counter-controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .counter-btn {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      color: #0f172a;
      cursor: pointer;
      font-weight: 600;
      font-size: 16px;
    }
    .counter-value {
      font-weight: 800;
      font-size: 20px;
      color: #0f172a;
      min-width: 40px;
      text-align: center;
    }
    .persistence-text {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="card" id="card">
    <div class="header">
      <div>
        <div class="title">MCP App Demo</div>
        <div class="subtitle">Interactive app with event handling</div>
      </div>
    </div>

    <div class="button-grid">
      <button id="btn-tool" class="action-btn">Call tools/call</button>
      <button id="btn-message" class="action-btn">Send ui/message</button>
      <button id="btn-link" class="action-btn">Open ui/open-link</button>
    </div>

    <div class="counter-row">
      <div class="counter-controls">
        <button id="btn-decrement" class="counter-btn">-</button>
        <div class="counter-value" id="counter-value">0</div>
        <button id="btn-increment" class="counter-btn">+</button>
      </div>
      <div class="persistence-text">State persisted via botdojo/persist</div>
    </div>
  </div>
  <script>
    (function () {
      let counter = 0;
      let busy = false;
      let initialized = false;
      let parentOrigin = '*';
      let msgId = 0;

      const counterValueEl = document.getElementById('counter-value');
      const btnTool = document.getElementById('btn-tool');
      const btnMessage = document.getElementById('btn-message');
      const btnLink = document.getElementById('btn-link');
      const btnDecrement = document.getElementById('btn-decrement');
      const btnIncrement = document.getElementById('btn-increment');
      const cardEl = document.getElementById('card');

      function sendNotification(method, params) {
        window.parent?.postMessage({ jsonrpc: '2.0', method, params }, parentOrigin);
      }

      function sendResponse(id, result) {
        window.parent?.postMessage({ jsonrpc: '2.0', id, result }, parentOrigin);
      }

      function sendRequest(method, params) {
        const id = 'app-' + (++msgId);
        window.parent?.postMessage({ jsonrpc: '2.0', id, method, params }, parentOrigin);
        return id;
      }

      function reportSize() {
        if (!cardEl) return;
        const rect = cardEl.getBoundingClientRect();
        const height = Math.ceil(rect.height) + 24;
        const width = Math.ceil(rect.width);
        sendNotification('ui/size-change', { width, height });
      }

      function updateCounter(val) {
        counter = val;
        if (counterValueEl) {
          counterValueEl.textContent = counter;
        }
        // Persist state via ui/message with botdojo/persist type
        sendRequest('ui/message', {
          role: 'user',
          content: {
            type: 'botdojo/persist',
            state: { counter: val },
          },
        });
      }

      function handleAction(type) {
        if (busy || !initialized) return;
        busy = true;
        
        try {
          switch (type) {
            case 'tool':
              sendRequest('tools/call', {
                name: 'demo_tool',
                arguments: { action: 'test', counter: counter },
              });
              break;
            case 'message':
              sendRequest('ui/message', {
                role: 'user',
                content: { type: 'text', text: 'Hello from MCP App! Counter is ' + counter },
                metadata: { source: 'mcp-app-demo' },
              });
              break;
            case 'link':
              sendRequest('ui/open-link', {
                url: 'https://botdojo.com',
                target: '_blank',
              });
              break;
          }
        } finally {
          busy = false;
        }
      }

      function handleInitialize(params, id) {
        const ctx = params?.hostContext || {};
        const state = ctx.state || {};
        if (typeof state.counter === 'number') {
          counter = state.counter;
          if (counterValueEl) {
            counterValueEl.textContent = counter;
          }
        }
        parentOrigin = '*';
        initialized = true;
        sendResponse(id, { ok: true });
        sendNotification('ui/notifications/initialized', {});
        setTimeout(reportSize, 20);
      }

      function handleMessage(event) {
        const data = event.data;
        if (!data || data.jsonrpc !== '2.0') return;
        
        if (data.method === 'ui/initialize') {
          handleInitialize(data.params, data.id);
        }
      }

      window.addEventListener('message', handleMessage);
      
      btnTool?.addEventListener('click', () => handleAction('tool'));
      btnMessage?.addEventListener('click', () => handleAction('message'));
      btnLink?.addEventListener('click', () => handleAction('link'));
      btnDecrement?.addEventListener('click', () => {
        if (!busy && initialized) updateCounter(counter - 1);
      });
      btnIncrement?.addEventListener('click', () => {
        if (!busy && initialized) updateCounter(counter + 1);
      });

      setTimeout(reportSize, 100);
      
      if (typeof ResizeObserver !== 'undefined' && cardEl) {
        const observer = new ResizeObserver(() => reportSize());
        observer.observe(cardEl);
      }
    })();
  </script>
</body>
</html>`;

// Build remote URL for the existing demo app
const getRemoteUrlCanvasUrl = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3500';
  return `${origin}/examples/chat-sdk/mcp-app-example/canvas/remote-url-app`;
};

// Quick action buttons
const QUICK_ACTIONS = [
  { label: 'Show Inline HTML App', value: 'Show me the inline HTML MCP App' },
  { label: 'Show Remote URL App', value: 'Show me the remote URL MCP App' },
];

function FeedbackIcons() {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '4px', 
      marginTop: '8px',
      marginLeft: '4px',
    }}>
      {['👍', '👎', '💬', '📋'].map((emoji, idx) => (
        <button
          key={idx}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            color: '#9ca3af',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#6b7280';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function MessageBubble(props: { 
  message: ChatMessage; 
  streamingId?: string;
  onOpenLink: (url: string, target: string, mcpAppId: string) => void;
  onToolCall: (tool: string, params: any, mcpAppId: string) => Promise<any>;
  onUiMessage: (message: string, params: any, mcpAppId: string) => void;
  onPersistState?: (state: Record<string, any>, mcpAppId: string) => void;
}) {
  const { message, streamingId, onOpenLink, onToolCall, onUiMessage, onPersistState } = props;
  const isUser = message.role === 'user';
  const isStreaming = message.id === streamingId && message.status === 'streaming';
  const isComplete = message.status === 'complete';

  // Extract MCP App data from steps
  const mcpApps: McpAppData[] = [];
  message.steps?.forEach((step) => {
    const canvas = (step as any).canvas;
    if (canvas?.canvasId) {
      console.log('[MessageBubble] Found canvas in step:', canvas.canvasId, 'isStreaming:', isStreaming, 'isComplete:', isComplete, JSON.stringify(canvas.canvasData, null, 2));
      const already = mcpApps.find((c) => c.mcpAppId === canvas.canvasId);
      if (!already) {
        // Build toolInfo from canvas data
        const toolName = canvas.canvasData?.toolName || canvas.canvasData?.tool?.name;
        const toolInfo = toolName ? {
          id: canvas.canvasId,
          tool: { name: toolName },
        } : undefined;
        
        // Get result from step.content (like ChatMessage.tsx does) or canvasData.result
        // Tool result is typically in step.content, not in canvasData
        const stepResult = (step as any).content ?? canvas.canvasData?.result;
        
        mcpApps.push({
          mcpAppId: canvas.canvasId,
          mcpAppType: canvas.canvasType || 'mcp-app',
          url: canvas.canvasData?.url || canvas.url,
          html: canvas.canvasData?.html || canvas.html,
          // Start with a small height - the app will report its actual size via ui/size-change
          height: canvas.canvasData?.height || canvas.height,
          state: canvas.canvasData?.state,
          toolInfo,
          // Include arguments and result for hydration (sent after app initialized)
          arguments: canvas.canvasData?.arguments,
          result: stepResult,
          // Pass completion status for hydration scenarios
          isComplete: isComplete && !isStreaming,
        } as McpAppData);
        console.log('[MessageBubble] Created mcpApp:', mcpApps[mcpApps.length - 1]);
      }
    }
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '4px',
      }}
    >
      <div
        style={{
          background: isUser ? '#e5e7eb' : '#ffffff',
          color: '#1f2937',
          borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
          padding: isUser ? '14px 18px' : (mcpApps.length > 0 ? '0' : '14px 18px'),
          maxWidth: isUser ? '85%' : (mcpApps.length > 0 ? '100%' : '85%'),
          width: isUser ? undefined : (mcpApps.length > 0 ? '100%' : undefined),
          boxShadow: isUser ? '0 1px 3px rgba(0, 0, 0, 0.06)' : (mcpApps.length > 0 ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.06)'),
          border: 'none',
        }}
      >
        {/* Render MCP Apps using McpAppHost */}
        {!isUser && mcpApps.length > 0 && (
          <div style={{ display: 'grid', gap: '8px', marginBottom: message.content ? 8 : 0 }}>
            {mcpApps.map((mcpApp) => (
              <McpAppHost
                key={mcpApp.mcpAppId}
                mcpAppId={mcpApp.mcpAppId}
                mcpAppData={mcpApp}
                onOpenLink={onOpenLink}
                onToolCall={onToolCall}
                onUiMessage={onUiMessage}
                onPersistState={onPersistState}
                height={mcpApp.height || '100px'}
                debug={true}
              />
            ))}
          </div>
        )}
        {message.content && (
          <div style={{ 
            fontSize: '15px', 
            lineHeight: 1.65, 
            whiteSpace: 'pre-wrap',
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}>
            {message.content}
            {isStreaming && <span style={{ opacity: 0.5, marginLeft: 2 }}>▌</span>}
          </div>
        )}
        {!isUser && !message.content && mcpApps.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#9ca3af',
            fontSize: '14px',
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#6366f1',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            Thinking...
          </div>
        )}
      </div>
      {!isUser && isComplete && <FeedbackIcons />}
    </div>
  );
}

function ChatSurface(props: {
  onQuickAction?: (handler: (value: string) => void) => void;
  quickActions?: { label: string; value: string }[];
  onNewSession?: () => void;
  appEvents: AppEvent[];
  flashingEventId: string | null;
  onOpenLink: (url: string, target: string, mcpAppId: string) => void;
  onToolCall: (tool: string, params: any, mcpAppId: string) => Promise<any>;
  onUiMessage: (message: string, params: any, mcpAppId: string) => void;
}) {
  const { 
    onQuickAction, 
    quickActions, 
    onNewSession, 
    appEvents, 
    flashingEventId,
    onOpenLink,
    onToolCall,
    onUiMessage,
  } = props;
  
  const { messages, currentMessage } = useChatMessages();
  const { status, isReady, error } = useChatStatus();
  const { sendMessage, abortRequest, persistCanvasState } = useChatActions();
  const [input, setInput] = useState('Show me the inline HTML MCP App');
  
  // Handler for MCP App state persistence - forwards to server via HeadlessEmbed
  const handlePersistState = useCallback((state: Record<string, any>, mcpAppId: string) => {
    console.log('[ChatSurface] Persisting state for:', mcpAppId, state);
    persistCanvasState(mcpAppId, state);
  }, [persistCanvasState]);
  const [rightTab, setRightTab] = useState<'chat' | 'code'>('chat');
  const debugLogger = useBotDojoChatDebugLogger();
  const debugLoggerRef = useRef(debugLogger);

  useEffect(() => {
    if (onQuickAction && isReady) {
      onQuickAction((value: string) => {
        setInput(value);
        sendMessage(value);
      });
    }
  }, [onQuickAction, sendMessage, isReady]);

  const handleSend = () => {
    if (!input.trim()) return;
    debugLoggerRef.current?.logInfo('Send message', { input: input.trim() });
    sendMessage(input.trim());
    setInput('');
  };

  useEffect(() => {
    debugLoggerRef.current = debugLogger;
  }, [debugLogger]);

  const codeSample = useMemo(
    () =>
      `// Using McpAppHost for interactive MCP Apps
import { McpAppHost } from '@botdojo/chat-sdk';

<McpAppHost
  mcpAppId={step.mcpApp.mcpAppId}
  mcpAppData={step.mcpApp}
  onToolCall={async (tool, params, appId) => {
    console.log('Tool call:', tool, params);
    return { success: true };
  }}
  onOpenLink={(url, target, appId) => {
    // Links NOT auto-opened - you decide!
    if (confirm('Open ' + url + '?')) {
      window.open(url, target);
    }
  }}
  onUiMessage={(message, params, appId) => {
    console.log('App message:', message);
  }}
/>`,
    []
  );

  const getEventTypeColor = (type: AppEvent['type']) => {
    switch (type) {
      case 'ui/open-link':
        return { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' };
      case 'tools/call':
        return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' };
      case 'ui/message':
        return { bg: '#e0f2fe', border: '#0284c7', text: '#075985' };
    }
  };

  const getEventTypeIcon = (type: AppEvent['type']) => {
    switch (type) {
      case 'ui/open-link': return '🔗';
      case 'tools/call': return '🔧';
      case 'ui/message': return '✉️';
    }
  };

  const getLastEventOfType = (type: AppEvent['type']) => {
    return appEvents.find((e) => e.type === type);
  };

  const isEventTypeActive = (type: AppEvent['type']) => {
    const lastEvent = getLastEventOfType(type);
    return lastEvent && flashingEventId === lastEvent.id;
  };

  const chatHeight = 'calc(100vh - 180px)';

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: '16px', 
      alignItems: 'start',
    }}>
      {/* Left Panel - Event Monitor */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '0',
        boxShadow: '0 14px 36px rgba(15,23,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: chatHeight,
        minHeight: '400px',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>📊</span>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Event Monitor</div>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#ffffff' }}>
          <div style={{ 
            marginBottom: 16, 
            padding: '12px', 
            background: '#f8fafc', 
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Click buttons in the MCP App to see events flow here. Each panel lights up when that event fires.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
            {(['ui/open-link', 'tools/call', 'ui/message'] as const).map((eventType) => {
              const colors = getEventTypeColor(eventType);
              const icon = getEventTypeIcon(eventType);
              const lastEvent = getLastEventOfType(eventType);
              const isActive = isEventTypeActive(eventType);
              const hasEvent = !!lastEvent;

              return (
                <div
                  key={eventType}
                  style={{
                    background: isActive ? colors.bg : hasEvent ? '#f8fafc' : '#fafafa',
                    border: `2px solid ${isActive ? colors.border : hasEvent ? '#cbd5e1' : '#e2e8f0'}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isActive ? `0 8px 24px ${colors.border}40` : 'none',
                    minHeight: 100,
                    maxHeight: 100,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? colors.text : hasEvent ? '#475569' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {eventType}
                    </span>
                    {isActive && (
                      <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: colors.border, animation: 'blink 0.8s infinite' }} />
                    )}
                  </div>
                  {lastEvent && (
                    <>
                      <div style={{ fontSize: 11, color: isActive ? colors.text : '#64748b', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lastEvent.message}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        {lastEvent.timestamp.toLocaleTimeString()}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <style jsx>{`
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
          `}</style>

          {/* Event Log */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
              Recent Events
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {appEvents.slice(0, 5).map((event) => {
                const colors = getEventTypeColor(event.type);
                return (
                  <div
                    key={event.id}
                    style={{
                      padding: '8px 10px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      borderLeft: `3px solid ${colors.border}`,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{event.type}</div>
                    <div style={{ color: '#64748b', marginTop: 2 }}>{event.message}</div>
                  </div>
                );
              })}
              {appEvents.length === 0 && (
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
                  No events yet. Click buttons in the MCP App!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 14px 36px rgba(15,23,42,0.06)',
        overflow: 'hidden',
        height: chatHeight,
        minHeight: '400px',
      }}>
        <Tabs
          tabs={[
            { id: 'chat', label: 'Chat' },
            { id: 'code', label: 'McpAppHost.tsx' },
          ]}
          activeId={rightTab}
          onChange={(id) => setRightTab(id as 'chat' | 'code')}
        />
        
        {/* Quick Actions */}
        {quickActions && quickActions.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {quickActions.map((qa) => (
              <button
                key={qa.value}
                onClick={() => {
                  setInput(qa.value);
                  sendMessage(qa.value);
                }}
                disabled={!isReady || status === 'streaming'}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 500,
                  fontSize: '12px',
                  cursor: isReady && status !== 'streaming' ? 'pointer' : 'not-allowed',
                  opacity: isReady && status !== 'streaming' ? 1 : 0.6,
                  whiteSpace: 'nowrap',
                }}
              >
                {qa.label}
              </button>
            ))}
            {onNewSession && (
              <button
                onClick={onNewSession}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #6366f1',
                  background: '#eef2ff',
                  color: '#4f46e5',
                  fontWeight: 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                New Session
              </button>
            )}
          </div>
        )}
        
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {rightTab === 'chat' ? (
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              flex: 1,
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {error && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: 12,
                    margin: 12,
                    borderRadius: 10,
                    fontSize: '14px',
                  }}
                >
                  Error: {error.message}
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 14, padding: 12 }}>
                {messages.length === 0 && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 12,
                      padding: 18,
                      color: '#475569',
                      fontSize: '14px',
                    }}
                  >
                    Ask to see an MCP App. Click the buttons in the app to trigger events!
                  </div>
                )}
                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    streamingId={currentMessage?.id}
                    onOpenLink={onOpenLink}
                    onToolCall={onToolCall}
                    onUiMessage={onUiMessage}
                    onPersistState={handlePersistState}
                  />
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  borderTop: '1px solid #e2e8f0',
                  padding: 12,
                  background: '#ffffff',
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask to see an MCP App..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: 14,
                    minWidth: 0,
                  }}
                  disabled={!isReady || status === 'streaming'}
                />
                <button
                  onClick={handleSend}
                  disabled={!isReady || status === 'streaming' || !input.trim()}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#0ea5e9',
                    color: '#f8fafc',
                    fontWeight: 700,
                    cursor: !isReady || status === 'streaming' || !input.trim() ? 'not-allowed' : 'pointer',
                    opacity: !isReady || status === 'streaming' || !input.trim() ? 0.6 : 1,
                    fontSize: '14px',
                  }}
                >
                  Send
                </button>
                <button
                  onClick={abortRequest}
                  disabled={status !== 'streaming'}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#0f172a',
                    cursor: status !== 'streaming' ? 'not-allowed' : 'pointer',
                    opacity: status !== 'streaming' ? 0.5 : 1,
                  }}
                >
                  Stop
                </button>
              </div>
            </div>
          ) : (
            <CodeSnippet
              code={codeSample}
              language="typescript"
              title="McpAppHost.tsx"
              fullHeight
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeadlessMcpExample() {
  const router = useRouter();
  const newSession = router.query['new-session'] === 'true' || router.query['newsession'] === 'true';
  const [providerKey, setProviderKey] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const debugLogger = useBotDojoChatDebugLogger();
  const quickActionHandlerRef = useRef<((value: string) => void) | null>(null);

  // Event state
  const [appEvents, setAppEvents] = useState<AppEvent[]>([]);
  const [flashingEventId, setFlashingEventId] = useState<string | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ url: string; target: string } | null>(null);

  const addAppEvent = useCallback((type: AppEvent['type'], message: string, mcpAppId?: string, details?: any) => {
    const eventId = `${type}-${Date.now()}-${Math.random()}`;
    const event: AppEvent = {
      id: eventId,
      type,
      message,
      timestamp: new Date(),
      mcpAppId,
      details,
    };
    setAppEvents((prev) => [event, ...prev].slice(0, 20));
    setFlashingEventId(eventId);
    setTimeout(() => setFlashingEventId(null), 1200);
  }, []);

  // Event handlers for MCP Apps
  const handleOpenLink = useCallback((url: string, target: string, mcpAppId: string) => {
    addAppEvent('ui/open-link', `${url}`, mcpAppId, { url, target });
    debugLogger?.logCanvasLink(url, target, mcpAppId);
    // Show confirmation dialog
    setLinkDialog({ url, target });
  }, [addAppEvent, debugLogger]);

  const handleToolCall = useCallback(async (tool: string, params: any, mcpAppId: string): Promise<any> => {
    addAppEvent('tools/call', `${tool}`, mcpAppId, params);
    debugLogger?.logCanvasIntent(tool, params, mcpAppId);
    // Simulate tool execution
    return { success: true, tool, params, timestamp: new Date().toISOString() };
  }, [addAppEvent, debugLogger]);

  const handleUiMessage = useCallback((message: string, params: any, mcpAppId: string) => {
    addAppEvent('ui/message', message.slice(0, 50), mcpAppId, params);
    debugLogger?.logCanvasNotify(message, params, mcpAppId);
  }, [addAppEvent, debugLogger]);

  const handleConfirmOpenLink = useCallback(() => {
    if (linkDialog) {
      window.open(linkDialog.url, '_blank', 'noopener,noreferrer');
      setLinkDialog(null);
    }
  }, [linkDialog]);

  const handleCancelOpenLink = useCallback(() => {
    setLinkDialog(null);
  }, []);

  const localOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3500';

  const modelContext = useMemo<ModelContext>(() => ({
    name: 'headless_mcp_demo',
    description: 'Demo MCP Apps for headless chat with McpAppHost',
    toolPrefix: 'demo',
    uri: 'headless-mcp-demo://context',
    resourceUri: 'headless-mcp-demo://context',
    prompts: [],
    tools: [
      {
        name: 'show_inline_html_app',
        description: 'Show an inline HTML MCP App with buttons for ui/message, tools/call, and ui/open-link.',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'Set to true to show the app' },
          },
          required: ['go'],
        },
        _meta: {
          ui: {
            resourceUri: 'ui://headless-mcp-demo/html',
            csp: {
              connectDomains: [localOrigin],
              resourceDomains: [localOrigin],
            },
          },
        },
        execute: async (_args: any, context?: ToolExecutionContext) => {
          context?.notifyToolInputPartial?.({ stepId: 'init', stepLabel: 'Initializing app...' });
          await new Promise(r => setTimeout(r, 500));
          context?.notifyToolResult?.({ result: 'Inline HTML App ready' });
          return [textResult('Here is the inline HTML MCP App. Click the buttons to trigger events!')];
        },
      },
      {
        name: 'show_remote_url_app',
        description: 'Show a remote URL MCP App with streaming status updates.',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'Set to true to show the app' },
          },
          required: ['go'],
        },
        _meta: {
          ui: {
            resourceUri: getRemoteUrlCanvasUrl(),
            prefersProxy: false,
            csp: {
              connectDomains: [localOrigin],
              resourceDomains: [localOrigin],
            },
          },
        },
        execute: async (_args: any, context?: ToolExecutionContext) => {
          const steps = [
            { stepId: 'step-1', stepLabel: 'Initializing…', delayMs: 1000 },
            { stepId: 'step-2', stepLabel: 'Loading app…', delayMs: 1500 },
            { stepId: 'step-3', stepLabel: 'Ready!', delayMs: 500 },
          ];
          for (const step of steps) {
            context?.notifyToolInputPartial?.({ stepId: step.stepId, stepLabel: step.stepLabel });
            await new Promise(r => setTimeout(r, step.delayMs));
          }
          context?.notifyToolResult?.({ result: 'Remote URL App loaded' });
          return [textResult('Here is the remote URL MCP App with streaming status!')];
        },
      },
    ],
    resources: [
      {
        uri: 'ui://headless-mcp-demo/html',
        name: 'Inline MCP HTML App',
        description: 'Demo MCP App with interactive buttons',
        mimeType: 'text/html+mcp',
        getContent: async () => ({
          uri: 'ui://headless-mcp-demo/html',
          mimeType: 'text/html+mcp',
          text: INLINE_HTML_APP,
        }),
      },
    ],
  }), [localOrigin]);

  useEffect(() => {
    if (!config.apiKey) {
      eventBus.logError(new Error('Missing NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API'));
    }
  }, []);

  if (!config.apiKey) {
    return (
      <div style={{ padding: '24px' }}>
        <div
          style={{
            padding: '20px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '12px',
            maxWidth: 820,
          }}
        >
          <strong>Missing API key.</strong> Run <code>pnpm setup-playground</code> to set{' '}
          <code>NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API</code> and reload this page.
        </div>
      </div>
    );
  }

  const handleNewSession = () => {
    sessionIdRef.current = null;
    setAppEvents([]);
    setProviderKey((key) => key + 1);
  };

  return (
    <BotDojoChatProvider
      key={`headless-mcp-${providerKey}`}
      apiKey={config.apiKey}
      baseUrl={config.baseUrl}
      modelContext={modelContext}
      newSession={newSession || providerKey > 0}
      onReady={() => {
        eventBus.logInfo('Headless MCP provider ready', {}, 'chat-sdk');
        debugLogger?.logInfo('Headless MCP provider ready');
      }}
      onSessionCreated={(sessionId) => {
        eventBus.logInfo('Session created', { sessionId }, 'chat-sdk');
        sessionIdRef.current = sessionId;
        debugLogger?.logSessionCreated(sessionId);
      }}
      onConnectorInit={() => {
        eventBus.logInfo('Connector ready', {}, 'chat-sdk');
        debugLogger?.logInfo('Connector ready');
      }}
      onConnectorError={(err) => {
        eventBus.logError(err);
        debugLogger?.logError(err);
      }}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px', 
        position: 'relative',
      }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ 
            margin: 0,
            marginBottom: '8px',
            fontSize: '24px',
            fontWeight: 700,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span>🎨</span> Custom Chat UI
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#475569', 
            lineHeight: 1.6 
          }}>
            Build your own chat interface with full control over styling and layout. MCP Apps render inline via <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>McpAppHost</code>, 
            which handles all MCP-UI events: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>ui/message</code>, 
            <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>tools/call</code>, 
            <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>ui/open-link</code>.
          </p>
        </div>
        
        <ChatSurface
          onQuickAction={(handler) => { quickActionHandlerRef.current = handler; }}
          quickActions={QUICK_ACTIONS}
          onNewSession={handleNewSession}
          appEvents={appEvents}
          flashingEventId={flashingEventId}
          onOpenLink={handleOpenLink}
          onToolCall={handleToolCall}
          onUiMessage={handleUiMessage}
        />
      </div>

      {/* Link Confirmation Dialog */}
      {linkDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={handleCancelOpenLink}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🔗</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Open External Link
              </h3>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
              The MCP App is requesting to open:
            </p>
            <div
              style={{
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                wordBreak: 'break-all',
                fontSize: '13px',
                color: '#0f172a',
                fontFamily: 'monospace',
              }}
            >
              {linkDialog.url}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelOpenLink}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOpenLink}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Open Link
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </BotDojoChatProvider>
  );
}

