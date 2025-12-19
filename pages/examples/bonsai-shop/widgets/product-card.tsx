import { useCallback, useEffect, useRef, useState } from 'react';
import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

interface ProductCardData {
  id?: string;
  name: string;
  price: string;
  description: string;
  imagePath?: string;
  category?: string;
  clickable?: boolean;
  [key: string]: any;
}

function ProductCard({ initialData }: { initialData: ProductCardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Use the new mcp-app-view hook with auto size reporting
  const {
    isInitialized,
    hostContext,
    tool,
    sendMessage,
    callTool,
    reportSize,
  } = useMcpApp({
    containerRef: cardRef,
    autoReportSize: true,
    debug: true,
  });

  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedTimestamp, setAddedTimestamp] = useState<string | null>(null);
  const [totalAdded, setTotalAdded] = useState(0);
  const [productData, setProductData] = useState<ProductCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const fetchedProductIdRef = useRef<string | null>(null);

  // Extract product_id from tool arguments
  // Stringify to detect changes since object reference might not change
  const toolArgsStr = JSON.stringify(tool.arguments || {});
  const toolArgs = tool.arguments as { product_id?: string } | null;
  const toolProductId = toolArgs?.product_id;

  // Debug: log tool state changes
  useEffect(() => {
    console.log('[ProductCard] Tool state changed:', {
      isInitialized,
      toolName: tool.name,
      toolStatus: tool.status,
      toolIsStreaming: tool.isStreaming,
      toolArgsStr,
      toolProductId,
      fetchedProductIdRef: fetchedProductIdRef.current,
    });
  }, [isInitialized, tool.name, tool.status, tool.isStreaming, toolArgsStr, toolProductId]);

  // Fetch product info when we get the product_id from tool arguments
  useEffect(() => {
    // Extract product_id fresh from the stringified args
    const args = tool.arguments as { product_id?: string } | null;
    const productId = args?.product_id;
    
    // Wait for initialization
    if (!isInitialized) {
      console.log('[ProductCard] Not initialized yet, waiting...');
      return;
    }
    
    // Wait for product_id in arguments
    if (!productId) {
      console.log('[ProductCard] No product_id in tool.arguments yet, waiting...', args);
      return;
    }
    
    // Don't re-fetch if we already fetched this product
    if (fetchedProductIdRef.current === productId) {
      console.log('[ProductCard] Already fetched product:', productId);
      return;
    }
    
    // Don't start a new fetch while one is in progress
    if (loading) {
      console.log('[ProductCard] Already loading, skipping...');
      return;
    }

    console.log('[ProductCard] Fetching product info for:', productId);
    fetchedProductIdRef.current = productId;
    setLoading(true);
    setNotFoundError(null); // Reset error state

    callTool<ProductCardData>('getProductInfo', { productId })
      .then((result: ProductCardData) => {
        console.log('[ProductCard] getProductInfo result:', result);
        if (result && result.name) {
          setImageError(false); // Reset error state when new product loads
          setNotFoundError(null);
          setProductData({
            id: result.id,
            name: result.name,
            price: result.price?.toString() || '0',
            description: result.description || '',
            imagePath: result.imagePath,
            category: result.category,
            clickable: true,
          });
        } else {
          // Product not found
          setNotFoundError(`Product not found (id: ${productId})`);
        }
      })
      .catch((err: Error) => {
        console.error('[ProductCard] Error fetching product info:', err);
        setNotFoundError(`Product not found (id: ${productId})`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isInitialized, toolArgsStr, callTool, loading]);

  const data = productData;

  // Report size after data loads (content changes size)
  useEffect(() => {
    if (productData && cardRef.current) {
      // Small delay to let DOM update
      const timer = setTimeout(() => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          console.log('[ProductCard] Reporting size after data load:', rect.width, rect.height);
          reportSize(Math.ceil(rect.width), Math.ceil(rect.height));
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [productData, reportSize]);

  const toAbsoluteImage = useCallback((path?: string) => {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
    }
    return path;
  }, []);

  const categoryEmoji: Record<string, string> = {
    tree: '🌳',
    towel: '🧺',
    hat: '🧢',
    'pet sweater': '🐕',
  };

  const handleAskAI = async () => {
    if (!isInitialized || !data) return;
    try {
      console.log('[ProductCard] Sending message to flow:', `Tell me more about ${data.name}`);
      // Use ui/message (SEP-1865 compliant) with BotDojo extension to trigger agent
      await sendMessage([
        { 
          type: 'text', 
          text: `Tell me more about ${data.name} <!-- product_id: ${data.id} -->`,
          // BotDojo extension: trigger agent to respond to this message
          'botdojo/triggerAgent': true,
        }
      ]);
    } catch (err) {
      console.error('[ProductCard] Error sending message:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!data) return;
    setFeedback('Adding to cart...');
    
    const productId = data.id;
    
    if (!productId) {
      console.error('[ProductCard] No product ID in canvas data:', data);
      setFeedback('⚠ Product ID missing');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    
    try {
      // SEP-1865 compliant tools/call
      const result = await callTool('addToCart', {
        productId: productId,
        quantity
      });
      
      console.log('[ProductCard] addToCart result via callTool:', result);
      
      setAddedToCart(true);
      setAddedTimestamp(new Date().toLocaleTimeString());
      setTotalAdded(prev => prev + quantity);
      
      setFeedback(`✓ Added ${quantity}x to cart!`);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      console.error('[ProductCard] Error calling parent tool:', err);
      setFeedback('⚠ Failed to add to cart');
      setTimeout(() => setFeedback(''), 3000);
    }
  };
  console.log("ProductCard data", data, isInitialized, toolProductId, loading);
  
  // Determine loading state
  const isWaitingForInit = !isInitialized;
  const isWaitingForArgs = isInitialized && !toolProductId && !loading;
  const isLoadingData = loading || (isInitialized && toolProductId && !data);
  const showLoading = !data || !data.name;
  
  // Determine if tool is actually still streaming (use same pattern as other MCP apps)
  // Only consider streaming if: isStreaming flag is true AND status is not complete/idle AND we don't have data yet
  const isToolComplete = tool.status === 'complete' || tool.status === 'idle';
  const isActuallyStreaming = tool.isStreaming && !isToolComplete && !data;

  // ALWAYS render the cardRef div so MCP client can initialize and report size
  return (
    <div
      ref={cardRef}
      style={{
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '400px',
        backgroundColor: 'transparent',
        minHeight: showLoading ? '100px' : undefined,
      }}
    >
      {notFoundError ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px',
          color: '#ef4444',
        }}>
          <div style={{ fontSize: '32px' }}>❌</div>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{notFoundError}</span>
        </div>
      ) : showLoading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px',
          color: '#94a3b8',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid #334155',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: '13px' }}>
            {isWaitingForInit ? 'Initializing...' : isWaitingForArgs ? 'Waiting for product...' : 'Loading product...'}
          </span>
        </div>
      ) : (
        <>
      {data.imagePath && !imageError ? (
        <img
          src={toAbsoluteImage(data.imagePath)}
          alt={data.name}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '120px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        />
      ) : !imageError ? (
        <div style={{
          width: '100%',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '48px',
        }}>
          {categoryEmoji[data.category || ''] || '📦'}
        </div>
      ) : null}

      {data.category && !imageError && (
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          backgroundColor: '#334155',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#94a3b8',
          marginBottom: '8px',
          textTransform: 'capitalize',
        }}>
          {data.category}
        </div>
      )}

      <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
        {data.name}
      </h3>

      {data.description && (
        <p
          style={{
            color: '#94a3b8',
            fontSize: '14px',
            margin: '0 0 8px',
            lineHeight: '1.5',
          }}
        >
          {data.description}
        </p>
      )}

      <div
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#10b981',
          margin: '8px 0',
        }}
      >
        ${parseFloat(data.price).toFixed(2)}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          min="1"
          style={{
            width: '60px',
            padding: '8px',
            border: '1px solid #334155',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#e2e8f0',
            backgroundColor: '#0f172a',
          }}
        />

        <button
          onClick={handleAddToCart}
          disabled={!isInitialized}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: isInitialized ? '#10b981' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isInitialized ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          🛒 Add to Cart
        </button>
      </div>

      <button
        onClick={handleAskAI}
        disabled={!isInitialized}
        style={{
          width: '100%',
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#1e293b',
          color: '#10b981',
          border: '1px solid #10b981',
          borderRadius: '4px',
          cursor: isInitialized ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        💬 Tell me more about this product
      </button>

      {addedToCart && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#10b981',
            fontWeight: 600,
            border: '1px solid #10b981',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>✓ In Cart</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>{addedTimestamp}</span>
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>
            Total added: {totalAdded}x
          </div>
        </div>
      )}

      {feedback && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            background: feedback.includes('✓') ? 'rgba(16, 185, 129, 0.15)' : feedback.includes('⚠') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            borderRadius: '4px',
            fontSize: '12px',
            color: feedback.includes('✓') ? '#10b981' : feedback.includes('⚠') ? '#f59e0b' : '#818cf8',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {feedback}
        </div>
      )}

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
        </>
      )}
    </div>
  );
}

export default function ProductCardPage() {
  // Initial data is empty - all data comes from hostContext and tool.arguments via useMcpApp
  const initialData: ProductCardData = {
    name: '',
    price: '',
    description: '',
  };

  return (
    <div style={{ margin: 0, padding: 0, background: 'transparent' }}>
      <ProductCard initialData={initialData} />
    </div>
  );
}
