import React, { useState, useEffect, useRef } from 'react';
import CodeSnippet from '@/components/CodeSnippet';

// ============================================================================
// SECTION: Architecture Animations
// ============================================================================

type DeploymentModel = 'chat' | 'provider';

function ArchitectureAnimation({ model, color }: { model: DeploymentModel; color: string }) {
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const borderColor = '#cbd5e1';
  const textColor = '#0f172a';
  const mutedColor = '#475569';
  
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
      padding: '24px',
      background: '#f8fafc',
      borderRadius: '16px',
      border: `1px solid ${borderColor}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', color: textColor, fontWeight: 600 }}>How It Works</h4>
        <button
          onClick={() => { setIsAnimating(!isAnimating); if (!isAnimating) setAnimationStep(0); }}
          style={{
            padding: '6px 12px',
            background: isAnimating ? '#f3f4f6' : color,
            color: isAnimating ? textColor : '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {isAnimating ? '⏹ Stop' : '▶ Animate'}
        </button>
      </div>
      
      {/* Chat Model Animation */}
      {model === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative', padding: '24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Your Website */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: animationStep === 1 || animationStep === 7 ? color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: animationStep === 1 || animationStep === 7 ? 1 : 0.7, transition: 'all 0.4s ease', boxShadow: animationStep === 1 || animationStep === 7 ? `0 0 20px ${color}50` : 'none' }}>
                  <span style={{ fontSize: '28px' }}>🌐</span>
                </div>
                <span style={{ fontSize: '10px', color: animationStep === 1 || animationStep === 7 ? color : mutedColor, fontWeight: 600 }}>Your Website</span>
                <div style={{ padding: '4px 8px', borderRadius: '6px', background: animationStep === 4 ? '#ecfeff' : '#f8fafc', border: `1px solid ${animationStep === 4 ? '#06b6d4' : borderColor}`, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.4s ease' }}>
                  <span style={{ fontSize: '12px' }}>🎨</span><span style={{ fontSize: '9px', color: animationStep === 4 ? '#06b6d4' : textColor, fontWeight: 600 }}>Frontend MCP</span>
                </div>
              </div>
              {/* Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '28px' }}>
                <div style={{ width: '30px', height: '2px', background: animationStep === 1 ? color : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                  <div style={{ position: 'absolute', right: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: `4px solid ${animationStep === 1 ? color : '#e2e8f0'}` }} />
                </div>
                <div style={{ width: '30px', height: '2px', background: animationStep === 6 ? '#06b6d4' : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                  <div style={{ position: 'absolute', left: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderRight: `4px solid ${animationStep === 6 ? '#06b6d4' : '#e2e8f0'}` }} />
                </div>
              </div>
              {/* BotDojo Chat */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: animationStep === 2 || animationStep === 6 ? color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', boxShadow: animationStep === 2 || animationStep === 6 ? `0 0 20px ${color}50` : 'none' }}>
                  <span style={{ fontSize: '28px' }}>💬</span>
                </div>
                <span style={{ fontSize: '10px', color: animationStep === 2 || animationStep === 6 ? color : mutedColor, fontWeight: 600 }}>BotDojo Chat</span>
              </div>
              {/* Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '28px' }}>
                <div style={{ width: '30px', height: '2px', background: animationStep === 2 ? color : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                  <div style={{ position: 'absolute', right: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: `4px solid ${animationStep === 2 ? color : '#e2e8f0'}` }} />
                </div>
                <div style={{ width: '30px', height: '2px', background: animationStep === 5 ? '#06b6d4' : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                  <div style={{ position: 'absolute', left: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderRight: `4px solid ${animationStep === 5 ? '#06b6d4' : '#e2e8f0'}` }} />
                </div>
              </div>
              {/* BotDojo Cloud */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: animationStep === 3 || animationStep === 4 || animationStep === 5 ? '#eef2ff' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', border: animationStep === 3 || animationStep === 4 || animationStep === 5 ? `2px solid ${color}` : 'none', boxShadow: animationStep === 3 || animationStep === 4 || animationStep === 5 ? '0 6px 14px rgba(93,95,239,0.15)' : 'none' }}>
                  <span style={{ fontSize: '28px' }}>☁️</span>
                </div>
                <span style={{ fontSize: '10px', color: animationStep === 3 || animationStep === 4 || animationStep === 5 ? color : mutedColor, fontWeight: 700 }}>BotDojo Cloud</span>
              </div>
              {/* Tools */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '16px' }}>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: animationStep === 4 ? '#fef3c7' : '#f8fafc', border: `1px solid ${animationStep === 4 ? '#f59e0b' : borderColor}`, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.4s ease' }}>
                  <span style={{ fontSize: '14px' }}>🔌</span><span style={{ fontSize: '9px', color: animationStep === 4 ? '#f59e0b' : textColor, fontWeight: 600 }}>Your API</span>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: animationStep === 4 ? '#ecfdf5' : '#f8fafc', border: `1px solid ${animationStep === 4 ? '#10b981' : borderColor}`, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.4s ease' }}>
                  <span style={{ fontSize: '14px' }}>⚡</span><span style={{ fontSize: '9px', color: animationStep === 4 ? '#10b981' : textColor, fontWeight: 600 }}>Integration</span>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: animationStep === 4 ? '#f3e8ff' : '#f8fafc', border: `1px solid ${animationStep === 4 ? '#8b5cf6' : borderColor}`, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.4s ease' }}>
                  <span style={{ fontSize: '14px' }}>🔗</span><span style={{ fontSize: '9px', color: animationStep === 4 ? '#8b5cf6' : textColor, fontWeight: 600 }}>External MCP</span>
                </div>
              </div>
            </div>
          </div>
          {/* Step Description */}
          <div style={{ textAlign: 'center', padding: '12px 16px', background: '#ffffff', borderRadius: '10px', border: `1px solid ${borderColor}` }}>
            <span style={{ fontSize: '12px', color: animationStep === 0 ? mutedColor : (animationStep >= 5 ? '#06b6d4' : color), fontWeight: 600, transition: 'all 0.3s ease' }}>
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
            {[1,2,3,4,5,6,7].map(step => (
              <div key={step} style={{ width: '6px', height: '6px', borderRadius: '50%', background: animationStep >= step ? color : '#e2e8f0', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </div>
      )}
      
      {/* Provider Model Animation */}
      {model === 'provider' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative', padding: '24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Custom UI */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: animationStep === 1 || animationStep === 6 ? color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: animationStep === 1 || animationStep === 6 ? 1 : 0.7, transition: 'all 0.4s ease', boxShadow: animationStep === 1 || animationStep === 6 ? `0 0 20px ${color}50` : 'none' }}>
                  <span style={{ fontSize: '28px' }}>🎨</span>
                </div>
                <span style={{ fontSize: '9px', color: animationStep === 1 || animationStep === 6 ? color : mutedColor, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>Your Website<br/>Custom Chat UI</span>
                <div style={{ padding: '4px 8px', borderRadius: '6px', background: animationStep === 4 ? '#ecfeff' : '#f8fafc', border: `1px solid ${animationStep === 4 ? '#06b6d4' : borderColor}`, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.4s ease' }}>
                  <span style={{ fontSize: '12px' }}>🎨</span><span style={{ fontSize: '9px', color: animationStep === 4 ? '#06b6d4' : textColor, fontWeight: 600 }}>Frontend MCP</span>
              </div>
              </div>
              {/* Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '28px' }}>
                <div style={{ width: '30px', height: '2px', background: animationStep === 1 ? color : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                  <div style={{ position: 'absolute', right: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: `4px solid ${animationStep === 1 ? color : '#e2e8f0'}` }} />
                </div>
                <div style={{ width: '30px', height: '2px', background: animationStep === 6 ? '#06b6d4' : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                  <div style={{ position: 'absolute', left: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderRight: `4px solid ${animationStep === 6 ? '#06b6d4' : '#e2e8f0'}` }} />
                </div>
              </div>
              {/* SDK Hooks */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: animationStep === 2 || animationStep === 5 ? color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', boxShadow: animationStep === 2 || animationStep === 5 ? `0 0 20px ${color}50` : 'none' }}>
                  <span style={{ fontSize: '28px' }}>📡</span>
                </div>
                <span style={{ fontSize: '10px', color: animationStep === 2 || animationStep === 5 ? color : mutedColor, fontWeight: 600 }}>SDK Hooks</span>
              </div>
              {/* Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '28px' }}>
                <div style={{ width: '30px', height: '2px', background: animationStep === 2 ? color : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                  <div style={{ position: 'absolute', right: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: `4px solid ${animationStep === 2 ? color : '#e2e8f0'}` }} />
                </div>
                <div style={{ width: '30px', height: '2px', background: animationStep === 5 ? '#06b6d4' : '#e2e8f0', position: 'relative', transition: 'all 0.4s ease' }}>
                  <div style={{ position: 'absolute', left: '-3px', top: '-2px', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderRight: `4px solid ${animationStep === 5 ? '#06b6d4' : '#e2e8f0'}` }} />
                </div>
              </div>
              {/* BotDojo Cloud */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: animationStep === 3 || animationStep === 4 ? '#eef2ff' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', border: animationStep === 3 || animationStep === 4 ? `2px solid ${color}` : 'none', boxShadow: animationStep === 3 || animationStep === 4 ? '0 6px 14px rgba(93,95,239,0.15)' : 'none' }}>
                  <span style={{ fontSize: '28px' }}>☁️</span>
                </div>
                <span style={{ fontSize: '10px', color: animationStep === 3 || animationStep === 4 ? color : mutedColor, fontWeight: 700 }}>BotDojo Cloud</span>
              </div>
              {/* Tools */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '16px' }}>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: animationStep === 4 ? '#fef3c7' : '#f8fafc', border: `1px solid ${animationStep === 4 ? '#f59e0b' : borderColor}`, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.4s ease' }}>
                  <span style={{ fontSize: '14px' }}>🔌</span><span style={{ fontSize: '9px', color: animationStep === 4 ? '#f59e0b' : textColor, fontWeight: 600 }}>Your API</span>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: animationStep === 4 ? '#ecfdf5' : '#f8fafc', border: `1px solid ${animationStep === 4 ? '#10b981' : borderColor}`, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.4s ease' }}>
                  <span style={{ fontSize: '14px' }}>⚡</span><span style={{ fontSize: '9px', color: animationStep === 4 ? '#10b981' : textColor, fontWeight: 600 }}>Integration</span>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: animationStep === 4 ? '#f3e8ff' : '#f8fafc', border: `1px solid ${animationStep === 4 ? '#8b5cf6' : borderColor}`, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.4s ease' }}>
                  <span style={{ fontSize: '14px' }}>🔗</span><span style={{ fontSize: '9px', color: animationStep === 4 ? '#8b5cf6' : textColor, fontWeight: 600 }}>External MCP</span>
                </div>
              </div>
            </div>
          </div>
          {/* Step Description */}
          <div style={{ textAlign: 'center', padding: '12px 16px', background: '#ffffff', borderRadius: '10px', border: `1px solid ${borderColor}` }}>
            <span style={{ fontSize: '12px', color: animationStep === 0 ? mutedColor : (animationStep >= 5 ? '#06b6d4' : color), fontWeight: 600, transition: 'all 0.3s ease' }}>
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
            {[1,2,3,4,5,6].map(step => (
              <div key={step} style={{ width: '6px', height: '6px', borderRadius: '50%', background: animationStep >= step ? color : '#e2e8f0', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SECTION: Code Examples
// ============================================================================

const chatExample = `import { BotDojoChat } from '@botdojo/chat-sdk';

function App() {
  return (
    <BotDojoChat
      apiKey="your-api-key"
      mode="popup"  // or "inline", "side-panel"
      modelContext={{
        tools: [/* your custom tools */],
        resources: [/* dynamic context */],
      }}
      onToolCall={(tool, params, appId) => {
        // Handle MCP App interactions
      }}
    />
  );
}`;

const customExample = `import { 
  BotDojoChatProvider, 
  useChatMessages, 
  useChatActions,
  McpAppHost,  // Component for rendering MCP Apps
} from '@botdojo/chat-sdk';

function CustomChatUI() {
  const { messages } = useChatMessages();
  const { sendMessage, isStreaming } = useChatActions();
  
  return (
    <div className="my-custom-chat">
      {messages.map(msg => (
        <div key={msg.id}>
          <MyMessageComponent message={msg} />
          
          {/* Render MCP Apps embedded in the message */}
          {msg.mcpApp && (
            <McpAppHost
              mcpAppId={msg.mcpApp.mcpAppId}
              onToolCall={async (tool, params, appId) => {
                // Handle tool calls from the MCP App
                console.log('Tool called:', tool, params);
                return { success: true };
              }}
              onOpenLink={(url, target, appId) => {
                // Handle link requests
                window.open(url, target);
              }}
              onUiMessage={(message, params, appId) => {
                // Handle messages from the app
                console.log('App message:', message);
              }}
              height={400}
            />
          )}
        </div>
      ))}
      <MyInputComponent onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}

function App() {
  return (
    <BotDojoChatProvider apiKey="your-api-key">
      <CustomChatUI />
    </BotDojoChatProvider>
  );
}`;

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function DeployAgentUIPage() {
  const textColor = '#0f172a';
  const mutedColor = '#475569';
  const borderColor = '#cbd5e1';
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            margin: '0 0 16px 0',
            color: textColor,
          }}>
            Architecture Overview
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: mutedColor,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Two ways to add AI agents to your frontend: use our ready-made chat widget 
            or build a completely custom UI with our hooks.
          </p>
        </div>
        
        {/* Two Options Stacked */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '48px',
        }}>
          {/* BotDojo Chat */}
          <section style={{ padding: '12px 0', borderTop: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <span style={{ fontSize: '32px' }}>💬</span>
              <div>
                <div style={{ fontSize: '12px', color: mutedColor, letterSpacing: '0.08em', fontWeight: 700 }}>READY TO USE</div>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#1d4ed8', fontWeight: 800 }}>BotDojo Chat</h2>
              </div>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: mutedColor, lineHeight: 1.7 }}>
              Drop-in chat widget with streaming, tools, and MCP Apps. No server required—just add your key and ship.
            </p>

            <ArchitectureAnimation model="chat" color="#1d4ed8" />

            <div style={{ marginTop: '18px', marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', color: mutedColor, letterSpacing: '0.08em', fontWeight: 700, marginBottom: '8px' }}>WHAT YOU GET</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 18px', fontSize: '13px', color: textColor, fontWeight: 600 }}>
                <span>Zero server setup</span>
                <span>Full streaming UX</span>
                <span>MCP Apps included</span>
                <span>Inline, popup, or side panel</span>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <CodeSnippet title="BotDojo Chat" code={chatExample} language="tsx" />
            </div>

            <a 
              href="/examples/basic"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: '#1d4ed8',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: '0 12px 30px rgba(29,78,216,0.15)',
              }}
            >
              Try BotDojo Chat →
            </a>
          </section>
          
          {/* Custom Chat UI */}
          <section style={{ padding: '12px 0', borderTop: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <span style={{ fontSize: '32px' }}>🎨</span>
              <div>
                <div style={{ fontSize: '12px', color: mutedColor, letterSpacing: '0.08em', fontWeight: 700 }}>FULL CONTROL</div>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#0ea5e9', fontWeight: 800 }}>Custom Chat UI</h2>
              </div>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: mutedColor, lineHeight: 1.7 }}>
              BotDojo hosts the backend and streams events to your components. Build the exact UI you want while keeping tools, MCP Apps, and events.
            </p>

            <ArchitectureAnimation model="provider" color="#0ea5e9" />

            <div style={{ marginTop: '18px', marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', color: mutedColor, letterSpacing: '0.08em', fontWeight: 700, marginBottom: '8px' }}>WHAT YOU GET</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 18px', fontSize: '13px', color: textColor, fontWeight: 600 }}>
                <span>Custom components</span>
                <span>Event streaming hooks</span>
                <span>Headless control</span>
                <span>Full design freedom</span>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <CodeSnippet title="Custom Chat UI with McpAppHost" code={customExample} language="tsx" />
            </div>

            <a 
              href="/examples/headless-mcp"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: '#0ea5e9',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: '0 12px 30px rgba(14,165,233,0.15)',
              }}
            >
              Try Custom Chat UI →
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
