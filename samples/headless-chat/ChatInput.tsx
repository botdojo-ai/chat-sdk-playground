import { useState } from 'react';
import { useChatActions, useChatStatus } from '@botdojo/chat-sdk';

export function ChatInput() {
  const [input, setInput] = useState('');
  const { sendMessage, abortRequest } = useChatActions();
  const { status, isReady } = useChatStatus();

  const isDisabled = !isReady || status === 'streaming';

  const handleSend = () => {
    if (!input.trim() || isDisabled) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px',
      borderTop: '1px solid #e5e7eb',
      background: '#ffffff',
    }}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
        disabled={isDisabled}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          fontSize: '14px',
          outline: 'none',
        }}
      />
      <button
        onClick={handleSend}
        disabled={isDisabled || !input.trim()}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: 'none',
          background: '#3b82f6',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '14px',
          cursor: isDisabled || !input.trim() ? 'not-allowed' : 'pointer',
          opacity: isDisabled || !input.trim() ? 0.6 : 1,
        }}
      >
        Send
      </button>
      {status === 'streaming' && (
        <button
          onClick={abortRequest}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            color: '#6b7280',
            cursor: 'pointer',
          }}
        >
          Stop
        </button>
      )}
    </div>
  );
}
