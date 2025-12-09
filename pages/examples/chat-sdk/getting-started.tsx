import { BotDojoChat } from '@botdojo/chat-sdk';
import { useMemo, useState } from 'react';
import CodeSnippet from '@/components/CodeSnippet';
import { Tabs } from '@/components/Tabs';
import ChatExampleShell from '@/components/layout/ChatExampleShell';

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

const CODE_SAMPLE = `import { BotDojoChat } from '@botdojo/chat-sdk';

export default function MyChat() {
  return (
    <BotDojoChat
      apiKey={process.env.NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API || ''}
      mode="inline"
      accentColor="#5d5fef"
      theme="light"
    />
  );
}`;

function CommandBlock({ label, command }: { label: string; command: string }) {
  return (
    <CodeSnippet title={label} language="bash" code={command} />
  );
}

export default function ChatSdkGettingStarted() {
  const [activeTab, setActiveTab] = useState<'chat' | 'code'>('code');

  const chatProps = useMemo(() => ({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    mode: 'inline' as const,
    accentColor: '#5d5fef',
    theme: 'light' as const,
    newSession: false,
    sessionKeyPrefix: 'chat-sdk-getting-started',
    welcomeMessage: `## Welcome to the Chat SDK Getting Started example.

<promptbutton label="Say Hello" body='{"text_input": "Hello"}'></promptbutton>
`,
    hideBotIcon: true,
  }), []);

  const hasApiKey = Boolean(config.apiKey);

  const rightPane = hasApiKey ? (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="mb-1">
        <Tabs
          tabs={[
            { id: 'code', label: 'Code' },
            { id: 'chat', label: 'Chat' },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as 'chat' | 'code')}
        />
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {activeTab === 'chat' ? (
          <div className="h-full bg-white">
            <BotDojoChat {...chatProps} />
          </div>
        ) : (
          <div className="h-full overflow-auto bg-slate-50 p-3">
            <CodeSnippet code={CODE_SAMPLE} title="Widget example" language="tsx" fullHeight />
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex h-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
      <div className="space-y-2 text-center">
        <p className="font-semibold">Missing API key</p>
        <p>Run <code className="rounded bg-white px-1 py-0.5 text-xs text-red-700">pnpm setup-playground</code> or set <code className="rounded bg-white px-1 py-0.5 text-xs text-red-700">NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API</code> to try the chat.</p>
      </div>
    </div>
  );

  return (
    <ChatExampleShell
      title="Getting Started"
      description="Install the Chat SDK, clone a sample agent, and drop your public API key into the widget."
      left={
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Embed the widget in minutes</h2>
            <p className="mt-2 text-sm text-slate-600">
              Install the package, clone the test agent with the CLI, and use the generated API key to power the inline chat.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Install the SDK</h3>
            <p className="mt-2 text-sm text-slate-600">{SDK_INSTALL_STEP.why}</p>
            <div className="mt-4">
              <CommandBlock label={SDK_INSTALL_STEP.title} command={SDK_INSTALL_STEP.command} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Clone a test agent</h3>
            <p className="mt-2 text-sm text-slate-600">
              Use the BotDojo CLI to pull a sample agent and generate a key you can drop into the widget.
            </p>
            <div className="mt-4 space-y-4">
              {TEST_AGENT_STEPS.map((step, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="text-sm text-slate-700">
                    <strong className="text-slate-900">{step.title}:</strong> {step.why}
                  </div>
                  <CommandBlock label={step.title} command={step.command} />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      right={
        <div id="chat-sdk-getting-started-chat" className="h-full min-h-[600px]">
          {rightPane}
        </div>
      }
      rightClassName="overflow-hidden"
    />
  );
}
