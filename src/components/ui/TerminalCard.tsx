import type React from "react";

interface TerminalCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  bodyClassName?: string;
  showHeader?: boolean;
}

const TerminalCard: React.FC<TerminalCardProps> = ({
  children,
  title = "terminal",
  className = "",
  bodyClassName = "p-4 font-mono text-sm",
  showHeader = false
}) => {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-code-border bg-code-bg ${className}
      `}
    >
      {showHeader && (
        <div className="flex items-center gap-2 border-code-border border-b bg-surface-elevated/65 px-3 py-2">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-terminal-red" />
            <div className="size-3 rounded-full bg-terminal-yellow" />
            <div className="size-3 rounded-full bg-terminal-green" />
          </div>
          <div className="min-w-0 flex-1 text-center">
            <span className="block truncate font-mono text-text-secondary text-xs">{title}</span>
          </div>
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export default TerminalCard;
