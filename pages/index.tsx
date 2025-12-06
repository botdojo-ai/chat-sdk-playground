import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';

// ============================================================================
// Architecture Animation Component
// ============================================================================

type DeploymentModel = 'chat' | 'provider';

function ArchitectureAnimation(props: { model: DeploymentModel; color: string }) {
  const { model, color } = props;
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
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
    const totalSteps = model === 'chat' ? 7 : 6;
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % (totalSteps + 1));
    }, 1350);
    return () => clearInterval(interval);
  }, [isAnimating, model]);
  
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
          {isAnimating ? '⏹ Stop' : '▶ Animate'}
        </button>
      </div>
      
      {/* Chat Model Animation */}
      {model === 'chat' && (
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
      )}
      
      {/* Provider Model Animation */}
      {model === 'provider' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative', padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Custom UI */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: animationStep === 1 || animationStep === 6 ? color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: animationStep === 1 || animationStep === 6 ? 1 : 0.7, transition: 'all 0.4s ease', boxShadow: animationStep === 1 || animationStep === 6 ? `0 0 16px ${color}50` : 'none' }}>
                  <span style={{ fontSize: '22px' }}>🎨</span>
                </div>
                <span style={{ fontSize: '8px', color: animationStep === 1 || animationStep === 6 ? color : mutedColor, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>Your Website<br/>Custom Chat UI</span>
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
              {/* SDK Hooks */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: animationStep === 2 || animationStep === 5 ? color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', boxShadow: animationStep === 2 || animationStep === 5 ? `0 0 16px ${color}50` : 'none' }}>
                  <span style={{ fontSize: '22px' }}>📡</span>
                </div>
                <span style={{ fontSize: '9px', color: animationStep === 2 || animationStep === 5 ? color : mutedColor, fontWeight: 600 }}>SDK Hooks</span>
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
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: animationStep === 3 || animationStep === 4 ? '#eef2ff' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', border: animationStep === 3 || animationStep === 4 ? `2px solid ${color}` : 'none', boxShadow: animationStep === 3 || animationStep === 4 ? '0 4px 12px rgba(93,95,239,0.15)' : 'none' }}>
                  <span style={{ fontSize: '22px' }}>☁️</span>
                </div>
                <span style={{ fontSize: '9px', color: animationStep === 3 || animationStep === 4 ? color : mutedColor, fontWeight: 700 }}>BotDojo Cloud</span>
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
              {animationStep === 1 && '🎨 User sends message from your custom chat UI'}
              {animationStep === 2 && '📡 SDK hooks connect to BotDojo Cloud'}
              {animationStep === 3 && '☁️ BotDojo Cloud processes the request'}
              {animationStep === 4 && '🔌 Executes tools: Your API, Integrations, Frontend MCP'}
              {animationStep === 5 && '📡 Streams events back via SDK hooks'}
              {animationStep === 6 && '🎨 Your custom UI displays the response'}
            </span>
          </div>
          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
            {[1,2,3,4,5,6].map(step => (
              <div key={step} style={{ width: '5px', height: '5px', borderRadius: '50%', background: animationStep >= step ? color : '#e2e8f0', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Code Examples
// ============================================================================

const chatCodeExample = `import { BotDojoChat } from '@botdojo/chat-sdk';

function App() {
  return (
    <BotDojoChat
      apiKey="your-api-key"
      mode="popup"  // or "inline", "side-panel"
      modelContext={{
        tools: [/* your frontend tools */],
        resources: [/* dynamic context */],
      }}
    />
  );
}`;

const customCodeExample = `import { 
  BotDojoChatProvider, 
  useChatMessages, 
  useChatActions,
  McpAppHost,
} from '@botdojo/chat-sdk';

function CustomChatUI() {
  const { messages } = useChatMessages();
  const { sendMessage } = useChatActions();
  
  return (
    <div className="my-chat">
      {messages.map(msg => (
        <div key={msg.id}>
          <MyMessage message={msg} />
          {msg.mcpApp && <McpAppHost mcpAppData={msg.mcpApp} />}
        </div>
      ))}
      <MyInput onSend={sendMessage} />
    </div>
  );
}`;

// ============================================================================
// Main Page Component
// ============================================================================

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen overflow-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <div 
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        }}
      >
        <div 
          className="max-w-5xl mx-auto px-6 py-16 text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="inline-block mb-4">
            <div 
              className="text-5xl md:text-6xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                paddingBottom: '10px',
              }}
            >
              BotDojo Chat SDK
            </div>
            <div 
              className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#6366f1',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              Beta
            </div>
          </div>
          
          <p 
            className="text-xl md:text-2xl mb-6"
            style={{ 
              color: 'var(--text-primary)',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
            }}
          >
            Build AI Agents That See and Act In Your App
          </p>

          {/* Hook */}
          <div 
            className="max-w-3xl mx-auto mb-8"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
            }}
          >

            <p 
              className="text-base"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
            >
              Give agents visibility into what users see and let them act on their behalf. 
              Rich UI experiences, API calls, and open standards—all in one SDK.
            </p>
          </div>
          
          <div 
            className="flex gap-4 justify-center mb-8"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
            }}
          >
            <Link 
              href="/examples/chat-sdk/bonsai-shop"
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              Try Live Demo
            </Link>
            
            <a
              href="https://app.botdojo.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              Sign Up Free
            </a>
          </div>

          {/* Quick Start One-Liner */}
          <div 
            className="max-w-2xl mx-auto"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
            }}
          >
            <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ⚡ Quick Start
            </div>
            <div 
              className="relative rounded-lg p-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ paddingRight: '70px' }}>
                <span style={{ color: 'var(--color-success)', marginRight: '8px' }}>$</span>
                npm install -g @botdojo/cli && botdojo playground
              </div>
              <QuickStartCopyButton />
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Installs CLI, clones repo, installs dependencies, and sets up your project
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        
        
        {/* How AI is changing work - Examples */}
        <div 
          className="mb-12"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.8s ease-out 0.7s',
          }}
        >
          <h2 
            className="text-2xl font-bold mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            How AI is changing the way people work
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            The best AI products aren't chat boxes bolted onto the side—they're agents deeply integrated into the workflow. Look at what's working:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ExampleCard 
              title="Cursor AI"
              description="Edit code by describing what you want—the agent sees your codebase and makes changes directly"
            />
            <ExampleCard 
              title="Replit Agent"
              description="Builds entire apps from a prompt, deploying and debugging as it goes"
            />
            <ExampleCard 
              title="Notion AI"
              description="Restructures your docs and databases without leaving the page"
            />
            <ExampleCard 
              title="Shopify Sidekick"
              description="Updates inventory and creates discounts through conversation"
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            What do these have in common? The AI isn't a separate experience—it's woven into the product. 
            Users stay in their flow while the agent works alongside them.
          </p>
        </div>
{/* Rich AI Experience Features */}
<div 
          className="mb-12 p-6 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.8s ease-out 0.6s',
          }}
        >
          <h3 
            className="text-xl font-bold mb-4 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <span>✨</span>
            BotDojo Chat SDK Features
          </h3>
         
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FeatureItem icon="🎯" label="Agentic UI" desc="Agent sees & acts in your app" />
            <FeatureItem icon="🌊" label="Real-time Streaming" desc="See responses as they generate" />
            <FeatureItem icon="🎨" label="MCP Apps" desc="Open standard for rich UI cards" />
            <FeatureItem icon="💾" label="Persistence" desc="Sessions, messages, app state" />
          </div>
        </div>

        {/* Two Ways to Deploy - Stacked */}
        <div style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.8s ease-out 0.8s' }}>
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Two Ways to Deploy
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Use our ready-made chat widget or build a completely custom UI with hooks.
          </p>
          
          <div className="flex flex-col gap-12">
            {/* BotDojo Chat Option */}
            <div 
              className="p-6 rounded-xl"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <span style={{ fontSize: '28px' }}>💬</span>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>READY TO USE</div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#1d4ed8', fontWeight: 800 }}>BotDojo Chat</h3>
                </div>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Drop-in chat widget with streaming, tools, and MCP Apps. No server required.
              </p>

              <ArchitectureAnimation model="chat" color="#1d4ed8" />

              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '6px' }}>WHAT YOU GET</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <span>✓ Zero server setup</span>
                  <span>✓ Full streaming UX</span>
                  <span>✓ MCP Apps included</span>
                  <span>✓ Multiple layouts</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <CodeSnippet title="BotDojo Chat" code={chatCodeExample} language="tsx" />
              </div>

              <Link 
                href="/examples/chat-sdk/basic"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: '#1d4ed8',
                  color: 'white',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Try BotDojo Chat →
              </Link>
            </div>

            {/* Custom Chat UI Option */}
            <div 
              className="p-6 rounded-xl"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <span style={{ fontSize: '28px' }}>🎨</span>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>FULL CONTROL</div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#0ea5e9', fontWeight: 800 }}>Custom Chat UI</h3>
                </div>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Build your own chat interface. BotDojo handles the backend—you control every pixel.
              </p>

              <ArchitectureAnimation model="provider" color="#0ea5e9" />

              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '6px' }}>WHAT YOU GET</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <span>✓ Custom components</span>
                  <span>✓ Event streaming hooks</span>
                  <span>✓ Headless control</span>
                  <span>✓ Full design freedom</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <CodeSnippet title="Custom Chat UI" code={customCodeExample} language="tsx" />
              </div>

              <Link 
                href="/examples/chat-sdk/headless-mcp"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: '#0ea5e9',
                  color: 'white',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Try Custom Chat UI →
              </Link>
            </div>
          </div>
        </div>

        {/* What BotDojo Handles */}
        <div 
          className="mt-16 p-6 rounded-xl"
          style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h3 
            className="text-xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            BotDojo Handles the Hard Parts
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div style={{ color: 'var(--text-secondary)' }}>
              <span style={{ marginRight: '6px' }}>🔌</span>
              <strong style={{ color: 'var(--text-primary)' }}>Communication</strong>
              <span style={{ display: 'block', marginLeft: '22px', fontSize: '12px' }}>Streaming, reconnection, tool calls</span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              <span style={{ marginRight: '6px' }}>🔒</span>
              <strong style={{ color: 'var(--text-primary)' }}>Security</strong>
              <span style={{ display: 'block', marginLeft: '22px', fontSize: '12px' }}>CORS, sandboxing, CSP</span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              <span style={{ marginRight: '6px' }}>💾</span>
              <strong style={{ color: 'var(--text-primary)' }}>Persistence</strong>
              <span style={{ display: 'block', marginLeft: '22px', fontSize: '12px' }}>Sessions, messages, MCP App state</span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              <span style={{ marginRight: '6px' }}>📐</span>
              <strong style={{ color: 'var(--text-primary)' }}>Open Standards</strong>
              <span style={{ display: 'block', marginLeft: '22px', fontSize: '12px' }}>MCP + MCP Apps spec compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function QuickStartCopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -g @botdojo/cli && botdojo playground');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-1.5 right-2 px-3 py-1.5 rounded-md font-sans text-xs font-semibold transition-all duration-200"
      style={{
        background: copied 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {copied ? '✓ Copied!' : '📋 Copy'}
    </button>
  );
}

function ExampleCard(props: { title: string; description: string }) {
  return (
    <div 
      className="p-4 rounded-lg"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {props.title}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {props.description}
      </div>
    </div>
  );
}

function FeatureItem(props: { icon: string; label: string; desc: string }) {
  return (
    <div 
      className="p-3 rounded-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
      }}
    >
      <div className="text-xl mb-1">{props.icon}</div>
      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{props.label}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{props.desc}</div>
    </div>
  );
}
