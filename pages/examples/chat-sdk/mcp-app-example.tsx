import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { BotDojoChat, type BotDojoChatControl, type ModelContext, type ToolExecutionContext, uiResource, textResult } from '@botdojo/chat-sdk';
import { Tabs } from '@/components/Tabs';
import CodeSnippet from '@/components/CodeSnippet';
import { useBotDojoChatDebugLogger } from '@/utils/BotDojoChatDebug';

/** Event from an MCP App - tracks events for the monitor UI */
interface McpAppEvent {
  id: string;
  type: 'ui/open-link' | 'tools/call' | 'ui/message';
  message: string;
  timestamp: Date;
  appId?: string;
  details?: any;
}
export class WidgetState {
  counter: number = 0;
}
const config = {
  apiKey: process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API || '',
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};


const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Build absolute MCP App URL (needed for pre-rendering which happens server-side)
// Uses useMcpApp from mcp-app-view/react
const getMcpAppUrl = () => {
  const origin = typeof window !== 'undefined' ?  window.location.origin : 'http://localhost:3500';
  return `${origin}/examples/chat-sdk/mcp-app-example/canvas/remote-url-app`;
};
export default function McpAppExample() {

  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'code'>('about');

  const [appEvents, setAppEvents] = useState<McpAppEvent[]>([]);
  const [sending, setSending] = useState(false);
  const [lastAppId, setLastAppId] = useState<string | null>(null);
  const [flashingEventId, setFlashingEventId] = useState<string | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ url: string; target: string } | null>(null);
  const logRef = useRef<(msg: string) => void>(() => { });
  const debugLogger = useBotDojoChatDebugLogger();
  const debugLoggerRef = useRef(debugLogger);
  // Always create a new session on page load for clean testing
  // Keep session across reloads so MCP App state persistence works


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

  const remoteUrlPrompt = useMemo(
    () =>
      'Call the show_remote_url_app tool immediately and render the Remote Url App. Do not explain—just run the tool so the MCP App with all actions appears.',
    [],
  );
  const htmlPrompt = useMemo(
    () =>
      'Call the show_html_app tool immediately to render the Inline Html App. Keep the reply short and let the user click the buttons.',
    [],
  );

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
    resourceUri: 'mcp-app-demo://context',
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
            prefersProxy: true, // Route through mcp-app-proxy for sandboxing
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
          ui: {
            resourceUri: 'ui://mcp-app-demo/context/cache_buster/example_mcp_app',
            prefersProxy: true,
           
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
        uri: 'ui://mcp-app-demo/context/cache_buster/example_mcp_app',
        name: 'Inline MCP HTML App',
        description: 'Inline MCP Apps HTML resource for ui/message + counter persistence',
        mimeType: 'text/html;profile=mcp-app',

        getContent: async () => {
          // Fetch via API route to avoid webpack caching issues
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          const html = await fetchMcpAppHtml('remote-url-app');
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
    resourceUri: 'mcp-app-demo://context',
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
            prefersProxy: true, // Route through mcp-app-proxy for sandboxing
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

  const sendPrompt = useCallback(async () => {
    if (!chatControl) {
      console.log('Chat control not ready');
      return;
    }
    setSending(true);
    debugLoggerRef.current?.logInfo('Prompting agent to call show_remote_url_app');
    try {
      await chatControl.sendFlowRequest({ text_input: remoteUrlPrompt });
    } catch (err) {
      debugLoggerRef.current?.logError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setSending(false);
    }
  }, [chatControl, remoteUrlPrompt]);

  const sendHtmlPrompt = useCallback(async () => {
    if (!chatControl) {
      console.log('Chat control not ready');
      return;
    }
    setSending(true);
    debugLoggerRef.current?.logInfo('Prompting agent to call show_html_app');
    try {
      await chatControl.sendFlowRequest({ text_input: htmlPrompt });
    } catch (err) {
      debugLoggerRef.current?.logError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setSending(false);
    }
  }, [chatControl, htmlPrompt]);

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
        const name = " TESTING PROMPT" //window.prompt(promptText, '');
        const reply = name || '';
        console.log('[AskName Debug] host received tool call', { tool, params, name });
        console.log('[AskName Debug] host returning', { name: reply });
        return { name: reply };
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

  if (!config.apiKey) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, padding: 16 }}>
          Missing NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API. Set it in `.env.local` and reload.
        </div>
      </div>
    );
  }

  const [rightTab, setRightTab] = useState<'chat' | 'code'>('chat');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', height: 'calc(100vh - 40px)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: '12px' }}>
        <h1 style={{ 
          margin: 0, 
          marginBottom: '6px',
          fontSize: '20px', 
          fontWeight: 700, 
          color: '#0f172a',
        }}>
          MCP App Example
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
          Interactive UI components in chat via JSON-RPC. Demonstrates <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>ui/message</code>, <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>tools/call</code>, <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>ui/open-link</code>, state persistence, and tool streaming.
          Click "Show Remote Url App" or "Show Inline Html App" in chat, then use the counter buttons to see state persist.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '16px', flex: 1, minHeight: 0 }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '0',
          boxShadow: '0 14px 36px rgba(15,23,42,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#ffffff' }}>
            {/* Event Monitor Intro */}
            <div style={{ 
              marginBottom: 16, 
              padding: '12px', 
              background: '#f8fafc', 
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                The Event Monitor shows real-time communication between the MCP App (iframe) and your host application. 
                Each panel lights up when that event type fires.
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
          minHeight: 0,
        }}>
          <Tabs
            tabs={[
              { id: 'chat', label: 'Chat' },
              { id: 'code', label: 'Model Context.tsx' },
            ]}
            activeId={rightTab}
            onChange={(id) => setRightTab(id as 'chat' | 'code')}
          />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', width: '100%' }}>
            {rightTab === 'chat' ? (
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  flex: 1,
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}>
                  <BotDojoChat
                  apiKey={config.apiKey}
                  baseUrl={config.baseUrl}
                  mode="inline"
                  height="100%"
                  newSession={false}
                  modelContext={modelContext}
                  onBotDojoChatControl={(control: BotDojoChatControl) => {
                    setChatControl(control);
                    debugLoggerRef.current?.logInfo('Chat control initialized');
                  }}
                  onOpenLink={handleOpenLink}
                  onToolCall={handleToolCall}
                  onUiMessage={handleUiMessage}
                  hideBotIcon={true}
                  sessionKeyPrefix="mcp-app-example"
                  fontSize='14px'
                  welcomeMessage={`## Welcome to the MCP App Example.
This example shows how to use the MCP App Example to show a remote url app and an inline html app.

<promptbutton label="Show Remote Url App" body='{"text_input": "Show Remote Url App"}'></promptbutton> <promptbutton label="Show Inline Html App" body='{"text_input"  : "Show Inline Html App"}'></promptbutton> `}
                 
                />
                </div>
            ) : (
              <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <CodeSnippet
                  code={codeSample}
                  language="typescript"
                  title="Model Context.tsx"
                  fullHeight
                />
              </div>
            )}
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
    </div>
  );
}
