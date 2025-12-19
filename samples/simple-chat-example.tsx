import { useMemo } from 'react';
import { BotDojoChat, type ModelContext } from '@botdojo/chat-sdk';


export default function BrowserInfoChat() {
  // Define a ModelContext (Frontend MCP) with a tool to get browser info
  const modelContext: ModelContext = useMemo(() => ({
    name: 'browser_info',
    description: 'Frontend MCP that provides browser information',
    toolPrefix: 'browser',
    uri: 'browser://context',
    tools: [
      {
        name: 'get_browser_info',
        description: 'Get information about the user\'s browser',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'Pass true to get browser info' },
          },
        },
        execute: async () => {
          const userAgent = window.navigator.userAgent;
          const platform = window.navigator.platform;
          
          // Parse browser name from userAgent
          let browserName = 'Unknown';
          if (userAgent.includes('Firefox')) browserName = 'Firefox';
          else if (userAgent.includes('Edg')) browserName = 'Microsoft Edge';
          else if (userAgent.includes('Chrome')) browserName = 'Chrome';
          else if (userAgent.includes('Safari')) browserName = 'Safari';
          
          return {
            browser: browserName,
            platform: platform,
            userAgent: userAgent,
          };
        },
      },
    ],
    
    resources: [],
    prompts: [],
  }), []);

  return (
    <BotDojoChat
      apiKey="your-api-key-here"
      mode="inline"
      autoFocus={false}
      theme="light"
      accentColor="#6366f1"
      modelContext={modelContext}
      welcomeMessage={`## Welcome!

What kind of browser do I have?

<promptbutton label="🌐 Check My Browser" body='{"text_input": "What kind of browser am I using?"}'></promptbutton>
`}
    />
  );
}
