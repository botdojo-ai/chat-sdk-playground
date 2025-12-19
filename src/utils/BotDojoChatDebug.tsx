/**
 * BotDojoChat Debug Panel
 * 
 * Self-contained debug system for BotDojoChat component.
 * Can be copied to any React/Next.js project.
 * 
 * Usage:
 * 
 * 1. Wrap your app with BotDojoChatDebugProvider:
 * 
 *    <BotDojoChatDebugProvider enabled={true}>
 *      <YourApp />
 *      <BotDojoChatDebugPanel />
 *    </BotDojoChatDebugProvider>
 * 
 * 2. Use the logger in your BotDojoChat event handlers:
 * 
 *    const debugLogger = useBotDojoChatDebugLogger();
 *    
 *    <BotDojoChat
 *      onMessageStart={(role, messageId) => {
 *        debugLogger?.logMessageStart(role, messageId);
 *        // your handler code
 *      }}
 *      onCanvasLink={(url, target, canvasId) => {
 *        debugLogger?.logCanvasLink(url, target, canvasId);
 *        // your handler code
 *      }}
 *    />
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ChatDebugEventType = 
  // Flow events
  | 'ready'
  | 'message_start'
  | 'message_complete'
  | 'token'
  | 'step'
  | 'session_created'
  | 'session_hydrated'
  | 'request_aborted'
  | 'error'
  // Canvas events
  | 'canvas_intent'
  | 'canvas_notify'
  | 'canvas_prompt'
  | 'canvas_link'
  | 'canvas_tool'
  | 'canvas_action'
  // System events
  | 'info';

export interface ChatDebugEvent {
  id: string;
  timestamp: number;
  type: ChatDebugEventType;
  message?: string;
  data?: any;
  messageId?: string;
  stepId?: string;
  canvasId?: string;
}

interface BotDojoChatDebugContextValue {
  events: ChatDebugEvent[];
  addEvent: (event: Omit<ChatDebugEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  enabled: boolean;
  maxEvents: number;
  navCollapsed: boolean;
  setNavCollapsed: (collapsed: boolean) => void;
}

// ============================================================================
// Contexts (split to prevent unnecessary re-renders)
// ============================================================================

// Actions context - stable values that don't change on every event
interface BotDojoChatDebugActionsContextValue {
  addEvent: (event: Omit<ChatDebugEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  enabled: boolean;
  maxEvents: number;
  navCollapsed: boolean;
  setNavCollapsed: (collapsed: boolean) => void;
}

// Events context - changes frequently, only subscribe if you need events
interface BotDojoChatDebugEventsContextValue {
  events: ChatDebugEvent[];
}

const BotDojoChatDebugActionsContext = createContext<BotDojoChatDebugActionsContextValue | null>(null);
const BotDojoChatDebugEventsContext = createContext<BotDojoChatDebugEventsContextValue | null>(null);

// Legacy combined context (for backwards compatibility with useBotDojoChatDebug)
const BotDojoChatDebugContext = createContext<BotDojoChatDebugContextValue | null>(null);

export interface BotDojoChatDebugProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  maxEvents?: number;
  defaultExpanded?: boolean;
  /**
   * Enable nav sidebar (for Bonsai Shop layout)
   */
  enableNav?: boolean;
  /**
   * Default nav collapsed state
   */
  defaultNavCollapsed?: boolean;
}

export function BotDojoChatDebugProvider({
  children,
  enabled = false,
  maxEvents = 1000,
  defaultExpanded = false,
  enableNav = false,
  defaultNavCollapsed = false,
}: BotDojoChatDebugProviderProps): JSX.Element {
  const [events, setEvents] = useState<ChatDebugEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [navCollapsed, setNavCollapsed] = useState(defaultNavCollapsed);

  const addEvent = useCallback((event: Omit<ChatDebugEvent, 'id' | 'timestamp'>) => {
    if (!enabled) return;

    const fullEvent: ChatDebugEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setEvents(prev => {
      const newEvents = [...prev, fullEvent];
      if (newEvents.length > maxEvents) {
        return newEvents.slice(-maxEvents);
      }
      return newEvents;
    });
  }, [enabled, maxEvents]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    addEvent({
      type: 'info',
      message: 'Debug log cleared',
      data: {},
    });
  }, [addEvent]);

  // Actions context value - stable, only changes when UI state changes
  const actionsValue = React.useMemo<BotDojoChatDebugActionsContextValue>(() => ({
    addEvent,
    clearEvents,
    isExpanded,
    setIsExpanded,
    enabled,
    maxEvents,
    navCollapsed,
    setNavCollapsed,
  }), [addEvent, clearEvents, isExpanded, enabled, maxEvents, navCollapsed]);

  // Events context value - changes on every event
  const eventsValue = React.useMemo<BotDojoChatDebugEventsContextValue>(() => ({
    events,
  }), [events]);

  // Combined context for backwards compatibility
  const contextValue = React.useMemo<BotDojoChatDebugContextValue>(() => ({
    events,
    addEvent,
    clearEvents,
    isExpanded,
    setIsExpanded,
    enabled,
    maxEvents,
    navCollapsed,
    setNavCollapsed,
  }), [events, addEvent, clearEvents, isExpanded, enabled, maxEvents, navCollapsed]);

  return (
    <BotDojoChatDebugActionsContext.Provider value={actionsValue}>
      <BotDojoChatDebugEventsContext.Provider value={eventsValue}>
        <BotDojoChatDebugContext.Provider value={contextValue}>
          {children}
        </BotDojoChatDebugContext.Provider>
      </BotDojoChatDebugEventsContext.Provider>
    </BotDojoChatDebugActionsContext.Provider>
  );
}

/**
 * Full debug context - use sparingly, causes re-renders on every event
 */
export function useBotDojoChatDebug(): BotDojoChatDebugContextValue | null {
  return useContext(BotDojoChatDebugContext);
}

/**
 * Hook that only returns layout-relevant state (isExpanded, enabled)
 * Does NOT cause re-renders when events change
 */
export function useBotDojoChatDebugLayout(): { isExpanded: boolean; enabled: boolean } {
  const actions = useContext(BotDojoChatDebugActionsContext);
  return React.useMemo(() => ({ 
    isExpanded: actions?.isExpanded ?? false, 
    enabled: actions?.enabled ?? false 
  }), [actions?.isExpanded, actions?.enabled]);
}

/**
 * Hook to get events only - use in DebugPanel
 */
export function useBotDojoChatDebugEvents(): ChatDebugEvent[] {
  const events = useContext(BotDojoChatDebugEventsContext);
  return events?.events ?? [];
}

/**
 * Convenience hook for logging events
 * Returns logger object with methods for each event type
 * Returns null if debug is not enabled
 * 
 * IMPORTANT: This hook uses the actions context, NOT the events context.
 * This means components using this hook will NOT re-render when events change.
 */
export function useBotDojoChatDebugLogger() {
  // Use actions context directly - does NOT subscribe to events changes
  const actions = useContext(BotDojoChatDebugActionsContext);

  const enabled = actions?.enabled || false;
  const addEvent = actions?.addEvent;

  // Use useMemo with minimal dependencies - only recreate if addEvent function changes
  return React.useMemo(() => {
    if (!enabled || !addEvent) {
      return null;
    }

    return {
      logReady: () => {
        addEvent({ type: 'ready', message: 'Chat ready' });
      },

      logMessageStart: (role: string, messageId: string) => {
        addEvent({
          type: 'message_start',
          message: `Message started: ${role}`,
          messageId,
          data: { role, messageId },
        });
      },

      logMessageComplete: (messageId: string, content: string) => {
        addEvent({
          type: 'message_complete',
          message: 'Message completed',
          messageId,
          data: { messageId, contentLength: content?.length || 0 },
        });
      },

      logToken: (messageId: string, token: string) => {
        addEvent({
          type: 'token',
          message: token,
          messageId,
          data: { token },
        });
      },

      logStep: (messageId: string, step: any) => {
        addEvent({
          type: 'step',
          message: `${step?.stepLabel || 'Step'}: ${step?.stepStatus || ''}`,
          messageId,
          stepId: step?.stepId,
          data: step,
        });
      },

      logSessionCreated: (sessionId: string) => {
        addEvent({
          type: 'session_created',
          message: `Session created: ${sessionId}`,
          data: { sessionId },
        });
      },

      logSessionHydrated: (sessionId: string, messageCount: number) => {
        addEvent({
          type: 'session_hydrated',
          message: `Session hydrated: ${messageCount} messages`,
          data: { sessionId, messageCount },
        });
      },

      logRequestAborted: () => {
        addEvent({
          type: 'request_aborted',
          message: 'Request aborted',
        });
      },

      logCanvasIntent: (intent: string, params: any, canvasId: string) => {
        addEvent({
          type: 'canvas_intent',
          message: `Canvas intent: ${intent}`,
          canvasId,
          data: { intent, params },
        });
      },

      logCanvasLink: (url: string, target: string, canvasId: string) => {
        addEvent({
          type: 'canvas_link',
          message: `Canvas link: ${url}`,
          canvasId,
          data: { url, target },
        });
      },

      logCanvasNotify: (message: string, params: any, canvasId: string) => {
        addEvent({
          type: 'canvas_notify',
          message: `Canvas notify: ${message}`,
          canvasId,
          data: { message, params },
        });
      },

      logCanvasPrompt: (prompt: string, params: any, canvasId: string) => {
        addEvent({
          type: 'canvas_prompt',
          message: `Canvas prompt: ${prompt}`,
          canvasId,
          data: { prompt, params },
        });
      },

      logCanvasTool: (tool: string, params: any, canvasId: string) => {
        addEvent({
          type: 'canvas_tool',
          message: `Canvas tool: ${tool}`,
          canvasId,
          data: { tool, params },
        });
      },

      logCanvasAction: (action: any) => {
        addEvent({
          type: 'canvas_action',
          message: `Canvas action: ${action?.type}`,
          canvasId: action?.canvasId,
          data: action,
        });
      },

      logError: (error: Error | string, messageId?: string, stepId?: string) => {
        const message = error instanceof Error ? error.message : error;
        addEvent({
          type: 'error',
          message,
          messageId,
          stepId,
          data: error instanceof Error ? { message: error.message, stack: error.stack } : { error },
        });
      },

      logInfo: (message: string, data?: any) => {
        addEvent({
          type: 'info',
          message,
          data: data || {},
        });
      },
    };
  }, [enabled, addEvent]); // Only recreate if enabled flag or addEvent function changes
}

// ============================================================================
// Layout Components
// ============================================================================

/**
 * Layout wrapper that manages debug panel positioning
 * Use this to wrap your entire page content to enable push layout instead of overlay
 */
export function BotDojoChatDebugLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const debug = useBotDojoChatDebug();
  
  if (!debug?.enabled) {
    return <>{children}</>;
  }
  
  const debugPanelWidth = debug.isExpanded ? '400px' : '0px';
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Main Content */}
      <div style={{
        flex: 1,
        minWidth: 0,
        transition: 'margin-right 0.3s ease',
        marginRight: debugPanelWidth,
      }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Sidebar collapse/expand icon component
 */
function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    // Menu/hamburger icon when collapsed
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    );
  }
  // Sidebar collapse icon when expanded (panel with left arrow)
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <polyline points="14 9 11 12 14 15" />
    </svg>
  );
}

/**
 * Collapsible navigation sidebar wrapper for left side of layout
 */
export function BotDojoChatDebugNav({ children }: { children?: React.ReactNode }): JSX.Element {
  const debug = useBotDojoChatDebug();
  
  if (!debug) {
    return <></>;
  }
  
  const { navCollapsed, setNavCollapsed } = debug;
  const width = navCollapsed ? '56px' : '320px';
  
  return (
    <div style={{
      width,
      minWidth: width,
      height: '100vh',
      transition: 'width 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      background: navCollapsed ? '#f8fafc' : 'transparent',
      borderRight: navCollapsed ? '1px solid #e2e8f0' : 'none',
    }}>
      {/* Nav content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        opacity: navCollapsed ? 0 : 1,
        visibility: navCollapsed ? 'hidden' : 'visible',
        transition: 'opacity 0.15s ease, visibility 0.15s ease',
        pointerEvents: navCollapsed ? 'none' : 'auto',
      }}>
        {children}
      </div>
      
      {/* Collapsed state - show toggle button centered */}
      {navCollapsed && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '16px',
        }}>
          <button
            onClick={() => setNavCollapsed(false)}
            style={{
              width: '40px',
              height: '40px',
              padding: '0',
              background: 'white',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#64748b';
            }}
            title="Expand sidebar"
          >
            <SidebarToggleIcon collapsed={true} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Standalone sidebar toggle button to be used inside nav header
 */
export function SidebarCollapseButton(): JSX.Element | null {
  const debug = useBotDojoChatDebug();
  
  if (!debug || debug.navCollapsed) {
    return null;
  }
  
  const { setNavCollapsed } = debug;
  
  return (
    <button
      onClick={() => setNavCollapsed(true)}
      style={{
        width: '32px',
        height: '32px',
        padding: '0',
        background: 'transparent',
        color: '#94a3b8',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f1f5f9';
        e.currentTarget.style.color = '#64748b';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#94a3b8';
      }}
      title="Collapse sidebar"
    >
      <SidebarToggleIcon collapsed={false} />
    </button>
  );
}

// ============================================================================
// Debug Panel Component
// ============================================================================

const EVENT_COLORS: Record<ChatDebugEventType, { bg: string; text: string; border: string }> = {
  ready: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
  message_start: { bg: '#e0f2fe', text: '#1d4ed8', border: '#bfdbfe' },
  message_complete: { bg: '#ede9fe', text: '#6d28d9', border: '#d8b4fe' },
  token: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
  step: { bg: '#e0f2fe', text: '#1d4ed8', border: '#bfdbfe' },
  session_created: { bg: '#ecfdf3', text: '#047857', border: '#bbf7d0' },
  session_hydrated: { bg: '#ecfdf3', text: '#047857', border: '#bbf7d0' },
  request_aborted: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  error: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  canvas_intent: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  canvas_notify: { bg: '#f3e8ff', text: '#8b5cf6', border: '#e9d5ff' },
  canvas_prompt: { bg: '#fde7f3', text: '#be185d', border: '#f9a8d4' },
  canvas_link: { bg: '#fef2f2', text: '#b91c1c', border: '#fecdd3' },
  canvas_tool: { bg: '#f8fafc', text: '#0f172a', border: '#e2e8f0' },
  canvas_action: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  info: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
};

const EVENT_EMOJI: Record<ChatDebugEventType, string> = {
  ready: '✅',
  message_start: '▶️',
  message_complete: '✓',
  token: '💬',
  step: '🔄',
  session_created: '🎬',
  session_hydrated: '📚',
  request_aborted: '⏹️',
  error: '❌',
  canvas_intent: '🎯',
  canvas_notify: '📢',
  canvas_prompt: '💭',
  canvas_link: '🔗',
  canvas_tool: '🛠️',
  canvas_action: '🎨',
  info: 'ℹ️',
};

/**
 * Component to render canvas card previews from tool response data
 */
function CanvasCardPreview({ data }: { data: any }): JSX.Element | null {
  // Look for canvas actions in various places in the step data
  const actions = 
    data?.toolResponse?.actions || 
    data?.output?.actions ||
    data?.actions ||
    [];
  
  const canvasActions = actions.filter((a: any) => a?.type === 'add_canvas');
  
  if (canvasActions.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '8px' }}>
      {canvasActions.map((action: any, idx: number) => {
        const canvasData = action.data?.canvasData || action.data || {};
        const url = canvasData.url || '';
        
        // Extract card type from URL
        let cardType = 'Canvas';
        let cardEmoji = '🎨';
        let cardColor = '#a855f7';
        
        if (url.includes('cart')) {
          cardType = 'Cart';
          cardEmoji = '🛒';
          cardColor = '#f59e0b';
        } else if (url.includes('checkout-summary')) {
          cardType = 'Checkout Summary';
          cardEmoji = '💳';
          cardColor = '#10b981';
        } else if (url.includes('product-card')) {
          cardType = 'Product Card';
          cardEmoji = '📦';
          cardColor = '#3b82f6';
        }

        // Parse URL params to get card data
        let cardData: Record<string, string> = {};
        try {
          const urlObj = new URL(url, 'http://localhost');
          urlObj.searchParams.forEach((value, key) => {
            if (key !== 'items') {
              cardData[key] = value;
            }
          });
          // Parse items if present
          const itemsParam = urlObj.searchParams.get('items');
          if (itemsParam) {
            try {
              const items = JSON.parse(itemsParam);
              cardData['itemCount'] = Array.isArray(items) ? items.length.toString() : '0';
            } catch {
              // Ignore parse errors
            }
          }
        } catch {
          // URL parsing failed, use raw URL
        }

        return (
          <div
            key={idx}
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: `${cardColor}15`,
              border: `1px solid ${cardColor}40`,
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>{cardEmoji}</span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: cardColor,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {cardType}
              </span>
            </div>
            
            {/* Show key data from the canvas */}
            {Object.keys(cardData).length > 0 && (
              <div style={{ 
                fontSize: '10px', 
                color: '#94a3b8',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '2px 8px',
              }}>
                {Object.entries(cardData).slice(0, 6).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <span style={{ color: '#64748b' }}>{key}:</span>
                    <span style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      maxWidth: '200px',
                    }}>
                      {String(value).slice(0, 50)}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
            
            {/* Show URL in collapsible */}
            <details style={{ marginTop: '6px' }}>
              <summary style={{ 
                fontSize: '9px', 
                color: '#64748b', 
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                🔗 Canvas URL
              </summary>
              <div style={{
                fontSize: '9px',
                color: '#64748b',
                marginTop: '4px',
                padding: '4px',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '4px',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}>
                {url}
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}

export interface BotDojoChatDebugPanelProps {
  width?: string;
}

// Type for consolidated events (groups of token or step events)
interface ConsolidatedEvent {
  // Combined display fields
  id: string;
  timestamp: number;
  type: ChatDebugEventType;
  message?: string;
  messageId?: string;
  stepId?: string;
  canvasId?: string;
  // For consolidated events, this holds all original events
  consolidatedEvents?: ChatDebugEvent[];
  // Original data (for non-consolidated events)
  data?: any;
}

/**
 * Consolidate consecutive token and step events with the same messageId into single entries
 */
function consolidateEvents(events: ChatDebugEvent[]): ConsolidatedEvent[] {
  const result: ConsolidatedEvent[] = [];
  let currentGroup: ChatDebugEvent[] = [];
  let currentGroupType: 'token' | 'step' | null = null;
  let currentMessageId: string | undefined = undefined;

  const flushGroup = () => {
    if (currentGroup.length === 0) return;
    
    if (currentGroup.length === 1) {
      // Single event, no consolidation needed
      result.push({ ...currentGroup[0] });
    } else if (currentGroupType === 'token') {
      // Multiple tokens - consolidate
      const combinedText = currentGroup.map(e => e.message || '').join('');
      const firstEvent = currentGroup[0];
      const lastEvent = currentGroup[currentGroup.length - 1];
      
      result.push({
        id: firstEvent.id,
        timestamp: firstEvent.timestamp,
        type: 'token',
        message: combinedText.length > 100 
          ? combinedText.slice(0, 100) + '...' 
          : combinedText,
        messageId: firstEvent.messageId,
        stepId: firstEvent.stepId,
        consolidatedEvents: [...currentGroup],
        data: {
          tokenCount: currentGroup.length,
          combinedText,
          timeSpan: `${new Date(firstEvent.timestamp).toLocaleTimeString()} - ${new Date(lastEvent.timestamp).toLocaleTimeString()}`,
        },
      });
    } else if (currentGroupType === 'step') {
      // Multiple steps - consolidate
      const firstEvent = currentGroup[0];
      const lastEvent = currentGroup[currentGroup.length - 1];
      const uniqueLabels = [...new Set(currentGroup.map(e => e.data?.stepLabel).filter(Boolean))];
      const lastStatus = lastEvent.data?.stepStatus || '';
      
      result.push({
        id: firstEvent.id,
        timestamp: firstEvent.timestamp,
        type: 'step',
        message: `${uniqueLabels.join(' → ')} (${currentGroup.length} updates)`,
        messageId: firstEvent.messageId,
        stepId: lastEvent.stepId,
        consolidatedEvents: [...currentGroup],
        data: {
          stepCount: currentGroup.length,
          labels: uniqueLabels,
          lastStatus,
          timeSpan: `${new Date(firstEvent.timestamp).toLocaleTimeString()} - ${new Date(lastEvent.timestamp).toLocaleTimeString()}`,
        },
      });
    }
    currentGroup = [];
    currentGroupType = null;
    currentMessageId = undefined;
  };

  for (const event of events) {
    if (event.type === 'token' || event.type === 'step') {
      // Check if this event belongs to current group (same type and messageId)
      if (currentGroup.length > 0 && event.type === currentGroupType && event.messageId === currentMessageId) {
        currentGroup.push(event);
      } else {
        // Flush previous group and start new one
        flushGroup();
        currentGroup = [event];
        currentGroupType = event.type;
        currentMessageId = event.messageId;
      }
    } else {
      // Non-groupable event - flush any accumulated events first
      flushGroup();
      result.push({ ...event });
    }
  }

  // Flush any remaining events
  flushGroup();

  return result;
}

export function BotDojoChatDebugPanel({
  width = '400px',
}: BotDojoChatDebugPanelProps = {}): JSX.Element | null {
  const position = 'right'; // Always position on the right
  
  // Use split contexts to get what we need
  const actions = useContext(BotDojoChatDebugActionsContext);
  const events = useBotDojoChatDebugEvents();
  
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filters, setFilters] = useState<Record<ChatDebugEventType, boolean>>(
    Object.keys(EVENT_COLORS).reduce((acc, type) => ({
      ...acc,
      [type]: true,
    }), {} as Record<ChatDebugEventType, boolean>)
  );

  if (!actions || !actions.enabled) {
    return null;
  }

  const { clearEvents, isExpanded, setIsExpanded } = actions;

  useEffect(() => {
    if (autoScroll && eventsContainerRef.current) {
      eventsContainerRef.current.scrollTop = eventsContainerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  // Filter events first, then consolidate token and step events
  const filteredEvents = events.filter((event) => filters[event.type]);
  const consolidatedEvents = consolidateEvents(filteredEvents);

  const toggleFilter = (type: ChatDebugEventType) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `botdojo-chat-debug-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const panelWidth = isExpanded ? width : '56px';
  
  return (
    <div
      style={{
        width: panelWidth,
        minWidth: panelWidth,
        height: '100vh',
        background: '#f7f8fb',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'relative',
        color: '#0f172a',
      }}
    >
      {/* Toggle button - more prominent when collapsed */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: 'absolute',
          top: '14px',
          left: isExpanded ? '50%' : '12px',
          transform: isExpanded ? 'translateX(-50%)' : 'none',
          zIndex: 10,
          width: isExpanded ? '32px' : '36px',
          height: isExpanded ? '32px' : '36px',
          borderRadius: '50%',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          color: '#5d5fef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
          transition: 'all 0.2s ease',
        }}
        title={isExpanded ? 'Collapse debug panel' : 'Expand debug panel'}
      >
        {isExpanded ? '⟶' : '🐛'}
      </button>
      {/* Header - only show when expanded */}
      {isExpanded && (
        <div
          style={{
            padding: '18px 16px',
            paddingTop: '60px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#eef2ff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5d5fef',
                  fontSize: '18px',
                }}
              >
                🐛
              </div>
              <div>
                <h3 style={{ margin: '0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Debug Panel
                </h3>
                <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>
                  Real-time SDK events
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#5d5fef',
                background: '#eef2ff',
                border: '1px solid #e2e8f0',
                padding: '6px 10px',
                borderRadius: '10px',
              }}
            >
              {consolidatedEvents.length}
            </span>
          </div>
        </div>
      )}

      {/* Content - only show when expanded */}
      {isExpanded && (
        <>
          {/* Filters */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f3f4f6',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          >
        {(Object.keys(filters) as ChatDebugEventType[]).map((type) => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '8px',
              border: `1px solid ${filters[type] ? EVENT_COLORS[type].border : '#e2e8f0'}`,
              cursor: 'pointer',
              background: filters[type] ? EVENT_COLORS[type].bg : '#ffffff',
              color: filters[type] ? EVENT_COLORS[type].text : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{EVENT_EMOJI[type]}</span>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {type.replace(/_/g, ' ')}
            </span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={clearEvents}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 600,
            background: '#ffffff',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          🗑️ Clear
        </button>
        <button
          onClick={handleExport}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 600,
            background: '#ffffff',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          📥 Export
        </button>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          style={{
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 700,
            background: autoScroll ? '#5d5fef' : '#ffffff',
            color: autoScroll ? '#ffffff' : '#64748b',
            border: autoScroll ? '1px solid #5d5fef' : '1px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer',
            width: '42px',
          }}
        >
          {autoScroll ? '📌' : '📍'}
        </button>
      </div>

      {/* Events List */}
      <div
        ref={eventsContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          minHeight: 0,
        }}
      >
        {consolidatedEvents.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '48px',
              textAlign: 'center',
              color: '#64748b',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: '#eef2ff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5d5fef',
                fontSize: '24px',
              }}
            >
              👀
            </div>
            <p style={{ margin: '0', fontSize: '14px' }}>No events yet.</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#94a3b8' }}>
              Trigger an action in the playground to see logs.
            </p>
          </div>
        )}
        {consolidatedEvents.map((event) => {
          const isConsolidatedToken = event.type === 'token' && event.consolidatedEvents && event.consolidatedEvents.length > 1;
          const isConsolidatedStep = event.type === 'step' && event.consolidatedEvents && event.consolidatedEvents.length > 1;
          const isConsolidated = isConsolidatedToken || isConsolidatedStep;
          
          return (
            <div
              key={event.id}
              style={{
                marginBottom: '12px',
                padding: '12px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${EVENT_COLORS[event.type].border}`,
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px' }}>{EVENT_EMOJI[event.type]}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: EVENT_COLORS[event.type].text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {event.type.replace(/_/g, ' ')}
                  </span>
                  {/* Count badge for consolidated events */}
                  {isConsolidated && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: EVENT_COLORS[event.type].text,
                        background: `${EVENT_COLORS[event.type].bg}20`,
                        border: `1px solid ${EVENT_COLORS[event.type].border}60`,
                        padding: '2px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      ×{event.consolidatedEvents!.length}
                    </span>
                  )}
                  {event.canvasId && (
                    <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                      canvas:{event.canvasId}
                    </span>
                  )}
                  {event.messageId && (
                    <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                      msg:{event.messageId.slice(0, 8)}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {event.message && (
                <div
                  style={{
                    fontSize: '13px',
                    color: '#0f172a',
                    marginBottom: '8px',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                  }}
                >
                  {event.message}
                </div>
              )}

              {/* For consolidated token events, show individual events in details */}
              {isConsolidatedToken && (
                <details style={{ marginTop: '8px' }}>
                  <summary
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    📊 Show {event.consolidatedEvents!.length} token events
                  </summary>
                  <div style={{ marginTop: '8px' }}>
                    {/* Summary info */}
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#64748b',
                        marginBottom: '8px',
                        padding: '8px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div><strong>Token count:</strong> {event.data?.tokenCount}</div>
                      <div><strong>Time span:</strong> {event.data?.timeSpan}</div>
                    </div>
                    {/* Full text */}
                    <pre
                      style={{
                        fontSize: '10px',
                        background: '#f8fafc',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        overflowX: 'auto',
                        maxHeight: '150px',
                        color: '#0f172a',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {event.data?.combinedText}
                    </pre>
                    {/* Individual events */}
                    <details style={{ marginTop: '8px' }}>
                      <summary
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        📋 Raw events
                      </summary>
                      <pre
                        style={{
                          fontSize: '9px',
                          marginTop: '6px',
                          background: '#f8fafc',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                          overflowX: 'auto',
                          maxHeight: '200px',
                          color: '#0f172a',
                          fontFamily: 'monospace',
                        }}
                      >
                        {JSON.stringify(event.consolidatedEvents, null, 2)}
                      </pre>
                    </details>
                  </div>
                </details>
              )}

              {/* For consolidated step events, show individual steps in details */}
              {isConsolidatedStep && (
                <details style={{ marginTop: '8px' }}>
                  <summary
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    📊 Show {event.consolidatedEvents!.length} step updates
                  </summary>
                  <div style={{ marginTop: '8px' }}>
                    {/* Summary info */}
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#64748b',
                        marginBottom: '8px',
                        padding: '8px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div><strong>Update count:</strong> {event.data?.stepCount}</div>
                      <div><strong>Labels:</strong> {event.data?.labels?.join(', ')}</div>
                      <div><strong>Last status:</strong> {event.data?.lastStatus}</div>
                      <div><strong>Time span:</strong> {event.data?.timeSpan}</div>
                    </div>
                    {/* Individual step events */}
                    <details style={{ marginTop: '8px' }}>
                      <summary
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        📋 Raw events
                      </summary>
                      <pre
                        style={{
                          fontSize: '9px',
                          marginTop: '6px',
                          background: '#f8fafc',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                          overflowX: 'auto',
                          maxHeight: '200px',
                          color: '#0f172a',
                          fontFamily: 'monospace',
                        }}
                      >
                        {JSON.stringify(event.consolidatedEvents, null, 2)}
                      </pre>
                    </details>
                  </div>
                </details>
              )}

              {/* Render canvas card previews from step data */}
              {event.type === 'step' && !isConsolidatedStep && (
                <CanvasCardPreview data={event.data} />
              )}
              {/* Also check consolidated step events for canvas actions */}
              {isConsolidatedStep && event.consolidatedEvents?.some((e: ChatDebugEvent) => 
                e.data?.toolResponse?.actions?.some((a: any) => a.type === 'add_canvas') ||
                e.data?.output?.actions?.some((a: any) => a.type === 'add_canvas')
              ) && (
                <div style={{ marginTop: '8px' }}>
                  {event.consolidatedEvents?.map((e: ChatDebugEvent, idx: number) => (
                    <CanvasCardPreview key={idx} data={e.data} />
                  ))}
                </div>
              )}

              {/* Regular data display for non-consolidated events */}
              {!isConsolidated && event.data && Object.keys(event.data).length > 0 && (
                <details style={{ marginTop: '8px' }}>
                  <summary
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    📊 Show data
                  </summary>
                  <pre
                    style={{
                      fontSize: '10px',
                      marginTop: '8px',
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      overflowX: 'auto',
                      maxHeight: '200px',
                      color: '#0f172a',
                      fontFamily: 'monospace',
                    }}
                  >
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
        </div>
        </>
      )}
    </div>
  );
}
