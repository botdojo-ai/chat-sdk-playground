import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';

export default function SecurityPage() {
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-5 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl md:text-[32px]">🔐</span>
          <div>
            <div className="text-[10px] md:text-[11px] text-slate-500 tracking-wider font-bold uppercase">Best Practices</div>
            <h1 className="m-0 text-xl md:text-[28px] text-emerald-600 font-extrabold">Security & CORS</h1>
          </div>
        </div>
        <p className="m-0 text-sm md:text-[15px] text-slate-600 leading-relaxed max-w-[800px]">
          Learn how to securely integrate the BotDojo Chat SDK in your application. This guide covers JWT tokens, 
          CORS configuration, and the secure proxy for MCP Apps.
        </p>
      </div>

      {/* Quick Summary */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 rounded-xl border border-emerald-200/50" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)' }}>
        <h3 className="m-0 mb-3 text-sm md:text-base font-bold text-slate-900">
          Security Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { icon: '🎫', title: 'JWT Tokens', desc: 'Short-lived tokens instead of API keys' },
            { icon: '🌐', title: 'CORS Protection', desc: 'Control which domains can embed chat' },
            { icon: '🔒', title: 'MCP App Sandbox', desc: 'Origin isolation and CSP for MCP Apps' },
          ].map(item => (
            <div key={item.title} className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{item.icon}</span>
                <span className="font-bold text-sm text-slate-900">{item.title}</span>
              </div>
              <p className="m-0 text-xs text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* JWT Tokens Section */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>🎫</span> JWT Tokens
        </h2>
        
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <h4 className="m-0 mb-2 text-sm font-bold text-amber-800">⚠️ Never Expose API Keys to the Browser</h4>
          <p className="m-0 text-sm text-amber-700">
            API keys should be kept server-side only. Instead of passing your API key directly to the chat widget, 
            generate short-lived JWT tokens on your server and pass those to the browser.
          </p>
        </div>

        <h3 className="m-0 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          How It Works
        </h3>
        <ol className="m-0 mb-4 pl-6 text-sm text-slate-600 leading-loose">
          <li>Your <strong>server</strong> stores the API key securely (environment variable)</li>
          <li>When a user visits your app, your server calls BotDojo's API to generate a temporary JWT token</li>
          <li>The JWT token is returned to the browser and passed to the chat widget</li>
          <li>The token expires after a set time (default: 1 hour) and can be refreshed</li>
        </ol>

        <h3 className="m-0 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          Token Generation API
        </h3>
        <p className="m-0 mb-3 text-sm text-slate-600">
          Call <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">POST /api/v1/public/generate_flow_temporary_token</code> with 
          your API key in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">Authorization</code> header:
        </p>

        <CodeSnippet
          code={`// Server-side API route (e.g., /api/get-chat-token.ts)
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // API key stored securely on server (NOT exposed to browser)
  const flowApiKey = process.env.BOTDOJO_API_KEY;
  
  const response = await fetch('https://api.botdojo.com/api/v1/public/generate_flow_temporary_token', {
    method: 'POST',
    headers: {
      'Authorization': flowApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // CORS: Which origins can use this token to embed the chat
      allowedOrigins: [
        'https://yourdomain.com',
        'https://*.yourdomain.com',  // Wildcard subdomain support
      ],
      // Token expiration in seconds (default: 3600 = 1 hour)
      expiresIn: 3600,
    }),
  });

  const data = await response.json();
  // Returns: { token: "dojo_eyJ...", expiresAt: "2024-..." }
  res.json(data);
}`}
          language="typescript"
          title="Server-side Token Generation"
        />

        <h3 className="m-0 mt-4 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          Using the Token in Your App
        </h3>
        <CodeSnippet
          code={`// Client-side React component
import { BotDojoChat } from '@botdojo/chat-sdk';
import { useEffect, useState } from 'react';

export default function ChatWidget() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Fetch token from your server
    fetch('/api/get-chat-token')
      .then(res => res.json())
      .then(data => setToken(data.token));
  }, []);

  if (!token) return <div>Loading...</div>;

  return (
    <BotDojoChat
      apiKey={token}  // Pass the JWT token, NOT your API key
      mode="inline"
    />
  );
}`}
          language="tsx"
          title="Client-side Usage"
        />
      </div>

      {/* CORS Section */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>🌐</span> CORS Configuration
        </h2>
        
        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          CORS (Cross-Origin Resource Sharing) controls which websites can embed your chat widget. 
          When you generate a JWT token with <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">allowedOrigins</code>, 
          BotDojo enforces that only those origins can use the token.
        </p>

        <h3 className="m-0 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          Setting Allowed Origins
        </h3>
        <CodeSnippet
          code={`// When generating a token, specify which origins can embed the chat
const response = await fetch('/api/v1/public/generate_flow_temporary_token', {
  method: 'POST',
  headers: {
    'Authorization': apiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    allowedOrigins: [
      'https://myapp.com',           // Exact match
      'https://*.myapp.com',         // All subdomains
      'http://localhost:3000',       // Local development
    ],
  }),
});`}
          language="typescript"
          title="CORS Origins in Token"
        />

        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="m-0 mb-2 text-sm font-bold text-blue-800">💡 How CORS Enforcement Works</h4>
          <ol className="m-0 pl-5 text-sm text-blue-700 leading-relaxed">
            <li>The chat widget runs inside an iframe hosted on <code className="bg-white px-1 rounded">embed.botdojo.com</code></li>
            <li>The iframe detects the parent page's origin (the page embedding the chat)</li>
            <li>BotDojo validates that the parent origin matches the <code className="bg-white px-1 rounded">allowedOrigins</code> in the JWT</li>
            <li>If the origin doesn't match, the chat displays a "Not Allowed" error</li>
          </ol>
        </div>

        <h3 className="m-0 mt-4 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          Wildcard Patterns
        </h3>
        <p className="m-0 mb-3 text-sm text-slate-600">
          You can use wildcards to allow multiple subdomains:
        </p>
        <ul className="m-0 pl-6 text-sm text-slate-600 leading-loose">
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">https://*.example.com</code> - Matches <code className="bg-slate-100 px-1 rounded">app.example.com</code>, <code className="bg-slate-100 px-1 rounded">staging.example.com</code>, etc.</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">https://example.com</code> - Exact match only</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded">*</code> - Allow any origin (use with caution!)</li>
        </ul>
      </div>

      {/* MCP App Security Section */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>🔒</span> MCP Apps: Security Architecture
        </h2>
        
        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          MCP Apps (widgets rendered in chat) run inside sandboxed iframes with strict security controls. 
          This architecture follows the <a href="https://spec.modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">MCP specification (SEP-1865)</a> for 
          secure, interactive UI content.
        </p>

        <h3 className="m-0 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          The Sandbox Proxy Architecture
        </h3>
        <p className="m-0 mb-3 text-sm text-slate-600">
          MCP Apps are rendered through a <strong>sandbox proxy</strong> that provides origin isolation:
        </p>
        
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mb-4">
          <pre className="m-0 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">{`┌─────────────────────────────────────────────────────────┐
│  Your App (parent window)                                │
│    └── Chat Widget (embed.botdojo.com)                   │
│          └── Sandbox Proxy (mcp-app-proxy.botdojo.com)   │  ← Different origin
│                └── MCP App (inner iframe with srcdoc)    │
└─────────────────────────────────────────────────────────┘`}</pre>
        </div>

        <ul className="m-0 mb-4 pl-6 text-sm text-slate-600 leading-loose">
          <li><strong>Origin Isolation</strong> - The sandbox proxy runs on a different origin, preventing the MCP App from accessing the parent page's data</li>
          <li><strong>CSP Injection</strong> - Content Security Policy headers are injected to control what the MCP App can load and connect to</li>
          <li><strong>Message Forwarding</strong> - All communication between the MCP App and host goes through JSON-RPC over postMessage</li>
        </ul>

        <h3 className="m-0 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          Content Security Policy (CSP)
        </h3>
        <p className="m-0 mb-3 text-sm text-slate-600">
          MCP Apps declare which external domains they need to access via the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">_meta.ui.csp</code> field. 
          The host enforces these restrictions using CSP headers:
        </p>

        <CodeSnippet
          code={`// MCP Resource with CSP configuration (per MCP spec SEP-1865)
const weatherResource = {
  uri: 'ui://weather-widget',
  name: 'Weather Dashboard',
  mimeType: 'text/html;profile=mcp-app',
  _meta: {
    ui: {
      csp: {
        // connectDomains → CSP "connect-src"
        // For: fetch(), XMLHttpRequest, WebSocket connections
        // Use when: Your JavaScript code makes API calls
        connectDomains: [
          'https://api.weather.gov',      // fetch('https://api.weather.gov/...')
          'wss://realtime.weather.com',   // new WebSocket('wss://...')
        ],
        
        // resourceDomains → CSP "img-src", "script-src", "style-src", "font-src"
        // For: <img>, <script>, <link>, @font-face in HTML/CSS
        // Use when: Your HTML loads external images, scripts, or fonts
        resourceDomains: [
          'https://cdn.jsdelivr.net',     // <script src="https://cdn.jsdelivr.net/...">
          'https://*.cloudflare.com',     // <img src="https://images.cloudflare.com/...">
        ],
      },
      prefersBorder: true,
    },
  },
};`}
          language="typescript"
          title="MCP Resource with CSP Configuration"
        />

        <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <h4 className="m-0 mb-2 text-sm font-bold text-slate-800">connectDomains vs resourceDomains</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="m-0 mb-1 font-semibold text-slate-700">connectDomains (connect-src)</p>
              <ul className="m-0 pl-5 text-slate-600">
                <li><code className="bg-white px-1 rounded text-xs">fetch()</code> and <code className="bg-white px-1 rounded text-xs">XMLHttpRequest</code></li>
                <li>WebSocket connections</li>
                <li>EventSource (SSE)</li>
              </ul>
            </div>
            <div>
              <p className="m-0 mb-1 font-semibold text-slate-700">resourceDomains (img/script/style/font-src)</p>
              <ul className="m-0 pl-5 text-slate-600">
                <li><code className="bg-white px-1 rounded text-xs">&lt;img src="..."&gt;</code></li>
                <li><code className="bg-white px-1 rounded text-xs">&lt;script src="..."&gt;</code></li>
                <li><code className="bg-white px-1 rounded text-xs">&lt;link href="..."&gt;</code> (CSS)</li>
                <li><code className="bg-white px-1 rounded text-xs">@font-face</code> URLs</li>
              </ul>
            </div>
          </div>
        </div>

        <h3 className="m-0 mt-4 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          How CSP Enforcement Works
        </h3>
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4">
          <ol className="m-0 pl-5 text-sm text-blue-700 leading-relaxed">
            <li>MCP App declares <code className="bg-white px-1 rounded">connectDomains: ['https://api.weather.gov']</code></li>
            <li>Host builds CSP: <code className="bg-white px-1 rounded text-xs">connect-src 'self' https://api.weather.gov</code></li>
            <li>CSP is injected as a <code className="bg-white px-1 rounded">&lt;meta&gt;</code> tag in the MCP App's HTML</li>
            <li>MCP App can now <code className="bg-white px-1 rounded">fetch('https://api.weather.gov/...')</code> directly</li>
            <li>Browser enforces CSP - requests to undeclared domains are blocked</li>
          </ol>
        </div>

        <CodeSnippet
          code={`// Inside an MCP App - direct fetch (if external API supports CORS)
async function fetchWeatherData(lat: number, lon: number) {
  // Fetch directly from the API (allowed by CSP connectDomains)
  const response = await fetch(
    \`https://api.weather.gov/points/\${lat},\${lon}\`,
    { headers: { 'User-Agent': 'MyWeatherApp/1.0' } }
  );
  
  return response.json();
}

// Note: The external API must return CORS headers (Access-Control-Allow-Origin)
// If the API doesn't support CORS, you'll need to proxy through your own backend`}
          language="typescript"
          title="MCP App Fetching External Data"
        />

        <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <h4 className="m-0 mb-2 text-sm font-bold text-amber-800">⚠️ Important: CORS Still Applies</h4>
          <p className="m-0 text-sm text-amber-700">
            CSP controls what <strong>your code can attempt</strong> to fetch. The external API still needs to return 
            proper CORS headers (<code className="bg-white px-1 rounded">Access-Control-Allow-Origin</code>) for the browser to allow your app to read the response.
            If an API doesn't support CORS, proxy requests through your own backend.
          </p>
        </div>

        <h3 className="m-0 mt-4 mb-2 text-sm md:text-[15px] font-semibold text-slate-900">
          Defining CSP in Frontend MCP Tools
        </h3>
        <p className="m-0 mb-3 text-sm text-slate-600">
          When using the Chat SDK's ModelContext, define CSP at the resource level:
        </p>

        <CodeSnippet
          code={`// Frontend MCP with CSP configuration
const modelContext: ModelContext = {
  name: 'weather_service',
  resources: [
    {
      uri: 'ui://weather-widget',
      name: 'Weather Widget',
      mimeType: 'text/html;profile=mcp-app',
      _meta: {
        ui: {
          csp: {
            connectDomains: ['https://api.weather.gov'],
          },
        },
      },
      getContent: async () => ({
        text: \`<!DOCTYPE html>
<html>
<head><title>Weather</title></head>
<body>
  <div id="app">Loading weather...</div>
  <script>
    // This fetch is allowed by connectDomains CSP
    fetch('https://api.weather.gov/points/39.7456,-97.0892')
      .then(r => r.json())
      .then(data => {
        document.getElementById('app').textContent = JSON.stringify(data);
      });
  </script>
</body>
</html>\`,
      }),
    },
  ],
  tools: [
    {
      name: 'show_weather',
      description: 'Display weather widget',
      inputSchema: { type: 'object', properties: { city: { type: 'string' } } },
      _meta: { 'ui/resourceUri': 'ui://weather-widget' },
      execute: async ({ city }) => ({ content: [{ type: 'text', text: \`Weather for \${city}\` }] }),
    },
  ],
};`}
          language="typescript"
          title="ModelContext with CSP"
        />
      </div>

      {/* Best Practices */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>✅</span> Security Best Practices
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <h4 className="m-0 mb-2 text-sm font-bold text-emerald-800">✅ Do</h4>
            <ul className="m-0 pl-5 text-sm text-emerald-700 leading-relaxed">
              <li>Store API keys in server-side environment variables</li>
              <li>Generate JWT tokens with specific <code className="bg-white px-1 rounded">allowedOrigins</code></li>
              <li>Use short token expiration times (1 hour or less)</li>
              <li>Specify exact domains in CORS when possible</li>
              <li>Declare only necessary domains in <code className="bg-white px-1 rounded">csp.connectDomains</code></li>
              <li>Review MCP App HTML content before deploying</li>
            </ul>
          </div>
          
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <h4 className="m-0 mb-2 text-sm font-bold text-red-800">❌ Don't</h4>
            <ul className="m-0 pl-5 text-sm text-red-700 leading-relaxed">
              <li>Expose API keys in client-side code</li>
              <li>Set <code className="bg-white px-1 rounded">allowedOrigins: ['*']</code> in production</li>
              <li>Allow wildcard domains in CSP (<code className="bg-white px-1 rounded">connect-src *</code>)</li>
              <li>Trust user-provided HTML without sanitization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Flow Configuration (optional) */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-slate-50 rounded-xl border border-slate-200">
        <h2 className="m-0 mb-3 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>⚙️</span> Flow-Level CORS Configuration
        </h2>
        <p className="m-0 mb-3 text-sm text-slate-600 leading-relaxed">
          You can also configure CORS at the flow level in the BotDojo dashboard. This applies to all API keys 
          for that flow, without needing to specify origins when generating tokens.
        </p>
        <p className="m-0 text-sm text-slate-600">
          Navigate to your flow → <strong>Settings</strong> → <strong>Chat</strong> → <strong>CORS</strong> to configure:
        </p>
        <ul className="m-0 mt-2 pl-6 text-sm text-slate-600 leading-loose">
          <li><strong>Allowed Embed Origins</strong> - Which websites can embed the chat widget</li>
          <li><strong>Allowed Tool Call Origins</strong> - Which origins can make tool calls (for Frontend MCP)</li>
        </ul>
      </div>

      {/* Next Steps */}
      <div className="p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h3 className="m-0 mb-3 text-sm md:text-base font-bold text-slate-900">
          Next Steps
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/examples/getting-started"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            Get Started →
          </Link>
          <Link 
            href="/examples/frontend-mcp"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-emerald-600 border border-emerald-500 rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            Learn Frontend MCP
          </Link>
          <Link 
            href="/examples/mcp-apps"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            MCP Apps Guide
          </Link>
        </div>
      </div>
    </div>
  );
}

