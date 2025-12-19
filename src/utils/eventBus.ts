/**
 * Event Bus for Debug Panel
 * Centralized event logging for all SDK interactions
 */

export type EventType = 'token' | 'step' | 'toolCall' | 'error' | 'info' | 'canvas';
export type EventSource = 'chat-sdk' | 'sdk' | 'mcp' | 'canvas';

export interface DebugEvent {
  id: string;
  timestamp: number;
  type: EventType;
  source: EventSource;
  data: any;
  message?: string;
}

type EventListener = (event: DebugEvent) => void;

class EventBus {
  private listeners: EventListener[] = [];
  private events: DebugEvent[] = [];
  private maxEvents = 1000;

  subscribe(listener: EventListener): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: Omit<DebugEvent, 'id' | 'timestamp'>): void {
    const fullEvent: DebugEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.events.push(fullEvent);

    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Notify all listeners
    this.listeners.forEach(listener => listener(fullEvent));
  }

  getEvents(): DebugEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
    this.emit({
      type: 'info',
      source: 'sdk',
      data: {},
      message: 'Event log cleared',
    });
  }

  // Convenience methods
  logToken(token: string, source: EventSource = 'sdk'): void {
    // Ensure token is a string
    const tokenStr = typeof token === 'string' ? token : String(token);
    this.emit({
      type: 'token',
      source,
      data: { token: tokenStr },
      message: tokenStr,
    });
  }

  logStep(step: any, source: EventSource = 'sdk'): void {
    // Extract key info for display, store full step in data
    const message = typeof step === 'string' 
      ? step 
      : `${step.stepLabel || 'Step'}: ${step.stepStatus || ''}`;
    
    const data = typeof step === 'string' 
      ? { message: step }
      : step;
    
    this.emit({
      type: 'step',
      source,
      data,
      message,
    });
  }

  logToolCall(toolName: string, args: any, source: EventSource = 'sdk'): void {
    this.emit({
      type: 'toolCall',
      source,
      data: { toolName, args },
      message: `Tool: ${toolName}`,
    });
  }

  logError(error: Error | string | any, source: EventSource = 'sdk'): void {
    let message: string;
    let data: any;
    
    if (error instanceof Error) {
      message = error.message;
      data = { message: error.message, stack: error.stack };
    } else if (typeof error === 'string') {
      message = error;
      data = { message: error };
    } else {
      message = JSON.stringify(error);
      data = error;
    }
    
    this.emit({
      type: 'error',
      source,
      data,
      message,
    });
  }

  logInfo(message: string, data: any = {}, source: EventSource = 'sdk'): void {
    // Ensure message is a string
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    this.emit({
      type: 'info',
      source,
      data,
      message: messageStr,
    });
  }
}

// Singleton instance
export const eventBus = new EventBus();

