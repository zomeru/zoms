import React from 'react';

interface CodeEditorCardProps {
  children: React.ReactNode;
  filename?: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
}

const CodeEditorCard: React.FC<CodeEditorCardProps> = ({
  children,
  filename = 'untitled.tsx',
  language = 'typescript',
  className = '',
  showLineNumbers = false
}) => {
  const lines = React.Children.toArray(children);

  return (
    <div
      className={`
        bg-code-bg border border-code-border rounded-lg overflow-hidden
        ${className}
      `}
    >
      <div className='bg-linear-to-b from-border to-surface-elevated border-b border-code-border px-3 py-2 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='flex gap-1.5'>
            <div className='size-3 rounded-full bg-terminal-red' />
            <div className='size-3 rounded-full bg-terminal-yellow' />
            <div className='size-3 rounded-full bg-terminal-green' />
          </div>
          <div className='flex items-center gap-2 ml-2'>
            <span className='text-xs text-text-secondary font-mono'>{filename}</span>
          </div>
        </div>
        <span className='text-xs text-muted font-mono'>{language}</span>
      </div>
      <div className='p-4 font-mono text-sm overflow-x-auto'>
        {showLineNumbers ? (
          <div className='flex'>
            <div className='text-muted text-right pr-4 select-none border-r border-code-border mr-4'>
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className='text-[#e2e8f0] flex-1'>{children}</div>
          </div>
        ) : (
          <pre className='text-[#e2e8f0] whitespace-pre-wrap'>{children}</pre>
        )}
      </div>
    </div>
  );
};

export default CodeEditorCard;
