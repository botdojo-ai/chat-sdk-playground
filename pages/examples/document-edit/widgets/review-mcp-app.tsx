import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

/**
 * Review MCP App using useMcpApp hook
 * Streams the suggested update text while tool arguments are streaming
 */

type ReviewPayload = {
  before: string;
  after: string;
  summary?: string;
  canvasId?: string;
  applied?: boolean;
};

const derivePayload = (data: any): ReviewPayload | null => {
  if (!data) return null;

  // Handle diffPayload wrapper
  if (data.diffPayload) {
    return {
      ...data.diffPayload,
      applied: data.diffPayload.applied ?? data.applied ?? false,
    };
  }
  
  // Direct format with updated_markdown (streaming from LLM arguments)
  if (data.updated_markdown !== undefined) {
    return {
      before: data.before || '',
      after: data.updated_markdown,
      summary: data.summary,
      applied: data.applied ?? false,
    };
  }
  
  // Direct format with after field
  if (data.after !== undefined) {
    return {
      before: data.before || '',
      after: data.after,
      summary: data.summary,
      applied: data.applied ?? false,
    };
  }

  return null;
};

function ReviewMcpApp() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [localApplied, setLocalApplied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Review and apply the suggested update.');
  
  // Local state for streaming content - capture from onToolInputPartial
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingSummary, setStreamingSummary] = useState<string>('');
  
  const {
    isInitialized,
    hostContext,
    tool,
    callTool,
    client,
    reportSize,
  } = useMcpApp({
    containerRef: cardRef,
    autoReportSize: true,
    onToolInputPartial: (params) => {
      console.log('[review-mcp-app] onToolInputPartial:', JSON.stringify(params, null, 2));
      const args = params.arguments as Record<string, unknown> | undefined;
      if (!args) return;
      
      // Skip progress updates
      if (args.kind === 'botdojo-tool-progress') return;
      
      // Capture LLM streaming arguments
      if (typeof args.updated_markdown === 'string') {
        setStreamingText(args.updated_markdown);
      }
      if (typeof args.summary === 'string') {
        setStreamingSummary(args.summary);
      }
      
      // Handle diffPayload from notifyToolInputPartial
      const diffPayload = args.diffPayload as Record<string, unknown> | undefined;
      if (diffPayload) {
        if (typeof diffPayload.after === 'string') {
          setStreamingText(diffPayload.after);
        }
        if (typeof diffPayload.summary === 'string') {
          setStreamingSummary(diffPayload.summary);
        }
      }
    },
  });
  
  // Debug logging
  useEffect(() => {
    console.log('[review-mcp-app] tool state:', {
      isStreaming: tool.isStreaming,
      status: tool.status,
      hasPartialUpdate: !!tool.partialUpdate,
      partialUpdate: tool.partialUpdate,
      hasArguments: !!tool.arguments,
      arguments: tool.arguments,
      hasResult: !!tool.result,
    });
  }, [tool]);
  
  // Clear streaming content when tool completes
  useEffect(() => {
    if (tool.result) {
      setStreamingText('');
      setStreamingSummary('');
    }
  }, [tool.result]);

  // Derive payload from final sources
  const derivedFromResult = derivePayload(tool.result);
  const derivedFromState = derivePayload(hostContext?.state);
  
  // Check if we're currently streaming
  // Tool is streaming if: isStreaming flag is true AND status is not 'complete'/'idle' AND no result yet
  const isComplete = tool.status === 'complete' || tool.status === 'idle';
  const isStreaming = tool.isStreaming && !isComplete && !derivedFromResult;
  
  // Debug log streaming state
  useEffect(() => {
    console.log('[review-mcp-app] streaming state:', {
      toolIsStreaming: tool.isStreaming,
      toolStatus: tool.status,
      isComplete,
      derivedFromResult: !!derivedFromResult,
      calculatedIsStreaming: isStreaming,
      streamingText: streamingText?.substring(0, 50),
    });
  }, [tool.isStreaming, tool.status, isComplete, derivedFromResult, isStreaming, streamingText]);
  
  // Build the display content
  // During streaming: show streamingText
  // After completion: show result
  const displayText = isStreaming ? streamingText : (derivedFromResult?.after || derivedFromState?.after || '');
  const displaySummary = isStreaming ? streamingSummary : (derivedFromResult?.summary || derivedFromState?.summary || '');
  
  // Use derivedFromResult for final payload (for apply button etc)
  const payload = localApplied 
    ? (derivedFromState || derivedFromResult)
    : (derivedFromResult || derivedFromState);
  
  // Determine if we should show the "applied" badge
  const isApplied = localApplied || payload?.applied || derivedFromState?.applied;
  
  // Manual size reporting when content changes
  const manualReportSize = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const height = Math.ceil(rect.height) + 24; // Add padding
    const width = Math.ceil(rect.width);
    if (width > 0 && height > 0) {
      reportSize(width, height);
    }
  }, [reportSize]);
  
  // Report size whenever content changes
  useEffect(() => {
    const timer = setTimeout(manualReportSize, 50);
    return () => clearTimeout(timer);
  }, [displayText, isStreaming, isApplied, manualReportSize]);
  
  // Update status message based on state
  useEffect(() => {
    if (isApplied) {
      setStatusMessage('Already applied.');
    } else if (isStreaming) {
      setStatusMessage('Receiving suggestion…');
    } else if (payload) {
      setStatusMessage('Review and apply the suggested update.');
    }
  }, [isApplied, isStreaming, payload]);

  // Load persisted applied state on mount
  useEffect(() => {
    const state = hostContext?.state as Record<string, unknown> | undefined;
    if (state?.applied) {
      setLocalApplied(true);
    }
  }, [hostContext?.state]);

  const applyChanges = useCallback(async () => {
    if (!payload || !payload.after) return;
    setIsApplying(true);
    setStatusMessage('Sending apply intent…');

    try {
      // Send intent via tools/call
      const result = await callTool('apply-markdown', {
        markdown: payload.after,
        canvasId: payload.canvasId,
      });
      console.log('[review-mcp-app] apply intent result:', result);

      // Update local state
      setLocalApplied(true);
      setStatusMessage('Applied to editor.');

      // Persist applied state using ui/message with botdojo/persist type
      const appliedPayload = { ...payload, applied: true };
      await client.sendRequest('ui/message', {
        role: 'user',
        content: {
          type: 'botdojo/persist',
          state: { applied: true, diffPayload: appliedPayload },
        },
      });
    } catch (err) {
      console.error('[review-mcp-app] Failed to apply', err);
      setStatusMessage('Something went wrong.');
    } finally {
      setIsApplying(false);
    }
  }, [payload, callTool, client]);

  const dismiss = useCallback(async () => {
    if (!payload) return;
    try {
      await callTool('dismiss-suggestion', {
        canvasId: payload.canvasId,
      });
    } catch (err) {
      console.log('[review-mcp-app] dismiss error:', err);
    }
    setStatusMessage('Dismissed.');
    
    // Persist dismissed state
    try {
      await client.sendRequest('ui/message', {
        role: 'user',
        content: {
          type: 'botdojo/persist',
          state: { applied: false, dismissed: true, diffPayload: { ...payload, applied: false } },
        },
      });
    } catch (err) {
      console.log('[review-mcp-app] persist dismiss error:', err);
    }
  }, [payload, callTool, client]);

  if (!isInitialized) {
    return null;
  }

  const showApplyButton = payload && !isApplied && !isStreaming;
  const showAppliedBadge = isApplied;
  const afterContent = displayText;

  return (
    <div
      ref={cardRef}
      style={{
        padding: '20px',
        borderRadius: '18px',
        background: 'linear-gradient(145deg, #ffffff, #f4f6fb)',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        boxShadow: '0 16px 42px rgba(15,23,42,0.08)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', width: '100%' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            Suggested Update
            {isStreaming && (
              <span style={{ 
                fontSize: 11, 
                fontWeight: 500, 
                color: '#6366f1', 
                marginLeft: 8,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}>
                (streaming…)
              </span>
            )}
            <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', marginLeft: 8 }}>(useMcpApp)</span>
          </div>
          {displaySummary && (
            <div style={{ color: '#475569', fontSize: '13px' }}>{displaySummary}</div>
          )}
          {!displayText && !isStreaming && (
            <div style={{ color: '#475569', fontSize: '13px' }}>Preparing suggestion…</div>
          )}
        </div>
        {isInitialized && (
          <div style={{ 
            padding: '4px 8px', 
            background: isStreaming ? '#eef2ff' : '#dcfce7', 
            color: isStreaming ? '#4f46e5' : '#166534', 
            borderRadius: 6, 
            fontSize: 11, 
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            {isStreaming ? 'Streaming' : 'Ready'}
          </div>
        )}
      </div>

      {/* Content Preview */}
      {afterContent && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px',
          color: '#0f172a',
          fontSize: '13px',
          lineHeight: 1.6,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '8px', color: '#2563eb' }}>
            Updated markdown
            {isStreaming && (
              <span style={{ 
                fontWeight: 500, 
                color: '#6366f1', 
                marginLeft: 8,
                fontSize: '11px',
              }}>
                ● typing...
              </span>
            )}
          </div>
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
            background: '#ffffff',
            borderRadius: '10px',
            padding: '12px',
            border: `1px solid ${isStreaming ? '#c7d2fe' : '#e2e8f0'}`,
            color: '#0f172a',
            maxHeight: '420px',
            overflow: 'auto',
            transition: 'border-color 0.2s ease',
          }}>
            {afterContent}
            {isStreaming && (
              <span style={{ 
                display: 'inline-block',
                width: '2px',
                height: '1em',
                background: '#6366f1',
                marginLeft: '2px',
                animation: 'blink 1s step-end infinite',
              }} />
            )}
          </pre>
        </div>
      )}

      {/* Actions */}
      {showApplyButton && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={applyChanges}
            disabled={!isInitialized || isApplying || isStreaming}
            style={{
              padding: '10px 16px',
              background: isInitialized && !isStreaming
                ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: isInitialized && !isApplying && !isStreaming ? 'pointer' : 'not-allowed',
              boxShadow: isInitialized && !isStreaming
                ? '0 12px 30px rgba(37,99,235,0.25)'
                : 'none',
              transition: 'transform 0.15s ease, box-shadow 0.2s ease',
              opacity: isStreaming ? 0.6 : 1,
            }}
          >
            {isApplying ? 'Applying…' : isStreaming ? 'Wait for completion' : 'Apply changes'}
          </button>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>{statusMessage}</div>
        </div>
      )}

      {showAppliedBadge && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '12px' }}>
          ✓ Applied to editor
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default function ReviewMcpAppPage() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    // Reset body styles for iframe
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.documentElement.style.background = '#ffffff';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.background = '#ffffff';

    return () => {
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.background = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.background = '';
    };
  }, []);

  if (!hydrated) {
    return (
      <div style={{ minHeight: '100vh', padding: '20px', background: '#ffffff', color: '#0f172a' }}>
        Loading canvas…
      </div>
    );
  }

  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100%', width: '100%', background: '#ffffff', display: 'flex', alignItems: 'flex-start' }}>
      <ReviewMcpApp />
    </div>
  );
}
