import type { NormalizedContentDocument } from "@/lib/content/types";
import { createDocument } from "@/lib/ingestion/normalize";
import { splitMarkdownIntoSections } from "@/lib/ingestion/sections";
import { getSanityClient } from "@/lib/sanity";

export interface BlogSourceRecord {
  _id: string;
  body: string;
  publishedAt: string;
  slug: {
    current: string;
  };
  summary: string;
  tags?: string[];
  title: string;
}

export function normalizeBlogPostRecord(record: BlogSourceRecord): NormalizedContentDocument {
  const sections = [
    {
      content: record.summary,
      id: "summary",
      title: "Summary"
    },
    ...splitMarkdownIntoSections(record.body)
  ];

  return createDocument({
    contentType: "blog",
    documentId: `blog:${record.slug.current}`,
    publishedAt: record.publishedAt,
    sections,
    slug: record.slug.current,
    sourceMeta: {
      sanityId: record._id
    },
    tags: record.tags ?? [],
    title: record.title,
    url: `/blog/${record.slug.current}`
  });
}

export async function loadBlogDocuments(): Promise<NormalizedContentDocument[]> {
  const posts = await getSanityClient().fetch<BlogSourceRecord[]>(
    `*[_type == "blogPost"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      summary,
      body,
      publishedAt,
      tags
    }`
  );

  return posts.map(normalizeBlogPostRecord);
}
