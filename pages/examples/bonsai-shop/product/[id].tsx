import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BonsaiShopLayout from '../components/BonsaiShopLayout';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  inStock: boolean;
  imagePrompt: string;
  imagePath?: string;
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      // Load all products and find the one with matching ID
      const res = await fetch('/api/search-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '', category: 'all' }),
      });
      const allProducts = await res.json();
      const foundProduct = allProducts.find((p: Product) => p.id === id);
      
      if (foundProduct) {
        setProduct(foundProduct);
        
        // Get related products (same category, excluding current)
        const related = allProducts
          .filter((p: Product) => p.category === foundProduct.category && p.id !== id)
          .slice(0, 4);
        setRelatedProducts(related);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading product:', error);
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;
    
    // Get existing cart from localStorage
    const existingCart = localStorage.getItem('bonsai-cart');
    const cart = existingCart ? JSON.parse(existingCart) : [];
    
    // Check if product already in cart
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    
    localStorage.setItem('bonsai-cart', JSON.stringify(cart));
    
    // Show toast notification
    setToastMessage(`Added ${quantity} ${product.name} to cart!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Reset quantity
    setQuantity(1);
  };

  const categoryEmoji: Record<string, string> = {
    tree: '🌳',
    towel: '🧺',
    hat: '🧢',
    'pet-sweater': '🐕',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '18px' }}>Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#94a3b8', fontSize: '18px' }}>Product not found</p>
        <Link href="/examples/bonsai-shop" style={{ color: '#10b981', textDecoration: 'none' }}>
          ← Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <BonsaiShopLayout>
      {/* Product Detail */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Link href="/examples/bonsai-shop" style={{ color: '#94a3b8', textDecoration: 'none' }}>
            Shop
          </Link>
          <span style={{ color: '#64748b' }}>/</span>
          <Link href={`/examples/bonsai-shop?category=${product.category}`} style={{ color: '#94a3b8', textDecoration: 'none', textTransform: 'capitalize' }}>
            {product.category.replace('-', ' ')}
          </Link>
          <span style={{ color: '#64748b' }}>/</span>
          <span style={{ color: '#e2e8f0' }}>{product.name}</span>
        </div>

        {/* Product Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '64px' }}>
          {/* Product Image */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #334155',
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {product.imagePath ? (
              <img
                src={product.imagePath}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{ fontSize: '120px' }}>
                {categoryEmoji[product.category] || '📦'}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              backgroundColor: '#334155',
              color: '#94a3b8',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px',
              textTransform: 'capitalize',
            }}>
              {product.category.replace('-', ' ')}
            </div>

            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#e2e8f0',
              marginBottom: '16px',
              lineHeight: '1.2',
            }}>
              {product.name}
            </h1>

            <p style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '24px',
            }}>
              ${product.price.toFixed(2)}
            </p>

            <p style={{
              fontSize: '18px',
              color: '#94a3b8',
              lineHeight: '1.6',
              marginBottom: '32px',
            }}>
              {product.description}
            </p>

            {/* Stock Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '32px',
              padding: '12px 16px',
              backgroundColor: product.inStock ? '#0f172a' : '#1e293b',
              borderRadius: '8px',
              border: `1px solid ${product.inStock ? '#10b981' : '#ef4444'}`,
            }}>
              <span style={{ fontSize: '20px' }}>{product.inStock ? '✓' : '✗'}</span>
              <span style={{ color: product.inStock ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontWeight: '600', marginBottom: '12px' }}>
                  Quantity
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#334155',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '24px',
                      cursor: 'pointer',
                    }}
                  >
                    −
                  </button>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#e2e8f0',
                    minWidth: '48px',
                    textAlign: 'center',
                  }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#334155',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '24px',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={addToCart}
              disabled={!product.inStock}
              style={{
                width: '100%',
                padding: '20px',
                backgroundColor: product.inStock ? '#10b981' : '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: product.inStock ? 'pointer' : 'not-allowed',
                marginBottom: '16px',
              }}
            >
              {product.inStock ? '🛒 Add to Cart' : 'Out of Stock'}
            </button>

            <Link
              href="/bonsai-shop"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '16px',
                color: '#10b981',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '24px' }}>
              You May Also Like
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '24px',
            }}>
              {relatedProducts.map(relatedProduct => (
                <Link
                  key={relatedProduct.id}
                  href={`/examples/bonsai-shop/product/${relatedProduct.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                    <div style={{
                      height: '200px',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}>
                      {relatedProduct.imagePath ? (
                        <img
                          src={relatedProduct.imagePath}
                          alt={relatedProduct.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '64px' }}>
                          {categoryEmoji[relatedProduct.category] || '📦'}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
                        {relatedProduct.name}
                      </h3>
                      <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                        ${relatedProduct.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '16px',
          fontWeight: '600',
          animation: 'slideIn 0.3s ease-out',
        }}>
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </BonsaiShopLayout>
  );
}

