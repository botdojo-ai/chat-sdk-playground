import { useEffect, useState, useRef } from 'react';

interface AgentUIAnimationProps {
  /** Max width of the animation container. Defaults to '950px' */
  maxWidth?: string;
  /** Whether to show progress dots and caption. Defaults to true */
  showProgress?: boolean;
}

/**
 * Animated hero graphic showing an AI Agent enhancing product descriptions.
 * Shows a product configuration page with an "Enhance" button that opens
 * an agent panel with writing animation then side-by-side comparison.
 */
export default function AgentUIAnimation({ maxWidth = '950px', showProgress = true }: AgentUIAnimationProps) {
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [writingProgress, setWritingProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const enhancedDesc = "Majestic 15-year-old pine bonsai with aged bark and elegant silhouette.";

  // Auto-start animation when visible
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsAnimating(true);
          }
        });
      },
      { threshold: 0.3 }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Animation loop - 6 steps
  useEffect(() => {
    if (!isAnimating) return;
    const delays = [2000, 1500, 3500, 2500, 2500, 3000];
    const timeout = setTimeout(() => {
      const nextStep = (step + 1) % 6;
      setStep(nextStep);
      if (nextStep === 0) setWritingProgress(0);
    }, delays[step]);
    return () => clearTimeout(timeout);
  }, [isAnimating, step]);

  // Writing animation during step 2
  useEffect(() => {
    if (step !== 2) return;
    
    setWritingProgress(0);
    const totalChars = enhancedDesc.length;
    let currentChar = 0;
    
    const interval = setInterval(() => {
      currentChar++;
      setWritingProgress(currentChar / totalChars);
      if (currentChar >= totalChars) {
        clearInterval(interval);
      }
    }, 45);
    
    return () => clearInterval(interval);
  }, [step]);

  const primaryColor = '#6366f1';
  const successColor = '#10b981';
  const borderColor = '#e2e8f0';

  // Agent panel slides in at step 2
  const agentPanelVisible = step >= 2;
  const showModified = step >= 4;
  const showSideBySide = step >= 3; // Show side by side after writing is done

  const originalDesc = "Pine bonsai with aged bark. 15 years old.";

  // Calculate visible text for writing animation
  const getVisibleText = () => {
    const totalChars = enhancedDesc.length;
    const visibleChars = Math.floor(writingProgress * totalChars);
    return enhancedDesc.slice(0, visibleChars);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: maxWidth,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Title */}
      <div 
        style={{ 
          textAlign: 'center', 
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        Your Website
      </div>

      <svg
        viewBox="0 0 900 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto' }}
      >
        {/* Definitions */}
        <defs>
          <linearGradient id="agentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="magicGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor={primaryColor} />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="12" floodOpacity="0.15" />
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="browserClip">
            <rect x="20" y="20" width="860" height="460" rx="12" />
          </clipPath>
        </defs>

        {/* ==================== BROWSER WINDOW ==================== */}
        <g filter="url(#shadow)">
          <rect x="20" y="20" width="860" height="460" rx="12" fill="white" stroke={borderColor} strokeWidth="1" />
        </g>
        
        {/* Browser Chrome - White background */}
        <rect x="20" y="20" width="860" height="44" rx="12" fill="white" />
        <rect x="20" y="52" width="860" height="12" fill="white" />
        <rect x="20" y="63" width="860" height="1" fill={borderColor} />
        
        {/* Window controls */}
        <circle cx="44" cy="42" r="6" fill="#ef4444" />
        <circle cx="66" cy="42" r="6" fill="#f59e0b" />
        <circle cx="88" cy="42" r="6" fill="#22c55e" />
        
        {/* URL Bar */}
        <rect x="120" y="30" width="400" height="24" rx="6" fill="white" stroke={borderColor} strokeWidth="1" />
        {/* Lock icon - vertically centered in URL bar (center at y=42) */}
        <circle cx="134" cy="42" r="4" fill="none" stroke="#22c55e" strokeWidth="1.5" />
        <rect x="131" y="42" width="6" height="5" rx="1" fill="#22c55e" />
        {/* URL text - vertically aligned with lock icon */}
        <text x="146" y="46" fontSize="11" fill="#64748b">mystore.com/admin/products/edit</text>

        {/* Content area with clip */}
        <g clipPath="url(#browserClip)">
          
          {/* ==================== SIDEBAR ==================== */}
          <rect x="20" y="64" width="180" height="416" fill="#f8fafc" />
          <rect x="199" y="64" width="1" height="416" fill={borderColor} />
          
          {/* Sidebar items */}
          <text x="40" y="95" fontSize="11" fill="#94a3b8" fontWeight="600">STORE ADMIN</text>
          
          <text x="52" y="125" fontSize="12" fill="#64748b">Dashboard</text>
          <text x="52" y="153" fontSize="12" fill="#64748b">Orders</text>
          
          <rect x="32" y="166" width="156" height="32" rx="6" fill={primaryColor} />
          <text x="52" y="187" fontSize="12" fill="white" fontWeight="500">Products</text>
          
          <text x="52" y="219" fontSize="12" fill="#64748b">Customers</text>
          <text x="52" y="247" fontSize="12" fill="#64748b">Analytics</text>
          <text x="52" y="275" fontSize="12" fill="#64748b">Settings</text>

          {/* ==================== MAIN CONTENT: PRODUCT EDIT ==================== */}
          <rect x="200" y="64" width={agentPanelVisible ? "460" : "680"} height="416" fill="white" style={{ transition: 'width 0.4s ease' }} />
          
          {/* Page header */}
          <text x="224" y="100" fontSize="18" fill="#0f172a" fontWeight="700">Edit Product</text>
          <text x="224" y="120" fontSize="11" fill="#64748b">SKU: BONSAI-PINE-002</text>
          
          {/* Product form */}
          <g>
            {/* Product image with bonsai */}
            <rect x="224" y="140" width="120" height="120" rx="8" fill="#f8fafc" stroke={borderColor} strokeWidth="1" />
            {/* Bonsai tree illustration */}
            <g transform="translate(284, 200)">
              {/* Pot */}
              <rect x="-20" y="10" width="40" height="18" rx="2" fill="#92400e" />
              <rect x="-18" y="8" width="36" height="6" rx="1" fill="#a16207" />
              {/* Tree trunk */}
              <path d="M0 10 Q-3 0, -2 -15 Q0 -20, 2 -15 Q3 0, 0 10" fill="#78350f" />
              {/* Foliage clusters */}
              <ellipse cx="-12" cy="-25" rx="12" ry="10" fill="#166534" />
              <ellipse cx="10" cy="-30" rx="14" ry="11" fill="#15803d" />
              <ellipse cx="-5" cy="-38" rx="10" ry="8" fill="#22c55e" />
              <ellipse cx="3" cy="-20" rx="9" ry="7" fill="#166534" />
            </g>
            
            {/* Product name field */}
            <text x="360" y="155" fontSize="11" fill="#64748b" fontWeight="500">Product Name</text>
            <rect x="360" y="162" width="280" height="36" rx="6" fill="white" stroke={borderColor} strokeWidth="1" />
            <text x="372" y="185" fontSize="13" fill="#0f172a">Ancient Pine Bonsai</text>
            
            {/* Price field */}
            <text x="360" y="218" fontSize="11" fill="#64748b" fontWeight="500">Price</text>
            <rect x="360" y="225" width="120" height="36" rx="6" fill="white" stroke={borderColor} strokeWidth="1" />
            <text x="372" y="248" fontSize="13" fill="#0f172a">$449.99</text>
            
            {/* Category */}
            <text x="500" y="218" fontSize="11" fill="#64748b" fontWeight="500">Category</text>
            <rect x="500" y="225" width="140" height="36" rx="6" fill="white" stroke={borderColor} strokeWidth="1" />
            <text x="512" y="248" fontSize="13" fill="#0f172a">Bonsai Tree</text>
          </g>
          
          {/* Description field with Enhance button */}
          <g>
            <text x="224" y="310" fontSize="11" fill="#64748b" fontWeight="500">Description</text>
            
            {/* Enhance button */}
            <g 
              style={{ 
                cursor: 'pointer',
                filter: step === 1 ? 'url(#glow)' : 'none',
              }}
            >
              <rect 
                x="310" 
                y="296" 
                width="125" 
                height="22" 
                rx="11" 
                fill={step === 1 ? "url(#magicGrad)" : "#f1f5f9"}
                stroke={step === 1 ? primaryColor : borderColor}
                strokeWidth="1"
                style={{ transition: 'all 0.3s ease' }}
              />
              {/* Sparkle icon */}
              <text x="322" y="311" fontSize="11" fill={step === 1 ? "white" : primaryColor}>✨</text>
              <text 
                x="338" 
                y="311" 
                fontSize="10" 
                fill={step === 1 ? "white" : primaryColor} 
                fontWeight="600"
              >
                Enhance with AI
              </text>
            </g>
            
            {/* Description textarea */}
            <rect
              x="224"
              y="325"
              width={agentPanelVisible ? "420" : "420"}
              height="120"
              rx="6"
              fill="white"
              stroke={showModified ? successColor : borderColor}
              strokeWidth={showModified ? "2" : "1"}
              style={{ transition: 'all 0.3s ease' }}
            />

            {/* Description text - changes based on state */}
            <text x="236" y="353" fontSize="12" fill="#0f172a">
              {showModified ? enhancedDesc : originalDesc}
            </text>
            
            {/* Toggle indicator when modified */}
            {showModified && (
              <g>
                <rect x="530" y="421" width="105" height="20" rx="10" fill="#f0fdf4" stroke={successColor} strokeWidth="1" />
                <text x="544" y="435" fontSize="9" fill={successColor} fontWeight="600">✓ AI Enhanced</text>
              </g>
            )}
          </g>

          {/* Click animation on Enhance button */}
          {step === 1 && (
            <g>
              <circle cx="372" cy="307" r="12" fill={primaryColor} opacity="0.2">
                <animate attributeName="r" values="12;24;12" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="0.8s" repeatCount="indefinite" />
              </circle>
              {/* Cursor */}
              <path 
                d="M368 303 L372 315 L378 309 L374 305 Z" 
                fill="white" 
                stroke="#0f172a" 
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* ==================== AGENT PANEL ==================== */}
          <g 
            style={{ 
              transform: agentPanelVisible ? 'translateX(0)' : 'translateX(240px)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: agentPanelVisible ? 1 : 0,
            }}
          >
            {/* Panel background */}
            <rect x="660" y="64" width="220" height="416" fill="white" />
            <rect x="659" y="64" width="1" height="416" fill={borderColor} />
            
            {/* Panel header - with proper padding */}
            <rect x="660" y="64" width="220" height="40" fill="url(#agentGrad)" rx="0" />
            <text x="676" y="89" fontSize="13" fill="white" fontWeight="600">Agent</text>
            
            {/* X button with padding */}
            <text x="860" y="89" fontSize="16" fill="rgba(255,255,255,0.9)">×</text>
            
            {/* Chat area */}
            <rect x="660" y="104" width="220" height="332" fill="#fafafa" />
            
            {/* Pre-filled prompt bubble - with proper padding from edges */}
            {step >= 2 && (
              <g>
                <rect 
                  x="676" 
                  y="116" 
                  width="188" 
                  height="28" 
                  rx="14" 
                  fill="#e0e7ff"
                />
                <text x="770" y="135" fontSize="11" fill="#0f172a" textAnchor="middle">Enhance product description</text>
              </g>
            )}

            {/* ===== WRITING MODE (step 2) - Just the new version being created ===== */}
            {step === 2 && (
              <g>
                {/* Widget container - sized to fit content */}
                <rect 
                  x="676" 
                  y="156" 
                  width="188" 
                  height="120" 
                  rx="10" 
                  fill="white" 
                  stroke={primaryColor} 
                  strokeWidth="2"
                />
                
                {/* Widget header */}
                <rect x="676" y="156" width="188" height="26" rx="10" fill="rgba(99, 102, 241, 0.1)" />
                <rect x="676" y="172" width="188" height="10" fill="rgba(99, 102, 241, 0.1)" />
                
                {/* Sparkle and title */}
                <text x="686" y="174" fontSize="9" fill={primaryColor}>✨</text>
                <text x="698" y="174" fontSize="9" fill={primaryColor} fontWeight="600">
                  Writing enhanced description...
                </text>
                
                {/* Writing text - wrapped on multiple lines */}
                {(() => {
                  const visibleText = getVisibleText();
                  const maxCharsPerLine = 26;
                  const lines: string[] = [];
                  let remaining = visibleText;
                  
                  while (remaining.length > 0) {
                    if (remaining.length <= maxCharsPerLine) {
                      lines.push(remaining);
                      break;
                    }
                    let breakPoint = remaining.lastIndexOf(' ', maxCharsPerLine);
                    if (breakPoint === -1) breakPoint = maxCharsPerLine;
                    lines.push(remaining.slice(0, breakPoint));
                    remaining = remaining.slice(breakPoint).trimStart();
                  }
                  
                  return lines.map((line, i) => (
                    <text key={i} x="686" y={198 + i * 16} fontSize="11" fill="#0f172a">
                      {line}
                      {i === lines.length - 1 && <tspan fill={primaryColor} fontWeight="bold">|</tspan>}
                    </text>
                  ));
                })()}
              </g>
            )}

            {/* ===== SIDE BY SIDE MODE (step 3+) - Original vs Modified ===== */}
            {showSideBySide && (
              <g>
                {/* Widget container - sized to fit content exactly */}
                <rect 
                  x="676" 
                  y="156" 
                  width="188" 
                  height="138" 
                  rx="10" 
                  fill="white" 
                  stroke={step >= 4 ? successColor : primaryColor} 
                  strokeWidth="2"
                />
                
                {/* Widget header */}
                <rect x="676" y="156" width="188" height="24" rx="10" fill={step >= 4 ? "rgba(16, 185, 129, 0.1)" : "rgba(99, 102, 241, 0.1)"} />
                <rect x="676" y="170" width="188" height="10" fill={step >= 4 ? "rgba(16, 185, 129, 0.1)" : "rgba(99, 102, 241, 0.1)"} />
                
                <text x="686" y="173" fontSize="9" fill={step >= 4 ? successColor : primaryColor} fontWeight="600">
                  {step >= 4 ? "✓ Applied" : "Choose a variation"}
                </text>
                
                {/* Original box */}
                <rect 
                  x="684" 
                  y="184" 
                  width="84" 
                  height="68" 
                  rx="6" 
                  fill="#f8fafc"
                  stroke={borderColor}
                  strokeWidth="1"
                />
                <text x="692" y="198" fontSize="8" fill="#64748b" fontWeight="600">Original</text>
                <text x="692" y="212" fontSize="7" fill="#475569">Pine bonsai with</text>
                <text x="692" y="222" fontSize="7" fill="#475569">aged bark.</text>
                <text x="692" y="232" fontSize="7" fill="#475569">15 years old.</text>
                
                {/* Modified box - preselected */}
                <rect 
                  x="772" 
                  y="184" 
                  width="84" 
                  height="68" 
                  rx="6" 
                  fill="white"
                  stroke={primaryColor}
                  strokeWidth="2"
                />
                <text x="780" y="198" fontSize="8" fill={primaryColor} fontWeight="600">Modified</text>
                <text x="780" y="212" fontSize="7" fill="#475569">Majestic 15-year-</text>
                <text x="780" y="222" fontSize="7" fill="#475569">old pine bonsai</text>
                <text x="780" y="232" fontSize="7" fill="#475569">with aged bark and</text>
                <text x="780" y="242" fontSize="7" fill="#475569">elegant silhouette.</text>
                
                {/* Selection checkmark on Modified */}
                <circle cx="846" cy="189" r="7" fill={primaryColor} />
                <path d="M843 189 L845 192 L850 186" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Status message */}
                {step >= 4 ? (
                  <g>
                    <rect x="684" y="258" width="172" height="22" rx="6" fill="#f0fdf4" />
                    <text x="770" y="274" fontSize="10" fill={successColor} textAnchor="middle" fontWeight="500">
                      ✓ Description updated
                    </text>
                  </g>
                ) : (
                  <g>
                    <rect x="684" y="258" width="172" height="22" rx="6" fill="rgba(99, 102, 241, 0.1)" />
                    <text x="770" y="274" fontSize="10" fill={primaryColor} textAnchor="middle" fontWeight="500">
                      Modified version selected
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* Input area - with proper padding */}
            <rect x="660" y="436" width="220" height="44" fill="white" />
            <rect x="660" y="435" width="220" height="1" fill={borderColor} />
            <rect x="676" y="446" width="148" height="26" rx="13" fill="#f1f5f9" />
            <text x="690" y="464" fontSize="11" fill="#94a3b8">Ask anything...</text>
            
            {/* Send button - with proper padding from edge */}
            <circle cx="854" cy="459" r="13" fill={primaryColor} />
            <path d="M850 459 L858 459 M855 455 L859 459 L855 463" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>

        </g>
      </svg>

      {/* Step indicator and caption */}
      {showProgress && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: step >= i ? primaryColor : '#e2e8f0',
                  transition: 'background-color 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Caption */}
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
            {step === 0 && 'Product page with basic description'}
            {step === 1 && 'User clicks "Enhance with AI" button'}
            {step === 2 && 'Agent writes enhanced description...'}
            {step === 3 && 'Review Original vs Enhanced comparison'}
            {step === 4 && 'Description updated with AI enhancement'}
            {step === 5 && 'Product ready with improved description'}
          </div>
        </div>
      )}
    </div>
  );
}

