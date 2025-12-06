import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { BotDojoChat, type BotDojoChatControl, type ModelContext, type ToolExecutionContext, uiResource, textResult } from '@botdojo/chat-sdk';
import { Tabs } from '@/components/Tabs';
import CodeSnippet from '@/components/CodeSnippet';
import { useBotDojoChatDebugLogger } from '@/lib/BotDojoChatDebug';

interface CanvasEvent {
  id: string;
  type: 'ui/open-link' | 'tools/call' | 'ui/message';
  message: string;
  timestamp: Date;
  canvasId?: string;
  details?: any;
}
export class WidgetState {
  counter: number = 0;
}
const config = {
  apiKey: process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API || '',
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'http://localhost:3000',
};

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
      overflow: visible;
      display: inline-block;
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
      background: #f8fafc;
      color: #94a3b8;
      cursor: not-allowed;
      opacity: 0.6;
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
    .counter-btn:disabled {
      background: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
      opacity: 0.7;
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
    .tool-meta {
      margin-top: 12px;
      padding: 10px;
      background: #f8fafc;
      border: 1px dashed #e2e8f0;
      border-radius: 10px;
      font-size: 12px;
      color: #475569;
    }
    .tool-meta .label {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="card" id="card">
    <div class="header">
      <div>
        <div class="title">Frontend MCP HTML</div>
        <div class="subtitle">MCP Apps actions + BotDojo extensions</div>
      </div>
    </div>

    <div class="button-grid">
      <button id="btn-tool" class="action-btn">Simulate tool call</button>
      <button id="btn-message" class="action-btn">Simulate ui/message</button>
      <button id="btn-link" class="action-btn">Simulate open link</button>
    </div>

    <div class="counter-row">
      <div class="counter-controls">
        <button id="btn-decrement" class="counter-btn">-</button>
        <div class="counter-value" id="counter-value">1</div>
        <button id="btn-increment" class="counter-btn">+</button>
      </div>
      <div class="persistence-text">testing persistence</div>
    </div>

    <div class="tool-meta" id="tool-meta" style="display: none;">
      <div class="label">Hydrated tool</div>
      <div id="tool-name-row"></div>
      <div id="tool-args-row"></div>
      <div id="tool-result-row"></div>
    </div>
  </div>
  <script>
    (function () {
      let counter = 1;
      let status = 'ready';
      let parentOrigin = '*';
      let msgId = 0;
      let busy = false;
      let initialized = false;

      const cardEl = document.getElementById('card');
      const counterValueEl = document.getElementById('counter-value');
      const btnTool = document.getElementById('btn-tool');
      const btnMessage = document.getElementById('btn-message');
      const btnLink = document.getElementById('btn-link');
      const btnDecrement = document.getElementById('btn-decrement');
      const btnIncrement = document.getElementById('btn-increment');
      const toolMeta = document.getElementById('tool-meta');
      const toolNameRow = document.getElementById('tool-name-row');
      const toolArgsRow = document.getElementById('tool-args-row');
      const toolResultRow = document.getElementById('tool-result-row');

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

      function updateToolMeta(toolCtx) {
        if (!toolMeta || !toolNameRow || !toolArgsRow || !toolResultRow) return;
        const hasData = !!(toolCtx && (toolCtx.name || toolCtx.label || toolCtx.result || toolCtx.arguments));
        toolMeta.style.display = hasData ? 'block' : 'none';
        if (!hasData) {
          toolNameRow.textContent = '';
          toolArgsRow.textContent = '';
          toolResultRow.textContent = '';
          return;
        }
        toolNameRow.textContent = 'Tool: ' + (toolCtx.label || toolCtx.name || 'unknown');
        toolArgsRow.textContent = toolCtx.arguments ? 'Args: ' + JSON.stringify(toolCtx.arguments) : '';
        toolResultRow.textContent = toolCtx.result ? 'Result: ' + JSON.stringify(toolCtx.result) : '';
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
        reportSize();
        
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
              if (window.botdojoApp?.callTool) {
                window.botdojoApp.callTool('AskName', { prompt: 'Please enter your name:' })
                  .then((res) => {
                    console.log('[AskName Debug] tool response', res);
                  })
                  .catch((err) => {
                    console.error('tool error:', err);
                  })
                  .finally(() => {
                    busy = false;
                  });
              } else {
                sendRequest('tools/call', {
                  name: 'AskName',
                  arguments: { prompt: 'Please enter your name:' },
                });
                busy = false;
              }
              break;
            case 'message':
              sendRequest('ui/message', {
                role: 'user',
                content: { type: 'text', text: 'Hello from MCP app (count ' + counter + ')', tags: { counter: counter } },
                metadata: { source: 'html-canvas' },
              });
              busy = false;
              break;
            case 'link':
              if (window.botdojoApp?.openLink) {
                window.botdojoApp.openLink('https://botdojo.com')
                  .catch((err) => {
                    console.error('ui/open-link error:', err);
                  })
                  .finally(() => {
                    busy = false;
                  });
              } else {
                sendRequest('ui/open-link', {
                  url: 'https://botdojo.com',
                });
                busy = false;
              }
              break;
          }
        } catch (err) {
          console.error('Action error:', err);
          busy = false;
        }
      }

      function handleInitialize(params, id) {
        const ctx = params?.hostContext || {};
        const state = ctx.state || {};
        const toolInfo = ctx.toolInfo;
        if (state.counter !== undefined) {
          counter = state.counter;
          if (counterValueEl) {
            counterValueEl.textContent = counter;
          }
        }
        if (state.status) {
          status = state.status;
        }
        // Set tool name from toolInfo - arguments/results come via notifications
        if (toolInfo?.tool?.name) {
          updateToolMeta({ name: toolInfo.tool.name, stepId: toolInfo.id });
        }
        parentOrigin = '*';
        initialized = true;
        sendResponse(id, { ok: true });
        sendNotification('ui/notifications/initialized', { status });
        setTimeout(reportSize, 20);
      }

      function handleMessage(event) {
        const data = event.data;
        if (!data || data.jsonrpc !== '2.0') return;
        
        if (data.method === 'ui/initialize') {
          handleInitialize(data.params, data.id);
        } else if (data.method === 'ui/notifications/host-context-changed' || data.method === 'ui/notifications/host-context-change') {
          updateToolMeta((data.params && data.params.tool) || {});
          const state = (data.params && data.params.state) || {};
          if (state.counter !== undefined) {
            counter = state.counter;
            if (counterValueEl) {
              counterValueEl.textContent = counter;
            }
          }
          if (state.status) {
            status = state.status;
          }
        }
      }

      window.addEventListener('message', handleMessage);
      
      btnTool?.addEventListener('click', () => handleAction('tool'));
      btnMessage?.addEventListener('click', () => handleAction('message'));
      btnLink?.addEventListener('click', () => handleAction('link'));
      btnDecrement?.addEventListener('click', () => {
        if (!busy && initialized) {
          updateCounter(Math.max(1, counter - 1));
        }
      });
      btnIncrement?.addEventListener('click', () => {
        if (!busy && initialized) {
          updateCounter(counter + 1);
        }
      });

      // Initial size report
      setTimeout(reportSize, 100);
      
      // Watch for size changes
      if (typeof ResizeObserver !== 'undefined' && cardEl) {
        const observer = new ResizeObserver(() => reportSize());
        observer.observe(cardEl);
      }
    })();
  </script>
</body>
</html>`;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Build absolute canvas URL (needed for pre-rendering which happens server-side)
// Uses useMcpApp from mcp-app-view/react
const getRemoteUrlCanvasUrl = () => {
  const origin = typeof window !== 'undefined' ?  window.location.origin : 'http://localhost:3500';
  return `${origin}/examples/chat-sdk/mcp-app-example/canvas/remote-url-app`;
};
export default function McpAppExample() {

  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'code'>('about');

  const [canvasEvents, setCanvasEvents] = useState<CanvasEvent[]>([]);
  const [sending, setSending] = useState(false);
  const [lastCanvasId, setLastCanvasId] = useState<string | null>(null);
  const [flashingEventId, setFlashingEventId] = useState<string | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ url: string; target: string } | null>(null);
  const logRef = useRef<(msg: string) => void>(() => { });
  const debugLogger = useBotDojoChatDebugLogger();
  const debugLoggerRef = useRef(debugLogger);
  // Always create a new session on page load for clean testing
  // Keep session across reloads so canvas persistence works


  const addCanvasEvent = useCallback((type: CanvasEvent['type'], message: string, canvasId?: string, details?: any) => {
    const eventId = `${type}-${Date.now()}-${Math.random()}`;
    const event: CanvasEvent = {
      id: eventId,
      type,
      message,
      timestamp: new Date(),
      canvasId,
      details,
    };
    setCanvasEvents((prev) => [event, ...prev].slice(0, 10)); // Keep last 10 events
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
      const remoteUrl = getRemoteUrlCanvasUrl();
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
    prompts: [],
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
            resourceUri: getRemoteUrlCanvasUrl(),
            prefersProxy: false, // Route through mcp-app-proxy for sandboxing
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
        mimeType: 'text/html+mcp',

        getContent: async () => ({
          uri: 'ui://mcp-app-demo/html',
          mimeType: 'text/html+mcp',
          text: INLINE_HTML_APP
        }),
      },
     
    ],
  }), []);

  const codeSample = useMemo(
    () =>
      `
const modelContext = useMemo<ModelContext>(() => ({
    name: 'mcp_app_demo',
    description: 'MCP App demo tools showing MCP Apps actions and BotDojo extensions',
    toolPrefix: 'mcpapp',
    uri: 'mcp-app-demo://context',
    prompts: [],
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
            resourceUri: getRemoteUrlCanvasUrl(),
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
        mimeType: 'text/html+mcp',
        getContent: async () => ({
          uri: 'ui://mcp-app-demo/html',
          mimeType: 'text/html+mcp',
          text: INLINE_HTML_APP,
        }),
      },
     
    ],
  }`,
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
      setLastCanvasId(appId || null);
      addCanvasEvent('ui/open-link', `${url} (${target || 'same tab'})`, appId, { url, target });
      debugLoggerRef.current?.logCanvasLink(url, target || '', appId || '');
      // Show confirmation dialog instead of auto-opening
      setLinkDialog({ url, target: target || '_blank' });
    },
    [addCanvasEvent],
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
      const id = appId || params?.canvasId || 'unknown';
      setLastCanvasId(id);
      addCanvasEvent('tools/call', tool, id, params);

      if (tool === 'AskName') {
        const promptText = params?.prompt || 'Please enter your name:';
        const name = " TESTING PROMPT" //window.prompt(promptText, '');
        const reply = name || '';
        console.log('[AskName Debug] host received tool call', { tool, params, name });
        console.log('[AskName Debug] host returning', { name: reply });
        return { name: reply };
      }
    },
    [addCanvasEvent],
  );

  const handleUiMessage = useCallback(
    (message: string, params: any, appId?: string) => {
      const id = appId || params?.canvasId || undefined;
      setLastCanvasId(id || null);
      addCanvasEvent('ui/message', message, id, params);
      debugLoggerRef.current?.logCanvasNotify(message, params, appId || '');
    },
    [addCanvasEvent],
  );

  const getEventTypeColor = (type: CanvasEvent['type']) => {
    switch (type) {
      case 'ui/open-link':
        return { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' };
      case 'tools/call':
        return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' };
      case 'ui/message':
        return { bg: '#e0f2fe', border: '#0284c7', text: '#075985' };
    }
  };

  const getEventTypeIcon = (type: CanvasEvent['type']) => {
    switch (type) {
      case 'ui/open-link':
        return '🔗';
      case 'tools/call':
        return '🔧';
      case 'ui/message':
        return '✉️';
    }
  };

  const getLastEventOfType = (type: CanvasEvent['type']) => {
    return canvasEvents.find((e) => e.type === type);
  };

  const isEventTypeActive = (type: CanvasEvent['type']) => {
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
