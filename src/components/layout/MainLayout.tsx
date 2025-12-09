import { ReactNode } from 'react';
import {
  BotDojoChatDebugProvider,
  BotDojoChatDebugPanel,
  BotDojoChatDebugNav,
} from '@/utils/BotDojoChatDebug';
import ExampleNav from './ExampleNav';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <BotDojoChatDebugProvider enabled={true} defaultExpanded={false} defaultNavCollapsed={false}>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Left: Collapsible Navigation */}
        <BotDojoChatDebugNav>
          <ExampleNav />
        </BotDojoChatDebugNav>

        {/* Center: Main Content - pushed by both nav and debug panel */}
        <main style={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          overflowY: 'auto',
          background: '#f7f8fb',
          padding: '32px 40px',
          color: '#0f172a',
        }}>
          {children}
        </main>

        {/* Right: Collapsible Debug Panel */}
        <BotDojoChatDebugPanel width="400px" />
      </div>
    </BotDojoChatDebugProvider>
  );
}
