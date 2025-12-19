# Running SDK Playground on ngrok

## Quick Start

1. **Start the Next.js dev server:**
   ```bash
   cd sdk-examples/sdk-playground
   pnpm dev
   ```
   This starts the server on `http://localhost:3500`

2. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 3500
   ```
   
   Or if you want a custom domain/subdomain:
   ```bash
   ngrok http 3500 --domain=your-custom-domain.ngrok-free.app
   ```

3. **Access your playground:**
   - Use the ngrok HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
   - The playground will be accessible from anywhere on the internet

## Configuration Notes

### CORS & Security
The playground is already configured with:
- CORS headers allowing any origin (`*`) for canvas routes
- CSP frame-ancestors set to `*` (allows framing from anywhere)

### Environment Variables
If you need to reference the ngrok URL in your code, you can set:
```bash
# In .env.local
NEXT_PUBLIC_NGROK_URL=https://your-ngrok-url.ngrok-free.app
```

### MCP App Canvas Routes
The following routes have CORS headers enabled for iframe embedding:
- `/examples/chat-sdk/mcp-app-example/canvas/remote-url-native`
- `/examples/chat-sdk/document-edit/canvas/:path*`

These can be embedded in other domains when accessed via ngrok.

## Troubleshooting

### ngrok free tier limitations
- Free tier shows a warning page on first visit (users need to click "Visit Site")
- Consider upgrading to paid tier for production use

### Dynamic ngrok URLs
- Free ngrok URLs change each time you restart ngrok
- Use a custom domain or ngrok reserved domain for stable URLs

### WebSocket connections
- ngrok supports WebSocket connections automatically
- Socket.IO connections should work without additional configuration

## Example Usage

```bash
# Terminal 1: Start dev server
cd sdk-examples/sdk-playground
pnpm dev

# Terminal 2: Start ngrok
ngrok http 3500

# Access via: https://abc123.ngrok-free.app
```






