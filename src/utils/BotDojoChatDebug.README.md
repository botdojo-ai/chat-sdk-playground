# BotDojoChat Debug Panel

A self-contained, portable debug system for monitoring BotDojoChat events in real-time.

## Features

✅ **Side panel** - Collapsible panel that can be minimized/expanded
✅ **Real-time event logging** - All flow and canvas events
✅ **Event filtering** - Toggle event types on/off
✅ **Auto-scroll** - Follow new events automatically
✅ **Export logs** - Download as JSON
✅ **Beautiful UI** - Modern dark theme with gradients
✅ **Portable** - Single file, works in any React/Next.js project
✅ **Zero dependencies** - Only uses React built-ins

## Usage

### 1. Copy the file

Copy `BotDojoChatDebug.tsx` to your project (e.g., `src/lib/` or `components/`)

### 2. Wrap your app with the provider

```tsx
import {
  BotDojoChatDebugProvider,
  BotDojoChatDebugPanel,
  useBotDojoChatDebugLogger,
} from '@/utils/BotDojoChatDebug';

export default function MyApp() {
  const debugLogger = useBotDojoChatDebugLogger();

  return (
    <BotDojoChatDebugProvider enabled={true} defaultExpanded={false}>
      {/* Your app content */}
      <YourApp />
      
      {/* Debug panel - renders as fixed side panel */}
      <BotDojoChatDebugPanel width="400px" position="right" />
    </BotDojoChatDebugProvider>
  );
}
```

### 3. Add logging to your BotDojoChat event handlers

```tsx
const debugLogger = useBotDojoChatDebugLogger();

<BotDojoChat
  apiKey="YOUR_KEY"
  mode="chat-popup"
  
  // Log flow events
  onMessageStart={(role, messageId) => {
    debugLogger?.logMessageStart(role, messageId);
    // your handler code
  }}
  
  onMessageComplete={(messageId, content) => {
    debugLogger?.logMessageComplete(messageId, content);
    // your handler code
  }}
  
  onToken={(messageId, tokenUpdate) => {
    debugLogger?.logToken(messageId, tokenUpdate.token);
    // your handler code
  }}
  
  onStepUpdate={(messageId, step) => {
    debugLogger?.logStep(messageId, step);
    // your handler code
  }}
  
  // Log canvas events
  onCanvasLink={(url, target, canvasId) => {
    debugLogger?.logCanvasLink(url, target, canvasId);
    // your handler code (e.g., router.push(url))
  }}
  
  onCanvasIntent={(intent, params, canvasId) => {
    debugLogger?.logCanvasIntent(intent, params, canvasId);
    // your handler code
  }}
  
  // Log errors
  onConnectorError={(error) => {
    debugLogger?.logError(error);
    console.error('Connector error:', error);
  }}
/>
```

## API Reference

### BotDojoChatDebugProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable debug mode (shows debug panel) |
| `maxEvents` | `number` | `1000` | Maximum number of events to keep in memory |
| `defaultExpanded` | `boolean` | `false` | Initial expanded state |

### BotDojoChatDebugPanel Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `string` | `'400px'` | Width of panel when expanded |
| `position` | `'left' \| 'right'` | `'right'` | Position of panel |

### useBotDojoChatDebugLogger() Methods

Returns `null` if debug is not enabled, otherwise returns an object with:

- `logReady()` - Log chat ready event
- `logMessageStart(role, messageId)` - Log message start
- `logMessageComplete(messageId, content)` - Log message complete
- `logToken(messageId, token)` - Log token streaming
- `logStep(messageId, step)` - Log step update
- `logSessionCreated(sessionId)` - Log session created
- `logSessionHydrated(sessionId, messageCount)` - Log session hydrated
- `logRequestAborted()` - Log request aborted
- `logCanvasIntent(intent, params, canvasId)` - Log canvas intent
- `logCanvasLink(url, target, canvasId)` - Log canvas link
- `logCanvasNotify(message, params, canvasId)` - Log canvas notification
- `logCanvasPrompt(prompt, params, canvasId)` - Log canvas prompt
- `logCanvasAction(action)` - Log generic canvas action
- `logError(error, messageId?, stepId?)` - Log error
- `logInfo(message, data?)` - Log info message

## Event Types

The debug panel tracks these event types:

**Flow Events:**
- `ready` - Chat iframe is ready
- `message_start` - Message started
- `message_complete` - Message completed
- `token` - Token streamed
- `step` - Step update
- `session_created` - Session created
- `session_hydrated` - Session history loaded
- `request_aborted` - Request aborted
- `error` - Error occurred

**Canvas Events:**
- `canvas_intent` - Canvas sent an intent
- `canvas_notify` - Canvas sent a notification
- `canvas_prompt` - Canvas sent a prompt
- `canvas_link` - Canvas requested navigation
- `canvas_action` - Generic canvas action

**System Events:**
- `info` - Informational message

## Example: Bonsai Shop

See `sdk-examples/sdk-playground/pages/examples/chat-sdk/bonsai-shop/components/BonsaiShopAgent.tsx` for a complete implementation.

## Tips

1. **Minimize when not needed** - Click the minimize button to collapse the panel
2. **Filter events** - Click event type badges to show/hide specific events
3. **Export logs** - Download events as JSON for debugging
4. **Auto-scroll** - Toggle auto-scroll to follow new events or review history
5. **Expand data** - Click "Show data" to see full event details

## Porting to Other Projects

This is a single file with zero dependencies - just copy `BotDojoChatDebug.tsx` to your project and follow the usage instructions above. Works with any React or Next.js project.













