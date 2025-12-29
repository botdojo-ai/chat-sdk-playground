import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

import fs from 'fs';
import path from 'path';

const config = {
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
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();

  const [description, setDescription] = useState<string>(INITIAL_DESCRIPTION);
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const chatControlRef = useRef<BotDojoChatControl | null>(null);
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isChatReady, setIsChatReady] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('page');
  const descriptionRef = useRef(description);
  const appIdRef = useRef<string | null>(null);
  const pendingPromptRef = useRef<string | null>(null);
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

  /**
   * TIP: Use refs to access current state in tool execute functions.
   * 
   * Why: Tool execute functions inside useMemo capture state from when the memo
   * was created. Without refs, you'd get stale values. The ref always points to
   * the current value, so descriptionRef.current is always up-to-date.
   */
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
        /**
         * TIP: Tool descriptions guide the AI's behavior.
         * Be specific about what the tool does and when to use it.
         */
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
       
          /**
           * TIP: The resourceUri must exactly match the resource uri defined below.
           * This links the tool to its MCP App UI.
           */
          ui: {
            resourceUri: 'ui://product-enhance/enhance-card',
          },
        },
        execute: async (params: { enhanced_text: string; original_text?: string }, context?: ToolExecutionContext) => {
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
        /**
         * TIP: The resource uri must exactly match the tool's _meta.ui.resourceUri.
         */
        uri: 'ui://product-enhance/enhance-card',
        name: 'Enhancement MCP App',
        description: 'MCP App for reviewing and applying description enhancements.',
        mimeType: 'text/html;profile=mcp-app',
        getContent: async () => {
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          const html = await fetchMcpAppHtml('enhance-mcp-app');
          return {
            uri: 'ui://product-enhance/enhance-card',
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

  const handleToolCall = useCallback(async (toolName: string, params: any, appId: string): Promise<any> => {
    return handleIntent(toolName, params, appId);
  }, []);

  // Memoized callbacks for BotDojoChat
  const handleBotDojoChatControl = useCallback((control: BotDojoChatControl) => {
    setChatControl(control);
    chatControlRef.current = control;
  }, []);

  const handleChatReady = useCallback(() => {
    setIsChatReady(true);
  }, []);

  // Effect to send pending prompt when all conditions are met:
  // - chatControl is available
  // - isChatReady is true  
  // - showChat is true (panel must be open for iframe to work)
  // This handles the race condition between all the callbacks
  useEffect(() => {
    if (isChatReady && chatControl && showChat && pendingPromptRef.current) {
      // Small delay to ensure the panel transition is complete and iframe is ready
      const timeoutId = setTimeout(() => {
        if (pendingPromptRef.current) {
          const prompt = pendingPromptRef.current;
          pendingPromptRef.current = null;
          console.log('[ProductEnhance] Sending pending prompt via effect (ready:', isChatReady, 'control:', !!chatControl, 'open:', showChat, ')');
          chatControl.sendFlowRequest({ text_input: prompt })
            .catch((err) => console.error('[ProductEnhance] Failed to send pending prompt:', err))
            .finally(() => setSending(false));
        }
      }, 150); // Slightly longer delay to account for panel animation
      return () => clearTimeout(timeoutId);
    }
  }, [isChatReady, chatControl, showChat]);

  const handleEnhanceClick = useCallback(async () => {
    const prompt = `Enhance the product description <!--- Current description: "${descriptionRef.current}" Update the description by calling the suggestEnhancement tool-->`;

    // Always open chat if not already open
    if (!showChat) {
      setShowChatWithUrl(true);
    }

    // Queue the prompt - it will be sent by the useEffect when chat is ready and panel is open
    // The useEffect watches isChatReady, chatControl, and showChat, so it will automatically
    // send when all conditions are met
    pendingPromptRef.current = prompt;
    setSending(true);
    console.log('[ProductEnhance] Queued prompt (ready:', isChatReady, 'control:', !!chatControl, 'open:', showChat, ')');
  }, [showChat, isChatReady, chatControl]);

  // Handle token loading state
  if (tokenLoading) {
    return (
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  // Handle token error state
  if (tokenError || !token) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          padding: '24px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          borderRadius: '12px',
        }}>
          <strong>Error loading token:</strong> {tokenError || 'No token available'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-50">
      {/* Overview Section */}
      <div className="px-4 py-4 md:px-10 md:py-6 bg-white border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h1 className="m-0 text-xl md:text-2xl font-bold text-slate-900">
            Product Enhancement
          </h1>
          <a
            href="https://github.com/botdojo-ai/chat-sdk-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md no-underline text-sm font-medium hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            View on GitHub
          </a>
        </div>
        <h2 className="m-0 mb-2 md:mb-3 text-base md:text-lg font-bold text-slate-900">
          Overview
        </h2>
        <p className="m-0 mb-3 text-sm text-slate-500 leading-relaxed">
          This example demonstrates how AI agents can enhance product descriptions using <strong>Frontend MCP tools</strong>. 
          The agent has visibility into what the user is looking at—the current product description—and can suggest improvements. 
          A custom chat UI allows users to toggle between the suggested changes and the original content.
        </p>
        <div className="mt-3 md:mt-4">
          <div className="text-xs md:text-sm font-semibold text-slate-600 mb-2">Components Used:</div>
          <div className="flex flex-wrap gap-2">
            {['BotDojoChat', 'Frontend MCP Tools', 'Agent Visibility', 'Custom Chat UI'].map((component) => (
              <span
                key={component}
                className="px-2.5 py-1 bg-slate-100 rounded-md text-xs text-slate-600 font-medium"
              >
                {component}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="flex flex-col lg:flex-row min-h-[500px] lg:h-[700px] overflow-hidden">
      
            {/* Main content - Product form */}
            <div className="flex-1 p-4 md:p-6">
              {/* Header */}
              <div className="mb-4 md:mb-5">
                <h1 className="m-0 text-lg md:text-xl font-bold text-slate-900">
                  Edit Product
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  SKU: BONSAI-PINE-002
                </p>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] gap-4 md:gap-5">
                {/* Product image */}
                <div className="w-20 h-20 md:w-[100px] md:h-[100px] bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center mx-auto sm:mx-0">
                  <img
                    src="/images/products/product-2-cartoon.png"
                    alt="Ancient Pine Bonsai"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Form fields */}
                <div className="flex flex-col gap-3">
                  {/* Product name */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value="Ancient Pine Bonsai"
                      readOnly
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white"
                    />
                  </div>

                  {/* Price and Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Price
                      </label>
                      <input
                        type="text"
                        value="$449.99"
                        readOnly
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value="Bonsai Tree"
                        readOnly
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description field */}
              <div className="mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <label className="text-[11px] font-medium text-slate-500">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleEnhanceClick}
                  disabled={sending}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 md:px-5 md:py-2.5 rounded-lg text-sm font-bold text-white transition-all min-h-[44px] disabled:cursor-not-allowed"
                  style={{
                    background: sending ? '#e0e7ff' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: sending ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <span className="text-base">✨</span>
                  <span>{sending ? 'Enhancing...' : 'Enhance with AI'}</span>
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-[200px] md:h-[350px] lg:h-[400px] p-2.5 rounded-md text-sm text-slate-900 bg-white resize-y leading-relaxed transition-colors"
                style={{
                  border: description !== INITIAL_DESCRIPTION ? '2px solid #10b981' : '1px solid #e2e8f0',
                }}
              />
              {description !== INITIAL_DESCRIPTION && (
                <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-1 bg-green-50 border border-green-300 rounded-full text-[10px] font-semibold text-green-600">
                  <span>✓</span>
                  <span>AI Enhanced</span>
                </div>
              )}
            </div>
            </div>
         

      {/* Agent Chat Panel - always rendered but conditionally shown */}
      <div 
        className={`fixed inset-0 lg:relative lg:inset-auto lg:w-[45%] lg:min-w-[400px] flex flex-col bg-white z-[9999] lg:z-auto lg:border-l lg:border-slate-200 ${showChat ? '' : 'hidden'}`}
      >
        {/* Panel header */}
        <div 
          className="px-4 py-3 md:px-5 md:py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <span className="text-sm font-semibold text-white">
            Agent
          </span>
          <div className="flex items-center gap-3">
           
            <button
              onClick={() => setShowChatWithUrl(false)}
              className="bg-transparent border-none text-white/90 text-xl cursor-pointer leading-none w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Chat content  */}
        <div className="flex-1 overflow-hidden">
 
          <BotDojoChat
            apiKey={token}
            baseUrl={config.baseUrl}
            mode="inline"
            autoFocus={false}
            newSession={newSession}
            modelContext={modelContext}
            onBotDojoChatControl={handleBotDojoChatControl}
            onReady={handleChatReady}
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
        </div>
      </div>

      {/* Floating Chat Button - shows when chat is closed */}
      {!showChat && (
        <button
          onClick={() => setShowChatWithUrl(true)}
          className="fixed bottom-5 right-5 md:bottom-6 md:right-20 w-14 h-14 rounded-full border-none flex items-center justify-center cursor-pointer z-[9999] hover:scale-110 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          }}
          title="Open AI Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
      </div>

      {/* Code Section */}
      <div className="p-4 md:p-6 border-t border-slate-200 bg-white">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900">
          Source Code
        </h2>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 py-2 md:px-4 md:py-3 border-b border-slate-200 bg-slate-50 overflow-x-auto">
            <Tabs
              tabs={codeFiles.map(f => ({ id: f.id, label: f.label }))}
              activeId={activeCodeTab}
              onChange={setActiveCodeTab}
            />
          </div>
          <div className="p-3 md:p-4">
            <CodeSnippet 
              code={activeCode} 
              language="tsx" 
              title={activeCodeTab === 'page' ? 'pages/examples/product-enhance/index.tsx' : 'pages/examples/product-enhance/widgets/enhance-mcp-app.tsx'} 
            />
          </div>
        </div>

        {/* Key Concepts */}
        <div className="mt-5 md:mt-6 p-4 md:p-5 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="m-0 mb-3 md:mb-4 text-sm md:text-base font-bold text-slate-900">
            Key Concepts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <code className="block mb-2 text-xs md:text-sm font-bold text-indigo-500">
                ModelContext
              </code>
              <p className="m-0 text-xs md:text-sm text-slate-500 leading-relaxed">
                Defines the tools available to the AI agent. Tools can read/write application state.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <code className="block mb-2 text-xs md:text-sm font-bold text-indigo-500">
                _meta.ui.resourceUri
              </code>
              <p className="m-0 text-xs md:text-sm text-slate-500 leading-relaxed">
                Links a tool to an MCP App that renders when the tool is called.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <code className="block mb-2 text-xs md:text-sm font-bold text-indigo-500">
                useMcpApp()
              </code>
              <p className="m-0 text-xs md:text-sm text-slate-500 leading-relaxed">
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
