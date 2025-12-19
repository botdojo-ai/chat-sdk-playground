import { useEffect, useState } from 'react';
import Link from 'next/link';
import AgentUIAnimation from '@/components/AgentUIAnimation';

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
      style={{
        padding: '8px 16px',
        background: copied 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copied!' : 'Copy'}
    </button>
  );
}

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section - Side by Side Layout */}
      <div 
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Main Grid - Value Prop + Animation */}
          <div 
            className="homepage-hero-grid"
            style={{
              display: 'grid',
              gap: '40px',
              alignItems: 'center',
              marginBottom: '48px',
            }}
          >
            <style>{`
              .homepage-hero-grid {
                grid-template-columns: 400px 1fr;
              }
              @media (max-width: 900px) {
                .homepage-hero-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
            {/* Left Side - Value Proposition */}
            <div
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div 
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2,
                }}
              >
                Interactive Agent SDK
              </div>
              
              <p 
                className="text-2xl md:text-3xl font-semibold mb-6"
                style={{ 
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                }}
              >
                Build AI Agents That See and Act In Your App
              </p>

              <p 
                className="text-lg mb-8"
                style={{ 
                  color: 'var(--text-secondary)', 
                  lineHeight: 1.7,
                  maxWidth: '500px',
                }}
              >
                Give agents visibility into what users see and let them act on their behalf. 
                Built on the open <strong>MCP (Model Context Protocol)</strong> standard for seamless 
                tool integration and <strong>MCP Apps</strong> for rich, interactive UI experiences.
              </p>
              
              {/* Action Buttons */}
              <div 
                className="flex gap-4"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
                }}
              >
                <Link 
                  href="/examples/getting-started"
                  className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                    fontSize: '16px',
                  }}
                >
                  🚀 Get Started
                </Link>
                
                <Link
                  href="/examples/product-enhance"
                  className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '16px',
                  }}
                >
                  View Examples
                </Link>
              </div>
            </div>

            {/* Right Side - Animation */}
            <div
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
              }}
            >
              <AgentUIAnimation maxWidth="1100px" showProgress={false} />
            </div>
          </div>

          {/* Key Features - Below Everything */}
          <div 
            className="homepage-features-grid"
            style={{
              display: 'grid',
              gap: '16px',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
            }}
          >
            <style>{`
              .homepage-features-grid {
                grid-template-columns: repeat(4, 1fr);
              }
              @media (max-width: 900px) {
                .homepage-features-grid {
                  grid-template-columns: repeat(2, 1fr) !important;
                }
              }
            `}</style>
            <FeatureItem icon="🎯" label="Agentic UI" desc="Agent sees & acts in your app" />
            <FeatureItem icon="🌊" label="Real-time Streaming" desc="See responses as they generate" />
            <FeatureItem icon="🎨" label="MCP Apps" desc="Rich UI cards in chat" />
            <FeatureItem icon="🔌" label="Open Standard" desc="Built on MCP protocol" />
          </div>

          {/* Quick Start Section */}
          <div 
            style={{
              marginTop: '48px',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              🚀 Quick Start
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              To run this SDK playground website locally and see all examples in action, run this command:
            </p>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
            >
              <div>
                <span style={{ color: '#10b981', marginRight: '8px' }}>$</span>
                <span style={{ color: 'var(--text-primary)' }}>npm install -g @botdojo/cli && botdojo playground</span>
              </div>
              <QuickStartCopyButton />
            </div>
            <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              This will install the BotDojo CLI and start the playground with all examples configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem(props: { icon: string; label: string; desc: string }) {
  return (
    <div 
      className="p-4 rounded-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="text-2xl mb-2">{props.icon}</div>
      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{props.label}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{props.desc}</div>
    </div>
  );
}
