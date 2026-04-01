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
        bg-code-bg border border-code-border rounded-lg overflow-hidden flex h-full flex-col
        ${className}
      `}
    >
      <div className='bg-surface-elevated/65 border-b border-code-border px-3 py-2 flex items-center justify-between'>
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
        <span className='text-xs font-mono text-text-muted'>{language}</span>
      </div>
      <div className='p-4 font-mono text-sm overflow-x-auto flex-1'>
        {showLineNumbers ? (
          <div className='flex'>
            <div className='mr-4 select-none border-r border-code-border pr-4 text-right text-text-muted'>
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className='flex-1 text-syntax-plain'>{children}</div>
          </div>
        ) : (
          <pre className='h-full whitespace-pre-wrap text-syntax-plain'>{children}</pre>
        )}
      </div>
    </div>
  );
};

export default CodeEditorCard;
