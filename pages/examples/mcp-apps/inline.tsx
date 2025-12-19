import { useCallback, useState, useEffect, useRef } from 'react';
import { McpAppHost, McpAppHostProvider, useMcpAppHost, type McpAppData } from '@botdojo/chat-sdk';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import CodeSnippet from '@/components/CodeSnippet';

interface McpAppEvent {
  id: string;
  type: 'ui/open-link' | 'tools/call' | 'ui/message' | 'ready' | 'streaming';
  message: string;
  timestamp: Date;
  details?: any;
}

const STREAMING_STEPS = [
  { stepId: 'step-1', stepLabel: 'Loading resources...' },
  { stepId: 'step-2', stepLabel: 'Processing data...' },
  { stepId: 'step-3', stepLabel: 'Finalizing...' },
];

interface InlineMcpAppPageProps {
  mcpAppSourceCode: string;
}

function InlineMcpAppHarness() {
  const [mcpAppHtml, setMcpAppHtml] = useState<string | null>(null);
  const [appEvents, setAppEvents] = useState<McpAppEvent[]>([]);
  const [flashingEventId, setFlashingEventId] = useState<string | null>(null);
  const [persistedState, setPersistedState] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  
  // Use refs to avoid re-renders during simulation
  const mcpAppDataRef = useRef<McpAppData | null>(null);
  const mcpAppIdRef = useRef<string | null>(null);
  const simulationAbortRef = useRef(false);
  
  // State for triggering render of McpAppHost
  const [renderKey, setRenderKey] = useState(0);
  const [showApp, setShowApp] = useState(false);
  
  const mcpAppHostContext = useMcpAppHost();

  // Load the MCP App HTML
  useEffect(() => {
    async function loadMcpAppHtml() {
      try {
        const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
        const html = await fetchMcpAppHtml('streaming-demo-app');
        setMcpAppHtml(html);
      } catch (err) {
        console.error('Failed to load MCP App HTML:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMcpAppHtml();
  }, []);

  const addEvent = useCallback((type: McpAppEvent['type'], message: string, details?: any) => {
    const eventId = `${type}-${Date.now()}-${Math.random()}`;
    const event: McpAppEvent = {
      id: eventId,
      type,
      message,
      timestamp: new Date(),
      details,
    };
    setAppEvents((prev) => [event, ...prev].slice(0, 20));
    setFlashingEventId(eventId);
    setTimeout(() => setFlashingEventId(null), 1200);
  }, []);

  // Helper to send to app and ignore cleanup errors
  const safeSendToApp = useCallback(async (mcpAppId: string, method: string, params: any) => {
    if (!mcpAppHostContext) return;
    try {
      await mcpAppHostContext.sendToApp(mcpAppId, method, params);
    } catch (err: any) {
      // Ignore "App unregistered" errors - these happen during cleanup
      if (!err?.message?.includes('unregistered')) {
        console.error('sendToApp error:', err);
      }
    }
  }, [mcpAppHostContext]);

  // Run the streaming simulation - sends tool-input-partial messages
  const runStreamingSimulation = useCallback(async (mcpAppId: string) => {
    if (!mcpAppHostContext) return;
    
    simulationAbortRef.current = false;
    
    // Wait a moment for iframe to be ready
    await new Promise(r => setTimeout(r, 500));
    
    for (let i = 0; i < STREAMING_STEPS.length; i++) {
      if (simulationAbortRef.current) break;
      
      const step = STREAMING_STEPS[i];
      setCurrentStep(i);
      addEvent('streaming', `Step ${i + 1}: ${step.stepLabel}`);
      
      // Send tool-input-partial with progress
      await safeSendToApp(mcpAppId, 'ui/notifications/tool-input-partial', {
        tool: { name: 'show_inline_app' },
        arguments: {
          kind: 'botdojo-tool-progress',
          stepId: step.stepId,
          stepLabel: step.stepLabel,
        },
      });
      
      // Wait between steps
      await new Promise(r => setTimeout(r, 1500));
    }
    
    if (!simulationAbortRef.current) {
      // Send tool-result to complete
      await safeSendToApp(mcpAppId, 'ui/notifications/tool-result', {
        tool: { name: 'show_inline_app' },
        result: { success: true, message: 'Simulation complete!' },
      });
      
      addEvent('streaming', 'Simulation complete!');
      setCurrentStep(-1);
    }
    
    setIsSimulating(false);
  }, [mcpAppHostContext, safeSendToApp, addEvent]);

  // Start simulation
  const startSimulation = useCallback(async () => {
    if (!mcpAppHtml || isSimulating) return;
    
    simulationAbortRef.current = true; // Stop any running simulation
    
    // If app is already showing, hide it first and wait for cleanup
    if (showApp) {
      setShowApp(false);
      // Wait for React to unmount and cleanup
      await new Promise(r => setTimeout(r, 100));
    }
    
    setIsSimulating(true);
    setCurrentStep(0);
    
    // Generate new mcpAppId
    const mcpAppId = `inline-app-${Date.now()}`;
    mcpAppIdRef.current = mcpAppId;
    
    // Create mcpAppData - NOT complete, no result
    const data: McpAppData = {
      mcpAppId,
      mcpAppType: 'mcp-app',
      html: mcpAppHtml,
      height: '400px',
      state: persistedState,
      isComplete: false, // Important: not complete yet
      toolInfo: {
        id: mcpAppId,
        tool: { name: 'show_inline_app' },
      },
      arguments: { go: true },
      // No result - streaming
    };
    
    mcpAppDataRef.current = data;
    
    // Trigger render with new key
    setRenderKey(k => k + 1);
    setShowApp(true);
    addEvent('tools/call', 'Started: show_inline_app');
  }, [mcpAppHtml, isSimulating, showApp, persistedState, addEvent]);

  // When app is ready, start streaming
  const handleReady = useCallback((mcpAppId: string) => {
    addEvent('ready', 'App initialized');
    
    // Start streaming simulation after app is ready
    if (mcpAppIdRef.current === mcpAppId && isSimulating) {
      runStreamingSimulation(mcpAppId);
    }
  }, [addEvent, isSimulating, runStreamingSimulation]);

  // Reset
  const resetApp = useCallback(async () => {
    simulationAbortRef.current = true;
    setIsSimulating(false);
    setCurrentStep(-1);
    
    // Hide app first and wait for cleanup
    setShowApp(false);
    await new Promise(r => setTimeout(r, 100));
    
    // Clear refs after unmount
    mcpAppDataRef.current = null;
    mcpAppIdRef.current = null;
    setAppEvents([]);
    setPersistedState({});
  }, []);

  // Event handlers
  const handleOpenLink = useCallback((url: string, target: string, mcpAppId: string) => {
    addEvent('ui/open-link', url, { url, target, mcpAppId });
  }, [addEvent]);

  const handleToolCall = useCallback(async (tool: string, params: any, mcpAppId: string) => {
    addEvent('tools/call', tool, { tool, params, mcpAppId });
    return { success: true, tool, receivedAt: new Date().toISOString() };
  }, [addEvent]);

  const handleUiMessage = useCallback((message: string, params: any, mcpAppId: string) => {
    addEvent('ui/message', message.slice(0, 50), { message, params, mcpAppId });
  }, [addEvent]);

  const handlePersistState = useCallback((state: Record<string, any>, mcpAppId: string) => {
    addEvent('ui/message', `Persist: ${JSON.stringify(state).slice(0, 30)}...`, { state, mcpAppId });
    setPersistedState(prev => ({ ...prev, ...state }));
  }, [addEvent]);

  const getEventTypeColor = (type: McpAppEvent['type']) => {
    switch (type) {
      case 'ui/open-link': return { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' };
      case 'tools/call': return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' };
      case 'ui/message': return { bg: '#e0f2fe', border: '#0284c7', text: '#075985' };
      case 'ready': return { bg: '#dcfce7', border: '#22c55e', text: '#166534' };
      case 'streaming': return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' };
    }
  };

  const getEventTypeIcon = (type: McpAppEvent['type']) => {
    switch (type) {
      case 'ui/open-link': return '🔗';
      case 'tools/call': return '🔧';
      case 'ui/message': return '✉️';
      case 'ready': return '✅';
      case 'streaming': return '⏳';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* Left Panel - MCP App */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📦</span>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>McpAppHost</span>
            {isSimulating && (
              <span style={{ 
                padding: '2px 8px', 
                background: '#fef3c7', 
                color: '#92400e', 
                borderRadius: '4px', 
                fontSize: '11px',
                fontWeight: 600,
              }}>
                Streaming...
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {showApp && (
              <button
                onClick={resetApp}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#64748b',
                  fontWeight: 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            )}
            <button
              onClick={startSimulation}
              disabled={isLoading || !mcpAppHtml || isSimulating}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: (isLoading || !mcpAppHtml || isSimulating) ? '#e2e8f0' : '#6366f1',
                color: (isLoading || !mcpAppHtml || isSimulating) ? '#94a3b8' : '#ffffff',
                fontWeight: 600,
                fontSize: '12px',
                cursor: (isLoading || !mcpAppHtml || isSimulating) ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Loading...' : isSimulating ? 'Simulating...' : 'Simulate Tool Call'}
            </button>
          </div>
        </div>
        
        <div style={{ padding: '16px', minHeight: '450px', background: '#fafafa' }}>
          {showApp && mcpAppDataRef.current ? (
            <McpAppHost
              key={renderKey}
              mcpAppId={mcpAppDataRef.current.mcpAppId}
              onOpenLink={handleOpenLink}
              onToolCall={handleToolCall}
              onUiMessage={handleUiMessage}
              onPersistState={handlePersistState}
              onReady={handleReady}
              height="450px"
              debug={true}
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '450px',
              color: '#94a3b8',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</span>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>No MCP App loaded</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
                Click "Simulate Tool Call" to see streaming in action
              </p>
            </div>
          )}
        </div>
        
        {/* Progress indicator */}
        {isSimulating && currentStep >= 0 && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            background: '#fffbeb',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>
              Streaming Progress
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {STREAMING_STEPS.map((step, i) => (
                <div
                  key={step.stepId}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    background: i < currentStep ? '#dcfce7' : i === currentStep ? '#fef3c7' : '#f1f5f9',
                    border: `1px solid ${i < currentStep ? '#22c55e' : i === currentStep ? '#f59e0b' : '#e2e8f0'}`,
                    fontSize: '11px',
                    textAlign: 'center',
                    color: i < currentStep ? '#166534' : i === currentStep ? '#92400e' : '#94a3b8',
                  }}
                >
                  {i < currentStep ? '✓' : i === currentStep ? '⏳' : '○'} Step {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Persisted State */}
        {Object.keys(persistedState).length > 0 && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            background: '#f0fdf4',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
              Persisted State
            </div>
            <code style={{ fontSize: '12px', color: '#166534' }}>
              {JSON.stringify(persistedState)}
            </code>
          </div>
        )}
      </div>

      {/* Right Panel - Event Monitor */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>📊</span>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Event Monitor</span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>
            {appEvents.length} events
          </span>
        </div>
        
        <div style={{ padding: '16px', maxHeight: '550px', overflowY: 'auto' }}>
          {/* Event Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {appEvents.length === 0 ? (
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No events yet. Click "Simulate Tool Call" to begin!
              </div>
            ) : (
              appEvents.map((event) => {
                const colors = getEventTypeColor(event.type);
                const isFlashing = flashingEventId === event.id;
                return (
                  <div
                    key={event.id}
                    style={{
                      padding: '10px 12px',
                      background: isFlashing ? colors.bg : '#f8fafc',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${colors.border}`,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{getEventTypeIcon(event.type)}</span>
                        <span style={{ fontWeight: 600, fontSize: '12px', color: colors.text }}>{event.type}</span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>{event.message}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InlineMcpAppPage({ mcpAppSourceCode }: InlineMcpAppPageProps) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Link href="/examples/mcp-apps" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '13px' }}>
            ← MCP Apps
          </Link>
        </div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          Inline MCP App Test Harness
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.6, maxWidth: '700px' }}>
          Test the <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>McpAppHost</code> component 
          with streaming simulation. Watch tool-input-partial messages animate the progress steps.
        </p>
      </div>

      {/* Test Harness */}
      <McpAppHostProvider debug={true}>
        <InlineMcpAppHarness />
      </McpAppHostProvider>

      {/* How it works */}
      <div style={{ marginTop: '32px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          How Streaming Works
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>1️⃣</div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>Create McpAppHost</div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
              Pass <code>isComplete: false</code> to indicate streaming is in progress.
            </p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>2️⃣</div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>Send Progress</div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
              Use <code>sendToApp</code> to send <code>ui/notifications/tool-input-partial</code> messages.
            </p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>3️⃣</div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>Complete</div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
              Send <code>ui/notifications/tool-result</code> to signal completion.
            </p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>4️⃣</div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>Interact</div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
              After streaming, click buttons to see events flow back.
            </p>
          </div>
        </div>
      </div>

      {/* MCP App Source Code */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          MCP App Source Code
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          This is the MCP App that runs inside the <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>McpAppHost</code>. 
          It uses the <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>useMcpApp</code> hook to communicate with the host.
        </p>
        <CodeSnippet 
          code={mcpAppSourceCode} 
          language="tsx" 
          title="streaming-demo-app.tsx"
        />
      </div>

      {/* Next Steps */}
      <div style={{ marginTop: '24px', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Next Steps
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href="/examples/mcp-apps"
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
            ← Back to Introduction
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
            See Full Chat Integration →
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const mcpAppPath = path.join(process.cwd(), 'pages/examples/mcp-apps/widgets/streaming-demo-app.tsx');
  const mcpAppSourceCode = fs.readFileSync(mcpAppPath, 'utf-8');
  
  return {
    props: {
      mcpAppSourceCode,
    },
  };
}
