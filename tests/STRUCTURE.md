# Test Structure

The test directory is organized to mirror the examples structure, making it easy to find tests for specific examples.

## Parallel Structure

```
examples/                          tests/
├── sdk/                          ├── sdk/
│   └── basic.tsx         ←→      │   └── basic.test.ts
│                                 │
└── chat-sdk/                     └── chat-sdk/
    (coming soon)                     (coming soon)
```

## Current Organization

### Examples
- `pages/examples/sdk/basic.tsx` - Basic flow run with streaming

### Tests
- `tests/sdk/basic.test.ts` - Tests for Basic Flow Run example
  - ✅ Session memory (context retention across messages)
  - ✅ Tool execution and display

## Running Tests

```bash
# All tests
pnpm test

# All SDK tests
pnpm test:sdk

# Specific example test
pnpm test:sdk:basic

# Watch mode (re-run on changes)
pnpm test:watch
```

## Adding New Tests

When you add a new example, add a corresponding test:

1. **Create the example:**
   ```
   pages/examples/sdk/<name>.tsx
   ```

2. **Create the test:**
   ```
   tests/sdk/<name>.test.ts
   ```

3. **Add test script to `package.json`:**
   ```json
   "test:sdk:<name>": "jest tests/sdk/<name>.test.ts"
   ```

4. **Follow the pattern from `basic.test.ts`:**
   - Use Puppeteer for browser automation
   - Navigate with `?newsession=true` for test isolation
   - Test user interactions and verify results
   - Log steps for debugging

## Test Coverage by Example

| Example | Path | Test | Status |
|---------|------|------|--------|
| Basic Flow Run | `/examples/sdk/basic` | `tests/sdk/basic.test.ts` | ✅ 2 tests |
| Streaming Tokens | `/examples/sdk/streaming` | `tests/sdk/streaming.test.ts` | 📋 Planned |
| Dynamic MCP | `/examples/sdk/dynamic-mcp` | `tests/sdk/dynamic-mcp.test.ts` | 📋 Planned |
| Chat Popup | `/examples/chat-sdk/popup` | `tests/chat-sdk/popup.test.ts` | 📋 Planned |
| Chat Panel | `/examples/chat-sdk/panel` | `tests/chat-sdk/panel.test.ts` | 📋 Planned |

## Benefits of This Structure

1. **Easy to find tests** - Test location mirrors example location
2. **Scalable** - Each SDK (backend/frontend) has its own test directory
3. **Clear ownership** - Each example has a corresponding test file
4. **Parallel development** - Can add examples and tests independently
5. **Consistent naming** - `basic.tsx` → `basic.test.ts`

## Documentation

Each test directory has its own README:

- `tests/README.md` - Overview of all tests
- `tests/sdk/README.md` - SDK-specific test documentation
- `tests/chat-sdk/README.md` - Chat SDK test documentation

For detailed testing guide, see `TESTING.md` in the project root.

