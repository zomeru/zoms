/**
 * Zod schemas for API validation
 * Provides type-safe request/response validation across the application
 */

import { z } from 'zod';

// Blog Post Schemas
export const blogPostSlugSchema = z.object({
  _type: z.literal('slug'),
  current: z.string().min(1)
});

export const blogPostListItemSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: blogPostSlugSchema,
  summary: z.string(),
  publishedAt: z.string(),
  modifiedAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  generated: z.boolean().optional(),
  readTime: z.number().optional()
});

export const blogPostBodyBlockSchema = z.object({
  _type: z.string(),
  _key: z.string(),
  style: z.string().optional(),
  children: z
    .array(
      z.object({
        _type: z.string(),
        text: z.string().optional(),
        marks: z.array(z.string()).optional(),
        code: z.string().optional(),
        language: z.string().optional()
      })
    )
    .optional(),
  listItem: z.string().optional(),
  level: z.number().optional(),
  code: z.string().optional(),
  language: z.string().optional()
});

export const blogPostFullSchema = blogPostListItemSchema.extend({
  body: z.array(blogPostBodyBlockSchema)
});

// API Query Schemas
export const blogListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0)
});

export const blogGenerateRequestSchema = z.object({
  aiGenerated: z.boolean().optional().default(true)
});

// API Response Schemas
export const paginationSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
  hasMore: z.boolean()
});

export const blogListResponseSchema = z.object({
  posts: z.array(blogPostListItemSchema),
  pagination: paginationSchema
});

export const blogGenerateResponseSchema = z.object({
  success: z.boolean(),
  post: z.object({
    _id: z.string(),
    title: z.string(),
    slug: z.object({
      _type: z.literal('slug'),
      current: z.string()
    }),
    summary: z.string(),
    publishedAt: z.string(),
    tags: z.array(z.string()).optional(),
    generated: z.boolean().optional(),
    readTime: z.number().optional()
  })
});

// Error Response Schema
export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  timestamp: z.string().optional(),
  details: z.unknown().optional()
});

// Type exports
export type BlogPostListItem = z.infer<typeof blogPostListItemSchema>;
export type BlogPostFull = z.infer<typeof blogPostFullSchema>;
export type BlogListQuery = z.infer<typeof blogListQuerySchema>;
export type BlogGenerateRequest = z.infer<typeof blogGenerateRequestSchema>;
export type BlogListResponse = z.infer<typeof blogListResponseSchema>;
export type BlogGenerateResponse = z.infer<typeof blogGenerateResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
