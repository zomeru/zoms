import { SITE_URL } from "@/configs/seo";
import { TITLE } from "@/constants";
import { getLatestBlogPosts } from "@/lib/blog";

export async function GET(): Promise<Response> {
  const recentPosts = await getLatestBlogPosts(10);

  const recentPostLines = recentPosts
    .map((post) => `- [${post.title}](${SITE_URL}/blog/${post.slug.current})`)
    .join("\n");

  const content = `# ${TITLE}

> Personal portfolio and technical blog of ${TITLE}, a Software Engineer based in the Philippines specialising in full-stack web development with React, TypeScript, Next.js, and modern web technologies.

## Key Sections

- [Home](${SITE_URL}): Portfolio overview with skills, projects, and professional experience
- [Blog](${SITE_URL}/blog): Long-form technical articles on web development topics

## 10 Recent Blog Posts

${recentPostLines}

## About the Content

The blog is the richest source of information on this site. Articles cover:

- React, TypeScript, and Next.js patterns
- Full-stack web development architecture
- Software engineering best practices
- Web performance and optimisation

All blog posts are original, technical, and written for practicing software engineers.

## Contact

- Website: ${SITE_URL}
- Twitter / X: https://twitter.com/zomeru_sama
- GitHub: https://github.com/zomeru
- LinkedIn: https://www.linkedin.com/in/zomergregorio/
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
