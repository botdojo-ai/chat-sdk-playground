import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Return environment variable status (without exposing actual values)
  const envStatus = {
    BOTDOJO_MODEL_CONTEXT_API: !!process.env.BOTDOJO_MODEL_CONTEXT_API,
    NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_FLOW_ID: !!process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_FLOW_ID,
    NEXT_PUBLIC_BOTDOJO_API_URL: process.env.NEXT_PUBLIC_BOTDOJO_API_URL || null,
    NEXT_PUBLIC_BOTDOJO_SOCKET_URL: process.env.NEXT_PUBLIC_BOTDOJO_SOCKET_URL || null,
    NEXT_PUBLIC_ACCOUNT_ID: !!process.env.NEXT_PUBLIC_ACCOUNT_ID,
    NEXT_PUBLIC_PROJECT_ID: !!process.env.NEXT_PUBLIC_PROJECT_ID,
    allBotDojoEnvVars: Object.keys(process.env).filter(k => k.includes('BOTDOJO')),
  };

  return res.status(200).json(envStatus);
}

