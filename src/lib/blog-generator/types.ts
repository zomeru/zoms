export type BlogGenerationProvider = 'gemini' | 'openrouter';
export type BlogGenerationTriggerMode = 'manual' | 'scheduled';

export interface GeneratedBlogDraft {
  body: string;
  provider: BlogGenerationProvider;
  readTime: number;
  suggestedSlug: string;
  summary: string;
  tags: string[];
  title: string;
}
