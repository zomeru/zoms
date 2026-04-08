"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import TerminalCard from "./ui/TerminalCard";

interface TerminalHeroProps {
  name: string;
  title: string;
  descriptions: string[];
}

interface CodeLine {
  type: string;
  content: string;
}

const syntaxColors: Record<string, string> = {
  bracket: "var(--color-syntax-bracket)",
  comma: "var(--color-syntax-plain)",
  keyword: "var(--color-syntax-keyword)",
  operator: "var(--color-syntax-plain)",
  property: "var(--color-syntax-property)",
  string: "var(--color-syntax-string)",
  variable: "var(--color-syntax-variable)"
};

const TerminalHero: React.FC<TerminalHeroProps> = ({ name, title, descriptions }) => {
  const [displayedCode, setDisplayedCode] = useState("");
  const [displayedDescription, setDisplayedDescription] = useState("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const codeLines: CodeLine[] = useMemo(
    () => [
      { type: "keyword", content: "const" },
      { type: "variable", content: " developer " },
      { type: "operator", content: "=" },
      { type: "bracket", content: " {" },
      { type: "property", content: " name" },
      { type: "operator", content: ": " },
      { type: "string", content: `"${name}"` },
      { type: "comma", content: "," },
      { type: "property", content: " role" },
      { type: "operator", content: ": " },
      { type: "string", content: `"${title}"` },
      { type: "comma", content: "," },
      { type: "property", content: " passion" },
      { type: "operator", content: ": " },
      { type: "string", content: '"building elegant solutions"' },
      { type: "bracket", content: " };" }
    ],
    [name, title]
  );

  const fullCode = useMemo(() => codeLines.map((line) => line.content).join(""), [codeLines]);

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
          : "";

      const key = `${line.type}-${line.content.slice(0, 3)}-${lineIndex}`;
      return (
        <span key={key} style={{ color: syntaxColors[line.type] ?? "var(--color-syntax-plain)" }}>
          {lineContent}
        </span>
      );
    });
  };

  const getRandomDelay = useCallback((base: number, variance: number) => {
    return base + Math.random() * variance - variance / 2;
  }, []);

  const [isDescriptionActive, setIsDescriptionActive] = useState(false);

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
      setIsDescriptionActive(true);
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
  const showDescription = isCodeComplete && isDescriptionActive;

  return (
    <div className="w-full max-w-2xl" style={{ contain: "layout style" }}>
      <TerminalCard
        title="about.ts"
        className="shadow-2xl"
        bodyClassName="p-6 font-mono text-sm leading-relaxed overflow-x-auto"
      >
        <pre className="whitespace-pre-wrap">
          <code>{renderCode()}</code>
          {!isCodeComplete && <span className="text-terminal-green">|</span>}
        </pre>
        {showDescription && (
          <div className="mt-4 text-text-muted text-xs">
            <span className="text-primary">➜</span>{" "}
            <span className="text-text-secondary">{displayedDescription}</span>
            <span className="animate-blink text-terminal-green">|</span>
          </div>
        )}
      </TerminalCard>
    </div>
  );
};

export default TerminalHero;
