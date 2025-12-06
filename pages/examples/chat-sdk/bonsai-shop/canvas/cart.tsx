import { useCallback, useEffect, useRef, useState } from 'react';
import { useMcpApp } from 'mcp-app-view/react';
import { useRouter } from 'next/router';

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
  } = useMcpApp<{ cart?: CartData }>({
    initialState: { cart: initialData },
    containerRef: cardRef,
    autoReportSize: true,
    debug: true,
  });

  const [checkoutPending, setCheckoutPending] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [cartData, setCartData] = useState<CartData>(initialData);

  const deriveCartData = useCallback((source?: any): Partial<CartData> | null => {
    if (!source) return null;
    const data = source.persistedData || source.initialData || source;
    if (!data) return null;
    return {
      items: data.items,
      total: data.total,
    };
  }, []);

  const applyCartData = useCallback((maybeData?: any) => {
    const next = deriveCartData(maybeData);
    if (!next) return;
    setCartData((prev) => {
      const updated: CartData = { ...prev };
      (Object.keys(next) as Array<keyof CartData>).forEach((key) => {
        const value = next[key];
        if (value !== undefined) {
          updated[key] = value as any;
        }
      });
      return updated;
    });
  }, [deriveCartData]);

  useEffect(() => {
    applyCartData(initialData);
  }, [initialData, applyCartData]);

  // Apply cart data from host context
  useEffect(() => {
    applyCartData(hostContext);
  }, [hostContext, applyCartData]);

  // Apply cart data from tool arguments (SEP-1865 compliant)
  useEffect(() => {
    if (tool.arguments) {
      applyCartData(tool.arguments);
    }
  }, [tool.arguments, applyCartData]);

  const data = cartData || {};
  const items: CartItem[] = data.items || [];
  
  const total = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    const checkoutUrl = '/examples/chat-sdk/bonsai-shop/checkout';
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

  if (items.length === 0) {
    return (
      <div style={{ 
        padding: '24px', 
        textAlign: 'center', 
        color: '#94a3b8',
        border: '1px solid #334155',
        borderRadius: '8px',
        backgroundColor: 'transparent'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Your cart is empty</p>
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
        🛒 Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h3>

      <div style={{ marginBottom: '16px' }}>
        {items.map((item, index) => (
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

      {/* Show tool streaming status */}
      {tool.isStreaming && (
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
  const router = useRouter();
  const [canvasData, setCanvasData] = useState<CartData | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const { items, total } = router.query;

    const data: CartData = {
      items: items ? JSON.parse(items as string) : [],
      total: (total as string) || undefined
    };

    setCanvasData(data);
  }, [router.isReady, router.query]);

  if (!canvasData) {
    return (
      <div style={{ padding: '20px', color: '#94a3b8' }}>
        <p>Loading cart...</p>
      </div>
    );
  }

  // No wrapper needed - useMcpApp handles everything internally
  return (
    <>
      <style jsx global>{`
        html, body {
          background: transparent !important;
          margin: 0;
          padding: 0;
        }
      `}</style>
      <Cart initialData={canvasData} />
    </>
  );
}
