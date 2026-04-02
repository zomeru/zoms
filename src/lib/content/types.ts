export type ContentType = "about" | "blog" | "experience" | "project";

export interface NormalizedContentSection {
  content: string;
  id: string;
  title: string;
}

export interface NormalizedContentDocument {
  contentType: ContentType;
  documentId: string;
  plainText: string;
  publishedAt?: string;
  sections: NormalizedContentSection[];
  slug?: string;
  sourceMeta: Record<string, unknown>;
  tags: string[];
  title: string;
  url: string;
}
