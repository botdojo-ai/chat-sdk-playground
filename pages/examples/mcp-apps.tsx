import React from 'react';
import Link from 'next/link';

const codeBlock = (code: string) => (
  <pre className="whitespace-pre-wrap text-sm bg-slate-900 text-slate-50 rounded-md p-4 overflow-auto border border-slate-800">
    {code}
  </pre>
);

const resourceExample = `// UI resource declaration (resources/list) and content (resources/read)
const uiResource = {
  uri: 'ui://weather/dashboard',
  name: 'Weather Dashboard',
  description: 'Interactive weather dashboard',
  mimeType: 'text/html+mcp',
  _meta: {
    ui: {
      csp: {
        connectDomains: ['https://api.openweathermap.org'],
        resourceDomains: ['https://cdn.jsdelivr.net'],
      },
      prefersBorder: true,
    },
  },
};

// resources/read must return the HTML content
{
  contents: [{
    uri: 'ui://weather/dashboard',
    mimeType: 'text/html+mcp',
    text: '<!DOCTYPE html><html>...</html>',
  }]
}`;

const toolMetadataExample = `// Tool advertised with UI attachment
{
  name: 'get_weather',
  description: 'Get current weather',
  inputSchema: {
    type: 'object',
    properties: {
      location: { type: 'string' },
    },
    required: ['location'],
  },
  _meta: {
    ui: {
      resourceUri: 'ui://weather/dashboard',
    },
  },
}`;

const iframeHandshakeExample = `// Inside your UI (HTML served for ui://...)
let nextId = 1;
const sendRequest = (method, params) => {
  const id = nextId++;
  parent.postMessage({ jsonrpc: '2.0', id, method, params }, '*');
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      if (event.data?.id === id) {
        window.removeEventListener('message', handler);
        if ('result' in event.data) resolve(event.data.result);
        else reject(event.data.error);
      }
    };
    window.addEventListener('message', handler);
  });
};

const sendNotification = (method, params) => {
  parent.postMessage({ jsonrpc: '2.0', method, params }, '*');
};

const initialize = async () => {
  const initResult = await sendRequest('ui/initialize', {
    protocolVersion: '2025-06-18',
    capabilities: { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html+mcp'] } } },
    clientInfo: { name: 'weather-ui', version: '1.0.0' },
  });
  sendNotification('ui/notifications/initialized', { hostInfo: initResult.hostInfo });

  window.addEventListener('message', (event) => {
    if (event.data?.method === 'ui/notifications/tool-input') {
      render(event.data.params.arguments);
    }
    if (event.data?.method === 'ui/notifications/tool-input-partial') {
      renderPreview(event.data.params.arguments);
    }
    if (event.data?.method === 'ui/notifications/tool-result') {
      updateResult(event.data.params);
    }
    if (event.data?.method === 'ui/resource-teardown') {
      cleanup();
    }
  });

  // Notify host when your layout size changes
  const ro = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    sendNotification('ui/size-change', { width, height });
  });
  ro.observe(document.body);
};

initialize();`;

export default function McpAppsPage() {
  return (
    <div className="mx-auto max-w-5xl py-12 px-6 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <span>📚</span> Frontend MCP Overview
        </h1>
        <p className="text-sm text-indigo-600 font-medium">
          Define MCP tools/resources in your frontend • Works with any agent provider • Open source pattern
        </p>
        <p className="text-slate-600 text-lg">
          Frontend MCP — Embed MCP Apps in your product surface for interactive, UI-aware agents. Define Model Context in your frontend, expose UI actions as tools, share what the user sees, and render MCP App widgets inline.
        </p>
        <p className="text-slate-600">
          Frontend MCP builds on the MCP Apps spec: it keeps <code className="bg-slate-100 px-1 rounded">ui://</code> resources and JSON-RPC messaging, while emphasizing UI-first actions and state flowing from your client.
        </p>
        
        {/* Spec Link Card */}
        <a 
          href="https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/draft/apps.mdx"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <div className="font-semibold text-indigo-900">SEP-1865: MCP Apps Specification</div>
              <div className="text-sm text-indigo-700">Read the official draft specification on GitHub →</div>
            </div>
          </div>
        </a>
      </div>

      {/* Terminology */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Terminology</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left p-3 font-semibold text-slate-900 border border-slate-200">Term</th>
                <th className="text-left p-3 font-semibold text-slate-900 border border-slate-200">What It Is</th>
                <th className="text-left p-3 font-semibold text-slate-900 border border-slate-200">Who Defined It</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr>
                <td className="p-3 border border-slate-200 font-medium">MCP</td>
                <td className="p-3 border border-slate-200">Model Context Protocol — standard for how agents interact with systems (tools, resources, prompts)</td>
                <td className="p-3 border border-slate-200">Anthropic/Community</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-3 border border-slate-200 font-medium">MCP Apps</td>
                <td className="p-3 border border-slate-200">Extension spec for rendering interactive HTML UIs in agent responses (SEP-1865)</td>
                <td className="p-3 border border-slate-200">Community</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200 font-medium">Frontend MCP</td>
                <td className="p-3 border border-slate-200">Open-source pattern for defining MCP servers in your UI layer — exposes frontend state/actions to agents</td>
                <td className="p-3 border border-slate-200">BotDojo (OSS)</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-3 border border-slate-200 font-medium"><code className="bg-slate-200 px-1 rounded text-xs">modelContext</code></td>
                <td className="p-3 border border-slate-200">The SDK prop where you define your Frontend MCP — tools your frontend provides, resources it exposes</td>
                <td className="p-3 border border-slate-200">BotDojo SDK</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Key concepts</h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-700">
          <li>Extension identifier: <code className="bg-slate-100 px-1 rounded">io.modelcontextprotocol/ui</code>; negotiate support in <code className="bg-slate-100 px-1 rounded">initialize</code> via <code className="bg-slate-100 px-1 rounded">capabilities.extensions</code>.</li>
          <li>UI resources use the <code className="bg-slate-100 px-1 rounded">ui://</code> scheme and MIME type <code className="bg-slate-100 px-1 rounded">text/html+mcp</code>; content is served through <code className="bg-slate-100 px-1 rounded">resources/read</code>.</li>
          <li>Tools reference UI via <code className="bg-slate-100 px-1 rounded">_meta['ui/resourceUri']</code>; hosts render that resource when MCP Apps is available and fall back to text otherwise.</li>
          <li>Communication is JSON-RPC 2.0 over <code className="bg-slate-100 px-1 rounded">postMessage</code> between the iframe and host.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Declare a UI resource</h2>
        {codeBlock(resourceExample)}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Attach UI to a tool</h2>
        {codeBlock(toolMetadataExample)}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">UI iframe handshake & messaging</h2>
        <p className="text-slate-700">
          UI iframes communicate via <code className="bg-slate-100 px-1 rounded">postMessage</code>. Initialize, confirm with <code className="bg-slate-100 px-1 rounded">ui/notifications/initialized</code>, listen for tool input/results, and report size changes.
        </p>
        {codeBlock(iframeHandshakeExample)}
      </section>

      {/* Try it section */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Try it out</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link 
            href="/examples/chat-sdk/document-edit" 
            className="block p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <div className="font-semibold text-slate-900">Edit Document</div>
                <div className="text-sm text-slate-600">Frontend MCP that lets the agent modify a markdown editor</div>
              </div>
            </div>
          </Link>
          <Link 
            href="/examples/chat-sdk/mcp-app-example" 
            className="block p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧩</span>
              <div>
                <div className="font-semibold text-slate-900">MCP App Example</div>
                <div className="text-sm text-slate-600">Exercise all MCP-UI actions with the Event Monitor</div>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
