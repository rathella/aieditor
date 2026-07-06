import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  addHistoryEntry,
} from "@/lib/firestore/queries";
import { requireUid, UnauthorizedError } from "@/lib/firebase/server-auth";
import { computeContentMetrics } from "@/lib/extraction/metrics";

const patchSchema = z.object({
  content: z.string().optional(),
  title: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  status: z.enum(["processing", "draft", "approved", "archived", "failed"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const uid = await requireUid(request);
    const { id } = await params;
    const article = await getArticleById(uid, id);
    if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    return NextResponse.json({ article });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  let uid: string;
  try {
    uid = await requireUid(request);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { id } = await params;
  const existing = await getArticleById(uid, id);
  if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const patch = parsed.data;
  const derived: Record<string, unknown> = {};

  if (typeof patch.content === "string") {
    const metrics = computeContentMetrics(patch.content);
    const sectionCount = (patch.content.match(/^#{2,6}\s+/gm) ?? []).length;
    derived.wordCount = metrics.wordCount;
    derived.charCount = metrics.charCount;
    derived.estimatedTokens = metrics.estimatedTokens;
    derived.sectionCount = sectionCount;
  }

  const updated = await updateArticle(uid, id, { ...patch, ...derived });

  if (patch.content !== undefined && patch.content !== existing.content) {
    await addHistoryEntry(uid, {
      articleId: id,
      articleTitle: updated?.title ?? existing.title,
      action: "edited",
      snapshot: existing.content, // snapshot of the PREVIOUS version, for restore
    });
  }

  if (patch.status && patch.status !== existing.status && patch.status === "approved") {
    await addHistoryEntry(uid, {
      articleId: id,
      articleTitle: updated?.title ?? existing.title,
      action: "approved",
    });
  }

  if (patch.status && patch.status !== existing.status && patch.status === "archived") {
    await addHistoryEntry(uid, {
      articleId: id,
      articleTitle: updated?.title ?? existing.title,
      action: "archived",
    });
  }

  return NextResponse.json({ article: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const uid = await requireUid(request);
    const { id } = await params;
    const existing = await getArticleById(uid, id);
    if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    await deleteArticle(uid, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
