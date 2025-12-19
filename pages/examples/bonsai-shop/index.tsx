import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BonsaiShopLayout from './components/BonsaiShopLayout';
import { useBonsaiChat } from '@/contexts/BonsaiChatContext';

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

interface CartItem extends Product {
  quantity: number;
}

export default function BonsaiShop() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Use context for chat communication
  const { sendMessage } = useBonsaiChat();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    searchProducts();
  }, [searchQuery, selectedCategory]);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/search-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '', category: 'all' }),
      });
      const data = await res.json();
      setProducts(data);
      setFilteredProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      const res = await fetch('/api/search-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, category: selectedCategory }),
      });
      const data = await res.json();
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const askAIAboutProduct = async (product: Product) => {
    const message = `Tell me more about ${product.name} <!-- product_id: ${product.id} -->`;
    // sendMessage handles queuing and opening the chat panel
    await sendMessage(message);
  };

  const addToCart = (product: Product, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      let newCart;
      if (existing) {
        newCart = prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...prev, { ...product, quantity: 1 }];
      }
      
      // Save to localStorage
      localStorage.setItem('bonsai-cart', JSON.stringify(newCart));
      
      // Show toast notification
      setToastMessage(`Added ${product.name} to cart!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };


  const handleCheckout = () => {
    // Save cart to localStorage before navigating
    localStorage.setItem('bonsai-cart', JSON.stringify(cart));
    router.push('/examples/bonsai-shop/checkout');
  };


  return (
    <BonsaiShopLayout showBackLink={true}>
      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%' }}>
        {/* Search and Filters */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                fontSize: '16px',
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['all', 'tree', 'towel', 'hat', 'pet-sweater'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: selectedCategory === cat ? '#10b981' : '#334155',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}
              >
                {cat === 'all' ? 'All Products' : cat.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8', fontSize: '18px' }}>
            Loading products...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8', fontSize: '18px' }}>
            No products found. Try a different search or category.
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer style={{
        backgroundColor: '#1e293b',
        borderTop: '1px solid #334155',
        padding: '32px 24px',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px',
            marginBottom: '24px',
          }}>
            {/* About Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}>
                  🌳
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
                  Serenity Bonsai Co.
                </h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                Premium bonsai trees and accessories for the mindful gardener. 
                Cultivating tranquility, one tree at a time.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '12px' }}>
                Shop
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Bonsai Trees', 'Accessories', 'Care Products', 'Gift Sets'].map(item => (
                  <a key={item} href="#" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Customer Service */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '12px' }}>
                Support
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Contact Us', 'Shipping Info', 'Returns', 'Care Guide'].map(item => (
                  <a key={item} href="#" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '12px' }}>
                Stay Connected
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>
                Subscribe for care tips and exclusive offers
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="Your email"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: '#e2e8f0',
                    fontSize: '14px',
                  }}
                />
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}>
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{
            borderTop: '1px solid #334155',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              © 2024 Serenity Bonsai Co. | Demo Site - Part of BotDojo SDK Playground
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['Privacy', 'Terms', 'Cookies'].map(item => (
                <a key={item} href="#" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Modal */}
      {showCart && (
        <Modal onClose={() => setShowCart(false)}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '24px' }}>
            Shopping Cart
          </h2>
          
          {cart.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>
              Your cart is empty
            </p>
          ) : (
            <>
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px' }}>
                {cart.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px',
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#334155',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                    }}>
                      {item.category === 'tree' ? '🌳' :
                       item.category === 'towel' ? '🧺' :
                       item.category === 'hat' ? '🧢' : '🐕'}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>
                        {item.name}
                      </h3>
                      <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>
                        ${item.price.toFixed(2)}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            backgroundColor: '#334155',
                            color: 'white',
                            border: 'none',
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                          }}
                        >
                          -
                        </button>
                        <span style={{ color: '#e2e8f0', minWidth: '24px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            backgroundColor: '#334155',
                            color: 'white',
                            border: 'none',
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: 'none',
                            marginLeft: 'auto',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{
                borderTop: '1px solid #334155',
                paddingTop: '16px',
                marginTop: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#e2e8f0' }}>Total:</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                    ${getTotalPrice().toFixed(2)}
                  </span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

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

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product, event?: React.MouseEvent) => void }) {
  const router = useRouter();
  const { sendMessage } = useBonsaiChat();

  const categoryEmoji = {
    tree: '🌳',
    towel: '🧺',
    hat: '🧢',
    'pet-sweater': '🐕',
  }[product.category] || '📦';

  const handleCardClick = () => {
    router.push(`/examples/bonsai-shop/product/${product.id}`);
  };

  const askAIAboutProduct = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const message = `Tell me more about ${product.name} <!-- product_id: ${product.id} -->`;
    // sendMessage handles queuing and opening the chat panel
    await sendMessage(message);
  };

  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #334155',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div style={{
        height: '200px',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '64px',
        borderBottom: '1px solid #334155',
        position: 'relative',
        overflow: 'hidden',
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
          categoryEmoji
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          backgroundColor: '#334155',
          color: '#94a3b8',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '12px',
          textTransform: 'capitalize',
        }}>
          {product.category.replace('-', ' ')}
        </div>

        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#e2e8f0',
          marginBottom: '8px',
          minHeight: '48px',
        }}>
          {product.name}
        </h3>

        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          marginBottom: '16px',
          minHeight: '60px',
          lineHeight: '1.5',
        }}>
          {product.description}
        </p>

        <div style={{ marginBottom: '12px' }}>
          <span style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#10b981',
          }}>
            ${product.price.toFixed(2)}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, e);
            }}
            disabled={!product.inStock}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: product.inStock ? '#10b981' : '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (product.inStock) e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              if (product.inStock) e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            {product.inStock ? '🛒 Add' : 'Out of Stock'}
          </button>
          <button
            onClick={askAIAboutProduct}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
          >
            💬 Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid #334155',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

