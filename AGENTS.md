# BotDojo Chat SDK Playground — Agents Guide

## Purpose

Standalone playground for `@botdojo/chat-sdk` + MCP Apps examples. Next.js app with interactive demos, real-time debugging, and polished UI to show how to embed BotDojo chat and MCP Apps in your product.

**Repository:** [github.com/botdojo-ai/chat-sdk-playground](https://github.com/botdojo-ai/chat-sdk-playground)

**Key Responsibilities:**
- Demonstrate chat SDK usage with real examples
- Provide interactive testing environment for MCP Apps
- Show best practices for integration
- Real-time event logging and debugging

## Key entry points

- Pages: `pages/`
  - `pages/index.tsx`: Marketing-style landing page for the playground
  - `pages/_app.tsx`: Next.js app wrapper
  - `pages/examples/chat-sdk/basic.tsx`: Chat widget with live configuration
  - `pages/examples/chat-sdk/document-edit.tsx`: Frontend MCP markdown editor demo
  - `pages/examples/chat-sdk/mcp-app-example.tsx`: MCP App actions + monitor
  - `pages/examples/chat-sdk/headless-mcp.tsx`: Headless chat UI + MCP Apps
  - `pages/examples/chat-sdk/getting-started.tsx`: Minimal inline widget example
  
- Components: `src/components/`
  - `src/components/layout/MainLayout.tsx`: Three-column layout wrapper
  - `src/components/layout/ExampleNav.tsx`: Left navigation sidebar
  - `src/components/layout/DebugPanel.tsx`: Right debug panel with event log
  
- Utilities: `src/utils/`
  - `src/utils/eventBus.ts`: Centralized event logging system
  
- Styles: `src/styles/`
  - `src/styles/globals.css`: Global styles and CSS variables
  
- Scripts: `scripts/`
  - `scripts/setup.sh`: Automated setup script (uses BotDojo CLI)

## Where to edit what

### Add a new example

1. **Create the page:**
   ```bash
   pages/examples/chat-sdk/my-example.tsx
   ```

2. **Add to navigation:**
   Edit `src/components/layout/ExampleNav.tsx` and add to `EXAMPLES` array:
   ```typescript
   {
     id: 'chat-my-example',
     title: 'My Example',
     route: '/examples/chat-sdk/my-example',
     category: 'examples',
     icon: '🎯',
   }
   ```

3. **Use the layout:**
   ```tsx
   import MainLayout from '@/components/layout/MainLayout';
   
   export default function MyExample() {
     return (
       <MainLayout>
         {/* Your example content */}
       </MainLayout>
     );
   }
   ```

4. **Log events:**
   ```typescript
   import { eventBus } from '@/utils/eventBus';
   
   eventBus.logInfo('Something happened', { data: 'value' });
   eventBus.logToken('Hello');
   eventBus.logStep(step);
   eventBus.logError(error);
   ```

### Modify layout

- **Left nav**: Edit `src/components/layout/ExampleNav.tsx`
- **Right debug panel**: Edit `src/components/layout/DebugPanel.tsx`
- **Main layout grid**: Edit `src/components/layout/MainLayout.tsx`

### Change theme/colors

Edit CSS variables in `src/styles/globals.css`:

```css
:root {
  --color-primary: #6366f1;
  --bg-primary: #0f172a;
  /* ... */
}
```

### Modify setup script

Edit `scripts/setup.sh` (uses BotDojo CLI commands)

**Setup Script Behavior:**
- **Idempotent**: Safe to run multiple times
- **Never auto-switches projects**: Respects your current CLI context
- **Interactive login prompts**: When login is needed, prompts user to press any key before opening browser
- **Project validation**: 
  - If .env.local project doesn't match CLI → stops with error and shows exact `botdojo switch` command
  - If no CLI project is set → stops with error and shows `botdojo login` command
  - Never automatically creates or switches projects without explicit user action
- **Smart Resume**: Uses `.env.local` to remember:
  - Account/Project IDs → validates they match current CLI context
  - Flow IDs → pulls latest from origin instead of cloning again
  - API keys → reuses existing keys, only creates new ones for newly cloned flows
- **API Key Management**:
  - Only creates API keys when flows are freshly cloned
  - Reuses existing API keys from .env.local if available
  - For existing flows without keys in .env.local, provides command to create one manually
- **First Run**: Prompts for login, lets user select account/project, clones flows, creates API keys
- **Subsequent Runs**: Uses current CLI project, updates flows from origin, preserves existing API keys

## Run & test

```bash
# First time setup (requires BotDojo CLI installed)
npm run setup

# Run setup again to update flows to latest version
npm run setup

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Clean build artifacts
npm run clean

# Run tests (requires dev server running in another terminal)
npm run test
```

Runs on: `http://localhost:3500`

### Testing

Tests are located in `tests/` directory and use Puppeteer for browser automation.

**Prerequisites:**
1. Run `npm run setup` to configure API keys
2. Install test dependencies: `npm run install:test-deps` (Puppeteer is optional and not installed by default)
3. Start dev server in one terminal: `npm run dev`
4. Run tests in another terminal: `npm run test`

**Test files:**
- `tests/chat-sdk/`: Chat SDK + MCP examples (Puppeteer)

**Special URL parameter for testing:**
- `?newsession=true` - Forces a new session (clears localStorage)
- Example: `http://localhost:3500/examples/chat-sdk/basic?newsession=true`

See `tests/README.md` for detailed testing documentation.

## Environment variables

Create `.env.local` (auto-generated by `npm run setup`):

```bash
# =============================================================================
# USER-SPECIFIC CONFIGURATION
# =============================================================================
# Account, project, flow IDs, and server-side API key (private)

NEXT_PUBLIC_ACCOUNT_ID=account-id
NEXT_PUBLIC_PROJECT_ID=project-id
NEXT_PUBLIC_BOTDOJO_BASIC_FLOW_ID=flow-id
NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_FLOW_ID=flow-id

# Server-side API Key (used for JWT token generation)
# This key is NOT exposed to the browser - tokens are generated server-side
BOTDOJO_MODEL_CONTEXT_API=your-api-key

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================
# Default to production endpoints; override for local dev if needed

NEXT_PUBLIC_BOTDOJO_API_URL=https://api.botdojo.com/api/v1
NEXT_PUBLIC_BOTDOJO_SOCKET_URL=https://api.botdojo.com/api/v1/
NEXT_PUBLIC_IFRAME_URL=https://botdojo.com
NEXT_PUBLIC_MCP_SERVER_URL=https://botdojo.com/api/mcp
```

**Security:** The `BOTDOJO_MODEL_CONTEXT_API` key is server-side only (no `NEXT_PUBLIC_` prefix). Client-side code uses JWT tokens generated via `/api/get-chat-token`.

## Deployment

### Vercel Configuration

The playground uses `vercel.json` to optimize build times:

```json
{
  "installCommand": "npm install --no-optional"
}
```

This skips optional dependencies (Puppeteer) during deployment, keeping builds fast and avoiding unnecessary ~300MB downloads in production.

## Architecture

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     MainLayout (Grid)                       │
├─────────────┬───────────────────────────────┬───────────────┤
│             │                               │               │
│ ExampleNav  │     Main Content (pages)      │  DebugPanel   │
│ (300px)     │     (flexible)                │  (400px)      │
│             │                               │               │
│ • Chat SDK  │  Example Component:           │  Events:      │
│   - Basic   │  • Header                     │  • Filter     │
│   - MCP Apps│  • Input                      │  • Log        │
│   - Headless│  • Quick Actions              │  • Export     │
│             │  • Run Button                 │               │
│             │  • Result Display             │               │
│             │                               │               │
└─────────────┴───────────────────────────────┴───────────────┘
```

### Event Bus Flow

```
Example Component → eventBus.logInfo/logToken/logStep/etc.
                          ↓
                    Event Bus (singleton)
                          ↓
                    Subscribers (DebugPanel)
                          ↓
                    UI Update (event list)
```

### Data Flow

1. User interacts with example (clicks button, enters input)
2. Example calls SDK (`@botdojo/sdk` or `@botdojo/chat-sdk`)
3. SDK callbacks log events via `eventBus`
4. DebugPanel listens to eventBus and displays events
5. User sees real-time updates in debug panel

## Patterns & conventions

### Event Logging

Always log important events:

```typescript
// Before action
eventBus.logInfo('Starting flow run', { input });

// During action (callbacks)
onNewToken: (token) => {
  eventBus.logToken(token.token);
};

// After action
eventBus.logInfo('Flow completed', { result });

// On error
catch (error) {
  eventBus.logError(error);
}
```

### Quick Actions

Every example should have quick action buttons:

```typescript
<button onClick={() => setInput('Test value')}>
  🎯 Test Action
</button>
```

### Error Handling

Show errors inline:

```typescript
{error && (
  <div style={{
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '16px',
    borderRadius: '8px',
  }}>
    <strong>Error:</strong> {error}
  </div>
)}
```

### Loading States

Disable controls during loading:

```typescript
<button disabled={loading || !input}>
  {loading ? '⏳ Running...' : '▶️ Run Flow'}
</button>
```

## Dependencies

This playground uses three main BotDojo packages:

- **@botdojo/chat-sdk** - Chat widget and headless hooks
- **@botdojo/sdk** - Core SDK for flow execution  
- **mcp-app-view** - MCP Apps rendering

All are available on npm and installed as regular dependencies.

## External APIs / endpoints

Uses environment variables for API URLs:
- `NEXT_PUBLIC_BOTDOJO_API_URL`: API endpoint for @botdojo/sdk
- `NEXT_PUBLIC_BOTDOJO_SOCKET_URL`: Socket.IO endpoint for realtime
- `NEXT_PUBLIC_IFRAME_URL`: Chat iframe URL for @botdojo/chat-sdk

## Troubleshooting

### Setup script fails

Ensure BotDojo CLI is installed:
```bash
npm install -g @botdojo/cli
```

### API key not found

Run setup:
```bash
npm run setup
```

### Events not logging

Check eventBus import:
```typescript
import { eventBus } from '@/utils/eventBus';
```

### Layout breaks on mobile

MainLayout uses fixed pixel widths. For mobile, consider media queries in globals.css.

### Port conflict

Change port in package.json:
```json
"dev": "next dev -p 3600"
```

## Improving this document

Found gaps or mistakes? Edit this file and add:
- Specific file paths
- Code examples
- Common issues you encountered
- Tips for future developers
