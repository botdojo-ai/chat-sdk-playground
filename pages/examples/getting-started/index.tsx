import { BotDojoChat, type ModelContext } from '@botdojo/chat-sdk';
import { useMemo, useState } from 'react';
import fs from 'fs';
import path from 'path';
import CodeSnippet from '@/components/CodeSnippet';
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

const config = {

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
    why: 'Pull an agent that supports Frontend MCP so you can use frontend tools.',
    command: 'botdojo cloneToProject botdojo.com/botdojo/sdk-test-flows/3112f8a1-c539-11f0-9a90-1dbafe764d7e --name "SDK - Model Context Flow"',
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
  // Get temporary JWT token for secure API access
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();

  // Define a simple ModelContext with a tool to get the user's browser
  const modelContext: ModelContext = useMemo(() => ({
    name: 'browser_info',
    description: 'Frontend MCP that provides browser information',
    toolPrefix: 'browser',
    uri: 'browser://context',
    
    tools: [
      {
        name: 'get_browser_info',
        description: 'Get information about the user\'s browser including name, version, and platform',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'Pass true to get browser info' },
          },
        },
        execute: async () => {
          const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown';
          const platform = typeof window !== 'undefined' ? window.navigator.platform : 'Unknown';
          
          // Parse browser name and version from userAgent
          let browserName = 'Unknown';
          let browserVersion = 'Unknown';
          
          if (userAgent.includes('Firefox')) {
            browserName = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+(\.\d+)?)/);
            browserVersion = match ? match[1] : 'Unknown';
          } else if (userAgent.includes('Edg')) {
            browserName = 'Microsoft Edge';
            const match = userAgent.match(/Edg\/(\d+(\.\d+)?)/);
            browserVersion = match ? match[1] : 'Unknown';
          } else if (userAgent.includes('Chrome')) {
            browserName = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+(\.\d+)?)/);
            browserVersion = match ? match[1] : 'Unknown';
          } else if (userAgent.includes('Safari')) {
            browserName = 'Safari';
            const match = userAgent.match(/Version\/(\d+(\.\d+)?)/);
            browserVersion = match ? match[1] : 'Unknown';
          }
          
          return {
            browser: browserName,
            version: browserVersion,
            platform: platform,
            userAgent: userAgent,
          };
        },
        _meta: {
          'botdojo/display-name': 'Get Browser Info',
        },
      },
    ],
    
    resources: [],
    prompts: [],
  }), []);

  const chatProps = useMemo(() => ({
    apiKey: token || '',
    baseUrl: config.baseUrl,
    mode: 'inline' as const,
    autoFocus: false,
    accentColor: '#6366f1',
    theme: 'light' as const,
    newSession: false,
    sessionKeyPrefix: 'chat-sdk-getting-started',
    modelContext: modelContext,
    welcomeMessage: `## Welcome!

What kind of browser do I have?

<promptbutton label="🌐 Check My Browser" body='{"text_input": "What kind of browser am I using?"}'></promptbutton>
`,
    hideBotIcon: true,
  }), [modelContext, token]);

  const hasApiKey = Boolean(token) && !tokenLoading;

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-5 md:mb-8">
        <h1 className="m-0 text-xl md:text-[28px] font-bold text-slate-900">
          Getting Started
        </h1>
        <p className="mt-2 text-sm md:text-[15px] text-slate-500 leading-relaxed">
          You can clone this playground website to experiment locally, or install the Chat SDK directly into your own app.
        </p>
      </div>

      {/* Quick Start - Run Playground Locally */}
      <div 
        className="mb-5 md:mb-8 p-4 md:p-6 rounded-xl border border-indigo-200/50"
        style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)' }}
      >
        <h2 className="m-0 mb-2 text-lg md:text-xl font-bold text-slate-900">
          🚀 Quick Start: Clone and Run Locally
        </h2>
        <p className="m-0 mb-4 text-sm text-slate-500 leading-relaxed">
          The quickest way to experiment is to clone this playground website and run it on your computer. This gives you a local copy with all examples ready to explore:
        </p>
        <div className="relative rounded-lg p-3 font-mono text-xs md:text-sm bg-white border border-slate-200 text-slate-900 overflow-x-auto">
          <div className="pr-16 md:pr-20 whitespace-nowrap">
            <span className="text-emerald-500 mr-2">$</span>
            npm install -g @botdojo/cli && botdojo playground
          </div>
          <QuickStartCopyButton />
        </div>
        <p className="mt-3 text-xs md:text-sm text-slate-500">
          This will install the BotDojo CLI and start the playground with all examples configured. Perfect for experimenting before integrating into your own app.
        </p>
      </div>

      {/* Install for Your Own App */}
      <div className="mb-5 md:mb-8">
        <h2 className="m-0 mb-3 md:mb-4 text-lg md:text-xl font-bold text-slate-900">
          Install in Your Own App
        </h2>
        <p className="m-0 mb-4 md:mb-5 text-sm text-slate-500 leading-relaxed">
          To integrate the Chat SDK into your own application, follow these steps to install the package, clone a sample agent, and create an API key.
        </p>
        
        {/* Install SDK */}
        <div className="mb-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
          <h3 className="m-0 mb-2 text-sm md:text-base font-semibold text-slate-900">
            1. Install the SDK
          </h3>
          <p className="m-0 mb-3 text-sm text-slate-500">
            {SDK_INSTALL_STEP.why}
          </p>
          <CommandBlock label={SDK_INSTALL_STEP.title} command={SDK_INSTALL_STEP.command} />
        </div>

        {/* Clone Test Agent Steps */}
        <div className="p-4 md:p-5 bg-white rounded-xl border border-slate-200">
          <h3 className="m-0 mb-3 md:mb-4 text-sm md:text-base font-semibold text-slate-900">
            2. Clone a test agent and create an API key
          </h3>
          <p className="m-0 mb-4 text-sm text-slate-500">
            Use the BotDojo CLI to pull a sample agent and generate a key you can drop into the widget.
          </p>
          <div className="flex flex-col gap-4">
            {TEST_AGENT_STEPS.map((step, idx) => (
              <div key={idx}>
                <div className="mb-2 text-sm text-slate-600">
                  <strong className="text-slate-900">{step.title}:</strong> {step.why}
                </div>
                <CommandBlock label={step.title} command={step.command} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source Code */}
      <div className="mb-5 md:mb-8">
        <h2 className="m-0 mb-3 md:mb-4 text-lg md:text-xl font-bold text-slate-900">
          Example Code
        </h2>
        <p className="m-0 mb-4 text-sm text-slate-500">
          Here's an example showing how to embed a BotDojo chat widget with a <strong>Frontend MCP</strong> that provides browser information:
        </p>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 md:p-4">
            <CodeSnippet 
              code={exampleCode} 
              language="tsx" 
              title="BrowserInfoChat.tsx"
            />
          </div>
        </div>
      </div>

      {/* Live Chat Demo */}
      <div className="mb-5 md:mb-8">
        <h2 className="m-0 mb-3 md:mb-4 text-lg md:text-xl font-bold text-slate-900">
          Try It Out
        </h2>
        
        <div className="h-[400px] md:h-[500px] rounded-xl border border-slate-200 overflow-hidden bg-white">
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
                  set <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>BOTDOJO_MODEL_CONTEXT_API</code> to try the chat.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-4 md:p-5 bg-white rounded-xl border border-slate-200 mb-5 md:mb-8">
        <h3 className="m-0 mb-3 text-sm md:text-base font-bold text-slate-900">
          Next Steps
        </h3>
        <p className="m-0 mb-4 text-sm text-slate-500">
          Explore more examples to learn about headless chat integration and Frontend MCP tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/examples/headless-chat"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            Headless Chat →
          </a>
          <a
            href="/examples/frontend-mcp"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-indigo-500 border border-indigo-500 rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            Frontend MCP →
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
