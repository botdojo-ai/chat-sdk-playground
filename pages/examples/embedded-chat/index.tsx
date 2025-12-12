import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';

// Import the actual sample component and its source code
import BasicChat from '@/samples/basic-chat';
import { basic_chat_code } from '@generated/basic-chat';

// ============================================================================
// Architecture Animation Component
// ============================================================================

function ArchitectureAnimation() {
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const color = '#1d4ed8';
  const borderColor = '#e2e8f0';
  const textColor = 'var(--text-primary)';
  const mutedColor = 'var(--text-secondary)';
  
  // Auto-start animation when section becomes visible
  useEffect(() => {
    if (!sectionRef.current || hasStartedOnce) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStartedOnce) {
            setIsAnimating(true);
            setHasStartedOnce(true);
          }
        });
      },
      { threshold: 0.3 }
    );
    
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasStartedOnce]);

  // Auto-animate through steps
  useEffect(() => {
    if (!isAnimating) return;
    const totalSteps = 7;
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % (totalSteps + 1));
    }, 1350);
    return () => clearInterval(interval);
  }, [isAnimating]);
  
  return (
    <div ref={sectionRef} style={{
      padding: '20px',
      background: 'var(--bg-tertiary)',
      borderRadius: '12px',
      border: `1px solid ${borderColor}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', color: textColor, fontWeight: 600 }}>Data Flow</h4>
        <button
          onClick={() => { setIsAnimating(!isAnimating); if (!isAnimating) setAnimationStep(0); }}
          style={{
            padding: '5px 10px',
            background: isAnimating ? 'var(--bg-secondary)' : color,
            color: isAnimating ? textColor : '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          {isAnimating ? 'Stop' : 'Animate'}
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative', padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Your Website */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: animationStep === 1 || animationStep === 7 ? color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: animationStep === 1 || animationStep === 7 ? 1 : 0.7, transition: 'all 0.4s ease', boxShadow: animationStep === 1 || animationStep === 7 ? `0 0 16px ${color}50` : 'none' }}>
                <span style={{ fontSize: '22px' }}>🌐</span>
              </div>
              <span style={{ fontSize: '9px', color: animationStep === 1 || animationStep === 7 ? color : mutedColor, fontWeight: 600 }}>Your Website</span>
              <div style={{ padding: '3px 6px', borderRadius: '4px', background: animationStep === 4 ? '#ecfeff' : 'var(--bg-secondary)', border: `1px solid ${animationStep === 4 ? '#06b6d4' : borderColor}`, display: 'flex', alignItems: 'center', gap: '3px', transition: 'all 0.4s ease' }}>
                <span style={{ fontSize: '10px' }}>🎨</span><span style={{ fontSize: '8px', color: animationStep === 4 ? '#06b6d4' : textColor, fontWeight: 600 }}>Frontend MCP</span>
              </div>
            </div>
            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '22px' }}>
              <div style={{ width: '24px', height: '2px', background: animationStep === 1 ? color : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                <div style={{ position: 'absolute', right: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: `4px solid ${animationStep === 1 ? color : '#e2e8f0'}` }} />
              </div>
              <div style={{ width: '24px', height: '2px', background: animationStep === 6 ? '#06b6d4' : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                <div style={{ position: 'absolute', left: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderRight: `4px solid ${animationStep === 6 ? '#06b6d4' : '#e2e8f0'}` }} />
              </div>
            </div>
            {/* BotDojo Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: animationStep === 2 || animationStep === 6 ? color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', boxShadow: animationStep === 2 || animationStep === 6 ? `0 0 16px ${color}50` : 'none' }}>
                <span style={{ fontSize: '22px' }}>💬</span>
              </div>
              <span style={{ fontSize: '9px', color: animationStep === 2 || animationStep === 6 ? color : mutedColor, fontWeight: 600 }}>Chat Widget</span>
            </div>
            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '22px' }}>
              <div style={{ width: '24px', height: '2px', background: animationStep === 2 ? color : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                <div style={{ position: 'absolute', right: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: `4px solid ${animationStep === 2 ? color : '#e2e8f0'}` }} />
              </div>
              <div style={{ width: '24px', height: '2px', background: animationStep === 5 ? '#06b6d4' : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                <div style={{ position: 'absolute', left: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderRight: `4px solid ${animationStep === 5 ? '#06b6d4' : '#e2e8f0'}` }} />
              </div>
            </div>
            {/* BotDojo Cloud */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: animationStep === 3 || animationStep === 4 || animationStep === 5 ? '#eef2ff' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', border: animationStep === 3 || animationStep === 4 || animationStep === 5 ? `2px solid ${color}` : 'none', boxShadow: animationStep === 3 || animationStep === 4 || animationStep === 5 ? '0 4px 12px rgba(93,95,239,0.15)' : 'none' }}>
                <span style={{ fontSize: '22px' }}>☁️</span>
              </div>
              <span style={{ fontSize: '9px', color: animationStep === 3 || animationStep === 4 || animationStep === 5 ? color : mutedColor, fontWeight: 700 }}>BotDojo Cloud</span>
            </div>
            {/* Tools */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '8px' }}>
              <div style={{ padding: '4px 8px', borderRadius: '6px', background: animationStep === 4 ? '#fef3c7' : 'var(--bg-secondary)', border: `1px solid ${animationStep === 4 ? '#f59e0b' : borderColor}`, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.4s ease' }}>
                <span style={{ fontSize: '12px' }}>🔌</span><span style={{ fontSize: '8px', color: animationStep === 4 ? '#f59e0b' : textColor, fontWeight: 600 }}>Your API</span>
              </div>
              <div style={{ padding: '4px 8px', borderRadius: '6px', background: animationStep === 4 ? '#ecfdf5' : 'var(--bg-secondary)', border: `1px solid ${animationStep === 4 ? '#10b981' : borderColor}`, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.4s ease' }}>
                <span style={{ fontSize: '12px' }}>⚡</span><span style={{ fontSize: '8px', color: animationStep === 4 ? '#10b981' : textColor, fontWeight: 600 }}>Integrations</span>
              </div>
              <div style={{ padding: '4px 8px', borderRadius: '6px', background: animationStep === 4 ? '#f3e8ff' : 'var(--bg-secondary)', border: `1px solid ${animationStep === 4 ? '#8b5cf6' : borderColor}`, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.4s ease' }}>
                <span style={{ fontSize: '12px' }}>🔗</span><span style={{ fontSize: '8px', color: animationStep === 4 ? '#8b5cf6' : textColor, fontWeight: 600 }}>MCP Servers</span>
              </div>
            </div>
          </div>
        </div>
        {/* Step Description */}
        <div style={{ textAlign: 'center', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
          <span style={{ fontSize: '11px', color: animationStep === 0 ? mutedColor : (animationStep >= 5 ? '#06b6d4' : color), fontWeight: 600, transition: 'all 0.3s ease' }}>
            {animationStep === 0 && 'Click Animate to see the flow'}
            {animationStep === 1 && '🌐 User interacts with your website'}
            {animationStep === 2 && '💬 Message sent via BotDojo Chat widget'}
            {animationStep === 3 && '☁️ BotDojo Cloud processes the request'}
            {animationStep === 4 && '🔌 Executes tools: Your API, Integrations, Frontend MCP'}
            {animationStep === 5 && '☁️ Prepares streaming response'}
            {animationStep === 6 && '💬 Chat widget displays streaming response'}
            {animationStep === 7 && '🌐 User sees response on your website'}
          </span>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
          {[1,2,3,4,5,6,7].map(step => (
            <div key={step} style={{ width: '5px', height: '5px', borderRadius: '50%', background: animationStep >= step ? color : '#e2e8f0', transition: 'all 0.3s ease' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function EmbeddedChatPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>💬</span>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>Ready to Use</div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#1d4ed8', fontWeight: 800 }}>Embedded Chat</h1>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '700px' }}>
          Drop-in chat widget with streaming, tools, and MCP Apps. Add a fully-featured AI chat interface 
          to your app with just a few lines of code. No server setup required.
        </p>
      </div>

      {/* Architecture Animation */}
      <div style={{ marginBottom: '32px' }}>
        <ArchitectureAnimation />
      </div>

      {/* Features */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          What You Get
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { icon: '⚡', label: 'Zero server setup' },
            { icon: '🌊', label: 'Full streaming UX' },
            { icon: '🎨', label: 'MCP Apps included' },
            { icon: '📱', label: 'Multiple layouts' },
            { icon: '🔌', label: 'Frontend tools' },
            { icon: '💾', label: 'Session persistence' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Demo */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Live Demo
        </h2>
        <div 
          id="chat-demo-container"
          style={{ 
            height: '500px', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <BasicChat />
        </div>
      </div>

      {/* Code */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Code
        </h2>
        <CodeSnippet code={basic_chat_code} language="tsx" title="samples/basic-chat.tsx" />
      </div>

      {/* Next Steps */}
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-secondary)', 
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Next Steps
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link 
            href="/examples/basic"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#1d4ed8',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Configure Widget
          </Link>
          <Link 
            href="/examples/mcp-apps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'white',
              color: '#1d4ed8',
              border: '1px solid #1d4ed8',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Learn about MCP Apps
          </Link>
        </div>
      </div>
    </div>
  );
}

