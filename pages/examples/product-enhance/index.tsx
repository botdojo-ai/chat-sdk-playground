import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import {
  BotDojoChat,
} from '@botdojo/chat-sdk';
import type {
  BotDojoChatControl,
  ModelContext,
  ToolExecutionContext,
} from '@botdojo/chat-sdk';
import { useBotDojoChatDebugLogger } from '@/utils/BotDojoChatDebug';
import CodeSnippet from '@/components/CodeSnippet';
import { Tabs } from '@/components/Tabs';

import fs from 'fs';
import path from 'path';

const config = {
  apiKey: process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API || '',
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};

const INITIAL_DESCRIPTION = 'Majestic pine bonsai with aged bark and elegant silhouette. 15 years old.';

type EnhancePayload = {
  original: string;
  enhanced: string;
  appId: string;
  applied?: boolean;
};

interface ProductEnhanceProps {
  sourceFiles: {
    page: string;
    mcpApp: string;
  };
}

export default function ProductEnhance({ sourceFiles }: ProductEnhanceProps) {
  const router = useRouter();
  const [description, setDescription] = useState<string>(INITIAL_DESCRIPTION);
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('page');
  const descriptionRef = useRef(description);
  const appIdRef = useRef<string | null>(null);
  const debugLogger = useBotDojoChatDebugLogger();
  const debugLoggerRef = useRef(debugLogger);
  
  // Code files configuration using actual source
  const codeFiles = [
    { id: 'page', label: 'index.tsx', code: sourceFiles.page },
    { id: 'mcp-app', label: 'enhance-mcp-app.tsx', code: sourceFiles.mcpApp },
  ];
  
  const activeCode = codeFiles.find(f => f.id === activeCodeTab)?.code || '';
  
  const newSession = router.query['new-session'] === 'true' || router.query['newsession'] === 'true';

  // Initialize chat open state from URL parameter
  useEffect(() => {
    if (router.isReady && router.query.chat === 'open') {
      setShowChat(true);
    }
  }, [router.isReady, router.query.chat]);

  // Helper to update URL parameter
  const updateChatUrlParam = (isOpen: boolean) => {
    const url = new URL(window.location.href);
    if (isOpen) {
      url.searchParams.set('chat', 'open');
    } else {
      url.searchParams.delete('chat');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Wrapper to set chat state and update URL
  const setShowChatWithUrl = (isOpen: boolean) => {
    setShowChat(isOpen);
    updateChatUrlParam(isOpen);
  };

  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  useEffect(() => {
    debugLoggerRef.current = debugLogger;
  }, [debugLogger]);


  const modelContext: ModelContext = useMemo(() => ({
    name: 'product_enhance',
    description: 'Frontend MCP for enhancing product descriptions with AI.',
    toolPrefix: 'product_enhance',
    uri: 'product-enhance://context',
    resourceUri: 'product-enhance://context',
    tools: [
      {
        name: 'getDescription',
        description: 'Get the current product description.',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'pass true.' },
          },
        },
        execute: async () => {
          const content = descriptionRef.current;
          return {
            description: content,
            resource: 'product-enhance://description',
          };
        },
        _meta: { 
          'botdojo/display-name': 'Get Description',
          'botdojo/hide-step-details': true,
        },
      },
      {
        name: 'suggestEnhancement',
        description: 'Propose an enhanced product description and show it in an MCP App for comparison.',
        inputSchema: {
          type: 'object',
          properties: {
            enhanced_text: {
              type: 'string',
              description: 'The enhanced product description.',
            }
          },
          required: ['enhanced_text'],
        },
        _meta: {
          'botdojo/display-name': 'Suggest Enhancement',
          ui: {
            resourceUri: 'ui://product-enhance/context/cache_buster/product-enhance',
            prefersProxy: true,

          },
        },
        execute: async (params: { enhanced_text: string; original_text?: string }, context?: ToolExecutionContext) => {
          console.log('[suggestEnhancement] execute called with params:', params);
          
          const original = descriptionRef.current;
          const enhanced = params.enhanced_text;
          const appId = appIdRef.current || `enhance-${uuidv4()}`;
          appIdRef.current = appId;

          const enhancePayload: EnhancePayload = {
            original,
            enhanced,
            appId,
            applied: false,
          };
          setDescription(enhanced);
          console.log('[suggestEnhancement] returning payload:', enhancePayload);
          return enhancePayload;
        },
      },
      {
        name: 'updateDescription',
        description: 'Apply a description directly to the product.',
        inputSchema: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Description to set.' },
          },
          required: ['description'],
        },
        execute: async (params: { description: string }) => {
          setDescription(params.description);
          appIdRef.current = null;
          debugLoggerRef.current?.logInfo('Description updated', { source: 'updateDescription tool' });
          return { success: true, message: 'Description updated' };
        },
        _meta: { 
          'botdojo/display-name': 'Apply Description',
          'botdojo/hide-step-details': true,
        },
      },
    ],
    resources: [
      {
        uri: 'ui://product-enhance/context/cache_buster/product-enhance',
        name: 'Enhancement MCP App',
        description: 'MCP App for reviewing and applying description enhancements.',
        mimeType: 'text/html;profile=mcp-app',
        getContent: async () => {
          console.log('[getContent] fetching enhance-mcp-app');
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          const html = await fetchMcpAppHtml('enhance-mcp-app');
          console.log('[getContent] got html, length:', html.length);
          return {
            uri: 'ui://product-enhance/context/cache_buster/product-enhance',
            mimeType: 'text/html;profile=mcp-app',
            text: html,
          };
        },
      },
    ],
    prompts: [],
  }), []);

  const handleIntent = async (intent: string, params: any, appId?: string) => {
    const actualAppId = appId || params?.appId;
    debugLoggerRef.current?.logCanvasIntent(intent, params, actualAppId || '');
    if (intent === 'updateDescription') {
      const descToApply = params?.description;
      if (typeof descToApply === 'string') {
        setDescription(descToApply);
        appIdRef.current = null;
        return { success: true, applied: true, appId: actualAppId };
      }
      return { error: 'missing-description' };
    }

    return { ok: true };
  };

  const handleToolCall = async (toolName: string, params: any, appId: string): Promise<any> => {
    return handleIntent(toolName, params, appId);
  };

  const sendPrompt = async (prompt: string) => {
    if (!chatControl) {
      console.error('Chat control not available');
      return;
    }
    setSending(true);
    try {
      await chatControl.sendFlowRequest({ text_input: prompt });
    } catch (error) {
      console.error('Error sending prompt:', error);
    } finally {
      setSending(false);
    }
  };

  const handleEnhanceClick = () => {
    setShowChatWithUrl(true);
    sendPrompt(`Enhance the product description <!--- Current description: "${descriptionRef.current}" Update the description by calling the suggestEnhancement tool-->`);
  };

  if (!config.apiKey) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          padding: '24px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          borderRadius: '12px',
        }}>
          <strong>Missing API key.</strong> Run <code>pnpm setup-playground</code> to configure.
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f8fafc',
    }}>
      {/* Overview Section */}
      <div style={{ 
        padding: '24px 40px', 
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            Product Enhancement
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
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Overview
        </h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          This example demonstrates how AI agents can enhance product descriptions using <strong>Frontend MCP tools</strong>. 
          The agent has visibility into what the user is looking at—the current product description—and can suggest improvements. 
          A custom chat UI allows users to toggle between the suggested changes and the original content.
        </p>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Components Used:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['BotDojoChat', 'Frontend MCP Tools', 'Agent Visibility', 'Custom Chat UI'].map((component) => (
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

      {/* Demo Section */}
      <div style={{ 
        display: 'flex', 
        height: '700px', // Fixed height so chat panel can size correctly with height: 100%
        overflow: 'hidden', // Prevent this container from scrolling
      }}>
      
            {/* Main content - Product form */}
            <div style={{ flex: 1, padding: '24px' }}>
              {/* Header */}
              <div style={{ marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                  Edit Product
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  SKU: BONSAI-PINE-002
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '20px' }}>
                {/* Product image */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '10px',
                }}>
                  {/* Simple chair icon */}
                  <div style={{ marginBottom: '4px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src="/images/products/product-2-cartoon.png"
                      alt="Ancient Pine Bonsai"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', maxWidth: '100px', maxHeight: '100px', display: 'block' }}
                    />
                  </div>
                </div>

                {/* Form fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Product name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#64748b', marginBottom: '4px' }}>
                      Product Name
                    </label>
                    <input
                      type="text"
                      value="Ancient Pine Bonsai"
                      readOnly
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#0f172a',
                        background: '#fff',
                      }}
                    />
                  </div>

                  {/* Price and Category */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#64748b', marginBottom: '4px' }}>
                        Price
                      </label>
                      <input
                        type="text"
                        value="$449.99"
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#0f172a',
                          background: '#fff',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#64748b', marginBottom: '4px' }}>
                        Category
                      </label>
                      <input
                        type="text"
                        value="Bonsai Tree"
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#0f172a',
                          background: '#fff',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description field */}
              <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleEnhanceClick}
                  disabled={sending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    background: sending ? '#e0e7ff' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: sending ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    if (!sending) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!sending) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px' }}>✨</span>
                  <span>{sending ? 'Enhancing...' : 'Enhance with AI'}</span>
                </button>
                
              
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  height: '450px',
                  padding: '10px',
                  border: description !== INITIAL_DESCRIPTION ? '2px solid #10b981' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#0f172a',
                  background: '#fff',
                  resize: 'vertical',
                  lineHeight: 1.5,
                  transition: 'border-color 0.3s ease',
                }}
              />
              {description !== INITIAL_DESCRIPTION && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '6px',
                  padding: '3px 8px',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '16px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#16a34a',
                }}>
                  <span>✓</span>
                  <span>AI Enhanced</span>
                </div>
              )}
            </div>
            </div>
         

      {/* Agent Chat Panel - always rendered, visibility controlled by CSS */}
      <div style={{
        width: showChat ? '45%' : '0',
        minWidth: showChat ? '400px' : '0',
        borderLeft: showChat ? '1px solid #e2e8f0' : 'none',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        overflow: 'hidden',
        height: '100%', // Match parent height (Demo Section)
        transition: 'width 0.3s ease, min-width 0.3s ease',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          opacity: showChat ? 1 : 0,
          transition: 'opacity 0.2s ease',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
            Agent
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                // Clear session logic could go here
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ↻ Clear
            </button>
            <button
              onClick={() => setShowChatWithUrl(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '18px',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Chat content - use explicit height to prevent iframe welcome state from expanding */}
        {/* Only render BotDojoChat when showChat is true to avoid layout issues with 0-width container */}
        <div style={{ height: 'calc(100% - 58px)', overflow: 'hidden' }}>
          {showChat && (
            <BotDojoChat
              apiKey={config.apiKey}
              baseUrl={config.baseUrl}
              mode="inline"
              newSession={newSession}
              modelContext={modelContext}
              onBotDojoChatControl={setChatControl}
              onToolCall={handleToolCall}
              fontSize='15px'
              onUiMessage={(message: string, params: any, appId: string) => {
                debugLoggerRef.current?.logCanvasNotify(message, params, appId);
              }}
              onOpenLink={(url: string, target: string, appId: string) => {
                debugLoggerRef.current?.logCanvasLink(url, target, appId);
              }}
              hideBotIcon={true}
              sessionKeyPrefix="product-enhance"
              welcomeMessage={`## Product Description Assistant

I can help enhance your product descriptions! Click the **✨ Enhance with AI** button on the left, or ask me directly:

<promptbutton label="✨ Enhance Description" body='{"text_input": "Enhance the product description"}'></promptbutton>
`}
            />
          )}
        </div>
      </div>

      {/* Floating Chat Button - shows when chat is closed */}
      {!showChat && (
        <button
          onClick={() => setShowChatWithUrl(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '80px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            zIndex: 100,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
          }}
          title="Open AI Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
      </div>

      {/* Code Section */}
      <div style={{ 
        padding: '24px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
      }}>
        <h2 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '20px', 
          fontWeight: 700, 
          color: '#0f172a' 
        }}>
          Source Code
        </h2>
        
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <Tabs
              tabs={codeFiles.map(f => ({ id: f.id, label: f.label }))}
              activeId={activeCodeTab}
              onChange={setActiveCodeTab}
            />
          </div>
          <div style={{ padding: '16px' }}>
            <CodeSnippet 
              code={activeCode} 
              language="tsx" 
              title={activeCodeTab === 'page' ? 'pages/examples/product-enhance/index.tsx' : 'pages/examples/product-enhance/widgets/enhance-mcp-app.tsx'} 
            />
          </div>
        </div>

        {/* Key Concepts */}
        <div style={{ 
          marginTop: '24px',
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Key Concepts
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <code style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#6366f1' }}>
                ModelContext
              </code>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Defines the tools available to the AI agent. Tools can read/write application state.
              </p>
            </div>
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <code style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#6366f1' }}>
                _meta.ui.resourceUri
              </code>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Links a tool to an MCP App that renders when the tool is called.
              </p>
            </div>
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <code style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#6366f1' }}>
                useMcpApp()
              </code>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Hook for MCP Apps to receive tool data and call tools back to the host.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const pagesDir = path.join(process.cwd(), 'pages/examples/product-enhance');
  
  const pageCode = fs.readFileSync(path.join(pagesDir, 'index.tsx'), 'utf-8');
  const mcpAppCode = fs.readFileSync(path.join(pagesDir, 'widgets/enhance-mcp-app.tsx'), 'utf-8');
  
  return {
    props: {
      sourceFiles: {
        page: pageCode,
        mcpApp: mcpAppCode,
      },
    },
  };
}
