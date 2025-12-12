import { BotDojoChat } from '@botdojo/chat-sdk';
import { useMemo, useState } from 'react';
import fs from 'fs';
import path from 'path';
import CodeSnippet from '@/components/CodeSnippet';

const config = {
  apiKey: process.env.NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API || '',
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};

const SDK_INSTALL_STEP = {
  title: 'Install the Chat SDK',
  why: 'Add the Chat SDK package to embed the widget in your app.',
  command: 'npm install @botdojo/chat-sdk',
};

const TEST_AGENT_STEPS = [
  {
    title: 'Install the CLI',
    why: 'Use the BotDojo CLI to authenticate, manage projects, and create API keys (it will prompt you to sign in or create an account).',
    command: 'npm install -g @botdojo/cli',
  },
  {
    title: 'Clone a test agent',
    why: 'Pull a basic agent with a web-search tool so you have a working flow to run.',
    command: 'botdojo cloneToProject botdojo.com/botdojo/sdk-test-flows/3112f8a1-c539-11f0-9a90-1dbafe764d7e --name "SDK - Basic Test Flow"',
  },
  {
    title: 'Create a public API key',
    why: 'Generate an API key for the sample flow to power the chat widget.',
    command: 'botdojo flow api_key create {Flow id} --name "SDK Playground Public API Key"',
  },
];

interface GettingStartedProps {
  exampleCode: string;
}

function CommandBlock({ label, command }: { label: string; command: string }) {
  return (
    <CodeSnippet title={label} language="bash" code={command} />
  );
}

function QuickStartCopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -g @botdojo/cli && botdojo playground');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-1.5 right-2 px-3 py-1.5 rounded-md font-sans text-xs font-semibold transition-all duration-200"
      style={{
        background: copied 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {copied ? '✓ Copied!' : 'Copy'}
    </button>
  );
}

export default function ChatSdkGettingStarted({ exampleCode }: GettingStartedProps) {
  const chatProps = useMemo(() => ({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    mode: 'inline' as const,
    accentColor: '#6366f1',
    theme: 'light' as const,
    newSession: false,
    sessionKeyPrefix: 'chat-sdk-getting-started',
    welcomeMessage: `## Welcome!

Ask me anything to get started.

<promptbutton label="Say Hello" body='{"text_input": "Hello!"}'></promptbutton>
`,
    hideBotIcon: true,
  }), []);

  const hasApiKey = Boolean(config.apiKey);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
          Getting Started
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#64748b', lineHeight: 1.7 }}>
          You can clone this playground website to experiment locally, or install the Chat SDK directly into your own app.
        </p>
      </div>

      {/* Quick Start - Run Playground Locally */}
      <div style={{
        marginBottom: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          🚀 Quick Start: Clone and Run Locally
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          The quickest way to experiment is to clone this playground website and run it on your computer. This gives you a local copy with all examples ready to explore:
        </p>
        <div 
          className="relative rounded-lg p-3 font-mono text-sm"
          style={{
            backgroundColor: 'white',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ paddingRight: '70px' }}>
            <span style={{ color: '#10b981', marginRight: '8px' }}>$</span>
            npm install -g @botdojo/cli && botdojo playground
          </div>
          <QuickStartCopyButton />
        </div>
        <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          This will install the BotDojo CLI and start the playground with all examples configured. Perfect for experimenting before integrating into your own app.
        </p>
      </div>

      {/* Install for Your Own App */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          Install in Your Own App
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          To integrate the Chat SDK into your own application, follow these steps to install the package, clone a sample agent, and create an API key.
        </p>
        
        {/* Install SDK */}
        <div style={{
          marginBottom: '16px',
          padding: '20px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
            1. Install the SDK
          </h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>
            {SDK_INSTALL_STEP.why}
          </p>
          <CommandBlock label={SDK_INSTALL_STEP.title} command={SDK_INSTALL_STEP.command} />
        </div>

        {/* Clone Test Agent Steps */}
        <div style={{
          padding: '20px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
            2. Clone a test agent and create an API key
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b' }}>
            Use the BotDojo CLI to pull a sample agent and generate a key you can drop into the widget.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {TEST_AGENT_STEPS.map((step, idx) => (
              <div key={idx}>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#475569' }}>
                  <strong style={{ color: '#0f172a' }}>{step.title}:</strong> {step.why}
                </div>
                <CommandBlock label={step.title} command={step.command} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Chat Demo */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          Try It Out
        </h2>
        
        <div style={{
          height: '500px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          background: 'white',
        }}>
          {hasApiKey ? (
            <BotDojoChat {...chatProps} />
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              background: '#fef2f2',
            }}>
              <div style={{ textAlign: 'center', color: '#991b1b' }}>
                <p style={{ fontWeight: 600, marginBottom: '8px' }}>Missing API key</p>
                <p style={{ fontSize: '14px' }}>
                  Run <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>pnpm setup-playground</code> or 
                  set <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API</code> to try the chat.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Source Code */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          Example Code
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b' }}>
          Here's the minimal code needed to embed a BotDojo chat widget:
        </p>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px' }}>
            <CodeSnippet 
              code={exampleCode} 
              language="tsx" 
              title="SimpleChatExample.tsx"
            />
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{ 
        padding: '20px', 
        background: 'white', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
        marginBottom: '32px',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Next Steps
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b' }}>
          Explore more examples to learn about Frontend MCP, MCP Apps, and building custom chat UIs.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href="/examples/frontend-mcp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#6366f1',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Learn Frontend MCP →
          </a>
          <a
            href="/examples/mcp-apps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'white',
              color: '#6366f1',
              border: '1px solid #6366f1',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Explore MCP Apps →
          </a>
          <a
            href="/examples/basic"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'white',
              color: '#6366f1',
              border: '1px solid #6366f1',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Customize Chat UI →
          </a>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const samplesDir = path.join(process.cwd(), 'samples');
  const exampleCode = fs.readFileSync(path.join(samplesDir, 'simple-chat-example.tsx'), 'utf-8');
  
  return {
    props: {
      exampleCode,
    },
  };
}
