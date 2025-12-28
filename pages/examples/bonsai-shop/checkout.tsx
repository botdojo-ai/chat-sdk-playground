import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BonsaiShopLayout from './components/BonsaiShopLayout';

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  inStock: boolean;
  imagePrompt: string;
  imagePath?: string;
  quantity: number;
}

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zip: '',
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const existingCart = localStorage.getItem('bonsai-cart');
    if (existingCart) {
      setCart(JSON.parse(existingCart));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const completeOrder = () => {
    if (!formData.fullName || !formData.email || !formData.address || !formData.city || !formData.zip) {
      alert('Please fill in all fields');
      return;
    }

    alert('Order placed successfully! 🎉\n\nThis is a demo - no actual payment was processed.');
    localStorage.removeItem('bonsai-cart');
    router.push('/examples/bonsai-shop');
  };

  const categoryEmoji: Record<string, string> = {
    tree: '🌳',
    towel: '🧺',
    hat: '🧢',
    'pet-sweater': '🐕',
  };

  return (
    <BonsaiShopLayout>
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <Link href="/examples/bonsai-shop" style={{ color: '#10b981', textDecoration: 'none', fontSize: '14px' }}>
              ← Back to Shop
            </Link>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#e2e8f0', marginTop: '16px' }}>
              Checkout
            </h1>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8' }}>
              <p style={{ fontSize: '18px', marginBottom: '16px' }}>Your cart is empty</p>
              <Link 
                href="/examples/bonsai-shop"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                }}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
              {/* Left Column - Form */}
              <div>
                <div style={{ 
                  backgroundColor: '#1e293b', 
                  padding: '32px', 
                  borderRadius: '16px',
                  border: '1px solid #334155',
                }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '24px' }}>
                    Shipping Information
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontWeight: '600' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          backgroundColor: '#0f172a',
                          color: '#e2e8f0',
                          fontSize: '16px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontWeight: '600' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          backgroundColor: '#0f172a',
                          color: '#e2e8f0',
                          fontSize: '16px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontWeight: '600' }}>
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main St"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          backgroundColor: '#0f172a',
                          color: '#e2e8f0',
                          fontSize: '16px',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontWeight: '600' }}>
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="San Francisco"
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: '#0f172a',
                            color: '#e2e8f0',
                            fontSize: '16px',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontWeight: '600' }}>
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={formData.zip}
                          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                          placeholder="94102"
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: '#0f172a',
                            color: '#e2e8f0',
                            fontSize: '16px',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div>
                <div style={{ 
                  backgroundColor: '#1e293b', 
                  padding: '32px', 
                  borderRadius: '16px',
                  border: '1px solid #334155',
                  position: 'sticky',
                  top: '24px',
                }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '24px' }}>
                    Order Summary
                  </h2>

                  <div style={{ marginBottom: '24px' }}>
                    {cart.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          marginBottom: '16px',
                          paddingBottom: '16px',
                          borderBottom: '1px solid #334155',
                        }}
                      >
                        <div style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
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
                          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>
                            {item.name}
                          </h3>
                          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                            Qty: {item.quantity}
                          </p>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ 
                    borderTop: '2px solid #334155', 
                    paddingTop: '16px',
                    marginBottom: '24px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Subtotal:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: '600' }}>${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Shipping:</span>
                      <span style={{ color: '#10b981', fontWeight: '600' }}>FREE</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#e2e8f0' }}>Total:</span>
                      <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={completeOrder}
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
                    Complete Order
                  </button>

                  <p style={{
                    marginTop: '16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#64748b',
                  }}>
                    🔒 This is a demo checkout - no payment will be processed
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BonsaiShopLayout>
  );
}

