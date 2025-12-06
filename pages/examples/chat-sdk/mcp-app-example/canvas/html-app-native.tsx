import React, { useCallback, useEffect, useRef, useState } from 'react';

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer?: ReturnType<typeof setTimeout>;
};

const LOG_PREFIX = '[html-app-native]';

function HtmlAppNativeCanvas() {
  const [counter, setCounter] = useState<number>(1);
  const [initialized, setInitialized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hostInfo, setHostInfo] = useState<any>(null);
  const [hydratedTool, setHydratedTool] = useState<any>({});
  const [status, setStatus] = useState<'starting' | 'streaming' | 'complete' | 'error' | 'teardown'>('starting');
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
        }, 5000);
        pendingRequests.current.set(id, { resolve, reject, timer });
        window.parent?.postMessage(payload, parentOrigin.current || '*');
      });
    },
    [log],
  );

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

      // Handle host-initiated requests (e.g., ui/initialize from AppBridge)
      if (id !== undefined) {
        switch (method) {
          case 'ui/initialize': {
            setHostInfo(params?.hostInfo || params?.appInfo || null);
            const hostContext = params?.hostContext || {};
            const state = hostContext.state || {};
            const toolInfo = hostContext.toolInfo;
            log(`ui/initialize toolInfo=${JSON.stringify(toolInfo)} state=${JSON.stringify(state)}`);
            
            // Hydrate counter from state
            if (state?.counter !== undefined) {
              setCounter(state.counter);
            }
            
            // Set tool name from toolInfo - arguments/results come via notifications
            if (toolInfo?.tool?.name) {
              setHydratedTool({ name: toolInfo.tool.name, stepId: toolInfo.id });
            }
            
            // Start in 'starting' status - will move to 'complete' when tool-result arrives
            setStatus('starting');
            
            sendResponse(id, { ok: true });
            sendNotification('ui/notifications/initialized', { hostInfo: params?.hostInfo });
            setInitialized(true);
            log('ui/initialize handled from host');
            return;
          }
          default:
            log(`unhandled request ${method}`);
            sendResponse(id, { ok: true, ignored: true, method });
            return;
        }
      }

      // Notifications from host
      switch (method) {
        case 'ui/notifications/tool-input':
          log(`tool-input ${JSON.stringify(params?.arguments)}`);
          setStatus('streaming');
          break;
        case 'ui/notifications/tool-input-partial':
          log(`tool-input-partial ${JSON.stringify(params)}`);
          setStatus('streaming');
          break;
        case 'ui/notifications/tool-result':
          log(`tool-result ${JSON.stringify(params?.result)}`);
          setStatus('complete');
          break;
        case 'ui/resource-teardown':
          log(`resource-teardown ${JSON.stringify(params)}`);
          setStatus('teardown');
          break;
        case 'ui/notifications/host-context-changed':
        case 'ui/notifications/host-context-change':
          log(`host-context changed ${JSON.stringify(params)}`);
          if (params?.state?.counter !== undefined) {
            setCounter(params.state.counter);
          }
          if (params?.tool) {
            setHydratedTool(params.tool);
            log(`hydrated tool ${JSON.stringify(params.tool)}`);
          }
          break;
        case 'ui/notifications/initialized':
          setInitialized(true);
          break;
        default:
          log(`unhandled notification ${method}`);
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [log, sendNotification, sendResponse]);

  // Report size changes
  const emitSizeChange = useCallback((width: number, height: number) => {
    sendNotification('ui/notifications/size-change', { width, height });
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

  // Report size when status changes (content changes)
  useEffect(() => {
    reportSize();
  }, [status, counter, initialized, reportSize]);

  // Send UI message
  const sendUiMessage = useCallback(
    async (content: Record<string, any>, metadata?: Record<string, any>) => {
      await sendRequest('ui/message', { role: 'user', content, metadata });
    },
    [sendRequest],
  );

  // Persist counter via ui/message with botdojo/persist type
  const persistCounter = useCallback(
    async (val: number) => {
      setBusy(true);
      setCounter(val);
      try {
        log(`persistCounter sending ui/message counter=${val}`);
        await sendRequest('ui/message', {
          role: 'user',
          content: {
            type: 'botdojo/persist',
            state: { counter: val },
          },
        });
      } catch (err) {
        console.error('ui/message persist error:', err);
      }
      setBusy(false);
    },
    [sendRequest, log],
  );

  // Handle button actions
  const handleAction = useCallback(
    async (type: string) => {
      setBusy(true);
      try {
        switch (type) {
          case 'tool': {
            // Send a message that triggers the tool flow
            try {
              const res = await sendUiMessage(
                { type: 'text', text: `Please enter your name:`, tags: { prompt: 'Please enter your name:' } },
              );
              console.log('tool response:', res);
            } catch (err) {
              console.error('tool error:', err);
            }
            break;
          }
          case 'message':
            await sendUiMessage(
              { type: 'text', text: `Hello from HTML App Native (count ${counter})` },
              { source: 'html-app-native' },
            );
            break;
          case 'link':
            await sendRequest('ui/open-link', { url: 'https://botdojo.com' });
            break;
        }
      } catch (err) {
        console.error(`Action error (${type}):`, err);
      } finally {
        setBusy(false);
      }
    },
    [counter, sendRequest, sendUiMessage],
  );

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
      {!initialized && (
        <div style={{ padding: 12, fontSize: 13, color: '#64748b' }}>Starting up...</div>
      )}
      {initialized && (
        <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>MCP App Inline HTML</div>
        
        </div>
      </div>

      {status === 'starting' && (
        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Waiting for tool execution...</div>
        </div>
      )}

      {status === 'streaming' && (
        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#475569' }}>
            Processing...
          </div>
        </div>
      )}

      {status === 'complete' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
            {[
              { type: 'tool', label: 'Simulate tool call' },
              { type: 'message', label: 'Simulate ui/message' },
              { type: 'link', label: 'Simulate open link' },
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
              <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', minWidth: 40, textAlign: 'center' }}>{counter}</div>
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
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>testing persistence</div>
          </div>
        </>
      )}

      {status === 'error' && (
        <div style={{ padding: 12, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#dc2626' }}>Error</div>
        </div>
      )}

      {status === 'teardown' && (
        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#475569' }}>Teardown</div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default function HtmlAppNativeCanvasPage() {
  useEffect(() => {
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

  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100%', width: '100%', background: '#ffffff', display: 'flex', alignItems: 'flex-start' }}>
      <HtmlAppNativeCanvas />
    </div>
  );
}

