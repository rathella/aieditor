import { NextRequest, NextResponse } from "next/server";
import {
  getHistoryEntry,
  getArticleById,
  updateArticle,
  addHistoryEntry,
} from "@/lib/firestore/queries";
import { requireUid, UnauthorizedError } from "@/lib/firebase/server-auth";
import { computeContentMetrics } from "@/lib/extraction/metrics";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const uid = await requireUid(request);
    const { id } = await params;
    const entry = await getHistoryEntry(uid, id);
    if (!entry || entry.snapshot === null) {
      return NextResponse.json(
        { error: "This history entry has no restorable snapshot." },
        { status: 400 }
      );
    }

    const article = await getArticleById(uid, entry.articleId);
    if (!article) {
      return NextResponse.json(
        { error: "The original article no longer exists." },
        { status: 404 }
      );
    }

    const metrics = computeContentMetrics(entry.snapshot);
    const sectionCount = (entry.snapshot.match(/^#{2,6}\s+/gm) ?? []).length;

    const updated = await updateArticle(uid, article.id, {
      content: entry.snapshot,
      wordCount: metrics.wordCount,
      charCount: metrics.charCount,
      estimatedTokens: metrics.estimatedTokens,
      sectionCount,
    });

    await addHistoryEntry(uid, {
      articleId: article.id,
      articleTitle: article.title,
      action: "restored",
      snapshot: article.content,
    });

    return NextResponse.json({ article: updated });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
