import { ReactNode } from 'react';
import ExampleNav from './ExampleNav';

interface SimpleLayoutProps {
  children: ReactNode;
}

export default function SimpleLayout({ children }: SimpleLayoutProps) {
  return (
    <div className="grid grid-cols-[320px_1fr] h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Left: Navigation */}
      <ExampleNav />

      {/* Main Content - No Debug Panel */}
      <main className="h-full overflow-y-auto bg-slate-50 px-10 py-8">
        {children}
      </main>
    </div>
  );
}
