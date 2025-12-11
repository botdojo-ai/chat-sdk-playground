import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';
import { Tabs } from '@/components/Tabs';

// Import the demo component
import HeadlessDemo from '@/samples/headless-chat/HeadlessDemo';

// Import the generated code strings
import {
  headless_chat_HeadlessDemo_code,
  headless_chat_MessageList_code,
  headless_chat_MessageBubble_code,
  headless_chat_ChatInput_code,
} from '@generated/headless-chat';

// ============================================================================
// Architecture Animation Component (Provider Model)
// ============================================================================

function ArchitectureAnimation() {
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const color = '#0ea5e9';
  const borderColor = '#e2e8f0';
  const textColor = 'var(--text-primary)';
  const mutedColor = 'var(--text-secondary)';
  
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

  useEffect(() => {
    if (!isAnimating) return;
    const totalSteps = 6;
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
            {/* Custom UI */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: animationStep === 1 || animationStep === 6 ? color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: animationStep === 1 || animationStep === 6 ? 1 : 0.7, transition: 'all 0.4s ease', boxShadow: animationStep === 1 || animationStep === 6 ? `0 0 16px ${color}50` : 'none' }}>
                <span style={{ fontSize: '22px' }}>🎨</span>
              </div>
              <span style={{ fontSize: '8px', color: animationStep === 1 || animationStep === 6 ? color : mutedColor, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>Your Website<br/>Custom Chat UI</span>
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
    </div>
  );
}

// ============================================================================
// Code files configuration
// ============================================================================

const codeFiles = [
  { id: 'demo', label: 'HeadlessDemo.tsx', code: headless_chat_HeadlessDemo_code },
  { id: 'list', label: 'MessageList.tsx', code: headless_chat_MessageList_code },
  { id: 'bubble', label: 'MessageBubble.tsx', code: headless_chat_MessageBubble_code },
  { id: 'input', label: 'ChatInput.tsx', code: headless_chat_ChatInput_code },
];

// ============================================================================
// Main Page Component
// ============================================================================

export default function HeadlessChatPage() {
  const [activeCodeTab, setActiveCodeTab] = useState('demo');

  const activeCode = codeFiles.find(f => f.id === activeCodeTab)?.code || '';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>🎨</span>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>Full Control</div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#0ea5e9', fontWeight: 800 }}>Headless Chat</h1>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '700px' }}>
          Build your own chat interface with full design control. Use React hooks and providers 
          to access chat state, actions, and streaming events. BotDojo handles the backend—you control every pixel.
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
        background: 'linear-gradient(135deg, #ecfeff 0%, #f0f9ff 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(14, 165, 233, 0.2)',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          What You Get
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { icon: '🎯', label: 'Custom components' },
            { icon: '📡', label: 'Event streaming hooks' },
            { icon: '🔌', label: 'Headless control' },
            { icon: '✨', label: 'Full design freedom' },
            { icon: '🎨', label: 'MCP Apps support' },
            { icon: '⚡', label: 'Real-time updates' },
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
        <div style={{ 
          height: '450px', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}>
          <HeadlessDemo />
        </div>
      </div>

      {/* Code with Tabs */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Code
        </h2>
        
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <Tabs
              tabs={codeFiles.map(f => ({ id: f.id, label: f.label }))}
              activeId={activeCodeTab}
              onChange={setActiveCodeTab}
            />
          </div>
          <div style={{ padding: '16px' }}>
            <CodeSnippet 
              code={activeCode} 
              language="tsx" 
              title={`samples/headless-chat/${codeFiles.find(f => f.id === activeCodeTab)?.label}`} 
            />
          </div>
        </div>
      </div>

      {/* Key Concepts */}
      <div style={{ 
        marginBottom: '32px',
        padding: '20px',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Key Hooks
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <code style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#0ea5e9' }}>
              useChatMessages()
            </code>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Access the message list, streaming content, and current message. Updates in real-time as messages arrive.
            </p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <code style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#0ea5e9' }}>
              useChatActions()
            </code>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Send messages, abort requests, and clear history. Control the chat flow programmatically.
            </p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <code style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#0ea5e9' }}>
              useChatStatus()
            </code>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Get connection status, loading state, and errors. Know when the chat is ready for input.
            </p>
          </div>
        </div>
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
            href="/examples/mcp-apps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#0ea5e9',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Learn about MCP Apps
          </Link>
          <Link 
            href="/examples/mcp-app-example"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'white',
              color: '#0ea5e9',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            See MCP App Example
          </Link>
        </div>
      </div>
    </div>
  );
}
