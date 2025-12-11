import { BotDojoChat } from '@botdojo/chat-sdk';

/**
 * Simple Chat Example
 * 
 * This is the minimal code needed to embed a BotDojo chat widget.
 * Just provide your API key and choose a display mode.
 */
export default function SimpleChatExample() {
  return (
    <BotDojoChat
      apiKey="your-api-key-here"
      mode="inline"
      theme="light"
      accentColor="#6366f1"
      welcomeMessage={`## Welcome!

Ask me anything to get started.

<promptbutton label="Say Hello" body='{"text_input": "Hello!"}'></promptbutton>
`}
    />
  );
}
