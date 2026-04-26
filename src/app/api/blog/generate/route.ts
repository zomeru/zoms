import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { createBlogPost, createSanityWriteClient } from "@/features/blog/sanityWriter";
import { type BlogGenerationTriggerMode, generateBlogContent } from "@/lib/blog-generator";
import { requireBlogGenerationAuth } from "@/lib/blogAuth";
import { scheduleBlogReindex } from "@/lib/blogReindex";
import { verifyBotIdRequest } from "@/lib/botId";
import { handleApiError, validateSchema } from "@/lib/errorHandler";
import log from "@/lib/logger";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { blogGenerateRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel serverless function timeout

async function handleGenerate(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const path = "/api/blog/generate";
  const method = request.method === "GET" ? "GET" : "POST";

  try {
    const botIdResponse = await verifyBotIdRequest(request, {
      allowAuthorizedServiceRequest: true
    });

    if (botIdResponse) {
      return botIdResponse;
    }

    // Rate limiting - strict for blog generation
    const rateLimitResponse = await rateLimitMiddleware(request, "BLOG_GENERATE");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    log.request(method, path);

    await requireBlogGenerationAuth(request);

    let triggerMode: BlogGenerationTriggerMode = method === "GET" ? "scheduled" : "manual";

    if (method === "POST") {
      try {
        const body: unknown = await request.json();
        const validatedBody = validateSchema(blogGenerateRequestSchema, body);
        triggerMode = validatedBody.triggerMode;
      } catch {
        triggerMode = "manual";
      }
    }

    const writeClient = createSanityWriteClient("blog generation");

    log.info("Generating blog content", { triggerMode });

    const content = await log.timeAsync(
      "AI content generation",
      async () => await generateBlogContent(),
      { triggerMode }
    );

    log.info("Creating blog post in Sanity", {
      title: content.title,
      tags: content.tags
    });

    const newPost = await createBlogPost(writeClient, content, triggerMode);
    scheduleBlogReindex(newPost.slug.current);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${newPost.slug.current}`);

    const duration = Date.now() - startTime;
    log.response(method, path, 200, {
      duration: `${duration}ms`,
      postId: newPost._id,
      title: newPost.title,
      triggerMode
    });

    return NextResponse.json({
      success: true,
      post: {
        _id: newPost._id,
        title: newPost.title,
        slug: newPost.slug,
        summary: content.summary,
        publishedAt: newPost.publishedAt,
        tags: newPost.tags,
        generated: newPost.generated,
        readTime: newPost.readTime
      }
    });
  } catch (error) {
    return handleApiError(error, {
      method,
      path,
      metadata: { duration: Date.now() - startTime }
    });
  }
}

// GET handler for Vercel Cron (cron jobs send GET requests)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return await handleGenerate(request);
}

// POST handler for manual API calls (UI button)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return await handleGenerate(request);
}
