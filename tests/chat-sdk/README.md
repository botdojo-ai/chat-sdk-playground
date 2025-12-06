# Chat SDK Tests

Tests for `@botdojo/chat-sdk` examples.

## Coming Soon

This directory will contain tests for chat SDK examples once they are implemented.

**Planned test files:**

- `popup.test.ts` - Basic chat popup mode
- `side-panel.test.ts` - Slide-in panel mode
- `model-context.test.ts` - Chat with custom tools
- `canvas.test.ts` - Interactive canvas cards

## Adding Tests

When adding a new Chat SDK example:

1. Create the example page: `pages/examples/chat-sdk/<name>.tsx`
2. Create the test file: `tests/chat-sdk/<name>.test.ts`
3. Add test script: `"test:chat-sdk:<name>": "jest tests/chat-sdk/<name>.test.ts"` to `package.json`
4. Follow the pattern from SDK tests (`tests/sdk/basic.test.ts`)

## Test Pattern

Chat SDK tests should validate:

- ✅ Chat widget initialization
- ✅ Message sending and receiving
- ✅ Popup/panel opening and closing
- ✅ Session persistence
- ✅ Custom tool integration
- ✅ Canvas card rendering (if applicable)

