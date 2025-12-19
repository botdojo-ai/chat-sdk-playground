import React, { useCallback, useMemo, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface CodeSnippetProps {
  title?: string;
  language?: string;
  code: string;
  fullHeight?: boolean;
  panelHeight?: string;
  forceScrollable?: boolean;
}

export default function CodeSnippet({
  title = 'Code',
  language = 'tsx',
  code,
  fullHeight = false,
  panelHeight,
  forceScrollable = false,
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const lineCount = useMemo(() => code.split('\n').length, [code]);
  const isCommandLike = language === 'bash' || language === 'sh' || language === 'shell';

  const shouldUseScrollablePanel = useMemo(() => {
    if (fullHeight) return false;
    if (forceScrollable) return true;
    if (isCommandLike) return false;
    return lineCount >= 40;
  }, [forceScrollable, fullHeight, isCommandLike, lineCount]);

  const resolvedPanelHeight = panelHeight || 'var(--code-snippet-panel-height)';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }, [code]);

  return (
    <div
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 14px 40px rgba(15,23,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: fullHeight ? '100%' : shouldUseScrollablePanel ? resolvedPanelHeight : 'auto',
        minHeight: shouldUseScrollablePanel ? 'var(--code-snippet-panel-min-height)' : undefined,
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📄</span>{title}
          </span>
          <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>{language}</span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: '6px 10px',
            fontSize: '12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: copied ? '#ecfeff' : '#ffffff',
            color: copied ? '#0ea5e9' : '#0f172a',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div style={{ flex: 1, minHeight: fullHeight || shouldUseScrollablePanel ? '0' : undefined }}>
        <Highlight theme={themes.github} code={code} language={language as any}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={className}
              style={{
                ...style,
                margin: 0,
                padding: '18px',
                fontSize: '13px',
                lineHeight: 1.7,
                fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Consolas, monospace',
                overflow: 'auto',
                height: fullHeight || shouldUseScrollablePanel ? '100%' : 'auto',
                background: '#ffffff',
              }}
            >
              {tokens.map((line, i) => (
                <div key={i} style={{ display: 'table', width: '100%' }} {...getLineProps({ line })}>
                  <span
                    style={{
                      display: 'table-cell',
                      textAlign: 'right',
                      paddingRight: '16px',
                      color: '#94a3b8',
                      userSelect: 'none',
                      width: '1%',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ display: 'table-cell', width: '100%' }}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
