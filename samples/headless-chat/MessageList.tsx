import { useEffect, useRef } from 'react';
import { useChatMessages } from '@botdojo/chat-sdk';
import { MessageBubble } from './MessageBubble';

export function MessageList() {
  const { messages, currentMessage } = useChatMessages();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change (within the container only)
  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, currentMessage]);

  if (messages.length === 0) {
    return (
      <div style={{
        padding: '32px 24px',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '14px',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌤️</div>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
          Weather at your fingertips
        </div>
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>
          Click a suggestion above or type a city name
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        padding: '16px',
      }}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={message.id === currentMessage?.id && message.status === 'streaming'}
        />
      ))}
    </div>
  );
}
