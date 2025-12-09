import { useEffect, useState } from 'react';
import { eventBus, DebugEvent, EventType, EventSource } from '@/utils/eventBus';

const EVENT_COLORS: Record<EventType, { bg: string; text: string; border: string }> = {
  token: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
  step: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  toolCall: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' },
  error: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  info: { bg: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500' },
  canvas: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
};

const EVENT_EMOJI: Record<EventType, string> = {
  token: '💬',
  step: '🔄',
  toolCall: '🔧',
  error: '❌',
  info: 'ℹ️',
  canvas: '🎨',
};

const EVENT_LABELS: Record<EventType, string> = {
  token: 'Token',
  step: 'Step',
  toolCall: 'Tool',
  error: 'Error',
  info: 'Info',
  canvas: 'MCP App',
};

export default function DebugPanel() {
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [filters, setFilters] = useState<Record<EventType, boolean>>({
    token: true,
    step: true,
    toolCall: true,
    error: true,
    info: true,
    canvas: true,
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  // Get BotDojo config from environment
  const accountId = process.env.NEXT_PUBLIC_ACCOUNT_ID;
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const flowId = process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_FLOW_ID;

  useEffect(() => {
    const unsubscribe = eventBus.subscribe((event) => {
      setEvents((prev) => [...prev, event]);
      
      // Track request ID from step events or info events
      if (event.type === 'step' && event.data?.requestId) {
        console.log('[DebugPanel] Found requestId in step:', event.data.requestId);
        setCurrentRequestId(event.data.requestId);
      } else if (event.type === 'info' && event.data?.requestId) {
        console.log('[DebugPanel] Found requestId in info:', event.data.requestId);
        setCurrentRequestId(event.data.requestId);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoScroll) {
      const container = document.getElementById('debug-events');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [events, autoScroll]);

  const filteredEvents = events.filter((event) => filters[event.type]);

  const handleClear = () => {
    setEvents([]);
    eventBus.clear();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `debug-log-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const toggleFilter = (type: EventType) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Generate BotDojo links
  const flowStudioLink = accountId && projectId && flowId
    ? `https://app.botdojo.com/${accountId}/projects/${projectId}/flows/studio?flowId=${flowId}&left=chat`
    : null;

  const requestLogsLink = accountId && projectId && flowId
    ? `https://app.botdojo.com/${accountId}/projects/${projectId}/flows/studio/?flowId=${flowId}&left=request`
    : null;

  const flowRequestLink = accountId && projectId && flowId && currentRequestId
    ? `https://app.botdojo.com/${accountId}/projects/${projectId}/flows/studio/?flowId=${flowId}&left=request&requestIdPopup=${currentRequestId}`
    : null;

  return (
    <div className="w-full h-screen flex flex-col bg-white border-l border-slate-200 overflow-hidden text-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <span className="text-xl text-indigo-600">🐛</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Debug Panel
              </h3>
              <p className="text-xs text-slate-500 font-medium">Real-time events</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>Events</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
              {filteredEvents.length}
            </span>
          </div>
        </div>

        {/* BotDojo Flow Links */}
        {(flowStudioLink || requestLogsLink || flowRequestLink) && (
          <div className="mt-3 space-y-1 text-xs">
            {(flowStudioLink || requestLogsLink) && (
              <div className="flex items-center gap-3">
                {flowStudioLink && (
                  <a
                    href={flowStudioLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Flow
                  </a>
                )}
                {requestLogsLink && (
                  <a
                    href={requestLogsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-700 hover:text-slate-900 underline"
                  >
                    Trace
                  </a>
                )}
              </div>
            )}
            {flowRequestLink && (
              <a
                href={flowRequestLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 transition-colors"
              >
                <span className="text-base">📊</span>
                <span className="flex-1 font-medium">View Current Request</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(filters) as EventType[]).map((type) => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`
                px-2.5 py-1 text-xs font-semibold rounded-md border
                transition-colors duration-150
                ${filters[type] 
                  ? `${EVENT_COLORS[type].bg} ${EVENT_COLORS[type].text} ${EVENT_COLORS[type].border}` 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }
              `}
              >
              <span className="flex items-center gap-1">
                <span>{EVENT_EMOJI[type]}</span>
                <span className="text-[10px] uppercase tracking-wider">{EVENT_LABELS[type]}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-2.5 border-b border-slate-200 bg-white flex gap-1.5">
        <button
          onClick={handleClear}
          className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
        >
          🗑️ Clear
        </button>
        <button
          onClick={handleExport}
          className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
        >
          📥 Export
        </button>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`
            px-2.5 py-1.5 text-xs font-semibold rounded-md border
            ${autoScroll 
              ? 'bg-indigo-600 text-white border-indigo-600' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }
          `}
        >
          {autoScroll ? '📌' : '📍'}
        </button>
      </div>

      {/* Events List */}
      <div
        id="debug-events"
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 space-y-3 bg-slate-50"
      >
        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-12 text-center text-slate-500">
            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3">
              <span className="text-2xl">👀</span>
            </div>
            <p className="text-sm">No events yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Start interacting with the SDK!
            </p>
          </div>
        )}
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className={`
              group relative p-3 rounded-lg bg-white border-l-4 ${EVENT_COLORS[event.type].border}
              border border-slate-200 shadow-sm
            `}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{EVENT_EMOJI[event.type]}</span>
                <span className={`text-xs font-bold uppercase tracking-wide ${EVENT_COLORS[event.type].text}`}>
                  {EVENT_LABELS[event.type]}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {event.source}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Message */}
            {event.message && (
              <div className="text-sm text-slate-700 mb-2 leading-relaxed">
                {typeof event.message === 'string' ? event.message : JSON.stringify(event.message)}
              </div>
            )}

            {/* Data */}
            {event.data && Object.keys(event.data).length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 select-none transition-colors">
                  📊 Show data
                </summary>
                <pre className="text-xs mt-2 bg-slate-50 p-3 rounded border border-slate-200 overflow-auto max-h-48 text-slate-700 font-mono">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
