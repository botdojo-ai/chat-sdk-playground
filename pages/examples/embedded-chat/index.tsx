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
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl md:text-[32px]">💬</span>
          <div>
            <div className="text-[10px] md:text-[11px] text-slate-500 tracking-wider font-bold uppercase">Ready to Use</div>
            <h1 className="m-0 text-xl md:text-[28px] text-blue-700 font-extrabold">Embedded Chat</h1>
          </div>
        </div>
        <p className="m-0 text-sm md:text-[15px] text-slate-600 leading-relaxed max-w-[700px]">
          Drop-in chat widget with streaming, tools, and MCP Apps. Add a fully-featured AI chat interface 
          to your app with just a few lines of code. No server setup required.
        </p>
      </div>

      {/* Architecture Animation */}
      <div className="mb-5 md:mb-8">
        <ArchitectureAnimation />
      </div>

      {/* Features */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 rounded-xl border border-blue-200/50" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)' }}>
        <h3 className="m-0 mb-3 text-sm md:text-base font-bold text-slate-900">
          What You Get
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {[
            { icon: '⚡', label: 'Zero server setup' },
            { icon: '🌊', label: 'Full streaming UX' },
            { icon: '🎨', label: 'MCP Apps included' },
            { icon: '📱', label: 'Multiple layouts' },
            { icon: '🔌', label: 'Frontend tools' },
            { icon: '💾', label: 'Session persistence' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs md:text-[13px] font-semibold text-slate-900">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Demo */}
      <div className="mb-5 md:mb-8">
        <h2 className="m-0 mb-3 md:mb-4 text-lg md:text-xl font-bold text-slate-900">
          Live Demo
        </h2>
        <div 
          id="chat-demo-container"
          className="h-[400px] md:h-[500px] border border-slate-200 rounded-xl overflow-hidden shadow-md"
        >
          <BasicChat />
        </div>
      </div>

      {/* Code */}
      <div className="mb-5 md:mb-8">
        <h2 className="m-0 mb-3 md:mb-4 text-lg md:text-xl font-bold text-slate-900">
          Code
        </h2>
        <CodeSnippet code={basic_chat_code} language="tsx" title="samples/basic-chat.tsx" />
      </div>

      {/* Next Steps */}
      <div className="p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h3 className="m-0 mb-3 text-sm md:text-base font-bold text-slate-900">
          Next Steps
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/examples/basic"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            Configure Widget
          </Link>
          <Link 
            href="/examples/mcp-apps"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-700 border border-blue-700 rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            Learn about MCP Apps
          </Link>
        </div>
      </div>
    </div>
  );
}

