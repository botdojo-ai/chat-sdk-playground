import { useEffect, useMemo, useRef, useState } from 'react';
import { BotDojoChat, type BotDojoChatControl, type ModelContext } from '@botdojo/chat-sdk';
import { v4 as uuidv4 } from 'uuid';
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

const config = {
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};

const INITIAL_DESCRIPTION = 'Majestic pine bonsai with aged bark and elegant silhouette. 15 years old.';

export default function ProductEnhancePage() {
  const [description, setDescription] = useState<string>(INITIAL_DESCRIPTION);
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const chatControlRef = useRef<BotDojoChatControl | null>(null);
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const descriptionRef = useRef(description);
  const appIdRef = useRef<string | null>(null);
  const pendingPromptRef = useRef<string | null>(null);

  // Get temporary JWT token for secure API access
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();

  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  // Define the Model Context with tools the AI can use
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
          return { description: descriptionRef.current };
        },
      },
      {
        name: 'suggestEnhancement',
        description: 'Propose an enhanced product description and show it in an MCP App.',
        inputSchema: {
          type: 'object',
          properties: {
            enhanced_text: { type: 'string', description: 'The enhanced description.' },
          },
          required: ['enhanced_text'],
        },
        _meta: {
          ui: {
            resourceUri: 'ui://product-enhance/context/cache_buster/product-enhance',
            prefersProxy: true,
          },
        },
        execute: async (params: { enhanced_text: string }) => {
          const appId = appIdRef.current || `enhance-${uuidv4()}`;
          appIdRef.current = appId;
          setDescription(params.enhanced_text);
          return {
            original: descriptionRef.current,
            enhanced: params.enhanced_text,
            appId,
          };
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
          return { success: true };
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
          // In production, this would return your MCP App HTML
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          const html = await fetchMcpAppHtml('enhance-mcp-app');
          return {
            uri: 'ui://product-enhance/context/cache_buster/product-enhance',
            mimeType: 'text/html;profile=mcp-app',
            text: html,
          };
        },
      },
    ],
  }), []);

  // Handle tool calls from MCP Apps (e.g., when user clicks "Apply")
  const handleToolCall = async (toolName: string, params: any) => {
    if (toolName === 'updateDescription' && params?.description) {
      setDescription(params.description);
      return { success: true };
    }
    return { ok: true };
  };

  const sendPrompt = async (prompt: string) => {
    if (!chatControlRef.current) return;
    setSending(true);
    try {
      await chatControlRef.current.sendFlowRequest({ text_input: prompt });
    } finally {
      setSending(false);
    }
  };

  const handleEnhanceClick = () => {
    const prompt = `Enhance the product description. Current: "${descriptionRef.current}"`;
    // Store the prompt to send when chat is ready
    pendingPromptRef.current = prompt;
    setSending(true);
    setShowChat(true);
  };

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

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Product Form */}
      <div style={{ flex: 1, padding: '24px' }}>
        <h1>Edit Product</h1>
        
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <label>Description</label>
            <button onClick={handleEnhanceClick} disabled={sending}>
              ✨ {sending ? 'Enhancing...' : 'Enhance with AI'}
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', height: '200px' }}
          />
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div style={{ width: '400px', borderLeft: '1px solid #e2e8f0' }}>
          <BotDojoChat
            apiKey={token}
            baseUrl={config.baseUrl}
            mode="inline"
            autoFocus={false}
            modelContext={modelContext}
            onBotDojoChatControl={(control) => {
              setChatControl(control);
              chatControlRef.current = control;
            }}
            onReady={() => {
              // Chat is now truly ready - send any pending prompt
              if (pendingPromptRef.current && chatControlRef.current) {
                const prompt = pendingPromptRef.current;
                pendingPromptRef.current = null;
                chatControlRef.current.sendFlowRequest({ text_input: prompt })
                  .catch((error) => console.error('Error sending prompt:', error))
                  .finally(() => setSending(false));
              }
            }}
            onToolCall={handleToolCall}
          />
        </div>
      )}
    </div>
  );
}

