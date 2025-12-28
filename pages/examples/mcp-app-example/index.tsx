import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BotDojoChat, type BotDojoChatControl, type ModelContext, type ToolExecutionContext, textResult } from '@botdojo/chat-sdk';
import CodeSnippet from '@/components/CodeSnippet';
import { useBotDojoChatDebugLogger } from '@/utils/BotDojoChatDebug';
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

// Hook to detect mobile viewport
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

/** Event from an MCP App - tracks events for the monitor UI */
interface McpAppEvent {
  id: string;
  type: 'ui/open-link' | 'tools/call' | 'ui/message';
  message: string;
  timestamp: Date;
  appId?: string;
  details?: any;
}

// Shared state shape for MCP App persistence demos (imported by widget pages).
export class WidgetState {
  counter: number = 0;
}

const config = {
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};


const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Build absolute MCP App URL (needed for pre-rendering which happens server-side)
// Uses useMcpApp from mcp-app-view/react
const getMcpAppUrl = () => {
  const origin = typeof window !== 'undefined' ?  window.location.origin : 'http://localhost:3500';
  return `${origin}/examples/mcp-app-example/widgets/remote-url-app`;
};
export default function McpAppExample() {
  const [appEvents, setAppEvents] = useState<McpAppEvent[]>([]);
  const [lastAppId, setLastAppId] = useState<string | null>(null);
  const [flashingEventId, setFlashingEventId] = useState<string | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ url: string; target: string } | null>(null);
  const [isFullscreenChat, setIsFullscreenChat] = useState(false);
  const debugLogger = useBotDojoChatDebugLogger();
  const debugLoggerRef = useRef(debugLogger);
  const isMobile = useIsMobile();
  
  // Get temporary JWT token for secure API access
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();

  const addAppEvent = useCallback((type: McpAppEvent['type'], message: string, appId?: string, details?: any) => {
    const eventId = `${type}-${Date.now()}-${Math.random()}`;
    const event: McpAppEvent = {
      id: eventId,
      type,
      message,
      timestamp: new Date(),
      appId,
      details,
    };
    setAppEvents((prev) => [event, ...prev].slice(0, 10)); // Keep last 10 events
    setFlashingEventId(eventId);
    setTimeout(() => setFlashingEventId(null), 1200); // Clear flash after animation
  }, []);

  useEffect(() => {
    debugLoggerRef.current = debugLogger;
  }, [debugLogger]);

  const remoteAppOrigin = useMemo(() => {
    try {
      const remoteUrl = getMcpAppUrl();
      return new URL(remoteUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3500').origin;
    } catch {
      return 'http://localhost:3500';
    }
  }, []);
  const localOrigin = remoteAppOrigin || 'http://localhost:3500';

  const modelContext = useMemo<ModelContext>(() => ({
    name: 'mcp_app_demo',
    description: 'MCP App demo tools showing MCP Apps actions and BotDojo extensions',
    toolPrefix: 'mcpapp',
    uri: 'mcp-app-demo://context',
    tools: [
      {
        name: 'show_remote_url_app',
        description: 'Show the Remote Url App with all MCP Apps actions + streaming state.',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'set to true to show the Remote Url App' },
          },
          required: ['go'],
        },
        _meta: {
          ui: {
            resourceUri: getMcpAppUrl(),
            csp: {
              connectDomains: [localOrigin],
              resourceDomains: [localOrigin],
            },
          },
        },
        execute: async (_args: any, context?: ToolExecutionContext) => {
          const steps: Array<{
            stepId: string;
            stepLabel: string;
            delayMs: number;
          }> = [
            { stepId: 'step-1', stepLabel: 'Initializing…', delayMs: 1500 },
            { stepId: 'step-2', stepLabel: 'Incrementing counter…', delayMs: 2000 },
            { stepId: 'step-3', stepLabel: 'Pushing stream patch…', delayMs: 3000 },
            { stepId: 'step-4', stepLabel: 'App returned', delayMs: 1000 },
          ];
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            context?.notifyToolInputPartial?.({
              kind: 'botdojo-tool-progress',
              stepId: step.stepId,
              stepLabel: step.stepLabel,
            });
            if (step.delayMs > 0) {
              await delay(step.delayMs);
            }
          }
          await delay(1000);
          context?.notifyToolResult?.({
            result: 'Remote Url App returned',
          });
          return [
            textResult('Remote Url App returned'),
          ];
        },
      },
     
      {
        name: 'show_html_app',
        description: 'Show the Inline Html App with JSON-RPC over postMessage.',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'set to true to render the Inline Html App' },
          },
          required: ['go'],
        },
        _meta: {
          'botdojo/no-cache': true,
          ui: {
            resourceUri: 'ui://mcp-app-demo/example_mcp_app',
          },
        },
        execute: async (_args: any, context?: ToolExecutionContext) => {
          const steps: Array<{
            stepId: string;
            stepLabel: string;
            delayMs: number;
          }> = [
            { stepId: 'step-1', stepLabel: 'Initializing…', delayMs: 1500 },
            { stepId: 'step-2', stepLabel: 'Incrementing counter…', delayMs: 2000 },
            { stepId: 'step-3', stepLabel: 'Pushing stream patch…', delayMs: 3000 },
            { stepId: 'step-4', stepLabel: 'App returned', delayMs: 1000 },
          ];
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            context?.notifyToolInputPartial?.({
              kind: 'botdojo-tool-progress',
              stepId: step.stepId,
              stepLabel: step.stepLabel,
            });
            if (step.delayMs > 0) {
              await delay(step.delayMs);
            }
          }
          await delay(1000);
          context?.notifyToolResult?.({
            result: 'Inline Html App ready',
          });
          return [
            textResult('Inline Html App returned'),
          ];
        },
      },
    ],
    resources: [
      {
        uri: 'ui://mcp-app-demo/example_mcp_app',
        name: 'Inline MCP HTML App',
        description: 'Inline MCP Apps HTML resource for ui/message + counter persistence',
        mimeType: 'text/html;profile=mcp-app',

        getContent: async () => {
          // Fetch via API route to avoid webpack caching issues
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          const html = await fetchMcpAppHtml('streaming-demo-app');
          return {
            uri: 'ui://mcp-app-demo/html',
            mimeType: 'text/html;profile=mcp-app',
            text: html,
          };
        },
      },
     
    ],
    prompts: [],
  }), []);

  const codeSample = useMemo(
    () =>
      `
const modelContext = useMemo<ModelContext>(() => ({
    name: 'mcp_app_demo',
    description: 'MCP App demo tools showing MCP Apps actions and BotDojo extensions',
    toolPrefix: 'mcpapp',
    uri: 'mcp-app-demo://context',
    tools: [
      {
        name: 'show_remote_url_app',
        description: 'Show the Remote Url App with all MCP Apps actions + streaming state.',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'set to true to show the Remote Url App' },
          },
          required: ['go'],
        },
        _meta: {
          ui: {
            resourceUri: getMcpAppUrl(),
          },
        },
        execute: async (_args: any, context?: ToolExecutionContext) => {
          const steps: Array<{
            stepId: string;
            stepLabel: string;
            delayMs: number;
          }> = [
            { stepId: 'step-1', stepLabel: 'Initializing…', delayMs: 1500 },
            { stepId: 'step-2', stepLabel: 'Incrementing counter…', delayMs: 2000 },
            { stepId: 'step-3', stepLabel: 'Pushing stream patch…', delayMs: 3000 },
            { stepId: 'step-4', stepLabel: 'App returned', delayMs: 1000 },
          ];
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            context?.notifyToolInputPartial?.({
              kind: 'botdojo-tool-progress',
              stepId: step.stepId,
              stepLabel: step.stepLabel,
            });
            if (step.delayMs > 0) {
              await delay(step.delayMs);
            }
          }
          await delay(1000);
          context?.notifyToolResult?.({
            result: 'Remote Url App returned',
          });
          return [
            textResult('Remote Url App returned'),
          ];
        },
      },
     
      {
        name: 'show_html_app',
        description: 'Show the Inline Html App with JSON-RPC over postMessage.',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'set to true to render the Inline Html App' },
          },
          required: ['go'],
        },
        _meta: {
          'botdojo/no-cache': true,
          ui: {
            resourceUri: 'ui://mcp-app-demo/html',
          },
        },
        execute: async (_args: any, context?: ToolExecutionContext) => {
          const steps: Array<{
            stepId: string;
            stepLabel: string;
            delayMs: number;
          }> = [
            { stepId: 'step-1', stepLabel: 'Initializing…', delayMs: 1500 },
            { stepId: 'step-2', stepLabel: 'Incrementing counter…', delayMs: 2000 },
            { stepId: 'step-3', stepLabel: 'Pushing stream patch…', delayMs: 3000 },
            { stepId: 'step-4', stepLabel: 'App returned', delayMs: 1000 },
          ];
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            context?.notifyToolInputPartial?.({
              kind: 'botdojo-tool-progress',
              stepId: step.stepId,
              stepLabel: step.stepLabel,
            });
            if (step.delayMs > 0) {
              await delay(step.delayMs);
            }
          }
          await delay(1000);
          context?.notifyToolResult?.({
            result: 'Inline Html App ready',
          });
          return [
            textResult('Inline Html App returned'),
          ];
        },
      },
    ],
    resources: [
      {
        uri: 'ui://mcp-app-demo/html',
        name: 'Inline MCP HTML App',
        description: 'Inline MCP Apps HTML resource for ui/message + counter persistence',
        mimeType: 'text/html;profile=mcp-app',
        getContent: async () => {
          const { BUNDLED_MCP_APP_HTML } = await import('@generated/remote-url-app');
          return {
            uri: 'ui://mcp-app-demo/html',
            mimeType: 'text/html;profile=mcp-app',
            text: BUNDLED_MCP_APP_HTML,
          };
        },
      },
     
    ],
    prompts: [],
  })`,
    [],
  );

  const handleOpenLink = useCallback(
    (url: string, target?: string, appId?: string) => {
      setLastAppId(appId || null);
      addAppEvent('ui/open-link', `${url} (${target || 'same tab'})`, appId, { url, target });
      debugLoggerRef.current?.logCanvasLink(url, target || '', appId || '');
      // Show confirmation dialog instead of auto-opening
      setLinkDialog({ url, target: target || '_blank' });
    },
    [addAppEvent],
  );

  const handleConfirmOpenLink = useCallback(() => {
    if (linkDialog) {
      window.open(linkDialog.url, '_blank', 'noopener,noreferrer');
      setLinkDialog(null);
    }
  }, [linkDialog]);

  const handleCancelOpenLink = useCallback(() => {
    setLinkDialog(null);
  }, []);

  const handleToolCall = useCallback(
    async (tool: string, params: any, appId?: string) => {
      const id = appId || params?.appId || 'unknown';
      setLastAppId(id);
      addAppEvent('tools/call', tool, id, params);

      if (tool === 'AskName') {
        const promptText = params?.prompt || 'Please enter your name:';
        const name = typeof window !== 'undefined' ? window.prompt(promptText, '') : '';
        return { name: name || '' };
      }
    },
    [addAppEvent],
  );

  const handleUiMessage = useCallback(
    (message: string, params: any, appId?: string) => {
      const id = appId || params?.appId || undefined;
      setLastAppId(id || null);
      addAppEvent('ui/message', message, id, params);
      debugLoggerRef.current?.logCanvasNotify(message, params, appId || '');
    },
    [addAppEvent],
  );

  const getEventTypeColor = (type: McpAppEvent['type']) => {
    switch (type) {
      case 'ui/open-link':
        return { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' };
      case 'tools/call':
        return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' };
      case 'ui/message':
        return { bg: '#e0f2fe', border: '#0284c7', text: '#075985' };
    }
  };

  const getEventTypeIcon = (type: McpAppEvent['type']) => {
    switch (type) {
      case 'ui/open-link':
        return '🔗';
      case 'tools/call':
        return '🔧';
      case 'ui/message':
        return '✉️';
    }
  };

  const getLastEventOfType = (type: McpAppEvent['type']) => {
    return appEvents.find((e) => e.type === type);
  };

  const isEventTypeActive = (type: McpAppEvent['type']) => {
    const lastEvent = getLastEventOfType(type);
    return lastEvent && flashingEventId === lastEvent.id;
  };

  if (tokenLoading) {
    return (
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  if (tokenError || !token) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, padding: 16 }}>
          Error loading token: {tokenError || 'No token available'}
        </div>
      </div>
    );
  }

  // Fullscreen chat overlay for mobile
  if (isMobile && isFullscreenChat) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>Chat</span>
          <button
            onClick={() => setIsFullscreenChat(false)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
        {/* Chat */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <BotDojoChat
            apiKey={token}
            baseUrl={config.baseUrl}
            mode="inline"
            autoFocus={false}
            height="100%"
            newSession={false}
            modelContext={modelContext}
            onBotDojoChatControl={(control: BotDojoChatControl) => {
              debugLoggerRef.current?.logInfo('Chat control initialized');
            }}
            onOpenLink={handleOpenLink}
            onToolCall={handleToolCall}
            onUiMessage={handleUiMessage}
            hideBotIcon={true}
            sessionKeyPrefix="mcp-app-example"
            fontSize="14px"
            welcomeMessage={`## Tool Progress

This example demonstrates tool streaming progress and state persistence in MCP Apps.

<promptbutton label="Show Streaming App" body='{"text_input": "Call the show_html_app tool to see streaming progress and counter persistence"}'></promptbutton>

<promptbutton label="Show Remote URL App" body='{"text_input": "Call the show_remote_url_app tool"}'></promptbutton>`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-3">
      {/* Header */}
      <div className="flex-shrink-0 mb-2 md:mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <h1 className="m-0 text-xl md:text-2xl font-bold text-slate-900">
            Tool Progress
          </h1>
          <a
            href="https://github.com/botdojo-ai/chat-sdk-playground"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#475569';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            View on GitHub
          </a>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
          MCP Apps are interactive UI components in chat, connected to the host via JSON-RPC.
          This example demonstrates <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>ui/message</code>, <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>tools/call</code>, <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>ui/open-link</code>, tool streaming, and state persistence.
          In the chat on the right, click “Show Remote URL App” or “Show Inline HTML App”, then use the counter buttons to verify persistence.
        </p>
      </div>

      {/* Overview Section */}
      <div style={{ 
        flexShrink: 0,
        padding: '16px', 
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        marginBottom: '12px',
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Overview
        </h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          This example demonstrates <strong>MCP Apps</strong> — interactive UI components that render inside chat conversations.
          It shows how an MCP App communicates with the host using JSON-RPC messages, handles tool streaming, persists state across interactions,
          and perform actions like sending messages, calling tools, and opening external links.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
          <Link
            href="/examples/mcp-apps/inline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'white',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Open the Test Harness
          </Link>
          <Link
            href="/examples/mcp-apps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'white',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            MCP Apps overview →
          </Link>
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Components Used:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['BotDojoChat', 'MCP Apps', 'JSON-RPC', 'Tool Streaming', 'State Persistence'].map((component) => (
              <span
                key={component}
                style={{
                  padding: '4px 10px',
                  background: '#f1f5f9',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#475569',
                  fontWeight: 500,
                }}
              >
                {component}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Section - Stack on mobile */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', 
        gap: '16px', 
        minHeight: isMobile ? 'auto' : '700px' 
      }}>
        {/* Event Monitor - Order second on mobile */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '0',
          boxShadow: '0 14px 36px rgba(15,23,42,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: isMobile ? '280px' : 0,
          order: isMobile ? 2 : 0,
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>📊</span>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Event Monitor</div>
            </div>
            {lastAppId && (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                App: <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 6 }}>{lastAppId}</code>
              </div>
            )}
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
                Watch MCP App → host events as you interact with the app inside chat.
              </p>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
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
                        animation: isActive ? 'pulse 0.6s ease-in-out' : 'none',
                        minHeight: 120,
                        maxHeight: 120,
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
                        <div style={{ fontSize: 11, color: isActive ? colors.text : '#64748b', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lastEvent.message}
                        </div>
                      )}
                      {lastEvent && (
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>
                          {lastEvent.timestamp.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <style jsx>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
              }
              @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>
          </div>
        </div>

        {/* Chat (always visible) - Order first on mobile */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: isMobile ? '12px' : '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 14px 36px rgba(15,23,42,0.06)',
          overflow: 'hidden',
          minHeight: isMobile ? '400px' : 0,
          order: isMobile ? 1 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Chat</div>
            {/* Fullscreen button on mobile */}
            {isMobile && (
              <button
                onClick={() => setIsFullscreenChat(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                Fullscreen
              </button>
            )}
          </div>
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <BotDojoChat
              apiKey={token}
              baseUrl={config.baseUrl}
              mode="inline"
              autoFocus={false}
              height="100%"
              newSession={false}
              modelContext={modelContext}
              onBotDojoChatControl={(control: BotDojoChatControl) => {
                debugLoggerRef.current?.logInfo('Chat control initialized');
              }}
              onOpenLink={handleOpenLink}
              onToolCall={handleToolCall}
              onUiMessage={handleUiMessage}
              hideBotIcon={true}
              sessionKeyPrefix="mcp-app-example"
              fontSize="14px"
              welcomeMessage={`## Tool Progress

This example demonstrates tool streaming progress and state persistence in MCP Apps.

<promptbutton label="Show Streaming App" body='{"text_input": "Call the show_html_app tool to see streaming progress and counter persistence"}'></promptbutton>

<promptbutton label="Show Remote URL App" body='{"text_input": "Call the show_remote_url_app tool"}'></promptbutton>`}
            />
          </div>
        </div>
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
              The MCP App is requesting to open a link in a new tab:
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

      {/* Code Section */}
      <div className="flex-shrink-0 p-4 md:p-6 bg-white border-t border-slate-200">
        <h2 className="m-0 mb-4 text-base md:text-lg font-bold text-slate-900">
          Source Code
        </h2>
        <CodeSnippet
          code={codeSample}
          language="typescript"
          title="Model Context Definition"
        />
      </div>
    </div>
  );
}
