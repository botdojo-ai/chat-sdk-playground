import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  BotDojoChat,
  BotDojoChatControl,
  ModelContext,
  ToolExecutionContext,
} from '@botdojo/chat-sdk';
import { config } from '../../../../config';
import { useBotDojoChatDebugLogger } from '@/utils/BotDojoChatDebug';
import { eventBus } from '@/utils/eventBus';
import { useBonsaiChatSafe } from '@/contexts/BonsaiChatContext';
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

// =============================================================================
// Types
// =============================================================================

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  inStock: boolean;
  imagePrompt?: string;
  imagePath?: string;
}

interface CartItem extends Product {
  quantity: number;
}

// Load products from JSON file
import productsData from '../data/products.json';

const toAbsoluteImage = (path?: string) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
};

// Helper to get product catalog with absolute image URLs (called at runtime)
const getProductCatalog = (): Product[] => {
  return productsData.map((p) => ({
    ...p,
    imagePath: toAbsoluteImage(p.imagePath),
  }));
};

// For static lookups that don't need absolute URLs (e.g. finding product by ID)
const PRODUCT_CATALOG_RAW: Product[] = productsData as Product[];

// =============================================================================
// Helper: Generate page context for agent system prompt
// =============================================================================

function generatePageContext(pathname: string, queryId: string | undefined): string {
  if (pathname.includes('/product/')) {
    const product = PRODUCT_CATALOG_RAW.find(p => p.id === queryId);
    if (product) {
      return `**Current Page: Product Detail - ${product.name}**

The customer is viewing a ${product.category} priced at $${product.price.toFixed(2)}.

**Product:**  
- **ID:** ${product.id}
- **Name:** ${product.name}  
- **Price:** $${product.price.toFixed(2)}  
- **Category:** ${product.category}  
- **Description:** ${product.description}  
- **In Stock:** ${product.inStock ? 'Yes' : 'No'}

**What you can help with:**
- Add this item to cart (use addToCart tool)
- Answer questions about this specific product
- Compare with other products
- Suggest related items
- Provide care instructions`;
    }
    return `**Current Page: Product Detail**

The customer is viewing a specific product page.`;
  }
  
  if (pathname === '/examples/bonsai-shop/checkout') {
    return `**Current Page: Checkout**

The customer is on the checkout page ready to complete their purchase.

**Available on this page:**
- Cart summary with all items
- Quantity adjustments
- Remove items option
- Order total calculation
- Checkout form

**What you can help with:**
- Review cart contents (use getCart tool to fetch current cart)
- Answer last-minute questions about products
- Help with quantity adjustments
- Process the checkout
- Suggest additional items`;
  }
  
  return `**Current Page: Serenity Bonsai Co.**

Welcome to our premium bonsai shop! I can help you find products, answer questions, and complete your purchase.`;
}

// =============================================================================
// Helper: Build agent resource content (system prompt context)
// =============================================================================

function buildResourceContent(cart: CartItem[], pageContext: string): string {
  const cartSummary = cart.length > 0
    ? `\n\n**Current Cart (${cart.length} items):**\n${cart.map(item => 
        `- ${item.name} x${item.quantity} @ $${item.price.toFixed(2)}`
      ).join('\n')}\n**Total:** $${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}`
    : '\n\n**Cart:** Empty';
  
  return `You are a helpful AI assistant for Serenity Bonsai Co., a premium bonsai shop.

${pageContext}
${cartSummary}

**Available Tools:**
- searchProducts: Search for products by keyword
- showProductCard: Display a product card with image and details
- addToCart: Add products to cart
- removeFromCart: Remove items from cart
- getCart: Get cart contents
- showCart: Display visual cart card
- checkout: Show checkout summary

**Guidelines:**
- When customers ask about products, search first, then show product cards
- Show product cards with images so customers can see what they're buying
- When showing cart, use the visual cart card (showCart)
- Be friendly and knowledgeable about bonsai care
- Suggest related products when appropriate

**Navigation:**
You can redirect users to a product detail page using this URL pattern:
- Product page: /examples/bonsai-shop/product/{product_id}
- Example: /examples/bonsai-shop/product/cherry-blossom-bonsai
Use this when customers want to see more details about a specific product or when they click "View Details" on a product card.

**Interactive Prompt Buttons (use when appropriate):**
You can include clickable prompt buttons to help guide the user. Use this format in your text response:
<promptbutton label="Button Label" body='{"text_input": "The message to send"}'></promptbutton>

Only include prompt buttons when they would be genuinely helpful, such as:
- When offering clear next steps after completing an action
- When no search results are found and you want to suggest alternatives
- When presenting a decision point with 2-3 distinct options

Do NOT include prompt buttons for:
- Simple informational responses or answers to questions
- Every message (avoid button fatigue)
- When the user's intent is already clear

Examples of good usage:
- No results found: <promptbutton label="Browse all trees" body='{"text_input": "Show me all bonsai trees"}'></promptbutton>
- After adding to cart: <promptbutton label="View cart" body='{"text_input": "Show my cart"}'></promptbutton> <promptbutton label="Continue shopping" body='{"text_input": "Show me more products"}'></promptbutton>`;
}

// =============================================================================
// Component Props
// =============================================================================

export interface BonsaiShopAgentProps {
  /** Whether the chat panel is open - controlled by parent */
  isOpen?: boolean;
}

// =============================================================================
// BonsaiShopAgent Component
// =============================================================================

export default function BonsaiShopAgent({ isOpen }: BonsaiShopAgentProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const [currentPageContext, setCurrentPageContext] = useState<string>('');
  
  // Get temporary JWT token for secure API access
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();
  
  // Get context for registering chat control and ready state
  const bonsaiChat = useBonsaiChatSafe();
  
  // Get debug logger from the global provider (provided by _app.tsx)
  const debugLogger = useBotDojoChatDebugLogger();
  const debugLoggerRef = useRef(debugLogger);
  
  useEffect(() => {
    debugLoggerRef.current = debugLogger;
  }, [debugLogger]);
  
  useEffect(() => {
    if (debugLogger) {
      debugLogger.logInfo('BonsaiShopAgent mounted - debug logger connected');
    }
  }, [debugLogger]);

  // Refs to access current state in tool functions without causing remounts
  const cartRef = useRef<CartItem[]>([]);
  const currentPageContextRef = useRef<string>('');

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    currentPageContextRef.current = currentPageContext;
  }, [currentPageContext]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const existingCart = localStorage.getItem('bonsai-cart');
    if (existingCart) {
      try {
        setCart(JSON.parse(existingCart));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bonsai-cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
  }, [cart]);

  // Update page context when route changes
  useEffect(() => {
    setCurrentPageContext(generatePageContext(router.pathname, router.query.id as string));
  }, [router.pathname, router.query.id]);

  // =============================================================================
  // Model Context - Single source of truth for tools, resources, and metadata
  // =============================================================================
  
  const bonsaiShopContext: ModelContext = useMemo(() => ({
    name: 'bonsai-shop',
    description: 'Serenity Bonsai Co. - Premium bonsai shop with shopping cart',
    toolPrefix: 'bonsai_shop',
    uri: 'bonsai-shop://context',
    
    // -------------------------------------------------------------------------
    // Resources
    // -------------------------------------------------------------------------
    resources: [
      {
        name: 'card',
        uri: 'bonsai-shop://context/card',
        description: 'Bonsai shop assistant context with cart state and guidelines',
        mimeType: 'text/plain',
        getContent: async () => buildResourceContent(cartRef.current, currentPageContextRef.current),
      },
      {
        uri: 'ui://bonsai-shop/product-card',
        name: 'Product Card MCP App',
        description: 'MCP App for displaying product details with add-to-cart functionality',
        mimeType: 'text/html;profile=mcp-app',
        getContent: async () => {
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          // Get current origin for CSP resourceDomains (allows loading images from this origin)
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          return {
            uri: 'ui://bonsai-shop/product-card',
            mimeType: 'text/html;profile=mcp-app',
            text: await fetchMcpAppHtml('product-card'),
            _meta: {
              ui: {
                csp: {
                  resourceDomains: origin ? [origin] : [],
                },
              },
            },
          };
        },
      },
      {
        uri: 'ui://bonsai-shop/cart',
        name: 'Cart MCP App',
        description: 'MCP App for displaying shopping cart contents',
        mimeType: 'text/html;profile=mcp-app',
        getContent: async () => {
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          return {
            uri: 'ui://bonsai-shop/cart',
            mimeType: 'text/html;profile=mcp-app',
            text: await fetchMcpAppHtml('cart'),
            _meta: {
              ui: {
                csp: {
                  resourceDomains: origin ? [origin] : [],
                },
              },
            },
          };
        },
      },
      {
        uri: 'ui://bonsai-shop/checkout-summary',
        name: 'Checkout Summary MCP App',
        description: 'MCP App for displaying checkout summary',
        mimeType: 'text/html;profile=mcp-app',
        getContent: async () => {
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
       
          return {
            uri: 'ui://bonsai-shop/checkout-summary',
            mimeType: 'text/html;profile=mcp-app',
            text: await fetchMcpAppHtml('checkout-summary'),
            _meta: {
              ui: {
                csp: {
                  resourceDomains: origin ? [origin] : [],
                },
              },
            },
          };
        },
      },
    ],
    
    // -------------------------------------------------------------------------
    // Tools - Each tool has name, description, inputSchema, _meta, and execute
    // -------------------------------------------------------------------------
    tools: [
      {
        name: 'searchProducts',
        description: 'Search for products in the catalog',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            category: { 
              type: 'string', 
              description: 'Product category to filter by',
              enum: ['all', 'tree', 'towel', 'hat', 'pet-sweater']
            }
          }
        },
        execute: async (params: { query?: string; category?: string }) => {
          let results = getProductCatalog();
          if (params.category && params.category !== 'all') {
            results = results.filter(p => p.category === params.category);
          }
          if (params.query?.trim()) {
            const searchTerm = params.query.toLowerCase();
            results = results.filter(p =>
              p.name.toLowerCase().includes(searchTerm) ||
              p.description.toLowerCase().includes(searchTerm) ||
              p.category.toLowerCase().includes(searchTerm)
            );
          }
          return results;
        },
      },
      {
        name: 'addToCart',
        description: 'Add a product to the shopping cart',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'The ID of the product to add' },
            quantity: { type: 'number', description: 'Quantity to add (default: 1)' }
          },
          required: ['productId']
        },
        execute: async (params: { productId: string; quantity?: number }) => {
          const catalog = getProductCatalog();
          const product = catalog.find(p => p.id === params.productId);
          if (!product) return { success: false, error: 'Product not found' };
          if (!product.inStock) return { success: false, error: 'Product is out of stock' };
          
          const quantity = params.quantity || 1;
          const existing = cartRef.current.find(item => item.id === params.productId);
          const newCart = existing
            ? cartRef.current.map(item => item.id === params.productId 
                ? { ...item, quantity: item.quantity + quantity } 
                : item)
            : [...cartRef.current, { ...product, quantity }];
          
          setCart(newCart);
          return { success: true, cart: newCart, message: `Added ${product.name} to cart` };
        },
      },
      {
        name: 'getCart',
        description: 'Get the current shopping cart contents',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'Set to true to go to the cart page' }
          },
          required: ['go']
        },
        execute: async () => ({
          items: cartRef.current,
          total: cartRef.current.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: cartRef.current.reduce((sum, item) => sum + item.quantity, 0)
        }),
      },
      {
        name: 'removeFromCart',
        description: 'Remove a product from the cart',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'The ID of the product to remove' }
          },
          required: ['productId']
        },
        execute: async (params: { productId: string }) => {
          const newCart = cartRef.current.filter(item => item.id !== params.productId);
          setCart(newCart);
          return { success: true, cart: newCart };
        },
      },
      {
        name: 'updateCartQuantity',
        description: 'Update the quantity of a product in the cart',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'The ID of the product' },
            quantity: { type: 'number', description: 'New quantity' }
          },
          required: ['productId', 'quantity']
        },
        execute: async (params: { productId: string; quantity: number }) => {
          if (params.quantity <= 0) {
            const newCart = cartRef.current.filter(item => item.id !== params.productId);
            setCart(newCart);
            return { success: true, cart: newCart };
          }
          const newCart = cartRef.current.map(item =>
            item.id === params.productId ? { ...item, quantity: params.quantity } : item
          );
          setCart(newCart);
          return { success: true, cart: newCart };
        },
      },
      {
        name: 'showProductCard',
        description: 'Display a visual product card in the chat showing product details, image, and add-to-cart button',
        inputSchema: {
          type: 'object',
          properties: {
            product_id: { type: 'string', description: 'Product ID to display. This is a number.' }
          },
          required: ['product_id']
        },
        _meta: {
          'botdojo/display-name': 'Show Product Card',
          'botdojo/no-cache': true,
          ui: { resourceUri: 'ui://bonsai-shop/product-card' },
        },
        execute: async (params: { product_id: string }, context?: ToolExecutionContext) => {
          context?.notifyToolInputPartial?.({ product_id: params.product_id });
          return { product_id: params.product_id };
        },
      },
      {
        name: 'showCart',
        description: 'Display a visual cart card in the chat showing all items, quantities, prices, and total',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Optional message to display with cart' }
          }
        },
        _meta: {
          'botdojo/display-name': 'Show Cart',
          'botdojo/no-cache': true,
          ui: { resourceUri: 'ui://bonsai-shop/cart' },
        },
        execute: async (params: { message?: string }, context?: ToolExecutionContext) => {
          context?.notifyToolInputPartial?.({ fetchCart: true });
          return { fetchCart: true };
        },
      },
      {
        name: 'checkout',
        description: 'Proceed to checkout with current cart items - displays a checkout summary card',
        inputSchema: {
          type: 'object',
          properties: {
            confirm: { type: 'boolean', description: 'Confirm checkout' }
          }
        },
        _meta: {
          'botdojo/display-name': 'Checkout',
          'botdojo/no-cache': true,
          ui: { resourceUri: 'ui://bonsai-shop/checkout-summary' },
        },
        execute: async (params: { confirm?: boolean }, context?: ToolExecutionContext) => {
          context?.notifyToolInputPartial?.({ fetchCart: true });
          return { fetchCart: true };
        },
      },
    ],
    prompts: [],
  }), [currentPageContext]);

  // Check if we should render (only on bonsai shop pages, not canvas pages)
  const isBonsaiShopPage = router.pathname.includes('/bonsai-shop');
  const isCanvasPage = router.pathname.includes('/canvas/');
  const shouldRenderChat = isBonsaiShopPage && !isCanvasPage;

  // =============================================================================
  // MCP App Tool Handler - For tool calls from MCP App iframes (SEP-1865)
  // =============================================================================
  
  const handleToolCall = useCallback(
    async (tool: string, params: any, appId?: string) => {
      debugLoggerRef.current?.logCanvasTool(tool, params, appId || '');
      eventBus.logInfo('MCP App tool', { tool, params, appId }, 'mcp');

      switch (tool) {
        case 'addToCart': {
          const catalog = getProductCatalog();
          const product = catalog.find(p => p.id === params?.productId);
          if (!product) return { success: false, error: 'Product not found' };
          if (!product.inStock) return { success: false, error: 'Product is out of stock' };
          
          const quantity = params?.quantity || 1;
          const existing = cartRef.current.find(item => item.id === params.productId);
          const newCart = existing
            ? cartRef.current.map(item => item.id === params.productId 
                ? { ...item, quantity: item.quantity + quantity } 
                : item)
            : [...cartRef.current, { ...product, quantity }];
          
          setCart(newCart);
          return { success: true, cart: newCart, message: `Added ${product.name} to cart` };
        }
        
        case 'removeFromCart': {
          const newCart = cartRef.current.filter(item => item.id !== params?.productId);
          setCart(newCart);
          return { success: true, cart: newCart };
        }
        
        case 'updateCartQuantity': {
          if (params?.quantity <= 0) {
            const newCart = cartRef.current.filter(item => item.id !== params?.productId);
            setCart(newCart);
            return { success: true, cart: newCart };
          }
          const newCart = cartRef.current.map(item =>
            item.id === params?.productId ? { ...item, quantity: params.quantity } : item
          );
          setCart(newCart);
          return { success: true, cart: newCart };
        }
        
        case 'getCart':
          return {
            items: cartRef.current,
            total: cartRef.current.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            itemCount: cartRef.current.reduce((sum, item) => sum + item.quantity, 0)
          };
        
        case 'getProductInfo': {
          const catalog = getProductCatalog();
          const product = catalog.find(p => p.id === params?.productId);
          if (!product) return { success: false, error: `Product not found: ${params?.productId}` };
          return {
            id: product.id,
            name: product.name,
            price: product.price.toString(),
            description: product.description,
            category: product.category,
            imagePath: product.imagePath,
            imageUrl: product.imagePath,
            inStock: product.inStock,
          };
        }
        
        default:
          return { success: false, error: `Unknown tool: ${tool}` };
      }
    },
    [],
  );

  if (!shouldRenderChat) {
    return null;
  }

  // Wait for token to load
  if (tokenLoading || !token) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: '#94a3b8'
      }}>
        Loading chat...
      </div>
    );
  }

  if (tokenError) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: '#ef4444'
      }}>
        Error loading chat: {tokenError}
      </div>
    );
  }

  return (
    <BotDojoChat
      apiKey={token}
      mode='inline'
      autoFocus={false}
      baseUrl={config.baseUrl}
      modelContext={bonsaiShopContext}
      newSession={false}
      accentColor="#10b981"
      backgroundColor="#1e293b"
      theme="modern-dark"
      hideBotIcon={true}
      sessionKeyPrefix="bonsai-shop"
      width="100%"
      height="100%"
      welcomeMessage={`## Welcome to the Bonsai Shop Agent.
<promptbutton label="I need a sweater for my cat" body='{"text_input": "I need a sweater for my cat"}'></promptbutton> <promptbutton label="I need a towel" body='{"text_input": "I need a towel"}'></promptbutton> `}
      onBotDojoChatControl={(control) => {
        console.log('[BonsaiShop] Chat control initialized');
        setChatControl(control);
        // Register with context for cross-component access
        bonsaiChat?.registerChatControl(control);
        debugLoggerRef.current?.logInfo('Chat control initialized');
      }}
      onConnectorError={(error) => {
        console.error('[BonsaiShop] Connector error:', error);
        debugLoggerRef.current?.logError(error);
      }}
      // Flow event handlers - log to global debug panel (use ref for latest logger)
      onReady={() => {
        console.log('[BonsaiShop] onReady called, debugLogger:', !!debugLoggerRef.current);
        debugLoggerRef.current?.logReady();
        // Notify context that chat is ready (sends any pending prompts)
        bonsaiChat?.onChatReady();
      }}
      onError={(error, messageId, stepId) => {
        console.log('[BonsaiShop] onError called:', error);
        debugLoggerRef.current?.logError(error, messageId, stepId);
      }}
      onMessageStart={(role, messageId) => {
        console.log('[BonsaiShop] onMessageStart:', role, messageId);
        debugLoggerRef.current?.logMessageStart(role, messageId);
      }}
      onMessageComplete={(messageId, content) => {
        console.log('[BonsaiShop] onMessageComplete:', messageId);
        debugLoggerRef.current?.logMessageComplete(messageId, content);
      }}
      onToken={(messageId, tokenUpdate) => {
        console.log('[BonsaiShop] onToken:', tokenUpdate.token);
        debugLoggerRef.current?.logToken(messageId, tokenUpdate.token);
      }}
      onStepUpdate={(messageId, step) => {
        console.log('[BonsaiShop] onStepUpdate:', step);
        debugLoggerRef.current?.logStep(messageId, step);
      }}
      onSessionCreated={(sessionId) => {
        console.log('[BonsaiShop] onSessionCreated:', sessionId);
        debugLoggerRef.current?.logSessionCreated(sessionId);
      }}
      onSessionHydrated={(sessionId, messageCount) => {
        console.log('[BonsaiShop] onSessionHydrated:', sessionId, messageCount);
        debugLoggerRef.current?.logSessionHydrated(sessionId, messageCount);
      }}
      onRequestAborted={() => {
        console.log('[BonsaiShop] onRequestAborted');
        debugLoggerRef.current?.logRequestAborted();
      }}
      // MCP App event handlers (using BotDojoChatProps API)
      onOpenLink={(url: string, target: string, appId: string) => {
        debugLoggerRef.current?.logCanvasLink(url, target, appId);
          router.push(url);
        
      }}
      onToolCall={(tool: string, params: any, appId: string) => {
        // Handle both intents and tool calls from MCP Apps
        debugLoggerRef.current?.logCanvasTool(tool, params, appId);
        return handleToolCall(tool, params, appId);
      }}
      onUiMessage={(message: string, params: any, appId: string) => {
        // Handle both notify and prompt messages
        debugLoggerRef.current?.logCanvasNotify(message, params, appId);
        
        // Check for BotDojo extension: botdojo/triggerAgent in content
        const content = params?.content?.[0];
        const shouldTriggerAgent = 
          content?.['botdojo/triggerAgent'] === true 
        
        if (shouldTriggerAgent) {
          if (!chatControl) {
            console.warn('[BonsaiShop] MCP App triggerAgent received but chatControl not ready');
            return;
          }
          // Extract text from content if available
          const textInput = content?.text || message;
          const body = { text_input: textInput};
          console.log('[BonsaiShop] Triggering agent from MCP App:', body);
          chatControl
            .sendFlowRequest(body)
            .catch((err: Error) => console.error('[BonsaiShop] Failed to trigger agent from MCP App', err));
        }
      }}
    />
  );
}
