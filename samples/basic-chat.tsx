import { BotDojoChat } from '@botdojo/chat-sdk';
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

const config = {
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};

export default function BasicChat() {
  // Get temporary JWT token for secure API access
  const { token, loading, error } = useTemporaryToken();

  if (loading) return <div>Loading...</div>;
  if (error || !token) return <div>Error: {error || 'No token available'}</div>;

  return (
    <BotDojoChat
      apiKey={token}
      baseUrl={config.baseUrl}
      mode="inline"
      autoFocus={false}
      theme="light"
      accentColor="#1d4ed8"
      welcomeMessage={`## Welcome to the Embedded Chat Demo

Try out the chat widget!

<promptbutton label="Say Hello" body='{"text_input": "Hello!"}'></promptbutton>
`}
    />
  );
}

