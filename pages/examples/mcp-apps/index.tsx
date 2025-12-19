import Link from 'next/link';

export default function ChatWidgetsPage() {
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-5 md:mb-8">
        <h1 className="m-0 mb-2 md:mb-3 text-xl md:text-[28px] font-bold text-slate-900">
          MCP Apps
        </h1>
        <p className="m-0 text-sm md:text-[15px] text-slate-500 leading-relaxed max-w-[800px]">
          <strong>MCP Apps</strong> are interactive UI components that render inside chat conversations (think "widgets in chat").
          They're defined by the <strong>Model Context Protocol (MCP)</strong> standard: <strong>SEP-1865</strong>.
        </p>
      </div>

      {/* Engineer checklist */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-2.5 text-base md:text-lg font-extrabold text-slate-900">
          Implementation Checklist
        </h2>
        <ol className="m-0 pl-5 text-slate-600 text-sm leading-loose">
          <li>Add <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">_meta.ui.resourceUri</code> to a tool to tell the host which app to render.</li>
          <li>Provide the UI resource via <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">resources[].getContent</code> with MIME <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">text/html;profile=mcp-app</code>.</li>
          <li>Handle callbacks in the host (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">onToolCall</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">onUiMessage</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">onOpenLink</code>).</li>
        </ol>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            href="/examples/mcp-app-example"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-lg no-underline font-bold text-sm min-h-[44px]"
          >
            Tool Progress Example
          </Link>
          <Link
            href="/examples/product-enhance"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white text-indigo-500 border border-indigo-500 rounded-lg no-underline font-bold text-sm min-h-[44px]"
          >
            Product Enhancement Demo →
          </Link>
        </div>
      </div>

      {/* Standard Reference */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="m-0 mb-3 text-base md:text-lg font-bold text-slate-900">
          Standard Specification (SEP-1865)
        </h2>
        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          BotDojo implements MCP Apps according to <strong>SEP-1865</strong>, which defines how interactive UIs
          are delivered, sandboxed, and connected to the host via JSON-RPC (postMessage).
        </p>
        <a 
          href="https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 text-white rounded-md no-underline font-semibold text-sm"
        >
          View SEP-1865 Specification →
        </a>
      </div>

      {/* How It Works */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-lg border border-slate-200">
        <h2 className="m-0 mb-4 text-base md:text-lg font-bold text-slate-900">
          How It Works
        </h2>
        
        <h3 className="m-0 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          1) A tool references an MCP App
        </h3>
        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          Tools can include UI metadata in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">_meta.ui</code> field, 
          which references a UI resource URI. The resource URI can be:
        </p>
        <ul className="m-0 mb-4 pl-6 text-sm text-slate-600 leading-loose">
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">ui://</code> scheme for inline HTML resources</li>
          <li>HTTPS URL for externally hosted widgets</li>
        </ul>

        <h3 className="m-0 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          2) The host loads and runs the MCP App (lifecycle)
        </h3>
        <ol className="m-0 mb-4 pl-6 text-sm text-slate-600 leading-loose">
          <li>Agent calls a tool with <code className="bg-slate-100 px-1.5 py-0.5 rounded">_meta.ui</code> metadata</li>
          <li>Host fetches the UI resource (HTML content)</li>
          <li>Host renders the HTML in a sandboxed iframe</li>
          <li>Widget and host establish JSON-RPC communication via postMessage</li>
          <li>Host sends tool arguments to the widget via <code className="bg-slate-100 px-1.5 py-0.5 rounded">ui/notifications/tool-input</code></li>
          <li>Widget can send messages, call tools, or open links via JSON-RPC requests</li>
        </ol>

        <h3 className="m-0 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          3) The MCP App and host communicate via JSON-RPC
        </h3>
        <p className="m-0 mb-3 text-sm text-slate-600 leading-relaxed">
          Widgets communicate with the host using standard MCP JSON-RPC messages:
        </p>
        <ul className="m-0 mb-4 pl-6 text-sm text-slate-600 leading-loose">
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">ui/initialize</code> - Widget initialization handshake</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">ui/message</code> - Widget sends messages to chat</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">tools/call</code> - Widget calls other MCP tools</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">ui/open-link</code> - Widget requests to open external URLs</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">ui/notifications/tool-input</code> - Host sends tool arguments to widget</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">ui/notifications/tool-input-partial</code> - Host streams partial tool input updates</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">ui/notifications/tool-result</code> - Host sends tool execution result</li>
        </ul>

        <h3 className="m-0 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          Security
        </h3>
        <p className="m-0 text-sm text-slate-600 leading-relaxed">
          MCP Apps run in isolated iframes with Content Security Policy (CSP) enforcement. The host can specify 
          allowed domains for network requests and resource loading via CSP configuration in the tool metadata.
        </p>
      </div>

      {/* Implementation Details */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-lg border border-slate-200">
        <h2 className="m-0 mb-4 text-base md:text-lg font-bold text-slate-900">
          Implementation
        </h2>
        <p className="m-0 mb-3 text-sm text-slate-600 leading-relaxed">
          Our implementation adheres to the SEP-1865 specification:
        </p>
        <ul className="m-0 pl-6 text-sm text-slate-600 leading-loose">
          <li>UI resources use <code className="bg-slate-100 px-1.5 py-0.5 rounded">ui://</code> URI scheme or HTTPS URLs</li>
          <li>Resources have MIME type <code className="bg-slate-100 px-1.5 py-0.5 rounded">text/html;profile=mcp-app</code></li>
          <li>All communication uses standard MCP JSON-RPC messages over postMessage</li>
          <li>Widgets run in sandboxed iframes with CSP enforcement</li>
          <li>State persistence via <code className="bg-slate-100 px-1.5 py-0.5 rounded">botdojo/persist</code> message type</li>
          <li>Streaming support via <code className="bg-slate-100 px-1.5 py-0.5 rounded">ui/notifications/tool-input-partial</code></li>
        </ul>
      </div>

      {/* Examples */}
      <div className="p-4 md:p-5 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="m-0 mb-4 text-base md:text-lg font-bold text-slate-900">
          Related
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/examples/product-enhance"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-500 text-white rounded-md no-underline font-semibold text-sm min-h-[44px]"
          >
            Product Enhancement
          </Link>
          <Link 
            href="/examples/mcp-app-example"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white text-indigo-500 border border-indigo-500 rounded-md no-underline font-semibold text-sm min-h-[44px]"
          >
            Tool Progress
          </Link>
        </div>
      </div>
    </div>
  );
}
