import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';

// Google Analytics type declarations
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}
import '@/styles/globals.css';
import '@mdxeditor/editor/style.css';
import {
  BotDojoChatDebugProvider,
  BotDojoChatDebugNav,
} from '@/utils/BotDojoChatDebug';
import { ThemeProvider } from '@/utils/theme';
import ExampleNav from '@/components/layout/ExampleNav';
import TopBar, { getCurrentSection } from '@/components/layout/TopBar';
import BonsaiShopAgent from './examples/bonsai-shop/components/BonsaiShopAgent';
import { BonsaiChatProvider, useBonsaiChatSafe } from '@/contexts/BonsaiChatContext';

// Google Analytics component
function GoogleAnalytics() {
  const router = useRouter();
  const GA_TRACKING_ID = 'G-XRK0MG6448';

  useEffect(() => {
    // Track page views on route change
    const handleRouteChange = (url: string) => {
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'page_view',
          page_path: url,
        });
        // Also update the config
        if (typeof window.gtag === 'function') {
          window.gtag('config', GA_TRACKING_ID, {
            page_path: url,
          });
        }
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </Head>
    </>
  );
}
import { TokenProvider } from '@/contexts/TokenContext';

// Hook to detect mobile viewport
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

// Inner component that can use the debug layout hook
function AppContent({ Component, pageProps, isBonsaiShopPage, isHomePage, currentSection }: { 
  Component: AppProps['Component']; 
  pageProps: AppProps['pageProps'];
  isBonsaiShopPage: boolean;
  isHomePage: boolean;
  currentSection: 'home' | 'learn' | 'examples' | 'showcase' | null;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Track chat open state for bonsai shop
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [router.pathname]);
  
  // Scroll to top when route changes - only on actual pathname changes, not query params
  // The main element is the single scroll container, so we only need to scroll it
  useEffect(() => {
    let lastPathname = router.pathname;
    
    const scrollToTop = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTop = 0;
      }
    };
    
    // Only scroll on actual route changes (pathname changes), not query param changes
    const handleRouteChangeComplete = (url: string) => {
      const newPathname = url.split('?')[0]; // Get pathname without query params
      
      // Only scroll if pathname actually changed
      if (newPathname !== lastPathname) {
        lastPathname = newPathname;
        scrollToTop();
      }
    };
    
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events, router.pathname]);
  
  // Determine if sidebar should be shown (only for Learn and Examples sections, and not on mobile)
  const showSidebar = !isMobile && (currentSection === 'learn' || currentSection === 'examples');
  
  // Show mobile nav button only on examples/learn pages
  const showMobileNavButton = isMobile && (currentSection === 'learn' || currentSection === 'examples');
  
  // Chat panel width for bonsai shop
  const chatPanelWidth = 420;
  
  // Open chat callback for context
  const handleOpenChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Top Bar - always visible, connected to mobile nav */}
      <TopBar 
        onMobileMenuToggle={() => setMobileNavOpen(!mobileNavOpen)}
        isMobileMenuOpen={mobileNavOpen}
      />
      
      {/* Mobile Navigation Overlay - slides from left (available on all pages) */}
      {mobileNavOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1001,
            }}
          />
          {/* Nav Panel - slides from left */}
          <div 
            className="md:hidden"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '300px',
              maxWidth: '85vw',
              background: '#ffffff',
              zIndex: 1002,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header with logo and close button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logo.svg" alt="BotDojo Logo" style={{ height: '24px', width: 'auto' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>BotDojo SDK</span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
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
            
            {/* Section nav links */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { href: '/examples/getting-started', label: 'Learn', section: 'learn' },
                  { href: '/examples/product-enhance', label: 'Examples', section: 'examples' },
                ].map(link => (
                  <a
                    key={link.section}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: currentSection === link.section ? '#6366f1' : '#475569',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      backgroundColor: currentSection === link.section ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            
            {/* Full sidebar nav content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ExampleNav section={(currentSection === 'learn' || currentSection === 'examples') ? currentSection : 'learn'} onNavigate={() => setMobileNavOpen(false)} hideCollapseButton />
            </div>
          </div>
        </>
      )}
      
      {/* Main layout below TopBar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Navigation - only for Learn and Examples sections on desktop (hidden on mobile via CSS) */}
        {(currentSection === 'learn' || currentSection === 'examples') && (
          <div className="hidden md:block">
            <BotDojoChatDebugNav>
              <ExampleNav section={currentSection as 'learn' | 'examples'} />
            </BotDojoChatDebugNav>
          </div>
        )}

        {/* Center: Main Content + Chat Panel (for bonsai shop) */}
        {isBonsaiShopPage ? (
          <BonsaiChatProvider onOpenChat={handleOpenChat} isChatOpen={isChatOpen}>
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              minWidth: 0, 
              height: 'calc(100vh - 56px)',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
            }}>
              {/* Main Content - shrinks when chat is open */}
              <main style={{
                flex: 1,
                minWidth: 0,
                height: '100%',
                overflowY: 'auto',
                background: '#0f172a',
                padding: '0',
                color: '#0f172a',
                transition: 'flex 0.3s ease',
                position: 'relative',
              }}>
                <Component {...pageProps} />
              </main>

              {/* Bonsai Shop Chat Panel */}
              <div style={{
                // On mobile: full screen overlay; on desktop: side panel
                ...(isMobile ? {
                  position: 'fixed' as const,
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 10000,
                  transform: isChatOpen ? 'translateX(0)' : 'translateX(100%)',
                  transition: 'transform 0.3s ease',
                } : {
                  width: isChatOpen ? `${chatPanelWidth}px` : '0',
                  minWidth: isChatOpen ? `${chatPanelWidth}px` : '0',
                  height: '100%',
                  overflow: 'hidden',
                  transition: 'width 0.3s ease, min-width 0.3s ease',
                  position: 'relative' as const,
                }),
                backgroundColor: '#1e293b',
              }}>
                {/* Mobile close button header */}
                {isMobile && isChatOpen && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid #334155',
                    backgroundColor: '#1e293b',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🌳</span>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>Bonsai Assistant</span>
                    </div>
                    <button
                      onClick={() => setIsChatOpen(false)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#334155',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Close chat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
                      </svg>
                    </button>
                  </div>
                )}
                <div style={{ 
                  width: isMobile ? '100%' : `${chatPanelWidth}px`, 
                  height: isMobile ? (isChatOpen ? 'calc(100% - 61px)' : '100%') : '100%',
                  opacity: isChatOpen ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}>
                  <BonsaiShopAgent isOpen={isChatOpen} />
                </div>
              </div>
            </div>
          </BonsaiChatProvider>
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            minWidth: 0, 
            height: 'calc(100vh - 56px)',
            overflow: 'hidden',
            backgroundColor: '#f7f8fb',
          }}>
            <main 
              className={isHomePage ? '' : 'p-4 pb-20 md:p-8 md:pb-8'}
              style={{
                flex: 1,
                minWidth: 0,
                height: '100%',
                overflowY: 'auto',
                background: '#f7f8fb',
                color: '#0f172a',
                transition: 'flex 0.3s ease',
                position: 'relative',
              }}
            >
              <Component {...pageProps} />
            </main>
          </div>
        )}
        
        {/* Floating Chat Toggle Button - bottom right of the content area */}
        {/* On mobile: hide when chat is open (use header close button instead) */}
        {isBonsaiShopPage && !(isMobile && isChatOpen) && (
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{
              position: 'fixed',
              bottom: '24px',
              // On mobile: always right edge; on desktop: shift left when chat open
              right: (!isMobile && isChatOpen) ? `${chatPanelWidth + 24}px` : '24px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#10b981',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              transition: 'right 0.3s ease, transform 0.2s ease',
              zIndex: 9999,
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title={isChatOpen ? 'Close chat' : 'Open chat'}
          >
            {isChatOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor">
                <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  
  // Get current section from route
  const currentSection = getCurrentSection(router.pathname);
  
  // Determine if we're on the home page
  const isHomePage = router.pathname === '/';
  
  // Determine if we're on an examples page (needs layout with nav + debug)
  const isExamplesPage = router.pathname.startsWith('/examples/');
  
  // Determine if we're on a widget page (no layout needed)
  const isCanvasPage = router.pathname.includes('/widgets/');
  
  // Determine if we're on a bonsai shop page (needs the chat agent)
  const isBonsaiShopPage = router.pathname.startsWith('/examples/bonsai-shop');
  
  // Favicon head element - shared across all pages
  const faviconHead = (
    <Head>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" href="/images/favicon.png" />
      <title>BotDojo SDK Playground</title>
    </Head>
  );

  // Canvas pages render without any layout
  if (isCanvasPage) {
    return (
      <ThemeProvider>
        <GoogleAnalytics />
        {faviconHead}
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
  
  // Home and Examples pages get the full layout with nav + debug panel + top bar
  if (isExamplesPage || isHomePage) {
    return (
      <ThemeProvider>
        <TokenProvider>
          <GoogleAnalytics />
        {faviconHead}
        <BotDojoChatDebugProvider enabled={true} defaultExpanded={false}>
            <AppContent 
              Component={Component} 
              pageProps={pageProps} 
              isBonsaiShopPage={isBonsaiShopPage}
              isHomePage={isHomePage}
              currentSection={currentSection}
            />
          </BotDojoChatDebugProvider>
        </TokenProvider>
      </ThemeProvider>
    );
  }
  
  // Other pages render without layout
  return (
    <ThemeProvider>
      <GoogleAnalytics />
      {faviconHead}
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
