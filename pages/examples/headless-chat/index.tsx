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
  headless_chat_WeatherMcpApp_code,
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
  { id: 'widget', label: 'WeatherMcpApp.tsx', code: headless_chat_WeatherMcpApp_code },
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
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl md:text-[32px]">🌤️</span>
          <div>
            <div className="text-[10px] md:text-[11px] text-slate-500 tracking-wider font-bold uppercase">Frontend MCP + Custom UI</div>
            <h1 className="m-0 text-xl md:text-[28px] text-indigo-500 font-extrabold">Headless Chat</h1>
          </div>
        </div>
        <p className="m-0 text-sm md:text-[15px] text-slate-600 leading-relaxed max-w-[700px]">
          Build your own chat interface with full design control. This demo shows a <strong>Frontend MCP</strong> that 
          fetches live weather data from the <a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noopener" className="text-indigo-500">National Weather Service API</a> and 
          displays it in a beautiful MCP App. Use React hooks and providers to access chat state, actions, and streaming events.
        </p>
      </div>

      {/* Architecture Animation */}
      <div className="mb-5 md:mb-8">
        <ArchitectureAnimation />
      </div>

      {/* Features */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 rounded-xl border border-indigo-200/50" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)' }}>
        <h3 className="m-0 mb-3 text-sm md:text-base font-bold text-slate-900">
          What This Demo Shows
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {[
            { icon: '🌤️', label: 'Live Weather API integration' },
            { icon: '🔧', label: 'Frontend MCP with tools' },
            { icon: '🎨', label: 'Beautiful MCP App display' },
            { icon: '📡', label: 'React hooks for state' },
            { icon: '✨', label: 'Full design control' },
            { icon: '⚡', label: 'Real-time streaming' },
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
        <div className="h-[500px] md:h-[750px] rounded-xl overflow-hidden shadow-md">
          <HeadlessDemo />
        </div>
      </div>

      {/* Code with Tabs */}
      <div className="mb-5 md:mb-8">
        <h2 className="m-0 mb-3 md:mb-4 text-lg md:text-xl font-bold text-slate-900">
          Code
        </h2>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 py-2 md:px-4 md:py-3 border-b border-slate-200 bg-slate-50 overflow-x-auto">
            <Tabs
              tabs={codeFiles.map(f => ({ id: f.id, label: f.label }))}
              activeId={activeCodeTab}
              onChange={setActiveCodeTab}
            />
          </div>
          <div className="p-3 md:p-4">
            <CodeSnippet 
              code={activeCode} 
              language="tsx" 
              title={`samples/headless-chat/${codeFiles.find(f => f.id === activeCodeTab)?.label}`} 
            />
          </div>
        </div>
      </div>

      {/* Key Concepts */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h3 className="m-0 mb-3 md:mb-4 text-sm md:text-base font-bold text-slate-900">
          Key Concepts
        </h3>
        
        {/* ModelContext highlight */}
        <div className="p-4 rounded-lg mb-4 text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <code className="block mb-2 text-sm font-bold">
            ModelContext (Frontend MCP)
          </code>
          <p className="m-0 text-xs md:text-[13px] opacity-95 leading-relaxed">
            Define tools that run in your browser. This demo's <code className="bg-white/20 px-1 rounded">get_weather</code> tool 
            fetches data from weather.gov and returns both text results and a beautiful HTML widget via <code className="bg-white/20 px-1 rounded">uiResource</code>.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <code className="block mb-2 text-xs md:text-[13px] font-bold text-indigo-500">
              useChatMessages()
            </code>
            <p className="m-0 text-xs md:text-[13px] text-slate-600 leading-relaxed">
              Access the message list, streaming content, and current message. Updates in real-time as messages arrive.
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <code className="block mb-2 text-xs md:text-[13px] font-bold text-indigo-500">
              useChatActions()
            </code>
            <p className="m-0 text-xs md:text-[13px] text-slate-600 leading-relaxed">
              Send messages, abort requests, and clear history. Control the chat flow programmatically.
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <code className="block mb-2 text-xs md:text-[13px] font-bold text-indigo-500">
              useChatStatus()
            </code>
            <p className="m-0 text-xs md:text-[13px] text-slate-600 leading-relaxed">
              Get connection status, loading state, and errors. Know when the chat is ready for input.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h3 className="m-0 mb-3 text-sm md:text-base font-bold text-slate-900">
          Next Steps
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/examples/mcp-apps"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            Learn about MCP Apps
          </Link>
          <Link 
            href="/examples/mcp-app-example"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-sky-500 border border-sky-500 rounded-lg no-underline font-semibold text-sm min-h-[44px]"
          >
            See MCP App Example
          </Link>
        </div>
      </div>
    </div>
  );
}
