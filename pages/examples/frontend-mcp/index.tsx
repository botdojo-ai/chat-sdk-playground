import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';

export default function FrontendMcpIntroPage() {
  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-5 md:mb-8">
        <h1 className="m-0 text-xl md:text-[28px] font-bold text-slate-900">
          Frontend MCP
        </h1>
        <p className="mt-2 text-sm md:text-[15px] text-slate-500 leading-relaxed">
          Turn your frontend into a secure MCP server. Give AI agents visibility into what users see 
          and the ability to take actions on their behalf.
        </p>
      </div>

      {/* What is Frontend MCP */}
      <div className="p-4 md:p-6 rounded-xl border border-indigo-200 mb-5 md:mb-8" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
        <h2 className="m-0 mb-3 text-base md:text-lg font-bold text-indigo-800">
          What is Frontend MCP?
        </h2>
        <p className="m-0 mb-4 text-sm text-indigo-700 leading-relaxed">
          <strong>MCP (Model Context Protocol)</strong> is a standard for connecting AI agents to external data and tools.
          Frontend MCP lets you run an MCP-like server directly in the browser, giving agents secure access to your UI state.
        </p>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="bg-white p-3 rounded-lg border border-indigo-200">
            <div className="text-base md:text-lg mb-1">👁️</div>
            <div className="text-xs font-semibold text-indigo-800">Resources</div>
            <div className="text-[10px] md:text-[11px] text-indigo-500">What the agent can see</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-indigo-200">
            <div className="text-base md:text-lg mb-1">🔧</div>
            <div className="text-xs font-semibold text-indigo-800">Tools</div>
            <div className="text-[10px] md:text-[11px] text-indigo-500">What the agent can do</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-indigo-200">
            <div className="text-base md:text-lg mb-1">🔒</div>
            <div className="text-xs font-semibold text-indigo-800">Security</div>
            <div className="text-[10px] md:text-[11px] text-indigo-500">You control access</div>
          </div>
        </div>
      </div>

      {/* ModelContext Basics */}
      <div className="mb-5 md:mb-8">
        <h2 className="m-0 mb-3 md:mb-4 text-lg md:text-xl font-bold text-slate-900">
          Defining a ModelContext
        </h2>
        <p className="m-0 mb-4 text-sm text-slate-500 leading-relaxed">
          A <code className="bg-slate-100 px-1.5 py-0.5 rounded">ModelContext</code> defines 
          what the AI agent can see (resources) and do (tools) in your application.
        </p>
        
        <CodeSnippet
          code={`import { useMemo } from 'react';
import type { ModelContext } from '@botdojo/chat-sdk';

function MyComponent() {
  // Define your ModelContext (Frontend MCP)
  const modelContext: ModelContext = useMemo(() => ({
    name: 'my_app',
    description: 'Frontend MCP for my application',
    toolPrefix: 'app',
    uri: 'app://context',
    
    resources: [
      // Resources define what the agent can "see"
    ],
    
    tools: [
      // Tools define what the agent can "do"
    ],
  }), []);

  // Pass modelContext to BotDojoChat (widget) OR BotDojoChatProvider (headless)
  return null;
}`}
          language="tsx"
          title="ModelContext structure"
        />
      </div>

      {/* Use ModelContext with Chat Components */}
      <div className="mb-5 md:mb-8">
        <h2 className="m-0 mb-3 md:mb-4 text-lg md:text-xl font-bold text-slate-900">
          Using ModelContext with Chat
        </h2>
        <p className="m-0 mb-4 text-sm text-slate-500 leading-relaxed">
          The same <code className="bg-slate-100 px-1.5 py-0.5 rounded">modelContext</code> can be used with the drop-in widget
          (<code className="bg-slate-100 px-1.5 py-0.5 rounded">BotDojoChat</code>) or the headless provider
          (<code className="bg-slate-100 px-1.5 py-0.5 rounded">BotDojoChatProvider</code>).
        </p>

        <div className="flex flex-col gap-4">
          <CodeSnippet
            code={`import { useMemo, useRef, useEffect, useState } from 'react';
import { BotDojoChat, type ModelContext } from '@botdojo/chat-sdk';

export default function WidgetWithFrontendMcp() {
  const [text, setText] = useState('Hello');
  const textRef = useRef(text);

  useEffect(() => { textRef.current = text; }, [text]);

  const modelContext = useMemo<ModelContext>(() => ({
    name: 'demo',
    description: 'Frontend MCP demo for BotDojoChat',
    toolPrefix: 'demo',
    uri: 'demo://context',
    resources: [
      {
        uri: 'demo://text',
        name: 'Current Text',
        description: 'Current UI state',
        mimeType: 'application/json',
        getContent: async () => ({
          uri: 'demo://text',
          mimeType: 'application/json',
          text: JSON.stringify({ text: textRef.current }),
        }),
      },
    ],
    tools: [
      {
        name: 'setText',
        description: 'Update UI state',
        inputSchema: {
          type: 'object',
          properties: { text: { type: 'string' } },
          required: ['text'],
        },
        execute: async ({ text }: { text: string }) => {
          setText(text);
          return { success: true };
        },
      },
    ],
  }), []);

  return (
    <div>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>UI text: {text}</div>
      <BotDojoChat
        apiKey={token}  // From useTemporaryToken() hook
        baseUrl={process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com'}
        mode="inline"
        modelContext={modelContext}
      />
    </div>
  );
}`}
            language="tsx"
            title="BotDojoChat + ModelContext (drop-in widget)"
          />

          <CodeSnippet
            code={`import { useMemo, useRef, useEffect, useState } from 'react';
import {
  BotDojoChatProvider,
  useChatMessages,
  useChatActions,
  useChatStatus,
  type ModelContext,
} from '@botdojo/chat-sdk';

function MinimalHeadlessUi() {
  const { messages, isStreaming } = useChatMessages();
  const { sendMessage } = useChatActions();
  const { isReady } = useChatStatus();
  const [input, setInput] = useState('');

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>
        Headless Chat {isReady ? '' : '(connecting...)'} {isStreaming ? '(streaming...)' : ''}
      </div>
      <div style={{ padding: 12, height: 240, overflow: 'auto' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage(input.trim());
          setInput('');
        }}
        style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <button type="submit" style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#6366f1', color: 'white', fontWeight: 700 }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default function HeadlessWithFrontendMcp() {
  const [text, setText] = useState('Hello');
  const textRef = useRef(text);
  useEffect(() => { textRef.current = text; }, [text]);

  const modelContext = useMemo<ModelContext>(() => ({
    name: 'demo',
    description: 'Frontend MCP demo for BotDojoChatProvider',
    toolPrefix: 'demo',
    uri: 'demo://context',
    resources: [
      {
        uri: 'demo://text',
        name: 'Current Text',
        description: 'Current UI state',
        mimeType: 'application/json',
        getContent: async () => ({
          uri: 'demo://text',
          mimeType: 'application/json',
          text: JSON.stringify({ text: textRef.current }),
        }),
      },
    ],
    tools: [
      {
        name: 'setText',
        description: 'Update UI state',
        inputSchema: {
          type: 'object',
          properties: { text: { type: 'string' } },
          required: ['text'],
        },
        execute: async ({ text }: { text: string }) => {
          setText(text);
          return { success: true };
        },
      },
    ],
  }), []);

  return (
    <div>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>UI text: {text}</div>
      <BotDojoChatProvider
        apiKey={token}  // From useTemporaryToken() hook
        baseUrl={process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com'}
        modelContext={modelContext}
      >
        <MinimalHeadlessUi />
      </BotDojoChatProvider>
    </div>
  );
}`}
            language="tsx"
            title="BotDojoChatProvider + ModelContext (headless)"
          />
        </div>
      </div>

      {/* Defining Resources */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          👁️ Defining Resources
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          Resources let the agent "see" your UI state. Define what data the agent can access.
        </p>
        
        <CodeSnippet
          code={`resources: [
  {
    uri: 'app://user-data',
    name: 'User Data',
    description: 'Current user profile and preferences',
    mimeType: 'application/json',
    getContent: async () => ({
      uri: 'app://user-data',
      mimeType: 'application/json',
      text: JSON.stringify({
        name: 'John Doe',
        preferences: { theme: 'dark' }
      }),
    }),
  },
]`}
          language="typescript"
          title="Resource definition"
        />
      </div>

      {/* Defining Tools */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          🔧 Defining Tools
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          Tools let the agent take actions. The <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>execute</code> function 
          runs in your frontend with access to your React state.
        </p>
        
        <CodeSnippet
          code={`tools: [
  {
    name: 'updateTheme',
    description: 'Change the application theme',
    inputSchema: {
      type: 'object',
      properties: {
        theme: { 
          type: 'string', 
          enum: ['light', 'dark'],
          description: 'The theme to apply' 
        },
      },
      required: ['theme'],
    },
    execute: async (params: { theme: 'light' | 'dark' }) => {
      // This runs in your frontend!
      setTheme(params.theme);
      return { 
        success: true, 
        message: \`Theme changed to \${params.theme}\` 
      };
    },
    _meta: {
      'botdojo/display-name': 'Change Theme',
    },
  },
]`}
          language="typescript"
          title="Tool definition"
        />
      </div>

      {/* Complete Example */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          Complete Example
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          Here's a complete example putting it all together:
        </p>
        
        <CodeSnippet
          code={`import { useMemo, useState, useRef, useEffect } from 'react';
import { BotDojoChat, type ModelContext } from '@botdojo/chat-sdk';

function CounterApp() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  const modelContext: ModelContext = useMemo(() => ({
    name: 'counter',
    description: 'A simple counter with AI control',
    toolPrefix: 'counter',
    uri: 'counter://context',
    
    resources: [
      {
        uri: 'counter://value',
        name: 'Counter Value',
        description: 'The current counter value',
        mimeType: 'application/json',
        getContent: async () => ({
          uri: 'counter://value',
          mimeType: 'application/json',
          text: JSON.stringify({ value: countRef.current }),
        }),
      },
    ],
    
    tools: [
      {
        name: 'getCount',
        description: 'Get the current counter value',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'Pass true' },
          },
        },
        execute: async () => ({ count: countRef.current }),
      },
      {
        name: 'increment',
        description: 'Increase the counter by a specified amount',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: 'Amount to add' },
          },
          required: ['amount'],
        },
        execute: async ({ amount }: { amount: number }) => {
          setCount(prev => prev + amount);
          return { success: true, newValue: countRef.current + amount };
        },
      },
    ],
  }), []);

  return (
    <div>
      <h1>Count: {count}</h1>
      <BotDojoChat
        apiKey="your-api-key"
        modelContext={modelContext}
        mode="inline"
      />
    </div>
  );
}`}
          language="tsx"
          title="Complete counter example"
        />
      </div>

      {/* Key Points */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-green-50 rounded-xl border border-green-300">
        <h3 className="m-0 mb-4 text-sm md:text-base font-bold text-green-800">
          💡 Key Points
        </h3>
        <ul className="m-0 pl-5 text-green-700 text-sm leading-loose">
          <li>Use <code className="bg-white px-1 rounded">useRef</code> to access current state in tool execute functions</li>
          <li>Wrap <code className="bg-white px-1 rounded">modelContext</code> in <code className="bg-white px-1 rounded">useMemo</code> to prevent unnecessary re-renders</li>
          <li>Tools run entirely in your frontend - you control what actions are allowed</li>
          <li>Use <code className="bg-white px-1 rounded">_meta</code> to customize how tools appear in the chat UI</li>
        </ul>
      </div>

      {/* Try it Out */}
      <div className="p-4 md:p-6 bg-white rounded-xl border border-slate-200">
        <h3 className="m-0 mb-3 text-base md:text-lg font-bold text-slate-900">
          🚀 Try it Out
        </h3>
        <p className="m-0 mb-4 text-sm text-slate-500 leading-relaxed">
          See Frontend MCP in action with our interactive Task List example.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/examples/frontend-mcp/task-list"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 text-white rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            📋 Task List Example →
          </Link>
          <Link
            href="/examples/product-enhance"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-500 border border-indigo-500 rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            Product Enhancement Demo →
          </Link>
        </div>
      </div>
    </div>
  );
}

