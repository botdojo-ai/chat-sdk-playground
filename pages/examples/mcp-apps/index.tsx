import Link from 'next/link';

export default function ChatWidgetsPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
          Chat Widgets
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#64748b', lineHeight: 1.6, maxWidth: '800px' }}>
          Chat Widgets (also called MCP Apps) are interactive UI components that render inside chat conversations. 
          They are defined by the <strong>Model Context Protocol (MCP)</strong> standard, specifically 
          <strong> SEP-1865: MCP Apps - Interactive User Interfaces for MCP</strong>.
        </p>
      </div>

      {/* Standard Reference */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '20px', 
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Standard Specification
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Chat Widgets are implemented according to <strong>SEP-1865</strong>, which defines how interactive widgets 
          work within MCP-compatible chat interfaces. The specification covers UI resource definitions, JSON-RPC 
          communication protocols, sandboxing requirements, and widget lifecycle management.
        </p>
        <a 
          href="https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: '#6366f1',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          View SEP-1865 Specification →
        </a>
      </div>

      {/* How It Works */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '20px', 
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          How It Works
        </h2>
        
        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
          Tool Definition
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Tools can include UI metadata in the <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>_meta.ui</code> field, 
          which references a UI resource URI. The resource URI can be:
        </p>
        <ul style={{ margin: '0 0 16px 0', paddingLeft: '24px', fontSize: '14px', color: '#475569', lineHeight: 1.8 }}>
          <li><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui://</code> scheme for inline HTML resources</li>
          <li>HTTPS URL for externally hosted widgets</li>
        </ul>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
          Widget Lifecycle
        </h3>
        <ol style={{ margin: '0 0 16px 0', paddingLeft: '24px', fontSize: '14px', color: '#475569', lineHeight: 1.8 }}>
          <li>Agent calls a tool with <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>_meta.ui</code> metadata</li>
          <li>Host fetches the UI resource (HTML content)</li>
          <li>Host renders the HTML in a sandboxed iframe</li>
          <li>Widget and host establish JSON-RPC communication via postMessage</li>
          <li>Host sends tool arguments to the widget via <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui/notifications/tool-input</code></li>
          <li>Widget can send messages, call tools, or open links via JSON-RPC requests</li>
        </ol>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
          Communication Protocol
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Widgets communicate with the host using standard MCP JSON-RPC messages:
        </p>
        <ul style={{ margin: '0 0 16px 0', paddingLeft: '24px', fontSize: '14px', color: '#475569', lineHeight: 1.8 }}>
          <li><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui/initialize</code> - Widget initialization handshake</li>
          <li><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui/message</code> - Widget sends messages to chat</li>
          <li><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>tools/call</code> - Widget calls other MCP tools</li>
          <li><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui/open-link</code> - Widget requests to open external URLs</li>
          <li><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui/notifications/tool-input</code> - Host sends tool arguments to widget</li>
          <li><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui/notifications/tool-input-partial</code> - Host streams partial tool input updates</li>
          <li><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui/notifications/tool-result</code> - Host sends tool execution result</li>
        </ul>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
          Security
        </h3>
        <p style={{ margin: '0 0 0 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Widgets run in isolated iframes with Content Security Policy (CSP) enforcement. The host can specify 
          allowed domains for network requests and resource loading via CSP configuration in the tool metadata.
        </p>
      </div>

      {/* Implementation Details */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '20px', 
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Implementation
        </h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
          Our implementation adheres to the SEP-1865 specification:
        </p>
        <ul style={{ margin: '0 0 0 0', paddingLeft: '24px', fontSize: '14px', color: '#475569', lineHeight: 1.8 }}>
          <li>UI resources use <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui://</code> URI scheme or HTTPS URLs</li>
          <li>Resources have MIME type <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>text/html;profile=mcp-app</code></li>
          <li>All communication uses standard MCP JSON-RPC messages over postMessage</li>
          <li>Widgets run in sandboxed iframes with CSP enforcement</li>
          <li>State persistence via <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>botdojo/persist</code> message type</li>
          <li>Streaming support via <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>ui/notifications/tool-input-partial</code></li>
        </ul>
      </div>

      {/* Examples */}
      <div style={{ 
        padding: '20px', 
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Examples
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link 
            href="/examples/mcp-apps/inline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#6366f1',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Test Harness
          </Link>
          <Link 
            href="/examples/product-enhance"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'white',
              color: '#6366f1',
              border: '1px solid #6366f1',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Product Enhancement
          </Link>
        </div>
      </div>
    </div>
  );
}
