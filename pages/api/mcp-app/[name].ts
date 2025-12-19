/**
 * API Route: /api/mcp-app/[name]
 * 
 * Serves bundled MCP App HTML files directly from disk.
 * This bypasses webpack's module caching, ensuring fresh content
 * on every request and proper HMR during development.
 * 
 * Usage:
 *   GET /api/mcp-app/product-card  → returns dist/product-card.html content
 *   GET /api/mcp-app/cart          → returns dist/cart.html content
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Allowlist of valid MCP app names to prevent path traversal
const VALID_APPS = [
  'product-card',
  'cart',
  'checkout-summary',
  'remote-url-app',
  'review',
  'review-mcp-app',
  'enhance-mcp-app',
  'streaming-demo-app',
  'weather',
] as const;

type ValidAppName = typeof VALID_APPS[number];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query;
  
  // Validate the app name
  if (typeof name !== 'string' || !VALID_APPS.includes(name as ValidAppName)) {
    return res.status(404).json({ 
      error: 'MCP App not found',
      validApps: VALID_APPS,
    });
  }
  
  // Read the HTML file from disk (bypasses webpack cache)
  const htmlPath = path.join(process.cwd(), 'dist', `${name}.html`);
  
  try {
    // Always read fresh from disk
    const html = fs.readFileSync(htmlPath, 'utf-8');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // In development, add timestamp for debugging
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('X-MCP-App-Loaded-At', new Date().toISOString());
      const stats = fs.statSync(htmlPath);
      res.setHeader('X-MCP-App-Modified-At', stats.mtime.toISOString());
    }
    
    return res.status(200).send(html);
  } catch (err) {
    console.error(`[MCP App API] Failed to load ${name}:`, err);
    
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return res.status(404).json({ 
        error: `MCP App "${name}" not built yet`,
        hint: 'Run: pnpm bundle:mcp-app',
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to load MCP App',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
