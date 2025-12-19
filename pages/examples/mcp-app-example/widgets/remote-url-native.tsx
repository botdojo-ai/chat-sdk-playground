import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WidgetState } from '../../mcp-app-example';

type LogEntry = string;
type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer?: ReturnType<typeof setTimeout>;
};

const LOG_PREFIX = '[demo2]';

function NativeMcpCanvas() {
  const [widgetState, setWidgetState] = useState<WidgetState>(new WidgetState());

  const [busy, setBusy] = useState(false);
  const [hostInfo, setHostInfo] = useState<any>(null);
  const [hydratedTool, setHydratedTool] = useState<any>({});
  const [currentStep, setCurrentStep] = useState<{
    stepId: string;
    stepLabel: string;
  } | undefined>(undefined);
  // Separate state for tool progress updates (from notifyToolInputPartial with kind: 'botdojo-tool-progress')
  const [toolProgress, setToolProgress] = useState<Record<string, unknown> | null>(null);
  // Separate state for final tool arguments (from tool-input when LLM streaming completes)
  const [toolArguments, setToolArguments] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<'starting' | 'streaming' | 'complete' | 'error' | 'teardown'>('streaming');
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stepOrder = ['step-1', 'step-2', 'step-3', 'step-4'] as const;
  const pendingRequests = useRef<Map<string | number, PendingRequest>>(new Map());
  const nextId = useRef(1);
  const parentOrigin = useRef<string>('*');

  useEffect(() => {
    console.log(`${LOG_PREFIX} status=${status}`);
  }, [status]);
  
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
  const updateWidgetState = useCallback((patch: Partial<WidgetState>) => {
    log(`updateWidgetState patch=${JSON.stringify(patch)}`);
    setWidgetState((prev: WidgetState) => ({ ...prev, ...patch }));
  }, [setWidgetState, log]);
 

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.jsonrpc !== '2.0') return;

      if (parentOrigin.current === '*' && event.origin) {
        parentOrigin.current = event.origin;
        log(`learned parent origin ${parentOrigin.current}`);
      }

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
            const hostContext: any = params?.hostContext || {};
            const state = hostContext.state || {};
            
            // SEP-1865 spec-compliant toolInfo
            const toolInfo = hostContext.toolInfo;
            
            log(`ui/initialize toolInfo=${JSON.stringify(toolInfo)} state=${JSON.stringify(state)}`);
            
            if (state && Object.keys(state).length > 0) {
              setWidgetState((prev: WidgetState) => ({ ...prev, ...state }));
            }
            
            // Set tool name from toolInfo - arguments/results come via notifications
            if (toolInfo?.tool?.name) {
              setHydratedTool({ name: toolInfo.tool.name, stepId: toolInfo.id });
              setStatus('streaming');
            }
            
            sendResponse(id, { ok: true });
            sendNotification('ui/notifications/initialized', { hostInfo: params?.hostInfo });

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
          // Final tool arguments from LLM (streaming complete, execution starting)
          log(`tool-input ${JSON.stringify(params.arguments)}`);
          setToolArguments(params.arguments || null);
          setStatus('streaming');
          break;
        case 'ui/notifications/tool-input-partial': {
          log(`tool-input-partial ${JSON.stringify(params)}`);
          const args = params?.arguments || {};
          
          // Check for _botdojoProgress marker to distinguish progress updates from step metadata
          if (args._botdojoProgress) {
            // Progress update from tool execution - store in toolProgress, not currentStep
            const { _botdojoProgress, ...progressData } = args;
            log(`tool-input-partial: progress update ${JSON.stringify(progressData)}`);
            setToolProgress(progressData);
          } else if (args.stepId || args.stepLabel) {
            // LLM streaming metadata (stepId/stepLabel during argument streaming)
            setCurrentStep({ stepId: args.stepId, stepLabel: args.stepLabel });
          }
          setStatus('streaming');
          break;
        }
        case 'ui/notifications/tool-result':
          log(`tool-result ${JSON.stringify(params.result)}`);
          // Clear toolProgress when tool completes (matches useMcpApp behavior)
          setToolProgress(null);
          setStatus('complete');
          break;
        case 'ui/resource-teardown':
          log(`resource-teardown ${JSON.stringify(params)}`);
          setStatus('teardown');
          break;
        case 'ui/notifications/host-context-changed':
        case 'ui/notifications/host-context-change':
          log(`host-context changed ${JSON.stringify(params)}`);
          if (params?.state) {
            updateWidgetState({ ...params.state });
          }
          if (params?.tool) {
            setHydratedTool(params.tool);
            log(`hydrated tool ${JSON.stringify(params.tool)}`);
          }
          break;
        case 'ui/notifications/initialized':

          break;
        default:
          log(`unhandled notification ${method}`);
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

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


  const sendUiMessage = useCallback(
    async (content: Record<string, any>, metadata?: Record<string, any>) => {
      await sendRequest('ui/message', { role: 'user', content, metadata });
    },
    [sendRequest],
  );

 

  const persistCounter = useCallback(
    async (val: number) => {
      setBusy(true);

      updateWidgetState({ counter: val });
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
    [sendRequest, updateWidgetState],
  );

  const handleAction = useCallback(
    async (type: string) => {
      setBusy(true);
      try {
        switch (type) {
          case 'tool': {
            try {
              const res = await sendRequest('tools/call', {
                name: 'Tool Call from Remote Url App',
                arguments: { prompt: 'Make a call to the the Frontend Model Context Tool' },
              });
              console.log('tool response:', res);
            } catch (err) {
              console.error('tool error:', err);
            }
            break;
          } 
          case 'message':
            await sendUiMessage(
              { type: 'text', text: `Hello from MCP app (count ${widgetState.counter})`},
              { source: 'demo2-canvas' },
            );
            break;
          case 'link':
            await sendRequest('ui/open-link', { url: 'https://botdojo.com' });
            break;

        }
      } finally {
        setBusy(false);
      }
    },
    [sendUiMessage],
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>MCP App Remote Url </div>
         
        </div>
      </div>

     
      {status == 'streaming'  && (
        <div style={{ marginTop: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#475569' }}>
            Running MCP App demo steps…
          </div>
          {currentStep && (
           <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stepOrder.length}, minmax(0,1fr))`, gap: 8 }}>
            {['step-1', 'step-2', 'step-3'].map((step, idx) => {
          
              const complete = currentStep?.stepId && currentStep?.stepId > step;
              const current = currentStep?.stepId === step;
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
            Current status: {currentStep?.stepLabel || 'Starting...'}

          </div>
          </>
          )}
          {!currentStep && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              waiting for updates...
            </div>
          )}
        </div>
      )}

      {status == 'complete' && (
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
                onClick={() => persistCounter(widgetState.counter - 1)}
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
              <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', minWidth: 40, textAlign: 'center' }}>{widgetState.counter}</div>
              <button
                onClick={() => persistCounter(widgetState.counter + 1)}
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
      {status == 'error' && (
        <>
          <div style={{ marginTop: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#475569' }}>
              Error
            </div>
          </div>
        </>
      )}
      {status == 'teardown' && (
        <>
          <div style={{ marginTop: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#475569' }}>
              Teardown
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function McpAppDemoCanvasPage2() {
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
      <NativeMcpCanvas />
    </div>
  );
}
