'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface TerminalHeroProps {
  name: string;
  role: string;
  descriptions: string[];
}

interface CodeLine {
  type: string;
  content: string;
}

const TerminalHero: React.FC<TerminalHeroProps> = ({ name, role, descriptions }) => {
  const [displayedCode, setDisplayedCode] = useState('');
  const [displayedDescription, setDisplayedDescription] = useState('');

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const codeLines: CodeLine[] = useMemo(
    () => [
      { type: 'keyword', content: 'const' },
      { type: 'variable', content: ' developer ' },
      { type: 'operator', content: '=' },
      { type: 'bracket', content: ' {' },
      { type: 'property', content: 'name' },
      { type: 'operator', content: ':' },
      { type: 'string', content: `"${name}"` },
      { type: 'comma', content: ',' },
      { type: 'property', content: ' role' },
      { type: 'operator', content: ':' },
      { type: 'string', content: `"${role}"` },
      { type: 'comma', content: ',' },
      { type: 'property', content: ' passion' },
      { type: 'operator', content: ':' },
      { type: 'string', content: '"building elegant solutions"' },
      { type: 'bracket', content: ' }' }
    ],
    [name, role]
  );

  const fullCode = useMemo(() => codeLines.map((line) => line.content).join(''), [codeLines]);

  const getColor = (type: string): string => {
    const colors: Record<string, string> = {
      keyword: '#8b5cf6',
      variable: '#22c55e',
      operator: '#e2e8f0',
      bracket: '#eab308',
      property: '#22c55e',
      string: '#a855f7',
      comma: '#e2e8f0'
    };
    return colors[type] ?? '#e2e8f0';
  };

  const renderCode = () => {
    let currentIndex = 0;
    return codeLines.map((line, lineIndex) => {
      const lineStart = currentIndex;
      const lineEnd = currentIndex + line.content.length;
      currentIndex = lineEnd;

      const isVisible = displayedCode.length > lineStart;
      const isPartial = displayedCode.length > lineStart && displayedCode.length < lineEnd;

      if (!isVisible && lineIndex > 0) return null;

      const lineContent = isPartial
        ? displayedCode.slice(lineStart, displayedCode.length)
        : isVisible
          ? line.content
          : '';

      const key = `${line.type}-${line.content.slice(0, 3)}-${lineIndex}`;
      return (
        <span key={key} style={{ color: getColor(line.type) }}>
          {lineContent}
        </span>
      );
    });
  };

  const getRandomDelay = useCallback((base: number, variance: number) => {
    return base + Math.random() * variance - variance / 2;
  }, []);

  useEffect(() => {
    let charIndex = 0;
    let isMounted = true;
    let localDescIndex = 0;

    const schedule = (fn: () => void, delay: number) => {
      timeoutRef.current = setTimeout(fn, delay);
    };

    const backspaceDescription = () => {
      if (!isMounted) return;
      if (charIndex > 0) {
        charIndex -= 1;
        setDisplayedDescription((prev) => prev.slice(0, -1));
        schedule(backspaceDescription, getRandomDelay(20, 10));
      } else {
        localDescIndex = (localDescIndex + 1) % descriptions.length;
        charIndex = 0;
        schedule(typeDescription, 500);
      }
    };

    const typeDescription = () => {
      if (!isMounted) return;
      const currentDescription = descriptions[localDescIndex];
      if (charIndex < currentDescription.length) {
        charIndex += 1;
        setDisplayedDescription(currentDescription.slice(0, charIndex));
        schedule(typeDescription, getRandomDelay(50, 30));
      } else {
        schedule(() => {
          if (!isMounted) return;
          charIndex = currentDescription.length;
          backspaceDescription();
        }, 2000);
      }
    };

    const typeCode = () => {
      if (!isMounted) return;
      if (charIndex < fullCode.length) {
        charIndex += 1;
        setDisplayedCode(fullCode.slice(0, charIndex));
        schedule(typeCode, getRandomDelay(30, 20));
      } else {
        charIndex = 0;
        typeDescription();
      }
    };

    typeCode();

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fullCode, descriptions, getRandomDelay]);

  const isCodeComplete = displayedCode.length === fullCode.length;
  const showDescription = isCodeComplete && displayedDescription.length > 0;

  return (
    <div className='w-full max-w-2xl'>
      <div className='bg-code-bg border border-code-border rounded-lg overflow-hidden shadow-2xl'>
        <div className='bg-linear-to-b from-border to-surface-elevated border-b border-code-border px-3 py-2 flex items-center gap-2'>
          <div className='flex gap-1.5'>
            <div className='size-3 rounded-full bg-terminal-red' />
            <div className='size-3 rounded-full bg-terminal-yellow' />
            <div className='size-3 rounded-full bg-terminal-green' />
          </div>
          <div className='flex-1 text-center'>
            <span className='text-xs text-text-muted font-mono'>about.ts</span>
          </div>
        </div>
        <div className='p-6 font-mono text-sm leading-relaxed overflow-x-auto'>
          <pre className='whitespace-pre-wrap'>
            <code>{renderCode()}</code>
            {isCodeComplete && <span className='text-terminal-green'>|</span>}
          </pre>
          {showDescription && (
            <div className='mt-4 text-text-muted text-xs'>
              <span className='text-primary'>➜</span>{' '}
              <span className='text-text-secondary'>{displayedDescription}</span>
              <span className='text-terminal-green animate-blink'>|</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TerminalHero;
