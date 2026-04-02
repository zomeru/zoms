import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type React from "react";

import BlogDeleteMenu from "@/components/blog/BlogDeleteMenu";
import { TechBadge, TerminalCard } from "@/components/ui";
import { SITE_URL } from "@/configs/seo";
import { TITLE } from "@/constants";
import { getBlogPostBySlug, getBlogPostSeoBySlug } from "@/lib/blog";
import { serializeJsonForScript } from "@/lib/json-script";
import { getSanityClient } from "@/lib/sanity";
import { processMarkdown } from "@/lib/unified";
import { formatDateWithTime } from "@/lib/utils";

import BlogContent from "./BlogContent";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getSanityClient().fetch<Array<{ slug: string }>>(
    `*[_type == "blogPost"]{ "slug": slug.current }`,
    {},
    { next: { revalidate: 3600 } }
  );
  return slugs;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostSeoBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The blog post you are looking for could not be found."
    };
  }

  const publishedTime = new Date(post.publishedAt).toISOString();
  const modifiedTime = post.modifiedAt ? new Date(post.modifiedAt).toISOString() : publishedTime;
  const ogImageUrl = `${SITE_URL}/blog/${slug}/opengraph-image`;

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `${SITE_URL}/blog/${slug}`,
      type: "article",
      publishedTime,
      modifiedTime,
      authors: [TITLE],
      tags: post.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${post.title} Open Graph image`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [ogImageUrl]
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`
    },
    keywords: post.tags
  };
}

const BlogPostPage = async ({ params }: BlogPostPageProps): Promise<React.JSX.Element> => {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const publishedDate = formatDateWithTime(post.publishedAt);

  const content = await processMarkdown(post.body);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: post.modifiedAt
      ? new Date(post.modifiedAt).toISOString()
      : new Date(post.publishedAt).toISOString(),
    author: {
      "@type": "Person",
      name: TITLE,
      url: SITE_URL
    },
    url: `${SITE_URL}/blog/${post.slug.current}`,
    keywords: post.tags?.join(", ")
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonForScript escapes the JSON-LD payload for a safe inline script.
        dangerouslySetInnerHTML={{ __html: serializeJsonForScript(jsonLd) }}
      />
      <main className="relative z-10 min-h-screen">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 md:px-12">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 font-mono text-primary text-sm hover:underline"
          >
            <span className="text-terminal-green">cd</span>
            <span className="text-text-secondary">..</span>
            <span className="text-terminal-blue">→</span>
            <span>blog</span>
          </Link>

          <TerminalCard title={`${slug}.md`} bodyClassName="p-8">
            <header className="mb-8">
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <h1 className="font-semibold text-3xl text-primary md:text-4xl">{post.title}</h1>
                <BlogDeleteMenu
                  slug={slug}
                  title={post.title}
                  redirectTo="/blog"
                  refreshOnDelete={false}
                />
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-3 font-mono text-sm text-text-muted">
                <span>
                  <span className="text-secondary">const</span>{" "}
                  <span className="text-terminal-green">published</span>{" "}
                  <span className="text-syntax-plain">=</span>{" "}
                  <span className="text-terminal-purple">"{publishedDate}";</span>
                </span>
                {post.readTime && (
                  <span>
                    <span className="text-secondary">const</span>{" "}
                    <span className="text-terminal-green">readTime</span>{" "}
                    <span className="text-syntax-plain">=</span>{" "}
                    <span className="text-terminal-purple">{post.readTime} min;</span>
                  </span>
                )}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <TechBadge key={tag}>{tag}</TechBadge>
                  ))}
                </div>
              )}

              <div className="text-lg text-text-secondary leading-relaxed">{post.summary}</div>
            </header>

            <BlogContent body={content} />
          </TerminalCard>

          <footer className="mt-8 border-border border-t pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-mono text-primary text-sm hover:underline"
            >
              <span className="text-terminal-green">cd</span>
              <span className="text-text-secondary">..</span>
              <span className="text-terminal-blue">→</span>
              <span>back to blog</span>
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
};

export default BlogPostPage;
