import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';

export default function HeadlessMcpAppsPage() {
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
          MCP Apps in Headless Mode
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#64748b', lineHeight: 1.7 }}>
          Learn how to use MCP Apps with the headless chat components for full control over your UI.
        </p>
      </div>

      {/* Overview */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          What is Headless Mode?
        </h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Headless mode gives you access to the underlying chat and MCP App functionality without the pre-built UI.
          This is useful when you want to:
        </p>
        <ul style={{ margin: '0 0 16px 0', padding: '0 0 0 20px', fontSize: '14px', color: '#475569', lineHeight: 1.8 }}>
          <li>Build a custom chat interface with your own design</li>
          <li>Render MCP Apps in specific locations in your UI</li>
          <li>Control when and how MCP Apps are displayed</li>
          <li>Integrate chat functionality into an existing application</li>
        </ul>
        <div style={{
          padding: '12px 16px',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
            <strong>See it in action:</strong> Check out the{' '}
            <Link href="/examples/headless-chat" style={{ color: '#166534', textDecoration: 'underline', fontWeight: 600 }}>
              Headless Chat example
            </Link>
            {' '}and{' '}
            <Link href="/examples/headless-mcp" style={{ color: '#166534', textDecoration: 'underline', fontWeight: 600 }}>
              Headless MCP example
            </Link>
          </p>
        </div>
      </div>

      {/* Working with BotDojoChatProvider */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          Working with BotDojoChatProvider
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          When using the headless chat components with <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>BotDojoChatProvider</code>,
          MCP App data (HTML, arguments, results) is automatically managed for you:
        </p>

        <CodeSnippet
          language="typescript"
          title="Complete Example with Provider"
          code={`import { BotDojoChatProvider, McpAppHost } from '@botdojo/chat-sdk/headless';

function MyApp() {
  return (
    <BotDojoChatProvider
      apiKey="your-api-key"
      baseUrl="https://embed.botdojo.com"
      modelContext={myModelContext}
      cacheKey="user-123-flow-abc"  // Unique ID for your agent/flow instance
    >
      <MyCustomChatUI />
    </BotDojoChatProvider>
  );
}

function MyCustomChatUI() {
  const [mcpApps, setMcpApps] = useState<string[]>([]);

  return (
    <div>
      {/* Your custom chat messages UI */}
      <div>
        {/* Render messages... */}
      </div>

      {/* Render MCP Apps */}
      {mcpApps.map(appId => (
        <McpAppHost
          key={appId}
          mcpAppId={appId}
          onOpenLink={(url) => window.open(url, '_blank')}
          onToolCall={async (tool, params) => {
            // Handle tool calls
            return { success: true };
          }}
        />
      ))}
    </div>
  );
}`}
        />

        <div style={{
          padding: '16px',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          marginTop: '16px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
            <strong>Caching:</strong> The <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>cacheKey</code> is
            a unique identifier for your agent or flow instance. It's combined with the MCP App resource URI
            to create a unique cache entry, preventing MCP App HTML from being fetched repeatedly.
          </p>
        </div>
      </div>

      {/* Examples */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          Complete Examples
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          See these full examples to learn how to use MCP Apps in headless mode:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/examples/headless-chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              💬
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                Headless Chat
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Build a custom chat UI with full control over rendering
              </div>
            </div>
            <div style={{ fontSize: '18px', color: '#6366f1' }}>→</div>
          </Link>

          <Link
            href="/examples/headless-mcp"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              🎨
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                Headless MCP
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Custom MCP App rendering with McpAppHost
              </div>
            </div>
            <div style={{ fontSize: '18px', color: '#a855f7' }}>→</div>
          </Link>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Next Steps
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href="/examples/mcp-apps/use-mcp-app-guide"
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
            Learn useMcpApp Hook
          </Link>
          <Link
            href="/examples/headless-chat"
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
            View Headless Chat Example →
          </Link>
        </div>
      </div>
    </div>
  );
}
