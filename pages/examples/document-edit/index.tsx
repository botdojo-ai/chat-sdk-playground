import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { BotDojoChat } from '@botdojo/chat-sdk';
import type {
  BotDojoChatControl,
  ModelContext,
  ToolExecutionContext,
} from '@botdojo/chat-sdk';
import {
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
} from '@mdxeditor/editor';
import CodeSnippet from '@/components/CodeSnippet';
import { Tabs } from '@/components/Tabs';
import { useBotDojoChatDebugLogger } from '@/utils/BotDojoChatDebug';
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

// Hook to detect mobile screens (768px breakpoint)
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    
    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

const MDXEditor = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.MDXEditor),
  { ssr: false },
);

const config = {
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};

const INITIAL_MARKDOWN = `
Don Corleone,

We just released a new Agent on our website that gives visitors a rich agentic experience. It can guide customers through checkout, answer questions live, and suggest the next best actions so they don't get stuck.

Please try it out today and let us know if anything feels off. We're eager to iterate fast and keep improving for your team.

Cheers,
John Cocktoaston`;

type DiffSuggestion = {
  before: string;
  after: string;
  summary?: string;
  appId: string;
  applied?: boolean;
};

interface DocumentEditProps {
  sourceFiles: {
    page: string;
    mcpApp: string;
  };
}

export default function DocumentEdit({ sourceFiles }: DocumentEditProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();
  const [markdown, setMarkdown] = useState<string>(INITIAL_MARKDOWN);
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const chatControlRef = useRef<BotDojoChatControl | null>(null);
  
  const [sending, setSending] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [activeCodeTab, setActiveCodeTab] = useState('page');
  const [showChat, setShowChat] = useState(false);
  const markdownRef = useRef(markdown);
  const appIdRef = useRef<string | null>(null);
  const pendingPromptRef = useRef<string | null>(null);
  const debugLogger = useBotDojoChatDebugLogger();
  const debugLoggerRef = useRef(debugLogger);
  
  // Code files configuration
  const codeFiles = [
    { id: 'page', label: 'index.tsx', code: sourceFiles.page },
    { id: 'mcp-app', label: 'review-mcp-app.tsx', code: sourceFiles.mcpApp },
  ];
  
  const activeCode = codeFiles.find(f => f.id === activeCodeTab)?.code || '';
  
  const newSession = router.query['new-session'] === 'true' || router.query['newsession'] === 'true';

  /**
   * TIP: Use refs to access current state in tool execute functions.
   * 
   * Why: Tool execute functions inside useMemo capture state from when the memo
   * was created. Without refs, you'd get stale values. The ref always points to
   * the current value, so markdownRef.current is always up-to-date.
   */
  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);

  useEffect(() => {
    debugLoggerRef.current = debugLogger;
  }, [debugLogger]);

  // ============================================================
  // MODEL CONTEXT - Defines tools the AI can use to edit the document
  // ============================================================
  const modelContext: ModelContext = useMemo(() => ({
    name: 'ui_mcp',
    description: 'Frontend MCP that edits documents via a diff review interface.',
    toolPrefix: 'ui_mcp',
    uri: 'ui-mcp://context',
    tools: [
      // Tool: Read the current document content
      {
        name: 'getMarkdown',
        description: 'Return the current document content.',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'Pass true to get content.' },
          },
        },
        execute: async () => ({
          markdown: markdownRef.current,
          resource: 'ui-mcp://markdown',
        }),
        _meta: { 
          'botdojo/display-name': 'Get Document',
          'botdojo/hide-step-details': true,
        },
      },
      // Tool: Suggest changes (shows diff in MCP App)
      {
        name: 'suggestUpdate',
        description: 'Propose document changes and show a diff for review.',
        inputSchema: {
          type: 'object',
          properties: {
            updated_markdown: {
              type: 'string',
              description: 'The full updated document text.',
            },
            summary: {
              type: 'string',
              description: 'Short description of the changes.',
            },
          },
          required: ['updated_markdown'],
        },
        _meta: {
          'botdojo/display-name': 'Suggest Changes',
          'botdojo/no-cache': true,
          /**
           * TIP: The resourceUri must exactly match the resource uri defined below.
           * This links the tool to its MCP App UI.
           */
          ui: {
            resourceUri: 'ui://ui-mcp/review-diff',
          },
        },
        execute: async (
          params: { updated_markdown: string; summary?: string },
          context?: ToolExecutionContext
        ) => {
          const before = markdownRef.current;
          const after = params.updated_markdown;
          const appId = appIdRef.current || `doc-${uuidv4()}`;
          appIdRef.current = appId;

          const diffPayload: DiffSuggestion = {
            before,
            after,
            summary: params.summary,
            appId,
            applied: false,
          };

          /**
           * TIP: Use notifyToolInputPartial to stream data to the MCP App.
           * 
           * Why: During tool execution, you can send partial updates to the UI
           * before returning the final result. The MCP App receives these via
           * the onToolInputPartial callback.
           */
          context?.notifyToolInputPartial?.({ diffPayload });

          return diffPayload;
        },
      },
      // Tool: Apply changes directly
      {
        name: 'updateMarkdown',
        description: 'Apply changes directly to the document.',
        inputSchema: {
          type: 'object',
          properties: {
            markdown: { type: 'string', description: 'New document content.' },
          },
          required: ['markdown'],
        },
        execute: async (params: { markdown: string }) => {
          setMarkdown(params.markdown);
          setEditorVersion((v) => v + 1);
          appIdRef.current = null;
          debugLoggerRef.current?.logInfo('Document updated');
          return { success: true, message: 'Document updated' };
        },
        _meta: { 
          'botdojo/display-name': 'Apply Changes',
          'botdojo/hide-step-details': true,
        },
      },
    ],
    resources: [
      // Live document content resource
      {
        uri: 'ui-mcp://markdown',
        name: 'Document Content',
        description: 'Current document content.',
        mimeType: 'text/markdown',
        getContent: async () => markdownRef.current,
      },
      // Review diff MCP App
      {
        /**
         * TIP: The resource uri must exactly match the tool's _meta.ui.resourceUri.
         */
        uri: 'ui://ui-mcp/review-diff',
        name: 'Review Changes MCP App',
        description: 'UI for reviewing and applying suggested changes.',
        mimeType: 'text/html;profile=mcp-app',
        getContent: async () => {
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          const html = await fetchMcpAppHtml('review-mcp-app');
          return {
            uri: 'ui://ui-mcp/review-diff',
            mimeType: 'text/html;profile=mcp-app',
            text: html,
          };
        },
      },
    ],
    prompts: [],
  }), []);

  // Handle tool calls from MCP Apps (e.g., when user clicks "Apply")
  const handleToolCall = useCallback(async (toolName: string, params: any, appId: string) => {
    debugLoggerRef.current?.logCanvasIntent(toolName, params, appId);
    
    if (toolName === 'apply-markdown' && params?.markdown) {
      setMarkdown(params.markdown);
      setEditorVersion((v) => v + 1);
      appIdRef.current = null;
      return { success: true, applied: true, appId };
    }
    
    if (toolName === 'dismiss-suggestion') {
      appIdRef.current = null;
      return { dismissed: true };
    }
    
    return { ok: true };
  }, []);

  // Memoized callbacks for BotDojoChat
  const handleBotDojoChatControl = useCallback((control: BotDojoChatControl) => {
    setChatControl(control);
    chatControlRef.current = control;
  }, []);

  const handleChatReady = useCallback(() => {
    setChatReady(true);
    if (pendingPromptRef.current && chatControlRef.current) {
      const prompt = pendingPromptRef.current;
      pendingPromptRef.current = null;
      chatControlRef.current.sendFlowRequest({ text_input: prompt })
        .catch((error) => console.error('Error:', error))
        .finally(() => setSending(false));
    }
  }, []);

  // Send a prompt to the chat
  const sendPrompt = useCallback(async (prompt: string) => {
    setSending(true);
    
    if (chatReady && chatControlRef.current) {
      try {
        await chatControlRef.current.sendFlowRequest({ text_input: prompt });
      } catch (error) {
        console.error('Error sending prompt:', error);
      } finally {
        setSending(false);
      }
    } else {
      pendingPromptRef.current = prompt;
    }
  }, [chatReady]);

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
            Document Edit
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
          This example demonstrates how AI agents can edit documents using <strong>Frontend MCP tools</strong>.
          The agent can read the document, suggest changes with a diff view, and apply edits.
          An MCP App renders the diff for user review before applying.
        </p>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Components Used:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['BotDojoChat', 'ModelContext', 'MCP App Diff View', 'Tool Streaming'].map((component) => (
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
        height: '500px',
        overflow: 'hidden',
      }}>
        {/* Document Editor */}
        <div style={{ 
          flex: 1, 
          borderRight: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Editor Toolbar */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>📄</span>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
              Document.md
            </span>
            
            {/* AI Fix Button */}
            <button
              onClick={() => {
                // Open chat panel on mobile
                if (isMobile) {
                  setShowChat(true);
                }
                // Send prompt (will be queued if chat isn't ready yet)
                sendPrompt('Fix grammar and spelling errors in this document.');
              }}
              disabled={sending}
              style={{
                marginLeft: '8px',
                padding: '8px 14px',
                background: sending || !chatReady ? '#94a3b8' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: sending || !chatReady ? 'not-allowed' : 'pointer',
                opacity: sending || !chatReady ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {sending ? (
                <span style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              ) : (
                <span>✨</span>
              )}
              Fix Grammar & Spelling
            </button>
            
            {/* Reset Button */}
            {markdown !== INITIAL_MARKDOWN && (
              <button
                onClick={() => {
                  setMarkdown(INITIAL_MARKDOWN);
                  setEditorVersion((v) => v + 1);
                }}
                style={{
                  padding: '8px 14px',
                  background: '#f59e42',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ↻ Reset
              </button>
            )}
          </div>
          
          {/* Editor */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            <MDXEditor
              key={editorVersion}
              markdown={markdown}
              onChange={setMarkdown}
              plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                linkPlugin(),
                tablePlugin(),
                thematicBreakPlugin(),
                markdownShortcutPlugin(),
              ]}
              contentEditableClassName="prose"
            />
          </div>
          
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>

        {/* Chat Panel - Desktop: 50% width, Mobile: full-screen overlay */}
        <div 
          style={isMobile ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: showChat ? 'flex' : 'none',
            flexDirection: 'column',
            background: '#ffffff',
            zIndex: 9999,
          } : {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
          }}
        >
          {/* Chat header with close button on mobile */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              AI Assistant
            </span>
            {isMobile && (
              <button
                onClick={() => setShowChat(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0 8px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {/* ============================================================
                BOTDOJOCHAT CONFIGURATION
                This is how you configure the chat with ModelContext
                ============================================================ */}
 
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
        hideBotIcon={true}
        fontSize="14px"
        sessionKeyPrefix="document-edit"
        welcomeMessage={`## Document Editor Assistant

I can help fix grammar, improve clarity, or rewrite sections. Click **✨ Fix Grammar & Spelling** or ask me directly.`}
      />
        
          </div>
        </div>
      </div>

      {/* Floating Chat Button - Mobile only, shows when chat is closed */}
      {isMobile && !showChat && (
        <button
          onClick={() => setShowChat(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          title="Open AI Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

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
              title={activeCodeTab === 'page' ? 'pages/examples/document-edit/index.tsx' : 'pages/examples/document-edit/widgets/review-mcp-app.tsx'} 
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
  const baseDir = path.join(process.cwd(), 'pages/examples/document-edit');
  
  const pageCode = fs.readFileSync(path.join(baseDir, 'index.tsx'), 'utf-8');
  const mcpAppCode = fs.readFileSync(path.join(baseDir, 'widgets/review-mcp-app.tsx'), 'utf-8');
  
  return {
    props: {
      sourceFiles: {
        page: pageCode,
        mcpApp: mcpAppCode,
      },
    },
  };
}
