import React from 'react';

interface TechBadgeProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const TechBadge: React.FC<TechBadgeProps> = ({ children, icon, className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        bg-primary/10 border border-primary/20
        rounded-full font-mono text-xs text-text-secondary
        transition-all duration-200
        hover:bg-primary/15 hover:border-primary/30 hover:text-primary
        ${className}
      `}
    >
      {icon && <span className='size-3.5'>{icon}</span>}
      {children}
    </span>
  );
};

export default TechBadge;
