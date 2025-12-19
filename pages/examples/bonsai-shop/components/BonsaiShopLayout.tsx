import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CartItem {
  id: string;
  quantity: number;
}

interface BonsaiShopLayoutProps {
  children: ReactNode;
  showBackLink?: boolean;
}

/**
 * BonsaiShopLayout - Layout specific to the Bonsai Shop pages
 * 
 * Just provides the shop header with branding and cart button.
 * The nav and debug panel are provided globally by _app.tsx.
 */
export default function BonsaiShopLayout({ children, showBackLink = false }: BonsaiShopLayoutProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCartCountRef = useRef(0);

  useEffect(() => {
    updateCart();
    
    // Listen for storage changes (when cart is updated from another component)
    const handleStorageChange = () => {
      updateCart();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes since localStorage events don't fire in same window
    const interval = setInterval(updateCart, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const updateCart = () => {
    const existingCart = localStorage.getItem('bonsai-cart');
    if (existingCart) {
      try {
        const cartItems = JSON.parse(existingCart);
        const total = cartItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
        
        // Trigger animation if count increased
        if (total > prevCartCountRef.current) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 600);
        }
        
        prevCartCountRef.current = total;
        setCart(cartItems);
      } catch (error) {
        console.error('Failed to load cart:', error);
        setCart([]);
        prevCartCountRef.current = 0;
      }
    } else {
      prevCartCountRef.current = 0;
      setCart([]);
    }
  };

  const getTotalItems = () => {
    return cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
             
              <Link href="/examples/bonsai-shop" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}>
                  🌳
                </div>
                <div>
                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#e2e8f0',
                    margin: 0,
                    lineHeight: '1',
                    marginBottom: '2px',
                  }}>
                    Serenity Bonsai Co.
                  </h1>
                  <p style={{
                    fontSize: '11px',
                    color: '#10b981',
                    margin: 0,
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    Cultivating Tranquility
                  </p>
                </div>
              </Link>
            </div>

            <Link href="/examples/bonsai-shop/checkout">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  🛒 Cart
                </button>
                {getTotalItems() > 0 && (
                  <div
                    key={getTotalItems()}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '-8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                      animation: isAnimating ? 'bounceIn 0.6s ease-out' : 'none',
                    }}
                  >
                    {getTotalItems()}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {children}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bounceIn {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.3);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `
      }} />
    </div>
  );
}
