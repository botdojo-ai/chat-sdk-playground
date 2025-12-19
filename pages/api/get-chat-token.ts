import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API route to generate a temporary JWT token for BotDojoChat.
 * This keeps the API key on the server and only returns a short-lived JWT to the client.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use server-side only API key (not exposed to client)
  const flowApiKey = process.env.BOTDOJO_MODEL_CONTEXT_API;
  
  if (!flowApiKey) {
    console.error('BOTDOJO_MODEL_CONTEXT_API environment variable not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_BOTDOJO_API_URL || 'https://api.botdojo.com/api/v1';
      // Derive the allowed origin from the current request, fallback to embed.botdojo.com
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const currentOrigin = host ? `${protocol}://${host}` : undefined;
  
      // Parse additional allowed domains from environment variable (comma-separated)
      const envDomains = process.env.BOTDOJO_ALLOW_DOMAINS
        ? process.env.BOTDOJO_ALLOW_DOMAINS.split(',').map(d => d.trim()).filter(Boolean)
        : [];

      const allowedOrigins = [
        ...(currentOrigin ? [currentOrigin] : []),
        ...envDomains,
      ];

    const response = await fetch(`${apiUrl}/public/generate_flow_temporary_token`, {
      method: 'POST',
      headers: {
        'Authorization': flowApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        allowedOrigins: allowedOrigins,
        expiresIn: 3600, // 1 hour
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to generate token:', response.status, errorText);
      throw new Error(`Failed to generate token: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error generating chat token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}
