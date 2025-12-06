import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import '@/styles/globals.css';
import '@mdxeditor/editor/style.css';
import {
  BotDojoChatDebugProvider,
  BotDojoChatDebugPanel,
  BotDojoChatDebugNav,
  useBotDojoChatDebugLayout,
} from '@/lib/BotDojoChatDebug';
import { ThemeProvider } from '@/lib/theme';
import ExampleNav from '@/components/layout/ExampleNav';
import BonsaiShopAgent from './examples/chat-sdk/bonsai-shop/components/BonsaiShopAgent';

// Inner component that can use the debug layout hook
function AppContent({ Component, pageProps, isBonsaiShopPage }: { 
  Component: AppProps['Component']; 
  pageProps: AppProps['pageProps'];
  isBonsaiShopPage: boolean;
}) {
  // Get debug panel state to calculate chat popup offset
  const { isExpanded } = useBotDojoChatDebugLayout();
  
  // Track chat open state for bonsai shop
  const [isChatOpen, setIsChatOpen] = useState(false);
  
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
  
  // Calculate chat popup offset based on debug panel state
  const debugPanelWidth = isExpanded ? 400 : 60;
  const chatPanelWidth = 420;
  const chatRightOffset = debugPanelWidth + 20;
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* CSS to offset chat popup from debug panel (for non-bonsai pages) */}
      {!isBonsaiShopPage && (
        <style dangerouslySetInnerHTML={{
          __html: `
            .botdojo-chat-container,
            div[style*="position: fixed"][style*="bottom:"][style*="right:"] {
              right: ${chatRightOffset}px !important;
              transition: right 0.3s ease !important;
            }
          `
        }} />
      )}
      
      {/* Left: Navigation - always visible */}
      <BotDojoChatDebugNav>
        <ExampleNav />
      </BotDojoChatDebugNav>

      {/* Center: Main Content + Chat Panel (for bonsai shop) */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        minWidth: 0, 
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: isBonsaiShopPage ? '#0f172a' : '#f7f8fb',
      }}>
        {/* Main Content - shrinks when chat is open on bonsai shop pages */}
        <main style={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          overflowY: 'auto',
          background: isBonsaiShopPage ? '#0f172a' : '#f7f8fb',
          padding: isBonsaiShopPage ? '0' : '32px 40px',
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
            height: '100vh',
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

      {/* Right: Debug Panel - always available */}
      <BotDojoChatDebugPanel width="400px" />
      
      {/* Floating Chat Toggle Button - bottom right of the blue content area */}
      {isBonsaiShopPage && (
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: isChatOpen ? `${chatPanelWidth + debugPanelWidth + 24}px` : `${debugPanelWidth + 24}px`,
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
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Determine if we're on an examples page (needs layout with nav + debug)
  const isExamplesPage = router.pathname.startsWith('/examples/');
  
  // Determine if we're on a canvas page (no layout needed)
  const isCanvasPage = router.pathname.includes('/canvas/');
  
  // Determine if we're on a bonsai shop page (needs the chat agent)
  const isBonsaiShopPage = router.pathname.startsWith('/examples/chat-sdk/bonsai-shop');
  
  // Canvas pages render without any layout
  if (isCanvasPage) {
    return (
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
  
  // Examples pages get the full layout with nav + debug panel
  if (isExamplesPage) {
    return (
      <ThemeProvider>
        <BotDojoChatDebugProvider enabled={true} defaultExpanded={false}>
          <AppContent 
            Component={Component} 
            pageProps={pageProps} 
            isBonsaiShopPage={isBonsaiShopPage} 
          />
        </BotDojoChatDebugProvider>
      </ThemeProvider>
    );
  }
  
  // Non-examples pages render without layout
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
