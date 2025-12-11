import { BotDojoChat } from '@botdojo/chat-sdk';

export default function BasicChat() {
  return (
    <BotDojoChat
      apiKey={process.env.NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API || ''}
      mode="inline"
      theme="light"
      accentColor="#1d4ed8"
      welcomeMessage={`## Welcome to the Embedded Chat Demo

Try out the chat widget!

<promptbutton label="Say Hello" body='{"text_input": "Hello!"}'></promptbutton>
`}
    />
  );
}

