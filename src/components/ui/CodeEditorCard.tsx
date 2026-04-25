import React from "react";

interface CodeEditorCardProps {
  children: React.ReactNode;
  filename?: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  showHeader?: boolean;
}

export function CodeEditorCard({
  children,
  filename = "untitled.tsx",
  language = "typescript",
  className = "",
  showLineNumbers = false,
  showHeader = false
}: CodeEditorCardProps) {
  const lines = React.Children.toArray(children);

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-code-border bg-code-bg ${className}
      `}
    >
      {showHeader && (
        <div className="flex items-center justify-between border-code-border border-b bg-surface-elevated/65 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-terminal-red" />
              <div className="size-3 rounded-full bg-terminal-yellow" />
              <div className="size-3 rounded-full bg-terminal-green" />
            </div>
            <div className="ml-2 flex items-center gap-2">
              <span className="font-mono text-text-secondary text-xs">{filename}</span>
            </div>
          </div>
          <span className="font-mono text-text-muted text-xs">{language}</span>
        </div>
      )}
      <div className="flex-1 overflow-x-auto p-4 font-mono text-sm">
        {showLineNumbers ? (
          <div className="flex">
            <div className="mr-4 select-none border-code-border border-r pr-4 text-right text-text-muted">
              {lines.map((line, index) => (
                <div
                  key={
                    typeof line === "object" && line !== null && "key" in line && line.key !== null
                      ? line.key
                      : `line-${index + 1}-${typeof line === "string" ? line : "content"}`
                  }
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="flex-1 text-syntax-plain">{children}</div>
          </div>
        ) : (
          <pre className="h-full whitespace-pre-wrap text-syntax-plain">{children}</pre>
        )}
      </div>
    </div>
  );
}
