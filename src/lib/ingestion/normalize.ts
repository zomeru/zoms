import type { NormalizedContentDocument, NormalizedContentSection } from "@/lib/content/types";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replaceAll(/```[\s\S]*?```/g, (match) =>
      match
        .replaceAll(/```[a-z0-9_-]*\n?/gi, "")
        .replaceAll("```", "")
        .trim()
    )
    .replaceAll(/^#{1,6}\s+/gm, "")
    .replaceAll(/[*_`>-]/g, " ")
    .replaceAll(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replaceAll(/\s+/g, " ")
    .trim();
}

export function buildPlainText(sections: NormalizedContentSection[]): string {
  return sections
    .map((section) => {
      const plainText = stripMarkdown(section.content);
      return plainText.length > 0 ? `${section.title}\n${plainText}` : section.title;
    })
    .join("\n\n")
    .trim();
}

export function createDocument(
  input: Omit<NormalizedContentDocument, "plainText">
): NormalizedContentDocument {
  return {
    ...input,
    plainText: buildPlainText(input.sections)
  };
}
