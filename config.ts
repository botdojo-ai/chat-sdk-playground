// Configuration for sdk-playground
// API keys are fetched via JWT tokens from /api/get-chat-token
// URLs default to production

// Production defaults
const PROD_IFRAME_URL = 'https://embed.botdojo.com';
const PROD_API_URL = 'https://api.botdojo.com/api/v1';

export const config = {
  // URL for the embedded iframe (BotDojo web app)
  // Override with NEXT_PUBLIC_IFRAME_URL for local dev
  iframeUrl: process.env.NEXT_PUBLIC_IFRAME_URL || PROD_IFRAME_URL,
  
  // Base URL for the chat embed iframe (alias for iframeUrl)
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || PROD_IFRAME_URL,
  
  // Base URL for API calls
  // Override with NEXT_PUBLIC_BOTDOJO_API_URL for local dev
  apiUrl: process.env.NEXT_PUBLIC_BOTDOJO_API_URL || PROD_API_URL,
  
  // Socket URL for real-time updates
  // Override with NEXT_PUBLIC_BOTDOJO_SOCKET_URL for local dev
  socketUrl: process.env.NEXT_PUBLIC_BOTDOJO_SOCKET_URL || PROD_API_URL,
};
