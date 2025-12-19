import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

// Get environment variables for BotDojo app link
const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID;
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;

// Section configuration - maps sections to their routes
export const SECTION_CONFIG = {
  learn: [
    '/examples/getting-started', 
    '/examples/basic', 
    '/examples/mcp-guide',
    '/examples/embedded-chat',
    '/examples/headless-chat',
    '/examples/frontend-mcp',
    '/examples/mcp-apps',
    '/examples/mcp-apps/inline',
    '/examples/mcp-apps/inline-vs-remote',
    '/examples/security',
    '/examples/about-botdojo',
  ],
  examples: [
    '/examples/mcp-app-example', 
    '/examples/document-edit', 
    '/examples/product-enhance', 
  ],
  showcase: ['/examples/bonsai-shop'],
};

// Get the current section based on pathname
export function getCurrentSection(pathname: string): 'home' | 'learn' | 'examples' | 'showcase' | null {
  if (pathname === '/') return 'home';
  
  for (const [section, routes] of Object.entries(SECTION_CONFIG)) {
    if (routes.some(route => pathname.startsWith(route))) {
      return section as 'learn' | 'examples' | 'showcase';
    }
  }
  return null;
}

interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

function NavLink({ href, label, isActive, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="topbar-nav-link"
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: isActive ? '#6366f1' : '#475569',
        textDecoration: 'none',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
        backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#f1f5f9';
          e.currentTarget.style.color = '#0f172a';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#475569';
        }
      }}
    >
      {label}
    </Link>
  );
}

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

interface TopBarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function TopBar({ onMobileMenuToggle, isMobileMenuOpen }: TopBarProps = {}) {
  const router = useRouter();
  const currentSection = getCurrentSection(router.pathname);
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  
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
    : 'https://www.botdojo.com';
  
  // Use external state if provided, otherwise use local state
  const mobileMenuOpen = isMobileMenuOpen !== undefined ? isMobileMenuOpen : localMenuOpen;
  const handleMenuToggle = onMobileMenuToggle || (() => setLocalMenuOpen(!localMenuOpen));

  const navLinks = [
    { href: '/examples/getting-started', label: 'Learn', section: 'learn' as const },
    { href: '/examples/product-enhance', label: 'Examples', section: 'examples' as const },
    { href: '/examples/bonsai-shop', label: 'Showcase', section: 'showcase' as const },
  ];

  return (
    <>
      {/* Responsive styles */}
      <style>{`
        .topbar-nav-desktop {
          display: flex;
        }
        .topbar-nav-mobile-toggle {
          display: none;
        }
        .topbar-mobile-menu {
          display: none;
        }
        .topbar-title-text {
          display: inline;
        }
        .topbar-beta-badge {
          display: inline-flex;
        }
        
        @media (max-width: 768px) {
          .topbar-nav-desktop {
            display: none !important;
          }
          .topbar-nav-mobile-toggle {
            display: flex !important;
          }
          .topbar-mobile-menu {
            display: flex !important;
          }
          .topbar-title-text {
            display: none !important;
          }
          .topbar-beta-badge {
            display: none !important;
          }
        }
      `}</style>

      <header
        style={{
          height: '56px',
          minHeight: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'relative',
          zIndex: 100,
          gap: '8px',
        }}
      >
        {/* Left: Logo + Title + Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <Link 
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <img 
              src="/logo.svg" 
              alt="BotDojo Logo" 
              style={{ height: '28px', width: 'auto' }}
            />
            <span
              className="topbar-title-text"
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0f172a',
                letterSpacing: '-0.01em',
              }}
            >
              Interactive Agent SDK
            </span>
            <span
              className="topbar-beta-badge"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Beta
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="topbar-nav-desktop"
            style={{
              alignItems: 'center',
              gap: '4px',
              marginLeft: '16px',
            }}
          >
            {navLinks.map(link => (
              <NavLink 
                key={link.section}
                href={link.href} 
                label={link.label} 
                isActive={currentSection === link.section} 
              />
            ))}
          </nav>
        </div>

        {/* Right: About BotDojo + BotDojo App + GitHub Icon + Mobile Menu Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* About BotDojo Link */}
          <Link
            href="/examples/about-botdojo"
            className="topbar-nav-desktop"
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#475569',
              textDecoration: 'none',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#475569';
            }}
          >
            About BotDojo
          </Link>

          {/* Conditional BotDojo App Link */}
          {isPlaygroundDomain ? (
            <a
              href="https://www.botdojo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="topbar-nav-desktop"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '6px',
                backgroundColor: '#6366f1',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366f1';
              }}
            >
              BotDojo
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ) : (
            <a
              href={botdojoAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="topbar-nav-desktop"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '6px',
                backgroundColor: '#6366f1',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366f1';
              }}
            >
              Open in BotDojo
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          {/* GitHub Icon */}
          <a
            href="https://github.com/botdojo-ai/chat-sdk-playground"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              color: '#475569',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#475569';
            }}
            title="View on GitHub"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
              />
            </svg>
          </a>

          {/* Mobile Menu Toggle */}
          <button
            className="topbar-nav-mobile-toggle"
            onClick={handleMenuToggle}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown - only shown when using local state (no external handler) */}
      {!onMobileMenuToggle && mobileMenuOpen && (
        <div
          className="topbar-mobile-menu"
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 16px',
            zIndex: 1000,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {navLinks.map(link => (
            <NavLink 
              key={link.section}
              href={link.href} 
              label={link.label} 
              isActive={currentSection === link.section}
              onClick={() => setLocalMenuOpen(false)}
            />
          ))}
        </div>
      )}
    </>
  );
}
