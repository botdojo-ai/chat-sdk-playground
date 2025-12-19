import { useCallback, useEffect, useRef, useState } from 'react';
import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  description: string;
  quantity: number;
  imagePath?: string;
  category?: string;
}

interface CartData {
  items?: CartItem[];
  total?: string;
  [key: string]: any;
}

function Cart({ initialData }: { initialData: CartData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Use the new mcp-app-view hook with auto size reporting
  const {
    isInitialized,
    hostContext,
    tool,
    openLink,
    callTool,
    sendMessage,
  } = useMcpApp({
    containerRef: cardRef,
    autoReportSize: true,
    debug: true,
  });

  const [checkoutPending, setCheckoutPending] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  // Track tool.arguments changes via stringification
  const toolArgsStr = JSON.stringify(tool.arguments || {});
  const toolArgs = tool.arguments as { fetchCart?: boolean } | null;

  // Debug: log tool state changes
  useEffect(() => {
    console.log('[Cart] Tool state changed:', {
      isInitialized,
      toolArgsStr,
      hasFetched: hasFetchedRef.current,
    });
  }, [isInitialized, toolArgsStr]);

  // Fetch cart data via tools/call when we get the fetchCart signal
  useEffect(() => {
    const args = tool.arguments as { fetchCart?: boolean } | null;
    
    if (!isInitialized) {
      console.log('[Cart] Not initialized yet, waiting...');
      return;
    }
    
    // Skip if we already fetched AND no explicit fetchCart signal
    // But if fetchCart is true, always re-fetch to get fresh data
    if (hasFetchedRef.current && !args?.fetchCart) {
      console.log('[Cart] Already fetched cart and no refresh signal');
      return;
    }    
    if (loading) {
      console.log('[Cart] Already loading, skipping...');
      return;
    }

    console.log('[Cart] Fetching cart data via getCart');
    hasFetchedRef.current = true;
    setLoading(true);
    
    callTool<{ items: CartItem[]; total: number; itemCount: number }>('getCart')
      .then((result) => {
        console.log('[Cart] getCart result:', result);
        if (result?.items) {
          setCartData({
            items: result.items,
            total: result.total?.toString(),
          });
        } else {
          setCartData({ items: [] });
        }
      })
      .catch((err) => {
        console.error('[Cart] Error fetching cart:', err);
        setCartData({ items: [] });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isInitialized, toolArgsStr, callTool, loading]);

  const items: CartItem[] = cartData?.items || [];
  
  const total = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // Determine if tool is actually still streaming (use same pattern as other MCP apps)
  // Only consider streaming if: isStreaming flag is true AND status is not complete/idle AND we don't have data yet
  const isToolComplete = tool.status === 'complete' || tool.status === 'idle';
  const isActuallyStreaming = tool.isStreaming && !isToolComplete && !cartData;

  const toAbsoluteImage = useCallback((path?: string) => {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
    }
    return path;
  }, []);

  const itemsWithAbsoluteImages = items.map(item => ({
    ...item,
    imagePath: toAbsoluteImage(item.imagePath),
  }));

  const handleCheckout = async () => {
    const checkoutUrl = '/examples/bonsai-shop/checkout';
    console.log('[Cart] Sending checkout link event:', checkoutUrl);
    
    setCheckoutPending(true);
    try {
      await openLink(checkoutUrl);
    } finally {
      setTimeout(() => setCheckoutPending(false), 3000);
    }
  };

  const handleRemoveItem = async (productId: string, productName: string) => {
    console.log('[Cart] Removing item via tool call:', productId);
    
    setRemovingItemId(productId);
    
    try {
      // SEP-1865 compliant tools/call
      const result = await callTool<{ cart?: CartItem[]; total?: number }>('removeFromCart', { productId });
      console.log('[Cart] Item removed successfully:', result);

      const nextItems: CartItem[] = result?.cart
        ? result.cart
        : items.filter((item) => item.id !== productId);
      const nextTotal =
        typeof result?.total === 'number'
          ? result.total
          : nextItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      setCartData((prev) => ({
        ...prev,
        items: nextItems,
        total: nextTotal.toFixed(2),
      }));
    } catch (err) {
      console.error('[Cart] Error removing item:', err);
      // Fallback: send message to agent
      try {
        await sendMessage([
          { 
            type: 'text', 
            text: `Remove ${productName} from my cart`,
            'botdojo/triggerAgent': true,
          }
        ]);
      } catch (msgErr) {
        console.error('[Cart] Error sending message:', msgErr);
      }
    }
    
    setTimeout(() => setRemovingItemId(null), 3000);
  };

  if (!cartData || itemsWithAbsoluteImages.length === 0) {
    return (
      <div 
        ref={cardRef}
        style={{ 
          padding: '24px', 
          textAlign: 'center', 
          color: '#94a3b8',
          border: '1px solid #334155',
          borderRadius: '8px',
          backgroundColor: 'transparent'
        }}
      >
        {loading || (!cartData && isInitialized) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid #334155',
              borderTopColor: '#10b981',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span>Loading cart...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : !isInitialized ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid #334155',
              borderTopColor: '#f59e0b',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span>Initializing...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '14px' }}>Your cart is empty</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      style={{
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: 'transparent',
        maxWidth: '450px',
      }}
    >
      <h3 style={{ 
        margin: '0 0 16px', 
        fontSize: '18px', 
        fontWeight: 600,
        color: '#f8fafc',
        borderBottom: '2px solid #334155',
        paddingBottom: '12px'
      }}>
        🛒 Shopping Cart ({itemsWithAbsoluteImages.length} {itemsWithAbsoluteImages.length === 1 ? 'item' : 'items'})
      </h3>

      <div style={{ marginBottom: '16px' }}>
        {itemsWithAbsoluteImages.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              border: '1px solid #334155',
            }}
          >
            {item.imagePath && (
              <img
                src={item.imagePath}
                alt={item.name}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              />
            )}
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: '14px',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#e2e8f0',
              }}>
                {item.name}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#94a3b8',
                marginBottom: '4px'
              }}>
                ${item.price.toFixed(2)} × {item.quantity}
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600,
                color: '#10b981'
              }}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
            
            <button
              onClick={() => handleRemoveItem(item.id, item.name)}
              disabled={removingItemId === item.id || !isInitialized}
              style={{
                padding: '6px 12px',
                backgroundColor: removingItemId === item.id ? '#fca5a5' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: removingItemId === item.id || !isInitialized ? 'wait' : 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                height: 'fit-content',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
            >
              {removingItemId === item.id ? (
                <>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Removing...
                </>
              ) : 'Remove'}
            </button>
          </div>
        ))}
      </div>

      <div style={{
        borderTop: '2px solid #334155',
        paddingTop: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '18px',
          fontWeight: 700,
          color: '#e2e8f0'
        }}>
          <span>Total:</span>
          <span style={{ color: '#10b981' }}>${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={checkoutPending || !isInitialized}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: checkoutPending ? '#059669' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: checkoutPending || !isInitialized ? 'wait' : 'pointer',
          fontWeight: 600,
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
        }}
      >
        {checkoutPending ? (
          <>
            <span style={{
              width: '16px',
              height: '16px',
              border: '2px solid white',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            Redirecting...
          </>
        ) : 'Proceed to Checkout'}
      </button>

      {/* Show tool streaming status - only when actually streaming AND data not loaded yet */}
      {isActuallyStreaming && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px',
            background: 'rgba(99, 102, 241, 0.15)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#818cf8',
            textAlign: 'center',
          }}
        >
          ⏳ Processing: {tool.name}...
        </div>
      )}

      {!isInitialized && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px',
            background: 'rgba(245, 158, 11, 0.15)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#f59e0b',
            textAlign: 'center',
          }}
        >
          ⚠️ Canvas initializing...
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function CartPage() {
  // Initial data is empty - all data comes from hostContext and tool.arguments via useMcpApp
  const initialData: CartData = {
    items: [],
  };

  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100%', width: '100%', background: 'transparent', display: 'flex', alignItems: 'flex-start' }}>
      <Cart initialData={initialData} />
    </div>
  );
}
