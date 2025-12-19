import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

/**
 * Enhancement MCP App using useMcpApp hook
 * Shows streaming text first, then transitions to side-by-side comparison
 * Selecting Modified automatically applies the change via tool call
 */

type EnhancePayload = {
  original: string;
  enhanced: string;
  appId?: string;
  applied?: boolean;
};

const derivePayload = (data: any): EnhancePayload | null => {
  if (!data) return null;

  // Handle enhancePayload wrapper
  if (data.enhancePayload) {
    return {
      ...data.enhancePayload,
      applied: data.enhancePayload.applied ?? data.applied ?? false,
    };
  }
  
  // Direct format with enhanced_text (streaming from LLM arguments)
  if (data.enhanced_text !== undefined) {
    return {
      original: data.original || data.original_text || '',
      enhanced: data.enhanced_text,
      applied: data.applied ?? false,
    };
  }
  
  // Direct format with enhanced field
  if (data.enhanced !== undefined) {
    return {
      original: data.original || '',
      enhanced: data.enhanced,
      applied: data.applied ?? false,
    };
  }

  return null;
};

function EnhanceMcpApp() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [localApplied, setLocalApplied] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<'original' | 'modified'>('modified');
  const [isApplying, setIsApplying] = useState(false);
  
  // Local state for streaming content
  const [streamingText, setStreamingText] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>('');
  
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
      console.log('[enhance-mcp-app] onToolInputPartial:', JSON.stringify(params, null, 2));
      const args = params.arguments as Record<string, unknown> | undefined;
      if (!args) return;
      
      // Skip progress updates
      if (args.kind === 'botdojo-tool-progress') return;
      
      // Capture LLM streaming arguments
      if (typeof args.enhanced_text === 'string') {
        setStreamingText(args.enhanced_text);
      }
      if (typeof args.original_text === 'string') {
        setOriginalText(args.original_text);
      }
      
      // Handle enhancePayload from notifyToolInputPartial
      const enhancePayload = args.enhancePayload as Record<string, unknown> | undefined;
      if (enhancePayload) {
        if (typeof enhancePayload.enhanced === 'string') {
          setStreamingText(enhancePayload.enhanced);
        }
        if (typeof enhancePayload.original === 'string') {
          setOriginalText(enhancePayload.original);
        }
      }
    },
  });
  
  // Clear streaming and show comparison when tool completes
  useEffect(() => {
    if (tool.result) {
      // Short delay to show completed text before transition
      setTimeout(() => {
        setShowComparison(true);
      }, 500);
    }
  }, [tool.result]);

  // Derive payload from final sources
  const derivedFromResult = derivePayload(tool.result);
  const derivedFromState = derivePayload(hostContext?.state);
  
  // Check if we're currently streaming
  const isComplete = tool.status === 'complete' || tool.status === 'idle';
  const isStreaming = tool.isStreaming && !isComplete && !derivedFromResult;
  
  // Build the display content
  const displayText = isStreaming ? streamingText : (derivedFromResult?.enhanced || derivedFromState?.enhanced || streamingText);
  const displayOriginal = originalText || derivedFromResult?.original || derivedFromState?.original || '';
  
  // Use derivedFromResult for final payload
  const payload = localApplied 
    ? (derivedFromState || derivedFromResult)
    : (derivedFromResult || derivedFromState);
  
  const isApplied = localApplied || payload?.applied || derivedFromState?.applied;
  
  // Manual size reporting when content changes
  const manualReportSize = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const height = Math.ceil(rect.height) + 24;
    const width = Math.ceil(rect.width);
    if (width > 0 && height > 0) {
      reportSize(width, height);
    }
  }, [reportSize]);
  
  useEffect(() => {
    const timer = setTimeout(manualReportSize, 50);
    return () => clearTimeout(timer);
  }, [displayText, isStreaming, isApplied, showComparison, manualReportSize]);

  // Load persisted applied state on mount
  useEffect(() => {
    const state = hostContext?.state as Record<string, unknown> | undefined;
    if (state?.applied) {
      setLocalApplied(true);
      setShowComparison(true);
    }
  }, [hostContext?.state]);

  const applyVersion = useCallback(async (version: 'original' | 'modified') => {
    // Don't re-apply if already selected and applied
    if (version === selectedVersion && localApplied) return;
    
    const descriptionToApply = version === 'modified' ? displayText : displayOriginal;
    if (!descriptionToApply) return;

    setIsApplying(true);
    setSelectedVersion(version);
    
    try {
      console.log('[enhance-mcp-app] applying version:', version, 'description:', descriptionToApply);
      const result = await callTool('updateDescription', {
        description: descriptionToApply,
      });
      console.log('[enhance-mcp-app] apply result:', result);

      setLocalApplied(true);

      // Persist applied state
      await client.sendRequest('ui/message', {
        role: 'user',
        content: {
          type: 'botdojo/persist',
          state: { applied: true, selectedVersion: version },
        },
      });
    } catch (err) {
      console.error('[enhance-mcp-app] Failed to apply', err);
    } finally {
      setIsApplying(false);
    }
  }, [displayText, displayOriginal, selectedVersion, localApplied, callTool, client]);

  // Load persisted selected version
  useEffect(() => {
    const state = hostContext?.state as Record<string, unknown> | undefined;
    if (state?.selectedVersion === 'original' || state?.selectedVersion === 'modified') {
      setSelectedVersion(state.selectedVersion);
    }
  }, [hostContext?.state]);

  // Check if running standalone (direct URL access) vs in MCP context
  const isStandalone = typeof window !== 'undefined' && !window.parent?.postMessage;
  
  if (!isInitialized && !isStandalone) {
    return <></>
  }
  
  // For standalone preview, show mock data
  const previewMode = !isInitialized;
  const previewOriginal = "A solid oak dining chair. Comfortable and sturdy.";
  const previewEnhanced = "Experience timeless elegance with our handcrafted Oak Dining Chair. Made from sustainably sourced solid oak, this chair combines classic craftsmanship with modern comfort. The ergonomic design provides exceptional support, while the natural wood grain adds warmth to any dining space.";

  return (
    <div
      ref={cardRef}
      style={{
        padding: '16px',
        borderRadius: '14px',
        background: '#ffffff',
        color: '#0f172a',
        border: `2px solid ${isApplied ? '#10b981' : '#6366f1'}`,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        transition: 'border-color 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>✨</span>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 700, 
            color: (localApplied || previewMode) ? '#10b981' : '#6366f1',
          }}>
            {previewMode 
              ? 'Enhanced Description (Preview)' 
              : localApplied 
                ? 'Description Applied' 
                : isStreaming 
                  ? 'Writing enhanced description...' 
                  : showComparison 
                    ? 'Select a version to apply' 
                    : 'Enhanced Description'}
          </span>
        </div>
        {(localApplied || previewMode) && (
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>✓</span>
        )}
      </div>

      {/* Content - either streaming or side-by-side */}
      {previewMode ? (
        // Preview mode - show side-by-side with mock data
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Original */}
          <div style={{ 
            flex: 1,
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              color: '#64748b', 
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}>
              Original
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              {previewOriginal}
            </div>
          </div>
          
          {/* Modified */}
          <div style={{ 
            flex: 1,
            padding: '12px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '2px solid #10b981',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              color: '#10b981', 
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}>
              Modified
            </div>
            <div style={{ fontSize: '12px', color: '#0f172a', lineHeight: 1.5 }}>
              {previewEnhanced}
            </div>
          </div>
        </div>
      ) : !showComparison ? (
        // Streaming mode - just show the enhanced text being written
        <div style={{ minHeight: '80px' }}>
          <div style={{ 
            fontSize: '13px', 
            lineHeight: 1.6, 
            color: '#0f172a',
            whiteSpace: 'pre-wrap',
          }}>
            {displayText}
            {isStreaming && (
              <span style={{ 
                display: 'inline-block',
                width: '2px',
                height: '1em',
                background: '#6366f1',
                marginLeft: '2px',
                animation: 'blink 1s step-end infinite',
                verticalAlign: 'text-bottom',
              }} />
            )}
          </div>
          {!displayText && !isStreaming && (
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Preparing enhancement…</div>
          )}
        </div>
      ) : (
        // Side-by-side comparison mode - clickable cards (can toggle between versions)
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Original - clickable */}
          <div 
            onClick={() => !isApplying && applyVersion('original')}
            style={{ 
              flex: 1,
              padding: '12px',
              background: selectedVersion === 'original' && localApplied ? '#f0fdf4' : '#f8fafc',
              borderRadius: '8px',
              border: selectedVersion === 'original' 
                ? `2px solid ${localApplied ? '#10b981' : '#6366f1'}` 
                : '1px solid #e2e8f0',
              cursor: isApplying ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              opacity: isApplying ? 0.7 : 1,
            }}
          >
            {/* Selection indicator for Original */}
            {selectedVersion === 'original' && localApplied && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              color: selectedVersion === 'original' && localApplied ? '#10b981' : '#64748b', 
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}>
              Original
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              {displayOriginal}
            </div>
          </div>
          
          {/* Modified - clickable */}
          <div 
            onClick={() => !isApplying && applyVersion('modified')}
            style={{ 
              flex: 1,
              padding: '12px',
              background: selectedVersion === 'modified' && localApplied ? '#f0fdf4' : '#ffffff',
              borderRadius: '8px',
              border: selectedVersion === 'modified' 
                ? `2px solid ${localApplied ? '#10b981' : '#6366f1'}` 
                : '1px solid #e2e8f0',
              position: 'relative',
              cursor: isApplying ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isApplying ? 0.7 : 1,
            }}
          >
            {/* Selection indicator for Modified */}
            {selectedVersion === 'modified' && localApplied && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              color: selectedVersion === 'modified' && localApplied ? '#10b981' : '#64748b', 
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}>
              Modified
            </div>
            <div style={{ fontSize: '12px', color: '#0f172a', lineHeight: 1.5 }}>
              {displayText}
            </div>
          </div>
        </div>
      )}

      {/* Status message */}
      {(showComparison || previewMode) && (
        <div style={{
          padding: '8px 12px',
          background: (localApplied || previewMode) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 500,
          color: (localApplied || previewMode) ? '#10b981' : '#6366f1',
          textAlign: 'center',
        }}>
          {previewMode 
            ? '✓ Preview mode - Description updated' 
            : isApplying 
              ? 'Applying...'
              : localApplied 
                ? `✓ ${selectedVersion === 'modified' ? 'Enhanced' : 'Original'} description applied · Click to switch` 
                : 'Click a version to apply'}
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function EnhanceMcpAppPage() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
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
        Loading…
      </div>
    );
  }

  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100%', width: '100%', background: '#ffffff', display: 'flex', alignItems: 'flex-start' }}>
      <EnhanceMcpApp />
    </div>
  );
}
