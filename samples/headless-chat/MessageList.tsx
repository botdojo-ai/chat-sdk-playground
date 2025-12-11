import { useChatMessages } from '@botdojo/chat-sdk';
import { MessageBubble } from './MessageBubble';

export function MessageList() {
  const { messages, currentMessage } = useChatMessages();

  if (messages.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '14px',
      }}>
        Send a message to start the conversation
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      padding: '16px',
    }}>
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
