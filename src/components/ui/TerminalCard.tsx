import React from 'react';

interface TerminalCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  bodyClassName?: string;
  showHeader?: boolean;
}

const TerminalCard: React.FC<TerminalCardProps> = ({
  children,
  title = 'terminal',
  className = '',
  bodyClassName = 'p-4 font-mono text-sm',
  showHeader = true
}) => {
  return (
    <div
      className={`
        bg-code-bg border border-code-border rounded-lg overflow-hidden
        ${className}
      `}
    >
      {showHeader && (
        <div className='bg-surface-elevated/65 border-b border-code-border px-3 py-2 flex items-center gap-2'>
          <div className='flex gap-1.5'>
            <div className='size-3 rounded-full bg-terminal-red' />
            <div className='size-3 rounded-full bg-terminal-yellow' />
            <div className='size-3 rounded-full bg-terminal-green' />
          </div>
          <div className='flex-1 text-center'>
            <span className='text-xs text-text-secondary font-mono'>{title}</span>
          </div>
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export default TerminalCard;
