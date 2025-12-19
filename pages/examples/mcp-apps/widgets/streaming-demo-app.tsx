import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

/**
 * Streaming Demo MCP App
 * A beautiful MCP App that demonstrates streaming progress with animations
 */
function StreamingDemoApp() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [toolProgress, setToolProgress] = useState<{
    stepId?: string;
    stepLabel?: string;
    kind?: string;
  } | null>(null);

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
      if (params.arguments?.kind === 'botdojo-tool-progress') {
        setToolProgress(params.arguments);
      }
    },
  });

  const [busy, setBusy] = useState(false);
  const steps = ['step-1', 'step-2', 'step-3'] as const;

  // Counter state from hostContext
  const [state, setState] = useState<{ counter?: number } | null>(null);
  const counter = state?.counter ?? 0;
  
  useEffect(() => {
    if (!hostContext) return;
    if (state) return;
    setState(hostContext.state as { counter?: number } | undefined ?? { counter: 0 });
  }, [hostContext, state]);

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

  const isComplete = isInitialized && !tool.isStreaming && 
    (tool.status === 'complete' || tool.status === 'idle');
  const isStreaming = !isComplete;

  const currentStepIndex = toolProgress?.stepId 
    ? steps.indexOf(toolProgress.stepId as typeof steps[number])
    : -1;

  const handleAction = useCallback(async (type: string) => {
    setBusy(true);
    try {
      switch (type) {
        case 'tool':
          await callTool('demo_action', { action: 'tool_call', timestamp: Date.now() });
          break;
        case 'message':
          await sendMessage([{ type: 'text', text: `Hello from Streaming Demo App! (count: ${counter})` }]);
          break;
        case 'link':
          await openLink('https://botdojo.com/docs');
          break;
      }
    } finally {
      setBusy(false);
    }
  }, [sendMessage, callTool, openLink, counter]);

  // Spinner component
  const Spinner = ({ size = 20 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );

  // Progress bar component
  const ProgressBar = ({ progress }: { progress: number }) => (
    <div style={{
      width: '100%',
      height: '8px',
      background: '#e2e8f0',
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${progress}%`,
        height: '100%',
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        borderRadius: '4px',
        transition: 'width 0.5s ease-out',
      }} />
    </div>
  );

  return (
    <div
      ref={cardRef}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        color: '#0f172a',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        fontFamily: 'Inter, system-ui, sans-serif',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>
              Streaming Demo
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              MCP App with Progress
            </div>
          </div>
        </div>
        <div style={{
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 600,
          background: isInitialized ? '#dcfce7' : '#fef3c7',
          color: isInitialized ? '#166534' : '#92400e',
        }}>
          {isInitialized ? '● Connected' : '○ Connecting...'}
        </div>
      </div>

      {/* Streaming State */}
      {isStreaming && (
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
        }}>
          {!isInitialized ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Spinner />
              <span style={{ fontSize: '14px', color: '#64748b' }}>Initializing...</span>
            </div>
          ) : currentStepIndex === -1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Spinner />
              <span style={{ fontSize: '14px', color: '#64748b' }}>Waiting for data...</span>
            </div>
          ) : (
            <>
              {/* Progress Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Spinner size={16} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    Processing...
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>

              {/* Progress Bar */}
              <ProgressBar progress={((currentStepIndex + 1) / steps.length) * 100} />

              {/* Step Label */}
              <div style={{ 
                marginTop: '12px', 
                fontSize: '13px', 
                color: '#6366f1',
                fontWeight: 500,
              }}>
                {toolProgress?.stepLabel}
              </div>

              {/* Steps Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '8px',
                marginTop: '16px',
              }}>
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div
                      key={step}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: isCompleted ? '#dcfce7' : isCurrent ? '#eef2ff' : '#ffffff',
                        border: `1px solid ${isCompleted ? '#22c55e' : isCurrent ? '#6366f1' : '#e2e8f0'}`,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ 
                        fontSize: '18px', 
                        marginBottom: '4px',
                      }}>
                        {isCompleted ? '✓' : isCurrent ? <Spinner size={18} /> : '○'}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: 600,
                        color: isCompleted ? '#166534' : isCurrent ? '#4f46e5' : '#94a3b8',
                        textTransform: 'uppercase',
                      }}>
                        Step {idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Complete State - Action Buttons */}
      {isComplete && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Success Message */}
          <div style={{
            background: 'linear-gradient(135deg, #dcfce7, #d1fae5)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
            }}>
              ✓
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#166534' }}>
                Ready to Interact
              </div>
              <div style={{ fontSize: '12px', color: '#15803d' }}>
                Click buttons below to send events to the host
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { type: 'tool', icon: '🔧', label: 'Tool Call', color: '#ef4444' },
              { type: 'message', icon: '💬', label: 'Message', color: '#0284c7' },
              { type: 'link', icon: '🔗', label: 'Open Link', color: '#6366f1' },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleAction(btn.type)}
                disabled={busy}
                style={{
                  padding: '14px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: busy ? '#f1f5f9' : '#ffffff',
                  boxShadow: busy ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '20px' }}>{btn.icon}</span>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 600,
                  color: busy ? '#94a3b8' : btn.color,
                }}>
                  {btn.label}
                </span>
              </button>
            ))}
          </div>

          {/* Counter Section */}
          <div style={{ 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '16px',
            marginTop: '12px',
          }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: '#475569', 
              marginBottom: '12px',
              textAlign: 'center',
            }}>
              Counter (Testing Persistence)
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'center', 
              justifyContent: 'center',
            }}>
              <button
                onClick={() => persistCounter(counter - 1)}
                disabled={busy}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: busy ? '#f1f5f9' : '#ffffff',
                  color: busy ? '#94a3b8' : '#0f172a',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                  fontWeight: 600,
                  fontSize: '18px',
                  minWidth: '50px',
                }}
              >
                -
              </button>
              <div style={{ 
                fontWeight: 800, 
                fontSize: '24px', 
                color: '#0f172a', 
                minWidth: '60px', 
                textAlign: 'center' 
              }}>
                {counter}
              </div>
              <button
                onClick={() => persistCounter(counter + 1)}
                disabled={busy}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: busy ? '#f1f5f9' : '#ffffff',
                  color: busy ? '#94a3b8' : '#0f172a',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                  fontWeight: 600,
                  fontSize: '18px',
                  minWidth: '50px',
                }}
              >
                +
              </button>
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#94a3b8', 
              textAlign: 'center',
              marginTop: '8px',
            }}>
              State persists across widget reloads
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Status: <span style={{ fontWeight: 600 }}>{tool.status}</span>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Powered by <span style={{ fontWeight: 600 }}>useMcpApp</span>
        </div>
      </div>
    </div>
  );
}

export default function StreamingDemoPage() {
  return (
    <div style={{ 
      margin: 0, 
      padding: 0, 
      height: '100%', 
      width: '100%', 
      background: '#ffffff',
    }}>
      <StreamingDemoApp />
    </div>
  );
}
