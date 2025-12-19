import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  BotDojoChatDebugProvider,
  BotDojoChatDebugPanel,
  BotDojoChatDebugNav,
} from '@/utils/BotDojoChatDebug';
import ExampleNav from './ExampleNav';
import { getCurrentSection } from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
}

// Hook to detect mobile viewport
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Check on mount
    checkMobile();
    
    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const currentSection = getCurrentSection(router.pathname);
  const section = (currentSection === 'learn' || currentSection === 'examples') ? currentSection : 'examples';
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);

  // Close nav on route change
  useEffect(() => {
    setNavOpen(false);
  }, [router.pathname]);
  
  return (
    <BotDojoChatDebugProvider enabled={true} defaultExpanded={false} defaultNavCollapsed={true}>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Floating Menu Button - Bottom Left, Mobile Only (always visible when nav is closed) */}
        {isMobile && !navOpen && (
          <button
            onClick={() => setNavOpen(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000,
            }}
            aria-label="Open navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* Navigation Overlay - Mobile Only */}
        {isMobile && navOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setNavOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 10001,
              }}
            />
            {/* Nav Panel */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '300px',
              maxWidth: '85vw',
              background: '#ffffff',
              zIndex: 10002,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 16px rgba(0, 0, 0, 0.1)',
            }}>
              {/* Close button */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '12px',
                borderBottom: '1px solid #e2e8f0',
              }}>
                <button
                  onClick={() => setNavOpen(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                  aria-label="Close navigation menu"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {/* Nav content */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                <ExampleNav section={section} onNavigate={() => setNavOpen(false)} hideCollapseButton />
              </div>
            </div>
          </>
        )}

        {/* Center: Main Content */}
        <main style={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          overflowY: 'auto',
          background: '#f7f8fb',
          padding: isMobile ? '16px 16px 80px 16px' : '32px 40px',
          color: '#0f172a',
        }}>
          {children}
        </main>

        {/* Desktop Debug Panel - Hidden for cleaner view */}
        {/* {!isMobile && <BotDojoChatDebugPanel width="400px" />} */}
      </div>
    </BotDojoChatDebugProvider>
  );
}
