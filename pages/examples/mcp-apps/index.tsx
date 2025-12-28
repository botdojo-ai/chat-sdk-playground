import Link from 'next/link';
import AgentUIAnimation from '@/components/AgentUIAnimation';
import CodeSnippet from '@/components/CodeSnippet';

export default function McpAppsPage() {
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="m-0 mb-3 text-3xl md:text-4xl font-bold text-slate-900">
          What Are MCP Apps?
        </h1>
        <p className="m-0 text-base md:text-lg text-slate-600 leading-relaxed max-w-[900px]">
          MCP Apps are <strong>interactive UI components</strong> that render inside chat conversations—think of them as
          "widgets in chat" that can display rich interfaces, handle user interactions, and communicate with your agent.
        </p>
      </div>

      {/* Animation Demo */}
      <div className="mb-12">
        <AgentUIAnimation maxWidth="100%" showProgress={true} />
      </div>

      {/* What Makes MCP Apps Special */}
      <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <h2 className="m-0 mb-4 text-xl font-bold text-slate-900">
          Why MCP Apps?
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="m-0 mb-2 text-sm font-bold text-slate-900">Rich Interfaces</h3>
            <p className="m-0 text-xs text-slate-600 leading-relaxed">
              Show data visualizations, interactive forms, product cards, document editors—anything HTML can do.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="m-0 mb-2 text-sm font-bold text-slate-900">Two-Way Communication</h3>
            <p className="m-0 text-xs text-slate-600 leading-relaxed">
              Apps can send messages, call tools, and persist state. Agents can stream updates and results back.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="m-0 mb-2 text-sm font-bold text-slate-900">Secure & Sandboxed</h3>
            <p className="m-0 text-xs text-slate-600 leading-relaxed">
              Runs in isolated iframe with CSP enforcement, protecting your app from malicious content.
            </p>
          </div>
        </div>
      </div>

      {/* Standard Specification */}
      <div className="mb-8 p-6 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-3 text-xl font-bold text-slate-900">
          Built on Open Standards
        </h2>
        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          MCP Apps are defined by <strong>SEP-1865</strong>, part of the <strong>Model Context Protocol (MCP)</strong> specification.
          This ensures compatibility across different MCP-enabled hosts and clients.
        </p>
        <div className="flex gap-3">
          <a
            href="https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 text-white rounded-md no-underline font-semibold text-sm"
          >
            📄 View SEP-1865 Specification →
          </a>
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-indigo-500 border border-indigo-500 rounded-md no-underline font-semibold text-sm"
          >
            Learn About MCP
          </a>
        </div>
      </div>

      {/* How to Define MCP Apps */}
      <div className="mb-8 p-6 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-xl font-bold text-slate-900">
          How to Define MCP Apps
        </h2>

        <h3 className="m-0 mb-3 text-base font-semibold text-slate-900">
          1. Add UI Metadata to Your Tool
        </h3>
        <p className="m-0 mb-3 text-sm text-slate-600 leading-relaxed">
          Tools can reference an MCP App by adding <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">_meta.ui</code> metadata.
          This tells the host which UI resource to render when the tool is called.
        </p>
        <div className="mb-6">
          <CodeSnippet
            language="typescript"
            title="Example: Tool with UI Metadata"
            code={`{
  name: 'show_product_card',
  description: 'Display interactive product card',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number' }
    }
  },
  _meta: {  // From MCP spec (SEP-1865)
    ui: {
      resourceUri: 'ui://my-app/product-card',  // Which UI to render
      preferredFrameSize: { width: 600, height: 400 },
      csp: {
        connectDomains: ['https://api.example.com'],  // Allowed API calls
        resourceDomains: ['https://cdn.example.com']   // Allowed images/fonts
      }
    }
  },
  execute: async (args) => {
    return [{ type: 'text', text: 'Product card displayed' }];
  }
}`}
          />
        </div>

        <h3 className="m-0 mb-3 text-base font-semibold text-slate-900">
          2. Provide the UI Resource
        </h3>
        <p className="m-0 mb-3 text-sm text-slate-600 leading-relaxed">
          Add a resource with matching URI that returns HTML content. The MIME type must be <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">text/html;profile=mcp-app</code>.
        </p>
        <div className="mb-6">
          <CodeSnippet
            language="typescript"
            title="Example: UI Resource"
            code={`resources: [
  {
    uri: 'ui://my-app/product-card',  // Must match tool's resourceUri
    name: 'Product Card Widget',
    mimeType: 'text/html;profile=mcp-app',  // Required for MCP Apps
    getContent: async () => {
      // In this playground, we use Next.js to bundle React components:
      const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
      const html = await fetchMcpAppHtml('product-card-app');

      return {
        uri: 'ui://my-app/product-card',
        mimeType: 'text/html;profile=mcp-app',
        text: html  // Your HTML as a string
      };
    }
  }
]`}
          />
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="m-0 text-xs text-amber-900 leading-relaxed">
            <strong>💡 Tip:</strong> You can deliver MCP Apps as <strong>inline HTML</strong> (bundled string) or
            <strong> remote HTTPS URL</strong>. See <Link href="/examples/mcp-apps/inline-vs-remote" className="text-indigo-600 underline">Inline vs Remote guide</Link> for details.
          </p>
        </div>
      </div>

      {/* Building MCP Apps */}
      <div className="mb-8 p-6 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-xl font-bold text-slate-900">
          Building MCP Apps with useMcpApp Hook
        </h2>

        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          The <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">useMcpApp</code> hook from{' '}
          <a href="https://github.com/botdojo-ai/mcp-app-view" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
            mcp-app-view
          </a>{' '}
          (open source) handles the MCP protocol communication, making it easy to build interactive widgets.
        </p>

        <div className="mb-4">
          <CodeSnippet
            language="typescript"
            title="Example: Product Card Widget"
            code={`import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

function ProductCardWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isInitialized,    // true after handshake with host
    tool,             // { arguments, status, result }
    hostContext,      // { state, theme, viewport }
    sendMessage,      // Send messages to chat
    callTool,         // Call other tools locally
    openLink,         // Request to open URLs
  } = useMcpApp({
    containerRef,
    autoReportSize: true,  // Auto-report iframe height changes
  });

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  const { productId, name, price } = tool.arguments || {};

  return (
    <div ref={containerRef} className="p-6">
      <h2>{name}</h2>
      <p>Price: \${price}</p>
      <button onClick={() => sendMessage([
        { type: 'text', text: \`User clicked on product \${productId}\` }
      ])}>
        Add to Cart
      </button>
    </div>
  );
}`}
          />
        </div>

        <div className="flex gap-3">
          <Link
            href="/examples/mcp-apps/use-mcp-app-guide"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 text-white rounded-md no-underline font-semibold text-sm"
          >
            📚 useMcpApp Hook Guide →
          </Link>
          <a
            href="https://github.com/botdojo-ai/mcp-app-view"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-md no-underline font-semibold text-sm"
          >
            ⭐ View on GitHub
          </a>
        </div>
      </div>

      {/* Proxy Server */}
      <div className="mb-8 p-6 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-xl font-bold text-slate-900">
          Secure Hosting with MCP App Proxy
        </h2>

        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          For security, MCP Apps must run in a <strong>sandboxed iframe</strong> with a different origin than your host app.
          BotDojo provides an open-source proxy server that implements the double-iframe architecture required by SEP-1865.
        </p>

        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🌐</span>
            <h3 className="m-0 text-sm font-bold text-slate-900">Public Proxy Instance</h3>
          </div>
          <code className="block p-2 bg-slate-900 text-slate-100 rounded text-xs">
            https://mcp-app-proxy.botdojo.com/
          </code>
        </div>

        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⭐</span>
            <h3 className="m-0 text-sm font-bold text-slate-900">Open Source Repository</h3>
          </div>
          <a
            href="https://github.com/botdojo-ai/mcp-app-proxy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 text-xs underline"
          >
            https://github.com/botdojo-ai/mcp-app-proxy
          </a>
        </div>

        <h3 className="m-0 mb-3 text-base font-semibold text-slate-900">
          How the Proxy Works
        </h3>

        {/* Visual Proxy Architecture */}
        <div className="mb-4 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-slate-300">
          <div className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Host (Your App)</div>
          <div className="mb-1 text-xs text-slate-500">origin: https://app.example.com</div>

          <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300 shadow-sm">
            <div className="mb-2 text-xs font-semibold text-purple-700 uppercase tracking-wide">Outer Iframe (Proxy)</div>
            <div className="mb-1 text-xs text-purple-600">origin: https://mcp-app-proxy.com</div>

            <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border-2 border-indigo-400 shadow-sm">
              <div className="mb-2 text-xs font-semibold text-indigo-700 uppercase tracking-wide">Inner Iframe (Your MCP App)</div>
              <div className="text-xs text-indigo-600 space-y-1">
                <div>srcdoc: &lt;HTML with CSP&gt;</div>
                <div>sandbox: allow-scripts allow-same-origin</div>
              </div>
              <div className="mt-3 p-3 bg-white rounded border border-indigo-300 text-center">
                <div className="text-xs font-medium text-indigo-900">🎨 Your widget runs here</div>
              </div>
            </div>
          </div>
        </div>

        <p className="m-0 mb-4 text-xs text-slate-600 leading-relaxed">
          The different origin prevents MCP Apps from accessing your host app's cookies, localStorage, or making authenticated requests.
          The proxy forwards all JSON-RPC messages transparently while enforcing Content Security Policy.
        </p>

        <div className="flex gap-3">
          <a
            href="https://github.com/botdojo-ai/mcp-app-proxy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 text-white rounded-md no-underline font-semibold text-sm"
          >
            📖 Proxy Documentation →
          </a>
          <Link
            href="/examples/mcp-apps/inline-vs-remote"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-md no-underline font-semibold text-sm"
          >
            Learn About Deployment
          </Link>
        </div>
      </div>

      {/* Quick Start Checklist */}
      <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <h2 className="m-0 mb-4 text-xl font-bold text-slate-900">
          ✅ Implementation Checklist
        </h2>
        <ol className="m-0 pl-5 space-y-2 text-sm text-slate-700">
          <li>
            <strong>Define tool with UI metadata:</strong> Add <code className="bg-white px-1.5 py-0.5 rounded text-xs">_meta.ui.resourceUri</code> to your tool
          </li>
          <li>
            <strong>Provide UI resource:</strong> Add resource with MIME type <code className="bg-white px-1.5 py-0.5 rounded text-xs">text/html;profile=mcp-app</code>
          </li>
          <li>
            <strong>Build your widget:</strong> Use <code className="bg-white px-1.5 py-0.5 rounded text-xs">useMcpApp</code> hook from mcp-app-view
          </li>
          <li>
            <strong>Handle callbacks:</strong> Implement <code className="bg-white px-1.5 py-0.5 rounded text-xs">onToolCall</code>, <code className="bg-white px-1.5 py-0.5 rounded text-xs">onUiMessage</code>, <code className="bg-white px-1.5 py-0.5 rounded text-xs">onOpenLink</code> in your host
          </li>
          <li>
            <strong>Set cache key:</strong> Provide <code className="bg-white px-1.5 py-0.5 rounded text-xs">cacheKey</code> prop for optimal performance
          </li>
        </ol>
      </div>

      {/* Examples */}
      <div className="mb-8 p-6 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-xl font-bold text-slate-900">
          📚 Examples & Guides
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/examples/mcp-app-example"
            className="block p-4 bg-slate-50 border border-slate-200 rounded-lg no-underline hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚡</span>
              <h3 className="m-0 text-sm font-bold text-slate-900">Tool Progress Example</h3>
            </div>
            <p className="m-0 text-xs text-slate-600">
              Streaming progress updates, state persistence, and tool interactions
            </p>
          </Link>

          <Link
            href="/examples/product-enhance"
            className="block p-4 bg-slate-50 border border-slate-200 rounded-lg no-underline hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">✨</span>
              <h3 className="m-0 text-sm font-bold text-slate-900">Product Enhancement</h3>
            </div>
            <p className="m-0 text-xs text-slate-600">
              Real-world example with side-by-side comparison UI
            </p>
          </Link>

          <Link
            href="/examples/bonsai-shop"
            className="block p-4 bg-slate-50 border border-slate-200 rounded-lg no-underline hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🛍️</span>
              <h3 className="m-0 text-sm font-bold text-slate-900">Bonsai Shop Demo</h3>
            </div>
            <p className="m-0 text-xs text-slate-600">
              Full e-commerce demo with product browsing and cart
            </p>
          </Link>

          <Link
            href="/examples/mcp-apps/use-mcp-app-guide"
            className="block p-4 bg-slate-50 border border-slate-200 rounded-lg no-underline hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📖</span>
              <h3 className="m-0 text-sm font-bold text-slate-900">useMcpApp Hook Guide</h3>
            </div>
            <p className="m-0 text-xs text-slate-600">
              Complete reference for building MCP App widgets
            </p>
          </Link>
        </div>
      </div>

      {/* Advanced Topics */}
      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-xl font-bold text-slate-900">
          🚀 Advanced Topics
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/examples/mcp-apps/inline-vs-remote"
            className="block p-4 bg-white border border-slate-200 rounded-lg no-underline hover:border-indigo-300 transition-colors"
          >
            <h3 className="m-0 mb-1 text-sm font-bold text-slate-900">Inline vs Remote Deployment</h3>
            <p className="m-0 text-xs text-slate-600">
              Learn about bundled HTML vs hosted URLs
            </p>
          </Link>

          <Link
            href="/examples/headless-mcp"
            className="block p-4 bg-white border border-slate-200 rounded-lg no-underline hover:border-indigo-300 transition-colors"
          >
            <h3 className="m-0 mb-1 text-sm font-bold text-slate-900">Headless Mode</h3>
            <p className="m-0 text-xs text-slate-600">
              Custom rendering with BotDojoChatProvider
            </p>
          </Link>

          <a
            href="https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white border border-slate-200 rounded-lg no-underline hover:border-indigo-300 transition-colors"
          >
            <h3 className="m-0 mb-1 text-sm font-bold text-slate-900">SEP-1865 Specification</h3>
            <p className="m-0 text-xs text-slate-600">
              Full MCP Apps protocol documentation
            </p>
          </a>

          <a
            href="https://github.com/botdojo-ai/mcp-app-view"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white border border-slate-200 rounded-lg no-underline hover:border-indigo-300 transition-colors"
          >
            <h3 className="m-0 mb-1 text-sm font-bold text-slate-900">mcp-app-view Library</h3>
            <p className="m-0 text-xs text-slate-600">
              Open-source React hooks for MCP Apps
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
