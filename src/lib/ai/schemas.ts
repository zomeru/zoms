import { z } from 'zod';

const contentTypeSchema = z.enum(['about', 'blog', 'experience', 'project']);

export const citationSchema = z.object({
  contentType: contentTypeSchema,
  id: z.string().min(1),
  sectionTitle: z.string().min(1),
  snippet: z.string().min(1),
  title: z.string().min(1),
  url: z.string().min(1)
});

export const groundedAnswerSchema = z.object({
  answer: z.string().min(1),
  citations: z.array(citationSchema).max(5),
  supported: z.boolean()
});

export const transformResultSchema = z.object({
  bullets: z.array(z.string().min(1)).min(1).max(6),
  mode: z.enum(['advanced', 'beginner', 'tldr']),
  title: z.string().min(1),
  transformedText: z.string().min(1)
});

export type Citation = z.infer<typeof citationSchema>;
export type GroundedAnswer = z.infer<typeof groundedAnswerSchema>;
export type TransformMode = z.infer<typeof transformResultSchema>['mode'];
export type TransformResult = z.infer<typeof transformResultSchema>;
