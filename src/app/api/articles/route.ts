import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { insertArticle, listArticles, addHistoryEntry } from "@/lib/firestore/queries";
import { requireUid, UnauthorizedError } from "@/lib/firebase/server-auth";
import { runExtractionPipeline } from "@/lib/extraction/pipeline";
import { ArticleFetchError } from "@/lib/extraction/fetch-article";
import type { ArticleStatus } from "@/types/article";

const createSchema = z.object({
  sourceUrl: z.string().min(1, "A URL is required."),
});

export async function GET(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const status = request.nextUrl.searchParams.get("status") as ArticleStatus | null;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const articles = await listArticles(uid, {
      status: status ?? undefined,
      limit: limitParam ? Number(limitParam) : undefined,
    });
    return NextResponse.json({ articles });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}

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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  try {
    const data = await runExtractionPipeline(parsed.data.sourceUrl);
    const article = await insertArticle(uid, data);
    await addHistoryEntry(uid, {
      articleId: article.id,
      articleTitle: article.title,
      action: article.status === "failed" ? "failed" : "imported",
      snapshot: article.content,
    });
    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    if (err instanceof ArticleFetchError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong while analyzing that article." },
      { status: 500 }
    );
  }
}
