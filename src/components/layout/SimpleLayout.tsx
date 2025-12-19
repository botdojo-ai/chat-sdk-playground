import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import ExampleNav from './ExampleNav';
import { getCurrentSection } from './TopBar';

interface SimpleLayoutProps {
  children: ReactNode;
}

export default function SimpleLayout({ children }: SimpleLayoutProps) {
  const router = useRouter();
  const currentSection = getCurrentSection(router.pathname);
  const section = (currentSection === 'learn' || currentSection === 'examples') ? currentSection : 'examples';
  
  return (
    <div className="grid grid-cols-[320px_1fr] h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Left: Navigation */}
      <ExampleNav section={section} />

      {/* Main Content - No Debug Panel */}
      <main className="h-full overflow-y-auto bg-slate-50 px-10 py-8">
        {children}
      </main>
    </div>
  );
}
