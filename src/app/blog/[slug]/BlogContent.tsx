"use client";

import { useEffect, useRef } from "react";

interface BlogContentProps {
  body: string;
}

function getCodeLanguage(pre: HTMLPreElement): string | null {
  const codeElement = pre.querySelector("code");
  const match = codeElement?.className.match(/language-([\w-]+)/i);

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

const BlogContent = ({ body }: BlogContentProps) => {
  const articleReference = useRef<HTMLElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: body changes replace the article markup, so the enhancement pass must rerun even though it only touches the rendered DOM.
  useEffect(() => {
    const article = articleReference.current;

    if (!article) {
      return;
    }

    const cleanups: Array<() => void> = [];

    for (const pre of article.querySelectorAll("pre")) {
      if (pre.parentElement?.classList.contains("blog-code-block")) {
        continue;
      }

      const parent = pre.parentNode;

      if (!parent) {
        continue;
      }

      const languageLabel = getLanguageLabel(getCodeLanguage(pre));
      const wrapper = document.createElement("div");
      const header = document.createElement("div");
      const label = document.createElement("span");
      const copyButton = document.createElement("button");
      let resetTimeout = 0;

      wrapper.className = "blog-code-block";
      header.className = "blog-code-block__header";
      label.className = "blog-code-block__language";
      label.textContent = languageLabel;

      copyButton.type = "button";
      copyButton.className = "blog-code-block__copy-button";
      copyButton.textContent = "Copy";
      copyButton.setAttribute("aria-label", `Copy ${languageLabel} code`);

      const handleCopy = () => {
        const code = pre.textContent.replace(/\n$/, "");

        if (!code) {
          return;
        }

        void navigator.clipboard
          .writeText(code)
          .then(() => {
            copyButton.textContent = "Copied";
          })
          .catch(() => {
            copyButton.textContent = "Failed";
          })
          .finally(() => {
            window.clearTimeout(resetTimeout);
            resetTimeout = window.setTimeout(() => {
              copyButton.textContent = "Copy";
            }, 1500);
          });
      };

      copyButton.addEventListener("click", handleCopy);
      cleanups.push(() => {
        window.clearTimeout(resetTimeout);
        copyButton.removeEventListener("click", handleCopy);
      });

      parent.insertBefore(wrapper, pre);
      header.append(label, copyButton);
      wrapper.append(header, pre);
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [body]);

  return (
    <article
      ref={articleReference}
      className="markdown-content prose max-w-none"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: processMarkdown sanitizes and serializes trusted blog HTML before this client render.
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
};

export default BlogContent;
