import type { NextApiRequest, NextApiResponse } from 'next';
import { BotDojoSDK } from '@botdojo/sdk';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, flowType, flowId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  if (!flowId || typeof flowId !== 'string') {
    return res.status(400).json({ error: 'Flow ID is required' });
  }

  // Determine which API key to use based on flowType parameter
  const flowTypeStr = typeof flowType === 'string' ? flowType : 'basic';
  let apiKey: string | undefined;
  
  switch (flowTypeStr) {
    case 'model-context':
      apiKey = process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API;
      break;
    case 'basic':
    default:
      apiKey = process.env.NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API;
      break;
  }

  const apiUrl = process.env.NEXT_PUBLIC_BOTDOJO_API_URL;

  if (!apiKey) {
    return res.status(500).json({ 
      error: `API key not configured for flow type: ${flowTypeStr}. Run \`pnpm setup-playground\` first.` 
    });
  }

  try {
    console.log('[Session History API] Creating SDK client...', {
      flowType: flowTypeStr,
      hasApiKey: !!apiKey,
      hasApiUrl: !!apiUrl,
      sessionId: sessionId.substring(0, 8),
    });

    // Create SDK client with account/project IDs
    const client = new BotDojoSDK({
      apiKey,
      apiUrl,
    });

    // Fetch session flow requests using FlowRequest namespace
    console.log('[Session History API] Fetching session flow requests...', { flowId, sessionId: sessionId.substring(0, 8) });
    const flowRequests = await client.FlowRequest.getSession(flowId, sessionId);
    console.log(`[Session History API] Found ${flowRequests.length} flow request(s)`);
    console.log('[Session History API] Flow requests:', JSON.stringify(flowRequests.map(fr => ({
      id: fr.id,
      created: fr.created,
      flow_id: fr.flow_id,
      flow_session_id: fr.flow_session_id
    })), null, 2));

    return res.status(200).json({ flowRequests });

  } catch (error) {
    console.error('[Session History API] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as {status?: number}).status;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Session History API] Error details:', {
      message: errorMessage,
      status: errorStatus,
      stack: errorStack,
    });
    
    // Handle 404 gracefully (session might not exist yet)
    if (errorStatus === 404 || errorMessage.includes('404')) {
      console.log('[Session History API] Session not found (404), returning empty array');
      return res.status(200).json({ flowRequests: [] });
    }
    
    return res.status(500).json({ 
      error: errorMessage || 'Failed to get session history',
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    });
  }
}

