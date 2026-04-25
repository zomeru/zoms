import type { ReactNode } from "react";

interface TechBadgeProps {
  children: ReactNode;
  icon?: ReactNode;
  dotColor?: string;
  variant?: "icon" | "dot";
  className?: string;
}

export function TechBadge({
  children,
  icon,
  dotColor,
  variant = "icon",
  className = ""
}: TechBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-mono text-[10px] text-text-secondary transition-all duration-200 hover:border-primary/30 hover:bg-primary/15 hover:text-primary ${className}
      `}
    >
      {variant === "dot" && dotColor && (
        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
      )}
      {variant === "icon" && icon && <span className="size-3">{icon}</span>}
      {children}
    </span>
  );
}
