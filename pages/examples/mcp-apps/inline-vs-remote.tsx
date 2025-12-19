import { useState } from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import CodeSnippet from '@/components/CodeSnippet';
import { Tabs } from '@/components/Tabs';

interface InlineVsRemotePageProps {
  examples: {
    simpleCounter: string;
    progressIndicator: string;
  };
}

export default function InlineVsRemotePage({ examples }: InlineVsRemotePageProps) {
  const [activeExample, setActiveExample] = useState('counter');

  const exampleTabs = [
    { id: 'counter', label: 'Simple Counter' },
    { id: 'progress', label: 'Progress Indicator' },
  ];

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
          MCP Apps can be delivered as inline HTML (a single self-contained string) or as a remote URL (hosted content).
          This page helps you pick the right approach.
        </p>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
          border: '1px solid #c7d2fe',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              📄
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#3730a3' }}>Inline HTML</h3>
              <span style={{ fontSize: '12px', color: '#6366f1' }}>Self-contained</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#4338ca', lineHeight: 1.6 }}>
            HTML content is bundled directly into the MCP App response. Everything runs in a single file with no external dependencies.
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fdf4ff, #fae8ff)',
          border: '1px solid #e879f9',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              🌐
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#7e22ce' }}>Remote URL</h3>
              <span style={{ fontSize: '12px', color: '#a855f7' }}>External hosted</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#86198f', lineHeight: 1.6 }}>
            MCP App loads from an external URL. Enables dynamic content, external resources, and complex applications.
          </p>
        </div>
      </div>

      {/* The HTTPS Proxy */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fcd34d',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}>
            🔒
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#92400e' }}>
              The HTTPS Proxy
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#78350f', lineHeight: 1.7 }}>
              MCP Apps run inside sandboxed iframes for security. Due to browser security policies, 
              iframes require HTTPS to load external resources like images, fonts, and make API calls.
            </p>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #fcd34d',
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
                When You Need the Proxy (ngrok)
              </h4>
              <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '13px', color: '#78350f', lineHeight: 1.8 }}>
                <li><strong>Loading images</strong> – External images require HTTPS origin</li>
                <li><strong>External fonts</strong> – Google Fonts, custom fonts need secure context</li>
                <li><strong>API calls</strong> – fetch() to external services requires HTTPS</li>
                <li><strong>WebSockets</strong> – Real-time connections need wss:// (secure WebSocket)</li>
                <li><strong>Local development</strong> – Testing remote MCP Apps before deployment</li>
              </ul>
            </div>
            <div style={{ marginTop: '16px' }}>
              <code style={{
                display: 'block',
                background: '#451a03',
                color: '#fef3c7',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'monospace',
              }}>
                # Start ngrok to create HTTPS tunnel<br/>
                ngrok http 3500
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          When to Use Each Approach
        </h2>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Feature</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#6366f1' }}>Inline HTML</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#a855f7' }}>Remote URL</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Setup Complexity', inline: '✅ Simple', remote: '⚠️ Requires hosting' },
                { feature: 'External Images', inline: '❌ Data URLs only', remote: '✅ Full support' },
                { feature: 'External APIs', inline: '❌ No fetch()', remote: '✅ Full support' },
                { feature: 'Bundle Size', inline: '⚠️ Larger (all inline)', remote: '✅ Smaller initial' },
                { feature: 'Caching', inline: '❌ No browser cache', remote: '✅ Browser cached' },
                { feature: 'Development', inline: '✅ Hot reload works', remote: '⚠️ Needs ngrok' },
                { feature: 'Production', inline: '✅ No hosting needed', remote: '⚠️ CDN required' },
              ].map((row, i) => (
                <tr key={row.feature} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 500 }}>{row.feature}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>{row.inline}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>{row.remote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          Architecture
        </h2>
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Inline Flow */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', marginBottom: '12px' }}>INLINE FLOW</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '10px 20px', background: '#6366f1', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                  MCP Server
                </div>
                <div style={{ fontSize: '20px' }}>↓</div>
                <div style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', borderRadius: '6px', fontSize: '12px' }}>
                  HTML String
                </div>
                <div style={{ fontSize: '20px' }}>↓</div>
                <div style={{ padding: '10px 20px', background: '#22c55e', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                  McpAppHost
                </div>
                <div style={{ fontSize: '20px' }}>↓</div>
                <div style={{ padding: '10px 20px', background: '#0ea5e9', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                  Sandboxed iframe
                </div>
              </div>
            </div>

            {/* Remote Flow */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#a855f7', marginBottom: '12px' }}>REMOTE FLOW</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '10px 20px', background: '#a855f7', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                  MCP Server
                </div>
                <div style={{ fontSize: '20px' }}>↓</div>
                <div style={{ padding: '8px 16px', background: '#fae8ff', color: '#86198f', borderRadius: '6px', fontSize: '12px' }}>
                  URL Reference
                </div>
                <div style={{ fontSize: '20px' }}>↓</div>
                <div style={{ padding: '10px 20px', background: '#22c55e', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                  McpAppHost
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '20px' }}>↓</div>
                  <div style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: 500 }}>
                    HTTPS Proxy
                  </div>
                </div>
                <div style={{ padding: '10px 20px', background: '#0ea5e9', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                  Sandboxed iframe
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Examples */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          Simple MCP App Examples
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          These examples show the basic structure of inline MCP Apps using the{' '}
          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>useMcpApp</code> hook.
        </p>

        <Tabs
          tabs={exampleTabs}
          activeId={activeExample}
          onChange={setActiveExample}
        />

        <div style={{ marginTop: '20px' }}>
          {activeExample === 'counter' && (
            <div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                  📊 Simple Counter
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  A minimal MCP App demonstrating state management and host communication.
                  Uses <code>useMcpApp</code> to send messages back to the host.
                </p>
              </div>
              <CodeSnippet code={examples.simpleCounter} language="tsx" title="simple-counter.tsx" />
            </div>
          )}

          {activeExample === 'progress' && (
            <div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                  ⏳ Progress Indicator
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  Shows how to handle streaming tool input via <code>onToolInputPartial</code>.
                  Displays progress updates as the agent streams data.
                </p>
              </div>
              <CodeSnippet code={examples.progressIndicator} language="tsx" title="progress-indicator.tsx" />
            </div>
          )}
        </div>
      </div>

      {/* MCP Spec Reference */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '1px solid #86efac',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}>
            📖
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#166534' }}>
              MCP Apps Specification
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#15803d', lineHeight: 1.7 }}>
              MCP Apps is based on SEP-1865, which defines the standard for interactive UIs in MCP.
              Key concepts include the sandbox proxy architecture, JSON-RPC communication, and CSP enforcement.
            </p>
            <div style={{ fontSize: '13px', color: '#166534' }}>
              <strong>Key spec sections:</strong>
              <ul style={{ margin: '8px 0 0 0', padding: '0 0 0 20px', lineHeight: 1.8 }}>
                <li><code>ui://</code> URI scheme for UI resources</li>
                <li><code>ui/initialize</code> → <code>ui/notifications/initialized</code> handshake</li>
                <li><code>ui/notifications/tool-input-partial</code> for streaming</li>
                <li><code>ui/notifications/tool-result</code> for completion</li>
                <li>Sandbox proxy for web-based hosts (different origin requirement)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Next Steps
        </h3>
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
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Try the Test Harness →
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
            Full Chat Integration →
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const widgetsDir = path.join(process.cwd(), 'pages/examples/mcp-apps/widgets');
  
  // Simple example code snippets (inline for simplicity)
  const simpleCounter = `import { useRef, useState, useCallback } from 'react';
import { useMcpApp } from 'mcp-app-view/react';

function SimpleCounter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  const { isInitialized, sendMessage } = useMcpApp({
    containerRef,
    autoReportSize: true,
  });

  const handleIncrement = useCallback(async () => {
    const newCount = count + 1;
    setCount(newCount);
    
    // Notify the host about the change
    await sendMessage([
      { type: 'text', text: \`Counter updated to \${newCount}\` }
    ]);
  }, [count, sendMessage]);

  return (
    <div ref={containerRef} style={{ padding: 20, textAlign: 'center' }}>
      <h2>Counter: {count}</h2>
      <button 
        onClick={handleIncrement}
        disabled={!isInitialized}
        style={{
          padding: '12px 24px',
          fontSize: 16,
          borderRadius: 8,
          border: 'none',
          background: '#6366f1',
          color: 'white',
          cursor: isInitialized ? 'pointer' : 'not-allowed',
        }}
      >
        Increment
      </button>
      <p style={{ color: '#64748b', fontSize: 12 }}>
        {isInitialized ? 'Connected to host' : 'Connecting...'}
      </p>
    </div>
  );
}

export default SimpleCounter;`;

  const progressIndicator = `import { useRef, useState } from 'react';
import { useMcpApp } from 'mcp-app-view/react';

function ProgressIndicator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState<{
    stepId?: string;
    stepLabel?: string;
    percent?: number;
  } | null>(null);

  const { isInitialized, tool } = useMcpApp({
    containerRef,
    autoReportSize: true,
    // Handle streaming progress updates
    onToolInputPartial: (params) => {
      if (params.arguments?.kind === 'botdojo-tool-progress') {
        setProgress({
          stepId: params.arguments.stepId,
          stepLabel: params.arguments.stepLabel,
          percent: params.arguments.percent,
        });
      }
    },
  });

  const isComplete = tool.status === 'complete' || tool.status === 'idle';

  return (
    <div ref={containerRef} style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 16px 0' }}>
        {isComplete ? '✅ Complete!' : '⏳ Processing...'}
      </h3>
      
      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: 8,
        background: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          width: \`\${progress?.percent || 0}%\`,
          height: '100%',
          background: '#6366f1',
          transition: 'width 0.3s ease',
        }} />
      </div>
      
      {/* Status Label */}
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>
        {progress?.stepLabel || 'Waiting for data...'}
      </p>
    </div>
  );
}

export default ProgressIndicator;`;

  return {
    props: {
      examples: {
        simpleCounter,
        progressIndicator,
      },
    },
  };
}
