import { useRouter } from 'next/router';

interface Example {
  id: string;
  title: string;
  route: string;
  category: 'start' | 'examples' | 'learn';
  icon: string;
  description: string;
  external?: boolean;
}

const EXAMPLES: Example[] = [
  // GET STARTED
  {
    id: 'getting-started',
    title: 'Getting Started',
    route: '/examples/chat-sdk/getting-started',
    category: 'start',
    icon: '🚀',
    description: 'Install, clone a test agent, and get your API key',
  },
  
  // EXAMPLES
  {
    id: 'customize-chat-ui',
    title: 'Chat Widget Customization',
    route: '/examples/chat-sdk/basic',
    category: 'start',
    icon: '🎨',
    description: 'Configure display modes, themes, and styling',
  },
  
  // LEARN
  {
    id: 'mcp-guide',
    title: 'Building Agent Experiences',
    route: '/examples/chat-sdk/mcp-guide',
    category: 'learn',
    icon: '📖',
    description: 'Complete guide to MCP Apps and Frontend MCP integration',
  },
  
  // EXAMPLES
  {
    id: 'mcp-app-example',
    title: 'MCP App Example',
    route: '/examples/chat-sdk/mcp-app-example',
    category: 'examples',
    icon: '🧩',
    description: 'Interactive MCP Apps with ui/message, tools/call, ui/open-link',
  },

  {
    id: 'edit-document',
    title: 'Edit Document',
    route: '/examples/chat-sdk/document-edit',
    category: 'examples',
    icon: '📝',
    description: 'Agent that modifies a markdown editor in-place',
  },
  {
    id: 'bonsai-shop',
    title: 'Bonsai Shop',
    route: '/examples/chat-sdk/bonsai-shop',
    category: 'examples',
    icon: '🌳',
    description: 'E-commerce demo with MCP Apps, tools, and checkout',
  },
  {
    id: 'custom-chat-ui',
    title: 'Headless Chat',
    route: '/examples/chat-sdk/headless-mcp',
    category: 'examples',
    icon: '🖥️',
    description: 'Build your own chat interface with MCP Apps',
  },
 
];

export default function ExampleNav() {
  const router = useRouter();

  const sections = [
    { title: 'Get Started', category: 'start' as const },
    { title: 'Learn', category: 'learn' as const },
    { title: 'Examples', category: 'examples' as const },
  ];

  const renderSection = (title: string, category: Example['category']) => {
    const items = EXAMPLES.filter(e => e.category === category);
    if (items.length === 0) return null;

    return (
      <div className="space-y-2" key={title}>
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-1">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map((example) => {
            const isActive = !example.external && router.pathname === example.route;
            
            if (example.external) {
              return (
                <a
                  key={example.id}
                  href={example.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left rounded-lg px-3 py-2 border border-transparent bg-white hover:border-slate-200 hover:bg-white text-slate-800 block transition-colors duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg mt-[2px]">{example.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold flex items-center gap-1">
                        {example.title}
                        <span className="text-slate-400">↗</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {example.description}
                      </p>
                    </div>
                  </div>
                </a>
              );
            }
            
            return (
              <button
                key={example.id}
                onClick={() => router.push(example.route)}
                className={`
                  w-full text-left rounded-lg px-3 py-2 border transition-colors duration-200
                  ${isActive
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-transparent bg-white hover:border-slate-200 hover:bg-white text-slate-800'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="text-lg mt-[2px]">{example.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{example.title}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {example.description}
                    </p>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <nav className="w-full h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-200 bg-white">
        <a 
          href="/" 
          className="flex items-center gap-3 mb-2 cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="BotDojo Logo" 
              className="w-7 h-7 object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              BotDojo
            </h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              Chat SDK <span className="text-indigo-500">beta</span>
            </p>
          </div>
        </a>
        <p className="text-sm text-slate-600 leading-relaxed">
          Build interactive agent experiences for your frontend.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 bg-slate-50">
        {sections.map((section) => renderSection(section.title, section.category))}
      </div>

      <div className="border-t border-slate-200 px-4 py-3 bg-white text-xs text-slate-500 flex items-center justify-between">
        <span>0.0.6 beta</span>
        <a 
          href="https://www.botdojo.com/solutions/agentic-ui" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          About BotDojo →
        </a>
      </div>
    </nav>
  );
}
