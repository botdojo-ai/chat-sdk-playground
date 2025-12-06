import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  BotDojoChat,
  BotDojoChatControl,
  ModelContext,
  uiResource,
  textResult,
} from '@botdojo/chat-sdk';
import { config } from '../../../../../config';
import { useBotDojoChatDebugLogger } from '@/lib/BotDojoChatDebug';
import { eventBus } from '@/lib/eventBus';

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

const PRODUCT_CATALOG: Product[] = productsData;

/**
 * BonsaiShopAgent - Chat widget for the Bonsai Shop
 * 
 * This component just renders the BotDojoChat widget and logs events
 * to the global debug panel (provided by _app.tsx).
 * 
 * No need to set up its own provider or debug panel - the app handles that.
 */
export interface BonsaiShopAgentProps {
  /** Whether the chat panel is open - controlled by parent */
  isOpen?: boolean;
}

export default function BonsaiShopAgent({ isOpen }: BonsaiShopAgentProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const [currentPageContext, setCurrentPageContext] = useState<string>('');
  
  // Get debug logger from the global provider (provided by _app.tsx)
  const debugLogger = useBotDojoChatDebugLogger();
  
  // Use ref to always have the latest debugLogger in callbacks
  const debugLoggerRef = useRef(debugLogger);
  useEffect(() => {
    debugLoggerRef.current = debugLogger;
  }, [debugLogger]);
  
  // Debug: Log if debugLogger is available
  useEffect(() => {
    console.log('[BonsaiShopAgent] debugLogger available:', !!debugLogger);
    if (debugLogger) {
      debugLogger.logInfo('BonsaiShopAgent mounted - debug logger connected');
    }
  }, [debugLogger]);

  // Use refs to access current state in tool functions without causing remounts
  const cartRef = useRef<CartItem[]>([]);
  const setCartRef = useRef(setCart);
  const currentPageContextRef = useRef<string>('');

  // Update refs whenever state changes
  useEffect(() => {
    cartRef.current = cart;
    setCartRef.current = setCart;
  }, [cart]);

  // Update page context ref whenever it changes
  useEffect(() => {
    currentPageContextRef.current = currentPageContext;
  }, [currentPageContext]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const existingCart = localStorage.getItem('bonsai-cart');
    if (existingCart) {
      try {
        const cartItems = JSON.parse(existingCart);
        setCart(cartItems);
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bonsai-cart', JSON.stringify(cart));
    // Trigger storage event for FloatingCart to update
    window.dispatchEvent(new Event('storage'));
  }, [cart]);

  /**
   * Generate dynamic page context based on current route.
   * 
   * This context is injected into the agent's system prompt to give it awareness
   * of what the user is currently viewing in the UI. The agent uses this to:
   * - Provide contextually relevant responses
   * - Suggest appropriate actions for the current page
   * - Reference specific products the user is looking at
   * 
   * Page Context Types:
   * - Product Detail: When viewing a specific product, includes full product info
   *   (id, name, price, category, description, stock status) and suggests
   *   actions like "add to cart" or "answer questions about this product"
   * - Checkout: When on checkout page, indicates user is ready to complete purchase
   *   and suggests actions like reviewing cart or processing checkout
   * - Homepage/Default: Generic welcome context for browsing
   * 
   * To add context for new pages:
   * 1. Add a new condition checking router.pathname
   * 2. Return a formatted string with:
   *    - **Current Page:** header identifying the page type
   *    - Relevant data the agent should know about (products, state, etc.)
   *    - **What you can help with:** list of suggested actions
   */
  useEffect(() => {
    const generatePageContext = () => {
      const path = router.pathname;
      
      if (path.includes('/product/')) {
        const productId = router.query.id as string;
        const product = PRODUCT_CATALOG.find(p => p.id === productId);
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
      } else if (path === '/examples/chat-sdk/bonsai-shop/checkout') {
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
    };

    setCurrentPageContext(generatePageContext());
  }, [router.pathname, router.query.id]);

  // Tool functions
  const searchProducts = useCallback((query: string, category?: string) => {
    console.log('[BonsaiShop] Search products:', query, category);
    
    let results = PRODUCT_CATALOG;
    
    if (category && category !== 'all') {
      results = results.filter(p => p.category === category);
    }
    
    if (query && query.trim() !== '') {
      const searchTerm = query.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
      );
    }
    
    return results;
  }, []);

  const addToCart = useCallback((productId: string, quantity: number = 1) => {
    console.log('[BonsaiShop] Add to cart:', productId, quantity);
    
    const product = PRODUCT_CATALOG.find(p => p.id === productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    if (!product.inStock) {
      return { success: false, error: 'Product is out of stock' };
    }
    
    const currentCart = cartRef.current;
    const existing = currentCart.find(item => item.id === productId);
    
    let newCart: CartItem[];
    if (existing) {
      newCart = currentCart.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...currentCart, { ...product, quantity }];
    }
    
    setCartRef.current(newCart);
    
    return {
      success: true,
      cart: newCart,
      message: `Added ${product.name} to cart`
    };
  }, []);

  const getCart = useCallback(() => {
    console.log('[BonsaiShop] Get cart');
    const currentCart = cartRef.current;
    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      items: currentCart,
      total,
      itemCount: currentCart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    console.log('[BonsaiShop] Remove from cart:', productId);
    
    const currentCart = cartRef.current;
    const newCart = currentCart.filter(item => item.id !== productId);
    setCartRef.current(newCart);
    
    return {
      success: true,
      cart: newCart
    };
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    console.log('[BonsaiShop] Update cart quantity:', productId, quantity);
    
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    
    const currentCart = cartRef.current;
    const newCart = currentCart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    setCartRef.current(newCart);
    
    return {
      success: true,
      cart: newCart
    };
  }, [removeFromCart]);

  // Store tool implementations in refs to avoid stale closures
  // These refs are updated on every render so execute functions always have fresh state
  const toolImplRef = useRef({
    searchProducts: (params: { query?: string; category?: string }) => {
      return searchProducts(params.query || '', params.category);
    },
    addToCart: (params: { productId: string; quantity?: number }) => {
      return addToCart(params.productId, params.quantity || 1);
    },
    getCart: () => {
      return getCart();
    },
    removeFromCart: (params: { productId: string }) => {
      return removeFromCart(params.productId);
    },
    updateCartQuantity: (params: { productId: string; quantity: number }) => {
      return updateCartQuantity(params.productId, params.quantity);
    },
    showProductCard: (params: { product_id: string }) => {
      console.log('[BonsaiShop] showProductCard called:', params);
      
      const product = PRODUCT_CATALOG.find(p => p.id === params.product_id);
      
      if (!product) {
        return {
          success: false,
          error: `Product with id "${params.product_id}" not found`
        };
      }

      // Build canvas URL with product data
      const canvasUrl = new URL('/examples/chat-sdk/bonsai-shop/canvas/product-card', window.location.origin);
      canvasUrl.searchParams.set('product_id', product.id);
      canvasUrl.searchParams.set('name', product.name);
      canvasUrl.searchParams.set('price', product.price.toString());
      canvasUrl.searchParams.set('description', product.description);
      canvasUrl.searchParams.set('category', product.category);
      if (product.imagePath) {
        canvasUrl.searchParams.set('imagePath', product.imagePath);
      }
      canvasUrl.searchParams.set('clickable', 'true');

      // Calculate dynamic height
      const descriptionLines = Math.ceil(product.description.length / 35);
      const descriptionHeight = descriptionLines * 25;
      const estimatedHeight = 320 + descriptionHeight + (product.imagePath ? 200 : 0);

      // Return MCP Apps-compatible ContentItem[]
      return [
        textResult(`Showing ${product.name}`),
        uiResource(canvasUrl.toString(), {
          mimeType: 'text/html+mcp',
          initialData: {
            show_inline: true,
            agent_enabled: true,
            product,
          },
          frameSize: { width: '100%', height: `${estimatedHeight}px` },
          uiMeta: { prefersBorder: true },
        }),
      ];
    },
    showCart: (params: { message?: string }) => {
      console.log('[BonsaiShop] showCart called, cart:', cartRef.current);

      const currentCart = cartRef.current;
      if (currentCart.length === 0) {
        return {
          success: false,
          message: 'Cart is empty'
        };
      }

      // Build canvas URL for cart display
      const canvasUrl = new URL('/examples/chat-sdk/bonsai-shop/canvas/cart', window.location.origin);
      canvasUrl.searchParams.set('items', JSON.stringify(currentCart));

      // Calculate height
      const estimatedHeight = Math.min(60 + (currentCart.length * 120) + 80 + 40, 600);
      const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Return MCP Apps-compatible ContentItem[]
      return [
        textResult(params.message || `Your cart has ${currentCart.length} item(s)`),
        uiResource(canvasUrl.toString(), {
          mimeType: 'text/html+mcp',
          initialData: {
            show_inline: true,
            agent_enabled: true,
            items: currentCart,
            total,
          },
          frameSize: { width: '100%', height: `${estimatedHeight}px` },
          uiMeta: { prefersBorder: true },
        }),
      ];
    },
    checkout: (params: { confirm?: boolean }) => {
      console.log('[BonsaiShop] checkout called:', params, 'cart:', cartRef.current);

      const currentCart = cartRef.current;
      if (currentCart.length === 0) {
        return {
          success: false,
          message: 'Cart is empty. Add some products first!'
        };
      }

      const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Build canvas URL for checkout summary display
      const canvasUrl = new URL('/examples/chat-sdk/bonsai-shop/canvas/checkout-summary', window.location.origin);
      canvasUrl.searchParams.set('items', JSON.stringify(currentCart));
      canvasUrl.searchParams.set('total', total.toFixed(2));
      canvasUrl.searchParams.set('itemCount', currentCart.length.toString());

      // Calculate height based on number of items
      const estimatedHeight = Math.min(120 + (currentCart.length * 60) + 100, 500);

      // Return MCP Apps-compatible ContentItem[]
      return [
        textResult(`Ready to checkout with ${currentCart.length} items totaling $${total.toFixed(2)}`),
        uiResource(canvasUrl.toString(), {
          mimeType: 'text/html+mcp',
          initialData: {
            show_inline: true,
            agent_enabled: true,
            items: currentCart,
            total: total.toFixed(2),
            itemCount: currentCart.length,
          },
          frameSize: { width: '100%', height: `${estimatedHeight}px` },
          uiMeta: { prefersBorder: true },
        }),
      ];
    },
    /**
     * Resource content getter - provides dynamic context to the agent.
     * Uses refs to always return the latest state without causing re-renders.
     * 
     * The returned string becomes the agent's system context and includes:
     * - Base persona (helpful AI assistant for Serenity Bonsai Co.)
     * - pageContext: Dynamic context about what the user is currently viewing
     *   (e.g., specific product details, checkout state, or homepage)
     * - cartSummary: Current shopping cart state for purchase-related queries
     * - Available tools and usage guidelines
     * 
     * The ${pageContext} placeholder is replaced with the current page-specific
     * context, giving the agent awareness of the user's UI state.
     */
    getResourceContent: () => {
      const currentCart = cartRef.current;
      const pageContext = currentPageContextRef.current;
      
      const cartSummary = currentCart.length > 0
        ? `\n\n**Current Cart (${currentCart.length} items):**\n${currentCart.map(item => 
            `- ${item.name} x${item.quantity} @ $${item.price.toFixed(2)}`
          ).join('\n')}\n**Total:** $${currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}`
        : '\n\n**Cart:** Empty';
      
      // pageContext is injected here - it contains page-specific information
      // like the product being viewed or checkout state
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
- Product page: /examples/chat-sdk/bonsai-shop/product/{product_id}
- Example: /examples/chat-sdk/bonsai-shop/product/cherry-blossom-bonsai
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
  });
  
  // Update ref on every render to ensure fresh closures
  useEffect(() => {
    toolImplRef.current = {
      ...toolImplRef.current,
      searchProducts: (params: { query?: string; category?: string }) => searchProducts(params.query || '', params.category),
      addToCart: (params: { productId: string; quantity?: number }) => addToCart(params.productId, params.quantity || 1),
      getCart: () => getCart(),
      removeFromCart: (params: { productId: string }) => removeFromCart(params.productId),
      updateCartQuantity: (params: { productId: string; quantity: number }) => updateCartQuantity(params.productId, params.quantity),
    };
  });

  // Tool call handling - stable references that delegate to refs
  const toolCalls = useMemo(() => ({
    searchProducts: {
      execute: async (params: { query?: string; category?: string }) => toolImplRef.current.searchProducts(params)
    },
    addToCart: {
      execute: async (params: { productId: string; quantity?: number }) => toolImplRef.current.addToCart(params)
    },
    getCart: {
      execute: async () => toolImplRef.current.getCart()
    },
    removeFromCart: {
      execute: async (params: { productId: string }) => toolImplRef.current.removeFromCart(params)
    },
    updateCartQuantity: {
      execute: async (params: { productId: string; quantity: number }) => toolImplRef.current.updateCartQuantity(params)
    },
    showProductCard: {
      execute: async (params: { product_id: string }) => toolImplRef.current.showProductCard(params)
    },
    showCart: {
      execute: async (params: { message?: string }) => toolImplRef.current.showCart(params)
    },
    checkout: {
      execute: async (params: { confirm?: boolean }) => toolImplRef.current.checkout(params)
    }
  }), []); // No dependencies - always delegates to ref

  // Build model context with tools
  const bonsaiShopContext: ModelContext = useMemo(() => ({
    name: 'bonsai-shop',
    uri: 'bonsai-shop://context',
    description: 'Serenity Bonsai Co. - Premium bonsai shop with shopping cart',
    toolPrefix: 'bonsai_shop',
    resourceUri: 'bonsai-shop://context',
    prompts: [
      
    ],
    resources: [
      {
        // Resource name 'card' is special - the agent node looks for this
        // to get the model context card content for the system prompt
        name: 'card',
        uri: 'bonsai-shop://context/card',
        description: 'Bonsai shop assistant context with cart state and guidelines',
        mimeType: 'text/plain',
        // getContent is called via RPC when the agent needs the resource
        // This allows dynamic content (cart state, page context) to be fetched
        getContent: async () => toolImplRef.current.getResourceContent(),
      }
    ],
    tools: {
      searchProducts: {
        name: 'searchProducts',
        description: 'Search for products in the catalog',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            },
            category: {
              type: 'string',
              description: 'Product category to filter by',
              enum: ['all', 'tree', 'towel', 'hat', 'pet-sweater']
            }
          }
        },
        execute: toolCalls.searchProducts.execute
      },
      addToCart: {
        name: 'addToCart',
        description: 'Add a product to the shopping cart',
        inputSchema: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'The ID of the product to add'
            },
            quantity: {
              type: 'number',
              description: 'Quantity to add (default: 1)'
            }
          },
          required: ['productId']
        },
        execute: toolCalls.addToCart.execute
      },
      getCart: {
        name: 'getCart',
        description: 'Get the current shopping cart contents',
        inputSchema: {
          type: 'object',
          properties: {
            go: {
              type: 'boolean',
              description: 'Set to true to go to the cart page'
            }
          },
          required: ['go']
        },
        execute: toolCalls.getCart.execute
      },
      removeFromCart: {
        name: 'removeFromCart',
        description: 'Remove a product from the cart',
        inputSchema: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'The ID of the product to remove'
            }
          },
          required: ['productId']
        },
        execute: toolCalls.removeFromCart.execute
      },
      updateCartQuantity: {
        name: 'updateCartQuantity',
        description: 'Update the quantity of a product in the cart',
        inputSchema: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'The ID of the product'
            },
            quantity: {
              type: 'number',
              description: 'New quantity'
            }
          },
          required: ['productId', 'quantity']
        },
        execute: toolCalls.updateCartQuantity.execute
      },
      showProductCard: {
        name: 'showProductCard',
        description: 'Display a visual product card in the chat showing product details, image, and add-to-cart button',
        inputSchema: {
          type: 'object',
          properties: {
            product_id: {
              type: 'string',
              description: 'Product ID to display'
            }
          },
          required: ['product_id']
        },
        execute: toolCalls.showProductCard.execute
      },
      showCart: {
        name: 'showCart',
        description: 'Display a visual cart card in the chat showing all items, quantities, prices, and total',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Optional message to display with cart'
            }
          }
        },
        execute: toolCalls.showCart.execute
      },
      checkout: {
        name: 'checkout',
        description: 'Proceed to checkout with current cart items - displays a checkout summary card',
        inputSchema: {
          type: 'object',
          properties: {
            confirm: {
              type: 'boolean',
              description: 'Confirm checkout'
            }
          }
        },
        execute: toolCalls.checkout.execute
      }
    }
  }), [toolCalls, currentPageContext]);

  // Check if we should render (only on bonsai shop pages, not canvas pages)
  const isBonsaiShopPage = router.pathname.includes('/bonsai-shop');
  const isCanvasPage = router.pathname.includes('/canvas/');
  const shouldRenderChat = isBonsaiShopPage && !isCanvasPage;

  const handleCanvasTool = useCallback(
    async (tool: string, params: any, canvasId?: string) => {
      console.log('[BonsaiShop] onCanvasTool:', tool, params, canvasId);
      debugLoggerRef.current?.logCanvasTool(tool, params, canvasId || '');
      eventBus.logInfo('MCP App tool', { tool, params, canvasId }, 'canvas');

      switch (tool) {
        case 'addToCart':
          return toolImplRef.current.addToCart({
            productId: params?.productId,
            quantity: params?.quantity || 1,
          });
        case 'removeFromCart':
          return toolImplRef.current.removeFromCart({ productId: params?.productId });
        case 'updateCartQuantity':
          return toolImplRef.current.updateCartQuantity({
            productId: params?.productId,
            quantity: params?.quantity,
          });
        case 'getCart':
          return toolImplRef.current.getCart();
        default:
          return { success: false, error: `Unknown tool: ${tool}` };
      }
    },
    [],
  );

  if (!shouldRenderChat) {
    return null;
  }

  return (
    <BotDojoChat
      apiKey={config.apiKey}
      mode='inline'
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
        (window as any).bonsaiChatControl = control;
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
        // Handle both intents and tool calls
        debugLoggerRef.current?.logCanvasTool(tool, params, appId);
        return handleCanvasTool(tool, params, appId);
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
