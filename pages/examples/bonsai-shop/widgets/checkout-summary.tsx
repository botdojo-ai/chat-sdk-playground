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

interface CheckoutData {
  items?: CartItem[];
  total?: string;
  itemCount?: number;
  [key: string]: any;
}

function CheckoutSummary({ initialData }: { initialData: CheckoutData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Use the new mcp-app-view hook with auto size reporting
  const {
    isInitialized,
    hostContext,
    tool,
    openLink,
    callTool,
  } = useMcpApp({
    containerRef: cardRef,
    autoReportSize: true,
    debug: true,
  });

  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  // Track tool.arguments changes via stringification
  const toolArgsStr = JSON.stringify(tool.arguments || {});

  // Debug: log tool state changes
  useEffect(() => {
    console.log('[CheckoutSummary] Tool state changed:', {
      isInitialized,
      toolArgsStr,
      hasFetched: hasFetchedRef.current,
    });
  }, [isInitialized, toolArgsStr]);

  // Fetch cart data via tools/call when we get the fetchCart signal
  useEffect(() => {
    const args = tool.arguments as { fetchCart?: boolean } | null;
    
    if (!isInitialized) {
      console.log('[CheckoutSummary] Not initialized yet, waiting...');
      return;
    }
    
    // Require fetchCart signal to fetch
    if (!args?.fetchCart) {
      console.log('[CheckoutSummary] No fetchCart signal yet, waiting...', args);
      return;
    }
    
    // Note: We always fetch when fetchCart is true, allowing re-fetch on subsequent requests
    
    if (loading) {
      console.log('[CheckoutSummary] Already loading, skipping...');
      return;
    }

    console.log('[CheckoutSummary] Fetching cart data via getCart');
    hasFetchedRef.current = true;
    setLoading(true);
    
    callTool<{ items: CartItem[]; total: number; itemCount: number }>('getCart')
      .then((result) => {
        console.log('[CheckoutSummary] getCart result:', result);
        if (result?.items) {
          setCheckoutData({
            items: result.items,
            total: result.total?.toString(),
            itemCount: result.itemCount,
          });
        } else {
          setCheckoutData({ items: [] });
        }
      })
      .catch((err) => {
        console.error('[CheckoutSummary] Error fetching cart:', err);
        setCheckoutData({ items: [] });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isInitialized, toolArgsStr, callTool, loading]);

  const items: CartItem[] = checkoutData?.items || [];
  const itemCount = checkoutData?.itemCount || items.length;
  
  const total = items.length > 0 
    ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : parseFloat(checkoutData?.total || '0');

  // Determine if tool is actually still streaming (use same pattern as other MCP apps)
  // Only consider streaming if: isStreaming flag is true AND status is not complete/idle AND we don't have data yet
  const isToolComplete = tool.status === 'complete' || tool.status === 'idle';
  const isActuallyStreaming = tool.isStreaming && !isToolComplete && !checkoutData;

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

  const handleProceedToCheckout = async () => {
    const checkoutUrl = '/examples/bonsai-shop/checkout';
    console.log('[CheckoutSummary] Sending checkout link event:', checkoutUrl);
    
    setCheckoutPending(true);
    try {
      await openLink(checkoutUrl);
    } finally {
      setTimeout(() => setCheckoutPending(false), 3000);
    }
  };

  if (!checkoutData || (items.length === 0 && !checkoutData.total)) {
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
        {loading || (!checkoutData && isInitialized) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid #334155',
              borderTopColor: '#10b981',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span>Loading checkout...</span>
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
        padding: '20px',
        backgroundColor: 'transparent',
        maxWidth: '450px',
      }}
    >
      <h3 style={{ 
        margin: '0 0 16px', 
        fontSize: '20px', 
        fontWeight: 600,
        borderBottom: '2px solid #334155',
        paddingBottom: '12px',
        color: '#f8fafc'
      }}>
        💳 Ready to Checkout
      </h3>

      {itemsWithAbsoluteImages.length > 0 && (
        <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
          {itemsWithAbsoluteImages.map((item, index) => (
            <div
              key={item.id || index}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '8px',
                marginBottom: '6px',
                backgroundColor: '#0f172a',
                borderRadius: '6px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '14px',
                  marginBottom: '2px',
                  color: '#e2e8f0',
                }}>
                  {item.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#94a3b8',
                }}>
                  ${item.price.toFixed(2)} × {item.quantity}
                </div>
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600,
                color: '#10b981'
              }}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        borderTop: '2px solid #334155',
        paddingTop: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={handleProceedToCheckout}
        disabled={checkoutPending || !isInitialized}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: checkoutPending ? '#6ee7b7' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: checkoutPending || !isInitialized ? 'wait' : 'pointer',
          fontWeight: 600,
          fontSize: '16px',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          if (!checkoutPending && isInitialized) {
            e.currentTarget.style.backgroundColor = '#059669';
          }
        }}
        onMouseLeave={(e) => {
          if (!checkoutPending && isInitialized) {
            e.currentTarget.style.backgroundColor = '#10b981';
          }
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
        ) : 'Proceed to Checkout →'}
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

export default function CheckoutSummaryPage() {
  // Initial data is empty - all data comes from hostContext and tool.arguments via useMcpApp
  const initialData: CheckoutData = {
    items: [],
  };

  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100%', width: '100%', background: 'transparent', display: 'flex', alignItems: 'flex-start' }}>
      <CheckoutSummary initialData={initialData} />
    </div>
  );
}
