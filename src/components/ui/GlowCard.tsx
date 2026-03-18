import React from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlowCard: React.FC<GlowCardProps> = ({ children, className = '', hover = true }) => {
  return (
    <div
      className={`
        bg-surface border border-border rounded-lg p-6
        shadow-[0_0_0_1px_var(--color-border),0_4px_24px_rgba(0,0,0,0.4)]
        transition-all duration-300 ease-out
        ${hover ? 'hover:shadow-[0_0_0_1px_var(--color-border-hover),0_8px_32px_rgba(0,0,0,0.5),0_0_20px_var(--color-accent-glow)] hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlowCard;
