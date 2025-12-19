import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

/**
 * MCP App using useMcpApp hook
 * State comes from hostContext.state
 */
function McpAppWithHook() {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Local state for tool progress (set via onToolInputPartial callback)
  const [toolProgress, setToolProgress] = useState<Record<string, unknown> | null>(null);
  
  const {
    isInitialized,
    hostContext,
    tool,
    sendMessage,
    callTool,
    openLink,
    client,
  } = useMcpApp({
    containerRef: cardRef,
    autoReportSize: true,
    onToolInputPartial: (params) => {
      console.log('[remote-url-app] onToolInputPartial callback:', params);
      // Check if this is a progress update (kind: 'botdojo-tool-progress')
      if (params.arguments?.kind === 'botdojo-tool-progress') {
        setToolProgress(params.arguments);
      }
    },
  });

  const [busy, setBusy] = useState(false);
  const stepOrder = ['step-1', 'step-2', 'step-3'] as const;

  const status = tool.status;
  const currentStep = toolProgress;
  console.log('toolProgress', toolProgress);
  // Read state from hostContext

  const [state, setState] = useState<{ counter?: number } | null>(null);
  const counter = state?.counter ?? 0;
  useEffect(() => {
    if(!hostContext) return;
    if(state) return;
    setState(hostContext.state as { counter?: number } | undefined ?? { counter: 0 });
  }, [hostContext]);


  const persistCounter = useCallback(
    async (val: number) => {
      setBusy(true);
      
      try {
        setState((prev) => ({ ...prev, counter: val }));
        // Send ui/message with botdojo/persist type for state persistence
        await client.sendRequest('ui/message', {
          role: 'user',
          content: {
            type: 'botdojo/persist',
            state: { counter: val },
          },
        });
      } catch (err) {
        console.error('persist error:', err);
      }

      setBusy(false);
    },
    [client],
  );

  const handleAction = useCallback(
    async (type: string) => {
      setBusy(true);
      try {
        switch (type) {
          case 'tool': {
            try {
              await callTool('Tool Call from Remote Url App', {
                prompt: 'Make a call to the Frontend Model Context Tool',
              });
            } catch (err) {
              console.error('tool error:', err);
            }
            break;
          }
          case 'message':
            await sendMessage([
              { 
                type: 'text', 
                text: `Hello from MCP app (count ${counter})`,
              },
            ]);
            break;
          case 'link':
            await openLink('https://botdojo.com');
            break;
        }
      } finally {
        setBusy(false);
      }
    },
    [sendMessage, callTool, openLink, counter],
  );


  const showComplete = isInitialized && !tool.isStreaming && (status === 'complete' || status === 'idle');
  const showStreaming =!showComplete;// !isInitialized || tool.isStreaming || status === 'streaming';
  return (
    <div
      ref={cardRef}
      style={{
        background: '#ffffff',
        color: '#0f172a',
        padding: 16,
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        fontFamily: 'Inter, system-ui, sans-serif',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'visible',
        display: 'inline-block',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>MCP App (useMcpApp)</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            State from hostContext.state
          </div>
        </div>
        {isInitialized && (
          <div style={{ 
            padding: '4px 8px', 
            background: '#dcfce7', 
            color: '#166534', 
            borderRadius: 6, 
            fontSize: 11, 
            fontWeight: 600 
          }}>
            Connected
          </div>
        )}
      </div>

      {showStreaming && (() => {
        const stepId = currentStep && typeof currentStep.stepId === 'string' ? currentStep.stepId : null;
        const stepLabel = currentStep && typeof currentStep.stepLabel === 'string' ? currentStep.stepLabel : null;
        return (
          <div style={{ marginTop: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#475569' }}>
              {!isInitialized ? 'Initializing...' : 'Running MCP App demo steps…'}
            </div>
            {stepId ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stepOrder.length}, minmax(0,1fr))`, gap: 8 }}>
                  {stepOrder.map((step) => {
                    const complete = stepId && stepId > step;
                    const current = stepId === step;
                    return (
                      <div
                        key={step}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: `1px solid ${complete ? '#6366f1' : '#e2e8f0'}`,
                          background: current ? '#eef2ff' : '#ffffff',
                          color: complete ? '#4f46e5' : '#64748b',
                          fontSize: 12,
                          textTransform: 'capitalize',
                        }}
                      >
                        {complete ? '✓ ' : ''}{step}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                  Current status: {stepLabel || 'Starting...'}
                </div>
              </>
            ) : isInitialized ? (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Waiting for tool arguments...
              </div>
            ) : null}
          </div>
        );
      })()}

      {showComplete && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
            {[
              { type: 'tool', label: 'Call tools/call' },
              { type: 'message', label: 'Send ui/message' },
              { type: 'link', label: 'Send ui/open-link' },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleAction(btn.type)}
                disabled={busy}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  background: busy ? '#f8fafc' : '#ffffff',
                  color: busy ? '#94a3b8' : '#0f172a',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.6 : 1,
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!busy) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!busy) {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => persistCounter(counter - 1)}
                disabled={busy}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  background: busy ? '#f1f5f9' : '#ffffff',
                  color: busy ? '#94a3b8' : '#0f172a',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                -
              </button>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', minWidth: 40, textAlign: 'center' }}>
                {counter}
              </div>
              <button
                onClick={() => persistCounter(counter + 1)}
                disabled={busy}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  background: busy ? '#f1f5f9' : '#ffffff',
                  color: busy ? '#94a3b8' : '#0f172a',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                +
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              testing persistence
            </div>
          </div>
        </>
      )}

      {status === 'error' && (
        <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#dc2626' }}>
            Error
          </div>
        </div>
      )}

      {status === 'teardown' && (
        <div style={{ marginTop: 12, background: '#fefce8', border: '1px solid #fef08a', borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#a16207' }}>
            Teardown - Resource is being cleaned up
          </div>
        </div>
      )}
    </div>
  );
}

export default function RemoteUrlAppPage() {
  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100%', width: '100%', background: '#ffffff', display: 'flex', alignItems: 'flex-start' }}>
  
      <McpAppWithHook />
    </div>
  );
}
