import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';

export default function InlineVsRemotePage() {
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
          Inline vs Remote MCP Apps
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#64748b', lineHeight: 1.7 }}>
          MCP Apps can be delivered as <strong>inline HTML</strong> (bundled string) or <strong>remote URL</strong> (hosted content).
          Both have identical capabilities—the only difference is how the HTML is delivered.
        </p>
      </div>

      {/* Key Point */}
      <div style={{
        background: 'linear-gradient(135px, #dbeafe, #e0e7ff)',
        border: '2px solid #6366f1',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '40px',
      }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1e40af', lineHeight: 1.7 }}>
          <strong>Important:</strong> Both inline and remote MCP Apps have <strong>identical capabilities</strong> including:
          sendMessage(), callTool(), openLink(), reportSize(), fetch() for external APIs, loading external images, streaming updates, and state persistence.
        </p>
      </div>

      {/* Delivery Methods Overview */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
          Two Ways to Deliver Your MCP App
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}>
                📦
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Inline HTML</h3>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
              Your React component is compiled to an HTML string and provided through the MCP <code>resources</code> array.
              The HTML is served through a proxy and runs in a sandboxed iframe. <strong>Note:</strong> Inline HTML is delivered
              via the proxy on each load and won't be browser-cached like traditional static files.
            </p>
          </div>

          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}>
                🌐
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Remote URL (HTTPS Required)</h3>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
              Your MCP App is hosted at an HTTPS URL (CDN, server, etc.). The host fetches and serves it through
              a proxy to the sandboxed iframe. Remote URLs benefit from browser caching and can be deployed independently.
            </p>
          </div>
        </div>
      </div>

      {/* Inline HTML Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          Inline HTML
        </h2>

        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          How Bundling Works
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          In the SDK Playground, we use Next.js to bundle React components into standalone HTML:
        </p>

        <ol style={{ margin: '0 0 20px 0', padding: '0 0 0 20px', fontSize: '14px', color: '#475569', lineHeight: 1.8 }}>
          <li>Create a React component in <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>pages/examples/mcp-apps/widgets/my-app.tsx</code></li>
          <li>Next.js compiles it to a standalone HTML page with all dependencies</li>
          <li>Use <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>fetchMcpAppHtml('my-app')</code> to read the compiled HTML</li>
          <li>Return the HTML string in your resource's <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>getContent()</code></li>
        </ol>

        <CodeSnippet
          language="typescript"
          title="Example: Inline HTML Resource"
          code={`resources: [
  {
    uri: 'ui://my-app/widget',
    name: 'My Widget',
    mimeType: 'text/html;profile=mcp-app',
    getContent: async () => {
      // In the playground, we use Next.js bundling:
      const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
      const html = await fetchMcpAppHtml('my-widget-app');

      return {
        uri: 'ui://my-app/widget',
        mimeType: 'text/html;profile=mcp-app',
        text: html  // <-- HTML as a string
      };
    }
  }
]`}
        />
      </div>

      {/* Remote URL Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          Remote URL (HTTPS Required)
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Host your MCP App on any HTTPS server (CDN, Vercel, Netlify, your own server, etc.). Remote URLs must use HTTPS
          because MCP Apps are served through a secure proxy.
        </p>

        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          Local Development with ngrok
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          For local development in this playground, you can use ngrok to create an HTTPS tunnel:
        </p>

        <CodeSnippet
          language="bash"
          title="Create HTTPS Tunnel"
          code={`# In this playground, run:
npm run dev:ngrok

# This creates an HTTPS tunnel to localhost:3500
# Use the provided https://xxx.ngrok.io URL as your resourceUri`}
        />

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          Define Your Tool with _meta
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          The <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>_meta</code> field
          is defined in the MCP specification (SEP-1865) and allows you to attach UI resources to tools:
        </p>

        <CodeSnippet
          language="typescript"
          title="Example: Remote URL Tool"
          code={`{
  name: 'show_widget',
  description: 'Display widget',
  inputSchema: { /* ... */ },
  _meta: {  // From MCP spec (SEP-1865)
    ui: {
      resourceUri: 'https://mycdn.com/widgets/product-card',
      csp: {
        resourceDomains: ['https://mycdn.com'],
        connectDomains: ['https://api.myapp.com']
      }
    }
  },
  execute: async (args) => {
    return [textResult('Widget displayed')];
  }
}`}
        />
      </div>

      {/* CORS & External Resources */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          CORS & External Resources
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          <strong>Both inline and remote MCP Apps</strong> can access external resources, but you must configure CSP (Content Security Policy) in your tool metadata.
        </p>

        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          For External Images, Fonts, Stylesheets
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Use <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>csp.resourceDomains</code> to allow loading resources from specific origins.
          The <Link href="/examples/bonsai-shop" style={{ color: '#6366f1', textDecoration: 'underline' }}>Bonsai Shop example</Link> demonstrates this:
        </p>

        <CodeSnippet
          language="typescript"
          title="Bonsai Shop: External Images"
          code={`// Get current origin for images
const origin = typeof window !== 'undefined' ? window.location.origin : '';

_meta: {
  ui: {
    resourceUri: 'ui://bonsai/product-card',
    csp: {
      resourceDomains: origin ? [origin] : []  // Allow images from same origin
    }
  }
}`}
        />

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
          For External API Calls (fetch)
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Use <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>csp.connectDomains</code> to allow fetch/XHR requests to specific APIs:
        </p>

        <CodeSnippet
          language="typescript"
          title="Example: API Access"
          code={`_meta: {
  ui: {
    resourceUri: 'ui://my-app/widget',
    csp: {
      connectDomains: ['https://api.myapp.com', 'https://cdn.example.com']
    }
  }
}

// In your widget:
const response = await fetch('https://api.myapp.com/data');`}
        />
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
              background: '#6366f1',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Learn useMcpApp Hook →
          </Link>
          <Link
            href="/examples/mcp-app-example"
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
            View Tool Progress Example
          </Link>
        </div>
      </div>
    </div>
  );
}
