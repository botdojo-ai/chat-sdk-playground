import { useCallback, useEffect, useMemo, useRef, useState } from 'react';



type ReviewPayload = {
  before: string;
  after: string;
  summary?: string;
  canvasId?: string;
  applied?: boolean;
};

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer?: ReturnType<typeof setTimeout>;
};

const LOG_PREFIX = '[review-native]';

const derivePayload = (data: any, fallback: ReviewPayload | null): ReviewPayload | null => {
  if (!data) return fallback;

  const source = data?.persistedData
    ? data.persistedData
    : data?.initialData
      ? data.initialData
      : data;

  const persisted = source?.persistedData;
  if (persisted) {
    if (persisted.diffPayload) {
      return {
        ...persisted.diffPayload,
        applied: persisted.applied ?? persisted.diffPayload.applied ?? source.applied ?? false,
      };
    }
    if (persisted.after && persisted.before) {
      return { ...persisted, applied: persisted.applied ?? source.applied ?? false };
    }
  }
  
  if (source?.diffPayload) {
    return { ...source.diffPayload, applied: source.diffPayload.applied ?? source.applied ?? false };
  }
  if (source?.after && source?.before) {
    return { ...source, applied: source.applied ?? false };
  }
  // Handle tool arguments format with updated_markdown (from history reload)
  if (source?.updated_markdown) {
    return {
      before: '', // Original not available from arguments alone
      after: source.updated_markdown,
      summary: source.summary,
      applied: source.applied ?? false,
    };
  }
  if (fallback) {
    return { ...fallback, applied: fallback.applied ?? false };
  }
  return null;
};

function NativeReviewCard() {
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [status, setStatus] = useState<string>('Review and apply the suggested update.');
  const [isApplying, setIsApplying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [hostInfo, setHostInfo] = useState<any>(null);
  // Separate state for tool progress updates (from notifyToolInputPartial with kind: 'botdojo-tool-progress')
  const [toolProgress, setToolProgress] = useState<Record<string, unknown> | null>(null);
  
  const cardRef = useRef<HTMLDivElement | null>(null);
  const pendingRequests = useRef<Map<string | number, PendingRequest>>(new Map());
  const nextId = useRef(1);
  const parentOrigin = useRef<string>('*');

  const log = useCallback((msg: string) => {
    console.log(`${LOG_PREFIX} ${msg}`);
  }, []);

  const sendResponse = useCallback((id: string | number, result: any) => {
    if (typeof window === 'undefined') return;
    window.parent?.postMessage({ jsonrpc: '2.0', id, result }, parentOrigin.current || '*');
  }, []);

  const sendNotification = useCallback((method: string, params?: Record<string, any>) => {
    if (typeof window === 'undefined') return;
    log(`postNotification ${method} ${JSON.stringify(params)}`);
    window.parent?.postMessage({ jsonrpc: '2.0', method, params }, parentOrigin.current || '*');
  }, [log]);

  const sendRequest = useCallback(
    (method: string, params?: Record<string, any>) => {
      if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));
      const id = `ui-${nextId.current++}`;
      const payload = { jsonrpc: '2.0', id, method, params };
      log(`postRequest ${method}#${id} ${JSON.stringify(params)}`);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingRequests.current.delete(id);
          reject(new Error(`Request timed out: ${method}`));
        }, 10000);
        pendingRequests.current.set(id, { resolve, reject, timer });
        window.parent?.postMessage(payload, parentOrigin.current || '*');
      });
    },
    [log],
  );

  // Handle incoming messages
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.jsonrpc !== '2.0') return;

      if (parentOrigin.current === '*' && event.origin) {
        parentOrigin.current = event.origin;
        log(`learned parent origin ${parentOrigin.current}`);
      }

      // Handle responses to our requests
      if (data?.id && pendingRequests.current.has(data.id)) {
        log(`response#${data.id} ${JSON.stringify(data)}`);
        const pending = pendingRequests.current.get(data.id);
        if (pending?.timer) clearTimeout(pending.timer);
        pendingRequests.current.delete(data.id);
        if ('error' in data) pending?.reject(data.error);
        else pending?.resolve(data.result);
        return;
      }

      const { method, params, id } = data;
      log(`incoming ${method || '(no-method)'} id=${id ?? 'none'} params=${JSON.stringify(params)}`);
      if (!method) return;

      // Handle host-initiated requests
      if (id !== undefined) {
        switch (method) {
          case 'ui/initialize': {
            setHostInfo(params?.hostInfo || params?.appInfo || null);
            const hostContext: any = params?.hostContext || {};
            const state = hostContext.state || {};
            const toolInfo = hostContext.toolInfo;
            
            log(`ui/initialize toolInfo=${JSON.stringify(toolInfo)} state=${JSON.stringify(state)}`);
            
            // Tool is streaming until we receive tool-result notification
            setIsStreaming(true);
            
            // Priority 1: Use persisted state (source of truth after user actions like Apply)
            // The state is persisted via ui/update and loaded back on refresh
            if (state.diffPayload) {
              log(`Using persisted state with diffPayload, applied=${state.applied}`);
              const restoredPayload = { ...state.diffPayload, applied: state.applied ?? state.diffPayload.applied ?? false };
              setPayload(restoredPayload);
              setStatus(restoredPayload.applied ? 'Already applied.' : 'Review and apply the suggested update.');
              setIsInitialized(true);
              sendResponse(id, { ok: true });
              sendNotification('ui/notifications/initialized', { hostInfo: params?.hostInfo });
              log(`ui/initialize handled from persisted state, applied=${restoredPayload.applied}`);
              return;
            }
            
            // Tool arguments will come via ui/notifications/tool-input
            setStatus('Receiving suggestion…');
            
            setIsInitialized(true);
            sendResponse(id, { ok: true });
            sendNotification('ui/notifications/initialized', { hostInfo: params?.hostInfo });
            log(`ui/initialize handled, waiting for tool-input notification`);
            return;
          }
          default:
            log(`unhandled request ${method}`);
            sendResponse(id, { ok: true, ignored: true, method });
            return;
        }
      }

      // Handle notifications from host
      switch (method) {
        case 'ui/notifications/tool-input': {
          // Final tool arguments from LLM (streaming complete, execution starting)
          log(`tool-input ${JSON.stringify(params?.arguments)}`);
          const args = params?.arguments || {};
          const derived = args.diffPayload
            ? derivePayload(args.diffPayload, null)
            : derivePayload(args, null);
          if (derived) {
            // Don't overwrite an already-applied payload with stale data from session
            setPayload((prev) => {
              if (prev?.applied && !derived.applied) {
                log('Preserving already-applied state, ignoring stale tool-input');
                return prev;
              }
              return derived;
            });
            setStatus((prevStatus) => {
              if (prevStatus === 'Already applied.') return prevStatus;
              return derived.applied ? 'Already applied.' : 'New suggestion received.';
            });
          }
          break;
        }
        case 'ui/notifications/tool-input-partial': {
          log(`tool-input-partial ${JSON.stringify(params?.arguments)}`);
          const args = params?.arguments || {};
          
          // Check for _botdojoProgress marker to distinguish progress updates from actual arguments
          if (args._botdojoProgress) {
            // Progress update from tool execution - store in toolProgress, don't update payload
            const { _botdojoProgress, ...progressData } = args;
            log(`tool-input-partial: progress update ${JSON.stringify(progressData)}`);
            setToolProgress(progressData);
            break;
          }
          
          // Regular tool-input-partial with diff payload (from notifyToolInputPartial)
          const derived = args.diffPayload
            ? derivePayload(args.diffPayload, null)
            : derivePayload(args, null);
          if (derived) {
            // Don't overwrite an already-applied payload with stale data from session
            // On page refresh, host may send tool-input with old args after we've 
            // already loaded persisted state (with applied: true) from ui/initialize
            setPayload((prev) => {
              if (prev?.applied && !derived.applied) {
                log('Preserving already-applied state, ignoring stale tool-input-partial');
                return prev;
              }
              return derived;
            });
            setStatus((prevStatus) => {
              // Also preserve status if we kept the applied payload
              if (prevStatus === 'Already applied.') return prevStatus;
              return derived.applied ? 'Already applied.' : 'New suggestion received.';
            });
          }
          break;
        }
        case 'ui/notifications/tool-result':
          log(`tool-result ${JSON.stringify(params?.result)}`);
          // Clear toolProgress when tool completes (matches useMcpApp behavior)
          setToolProgress(null);
          setIsStreaming(false);
          if (payload) {
            setStatus(payload.applied ? 'Already applied.' : 'Review and apply the suggested update.');
          }
          break;
        case 'ui/notifications/host-context-changed':
        case 'ui/notifications/host-context-change':
          log(`host-context changed ${JSON.stringify(params)}`);
          if (params?.state) {
            const derived = derivePayload(params.state, null);
            if (derived) {
              setPayload(derived);
              setStatus(derived.applied ? 'Already applied.' : 'Updated suggestion.');
            }
          }
          break;
        default:
          log(`unhandled notification ${method}`);
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [log, sendResponse, sendNotification]);

  // Size reporting
  const emitSizeChange = useCallback((width: number, height: number) => {
    sendNotification('ui/size-change', { width, height });
  }, [sendNotification]);

  const reportSize = useCallback(() => {
    if (typeof window === 'undefined' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const measuredHeight = Math.ceil(rect.height) + 24;
    const measuredWidth = Math.ceil(rect.width);
    if (measuredWidth && measuredHeight) {
      emitSizeChange(measuredWidth, measuredHeight);
    }
  }, [emitSizeChange]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    reportSize();
    const onResize = () => reportSize();
    window.addEventListener('resize', onResize);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && cardRef.current) {
      observer = new ResizeObserver(() => reportSize());
      observer.observe(cardRef.current);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [reportSize]);

  useEffect(() => {
    reportSize();
  }, [payload, status, isApplying, reportSize]);

  const applyChanges = async () => {
    if (!payload) return;
    setIsApplying(true);
    setStatus('Sending apply intent…');

    try {
      // Send intent via tools/call
      const result = await sendRequest('tools/call', {
        name: 'apply-markdown',
        arguments: { markdown: payload.after, canvasId: payload.canvasId },
      });
      log(`apply intent result: ${JSON.stringify(result)}`);

      // Update local state
      const appliedPayload = { ...payload, applied: true };
      setPayload(appliedPayload);
      setStatus('Applied to editor.');

      // Persist applied state using ui/message with botdojo/persist content type
      await sendRequest('ui/message', { 
        role: 'user',
        content: {
          type: 'botdojo/persist',
          state: { applied: true, diffPayload: appliedPayload },
        },
      });

    } catch (err) {
      console.error('[review-native] Failed to apply', err);
      setStatus('Something went wrong.');
    } finally {
      setIsApplying(false);
    }
  };

  const dismiss = async () => {
    if (!payload) return;
    try {
      await sendRequest('tools/call', {
        name: 'dismiss-suggestion',
        arguments: { canvasId: payload.canvasId },
      });
    } catch (err) {
      log(`dismiss error: ${err}`);
    }
    setStatus('Dismissed.');
    // Persist dismissed state using ui/message with botdojo/persist content type
    try {
      await sendRequest('ui/message', { 
        role: 'user',
        content: {
          type: 'botdojo/persist',
          state: { applied: false, dismissed: true, diffPayload: { ...payload, applied: false } },
        },
      });
    } catch (err) {
      log(`persist dismiss error: ${err}`);
    }
  };

  if(!isInitialized) {
    return (
      <></>
    );
  }
 

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

    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',width: '100%' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            Suggested Update
            <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', marginLeft: 8 }}>(native)</span>
          </div>
          {payload && (
          <div style={{ color: '#475569', fontSize: '13px' }}>{payload.summary || 'Improved markdown'}</div>
          )}
          {!payload && (
            <div style={{ color: '#475569', fontSize: '13px' }}>Preparing suggestion…</div>
          )}
        </div>
      </div>
      
   {payload?.after && (
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
        <div style={{ fontWeight: 700, marginBottom: '8px', color: '#2563eb' }}>Updated markdown</div>
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
          background: '#ffffff',
          borderRadius: '10px',
          padding: '12px',
          border: '1px solid #e2e8f0',
          color: '#0f172a',
          maxHeight: '420px',
          overflow: 'auto',
        }}>
          {payload.after}
        </pre>
      </div>
      )}
      {payload &&!payload?.applied && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={applyChanges}
            disabled={!isInitialized || isApplying}
            style={{
              padding: '10px 16px',
              background: isInitialized
                ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: isInitialized && !isApplying ? 'pointer' : 'not-allowed',
              boxShadow: isInitialized
                ? '0 12px 30px rgba(37,99,235,0.25)'
                : 'none',
              transition: 'transform 0.15s ease, box-shadow 0.2s ease',
            }}
          >
            {isApplying ? 'Applying…' : 'Apply changes'}
          </button>
        
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>{status}</div>
        </div>
      )}

      {payload?.applied && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '12px' }}>
          ✓ Applied to editor
        </div>
      )}
   
     
      </>
    
    </div>
  );
}

export default function ReviewNativeCanvasPage() {

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
      <NativeReviewCard />
    </div>
  );
}

