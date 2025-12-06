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
  } = useMcpApp<{ checkout?: CheckoutData }>({
    initialState: { checkout: initialData },
    containerRef: cardRef,
    autoReportSize: true,
    debug: true,
  });

  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(initialData);

  const deriveCheckoutData = useCallback((source?: any): Partial<CheckoutData> | null => {
    if (!source) return null;
    const data = source.persistedData || source.initialData || source;
    if (!data) return null;
    return {
      items: data.items,
      total: data.total,
      itemCount: data.itemCount,
    };
  }, []);

  const applyCheckoutData = useCallback((maybeData?: any) => {
    const next = deriveCheckoutData(maybeData);
    if (!next) return;
    setCheckoutData((prev) => {
      const updated: CheckoutData = { ...prev };
      (Object.keys(next) as Array<keyof CheckoutData>).forEach((key) => {
        const value = next[key];
        if (value !== undefined) {
          updated[key] = value as any;
        }
      });
      return updated;
    });
  }, [deriveCheckoutData]);

  useEffect(() => {
    applyCheckoutData(initialData);
  }, [initialData, applyCheckoutData]);

  // Apply checkout data from host context
  useEffect(() => {
    applyCheckoutData(hostContext);
  }, [hostContext, applyCheckoutData]);

  // Apply checkout data from tool arguments (SEP-1865 compliant)
  useEffect(() => {
    if (tool.arguments) {
      applyCheckoutData(tool.arguments);
    }
  }, [tool.arguments, applyCheckoutData]);

  const data = checkoutData || {};
  const items: CartItem[] = data.items || [];
  const itemCount = data.itemCount || items.length;
  
  const total = items.length > 0 
    ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : parseFloat(data.total || '0');

  const handleProceedToCheckout = async () => {
    const checkoutUrl = '/examples/chat-sdk/bonsai-shop/checkout';
    console.log('[CheckoutSummary] Sending checkout link event:', checkoutUrl);
    
    setCheckoutPending(true);
    try {
      await openLink(checkoutUrl);
    } finally {
      setTimeout(() => setCheckoutPending(false), 3000);
    }
  };

  if (items.length === 0 && !data.total) {
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

      {items.length > 0 && (
        <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
          {items.map((item, index) => (
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

export default function CheckoutSummaryPage() {
  const router = useRouter();
  const [canvasData, setCanvasData] = useState<CheckoutData | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const { items, total, itemCount } = router.query;

    const data: CheckoutData = {
      items: items ? JSON.parse(items as string) : [],
      total: (total as string) || undefined,
      itemCount: itemCount ? parseInt(itemCount as string) : undefined
    };

    setCanvasData(data);
  }, [router.isReady, router.query]);

  if (!canvasData) {
    return (
      <div style={{ padding: '20px', color: '#94a3b8' }}>
        <p>Loading checkout summary...</p>
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
      <CheckoutSummary initialData={canvasData} />
    </>
  );
}
