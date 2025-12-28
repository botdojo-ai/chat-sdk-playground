import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';

export default function UseMcpAppGuidePage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Link href="/examples/mcp-apps" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '13px' }}>
            ← MCP Apps overview
          </Link>
        </div>
        <h1 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
          useMcpApp Hook Guide
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#64748b', lineHeight: 1.7 }}>
          Complete guide to building MCP App widgets with the <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>useMcpApp</code> hook.
        </p>
      </div>

      {/* Tool Definition First */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          1. Define Your Tool with _meta
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Start by defining your MCP tool with the <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>_meta.ui</code> properties.
          The <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>_meta</code> field is defined in the MCP specification (SEP-1865):
        </p>

        <CodeSnippet
          language="typescript"
          title="Example: Product Card Tool"
          code={`{
  name: 'show_product_card',
  description: 'Display interactive product card',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number' },
      imageUrl: { type: 'string' }
    },
    required: ['productId', 'name', 'price']
  },
  _meta: {
    'botdojo/display-name': 'Product Card',
    'botdojo/no-cache': true,  // Disable caching during development
    ui: {
      resourceUri: 'ui://my-app/product-card',
      preferredFrameSize: { width: 600, height: 400 },
      stateless: false,  // Enable state persistence
      csp: {
        resourceDomains: ['https://cdn.example.com'],  // For images
        connectDomains: ['https://api.example.com']     // For fetch() calls
      }
    }
  },
  execute: async (args, context) => {
    // Optional: Send progress updates
    context?.notifyToolInputPartial?.({
      kind: 'botdojo-tool-progress',
      stepId: 'loading',
      stepLabel: 'Loading product...'
    });

    // Do work...

    return { content: [{ type: 'text', text: 'Product card displayed' }] };
  }
}`}
        />

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
            _meta Properties Reference
          </h3>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Property</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { prop: 'botdojo/display-name', desc: 'Human-readable name shown in chat UI' },
                  { prop: 'botdojo/hide-step', desc: 'Hide entire step from UI' },
                  { prop: 'botdojo/hide-step-details', desc: 'Show step name only, hide args/result' },
                  { prop: 'botdojo/no-cache', desc: 'Disable caching (use during development)' },
                  { prop: 'ui.resourceUri', desc: 'Location of MCP App (ui://... or https://...)' },
                  { prop: 'ui.preferredFrameSize', desc: 'Initial iframe size {width, height}' },
                  { prop: 'ui.stateless', desc: 'Set to true to disable state persistence' },
                  { prop: 'ui.csp.resourceDomains', desc: 'Origins allowed for images, fonts, stylesheets' },
                  { prop: 'ui.csp.connectDomains', desc: 'Origins allowed for fetch/XHR requests' },
                ].map((row, i) => (
                  <tr key={row.prop} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
                      <code style={{ fontSize: '12px', fontWeight: 600 }}>{row.prop}</code>
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      {row.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lifecycle */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          2. Understanding the Lifecycle
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          When an MCP App loads, it goes through a specific lifecycle:
        </p>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { step: '1', label: 'iframe Created', desc: 'Host creates sandboxed iframe' },
              { step: '2', label: 'useMcpApp Initializes', desc: 'Widget calls useMcpApp hook → sends "client-ready"' },
              { step: '3', label: 'Host Sends ui/initialize', desc: 'Host sends appInfo, hostContext, capabilities' },
              { step: '4', label: 'Widget Confirms', desc: 'Widget sends "initialized" → isInitialized = true' },
              { step: '5', label: 'Tool Execution Updates', desc: 'tool-input-partial (0..n) → tool-input → tool-result → status = complete' },
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', gap: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0,
                }}>
                  {item.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <CodeSnippet
          language="typescript"
          title="Basic Widget Setup"
          code={`import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

function MyWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isInitialized,    // true after handshake completes
    appInfo,          // Info about this app instance
    hostContext,      // State, theme, viewport, toolInfo
    tool,             // Tool arguments, status, result
    sendMessage,      // Send message to chat
    callTool,         // Call another tool
    openLink,         // Request link open
    reportSize,       // Manual size reporting
    client            // Raw client for advanced use
  } = useMcpApp({
    containerRef,
    autoReportSize: true,
    onToolInputPartial: (params) => {
      // Handle streaming updates
    }
  });

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return <div ref={containerRef}>...</div>;
}`}
        />
      </div>

      {/* Host Context & App Info */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          3. Host Context & App Info
        </h2>

        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          appInfo
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Contains information about your app instance:
        </p>

        <CodeSnippet
          language="typescript"
          title="appInfo Example"
          code={`// appInfo structure
{
  uri: 'ui://my-app/product-card',
  name: 'Product Card'
}`}
        />

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          hostContext
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Contains state, theme, viewport info, and tool metadata:
        </p>

        <CodeSnippet
          language="typescript"
          title="hostContext Example"
          code={`// hostContext structure
{
  state: {
    // Your persisted state (see State & Persistence section)
    counter: 5,
    userPreferences: { theme: 'dark' }
  },
  toolInfo: {
    tool: {
      name: 'show_product_card',
      meta: { /* tool _meta properties */ }
    }
  },
  theme: {
    // Current theme info
  },
  viewport: {
    width: 1920,
    height: 1080
  }
}`}
        />
      </div>

      {/* Tool Arguments & Results */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          4. Tool Arguments & Results
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          The <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>tool</code> object
          provides access to arguments passed when the tool was called and the execution result once the tool completes:
        </p>

        <CodeSnippet
          language="typescript"
          title="Example: Product Card Widget"
          code={`import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

function ProductCardWidget() {
  const { tool, isInitialized } = useMcpApp();

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  // Access tool arguments passed from the tool invocation
  const { productId, name, price, imageUrl } = tool.arguments || {};

  // Check if tool is still streaming updates
  const isLoading = tool.status === 'streaming';
  const isComplete = tool.status === 'complete';

  // Access the tool result (if available)
  const result = tool.result;

  return (
    <div>
      <h2>{name || 'Product'}</h2>
      <p>ID: {productId}</p>
      <p>Price: \${price || 0}</p>

      {isLoading && <div>Processing...</div>}
      {isComplete && result && (
        <div>✅ {result.message || 'Complete'}</div>
      )}

      {imageUrl && <img src={imageUrl} alt={name} />}
    </div>
  );
}`}
        />

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          Tool Object Structure
        </h3>
        <CodeSnippet
          language="typescript"
          title="Tool Object Type"
          code={`// The tool object structure:
{
  name: 'show_product_card',           // Tool name
  arguments: {                          // Arguments passed to the tool
    productId: '123',
    name: 'Widget',
    price: 49.99,
    imageUrl: 'https://...'
  },
  partialUpdate: null,                  // Streaming argument updates (LLM partial JSON)
  toolProgress: {                       // Progress notifications during execution
    kind: 'botdojo-tool-progress',
    stepId: 'loading',
    stepLabel: 'Loading product...',
    percent: 50
  },
  result: {                             // Result after tool execution completes
    content: [{ type: 'text', text: 'Product card displayed' }]
  },
  status: 'complete',                   // 'idle' | 'streaming' | 'complete' | 'error'
  isStreaming: false                    // Convenience flag for streaming state
}`}
        />
      </div>

      {/* State & Persistence */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          5. State & Persistence
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          MCP Apps can persist state that survives page refreshes, navigation, and chat session reopening.
          This is critical for remembering user actions and preferences.
        </p>

        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          Hydration vs First Load
        </h3>
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '13px', color: '#166534', lineHeight: 1.8 }}>
            <li><strong>First Load:</strong> User triggers tool for the first time → <code>hostContext.state</code> is empty or has defaults</li>
            <li><strong>Hydration:</strong> User returns to existing chat or refreshes page → <code>hostContext.state</code> contains previously saved data</li>
          </ul>
        </div>

        <CodeSnippet
          language="typescript"
          title="Reading Persisted State (Hydration)"
          code={`const { hostContext } = useMcpApp();
const [counter, setCounter] = useState(0);
const [clickedItems, setClickedItems] = useState<Set<string>>(new Set());

// On mount, restore state from hostContext
useEffect(() => {
  if (hostContext?.state) {
    // Restore counter
    if (typeof hostContext.state.counter === 'number') {
      setCounter(hostContext.state.counter);
    }

    // Restore clicked items
    if (Array.isArray(hostContext.state.clickedItems)) {
      setClickedItems(new Set(hostContext.state.clickedItems));
    }
  }
}, [hostContext]);`}
        />

        <CodeSnippet
          language="typescript"
          title="Persisting State"
          code={`const { client } = useMcpApp();

const saveState = async (newCounter: number, clicked: Set<string>) => {
  await client.sendRequest('ui/message', {
    role: 'user',
    content: {
      type: 'botdojo/persist',
      state: {
        counter: newCounter,
        clickedItems: Array.from(clicked)  // Convert Set to Array
      }
    }
  });
};

// Example: Save when user clicks a button
const handleClick = async () => {
  const newCounter = counter + 1;
  setCounter(newCounter);

  await saveState(newCounter, clickedItems);
};`}
        />

        <div style={{
          padding: '16px',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          marginTop: '16px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: 1.6 }}>
            <strong>Use cases for state persistence:</strong> Remember which items a user clicked, save form data,
            remember UI preferences (active tab, collapsed sections), track user progress through a workflow.
          </p>
        </div>
      </div>

      {/* Streaming & Progress */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          6. Streaming & Progress Updates
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Your widget can receive streaming progress updates while the tool is executing:
        </p>

        <CodeSnippet
          language="typescript"
          title="In Your Tool: Send Progress"
          code={`execute: async (args, context) => {
  // Send progress notification
  context?.notifyToolInputPartial?.({
    kind: 'botdojo-tool-progress',
    stepId: 'step-1',
    stepLabel: 'Loading product data...',
    percent: 33
  });

  // Do some work...
  await fetchProductData();

  context?.notifyToolInputPartial?.({
    kind: 'botdojo-tool-progress',
    stepId: 'step-2',
    stepLabel: 'Processing images...',
    percent: 66
  });

  // More work...

  return { content: [{ type: 'text', text: 'Complete!' }] };
}`}
        />

        <CodeSnippet
          language="typescript"
          title="In Your Widget: Receive Progress"
          code={`const [progress, setProgress] = useState<{
  stepId?: string;
  stepLabel?: string;
  percent?: number;
} | null>(null);

const { tool } = useMcpApp({
  onToolInputPartial: (params) => {
    if (params.arguments?.kind === 'botdojo-tool-progress') {
      setProgress({
        stepId: params.arguments.stepId,
        stepLabel: params.arguments.stepLabel,
        percent: params.arguments.percent
      });
    }
  }
});

const isStreaming = tool.isStreaming;
const isComplete = tool.status === 'complete' || tool.status === 'idle';

return (
  <div>
    {isStreaming && progress && (
      <div>
        <div>{progress.stepLabel}</div>
        <ProgressBar percent={progress.percent ?? 0} />
      </div>
    )}
    {isComplete && <div>✅ Complete!</div>}
  </div>
);`}
        />
      </div>

      {/* MCP Actions */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          7. MCP App Actions
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Your widget can perform actions that communicate with the host:
        </p>

        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          sendMessage()
        </h3>
        <CodeSnippet
          language="typescript"
          code={`const { sendMessage } = useMcpApp();

// Send a message to the chat
await sendMessage([
  { type: 'text', text: 'User clicked the Save button!' }
]);`}
        />

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          callTool()
        </h3>
        <CodeSnippet
          language="typescript"
          code={`const { callTool } = useMcpApp();

// Call another MCP tool
const result = await callTool('save_product', {
  productId: '123',
  data: { name: 'Widget', price: 49.99 }
});

console.log('Tool result:', result);`}
        />

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          openLink()
        </h3>
        <CodeSnippet
          language="typescript"
          code={`const { openLink } = useMcpApp();

// Request to open an external link
// Host will prompt user for confirmation
await openLink('https://docs.botdojo.com');`}
        />

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          reportSize()
        </h3>
        <CodeSnippet
          language="typescript"
          code={`const { reportSize } = useMcpApp();

// Manually report size changes
// (Usually not needed with autoReportSize: true)
reportSize(600, 400);`}
        />
      </div>

      {/* Caching */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          8. Caching
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          When using <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>BotDojoChat</code>,
          provide a <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>cacheKey</code> prop
          to enable MCP App HTML caching. Without it, caching is disabled and performance suffers.
        </p>

        <CodeSnippet
          language="typescript"
          title="Enable Caching"
          code={`<BotDojoChat
  apiKey="your-api-key"
  cacheKey="user-123-flow-abc"  // Unique ID for your agent/flow instance
  modelContext={modelContext}
  // ... other props
/>`}
        />

        <div style={{
          padding: '16px',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          marginTop: '16px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
            <strong>How caching works:</strong> The <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>cacheKey</code> is
            a unique identifier for your agent or flow instance. It's combined with the MCP App resource URI (e.g., <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>ui://my-app/widget</code>)
            to create a unique cache entry. This prevents MCP App HTML from being fetched repeatedly, improving load times significantly.
          </p>
        </div>

        <div style={{
          padding: '16px',
          background: '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          marginTop: '12px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: 1.6 }}>
            <strong>Note:</strong> Inline HTML (delivered via <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>text/html;profile=mcp-app</code> MIME type)
            is cached by the proxy but won't benefit from traditional browser caching like remote URLs.
          </p>
        </div>

        <div style={{
          padding: '16px',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          marginTop: '12px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: 1.6 }}>
            <strong>During development:</strong> Use <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>botdojo/no-cache: true</code> in your tool _meta to
            disable caching and see changes immediately.
          </p>
        </div>
      </div>

      {/* Complete Example */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          9. Complete Example
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          See the{' '}
          <Link href="/examples/mcp-app-example" style={{ color: '#6366f1', textDecoration: 'underline', fontWeight: 600 }}>
            Tool Progress example
          </Link>
          {' '}for a complete working implementation that demonstrates:
        </p>

        <ul style={{ margin: '0 0 16px 0', padding: '0 0 0 20px', fontSize: '14px', color: '#475569', lineHeight: 1.8 }}>
          <li>Streaming progress updates</li>
          <li>State persistence (counter that survives refresh)</li>
          <li>All MCP actions (sendMessage, callTool, openLink)</li>
          <li>Hydration (restoring state on reload)</li>
        </ul>
      </div>

      {/* Next Steps */}
      <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Next Steps
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href="/examples/mcp-app-example"
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
            View Tool Progress Example →
          </Link>
          <Link
            href="/examples/mcp-apps/headless"
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
            Learn Headless Mode
          </Link>
        </div>
      </div>
    </div>
  );
}
