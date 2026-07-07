import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getOpenAiApiKey,
  listApprovedContents,
  insertArticle,
  addHistoryEntry,
} from "@/lib/firestore/queries";
import { requireUid, UnauthorizedError } from "@/lib/firebase/server-auth";
import { computeStyleProfile } from "@/lib/style-analysis/analyze";
import { generateArticle, GenerationError } from "@/lib/ai/generate";
import { computeContentMetrics } from "@/lib/extraction/metrics";

const schema = z.object({
  title: z.string().min(1, "Give the new article a title."),
  brief: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await requireUid(request);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const apiKey = await getOpenAiApiKey(uid);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Add your OpenAI API key in Settings before generating articles." },
      { status: 400 }
    );
  }

  const approved = await listApprovedContents(uid);
  if (approved.length < 3) {
    return NextResponse.json(
      {
        error:
          "Approve at least 3 articles first — generation needs a real style profile to imitate.",
      },
      { status: 400 }
    );
  }

  const profile = computeStyleProfile(approved);

  try {
    const content = await generateArticle({
      apiKey,
      title: parsed.data.title,
      brief: parsed.data.brief,
      profile,
      examples: approved.slice(0, 2),
    });

    const metrics = computeContentMetrics(content);
    const sectionCount = (content.match(/^#{2,6}\s+/gm) ?? []).length;

    const article = await insertArticle(uid, {
      sourceUrl: `generated://style-profile/${encodeURIComponent(parsed.data.title)}`,
      title: parsed.data.title,
      category: null,
      language: "auto",
      status: "draft",
      extractionQuality: 100,
      htmlSizeBytes: 0,
      wordCount: metrics.wordCount,
      charCount: metrics.charCount,
      estimatedTokens: metrics.estimatedTokens,
      sectionCount,
      content,
      excerpt: content.replace(/^#{1,6}\s+.*$/gm, "").trim().slice(0, 220),
    });

    await addHistoryEntry(uid, {
      articleId: article.id,
      articleTitle: article.title,
      action: "generated",
      snapshot: article.content,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong while generating the article." },
      { status: 500 }
    );
  }
}
