import { useEffect, useRef, useState } from 'react';
import { BotDojoChat } from '@botdojo/chat-sdk';
import type { BotDojoChatControl, ModelContext } from '@botdojo/chat-sdk';
import { eventBus } from '@/utils/eventBus';
import { useBotDojoChatDebugLogger } from '@/utils/BotDojoChatDebug';
import CodeSnippet from '@/components/CodeSnippet';
import { Tabs } from '@/components/Tabs';
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

// Configuration - defaults to production
const config = {
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};

/**
 * Chat SDK Basic Example
 * 
 * This example demonstrates the BotDojo Chat SDK widget with:
 * - Different display modes (popup, sidepanel, inline)
 * - Configuration options (colors, theme, sizes)
 * - Model Context integration
 */

// Default configuration
const DEFAULT_CHAT_CONFIG = {
  mode: 'chat-popup' as const,
  popupOptions: {
    width: '400px',
    height: '600px',
    resizable: true,
    minWidth: '300px',
    maxWidth: '800px',
    minHeight: '400px',
    maxHeight: '800px',
  },
  sidePanelOptions: {
    direction: 'right' as const,
    defaultWidth: '400px',
    resizable: true,
    minWidth: '300px',
    maxWidth: '600px',
  },
  accentColor: '#6366f1',
  backgroundColor: '#1e293b',
  theme: 'dark' as const,
  fontSize: '16px',
  allowMicrophone: false,
  baseUrl: config.baseUrl,
};

export default function ChatSDKBasic() {
  const [displayText, setDisplayText] = useState<string>('Use chat to call setText tool');
  const [chatConfig, setChatConfig] = useState<any>(DEFAULT_CHAT_CONFIG);
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [hideBotIcon, setHideBotIcon] = useState<boolean>(false);
  const [inlinePreviewTab, setInlinePreviewTab] = useState<'code' | 'chat'>('code');
  const debugLogger = useBotDojoChatDebugLogger();
  const debugLoggerRef = useRef(debugLogger);
  
  // Get temporary JWT token for secure API access
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();

  useEffect(() => {
    debugLoggerRef.current = debugLogger;
    if (debugLogger) {
      debugLogger.logInfo('Chat SDK basic example mounted');
    }
  }, [debugLogger]);

  useEffect(() => {
    if (chatConfig.mode === 'inline') {
      setInlinePreviewTab('chat');
    } else {
      setInlinePreviewTab('code');
    }
  }, [chatConfig.mode]);

  if (tokenLoading) {
    return (
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  if (tokenError || !token) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          padding: '24px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <strong>Error loading token:</strong> {tokenError || 'No token available'}
        </div>
      </div>
    );
  }

  // Function to send flow request to chat
  const sendFlowRequestToChat = async (body: any) => {
    if (chatControl) {
      eventBus.logInfo('Sending flow request to chat', body);
      debugLoggerRef.current?.logInfo('Sending flow request to chat', body);
      setSendingMessage(true);
      try {
        const result = await chatControl.sendFlowRequest(body);
        eventBus.logInfo('Flow request completed', { result });
        debugLoggerRef.current?.logInfo('Flow request completed', { result });
        return result;
      } catch (error) {
        eventBus.logError(error);
        debugLoggerRef.current?.logError(error instanceof Error ? error : new Error('Flow request failed'));
      } finally {
        setSendingMessage(false);
      }
    } else {
      eventBus.logError(new Error('Chat control not available yet'));
      debugLoggerRef.current?.logError(new Error('Chat control not available yet'));
    }
  };

  // Define model context with simple tools
  const modelContext: ModelContext = {
    name: 'test_page',
    description: 'Test page for BotDojo Chat SDK',
    toolPrefix: 'test_page',
    uri: 'test-page://context',
    tools: [
      {
        name: 'setText',
        description: 'Update the displayed text on the page',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to display',
            },
          },
          required: ['text'],
        },
        execute: async (params: { text: string }) => {
          eventBus.logInfo('setText called', params);
          setDisplayText(params.text);
          return { success: true, message: `Text set to: ${params.text}` };
        },
        _meta: { 'botdojo/display-name': '✏️ Update Text' },
      },
      {
        name: 'getText',
        description: 'Get the current displayed text',
        inputSchema: {
          type: 'object',
          properties: {
            refresh: {
              type: 'boolean',
              description: 'Set to true to refresh the text',
            },
          },
          required: ['refresh'],
        },
        execute: async (params: { refresh: boolean }) => {
          eventBus.logInfo('getText called', params);
          return { text: displayText };
        },
      },
    ],
    prompts: [
      {
        name: 'page_interaction_instructions',
        description: 'Instructions for interacting with the test page',
        messages: [
          {
            role: 'user',
            content: 'You can interact with this test page using the following tools:\n\n- setText: Update the text displayed on the page\n- getText: Get the current displayed text\n\nWhen the user asks to set or change text, use the setText tool. When they ask what the current text is, use the getText tool.',
          },
        ],
      },
    ],
  };

  const chatProps = {
    apiKey: token,
    mode: chatConfig.mode,
    popupOptions: chatConfig.popupOptions,
    sidePanelOptions: chatConfig.sidePanelOptions,
    accentColor: chatConfig.accentColor,
    backgroundColor: chatConfig.backgroundColor,
    theme: chatConfig.theme,
    fontSize: chatConfig.fontSize,
    hideBotIcon: hideBotIcon,
    allowMicrophone: chatConfig.allowMicrophone,
    newSession: false,
    baseUrl: chatConfig.baseUrl,
    modelContext,
    onConnectorInit: (conn: any) => {
      eventBus.logInfo('Connector initialized', { connector: 'BotDojoChat' }, 'chat-sdk');
      debugLoggerRef.current?.logInfo('Connector initialized');
    },
    onConnectorError: (error: Error) => {
      eventBus.logError(error, 'chat-sdk');
      debugLoggerRef.current?.logError(error);
    },
    onBotDojoChatControl: (control: BotDojoChatControl) => {
      eventBus.logInfo('Chat control initialized', {}, 'chat-sdk');
      debugLoggerRef.current?.logInfo('Chat control initialized');
      setChatControl(control);
    },
    onReady: () => {
      eventBus.logInfo('Chat ready', {}, 'chat-sdk');
      debugLoggerRef.current?.logReady();
    },
    onError: (error: Error, messageId?: string, stepId?: string) => {
      eventBus.logError(error, 'chat-sdk');
      debugLoggerRef.current?.logError(error, messageId, stepId);
    },
    onMessageStart: (role: 'user' | 'assistant' | 'system', messageId: string) => {
      eventBus.logInfo('Message started', { role, messageId }, 'chat-sdk');
      debugLoggerRef.current?.logMessageStart(role, messageId);
    },
    onMessageComplete: (messageId: string, content: string) => {
      eventBus.logInfo('Message completed', { messageId }, 'chat-sdk');
      debugLoggerRef.current?.logMessageComplete(messageId, content);
    },
    onToken: (messageId: string, tokenUpdate: any) => {
      const tokenText = tokenUpdate?.token || '';
      if (tokenText) {
        eventBus.logToken(tokenText, 'chat-sdk');
        debugLoggerRef.current?.logToken(messageId, tokenText);
      }
    },
    onStepUpdate: (messageId: string, step: any) => {
      eventBus.logStep(step, 'chat-sdk');
      debugLoggerRef.current?.logStep(messageId, step);
    },
    onSessionCreated: (sessionId: string) => {
      eventBus.logInfo('Session created', { sessionId }, 'chat-sdk');
      debugLoggerRef.current?.logSessionCreated(sessionId);
    },
    onSessionHydrated: (sessionId: string, messageCount: number) => {
      eventBus.logInfo('Session hydrated', { sessionId, messageCount }, 'chat-sdk');
      debugLoggerRef.current?.logSessionHydrated(sessionId, messageCount);
    },
    onRequestAborted: () => {
      eventBus.logInfo('Request aborted', {}, 'chat-sdk');
      debugLoggerRef.current?.logRequestAborted();
    },
    onCanvasIntent: (intent: string, params: any, canvasId: string) => {
      debugLoggerRef.current?.logCanvasIntent(intent, params, canvasId);
      eventBus.logInfo('MCP App intent', { intent, canvasId, params }, 'canvas');
    },
    onCanvasNotify: (message: string, params: any, canvasId: string) => {
      debugLoggerRef.current?.logCanvasNotify(message, params, canvasId);
      eventBus.logInfo('MCP App notify', { message, params, canvasId }, 'canvas');
    },
    onCanvasPrompt: (prompt: string, params: any, canvasId: string) => {
      debugLoggerRef.current?.logCanvasPrompt(prompt, params, canvasId);
      eventBus.logInfo('MCP App prompt', { prompt, params, canvasId }, 'canvas');
    },
    onCanvasLink: (url: string, target: string, canvasId: string) => {
      debugLoggerRef.current?.logCanvasLink(url, target, canvasId);
      eventBus.logInfo('MCP App link', { url, target, canvasId }, 'canvas');
    },
    onCanvasAction: (action: any) => {
      debugLoggerRef.current?.logCanvasAction(action);
      eventBus.logInfo('MCP App action', action, 'canvas');
    },
  };

  // Render chat widget based on mode
  const renderChatWidget = () => {
    // For inline mode, wrap in a container
    if (chatConfig.mode === 'inline') {
      return (
        <div style={{
          marginTop: '32px',
          width: '100%',
          height: '600px',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <BotDojoChat {...chatProps} />
        </div>
      );
    }

    // For popup and sidepanel modes, render without container
    return <BotDojoChat {...chatProps} />;
  };

  // Generate TypeScript code based on current config
  const generateConfigCode = () => {
    return `import { BotDojoChat } from '@botdojo/chat-sdk';

export default function MyApp() {
  return (
    <BotDojoChat
      apiKey="YOUR API KEY"
      mode="${chatConfig.mode}"
      ${chatConfig.mode === 'chat-popup' ? `popupOptions={{
        width: '${chatConfig.popupOptions.width}',
        height: '${chatConfig.popupOptions.height}',
        resizable: ${chatConfig.popupOptions.resizable},
      }}` : ''}${(chatConfig.mode === 'side-panel' || chatConfig.mode === 'side-push') ? `sidePanelOptions={{
        direction: '${chatConfig.sidePanelOptions.direction}',
        defaultWidth: '${chatConfig.sidePanelOptions.defaultWidth}',
        resizable: ${chatConfig.sidePanelOptions.resizable},
      }}` : ''}
      theme="${chatConfig.theme}"
      accentColor="${chatConfig.accentColor}"
      backgroundColor="${chatConfig.backgroundColor}"
      fontSize="${chatConfig.fontSize}"
      hideBotIcon={${hideBotIcon}}
      allowMicrophone={${chatConfig.allowMicrophone}}
      baseUrl="${chatConfig.baseUrl}"
    />
  );
}`;
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-5">
        <h1 className="m-0 mb-2 text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <span>🎨</span> Customize Chat UI
        </h1>
        <p className="m-0 text-sm text-slate-600 leading-relaxed">
          Configure display modes, themes, colors, and styling options for the BotDojo chat widget.
        </p>
      </div>

      {/* Live Configuration and Code Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
        {/* Configuration Panel */}
        <div className="p-4 md:p-5 bg-white rounded-xl border border-slate-200">
          <h2 className="m-0 mb-4 text-base md:text-lg font-bold flex items-center gap-2">
            🎨 Live Configuration
          </h2>

          {/* Display Mode Switcher */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Display Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <button
                onClick={() => {
                  setChatConfig({ ...chatConfig, mode: 'chat-popup' });
                  eventBus.logInfo('Mode changed to popup');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: chatConfig.mode === 'chat-popup' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: chatConfig.mode === 'chat-popup' ? 'white' : 'var(--text-primary)',
                  border: chatConfig.mode === 'chat-popup' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📱 Popup
              </button>
              <button
                onClick={() => {
                  setChatConfig({ ...chatConfig, mode: 'side-panel' });
                  eventBus.logInfo('Mode changed to side panel (overlay)');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: chatConfig.mode === 'side-panel' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: chatConfig.mode === 'side-panel' ? 'white' : 'var(--text-primary)',
                  border: chatConfig.mode === 'side-panel' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📋 Side Panel
              </button>
              <button
                onClick={() => {
                  setChatConfig({ ...chatConfig, mode: 'side-push' });
                  eventBus.logInfo('Mode changed to side push');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: chatConfig.mode === 'side-push' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: chatConfig.mode === 'side-push' ? 'white' : 'var(--text-primary)',
                  border: chatConfig.mode === 'side-push' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ↔️ Side Push
              </button>
              <button
                onClick={() => {
                  setChatConfig({ ...chatConfig, mode: 'inline' });
                  eventBus.logInfo('Mode changed to inline');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: chatConfig.mode === 'inline' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: chatConfig.mode === 'inline' ? 'white' : 'var(--text-primary)',
                  border: chatConfig.mode === 'inline' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📺 Inline
              </button>
            </div>
          </div>

          {/* Theme Switcher */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Theme
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <button
                onClick={() => {
                  setChatConfig({ ...chatConfig, theme: 'light', backgroundColor: '#ffffff' });
                  eventBus.logInfo('Theme changed to light');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: chatConfig.theme === 'light' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: chatConfig.theme === 'light' ? 'white' : 'var(--text-primary)',
                  border: chatConfig.theme === 'light' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => {
                  setChatConfig({ ...chatConfig, theme: 'dark', backgroundColor: '#1f2937' });
                  eventBus.logInfo('Theme changed to dark');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: chatConfig.theme === 'dark' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: chatConfig.theme === 'dark' ? 'white' : 'var(--text-primary)',
                  border: chatConfig.theme === 'dark' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => {
                  setChatConfig({ ...chatConfig, theme: 'modern-light', backgroundColor: '#F9FAFB' });
                  eventBus.logInfo('Theme changed to modern-light');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: chatConfig.theme === 'modern-light' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: chatConfig.theme === 'modern-light' ? 'white' : 'var(--text-primary)',
                  border: chatConfig.theme === 'modern-light' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ✨ Modern Light
              </button>
              <button
                onClick={() => {
                  setChatConfig({ ...chatConfig, theme: 'modern-dark', backgroundColor: '#111827' });
                  eventBus.logInfo('Theme changed to modern-dark');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: chatConfig.theme === 'modern-dark' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: chatConfig.theme === 'modern-dark' ? 'white' : 'var(--text-primary)',
                  border: chatConfig.theme === 'modern-dark' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🌟 Modern Dark
              </button>
            </div>
          </div>

          {/* Show Agent Avatar Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              <span>Agent Avatar: {hideBotIcon ? '🚫 Hidden' : '🤖 Visible'}</span>
              <button
                onClick={() => {
                  setHideBotIcon(!hideBotIcon);
                  eventBus.logInfo(`Agent avatar ${!hideBotIcon ? 'hidden' : 'visible'}`);
                }}
                style={{
                  position: 'relative',
                  width: '40px',
                  height: '20px',
                  backgroundColor: hideBotIcon ? 'var(--bg-tertiary)' : 'var(--color-primary)',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: hideBotIcon ? '2px' : '20px',
                  width: '16px',
                  height: '16px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
            </label>
          </div>

          {/* Font Size Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Font Size
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {[
                { label: 'S', value: '14px' },
                { label: 'M', value: '16px' },
                { label: 'L', value: '18px' },
                { label: 'XL', value: '20px' },
              ].map((size) => (
                <button
                  key={size.value}
                  onClick={() => {
                    setChatConfig({ ...chatConfig, fontSize: size.value });
                    eventBus.logInfo('Font size changed', { fontSize: size.value });
                  }}
                  style={{
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: chatConfig.fontSize === size.value ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    color: chatConfig.fontSize === size.value ? 'white' : 'var(--text-primary)',
                    border: chatConfig.fontSize === size.value ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Side Panel Direction (only show if side-panel or side-push mode) */}
          {(chatConfig.mode === 'side-panel' || chatConfig.mode === 'side-push') && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Panel Direction
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                <button
                  onClick={() => {
                    setChatConfig({
                      ...chatConfig,
                      sidePanelOptions: { ...chatConfig.sidePanelOptions, direction: 'left' },
                    });
                    eventBus.logInfo('Side panel direction changed to left');
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: chatConfig.sidePanelOptions.direction === 'left' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    color: chatConfig.sidePanelOptions.direction === 'left' ? 'white' : 'var(--text-primary)',
                    border: chatConfig.sidePanelOptions.direction === 'left' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ← Left
                </button>
                <button
                  onClick={() => {
                    setChatConfig({
                      ...chatConfig,
                      sidePanelOptions: { ...chatConfig.sidePanelOptions, direction: 'right' },
                    });
                    eventBus.logInfo('Side panel direction changed to right');
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: chatConfig.sidePanelOptions.direction === 'right' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    color: chatConfig.sidePanelOptions.direction === 'right' ? 'white' : 'var(--text-primary)',
                    border: chatConfig.sidePanelOptions.direction === 'right' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Right →
                </button>
              </div>
            </div>
          )}

          {/* Color Configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Accent
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="color"
                  value={chatConfig.accentColor}
                  onChange={(e) => {
                    setChatConfig({ ...chatConfig, accentColor: e.target.value });
                    eventBus.logInfo('Accent color changed', { color: e.target.value });
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                />
                <input
                  type="text"
                  value={chatConfig.accentColor}
                  onChange={(e) => {
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      setChatConfig({ ...chatConfig, accentColor: e.target.value });
                      eventBus.logInfo('Accent color changed', { color: e.target.value });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Background
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="color"
                  value={chatConfig.backgroundColor}
                  onChange={(e) => {
                    setChatConfig({ ...chatConfig, backgroundColor: e.target.value });
                    eventBus.logInfo('Background color changed', { color: e.target.value });
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                />
                <input
                  type="text"
                  value={chatConfig.backgroundColor}
                  onChange={(e) => {
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      setChatConfig({ ...chatConfig, backgroundColor: e.target.value });
                      eventBus.logInfo('Background color changed', { color: e.target.value });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Color Presets */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { name: 'Purple', accent: '#6366f1', bg: '#ffffff', theme: 'light' as const },
                { name: 'Blue', accent: '#3b82f6', bg: '#ffffff', theme: 'light' as const },
                { name: 'Green', accent: '#10b981', bg: '#ffffff', theme: 'light' as const },
                { name: 'Purple', accent: '#8b5cf6', bg: '#1f2937', theme: 'dark' as const },
                { name: 'Blue', accent: '#60a5fa', bg: '#1f2937', theme: 'dark' as const },
                { name: 'Green', accent: '#34d399', bg: '#1f2937', theme: 'dark' as const },
              ].map((preset, idx) => (
                <button
                  key={preset.name + idx}
                  onClick={() => {
                    setChatConfig({
                      ...chatConfig,
                      accentColor: preset.accent,
                      backgroundColor: preset.bg,
                      theme: preset.theme,
                    });
                    eventBus.logInfo('Preset applied', preset);
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: preset.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Input Toggle */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}>
              <input
                type="checkbox"
                checked={chatConfig.allowMicrophone}
                onChange={(e) => {
                  setChatConfig({ ...chatConfig, allowMicrophone: e.target.checked });
                  eventBus.logInfo('Voice input toggled', { enabled: e.target.checked });
                }}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  marginTop: '2px',
                }}
              />
              <span>
                🎤 Enable Voice Input
                <span style={{ display: 'block', fontWeight: 400, fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Let users speak instead of type
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Live TypeScript Code Example */}
        <div style={{
          padding: '20px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                fontSize: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {'</>'}
              </span>
              TypeScript Example
            </h2>
            {chatConfig.mode === 'inline' && (
              <div style={{ marginLeft: 'auto' }}>
                <Tabs
                  tabs={[
                    { id: 'code', label: 'Code' },
                    { id: 'chat', label: 'Chat' },
                  ]}
                  activeId={inlinePreviewTab}
                  onChange={(id) => setInlinePreviewTab(id as 'code' | 'chat')}
                />
              </div>
            )}
          </div>
          {chatConfig.mode === 'inline' ? (
            <div style={{ minHeight: '560px' }}>
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-primary)',
                height: '560px',
                display: inlinePreviewTab === 'chat' ? 'block' : 'none',
              }}>
                <BotDojoChat {...chatProps} />
              </div>
              <div style={{ display: inlinePreviewTab === 'code' ? 'block' : 'none', minHeight: '560px' }}>
                <CodeSnippet
                  code={generateConfigCode()}
                  title="TypeScript Example"
                  language="tsx"
                  fullHeight
                />
              </div>
            </div>
          ) : (
            <CodeSnippet
              code={generateConfigCode()}
              title="TypeScript Example"
              language="tsx"
              fullHeight
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 md:mb-6">
        <button
          onClick={() => sendFlowRequestToChat({ text_input: 'Tell me a joke' })}
          disabled={sendingMessage || !chatControl}
          className="px-5 py-3 text-sm font-semibold bg-emerald-500 text-white border-none rounded-lg transition-all min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:translate-y-[-1px] shadow"
        >
          😄 Send Test Message {sendingMessage ? '...' : ''}
        </button>

       
      </div>

      {/* Render chat widget */}
      {chatConfig.mode !== 'inline' && renderChatWidget()}
    </div>
  );
}
