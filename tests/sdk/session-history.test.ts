/**
 * Session History Tests (SDK)
 * 
 * Tests for FlowRequest.getSession() - Retrieving session flow requests
 * 
 * This test validates that:
 * 1. Flow requests can be created and executed
 * 2. Session history can be retrieved using flowId and sessionId
 * 3. The returned flow requests contain expected data
 * 
 * Test Scenarios:
 * 1. Create flow request and retrieve session history:
 *    - Run a flow with a simple input
 *    - Retrieve session history using flowId and sessionId
 *    - Verify flow requests are returned
 *    - Verify flow request contains expected fields
 * 
 * 2. Multiple messages in session:
 *    - Send multiple messages in same session
 *    - Retrieve session history
 *    - Verify all flow requests are returned in order
 */

import puppeteer, { Browser, Page } from 'puppeteer';

const TIMEOUT = 60000; // 60 seconds
const BASE_URL = 'http://localhost:3500';

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('SDK: FlowRequest.getSession()', () => {
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
        if (text.includes('[Frontend]') || text.includes('[API]') || text.includes('Session:')) {
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
   * Test: Create flow request and retrieve session history
   * 
   * Steps:
   * 1. Navigate to page with ?newsession=true to start fresh
   * 2. Send a simple message
   * 3. Wait for response
   * 4. Capture sessionId and flowId
   * 5. Make API call to get session history
   * 6. Verify flow requests are returned
   * 7. Verify flow request contains expected fields
   */
  test('Retrieve session history after creating flow request', async () => {
    console.log('\n=== TEST: Session History Retrieval ===');
    
    // Step 1: Navigate to page with newsession=true
    await page.goto(`${BASE_URL}/examples/sdk/basic?newsession=true`, { 
      waitUntil: 'networkidle2', 
      timeout: TIMEOUT 
    });
    console.log('✓ Navigated to /examples/sdk/basic?newsession=true');

    await wait(2000);

    // Step 2: Send a simple message
    const inputSelector = 'input[type="text"], textarea';
    await page.waitForSelector(inputSelector, { timeout: TIMEOUT });
    
    await page.type(inputSelector, 'hello', { delay: 50 });
    console.log('✓ Typed: "hello"');

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
      } else {
        throw new Error('Send button not found or disabled');
      }
    });
    console.log('✓ Clicked Send button');

    // Step 3: Wait for agent response
    await wait(8000);

    // Step 4: Capture sessionId from the page
    const sessionId = await page.evaluate(() => {
      const sessionText = Array.from(document.querySelectorAll('*')).find(
        el => el.textContent?.includes('Session:')
      );
      if (sessionText) {
        const match = sessionText.textContent?.match(/Session: ([a-f0-9-]+)/);
        return match ? match[1] : null;
      }
      return null;
    });

    expect(sessionId).toBeTruthy();
    console.log(`✓ Captured session ID: ${sessionId}`);

    // Get flowId from environment (we need to retrieve this from the page or env)
    const flowId = await page.evaluate(() => {
      // Try to find flowId in the page's localStorage or env
      return (window as any).__NEXT_DATA__?.props?.pageProps?.flowId || 
             localStorage.getItem('flowId') ||
             null;
    });

    // If flowId not in page, we'll read it from the test environment
    const testFlowId = flowId || process.env.NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_FLOW_ID;
    
    expect(testFlowId).toBeTruthy();
    console.log(`✓ Using flow ID: ${testFlowId}`);

    // Step 5: Make API call to get session history
    const response = await page.evaluate(async (sid, fid) => {
      try {
        const res = await fetch(`/api/session-history?sessionId=${sid}&flowId=${fid}&flowType=basic`);
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
      } catch (error) {
        return { 
          ok: false, 
          status: 500, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }, sessionId, testFlowId);

    console.log(`✓ API Response Status: ${response.status}`);
    
    // Step 6: Verify flow requests are returned
    expect(response.ok).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.flowRequests).toBeDefined();
    expect(Array.isArray(response.data.flowRequests)).toBe(true);
    expect(response.data.flowRequests.length).toBeGreaterThan(0);
    
    console.log(`✓ Retrieved ${response.data.flowRequests.length} flow request(s)`);

    // Step 7: Verify flow request contains expected fields
    const flowRequest = response.data.flowRequests[0];
    expect(flowRequest).toHaveProperty('id');
    expect(flowRequest).toHaveProperty('flow_id');
    expect(flowRequest).toHaveProperty('flow_session_id');
    expect(flowRequest).toHaveProperty('body'); // Input data
    expect(flowRequest).toHaveProperty('response'); // Output data
    expect(flowRequest.flow_session_id).toBe(sessionId);
    expect(flowRequest.flow_id).toBe(testFlowId);
    
    console.log('✓ Flow request contains expected fields:');
    console.log(`  - id: ${flowRequest.id}`);
    console.log(`  - flow_id: ${flowRequest.flow_id}`);
    console.log(`  - flow_session_id: ${flowRequest.flow_session_id}`);
    console.log(`  - body keys: ${flowRequest.body ? Object.keys(flowRequest.body).join(', ') : 'none'}`);
    console.log(`  - response keys: ${flowRequest.response ? Object.keys(flowRequest.response).join(', ') : 'none'}`);
    
    console.log('✓ TEST PASSED: Session history retrieved successfully');
  }, TIMEOUT * 3);

  /**
   * Test: Multiple messages in session
   * 
   * Steps:
   * 1. Navigate to page with ?newsession=true
   * 2. Send first message
   * 3. Wait for response
   * 4. Send second message
   * 5. Wait for response
   * 6. Get session history
   * 7. Verify both flow requests are returned
   * 8. Verify they are in chronological order
   */
  test('Retrieve multiple flow requests from session history', async () => {
    console.log('\n=== TEST: Multiple Messages in Session ===');
    
    // Step 1: Navigate to page with newsession=true
    await page.goto(`${BASE_URL}/examples/sdk/basic?newsession=true`, { 
      waitUntil: 'networkidle2', 
      timeout: TIMEOUT 
    });
    console.log('✓ Navigated to /examples/sdk/basic?newsession=true');

    await wait(2000);

    const inputSelector = 'input[type="text"], textarea';
    await page.waitForSelector(inputSelector, { timeout: TIMEOUT });

    // Helper function to send message
    const sendMessage = async (message: string) => {
      await page.type(inputSelector, message, { delay: 50 });
      console.log(`✓ Typed: "${message}"`);

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
    };

    // Step 2: Send first message
    await sendMessage('first message');
    await wait(8000);

    // Capture sessionId
    const sessionId = await page.evaluate(() => {
      const sessionText = Array.from(document.querySelectorAll('*')).find(
        el => el.textContent?.includes('Session:')
      );
      if (sessionText) {
        const match = sessionText.textContent?.match(/Session: ([a-f0-9-]+)/);
        return match ? match[1] : null;
      }
      return null;
    });

    expect(sessionId).toBeTruthy();
    console.log(`✓ Captured session ID: ${sessionId}`);

    // Step 4: Send second message
    await sendMessage('second message');
    await wait(8000);

    // Get flowId
    const testFlowId = process.env.NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_FLOW_ID;
    expect(testFlowId).toBeTruthy();
    console.log(`✓ Using flow ID: ${testFlowId}`);

    // Step 6: Get session history
    const response = await page.evaluate(async (sid, fid) => {
      const res = await fetch(`/api/session-history?sessionId=${sid}&flowId=${fid}&flowType=basic`);
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }, sessionId, testFlowId);

    console.log(`✓ API Response Status: ${response.status}`);
    
    // Step 7: Verify both flow requests are returned
    expect(response.ok).toBe(true);
    expect(response.data.flowRequests).toBeDefined();
    expect(Array.isArray(response.data.flowRequests)).toBe(true);
    expect(response.data.flowRequests.length).toBeGreaterThanOrEqual(2);
    
    console.log(`✓ Retrieved ${response.data.flowRequests.length} flow request(s)`);

    // Step 8: Verify they are in chronological order
    const flowRequests = response.data.flowRequests;
    for (let i = 1; i < flowRequests.length; i++) {
      const prevCreated = new Date(flowRequests[i - 1].created).getTime();
      const currCreated = new Date(flowRequests[i].created).getTime();
      expect(currCreated).toBeGreaterThanOrEqual(prevCreated);
    }
    
    console.log('✓ Flow requests are in chronological order');
    console.log('✓ Flow request details:');
    flowRequests.forEach((req: any, index: number) => {
      console.log(`  ${index + 1}. ID: ${req.id}, Created: ${req.created}`);
    });
    
    console.log('✓ TEST PASSED: Multiple flow requests retrieved successfully');
  }, TIMEOUT * 4);
});

