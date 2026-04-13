import { SITE_URL } from "@/configs/seo";
import { projects, TITLE } from "@/constants";
import { getBlogPostsForIndex } from "@/lib/blog";
import { getExperience } from "@/lib/experience";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const [posts, experiences] = await Promise.all([getBlogPostsForIndex(), getExperience()]);

  const experienceLines = experiences
    .map(
      (e) =>
        `- ${e.title} at ${e.company}\n  Period: ${e.range}\n  Location: ${e.location}\n  Summary: ${e.summary ?? ""}\n  Stack: ${e.techStack?.join(", ") ?? ""}`
    )
    .join("\n\n");

  const projectLines = projects
    .map(
      (p) =>
        `- ${p.name}\n  Info: ${p.info}\n  Stack: ${p.techs.join(", ")}${p.links.demo ? `\n  Demo: ${p.links.demo}` : ""}${p.links.github ? `\n  GitHub: ${p.links.github}` : ""}`
    )
    .join("\n\n");

  const postLines = posts
    .map(
      (post) =>
        `- Title: ${post.title}\n  URL: ${SITE_URL}/blog/${post.slug}\n  Summary: ${post.summary}`
    )
    .join("\n\n");

  const content = `# ${TITLE} — Full LLM Content Index

> Complete index of all published content on ${SITE_URL}.
> Generated for AI/LLM ingestion. See ${SITE_URL}/llms.txt for the summary index.

## About

- Author: ${TITLE} — Software Engineer based in the Philippines
- Specialises in: React, TypeScript, Next.js, full-stack web development
- Website: ${SITE_URL}
- Twitter / X: https://twitter.com/zomeru_sama
- GitHub: https://github.com/zomeru
- LinkedIn: https://www.linkedin.com/in/zomergregorio/

## Experience (${experiences.length} total)

${experienceLines}

## Projects (${projects.length} total)

${projectLines}

## Blog Posts (${posts.length} total)

${postLines || "No posts published yet."}
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
