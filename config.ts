// Configuration for sdk-playground
// Set these in your .env.local file or they will use defaults

export const config = {
  // URL for the embedded iframe (BotDojo web app)
  iframeUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'http://localhost:3000',
  
  // Base URL for API calls
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  
  // API key for BotDojo Chat SDK with Model Context
  // This is the key that supports model context and MCP tools
  apiKey: process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API || '',
};
