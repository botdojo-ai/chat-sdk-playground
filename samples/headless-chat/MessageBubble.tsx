import { McpAppHost, type ChatMessage, type McpAppData } from '@botdojo/chat-sdk';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Extract MCP App data from message steps
  const mcpApps: McpAppData[] = [];
  if (!isUser && message.steps) {
    message.steps.forEach((step: any) => {
      if (step.canvas?.canvasId) {
        mcpApps.push({
          mcpAppId: step.canvas.canvasId,
          mcpAppType: step.canvas.canvasType || 'mcp-app',
          url: step.canvas.canvasData?.url,
          html: step.canvas.canvasData?.html,
          height: step.canvas.canvasData?.height || '200px',
          arguments: step.stepToolArguments,
          result: step.stepToolResult,
          isComplete: message.status === 'complete',
        });
      }
    });
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
    }}>
      {/* MCP Apps render above the message */}
      {mcpApps.map((app) => (
        <div key={app.mcpAppId} style={{ width: '100%', marginBottom: '8px' }}>
          <McpAppHost
            mcpAppId={app.mcpAppId}
            mcpAppData={app}
            height={app.height}
          />
        </div>
      ))}

      {/* Message bubble */}
      {(isUser || message.content || mcpApps.length === 0) && (
        <div style={{
          background: isUser ? '#3b82f6' : '#ffffff',
          color: isUser ? '#ffffff' : '#1f2937',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '12px 16px',
          maxWidth: '80%',
          border: isUser ? 'none' : '1px solid #e5e7eb',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
          {message.content || (isStreaming ? '...' : 'Thinking...')}
          {isStreaming && <span style={{ opacity: 0.5 }}>▌</span>}
        </div>
      )}
    </div>
  );
}
