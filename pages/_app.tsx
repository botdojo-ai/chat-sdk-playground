import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
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

// Inner component that can use the debug layout hook
function AppContent({ Component, pageProps, isBonsaiShopPage, isHomePage, currentSection }: { 
  Component: AppProps['Component']; 
  pageProps: AppProps['pageProps'];
  isBonsaiShopPage: boolean;
  isHomePage: boolean;
  currentSection: 'home' | 'learn' | 'examples' | 'showcase' | null;
}) {
  const router = useRouter();
  
  // Track chat open state for bonsai shop
  const [isChatOpen, setIsChatOpen] = useState(false);
  
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
        // Use requestAnimationFrame to ensure DOM is ready, then scroll after a brief delay
        // to prevent components from scrolling us back down
        requestAnimationFrame(() => {
          scrollToTop();
          // Additional scroll after components have rendered to prevent focus-related scrolling
          setTimeout(() => {
            scrollToTop();
          }, 100);
        });
      }
    };
    
    // Scroll to top on initial mount - do this immediately and repeatedly
    scrollToTop();
    const initialScrolls = [
      setTimeout(() => scrollToTop(), 50),
      setTimeout(() => scrollToTop(), 100),
      setTimeout(() => scrollToTop(), 200),
      setTimeout(() => scrollToTop(), 400),
      setTimeout(() => scrollToTop(), 800),
    ];
    
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      initialScrolls.forEach(clearTimeout);
    };
  }, [router.events, router.pathname]);
  
  // Determine if sidebar should be shown (only for Learn and Examples sections)
  const showSidebar = currentSection === 'learn' || currentSection === 'examples';
  
  // Expose function to open chat panel from other components (e.g., Ask AI buttons)
  useEffect(() => {
    if (isBonsaiShopPage) {
      (window as any).openBonsaiChat = () => {
        setIsChatOpen(true);
      };
      return () => {
        delete (window as any).openBonsaiChat;
      };
    }
  }, [isBonsaiShopPage]);
  
  // Chat panel width for bonsai shop
  const chatPanelWidth = 420;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Top Bar - always visible */}
      <TopBar />
      
      {/* Main layout below TopBar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Navigation - only for Learn and Examples sections */}
        {showSidebar && (
          <BotDojoChatDebugNav>
            <ExampleNav section={currentSection as 'learn' | 'examples'} />
          </BotDojoChatDebugNav>
        )}

        {/* Center: Main Content + Chat Panel (for bonsai shop) */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          minWidth: 0, 
          height: 'calc(100vh - 56px)',
          overflow: 'hidden',
          backgroundColor: isBonsaiShopPage ? '#0f172a' : '#f7f8fb',
        }}>
          {/* Main Content - shrinks when chat is open on bonsai shop pages */}
          <main style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            overflowY: 'auto',
            background: isBonsaiShopPage ? '#0f172a' : '#f7f8fb',
            padding: isBonsaiShopPage ? '0' : isHomePage ? '0' : '32px 40px',
            color: '#0f172a',
            transition: 'flex 0.3s ease',
            position: 'relative',
          }}>
            <Component {...pageProps} />
            
          </main>

          {/* Bonsai Shop Chat Panel - inline within the content area */}
          {isBonsaiShopPage && (
            <div style={{
              width: isChatOpen ? `${chatPanelWidth}px` : '0',
              minWidth: isChatOpen ? `${chatPanelWidth}px` : '0',
              height: '100%',
              overflow: 'hidden',
              transition: 'width 0.3s ease, min-width 0.3s ease',
              position: 'relative',
              backgroundColor: '#1e293b',
            }}>
              {/* Chat content */}
              <div style={{ 
                width: `${chatPanelWidth}px`, 
                height: '100%',
                opacity: isChatOpen ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}>
                <BonsaiShopAgent isOpen={isChatOpen} />
              </div>
            </div>
          )}

        </div>
        
        {/* Floating Chat Toggle Button - bottom right of the blue content area */}
        {isBonsaiShopPage && (
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: isChatOpen ? `${chatPanelWidth + 24}px` : '24px',
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
  
  // Disable Next.js automatic scroll restoration - we handle it manually to prevent unwanted scrolling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Disable browser scroll restoration
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      
      // On initial page load, ensure we start at the top
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTop = 0;
        
        // Aggressively prevent scroll for the first second after page load
        let scrollPreventionActive = true;
        const preventScroll = () => {
          if (scrollPreventionActive && mainElement.scrollTop > 0) {
            mainElement.scrollTop = 0;
          }
        };
        
        const scrollHandler = () => {
          if (scrollPreventionActive) {
            preventScroll();
          }
        };
        
        mainElement.addEventListener('scroll', scrollHandler, { passive: false });
        
        // Force scroll to top multiple times
        const scrollTimeouts = [
          setTimeout(() => { mainElement.scrollTop = 0; }, 50),
          setTimeout(() => { mainElement.scrollTop = 0; }, 100),
          setTimeout(() => { mainElement.scrollTop = 0; }, 200),
          setTimeout(() => { mainElement.scrollTop = 0; }, 400),
          setTimeout(() => { mainElement.scrollTop = 0; }, 800),
        ];
        
        // Disable scroll prevention after components have settled
        setTimeout(() => {
          scrollPreventionActive = false;
          mainElement.removeEventListener('scroll', scrollHandler);
          scrollTimeouts.forEach(clearTimeout);
        }, 1500);
      }
    }
  }, []);
  
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
  
  // Canvas pages render without any layout
  if (isCanvasPage) {
    return (
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
  
  // Home and Examples pages get the full layout with nav + debug panel + top bar
  if (isExamplesPage || isHomePage) {
    return (
      <ThemeProvider>
        <BotDojoChatDebugProvider enabled={true} defaultExpanded={false}>
          <AppContent 
            Component={Component} 
            pageProps={pageProps} 
            isBonsaiShopPage={isBonsaiShopPage}
            isHomePage={isHomePage}
            currentSection={currentSection}
          />
        </BotDojoChatDebugProvider>
      </ThemeProvider>
    );
  }
  
  // Other pages render without layout
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
