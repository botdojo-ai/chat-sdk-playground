import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';

export default function FrontendMcpIntroPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
          Frontend MCP
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#64748b', lineHeight: 1.7 }}>
          Turn your frontend into a secure MCP server. Give AI agents visibility into what users see 
          and the ability to take actions on their behalf.
        </p>
      </div>

      {/* What is Frontend MCP */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
        border: '1px solid #c7d2fe',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#3730a3' }}>
          What is Frontend MCP?
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#4338ca', lineHeight: 1.7 }}>
          <strong>MCP (Model Context Protocol)</strong> is a standard for connecting AI agents to external data and tools.
          Frontend MCP lets you run an MCP-like server directly in the browser, giving agents secure access to your UI state.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>👁️</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#3730a3' }}>Resources</div>
            <div style={{ fontSize: '11px', color: '#6366f1' }}>What the agent can see</div>
          </div>
          <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>🔧</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#3730a3' }}>Tools</div>
            <div style={{ fontSize: '11px', color: '#6366f1' }}>What the agent can do</div>
          </div>
          <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>🔒</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#3730a3' }}>Security</div>
            <div style={{ fontSize: '11px', color: '#6366f1' }}>You control access</div>
          </div>
        </div>
      </div>

      {/* ModelContext Basics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          Defining a ModelContext
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          A <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ModelContext</code> defines 
          what the AI agent can see (resources) and do (tools) in your application.
        </p>
        
        <CodeSnippet
          code={`import { useMemo } from 'react';
import { BotDojoChat, type ModelContext } from '@botdojo/chat-sdk';

function MyComponent() {
  // Define your ModelContext
  const modelContext: ModelContext = useMemo(() => ({
    name: 'my_app',
    description: 'Frontend MCP for my application',
    toolPrefix: 'app',
    uri: 'app://context',
    resourceUri: 'app://context',
    
    resources: [
      // Resources define what the agent can "see"
    ],
    
    tools: [
      // Tools define what the agent can "do"
    ],
  }), []);

  return (
    <BotDojoChat
      apiKey="your-api-key"
      modelContext={modelContext}
      mode="inline"
    />
  );
}`}
          language="tsx"
          title="Basic ModelContext structure"
        />
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
    resourceUri: 'counter://context',
    
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
      <div style={{ 
        marginBottom: '32px',
        padding: '20px',
        background: '#f0fdf4',
        borderRadius: '12px',
        border: '1px solid #86efac',
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#166534' }}>
          💡 Key Points
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d', fontSize: '14px', lineHeight: 1.8 }}>
          <li>Use <code style={{ background: 'white', padding: '1px 4px', borderRadius: '3px' }}>useRef</code> to access current state in tool execute functions</li>
          <li>Wrap <code style={{ background: 'white', padding: '1px 4px', borderRadius: '3px' }}>modelContext</code> in <code style={{ background: 'white', padding: '1px 4px', borderRadius: '3px' }}>useMemo</code> to prevent unnecessary re-renders</li>
          <li>Tools run entirely in your frontend - you control what actions are allowed</li>
          <li>Use <code style={{ background: 'white', padding: '1px 4px', borderRadius: '3px' }}>_meta</code> to customize how tools appear in the chat UI</li>
        </ul>
      </div>

      {/* Try it Out */}
      <div style={{ 
        padding: '24px', 
        background: 'white', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          🚀 Try it Out
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          See Frontend MCP in action with our interactive Task List example.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href="/examples/frontend-mcp/task-list"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 20px',
              background: '#6366f1',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            📋 Task List Example →
          </Link>
          <Link
            href="/examples/product-enhance"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 20px',
              background: 'white',
              color: '#6366f1',
              border: '1px solid #6366f1',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Product Enhancement Demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
