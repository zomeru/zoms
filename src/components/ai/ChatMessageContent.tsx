"use client";

import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import ReactMarkdown, { type Components, defaultUrlTransform, type Options } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface CodeElementProps {
  children?: ReactNode;
  className?: string;
}

const highlightSpanClasses = [
  "hljs-addition",
  "hljs-attr",
  "hljs-attribute",
  "hljs-built_in",
  "hljs-bullet",
  "hljs-char",
  "hljs-code",
  "hljs-comment",
  "hljs-deletion",
  "hljs-doctag",
  "hljs-emphasis",
  "hljs-formula",
  "hljs-keyword",
  "hljs-link",
  "hljs-literal",
  "hljs-meta",
  "hljs-name",
  "hljs-number",
  "hljs-operator",
  "hljs-params",
  "hljs-property",
  "hljs-punctuation",
  "hljs-quote",
  "hljs-regexp",
  "hljs-section",
  "hljs-selector-attr",
  "hljs-selector-class",
  "hljs-selector-id",
  "hljs-selector-pseudo",
  "hljs-selector-tag",
  "hljs-string",
  "hljs-strong",
  "hljs-subst",
  "hljs-symbol",
  "hljs-tag",
  "hljs-template-tag",
  "hljs-template-variable",
  "hljs-title",
  "hljs-type",
  "hljs-variable"
] as const;

const defaultSanitizeAttributes = defaultSchema.attributes ?? {};
const defaultCodeAttributes =
  "code" in defaultSanitizeAttributes && Array.isArray(defaultSanitizeAttributes.code)
    ? defaultSanitizeAttributes.code
    : [];
const defaultSpanAttributes =
  "span" in defaultSanitizeAttributes && Array.isArray(defaultSanitizeAttributes.span)
    ? defaultSanitizeAttributes.span
    : [];
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSanitizeAttributes,
    code: [...defaultCodeAttributes, ["className", "hljs", /^language-[\w-]+$/]],
    span: [...defaultSpanAttributes, ["className", ...highlightSpanClasses]]
  }
};

function extractTextContent(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractTextContent(child)).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    const { children } = node.props;
    return children === undefined ? "" : extractTextContent(children);
  }

  return "";
}

function getCodeElement(children: ReactNode): ReactElement<CodeElementProps> | null {
  for (const child of Children.toArray(children)) {
    if (isValidElement<CodeElementProps>(child)) {
      return child;
    }
  }

  return null;
}

function getCodeLanguage(className?: string): string | null {
  const match = className?.match(/language-([\w-]+)/i);

  return match?.[1]?.toLowerCase() ?? null;
}

function getLanguageLabel(language: string | null): string {
  if (!language) {
    return "Code";
  }

  const languageLabels: Record<string, string> = {
    bash: "Bash",
    css: "CSS",
    html: "HTML",
    javascript: "JavaScript",
    js: "JavaScript",
    json: "JSON",
    jsx: "JSX",
    markdown: "Markdown",
    md: "Markdown",
    python: "Python",
    py: "Python",
    shell: "Shell",
    sh: "Shell",
    sql: "SQL",
    ts: "TypeScript",
    tsx: "TSX",
    txt: "Text",
    typescript: "TypeScript",
    yaml: "YAML",
    yml: "YAML"
  };

  return (
    languageLabels[language] ??
    language.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

export function ChatMessageContent({
  content,
  isStreaming = false
}: {
  content: string;
  isStreaming?: boolean;
}) {
  if (!content.trim()) {
    return null;
  }

  const rehypePlugins: Options["rehypePlugins"] = isStreaming
    ? [[rehypeSanitize, sanitizeSchema]]
    : [
        [rehypeSanitize, sanitizeSchema],
        [rehypeHighlight, { detect: true }]
      ];

  const components: Components = {
    a: ({ node: _node, className, href, ...props }) => (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={[
          "font-medium text-primary underline decoration-primary/40 underline-offset-4 transition hover:text-primary/80",
          className
        ]
          .filter(Boolean)
          .join(" ")}
      />
    ),
    code: ({ node: _node, className, children, ...props }) => {
      const isCodeBlock = Boolean(className && /(language-|hljs)/.test(className));

      if (isCodeBlock) {
        return (
          <code {...props} className={["font-mono", className].filter(Boolean).join(" ")}>
            {children}
          </code>
        );
      }

      return (
        <code
          {...props}
          className="rounded-md bg-background/80 px-1.5 py-0.5 font-mono text-[0.85em] text-text-primary"
        >
          {children}
        </code>
      );
    },
    li: ({ node: _node, className, ...props }) => (
      <li
        {...props}
        className={["pl-1 marker:text-text-muted", className].filter(Boolean).join(" ")}
      />
    ),
    ol: ({ node: _node, className, ...props }) => (
      <ol
        {...props}
        className={["my-3 ml-6 list-decimal space-y-2", className].filter(Boolean).join(" ")}
      />
    ),
    p: ({ node: _node, className, ...props }) => (
      <p {...props} className={["my-3 text-sm leading-6", className].filter(Boolean).join(" ")} />
    ),
    pre: ({ node: _node, className, children, ...props }) => {
      const codeElement = getCodeElement(children);
      const language = getCodeLanguage(codeElement?.props.className);
      const rawCode = extractTextContent(codeElement?.props.children ?? children).replace(
        /\n$/,
        ""
      );

      return (
        <div className="not-prose my-4 overflow-hidden rounded-2xl border border-border bg-background/80">
          <div className="flex items-center justify-between gap-3 border-border border-b bg-surface/80 px-3 py-2">
            <span className="truncate font-mono text-[10px] text-text-muted uppercase tracking-[0.22em]">
              {getLanguageLabel(language)}
            </span>
            {rawCode.length > 0 && isStreaming && (
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.18em]">
                Streaming...
              </span>
            )}
          </div>
          <pre
            {...props}
            className={["overflow-x-auto px-4 py-4 text-[13px] leading-6", className]
              .filter(Boolean)
              .join(" ")}
          >
            {children}
          </pre>
        </div>
      );
    },
    strong: ({ node: _node, className, ...props }) => (
      <strong
        {...props}
        className={["font-semibold text-text-primary", className].filter(Boolean).join(" ")}
      />
    ),
    ul: ({ node: _node, className, ...props }) => (
      <ul
        {...props}
        className={["my-3 ml-6 list-disc space-y-2", className].filter(Boolean).join(" ")}
      />
    )
  };

  return (
    <div className="llm-markdown wrap-anywhere max-w-none text-sm text-text-primary leading-6">
      <ReactMarkdown
        components={components}
        rehypePlugins={rehypePlugins}
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={defaultUrlTransform}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
