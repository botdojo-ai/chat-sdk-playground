import { BotDojoChatProvider } from '@botdojo/chat-sdk';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

const config = {
  apiKey: process.env.NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API || '',
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};

export default function HeadlessDemo() {
  return (
    <BotDojoChatProvider
      apiKey={config.apiKey}
      baseUrl={config.baseUrl}
      newSession={false}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#f9fafb',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}>
        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <MessageList />
        </div>

        {/* Input */}
        <ChatInput />
      </div>
    </BotDojoChatProvider>
  );
}
