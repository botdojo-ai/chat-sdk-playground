import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface CartItem {
  id: string;
  quantity: number;
}

export default function FloatingCart() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    updateCartCount();
    
    // Listen for storage changes (when cart is updated from another component)
    const handleStorageChange = () => {
      updateCartCount();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes since localStorage events don't fire in same window
    const interval = setInterval(updateCartCount, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const updateCartCount = () => {
    const existingCart = localStorage.getItem('bonsai-cart');
    if (existingCart) {
      const cartItems = JSON.parse(existingCart);
      const total = cartItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
      setCartCount(total);
      setCart(cartItems);
    } else {
      setCartCount(0);
      setCart([]);
    }
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.id !== productId);
    localStorage.setItem('bonsai-cart', JSON.stringify(newCart));
    setCart(newCart);
    updateCartCount();
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newCart = cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    localStorage.setItem('bonsai-cart', JSON.stringify(newCart));
    setCart(newCart);
    updateCartCount();
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    setShowCart(false);
    router.push('/checkout');
  };

  const categoryEmoji: Record<string, string> = {
    tree: '🌳',
    towel: '🧺',
    hat: '🧢',
    'pet-sweater': '🐕',
  };

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setShowCart(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          cursor: 'pointer',
          fontSize: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🛒
        {cartCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '2px solid #0f172a',
          }}>
            {cartCount}
          </div>
        )}
      </button>

      {/* Cart Modal */}
      {showCart && (
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
            zIndex: 10000,
            padding: '20px',
          }}
          onClick={() => setShowCart(false)}
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
              onClick={() => setShowCart(false)}
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
                        flexShrink: 0,
                      }}>
                        {item.imagePath ? (
                          <img 
                            src={item.imagePath} 
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        ) : (
                          categoryEmoji[item.category] || '📦'
                        )}
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
          </div>
        </div>
      )}
    </>
  );
}

