import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

/**
 * MCP App for reviewing and applying description enhancements.
 * 
 * This component runs inside an iframe and communicates with the host
 * application via the MCP protocol. It receives tool arguments via streaming
 * and can call tools back to apply changes.
 */

type EnhancePayload = {
  original: string;
  enhanced: string;
  applied?: boolean;
};

export default function EnhanceMcpApp() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [localApplied, setLocalApplied] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<'original' | 'modified'>('modified');
  const [isApplying, setIsApplying] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  
  const {
    isInitialized,
    tool,
    callTool,
    client,
    reportSize,
  } = useMcpApp({
    containerRef: cardRef,
    autoReportSize: true,
    // Handle streaming tool arguments from the LLM
    onToolInputPartial: (params) => {
      const args = params.arguments as Record<string, unknown> | undefined;
      if (!args) return;
      
      // Capture streaming text as LLM writes it
      if (typeof args.enhanced_text === 'string') {
        setStreamingText(args.enhanced_text);
      }
      if (typeof args.original_text === 'string') {
        setOriginalText(args.original_text);
      }
    },
  });
  
  // Show comparison view when tool completes
  useEffect(() => {
    if (tool.result) {
      setTimeout(() => setShowComparison(true), 500);
    }
  }, [tool.result]);

  // Get final text from result or streaming state
  const displayText = streamingText || (tool.result as EnhancePayload)?.enhanced || '';
  const displayOriginal = originalText || (tool.result as EnhancePayload)?.original || '';
  const isStreaming = tool.isStreaming && tool.status !== 'complete';

  // Apply the selected version by calling the host's updateDescription tool
  const applyVersion = useCallback(async (version: 'original' | 'modified') => {
    const descriptionToApply = version === 'modified' ? displayText : displayOriginal;
    if (!descriptionToApply) return;

    setIsApplying(true);
    setSelectedVersion(version);
    
    try {
      // Call the tool defined in the host's ModelContext
      await callTool('updateDescription', { description: descriptionToApply });
      setLocalApplied(true);

      // Persist state so it survives page refresh
      await client.sendRequest('ui/message', {
        role: 'user',
        content: {
          type: 'botdojo/persist',
          state: { applied: true, selectedVersion: version },
        },
      });
    } catch (err) {
      console.error('Failed to apply:', err);
    } finally {
      setIsApplying(false);
    }
  }, [displayText, displayOriginal, callTool, client]);

  if (!isInitialized) {
    return null;
  }

  return (
    <div ref={cardRef} style={{ padding: '16px', background: '#fff', borderRadius: '12px' }}>
      <h3>✨ Enhanced Description</h3>
      
      {!showComparison ? (
        // Streaming view - show text as it's being written
        <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
          {displayText}
          {isStreaming && <span style={{ opacity: 0.5 }}>▌</span>}
        </div>
      ) : (
        // Comparison view - side by side with selection
        <div style={{ display: 'flex', gap: '12px' }}>
          <div 
            onClick={() => !isApplying && applyVersion('original')}
            style={{
              flex: 1,
              padding: '12px',
              border: selectedVersion === 'original' ? '2px solid #10b981' : '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <strong>Original</strong>
            <p>{displayOriginal}</p>
          </div>
          
          <div 
            onClick={() => !isApplying && applyVersion('modified')}
            style={{
              flex: 1,
              padding: '12px',
              border: selectedVersion === 'modified' ? '2px solid #10b981' : '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <strong>Modified</strong>
            <p>{displayText}</p>
          </div>
        </div>
      )}
      
      {showComparison && (
        <div style={{ marginTop: '12px', textAlign: 'center', color: '#10b981' }}>
          {localApplied ? '✓ Applied' : 'Click a version to apply'}
        </div>
      )}
    </div>
  );
}

