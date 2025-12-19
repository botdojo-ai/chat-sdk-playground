/**
 * BonsaiShopWrapper - Self-contained wrapper for Bonsai Shop pages
 * 
 * This component wraps all Bonsai Shop pages and provides:
 * - BotDojoChat integration with model context
 * - Debug panel for event logging
 * - Cart management and page context
 * 
 * Only applied within the Bonsai Shop section, not globally.
 */

import React, { ReactNode, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { BotDojoChat, ModelContext } from '@botdojo/chat-sdk';
import { 
  BotDojoChatDebugProvider, 
  BotDojoChatDebugPanel,
  useBotDojoChatDebugLogger,
  useBotDojoChatDebugLayout
} from '../utils/BotDojoChatDebug';
import { config } from '../../config';
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

interface BonsaiShopWrapperProps {
  children: ReactNode;
}

function BonsaiShopWrapperContent({ children }: BonsaiShopWrapperProps): JSX.Element {
  const router = useRouter();
  const [chatControl, setChatControl] = useState<any>(null);
  const cartRef = useRef<any>(null);
  const [, setCartRefState] = useState<any>(null);

  // Get temporary JWT token for secure API access
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();

  // Get debug layout (optimized to not re-render on events) and logger
  const debugLayout = useBotDojoChatDebugLayout();
  const debugLogger = useBotDojoChatDebugLogger();

  // Memoize all callback functions to prevent re-initialization
  // Don't depend on setChatControl - use it directly without closure dependency
  const handleChatControl = useCallback((control: any) => {
    console.log('[BonsaiShop] Chat control initialized - callback #', Date.now());
    setChatControl(control);
    (window as any).bonsaiChatControl = control;
    debugLogger?.logInfo('Chat control initialized');
  }, [debugLogger]);

  const handleConnectorError = useCallback((error: Error) => {
    console.error('[BonsaiShop] Connector error:', error);
    debugLogger?.logError(error);
  }, [debugLogger]);

  const handleReady = useCallback(() => {
    debugLogger?.logReady();
  }, [debugLogger]);

  const handleError = useCallback((error: Error, messageId?: string, stepId?: string) => {
    debugLogger?.logError(error, messageId, stepId);
  }, [debugLogger]);

  const handleMessageStart = useCallback((role: string, messageId: string) => {
    debugLogger?.logMessageStart(role, messageId);
  }, [debugLogger]);

  const handleMessageComplete = useCallback((messageId: string, content: string) => {
    debugLogger?.logMessageComplete(messageId, content);
  }, [debugLogger]);

  const handleToken = useCallback((messageId: string, tokenUpdate: any) => {
    debugLogger?.logToken(messageId, tokenUpdate.token);
  }, [debugLogger]);

  const handleStepUpdate = useCallback((messageId: string, step: any) => {
    debugLogger?.logStep(messageId, step);
  }, [debugLogger]);

  const handleSessionCreated = useCallback((sessionId: string) => {
    debugLogger?.logSessionCreated(sessionId);
  }, [debugLogger]);

  const handleSessionHydrated = useCallback((sessionId: string, messageCount: number) => {
    debugLogger?.logSessionHydrated(sessionId, messageCount);
  }, [debugLogger]);

  const handleRequestAborted = useCallback(() => {
    debugLogger?.logRequestAborted();
  }, [debugLogger]);

  // Store router in ref to avoid dependency on unstable router object
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const handleCanvasLink = useCallback((url: string, target: string, canvasId?: string) => {
    if (canvasId) debugLogger?.logCanvasLink(url, target, canvasId);
    if (target === '_self') {
      // Use router from ref to avoid making handler depend on router object
      routerRef.current.push(url);
    } else {
      window.open(url, target);
    }
  }, [debugLogger]);

  const handleCanvasIntent = useCallback((intent: string, params: any, canvasId?: string) => {
    if (canvasId) debugLogger?.logCanvasIntent(intent, params, canvasId);
  }, [debugLogger]);

  const handleCanvasNotify = useCallback((message: string, params: any, canvasId?: string) => {
    if (canvasId) debugLogger?.logCanvasNotify(message, params, canvasId);
  }, [debugLogger]);

  const handleCanvasPrompt = useCallback((prompt: string, params: any, canvasId?: string) => {
    if (canvasId) debugLogger?.logCanvasPrompt(prompt, params, canvasId);
  }, [debugLogger]);


  // Determine if we're on a Bonsai Shop page
  const isBonsaiShopPage = router.pathname.startsWith('/examples/bonsai-shop');
  const isCanvasPage = router.pathname.includes('/canvas/');

  // Update cart ref setter (useCallback to prevent recreating on every render)
  const setCartRef = useCallback((ref: any) => {
    cartRef.current = ref;
    setCartRefState(ref);
  }, []);

  // Extract stable values from router.query to prevent unnecessary re-renders
  const queryId = router.query.id as string | undefined;
  
  // Determine current page context (keep stable to avoid unnecessary re-renders)
  const currentPageContext = useMemo(() => {
    if (!isBonsaiShopPage) return '';

    const path = router.pathname;

    if (path.includes('/checkout')) {
      // Only include cart info on checkout page where it matters
      const cartLength = cartRef.current?.items?.length || 0;
      return `You are on the checkout page. The user is reviewing their order and preparing to complete their purchase. Their cart contains ${cartLength} items.`;
    } else if (path.includes('/product/')) {
      return `You are on a product detail page (product ID: ${queryId}). The user is viewing detailed information about a specific bonsai tree and can add it to their cart.`;
    } else if (path === '/examples/bonsai-shop') {
      return `You are on the Serenity Bonsai Co. homepage. The user can browse our collection of premium bonsai trees, add items to their cart, and interact with the AI shopping assistant.`;
    }
    return 'You are on the Serenity Bonsai Co. website.';
  }, [router.pathname, queryId, isBonsaiShopPage]); // Keep dependencies minimal

  // Memoize tool handlers separately to ensure stability
  const viewCartHandler = useCallback(async () => {
    const cart = cartRef.current;
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Cart is empty',
              items: [],
              itemCount: 0,
              total: 0,
            }),
          },
        ],
      };
    }

    const cartData = {
      items: cart.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        subtotal: item.price * item.quantity,
      })),
      itemCount: cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      total: cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(cartData, null, 2),
        },
      ],
    };
  }, []); // No dependencies - uses cartRef which is stable

  const proceedToCheckoutHandler = useCallback(async () => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            action: 'navigate',
            url: '/examples/bonsai-shop/checkout',
            message: 'Redirecting to checkout...',
          }),
        },
        {
          type: 'resource',
          resource: {
            uri: 'canvas://link',
            mimeType: 'application/json',
            text: JSON.stringify({
              url: '/examples/bonsai-shop/checkout',
              target: '_self',
            }),
          },
        },
      ],
    };
  }, []); // No dependencies - static navigation

  // Build model context with cart tools
  const bonsaiShopContext: ModelContext = useMemo(() => {
    return {
      name: 'bonsai-shop',
      description: 'Serenity Bonsai Co. - Premium bonsai shop with shopping cart',
      prompts: [
        {
          name: 'page_context',
          description: 'Current page context for the Bonsai Shop website',
          arguments: [],
          messages: [
            {
              role: 'user',
              content: currentPageContext,
            },
          ],
        },
      ],
      resources: [],
      tools: [
        {
          name: 'view_cart',
          description: 'View the current shopping cart contents with all items, quantities, and total price',
          inputSchema: {
            type: 'object',
            properties: {
              go: { type: 'boolean', description: 'Execute the action' },
            },
          },
          handler: viewCartHandler,
        },
        {
          name: 'proceed_to_checkout',
          description: 'Navigate the user to the checkout page to complete their purchase',
          inputSchema: {
            type: 'object',
            properties: {
              go: { type: 'boolean', description: 'Execute the action' },
            },
          },
          handler: proceedToCheckoutHandler,
        },
      ],
    };
  }, [currentPageContext, viewCartHandler, proceedToCheckoutHandler]);

  // Make cart tools available globally for the shop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).bonsaiCartRef = cartRef;
      (window as any).setBonsaiCartRef = setCartRef;
    }
  }, [setCartRef]);

  // Only render BotDojoChat on non-canvas Bonsai Shop pages when token is ready
  const shouldRenderChat = isBonsaiShopPage && !isCanvasPage && !tokenLoading && !tokenError && !!token;
  
  // Calculate chat popup offset based on debug panel state
  const debugPanelWidth = debugLayout.isExpanded ? 400 : 60;
  const chatRightOffset = debugPanelWidth + 20; // 20px padding from panel edge

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100%',
      position: 'relative' 
    }}>
      {/* Dynamic CSS to override BotDojoChat position */}
      {shouldRenderChat && (
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Override BotDojoChat popup position */
            .botdojo-chat-container {
              right: ${chatRightOffset}px !important;
              transition: right 0.3s ease !important;
            }
            
            /* Target the iframe container specifically */
            div[style*="position: fixed"][style*="bottom: 0"][style*="right: 0"] {
              right: ${chatRightOffset}px !important;
              transition: right 0.3s ease !important;
            }
          `
        }} />
      )}
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        minWidth: 0,
        transition: 'margin-right 0.3s ease',
        marginRight: shouldRenderChat ? '0' : '0',
      }}>
        {children}
      </div>

      {/* BotDojoChat - Only on Bonsai Shop pages */}
      {shouldRenderChat && (
        <>
          <BotDojoChat
              key="bonsai-shop-chat" // Stable key to prevent remounting
              apiKey={token}
              mode="chat-popup"
              baseUrl={config.baseUrl}
              modelContext={bonsaiShopContext}
              newSession={false}
              accentColor="#10b981"
              backgroundColor="#1e293b"
              theme="modern-dark"
              hideBotIcon={true}
              onBotDojoChatControl={handleChatControl}
              onConnectorError={handleConnectorError}
              onReady={handleReady}
              onError={handleError}
              onMessageStart={handleMessageStart}
              onMessageComplete={handleMessageComplete}
              onToken={handleToken}
              onStepUpdate={handleStepUpdate}
              onSessionCreated={handleSessionCreated}
              onSessionHydrated={handleSessionHydrated}
              onRequestAborted={handleRequestAborted}
            />
          
          {/* Debug Panel */}
          <BotDojoChatDebugPanel width="400px" />
        </>
      )}
    </div>
  );
}

// Content component (not memoized to avoid children prop issues)
const BonsaiShopWrapperContentComponent = BonsaiShopWrapperContent;

// Main wrapper component with provider
export function BonsaiShopWrapper({ children }: BonsaiShopWrapperProps): JSX.Element {
  const router = useRouter();

  // Memoize router-derived values to prevent unnecessary re-renders
  const shouldRenderChat = useMemo(() => {
    const isBonsaiShopPage = router.pathname.startsWith('/examples/bonsai-shop');
    const isCanvasPage = router.pathname.includes('/canvas/');
    return isBonsaiShopPage && !isCanvasPage;
  }, [router.pathname]);

  return (
    <BotDojoChatDebugProvider enabled={shouldRenderChat} defaultExpanded={false}>
      <BonsaiShopWrapperContentComponent>{children}</BonsaiShopWrapperContentComponent>
    </BotDojoChatDebugProvider>
  );
}

