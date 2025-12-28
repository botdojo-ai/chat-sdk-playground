import CodeSnippet from '@/components/CodeSnippet';

export default function McpGuidePage() {
  return (
    <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">
            MCP Apps — Building Integrated Agent Experiences
          </h1>
          <p className="text-base leading-relaxed text-slate-700">
            MCP Apps are interactive UIs inside chat. They let agents show progress, render rich interfaces (diffs, forms, approvals),
            and send actions back to your host app via standard JSON-RPC messages.
          </p>
        </div>

        {/* The Agent Experience Problem */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            The Agent Experience Problem
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            Traditional chat widgets are isolated from your application:
          </p>
          <ul className="mb-4 space-y-2 text-base text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-red-500">❌</span>
              <span>Cannot see what the user is working on</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">❌</span>
              <span>Limited progress display during agent actions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">❌</span>
              <span>Proprietary and restrictive UI</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">❌</span>
              <span>Cannot perform actions within your UI</span>
            </li>
          </ul>
        </section>

        {/* What Great Agent Experiences Need */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            What Great Agent Experiences Need
          </h2>
          <p className="mb-6 text-base leading-relaxed text-slate-700">
            To build truly integrated agent experiences like Cursor or Notion AI, you need two things:
          </p>

          {/* Progress & Rich UI */}
          <div className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
            <h3 className="mb-3 text-2xl font-bold text-indigo-900">
              1. Progress & Rich UI — Chat Experience (MCP Apps)
            </h3>
            <p className="mb-4 text-base leading-relaxed text-indigo-900">
              Agents need to <strong>show their work</strong> while processing and provide{' '}
              <strong>interactive interfaces</strong> beyond plain text:
            </p>
            <ul className="mb-4 space-y-2 text-base text-indigo-900">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Stream progress updates as the agent thinks ("Analyzing document...", "Generating suggestions...")</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Show rich UI: diffs, approval buttons, forms, visualizations</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Persist state across page reloads (tool results, user actions)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Enable multi-step workflows with user confirmation</span>
              </li>
            </ul>
            <div className="rounded-lg bg-white p-4 text-sm text-indigo-900">
              <strong>Example:</strong> Show a side-by-side diff with Accept/Reject buttons instead of dumping text changes.
            </div>
          </div>

          {/* Visibility Into User Context */}
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="mb-3 text-2xl font-bold text-emerald-900">
              2. Visibility Into User Context & Ability to Perform Actions (Frontend MCP)
            </h3>
            <p className="mb-4 text-base leading-relaxed text-emerald-900">
              Agents need to <strong>see what the user is working on</strong> and{' '}
              <strong>act on their behalf</strong> by accessing tools and resources from your UI's current state:
            </p>
            <ul className="mb-4 space-y-2 text-base text-emerald-900">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Dynamically expose the UI state, selected items, form state as MCP resources</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Provide tools that act on behalf of the user (save edits, create records, update settings)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Give context about where the user is in your app (current page, active selections)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Execute actions directly in your UI without requiring backend API changes</span>
              </li>
            </ul>
            <div className="rounded-lg bg-white p-4 text-sm text-emerald-900">
              <strong>Example:</strong> Agent reads the markdown document being edited, suggests changes, and applies them directly when user clicks Accept.
            </div>
          </div>

          {/* BotDojo Provides */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-base leading-relaxed text-slate-700">
              <strong className="text-slate-900">BotDojo provides:</strong>
            </p>
            <ul className="mb-4 space-y-2 text-base text-slate-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Fully compliant MCP Apps (SEP-1865 spec) for interactive, in-chat UIs and workflows</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Frontend MCP integration where React components define and dynamically update{' '}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">ModelContext</code> based on your
                  app's UI state—exposing exactly what the agent can see and do, in sync with your app
                </span>
              </li>
            </ul>
            <div className="rounded-lg bg-slate-50 p-4 text-base font-semibold text-slate-900">
              <strong>Result:</strong> An agent experience where the AI feels like part of your app, not a separate chatbot.
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            How It Works
          </h2>

          {/* MCP Apps */}
          <div className="mb-8">
            <h3 className="mb-3 text-2xl font-bold text-slate-900">
              MCP Apps (Standard - SEP-1865)
            </h3>
            <p className="mb-4 text-base leading-relaxed text-slate-700">
              <strong>What it is:</strong> A JSON-RPC 2.0 specification for bidirectional communication between your
              host app, an embedded MCP App (interactive UI in an iframe), and the AI model. The extension is identified
              as <code className="rounded bg-slate-100 px-1.5 py-0.5">io.modelcontextprotocol/ui</code>.
            </p>

            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">Key capabilities (UI → Host):</p>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">📥</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/initialize</code>: App requests initialization with host context</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">✅</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/notifications/initialized</code>: App confirms initialization is complete</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">🔧</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">tools/call</code>: App requests host to execute a tool</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">💬</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/message</code>: App sends rich content to chat</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">🔗</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/open-link</code>: App requests host to open URLs</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">📐</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/notifications/size-change</code>: App reports dimension changes for iframe sizing</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">📖</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">resources/read</code>: App reads resource content from MCP server</span>
                </div>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">Key capabilities (Host → UI):</p>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">🔔</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/notifications/tool-input-partial</code>: Host streams tool progress/partial args (0..n times)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">📦</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/notifications/tool-input</code>: Host sends complete tool arguments</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">✅</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/notifications/tool-result</code>: Host sends final tool result</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">❌</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/tool-cancelled</code>: Host notifies app that tool was cancelled</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">🎨</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/host-context-change</code>: Host notifies app of context updates (theme, viewport, etc.)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-indigo-600">🚪</span>
                  <span><code className="rounded bg-white px-1.5 py-0.5">ui/resource-teardown</code>: Host signals app cleanup before teardown</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">What it enables:</p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Show progress while agent works ("step 1 of 3...")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Approval workflows (show diff → user accepts/rejects)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Forms and data collection within chat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Real-time visualizations during tool execution</span>
                </li>
              </ul>
            </div>
          </div>

          {/* UI Resource Format */}
          <div className="mb-8">
            <h3 className="mb-3 text-2xl font-bold text-slate-900">
              UI Resource Format
            </h3>
            <p className="mb-4 text-base leading-relaxed text-slate-700">
              <strong>What it is:</strong> UI resources use the <code className="rounded bg-slate-100 px-1.5 py-0.5">ui://</code> URI scheme 
              and must have MIME type <code className="rounded bg-slate-100 px-1.5 py-0.5">text/html;profile=mcp-app</code>.
              Tools reference UI resources via the <code className="rounded bg-slate-100 px-1.5 py-0.5">_meta["ui/resourceUri"]</code> field.
            </p>

            <CodeSnippet
              language="typescript"
              title="UI Resource Declaration (SEP-1865)"
              code={`// Resource declaration
{
  uri: "ui://weather-server/dashboard-template",
  name: "weather_dashboard",
  description: "Interactive weather dashboard widget",
  mimeType: "text/html;profile=mcp-app",
  _meta: {
    ui: {
      csp: {
        connectDomains: ["https://api.example.com"],  // Origins for fetch/XHR/WebSocket
        resourceDomains: ["https://cdn.example.com"]  // Origins for images, scripts, etc.
      },
      domain: "https://widget.example.com",  // Optional dedicated sandbox origin
      prefersBorder: true  // Visual boundary preference
    }
  }
}

// Tool linking to UI resource
{
  name: "get_weather",
  description: "Get current weather with interactive dashboard",
  inputSchema: { type: "object", properties: { location: { type: "string" } } },
  _meta: {
    "ui/resourceUri": "ui://weather-server/dashboard-template"
  }
}`}
            />
          </div>

          {/* Frontend MCP */}
          <div className="mb-8">
            <h3 className="mb-3 text-2xl font-bold text-slate-900">
              Frontend MCP
            </h3>
            <p className="mb-4 text-base leading-relaxed text-slate-700">
              <strong>What it is:</strong> Browser-native implementation of MCP for frontend applications. Your React
              components can dynamically provide tools and resources based on UI state.
            </p>

            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">Key features:</p>
              <ol className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-slate-900">1.</span>
                  <span><strong>Browser-native JSON-RPC</strong>: <code className="rounded bg-white px-1.5 py-0.5">postMessage</code> bridge between host and iframe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-slate-900">2.</span>
                  <span><strong>Dynamic Model Context</strong>: Define <code className="rounded bg-white px-1.5 py-0.5">modelContext</code> inline with your components</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-slate-900">3.</span>
                  <span><strong>Session persistence</strong>: State survives page reloads without rerunning tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-slate-900">4.</span>
                  <span><strong>Type-safe APIs</strong>: TypeScript interfaces for <code className="rounded bg-white px-1.5 py-0.5">ModelContext</code>, tools, resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-slate-900">5.</span>
                  <span><strong>Flexible hosting</strong>: Remote URL apps (Next.js pages) or inline HTML (<code className="rounded bg-white px-1.5 py-0.5">ui://</code> resources)</span>
                </li>
              </ol>
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">What it enables:</p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Expose current document/form/selection as MCP resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Provide tools that act on user's behalf (save, update, delete)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Give agent visibility into where user is in your app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Zero backend wiring—everything in the frontend</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="mb-3 text-sm font-semibold text-amber-900">BotDojo Extensions (Beyond MCP Standard):</p>
              <ul className="space-y-2 text-sm text-amber-900">
                <li className="flex items-start gap-2">
                  <span>🔄</span>
                  <span><strong>State Persistence</strong>: <code className="rounded bg-white px-1.5 py-0.5">content.type: 'botdojo/persist'</code> survives page reloads so you don't have to implement it yourself.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>📦</span>
                  <span><strong>Tool Context Hydration</strong>: Full tool invocation data in <code className="rounded bg-white px-1.5 py-0.5">hostContext.tool</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🎯</span>
                  <span><strong>Rich Partial Args</strong>: Stream structured payloads (diffs, previews) while the agent is streaming results</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* MCP Apps Lifecycle */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            MCP Apps Lifecycle
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            The SEP-1865 spec defines a 4-phase lifecycle for MCP Apps:
          </p>

          <div className="rounded-xl border border-slate-300 bg-slate-50 p-6">
            <CodeSnippet
              language="text"
              code={`1. CONNECTION & DISCOVERY
   Server → Host: resources/list (includes ui:// resources)
   Server → Host: tools/list (includes tools with ui/resourceUri metadata)

2. UI INITIALIZATION
   Host renders iframe (with sandbox proxy for web hosts)
   UI → Host: ui/initialize
   Host → UI: McpUiInitializeResult (hostContext, capabilities)
   UI → Host: ui/notifications/initialized
   Host → UI: ui/notifications/tool-input-partial (0..n, streaming)
   Host → UI: ui/notifications/tool-input (complete args)

3. INTERACTIVE PHASE
   User interaction → UI calls tools/call, ui/message, ui/open-link
   UI → Host: ui/notifications/size-change (when dimensions change)
   Host → UI: ui/host-context-change (theme, viewport changes)
   Host → UI: ui/notifications/tool-result (when tool completes)
   OR
   Host → UI: ui/tool-cancelled (if cancelled)

4. CLEANUP
   Host → UI: ui/resource-teardown (with reason)
   UI performs graceful termination
   UI → Host: ui/resource-teardown response
   Host tears down iframe and listeners`}
            />
          </div>

          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-sm text-indigo-900">
              <strong>Key insight:</strong> The Host MUST NOT send any request or notification to the Guest UI before 
              receiving the <code className="rounded bg-white px-1.5 py-0.5">ui/notifications/initialized</code> notification.
              This ensures the UI is ready to process messages.
            </p>
          </div>
        </section>

        {/* Host Context */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Host Context (McpUiInitializeResult)
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            When the MCP App sends <code className="rounded bg-slate-100 px-1.5 py-0.5">ui/initialize</code>, 
            the host responds with context about the tool invocation and display environment:
          </p>

          <CodeSnippet
            language="typescript"
            title="HostContext Interface (SEP-1865)"
            code={`interface HostContext {
  /** Metadata of the tool call that instantiated the App */
  toolInfo?: {
    id?: RequestId;    // JSON-RPC id of the tools/call request
    tool: Tool;        // Contains name, inputSchema, etc.
  };
  /** Current color theme preference */
  theme?: "light" | "dark";
  /** How the UI is currently displayed */
  displayMode?: "inline" | "fullscreen" | "pip";
  /** Display modes the host supports */
  availableDisplayModes?: string[];
  /** Current and maximum dimensions available to the UI */
  viewport?: {
    width: number;
    height: number;
    maxHeight?: number;
    maxWidth?: number;
  };
  /** User's language/region preference (BCP 47, e.g., "en-US") */
  locale?: string;
  /** User's timezone (IANA, e.g., "America/New_York") */
  timeZone?: string;
  /** Host application identifier */
  userAgent?: string;
  /** Platform type for responsive design */
  platform?: "web" | "desktop" | "mobile";
  /** Device capabilities */
  deviceCapabilities?: {
    touch?: boolean;
    hover?: boolean;
  };
  /** Mobile safe area boundaries in pixels */
  safeAreaInsets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}`}
          />

          <p className="mt-4 text-base leading-relaxed text-slate-700">
            All fields are optional. Hosts SHOULD provide relevant context. Guest UIs SHOULD handle missing fields gracefully.
            The host may also send <code className="rounded bg-slate-100 px-1.5 py-0.5">ui/host-context-change</code> notifications
            when any context field changes (e.g., theme toggle, window resize).
          </p>
        </section>

        {/* Capability Negotiation */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Capability Negotiation
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            Hosts advertise MCP Apps support using the extension identifier{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">io.modelcontextprotocol/ui</code>:
          </p>

          <CodeSnippet
            language="json"
            title="Host Capabilities Advertisement"
            code={`{
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "extensions": {
        "io.modelcontextprotocol/ui": {
          "mimeTypes": ["text/html;profile=mcp-app"]
        }
      }
    },
    "clientInfo": {
      "name": "my-chat-host",
      "version": "1.0.0"
    }
  }
}`}
          />

          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Servers SHOULD check for this capability before registering UI-enabled tools, and provide 
            text-only fallback behavior when UI is not supported:
          </p>

          <div className="mt-4">
            <CodeSnippet
              language="typescript"
              title="Server Capability Check"
              code={`const hasUISupport = clientCapabilities?.extensions
  ?.["io.modelcontextprotocol/ui"]
  ?.mimeTypes?.includes("text/html;profile=mcp-app");

if (hasUISupport) {
  // Register tools with UI templates
  server.registerTool("get_weather", {
    description: "Get weather with interactive dashboard",
    inputSchema: { /* ... */ },
    _meta: { "ui/resourceUri": "ui://weather-server/dashboard" }
  });
} else {
  // Register text-only version (graceful degradation)
  server.registerTool("get_weather", {
    description: "Get weather as text",
    inputSchema: { /* ... */ }
    // No UI metadata
  });
}`}
            />
          </div>
        </section>

        {/* The Complete Picture */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            The Complete Picture
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            Together, <strong>MCP Apps</strong> + <strong>Frontend MCP</strong> give you what products like Cursor have:
          </p>

          <div className="mb-6 rounded-xl border border-slate-300 bg-slate-50 p-6">
            <CodeSnippet
              language="text"
              code={`User edits document in your app
    ↓
Your UI exposes document as MCP resource (Frontend MCP)
    ↓
Agent reads document, generates suggested changes
    ↓
Agent shows diff in interactive MCP App with Accept/Reject (MCP Apps)
    ↓
User clicks Accept
    ↓
MCP App calls tool to apply changes (Frontend MCP)
    ↓
Your UI updates with new content`}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-900">
              <strong>The result:</strong> An AI experience that feels native to your product, not bolted on.
            </p>
          </div>
        </section>

        {/* Security Model */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Security Model
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            SEP-1865 defines a comprehensive security model for hosting untrusted UI content:
          </p>
          
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">🔒 Iframe Sandboxing</p>
              <p className="text-sm text-slate-700">
                All UI content MUST be rendered in sandboxed iframes. Web hosts MUST use a double-iframe 
                sandbox proxy on a different origin from the host, with permissions limited to{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5">allow-scripts</code> and{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5">allow-same-origin</code>.
              </p>
            </div>
            
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">🛡️ CSP Enforcement</p>
              <p className="mb-2 text-sm text-slate-700">
                Hosts MUST enforce Content Security Policies based on the <code className="rounded bg-slate-100 px-1.5 py-0.5">_meta.ui.csp</code> metadata.
                If omitted, hosts use restrictive defaults:
              </p>
              <CodeSnippet
                language="text"
                code={`default-src 'none';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'none';`}
              />
            </div>
            
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">📋 Auditable Communication</p>
              <p className="text-sm text-slate-700">
                All UI-to-host communication uses JSON-RPC 2.0 over <code className="rounded bg-slate-100 px-1.5 py-0.5">postMessage</code>, 
                enabling logging and review of all messages. Hosts SHOULD log UI-initiated RPC calls for security review.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">🔍 Predeclared Resource Review</p>
              <p className="text-sm text-slate-700">
                Hosts receive UI templates during connection setup, before tool execution. This allows hosts to 
                review HTML content, generate hash/signatures, warn users about suspicious content, and implement 
                allowlists/blocklists.
              </p>
            </div>
          </div>
        </section>

        {/* Data Passing */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Data Passing
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            Tool execution results are passed to the UI through notifications:
          </p>

          <CodeSnippet
            language="typescript"
            title="Tool Result Notification"
            code={`// Host sends tool result to UI
{
  jsonrpc: "2.0",
  method: "ui/notifications/tool-result",
  params: {
    // Text for model context and text-only hosts
    content: [
      { type: "text", text: "Current weather: Sunny, 72°F" }
    ],
    // Structured data for UI rendering (NOT added to model context)
    structuredContent: {
      temperature: 72,
      conditions: "sunny",
      humidity: 45
    },
    // Additional metadata (not for model context)
    _meta: {
      timestamp: "2025-11-10T15:30:00Z",
      source: "weather-api"
    }
  }
}`}
          />

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="mb-3 text-sm font-semibold text-amber-900">Data Passing Best Practices (SEP-1865):</p>
            <ul className="space-y-2 text-sm text-amber-900">
              <li className="flex items-start gap-2">
                <span>📄</span>
                <span><code className="rounded bg-white px-1.5 py-0.5">content</code>: Text representation for model context and text-only hosts</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📊</span>
                <span><code className="rounded bg-white px-1.5 py-0.5">structuredContent</code>: Structured data optimized for UI rendering (NOT added to model context)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📎</span>
                <span><code className="rounded bg-white px-1.5 py-0.5">_meta</code>: Additional metadata (timestamps, version info, etc.) not intended for model context</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Terminology */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Terminology
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                <strong className="text-slate-900">MCP App (Guest UI):</strong> The interactive UI component (iframe) that appears in chat
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                <strong className="text-slate-900">Canvas:</strong> Our name for the MCP App's React page (e.g., <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">remote-url-native.tsx</code>)
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                <strong className="text-slate-900">Tool:</strong> The function definition that triggers the MCP App (e.g., <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">show_remote_url_app</code>)
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                <strong className="text-slate-900">UI Resource:</strong> The <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">ui://</code> URI or inline HTML that provides the app content
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                <strong className="text-slate-900">Host:</strong> Your main app that embeds <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">&lt;BotDojoChat&gt;</code>
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                <strong className="text-slate-900">Sandbox Proxy:</strong> Intermediate iframe (different origin) that wraps the Guest UI for web hosts
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                <strong className="text-slate-900">SEP-1865:</strong> The MCP Apps specification that defines the JSON-RPC protocol
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                <strong className="text-slate-900">io.modelcontextprotocol/ui:</strong> The extension identifier for MCP Apps capability negotiation
              </p>
            </div>
          </div>
        </section>

        {/* When to Use MCP Apps */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            When to Use MCP Apps
          </h2>

          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="mb-3 text-base font-semibold text-emerald-900">Use MCP Apps when you need:</p>
            <ul className="space-y-2 text-base text-emerald-900">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✅</span>
                <span>Interactive UI (forms, buttons, visualizations)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✅</span>
                <span>Multi-step workflows with state</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✅</span>
                <span>Real-time updates during tool execution</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✅</span>
                <span>User approval/rejection flows (like diff reviews)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✅</span>
                <span>Persistent state across sessions</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="mb-3 text-base font-semibold text-slate-700">Stick with plain chat when:</p>
            <ul className="space-y-2 text-base text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-slate-400">❌</span>
                <span>Simple text responses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">❌</span>
                <span>No user interaction needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">❌</span>
                <span>One-shot tool calls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">❌</span>
                <span>No state to preserve</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Example Tool Definition */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Tool Definitions (Host)
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            MCP tools are defined inside <code className="rounded bg-slate-100 px-1.5 py-0.5">modelContext.tools</code>. Here's an example of a remote URL app:
          </p>

          <CodeSnippet
            language="typescript"
            title="Remote URL App Tool"
            code={`// Remote URL app (renders a Next.js page)
{
  name: 'show_remote_url_app',
  description: 'Show the Remote Url App with all MCP Apps actions + streaming state.',
  inputSchema: { 
    type: 'object', 
    properties: { go: { type: 'boolean' } }, 
    required: ['go'] 
  },
  _meta: {
    // SEP-1865 standard: link tool to UI resource
    "ui/resourceUri": getRemoteUrlCanvasUrl(),
    // BotDojo extensions
    ui: {
      csp: { 
        connectDomains: [localOrigin], 
        resourceDomains: [localOrigin] 
      },
    },
  },
  execute: async (_args, context) => {
    // Stream progress steps via ui/notifications/tool-input-partial
    context?.notifyToolInputPartial?.({ 
      stepId: 'step-1', 
      stepLabel: 'Initializing…' 
    });
    await delay(1500);

    context?.notifyToolInputPartial?.({ 
      stepId: 'step-2', 
      stepLabel: 'Incrementing counter…' 
    });
    await delay(2000);

    context?.notifyToolInputPartial?.({ 
      stepId: 'step-3', 
      stepLabel: 'Pushing stream patch…' 
    });
    await delay(3000);
    
    // Final result via ui/notifications/tool-result
    context?.notifyToolResult?.({ result: 'Remote Url App returned' });
    return [textResult('Remote Url App returned')];
  },
}`}
          />
        </section>

        {/* Streaming Diffs */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Streaming Diffs During Tool Execution
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            A powerful pattern is streaming diff previews to the MCP App <strong>during</strong> tool execution using{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">notifyToolInputPartial</code> (which sends{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">ui/notifications/tool-input-partial</code>).
          </p>

          <div className="mb-6">
            <CodeSnippet
              language="typescript"
              title="Markdown Editor with Diff Preview"
              code={`{
  name: 'suggestUpdate',
  description: 'Propose an updated markdown string and show a diff in a BotDojo MCP App.',
  _meta: {
    "ui/resourceUri": buildCanvasUrl('suggest-update'),
  },
  execute: async (params: { updated_markdown: string; summary?: string }, context) => {
    const before = markdownRef.current;
    const after = params.updated_markdown;
    
    const diffPayload = {
      before,
      after,
      summary: params.summary,
      canvasId: uuidv4(),
      applied: false,
    };

    // Send diff to canvas IMMEDIATELY via ui/notifications/tool-input-partial
    context?.notifyToolInputPartial?.({ diffPayload });

    // Canvas receives ui/notifications/tool-input-partial with diffPayload
    // and renders side-by-side diff view with Accept/Reject buttons
    
    return diffPayload;
  },
}`}
            />
          </div>

          <div className="rounded-xl border border-slate-300 bg-slate-50 p-6">
            <p className="mb-3 text-sm font-semibold text-slate-900">Flow:</p>
            <CodeSnippet
              language="text"
              code={`Tool starts executing
    ↓
Tool calls notifyToolInputPartial({ diffPayload })
    → Host sends ui/notifications/tool-input-partial
    ↓
Canvas receives partial args
    ↓
Canvas renders diff view in "streaming" state:
    ┌─────────────────────────────────────┐
    │ BEFORE              │ AFTER         │
    │ old text...         │ new text...   │
    │                     │ with changes  │
    ├─────────────────────────────────────┤
    │ [Reject] [Accept]                   │
    └─────────────────────────────────────┘
    ↓
User clicks Accept
    ↓
Canvas calls tools/call or ui/message to apply changes
    ↓
Tool sends notifyToolResult({ result: 'Applied' })
    → Host sends ui/notifications/tool-result
    ↓
Canvas shows "complete" state with confirmation`}
            />
          </div>

          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-sm text-indigo-900">
              <strong>Key insight:</strong> <code className="rounded bg-white px-1.5 py-0.5">notifyToolInputPartial</code> isn't just for progress steps—you can send{' '}
              <strong>rich payloads</strong> (diffs, previews, structured data) that the canvas consumes to render interactive UI{' '}
              <strong>before</strong> the tool completes.
            </p>
          </div>
        </section>

        {/* Persistent State */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Persistent State (BotDojo Extension)
          </h2>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            <strong>What it is:</strong> A BotDojo extension to the MCP Apps spec that enables durable UI state across
            page reloads without rerunning tools. (Note: State persistence is mentioned as a future extension in SEP-1865.)
          </p>
          <p className="mb-4 text-base leading-relaxed text-slate-700">
            <strong>When to use it:</strong> Any time the UI should remember user actions across reloads or
            sessions—e.g., a counter value, whether a user already clicked a CTA, or the result of a tool that should
            remain visible without rerunning.
          </p>

          <div className="mb-4">
            <CodeSnippet
              language="typescript"
              title="Persisting State from MCP App"
              code={`// Use ui/message with botdojo/persist content type
await sendRequest('ui/message', {
  role: 'user',
  content: {
    type: 'botdojo/persist',
    state: { counter: val, clicked: true },
  },
});`}
            />
          </div>

          <p className="mb-4 text-base leading-relaxed text-slate-700">
            The host stores that blob for the session and feeds it back on the next{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">ui/initialize</code> via{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">hostContext.state</code>, so the UI can immediately
            render the saved state without extra backend wiring.
          </p>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-900">
              <strong>Why it's helpful:</strong> You get durable UI state for MCP apps without building a custom
              persistence layer. The same payload is also emitted on{' '}
              <code className="rounded bg-white px-1.5 py-0.5">ui/host-context-change</code> so live
              apps can react when the host updates state.
            </p>
          </div>
        </section>

        {/* What to Try */}
        <section className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            What to Try
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                • Click <strong>"Show Remote Url App"</strong> in chat then watch the Event Monitor light up for{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">ui/message</code>,{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">tools/call</code>, and{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">ui/open-link</code>.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                • Increment the counter, refresh the page, and notice the app rehydrates with the prior count and the
                completed tool context.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-base text-slate-700">
                • Compare the remote URL canvas (<code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">canvas/remote-url-native.tsx</code>)
                and the inline HTML canvas (inlined string) to see the same MCP actions delivered either from a hosted page or a{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">ui://</code> resource.
              </p>
            </div>
          </div>
        </section>

        {/* Try the Examples CTA */}
        <section className="mb-16">
          <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center shadow-lg">
            <h2 className="mb-4 text-3xl font-bold text-indigo-900">
              Ready to See It in Action?
            </h2>
            <p className="mb-6 text-lg text-indigo-700">
              Explore the interactive examples to see MCP Apps and Frontend MCP working together.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/examples/mcp-app-example"
                className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
              >
                🧩 MCP App Example
              </a>
              <a
                href="/examples/document-edit"
                className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
              >
                📝 Edit Document
              </a>
              <a
                href="/examples/bonsai-shop"
                className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg"
              >
                🌳 Bonsai Shop
              </a>
            </div>
          </div>
        </section>
      </div>
  );
}
