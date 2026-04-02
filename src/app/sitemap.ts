import type { MetadataRoute } from "next";

import { SITE_URL } from "@/configs/seo";
import { getBlogPostsForSitemap } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogPostsForSitemap();

  const blogPostEntries: MetadataRoute.Sitemap = blogPosts.map(
    ({ slug, publishedAt, modifiedAt }) => ({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: new Date(modifiedAt ?? publishedAt),
      changeFrequency: "monthly",
      priority: 0.7
    })
  );

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9
    },
    ...blogPostEntries
  ];
}
