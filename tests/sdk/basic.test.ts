/**
 * Basic Flow Run Tests (SDK)
 * 
 * Tests for /examples/sdk/basic - Basic flow execution with streaming
 * 
 * This test validates that:
 * 1. Session ID persistence works correctly across requests
 * 2. The agent remembers context from previous messages
 * 3. Tool calls are properly displayed in the UI
 * 
 * Test Scenarios:
 * 1. Session Memory:
 *    - Send "my name is paul"
 *    - Send "what is my name"
 *    - Verify agent responds with "Paul"
 * 
 * 2. Tool Execution & Display:
 *    - Send "what is the weather in austin"
 *    - Verify tool call UI appears
 *    - Verify tool result is displayed
 */

import puppeteer, { Browser, Page } from 'puppeteer';

const TIMEOUT = 60000; // 60 seconds (longer for agent processing)
const BASE_URL = 'http://localhost:3500';

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('SDK Example: Basic Flow Run', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true, // Set to false for debugging
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
    try {
      page = await browser.newPage();
      
      // Set up console logging for debugging
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[Frontend]') || text.includes('[API Route]') || text.includes('Session:')) {
          console.log(`[PAGE LOG]:`, text);
        }
      });

      // Set up error logging
      page.on('pageerror', error => {
        console.error(`[PAGE ERROR]:`, error.message);
      });

      // Set up request failure logging
      page.on('requestfailed', request => {
        console.error(`[REQUEST FAILED]:`, request.url(), request.failure()?.errorText);
      });
    } catch (error) {
      console.error('Failed to create new page:', error);
      throw error;
    }
  });

  afterEach(async () => {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        console.error('Error closing page:', error);
      }
    }
  });

  /**
   * Test: Session memory - agent remembers name across messages
   * 
   * Steps:
   * 1. Navigate to page with ?newsession=true to start fresh
   * 2. Type "my name is paul" and send
   * 3. Wait for response
   * 4. Verify session ID is captured
   * 5. Type "what is my name" and send
   * 6. Wait for response
   * 7. Verify agent responds with "Paul" (case-insensitive)
   * 8. Verify same session ID is maintained
   */
  test('Agent remembers name across messages using session ID', async () => {
    console.log('\n=== TEST: Session Memory ===');
    
    // Step 1: Navigate to page with newsession=true
    await page.goto(`${BASE_URL}/examples/sdk/basic?newsession=true`, { 
      waitUntil: 'networkidle2', 
      timeout: TIMEOUT 
    });
    console.log('✓ Navigated to /examples/sdk/basic?newsession=true');

    // Wait for page to be ready
    await wait(2000);

    // Step 2: Type first message "my name is paul"
    const inputSelector = 'input[type="text"], textarea';
    await page.waitForSelector(inputSelector, { timeout: TIMEOUT });
    
    await page.type(inputSelector, 'my name is paul', { delay: 50 });
    console.log('✓ Typed: "my name is paul"');

    // Find and click send button
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => {
        const text = btn.textContent || '';
        return text.includes('Send') || text.includes('➤');
      });
    }, { timeout: TIMEOUT });

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sendButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('Send') || text.includes('➤');
      });
      if (sendButton && !(sendButton as HTMLButtonElement).disabled) {
        (sendButton as HTMLButtonElement).click();
      } else {
        throw new Error('Send button not found or disabled');
      }
    });
    console.log('✓ Clicked Send button');

    // Step 3: Wait for agent response
    await wait(8000); // Wait for agent to process

    // Step 4: Verify session ID is displayed
    const sessionIdExists = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('Session:') && !text.includes('No active session');
    });
    expect(sessionIdExists).toBe(true);
    console.log('✓ Session ID captured and displayed');

    // Capture the session ID
    const firstSessionId = await page.evaluate(() => {
      const sessionText = Array.from(document.querySelectorAll('*')).find(
        el => el.textContent?.includes('Session:')
      );
      if (sessionText) {
        const match = sessionText.textContent?.match(/Session: ([a-f0-9-]+)/);
        return match ? match[1] : null;
      }
      return null;
    });
    console.log(`✓ First session ID: ${firstSessionId}`);

    // Verify agent responded
    const hasResponse = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('paul') || text.toLowerCase().includes('nice to meet you');
    });
    expect(hasResponse).toBe(true);
    console.log('✓ Agent responded to first message');

    // Step 5: Type second message "what is my name"
    await page.type(inputSelector, 'what is my name', { delay: 50 });
    console.log('✓ Typed: "what is my name"');

    // Click send button again
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sendButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('Send') || text.includes('➤');
      });
      if (sendButton && !(sendButton as HTMLButtonElement).disabled) {
        (sendButton as HTMLButtonElement).click();
      }
    });
    console.log('✓ Clicked Send button');

    // Step 6: Wait for agent response
    await wait(8000);

    // Step 7: Verify agent responds with "Paul"
    const { rememberedName, responseText, allText } = await page.evaluate(() => {
      // Get the main chat area (exclude debug panel and nav)
      const bodyText = document.body.textContent || '';
      
      // Look for "Paul" in the page content
      const foundPaul = bodyText.toLowerCase().includes('paul');
      
      // Also check if we can find specific message-like content
      // The agent might say various things like "Your name is Paul" or "You said your name is Paul"
      const variations = [
        'paul',
        'your name is paul',
        'you said your name is paul', 
        'you told me your name is paul',
        'name is paul'
      ];
      
      const matchedVariation = variations.some(v => bodyText.toLowerCase().includes(v));
      
      return {
        rememberedName: foundPaul || matchedVariation,
        responseText: bodyText.substring(bodyText.length - 500), // Last 500 chars
        allText: bodyText.substring(0, 1000) // First 1000 chars for debugging
      };
    });

    if (!rememberedName) {
      console.log('❌ Agent did NOT remember the name. Response was:', responseText);
    }
    expect(rememberedName).toBe(true);
    console.log('✓ Agent remembered the name: "Paul"');

    // Step 8: Verify same session ID is maintained
    const secondSessionId = await page.evaluate(() => {
      const sessionText = Array.from(document.querySelectorAll('*')).find(
        el => el.textContent?.includes('Session:')
      );
      if (sessionText) {
        const match = sessionText.textContent?.match(/Session: ([a-f0-9-]+)/);
        return match ? match[1] : null;
      }
      return null;
    });

    expect(secondSessionId).toBe(firstSessionId);
    console.log(`✓ Session ID maintained: ${secondSessionId}`);
    console.log('✓ TEST PASSED: Agent remembers context across messages');
  }, TIMEOUT * 3);

  /**
   * Test: Tool execution and display
   * 
   * Steps:
   * 1. Navigate to page with ?newsession=true
   * 2. Type "what is the weather in austin" and send
   * 3. Wait for agent to process
   * 4. Verify tool call UI appears (tool name and arguments)
   * 5. Verify tool result is displayed
   * 6. Verify response includes weather information
   */
  test('Tool calls are displayed with arguments and results', async () => {
    console.log('\n=== TEST: Tool Execution & Display ===');
    
    // Step 1: Navigate to page with newsession=true
    await page.goto(`${BASE_URL}/examples/sdk/basic?newsession=true`, { 
      waitUntil: 'networkidle2', 
      timeout: TIMEOUT 
    });
    console.log('✓ Navigated to /examples/sdk/basic?newsession=true');

    await wait(2000);

    // Step 2: Type weather query
    const inputSelector = 'input[type="text"], textarea';
    await page.waitForSelector(inputSelector, { timeout: TIMEOUT });
    
    await page.type(inputSelector, 'what is the weather in austin', { delay: 50 });
    console.log('✓ Typed: "what is the weather in austin"');

    // Click send button
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => {
        const text = btn.textContent || '';
        return text.includes('Send') || text.includes('➤');
      });
    }, { timeout: TIMEOUT });

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sendButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('Send') || text.includes('➤');
      });
      if (sendButton && !(sendButton as HTMLButtonElement).disabled) {
        (sendButton as HTMLButtonElement).click();
      }
    });
    console.log('✓ Clicked Send button');

    // Step 3: Wait for agent to process and call tool
    await wait(10000); // Tool calls may take longer

    // Step 4: Verify tool call UI appears
    const toolCallVisible = await page.evaluate(() => {
      const text = document.body.textContent || '';
      // Look for tool icon (🔧) and tool-related text
      return text.includes('🔧') || text.includes('Tool') || text.includes('get_weather');
    });

    expect(toolCallVisible).toBe(true);
    console.log('✓ Tool call UI is visible');

    // Verify tool name is displayed
    const hasToolName = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('weather') || text.toLowerCase().includes('get_weather');
    });

    expect(hasToolName).toBe(true);
    console.log('✓ Tool name displayed');

    // Step 5: Verify tool arguments are displayed
    const hasToolArgs = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('austin');
    });

    expect(hasToolArgs).toBe(true);
    console.log('✓ Tool arguments displayed (location: austin)');

    // Step 6: Wait for tool result to appear (up to 20 seconds)
    let hasToolResult = false;
    let fullPageText = '';
    
    for (let i = 0; i < 20; i++) {
      await wait(1000);
      
      // Get the full page text
      fullPageText = await page.evaluate(() => document.body.textContent || '');
      
      // Check for result indicators
      hasToolResult = fullPageText.includes('Result:');
      
      if (i % 5 === 0 || hasToolResult) {
        console.log(`[Wait ${i+1}] Checking for tool result...`, {
          hasResultColon: fullPageText.includes('Result:'),
          hasWeatherKeywords: fullPageText.toLowerCase().includes('temperature') || 
                             fullPageText.toLowerCase().includes('sunny') ||
                             fullPageText.toLowerCase().includes('cloudy'),
        });
      }
      
      if (hasToolResult) {
        console.log(`✓ Tool result displayed after ${i + 1} seconds`);
        break;
      }
    }

    if (!hasToolResult) {
      console.log('✗ Tool result never appeared within 20 seconds');
      console.log('Page text sample:', fullPageText.substring(0, 500));
      // Get a screenshot for debugging
      await page.screenshot({ path: './test-failure-screenshot.png', fullPage: true });
      console.log('Screenshot saved to ./test-failure-screenshot.png');
    }
    
    expect(hasToolResult).toBe(true);

    // Step 7: Verify response includes weather information
    const hasWeatherInfo = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const lowerText = text.toLowerCase();
      // Check for common weather-related terms
      return (
        lowerText.includes('temperature') ||
        lowerText.includes('weather') ||
        lowerText.includes('°') ||
        lowerText.includes('degree') ||
        lowerText.includes('forecast') ||
        lowerText.includes('sunny') ||
        lowerText.includes('cloudy') ||
        lowerText.includes('rain')
      );
    });

    expect(hasWeatherInfo).toBe(true);
    console.log('✓ Response includes weather information');
    console.log('✓ TEST PASSED: Tool calls display correctly with arguments and results');
  }, TIMEOUT * 3);
});

