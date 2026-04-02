import type { ContentType } from "@/lib/content/types";

import type { QueryClassification } from "./classify";

export interface RetrievedChunk {
  content: string;
  contentType: ContentType;
  documentId: string;
  id: string;
  publishedAt?: string;
  score: number;
  sectionId: string;
  sectionTitle: string;
  slug?: string;
  tags: string[];
  title: string;
  url: string;
}

export interface RetrievalContext {
  currentBlogSlug?: string;
}

export interface RetrievalResult {
  classification: QueryClassification;
  matches: RetrievedChunk[];
  shouldRefuse: boolean;
}
