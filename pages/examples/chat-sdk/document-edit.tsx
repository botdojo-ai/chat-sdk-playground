import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import {
  BotDojoChat,
  uiResource,
  textResult,
} from '@botdojo/chat-sdk';
import type {
  BotDojoChatControl,
  ModelContext,
  ModelContextResource,
  ToolDefinition,
  ContentItem,
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
import { eventBus } from '@/lib/eventBus';
import { useBotDojoChatDebugLogger } from '@/lib/BotDojoChatDebug';

const MDXEditor = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.MDXEditor),
  { ssr: false },
);

const config = {
  apiKey: process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API || '',
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'http://localhost:3000',
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
  canvasId: string;
  applied?: boolean;
};

const buildCanvasUrl = (canvasId: string) =>
  `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3500'}/examples/chat-sdk/document-edit/canvas/review`;

const estimateCanvasHeight = (before: string, after: string) => {
  const lines = Math.max(before.split('\n').length, after.split('\n').length);
  const height = 360 + lines * 12;
  return `${Math.max(520, Math.min(height, 900))}px`;
};

export default function UiMcp() {
  const router = useRouter();
  const [markdown, setMarkdown] = useState<string>(INITIAL_MARKDOWN);
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'agent' | 'model-context' | 'review-changes'>('chat');
  const [editorVersion, setEditorVersion] = useState(0);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectionText, setSelectionText] = useState<string>('');
  const markdownRef = useRef(markdown);
  const canvasIdRef = useRef<string | null>(null);
  const debugLogger = useBotDojoChatDebugLogger();
  const debugLoggerRef = useRef(debugLogger);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Check for new-session query parameter (support both 'new-session' and 'newsession')
  const newSession = router.query['new-session'] === 'true' || router.query['newsession'] === 'true';

  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);

  useEffect(() => {
    debugLoggerRef.current = debugLogger;
    debugLogger?.logInfo('Frontend MCP example mounted');
  }, [debugLogger]);

  useEffect(() => {
    const closeMenu = () => setMenuPos(null);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuPos(null);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Debug: Listen to all postMessage events to trace canvas intents
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      console.log('[UiMcp] postMessage received:', {
        origin: event.origin,
        type: data?.type,
        payload: data?.payload,
        fullData: data
      });
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

const markdownResource: ModelContextResource = useMemo(() => ({
  uri: 'ui-mcp://markdown',
  name: 'Editor Markdown (live)',
  description: 'Always reflects the latest markdown in the editor (used by cards and tools).',
  mimeType: 'text/markdown',
  getContent: async () => markdownRef.current,
}), []);

  const runUpdateMarkdown = useCallback((next: string, source: string) => {
    setMarkdown(next);
    setEditorVersion((v) => v + 1); // Force MDXEditor remount so canvas-applied changes always render
    canvasIdRef.current = null;
    eventBus.logInfo('Markdown updated', { source });
    debugLoggerRef.current?.logInfo('Markdown updated', { source });
    return { success: true, message: 'Markdown updated', source };
  }, []);

  const toolset: ToolDefinition[] = useMemo(() => [
    {
      name: 'getMarkdown',
      description: 'Return the current markdown content for the MCP App card.',
      inputSchema: {
        type: 'object',
        properties: {
          go: {
            type: 'boolean',
            description: 'pass true.',
          },
        },
      },
      execute: async () => {
        const content = markdownRef.current;
        eventBus.logInfo('getMarkdown', { length: content.length });
        debugLoggerRef.current?.logInfo('getMarkdown', { length: content.length });
        return {
          markdown: content,
          resource: markdownResource.uri,
        };
      },
      _meta: { 
        'botdojo/display-name': 'Get Markdown',
        'botdojo/hide-step-details': true,
       },
    },
    {
      name: 'suggestUpdate',
      description: 'Propose an updated markdown string and show a diff in a BotDojo MCP App.',
      inputSchema: {
        type: 'object',
        properties: {
          updated_markdown: {
            type: 'string',
            description: 'The full updated markdown text to propose.',
          },
          summary: {
            type: 'string',
            description: 'Short note about why the changes are helpful.',
          },
        },
        required: ['updated_markdown'],
      },
      _meta: {
        'botdojo/display-name': 'Suggest Update',
        ui: {
          resourceUri: buildCanvasUrl('suggest-update'),
          prefersProxy: false,
        },
      },
      execute: async (params: { updated_markdown: string; summary?: string }, context?: ToolExecutionContext) => {
        const before = markdownRef.current;
        const after = params.updated_markdown;
        const canvasId = canvasIdRef.current || `ui-mcp-${uuidv4()}`;
        canvasIdRef.current = canvasId;

        const diffPayload: DiffSuggestion = {
          before,
          after,
          summary: params.summary,
          canvasId,
          applied: false,
        };

        eventBus.logInfo('suggestUpdate', { canvasId, summary: params.summary });
        debugLoggerRef.current?.logInfo('suggestUpdate', { canvasId });

        // Send diff payload to the canvas via tool input partial
        context?.notifyToolInputPartial?.({
          diffPayload,
        });

        return diffPayload
      },
    },
    {
      name: 'updateMarkdown',
      description: 'Apply a markdown string directly to the editor.',
      inputSchema: {
        type: 'object',
        properties: {
          markdown: { type: 'string', description: 'Markdown to set in the editor.' },
          reason: { type: 'string', description: 'Why this update is being applied.' },
        },
        required: ['markdown'],
      },
      execute: async (params: { markdown: string; reason?: string }) => {
        const result = runUpdateMarkdown(params.markdown, 'updateMarkdown tool');
        return { ...result, reason: params.reason };
      },
      _meta: { 'botdojo/display-name': 'Apply Markdown',
        'botdojo/hide-step-details': true,
       },

    },
    {
      name: 'regexSuggestUpdate',
      description: 'Apply a regex replacement to the markdown and show the proposed change in an MCP App.',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern (JS syntax, no flags)' },
          replacement: { type: 'string', description: 'Replacement text' },
          summary: { type: 'string', description: 'Optional summary for the change' },
        },
        required: ['pattern', 'replacement'],
      },
      _meta: { 'botdojo/display-name': 'Regex Suggest Update',
        ui: {
          resourceUri: buildCanvasUrl('regex-suggest-update'),
          prefersProxy: false,
        },
      },
      execute: async (params: { pattern: string; replacement: string; summary?: string }): Promise<any> => {
        const before = markdownRef.current;
        let regex: RegExp;
        try {
          regex = new RegExp(params.pattern, 'g');
        } catch (err) {
          const message = (err as Error)?.message || 'Invalid regex';
          eventBus.logError(message);
          debugLoggerRef.current?.logError(`regexSuggestUpdate invalid regex: ${params.pattern} - ${message}`);
          return { error: `Invalid regex: ${message}` };
        }

        const after = before.replace(regex, params.replacement);
        if (after === before) {
          return { success: false, message: 'No changes from regex replacement' };
        }

        const canvasId = canvasIdRef.current || `ui-mcp-${uuidv4()}`;
        canvasIdRef.current = canvasId;

        const diffPayload: DiffSuggestion = {
          before,
          after,
          summary: params.summary || `Regex replace /${params.pattern}/ → "${params.replacement}"`,
          canvasId,
          applied: false,
        };

    
        eventBus.logInfo('regexSuggestUpdate', { canvasId, pattern: params.pattern });
        debugLoggerRef.current?.logInfo('regexSuggestUpdate', { canvasId, pattern: params.pattern });

        return diffPayload
      },
  
    },
  ], [markdownResource.uri, runUpdateMarkdown]);

  const modelContext: ModelContext = useMemo(() => ({
    name: 'ui_mcp',
    description: 'Frontend MCP that edits markdown via a BotDojo MCP App diff card.',
    toolPrefix: 'ui_mcp',
    uri: 'ui-mcp://context',
    resourceUri: markdownResource.uri,
    tools: toolset,
    resources: [markdownResource],
  }), [markdownResource, toolset]);

  const handleCanvasIntent = async (intent: string, params: any, canvasId?: string) => {
    // Extract canvasId from params if not provided separately
    const actualCanvasId = canvasId || params?.canvasId;
    console.log('[UiMcp] handleCanvasIntent called:', { 
      intent, 
      params, 
      canvasId: actualCanvasId,
      markdown: params?.markdown?.substring(0, 100)
    });
    debugLoggerRef.current?.logCanvasIntent(intent, params, actualCanvasId || '');
    eventBus.logInfo('MCP App intent', { intent, params, canvasId: actualCanvasId }, 'mcp');

    if (intent === 'apply-markdown') {
      const markdownToApply = params?.markdown;
      if (typeof markdownToApply === 'string') {
        const result = await Promise.resolve(runUpdateMarkdown(markdownToApply, 'mcp app intent'));
        return { ...(result || {}), applied: true, canvasId: actualCanvasId };
      } else {
        return { error: 'missing-markdown' };
      }
    }

    if (intent === 'dismiss-suggestion') {
      canvasIdRef.current = null;
      return { dismissed: true };
    }

    return { ok: true };
  };

  const handleCanvasTool = async (toolName: string, params: any, appId: string): Promise<any> => {
    // Delegate to intent handler for MCP Apps tools/call
    return handleCanvasIntent(toolName, params, appId);
  };

  const sendPrompt = async (prompt: string) => {
    if (!chatControl) return;
    setSending(true);
    try {
      await chatControl.sendFlowRequest({ text_input: prompt });
    } catch (error) {
      eventBus.logError(error);
    } finally {
      setSending(false);
    }
  };

  const openContextMenu = (event: React.MouseEvent) => {
    if (!chatControl) return;
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (!text) return;
    // ensure selection is inside the editor container
    if (editorContainerRef.current && sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      if (!editorContainerRef.current.contains(range.commonAncestorContainer)) {
        return;
      }
    }
    event.preventDefault();
    setSelectionText(text);
    setMenuPos({ x: event.clientX, y: event.clientY });
  };

  const handleEditorAction = async (action: 'improve' | 'shorter' | 'longer') => {
    if (!selectionText || !chatControl) return;
    const friendlyLabel =
      action === 'improve' ? 'Improve writing' : action === 'shorter' ? 'Make shorter' : 'Make longer';
    const actionInstruction = action === 'improve'
      ? 'Improve the clarity and tone of this selection.'
      : action === 'shorter'
        ? 'Rewrite this selection to be shorter while keeping meaning.'
        : 'Expand this selection with more detail while keeping intent.';
    const friendlyHeader = `<!-- change --> [Friendly Message: ${friendlyLabel}]`;
    const visibleHeader = action === 'improve'
      ? '*Improve writing of selected text*'
      : action === 'shorter'
        ? '*Make selected text shorter*'
        : '*Make selected text longer*';
    const promptMap: Record<typeof action, string> = {
      improve: `${visibleHeader}\n <!--${actionInstruction}\n\n${selectionText} -->`,
      shorter: `${visibleHeader}\n <!--${actionInstruction}\n\n${selectionText} -->`,
      longer: `${visibleHeader}\n <!--${actionInstruction}\n\n${selectionText} -->`,
    };
    setMenuPos(null);
    setSending(true);
    try {
      await chatControl.sendFlowRequest({ text_input: promptMap[action] });
    } finally {
      setSending(false);
    }
  };

  const selectionMenu = menuPos && selectionText ? (
    <div
      style={{
        position: 'fixed',
        top: menuPos.y,
        left: menuPos.x,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 12px 28px rgba(15,23,42,0.15)',
        borderRadius: '10px',
        padding: '6px',
        zIndex: 9999,
        minWidth: '200px',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '6px 8px', fontSize: '12px', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
        Selected: {selectionText.slice(0, 40)}{selectionText.length > 40 ? '…' : ''}
      </div>
      {[
        { key: 'improve', label: 'Improve writing' },
        { key: 'shorter', label: 'Make shorter' },
        { key: 'longer', label: 'Make longer' },
      ].map((item) => (
        <button
          key={item.key}
          onClick={() => handleEditorAction(item.key as 'improve' | 'shorter' | 'longer')}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#0f172a',
            borderRadius: '8px',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  const modelContextCode = useMemo(
    () => `
const markdownResource: ModelContextResource = useMemo(() => ({
  uri: 'ui-mcp://markdown',
  name: 'Editor Markdown (live)',
  description: 'Always reflects the latest markdown in the editor (used by cards and tools).',
  mimeType: 'text/markdown',
  getContent: async () => markdownRef.current,
}), []);

const toolset: ToolDefinition[] = useMemo(() => [
  {
    name: 'getMarkdown',
    description: 'Return the current markdown content for the MCP App card.',
    inputSchema: {
      type: 'object',
      properties: {
        go: {
          type: 'boolean',
          description: 'pass true.',
        },
      },
    },
    execute: async () => {
      const content = markdownRef.current;
      return {
        markdown: content,
        resource: markdownResource.uri,
      };
    },
    _meta: { 
      'botdojo/display-name': 'Get Markdown',
      'botdojo/hide-step-details': true,
    },
  },
  {
    name: 'suggestUpdate',
    description: 'Propose an updated markdown string and show a diff in a BotDojo MCP App.',
    inputSchema: {
      type: 'object',
      properties: {
        updated_markdown: {
          type: 'string',
          description: 'The full updated markdown text to propose.',
        },
        summary: {
          type: 'string',
          description: 'Short note about why the changes are helpful.',
        },
      },
      required: ['updated_markdown'],
    },
    _meta: {
      'botdojo/display-name': 'Suggest Update',
      ui: {
        resourceUri: buildCanvasUrl('suggest-update'),
        prefersProxy: false,
      },
    },
    execute: async (params: { updated_markdown: string; summary?: string }, context?: ToolExecutionContext) => {
      const before = markdownRef.current;
      const after = params.updated_markdown;
      const canvasId = canvasIdRef.current || \`ui-mcp-\${uuidv4()}\`;
      canvasIdRef.current = canvasId;

      const diffPayload: DiffSuggestion = {
        before,
        after,
        summary: params.summary,
        canvasId,
        applied: false,
      };

      // Send diff payload to the canvas via tool input partial
      context?.notifyToolInputPartial?.({
        diffPayload,
      });

      return diffPayload;
    },
  },
  {
    name: 'updateMarkdown',
    description: 'Apply a markdown string directly to the editor.',
    inputSchema: {
      type: 'object',
      properties: {
        markdown: { type: 'string', description: 'Markdown to set in the editor.' },
        reason: { type: 'string', description: 'Why this update is being applied.' },
      },
      required: ['markdown'],
    },
    execute: async (params: { markdown: string; reason?: string }) => {
      const result = runUpdateMarkdown(params.markdown, 'updateMarkdown tool');
      return { ...result, reason: params.reason };
    },
    _meta: { 
      'botdojo/display-name': 'Apply Markdown',
      'botdojo/hide-step-details': true,
    },
  },
  {
    name: 'regexSuggestUpdate',
    description: 'Apply a regex replacement to the markdown and show the proposed change in an MCP App.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex pattern (JS syntax, no flags)' },
        replacement: { type: 'string', description: 'Replacement text' },
        summary: { type: 'string', description: 'Optional summary for the change' },
      },
      required: ['pattern', 'replacement'],
    },
    _meta: { 
      'botdojo/display-name': 'Regex Suggest Update',
      ui: {
        resourceUri: buildCanvasUrl('regex-suggest-update'),
        prefersProxy: false,
      },
    },
    execute: async (params: { pattern: string; replacement: string; summary?: string }): Promise<any> => {
      const before = markdownRef.current;
      let regex: RegExp;
      try {
        regex = new RegExp(params.pattern, 'g');
      } catch (err) {
        const message = (err as Error)?.message || 'Invalid regex';
        return { error: \`Invalid regex: \${message}\` };
      }

      const after = before.replace(regex, params.replacement);
      if (after === before) {
        return { success: false, message: 'No changes from regex replacement' };
      }

      const canvasId = canvasIdRef.current || \`ui-mcp-\${uuidv4()}\`;
      canvasIdRef.current = canvasId;

      const diffPayload: DiffSuggestion = {
        before,
        after,
        summary: params.summary || \`Regex replace /\${params.pattern}/ → "\${params.replacement}"\`,
        canvasId,
        applied: false,
      };

      return diffPayload;
    },
  },
], [markdownResource.uri, runUpdateMarkdown]);

const modelContext: ModelContext = useMemo(() => ({
  name: 'ui_mcp',
  description: 'Frontend MCP that edits markdown via a BotDojo MCP App diff card.',
  toolPrefix: 'ui_mcp',
  uri: 'ui-mcp://context',
  resourceUri: markdownResource.uri,
  tools: toolset,
  resources: [markdownResource],
}), [markdownResource, toolset]);
`,
    [],
  );

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
          <strong>Missing API key.</strong> Run <code>pnpm setup-playground</code> to configure <code>NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API</code>.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', height: 'calc(100vh - 40px)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: '8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              marginBottom: '6px',
              fontSize: '24px', 
              fontWeight: 700, 
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span>📝</span> Edit Document
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5, maxWidth: '600px' }}>
              Frontend MCP — Embed MCP Apps in your product surface for interactive, UI-aware agents. The agent reads the document, suggests changes with a diff view, and the user can accept or reject.
            </p>
          </div>
         
        </div>
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
              <span style={{ fontSize: '16px' }}>📄</span>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Document.md</div>
              <button
            onClick={() => sendPrompt('Fix Grammer and Spelling')}
            disabled={sending || !chatControl}
            style={{
              padding: '10px 16px',
              background: sending || !chatControl ? '#94a3b8' : '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: sending || !chatControl ? 'not-allowed' : 'pointer',
              opacity: sending || !chatControl ? 0.6 : 1,
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {sending ? 'Sending…' : '✨ Fix Grammar & Spelling'}
          </button>
          {markdown === INITIAL_MARKDOWN
            ? null
            : (
            <button
              onClick={() => {
                setMarkdown(INITIAL_MARKDOWN);
                setEditorVersion((v) => v + 1);
              }}
              disabled={markdown === INITIAL_MARKDOWN}
              style={{
                padding: '10px 16px',
                background: markdown === INITIAL_MARKDOWN ? '#e5e7eb' : '#f59e42',
                color: markdown === INITIAL_MARKDOWN ? '#a3a3a3' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: markdown === INITIAL_MARKDOWN ? 'not-allowed' : 'pointer',
                opacity: markdown === INITIAL_MARKDOWN ? 0.7 : 1,
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              Reset to original
            </button>
            )}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#ffffff' }}>
            <div ref={editorContainerRef} onContextMenu={openContextMenu}>
              <MDXEditor
                key={`ui-mcp-mdx-editor-${editorVersion}`}
                markdown={markdown}
                onChange={(value) => setMarkdown(value)}
                plugins={[
                  headingsPlugin(),
                  listsPlugin(),
                  quotePlugin(),
                  linkPlugin(),
                  tablePlugin(),
                  thematicBreakPlugin(),
                  markdownShortcutPlugin(),
                ]}
                contentEditableClassName="mdxeditor-content"
              />
            </div>
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
        }}>
          <Tabs
            tabs={[
              { id: 'chat', label: 'Chat' },
              { id: 'model-context', label: 'Model Context.tsx' },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as 'chat' | 'agent' | 'model-context' | 'review-changes')}
          />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {activeTab === 'chat' ? (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}>
                <BotDojoChat
                  apiKey={config.apiKey}
                  baseUrl={config.baseUrl}
                  mode="inline"
                  newSession={newSession}
                  modelContext={modelContext}
                  onBotDojoChatControl={setChatControl}
                  onToolCall={handleCanvasTool}
                  onUiMessage={(message: string, params: any, appId: string) => {
                    debugLoggerRef.current?.logCanvasNotify(message, params, appId);
                    eventBus.logInfo('MCP App notify', { message, params, canvasId: appId }, 'mcp');
                  }}
                  onOpenLink={(url: string, target: string, appId: string) => {
                    debugLoggerRef.current?.logCanvasLink(url, target, appId);
                    eventBus.logInfo('MCP App link', { url, target, canvasId: appId }, 'mcp');
                  }}
                  hideBotIcon={true}
                  sessionKeyPrefix="edit-document"
                  welcomeMessage={`## Welcome to the Edit Document Frontend MCP example.
Click the Fix Grammar and Spelling button to see the agent propose changes via an MCP App diff and apply them in-place.`}
                />
              </div>
            ) : (
              <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <CodeSnippet
                  code={modelContextCode}
                  language="typescript"
                  title="Model Context.tsx"
                  fullHeight
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {selectionMenu}
    </div>
  );
}
