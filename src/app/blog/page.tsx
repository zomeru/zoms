import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";

import { TerminalCard } from "@/components/ui";
import { SITE_URL, staticOgImages } from "@/configs/seo";
import { BLOG_POSTS_PAGE_SIZE } from "@/constants";
import { getBlogPostCount, getBlogPosts } from "@/lib/blog";

import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: "Blog",
  description: staticOgImages.blog.description,
  openGraph: {
    title: "Blog",
    description: staticOgImages.blog.description,
    url: `${SITE_URL}/blog`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/blog/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Blog index Open Graph image"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog",
    description: staticOgImages.blog.description,
    images: [`${SITE_URL}/blog/opengraph-image`]
  },
  alternates: {
    canonical: `${SITE_URL}/blog`
  }
};

const BlogPageContent: React.FC = async (): Promise<React.JSX.Element> => {
  const [posts, total] = await Promise.all([
    getBlogPosts(BLOG_POSTS_PAGE_SIZE, 0),
    getBlogPostCount()
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12">
      <div className="mb-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-mono text-primary text-sm hover:underline"
        >
          <span className="text-terminal-green">cd</span>
          <span className="text-text-secondary">..</span>
          <span className="text-primary">→</span>
          <span>home</span>
        </Link>

        <TerminalCard title="blog.ts" bodyClassName="p-8">
          <h1 className="mb-4 font-semibold text-3xl text-primary md:text-4xl">Blog</h1>
          <p className="font-mono text-sm text-text-secondary">
            <span className="text-secondary">const</span>{" "}
            <span className="text-terminal-green">description</span>{" "}
            <span className="text-syntax-plain">=</span>{" "}
            <span className="text-terminal-purple">
              "Technical articles about web development";
            </span>
          </p>
        </TerminalCard>
      </div>

      {posts.length === 0 ? (
        <TerminalCard bodyClassName="p-8 font-mono text-sm">
          <span className="text-terminal-yellow">console</span>
          <span className="text-text-secondary">.log(</span>
          <span className="text-terminal-purple">"No posts yet. Check back soon!"</span>
          <span className="text-text-secondary">)</span>
        </TerminalCard>
      ) : (
        <BlogListClient initialPosts={posts} initialTotal={total} />
      )}
    </div>
  );
};

export default BlogPageContent;
