/**
 * Fetch MCP App HTML from API route or disk.
 * 
 * This function fetches bundled MCP App HTML:
 * - During SSR: reads directly from disk (avoids HTTP request issues)
 * - On client: fetches via API route (bypasses webpack caching)
 * 
 * Benefits over dynamic imports:
 * - Always gets fresh content (no webpack cache)
 * - HMR works properly in dev mode
 * - Clear error messages when builds are missing
 * 
 * Usage:
 *   const html = await fetchMcpAppHtml('product-card');
 */

export type McpAppName = 
  | 'product-card'
  | 'cart'
  | 'checkout-summary'
  | 'remote-url-app'
  | 'review'
  | 'review-mcp-app'
  | 'enhance-mcp-app'
  | 'streaming-demo-app'
  | 'weather';

// Cache for server-side rendering (short-lived, just for the render cycle)
const ssrCache = new Map<string, { html: string; timestamp: number }>();
const SSR_CACHE_TTL_MS = 1000; // 1 second cache for SSR

/**
 * Fetch MCP App HTML content.
 * - SSR: reads directly from disk
 * - Client: fetches via API route
 */
export async function fetchMcpAppHtml(name: McpAppName): Promise<string> {
  // For SSR, read directly from disk instead of making HTTP request
  if (typeof window === 'undefined') {
    const cached = ssrCache.get(name);
    if (cached && Date.now() - cached.timestamp < SSR_CACHE_TTL_MS) {
      return cached.html;
    }
    
    // Read directly from disk during SSR
    try {
      const fs = await import('fs');
      const path = await import('path');
      const htmlPath = path.join(process.cwd(), 'dist', `${name}.html`);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      
      // Update cache
      ssrCache.set(name, { html, timestamp: Date.now() });
      return html;
    } catch (err) {
      console.error(`[fetchMcpAppHtml] Failed to read ${name} from disk during SSR:`, err);
      throw err;
    }
  }
  
  // Client-side: fetch via API route
  const url = `${window.location.origin}/api/mcp-app/${name}`;
  
  try {
    const response = await fetch(url, {
      // Disable browser caching in development
      cache: process.env.NODE_ENV === 'development' ? 'no-store' : 'default',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Failed to fetch MCP App: ${response.status}`);
    }
    
    return await response.text();
  } catch (err) {
    console.error(`[fetchMcpAppHtml] Failed to fetch ${name}:`, err);
    throw err;
  }
}

/**
 * Create a getContent function for a ModelContext resource.
 * This is a convenience wrapper for use in resource definitions.
 * 
 * Usage:
 *   resources: [
 *     {
 *       uri: 'ui://bonsai-shop/product-card',
 *       name: 'Product Card',
 *       mimeType: 'text/html;profile=mcp-app',
 *       getContent: createMcpAppResource('product-card', 'ui://bonsai-shop/product-card'),
 *     }
 *   ]
 */
export function createMcpAppResource(
  appName: McpAppName, 
  resourceUri: string
): () => Promise<{ uri: string; mimeType: string; text: string }> {
  return async () => {
    const html = await fetchMcpAppHtml(appName);
    return {
      uri: resourceUri,
      mimeType: 'text/html;profile=mcp-app',
      text: html,
    };
  };
}
