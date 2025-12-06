import { useCallback, useEffect, useRef, useState } from 'react';
import { useMcpApp } from 'mcp-app-view/react';
import { useRouter } from 'next/router';

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
  } = useMcpApp<{ product?: ProductCardData }>({
    initialState: { product: initialData },
    containerRef: cardRef,
    autoReportSize: true,
    debug: true,
  });

  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedTimestamp, setAddedTimestamp] = useState<string | null>(null);
  const [totalAdded, setTotalAdded] = useState(0);
  const [productData, setProductData] = useState<ProductCardData>(initialData);

  const deriveProductData = useCallback((source?: any): Partial<ProductCardData> | null => {
    if (!source) return null;
    const data = source.persistedData || source.initialData || source;
    if (!data) return null;
    return {
      id: data.product_id || data.productId || data.id,
      name: data.name,
      price: data.price,
      description: data.description,
      imagePath: data.imagePath,
      category: data.category,
      clickable: data.clickable,
    };
  }, []);

  const applyProductData = useCallback((maybeData?: any) => {
    const next = deriveProductData(maybeData);
    if (!next) return;
    setProductData((prev) => {
      const updated = { ...prev };
      (Object.keys(next) as Array<keyof ProductCardData>).forEach((key) => {
        const value = next[key];
        if (value !== undefined) {
          updated[key] = value as any;
        }
      });
      return updated;
    });
  }, [deriveProductData]);

  useEffect(() => {
    applyProductData(initialData);
  }, [initialData, applyProductData]);

  // Apply product data from host context
  useEffect(() => {
    applyProductData(hostContext);
  }, [hostContext, applyProductData]);

  // Apply product data from tool arguments (SEP-1865 compliant)
  useEffect(() => {
    if (tool.arguments) {
      applyProductData(tool.arguments);
    }
  }, [tool.arguments, applyProductData]);

  const data = productData;

  const categoryEmoji: Record<string, string> = {
    tree: '🌳',
    towel: '🧺',
    hat: '🧢',
    'pet sweater': '🐕',
  };

  const handleAskAI = async () => {
    if (isInitialized) {
      try {
        console.log('[ProductCard] Sending message to flow:', `Tell me more about ${data.name}`);
        // Use ui/message (SEP-1865 compliant) with BotDojo extension to trigger agent
        await sendMessage([
          { 
            type: 'text', 
            text: `Tell me more about ${data.name}`,
            // BotDojo extension: trigger agent to respond to this message
            'botdojo/triggerAgent': true,
          }
        ]);
      } catch (err) {
        console.error('[ProductCard] Error sending message:', err);
      }
    }
  };

  const handleAddToCart = async () => {
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

  if (!data.name) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
        No product data
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      style={{
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '400px',
        backgroundColor: 'transparent',
      }}
    >
      {data.imagePath ? (
        <img
          src={data.imagePath}
          alt={data.name}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '64px',
        }}>
          {categoryEmoji[data.category || ''] || '📦'}
        </div>
      )}

      {data.category && (
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
    </div>
  );
}

export default function ProductCardPage() {
  const router = useRouter();
  const [canvasData, setCanvasData] = useState<ProductCardData | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const { product_id, name, price, description, imagePath, category, clickable } = router.query;

    const data: ProductCardData = {
      id: (product_id as string) || undefined,
      name: (name as string) || '',
      price: (price as string) || '',
      description: (description as string) || '',
      imagePath: (imagePath as string) || undefined,
      category: (category as string) || undefined,
      clickable: clickable === 'true'
    };

    setCanvasData(data);
  }, [router.isReady, router.query]);

  if (!canvasData) {
    return (
      <div style={{ padding: '20px', color: '#94a3b8' }}>
        <p>Loading product...</p>
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
      <ProductCard initialData={canvasData} />
    </>
  );
}
