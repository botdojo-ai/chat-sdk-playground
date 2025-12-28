import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { SidebarCollapseButton } from '@/utils/BotDojoChatDebug';

// Get environment variables for BotDojo app link
const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID;
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;

export interface NavItem {
  id: string;
  title: string;
  route: string;
  external?: boolean;
}

export interface NavSubsection {
  title: string;
  items: NavItem[];
}

// Learn section with subsections
export const LEARN_SUBSECTIONS: NavSubsection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        id: 'getting-started',
        title: 'Quick Start',
        route: '/examples/getting-started',
      },
    ],
  },
  {
    title: 'Components',
    items: [
      {
        id: 'embedded-chat',
        title: 'Embedded Chat',
        route: '/examples/embedded-chat',
      },
      {
        id: 'customize-chat-ui',
        title: 'Widget Configuration',
        route: '/examples/basic',
      },
      {
        id: 'headless-chat',
        title: 'Headless Chat',
        route: '/examples/headless-chat',
      },
    ],
  },
  {
    title: 'Frontend MCP',
    items: [
      {
        id: 'frontend-mcp',
        title: 'Introduction',
        route: '/examples/frontend-mcp',
      },
      {
        id: 'frontend-mcp-task-list',
        title: 'Task List Example',
        route: '/examples/frontend-mcp/task-list',
      },
    ],
  },
  {
    title: 'MCP Apps',
    items: [
      {
        id: 'mcp-apps-overview',
        title: 'What Are MCP Apps?',
        route: '/examples/mcp-apps',
      },
      {
        id: 'mcp-apps-inline-vs-remote',
        title: 'Inline vs Remote',
        route: '/examples/mcp-apps/inline-vs-remote',
      },
      {
        id: 'mcp-apps-use-mcp-app-guide',
        title: 'useMcpApp Hook',
        route: '/examples/mcp-apps/use-mcp-app-guide',
      },
      {
        id: 'mcp-apps-headless',
        title: 'Headless Mode',
        route: '/examples/mcp-apps/headless',
      },
    ],
  },
];

// Examples section items (flat list)
export const EXAMPLES_NAV_ITEMS: NavItem[] = [
  {
    id: 'product-enhance',
    title: 'Product Enhancement',
    route: '/examples/product-enhance',
  },
  {
    id: 'edit-document',
    title: 'Edit Document',
    route: '/examples/document-edit',
  },
  {
    id: 'mcp-app-example',
    title: 'Tool Progress',
    route: '/examples/mcp-app-example',
  },
];

// Showcase section items
export const SHOWCASE_NAV_ITEMS: NavItem[] = [
  {
    id: 'bonsai-shop',
    title: 'Bonsai Shop',
    route: '/examples/bonsai-shop',
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

interface ExampleNavProps {
  section?: 'learn' | 'examples';
  /** Callback when a nav item is clicked (for mobile nav closing) */
  onNavigate?: () => void;
  /** Hide the sidebar collapse button (for mobile view) */
  hideCollapseButton?: boolean;
}

export default function ExampleNav({ section, onNavigate, hideCollapseButton }: ExampleNavProps) {
  const router = useRouter();
  
  // Initialize all subsections as open
  const [openSubsections, setOpenSubsections] = useState<Record<string, boolean>>(() => ({
    ...LEARN_SUBSECTIONS.reduce((acc, s) => ({ ...acc, [s.title]: true }), {}),
    'Examples': true,
    'Showcase': true,
    'About BotDojo': true,
    'Advanced': true,
  }));

  // Check if we're on the playground.botdojo.com domain
  const [isPlaygroundDomain, setIsPlaygroundDomain] = useState(true);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPlaygroundDomain(window.location.hostname === 'playground.botdojo.com');
    }
  }, []);

  // Build the BotDojo app link URL
  const botdojoAppUrl = ACCOUNT_ID && PROJECT_ID
    ? `https://app.botdojo.com/${ACCOUNT_ID}/projects/${PROJECT_ID}/flows/list`
    : 'https://www.botdojo.com/solutions/agentic-ui';

  const toggleSubsection = (title: string) => {
    setOpenSubsections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = !item.external && router.pathname === item.route;
    
    if (item.external) {
      return (
        <a
          key={item.id}
          href={item.route}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
        >
          <span>{item.title}</span>
          <ExternalIcon />
        </a>
      );
    }
    
    return (
      <button
        key={item.id}
        onClick={() => {
          router.push(item.route);
          onNavigate?.();
        }}
        className={`
          w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-0.5
          ${isActive
            ? 'text-indigo-600 font-medium bg-indigo-50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }
        `}
      >
        {item.title}
      </button>
    );
  };

  return (
    <nav className="w-full h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900 leading-tight">Navigation</h1>
              <p className="text-[11px] text-slate-500 leading-tight">BotDojo SDK</p>
            </div>
          </div>
          {!hideCollapseButton && <SidebarCollapseButton />}
        </div>
      </div>

      {/* Navigation - Always show all sections */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-2">
          {/* Learn subsections */}
          {LEARN_SUBSECTIONS.map((subsection) => {
            const isOpen = openSubsections[subsection.title];
            return (
              <div key={subsection.title} className="mb-2">
                <button
                  onClick={() => toggleSubsection(subsection.title)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
                >
                  <ChevronIcon open={isOpen} />
                  {subsection.title}
                </button>
                
                {isOpen && (
                  <div className="ml-3 pl-2 border-l border-slate-200">
                    {subsection.items.map(renderNavItem)}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Examples section */}
          <div className="mb-2">
            <button
              onClick={() => toggleSubsection('Examples')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
            >
              <ChevronIcon open={openSubsections['Examples']} />
              Examples
            </button>
            
            {openSubsections['Examples'] && (
              <div className="ml-3 pl-2 border-l border-slate-200">
                {EXAMPLES_NAV_ITEMS.map(renderNavItem)}
              </div>
            )}
          </div>

          {/* Showcase section */}
          <div className="mb-2">
            <button
              onClick={() => toggleSubsection('Showcase')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
            >
              <ChevronIcon open={openSubsections['Showcase']} />
              Showcase
            </button>
            
            {openSubsections['Showcase'] && (
              <div className="ml-3 pl-2 border-l border-slate-200">
                {SHOWCASE_NAV_ITEMS.map(renderNavItem)}
              </div>
            )}
          </div>

          {/* About BotDojo section */}
          <div className="mb-2">
            <button
              onClick={() => toggleSubsection('About BotDojo')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
            >
              <ChevronIcon open={openSubsections['About BotDojo']} />
              About BotDojo
            </button>
            
            {openSubsections['About BotDojo'] && (
              <div className="ml-3 pl-2 border-l border-slate-200">
                <button
                  onClick={() => {
                    router.push('/examples/about-botdojo');
                    onNavigate?.();
                  }}
                  className={`
                    w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-0.5
                    ${router.pathname === '/examples/about-botdojo'
                      ? 'text-indigo-600 font-medium bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  Platform Overview
                </button>
              </div>
            )}
          </div>

          {/* Advanced section */}
          <div className="mb-2">
            <button
              onClick={() => toggleSubsection('Advanced')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
            >
              <ChevronIcon open={openSubsections['Advanced']} />
              Advanced
            </button>
            
            {openSubsections['Advanced'] && (
              <div className="ml-3 pl-2 border-l border-slate-200">
                <button
                  onClick={() => {
                    router.push('/examples/security');
                    onNavigate?.();
                  }}
                  className={`
                    w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-0.5
                    ${router.pathname === '/examples/security'
                      ? 'text-indigo-600 font-medium bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  Security & Best Practices
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">v0.0.6</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                router.push('/examples/about-botdojo');
                onNavigate?.();
              }}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              About BotDojo
            </button>
            <a 
              href="https://github.com/botdojo-ai/botdojo-chat-sdk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              GitHub
            </a>
            {isPlaygroundDomain ? (
              <a 
                href="https://www.botdojo.com/solutions/agentic-ui" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                BotDojo
              </a>
            ) : (
              <a 
                href={botdojoAppUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Open in BotDojo
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
