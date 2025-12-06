import type { NextApiRequest, NextApiResponse } from 'next';
import { runFlowWithSSE } from '../../lib/flowRunner';

/**
 * API Route: Run Basic Flow
 * 
 * Runs a basic flow with HTTP streaming (SSE)
 * Uses shared flow runner utility for consistent behavior
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, sessionId } = req.body;
  
  console.log('[Basic Flow API] Received request:', { 
    input: input?.substring(0, 50), 
    sessionId,
    hasSessionId: !!sessionId 
  });

  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  const apiKey = process.env.NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API;
  const apiUrl = process.env.NEXT_PUBLIC_BOTDOJO_API_URL;

  console.log('[Basic Flow API] Environment check:', {
    apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET',
    apiUrl: apiUrl || 'NOT SET',
    allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_BOTDOJO')),
  });

  if (!apiKey) {
    console.error('[Basic Flow API] NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API is not set!');
    return res.status(500).json({ 
      error: 'Simple Test API key not configured. Run `pnpm setup-playground` first.',
      envCheck: {
        apiKeyExists: !!apiKey,
        availableEnvVars: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_BOTDOJO')),
      }
    });
  }

  console.log('[Basic Flow API] Starting flow run with HTTP streaming');

  // Use shared flow runner utility
  await runFlowWithSSE(res, {
    apiKey,
    apiUrl,
    input,
    sessionId,
    debug: false,
  });
}

