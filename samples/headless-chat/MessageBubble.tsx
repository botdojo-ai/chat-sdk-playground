import { McpAppHost, type ChatMessage } from '@botdojo/chat-sdk';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Extract MCP App IDs from message steps
  // McpAppHost gets all data (HTML, arguments, result) from BotDojoChatProvider via context
  const mcpAppIds: string[] = (() => {
    if (isUser || !message.steps) return [];
    
    return message.steps
      .filter((step: any) => step.canvas?.canvasId)
      .map((step: any) => step.canvas.canvasId);
  })();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
    }}>
      {/* MCP Apps render above the message */}
      {mcpAppIds.map((mcpAppId) => (
        <div 
          key={mcpAppId} 
          style={{ 
            width: '280px', 
            marginBottom: '8px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backgroundColor: '#ffffff',
          }}
        >
          <McpAppHost
            mcpAppId={mcpAppId}
            height="340px"
            debug={true}
          />
        </div>
      ))}

      {/* Message bubble - show for user messages or assistant text */}
      {(isUser || message.content || mcpAppIds.length === 0) && (
        <div style={{
          background: isUser 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : '#ffffff',
          color: isUser ? '#ffffff' : '#1f2937',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '12px 16px',
          maxWidth: '85%',
          border: isUser ? 'none' : '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          {message.content || (isStreaming ? '...' : 'Thinking...')}
          {isStreaming && <span style={{ opacity: 0.5, marginLeft: '2px' }}>▌</span>}
        </div>
      )}
    </div>
  );
}
