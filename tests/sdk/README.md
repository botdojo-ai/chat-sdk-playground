# SDK Tests

Tests for `@botdojo/sdk` examples.

## Test Files

### `basic.test.ts`

Tests the Basic Flow Run example at `/examples/sdk/basic`.

**Validates:**
- ✅ Session ID persistence across requests
- ✅ Agent memory (context retention)
- ✅ Tool execution and display
- ✅ UI rendering of tool calls and results

**Run:**
```bash
pnpm test:sdk:basic
```

### `model-context.test.ts`

Tests the Model Context example at `/examples/sdk/model-context`.

**Validates:**
- ✅ Custom tool definition via Model Context
- ✅ reverse_string tool execution
- ✅ Tool arguments and results display
- ✅ Quick action buttons functionality

**Test Cases:**

1. **Tool Execution Test**
   - User sends: "reverse the string hello"
   - Verifies: reverse_string tool is called
   - Verifies: Tool arguments contain "hello"
   - Verifies: Tool result contains "olleh"
   - Verifies: Agent response includes reversed string

2. **Tool Discovery Test**
   - User asks: "what tools do you have access to?"
   - Verifies: Agent mentions reverse_string tool

3. **Quick Action Test**
   - Clicks "Reverse Hello" quick action button
   - Verifies: Input is populated correctly
   - Verifies: Tool executes and displays result

**Run:**
```bash
pnpm test:sdk:model-context
```

## Future Tests

Planned test files for additional SDK examples:

- `streaming.test.ts` - Advanced token streaming patterns
- `dynamic-mcp.test.ts` - Dynamic tool registration
- `session-management.test.ts` - Create and resume sessions
- `error-handling.test.ts` - Error recovery patterns

## Adding New Tests

When adding a new SDK example:

1. Create the example page: `pages/examples/sdk/<name>.tsx`
2. Create the test file: `tests/sdk/<name>.test.ts`
3. Add test script: `"test:sdk:<name>": "jest tests/sdk/<name>.test.ts"` to `package.json`
4. Follow the pattern from `basic.test.ts`
5. Use `?newsession=true` parameter for test isolation

## Test Pattern

```typescript
import puppeteer, { Browser, Page } from 'puppeteer';

const TIMEOUT = 60000;
const BASE_URL = 'http://localhost:3500';
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('SDK Example: <Name>', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    // Set up logging and error handlers
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Test case description', async () => {
    // 1. Navigate with ?newsession=true
    await page.goto(`${BASE_URL}/examples/sdk/<name>?newsession=true`);
    
    // 2. Interact with page
    // 3. Verify expectations
    
  }, TIMEOUT * 3);
});
```

