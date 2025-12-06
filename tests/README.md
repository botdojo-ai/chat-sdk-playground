# SDK Playground Tests

This directory contains Puppeteer-based browser tests for the SDK Playground.

Tests are organized to mirror the examples structure for easy navigation:

```
examples/                          tests/
├── sdk/                          ├── sdk/
│   └── basic.tsx         ←→      │   └── basic.test.ts
│                                 │
└── chat-sdk/                     └── chat-sdk/
    (coming soon)                     (coming soon)
```

See `STRUCTURE.md` for details on the parallel structure.

## Test Files

### `sdk/basic.test.ts`

Tests for the Basic Flow Run example (`/examples/sdk/basic`).

Validates session persistence and tool execution:

1. **Session Memory Test**: Verifies that the agent remembers context across messages using session IDs
   - Sends "my name is paul"
   - Sends "what is my name"
   - Verifies agent responds with "Paul"
   - Verifies session ID is maintained

2. **Tool Execution Test**: Verifies that tools are called and displayed correctly
   - Sends "what is the weather in austin"
   - Verifies tool call UI appears (tool name, arguments)
   - Verifies tool result is displayed
   - Verifies response includes weather information

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run setup to configure API keys:**
   ```bash
   pnpm setup-playground
   ```

3. **Start the dev server in another terminal:**
   ```bash
   pnpm dev
   ```
   
   The server must be running on `http://localhost:3500` for tests to pass.

### Run Tests

```bash
# Run all tests
pnpm test

# Run SDK tests
pnpm test:sdk

# Run specific test file
pnpm test:sdk:basic

# Watch mode (re-run on file changes)
pnpm test:watch
```

## Test Configuration

- **Browser**: Puppeteer (headless: false by default for debugging)
- **Timeout**: 60 seconds per operation, 180 seconds per test
- **Base URL**: `http://localhost:3500`

### Headless Mode

To run tests in headless mode (for CI/CD), edit `tests/session-memory.test.ts`:

```typescript
browser = await puppeteer.launch({
  headless: true, // Change to true for CI/CD
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ]
});
```

## Test Features

### URL Parameter Support

Tests use `?newsession=true` query parameter to force a new session, ensuring test isolation:

```typescript
await page.goto(`${BASE_URL}/examples/sdk/basic?newsession=true`);
```

This parameter:
- Clears `localStorage` session ID
- Resets chat messages
- Starts with a clean slate

### Console Logging

Tests log important events to help with debugging:

```typescript
page.on('console', msg => {
  const text = msg.text();
  if (text.includes('[Frontend]') || text.includes('[API Route]')) {
    console.log(`[PAGE LOG]:`, text);
  }
});
```

### Error Handling

Page errors are captured and logged:

```typescript
page.on('pageerror', error => {
  console.error(`[PAGE ERROR]:`, error.message);
});
```

## Troubleshooting

### Tests fail immediately

- Ensure dev server is running: `pnpm dev`
- Check that port 3500 is not in use
- Verify `.env.local` has API keys: `pnpm setup-playground`

### Tests timeout

- Increase timeout in `jest.config.js` (default: 120000ms)
- Check that the flow is responding (test manually in browser first)
- Verify API server is running (localhost:5000 or configured URL)

### Session not persisting

- Check browser console for session ID logs
- Verify `localStorage` is working (some browsers block it in certain modes)
- Check that `?newsession=true` parameter is working

### Tool calls not appearing

- Ensure the test flow has tool definitions (e.g., `get_weather`)
- Check that tool results are being returned
- Verify tool UI rendering in the browser manually first

## CI/CD Integration

To run tests in CI/CD:

1. Set `headless: true` in test file
2. Ensure environment variables are set
3. Start dev server before running tests:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: pnpm install

- name: Setup playground
  run: pnpm setup-playground
  env:
    BOTDOJO_API_KEY: ${{ secrets.BOTDOJO_API_KEY }}

- name: Start dev server
  run: pnpm dev &

- name: Wait for server
  run: npx wait-on http://localhost:3500

- name: Run tests
  run: pnpm test
```

## Writing New Tests

Follow the existing pattern:

```typescript
test('My new test', async () => {
  // 1. Navigate with ?newsession=true
  await page.goto(`${BASE_URL}/examples/sdk/basic?newsession=true`);
  
  // 2. Interact with page
  await page.type('input', 'my message');
  await page.click('button');
  
  // 3. Wait for response
  await wait(5000);
  
  // 4. Assert expectations
  const result = await page.evaluate(() => {
    return document.body.textContent?.includes('expected text');
  });
  
  expect(result).toBe(true);
}, TIMEOUT * 3);
```

### Best Practices

1. **Always use `?newsession=true`** to ensure test isolation
2. **Use generous timeouts** - agent processing can be slow
3. **Log important steps** - helps with debugging
4. **Clean selectors** - use semantic selectors when possible
5. **Wait for elements** - use `waitForSelector` and `waitForFunction`

