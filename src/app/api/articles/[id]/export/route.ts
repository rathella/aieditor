import { NextRequest, NextResponse } from "next/server";
import { getArticleById, addHistoryEntry } from "@/lib/firestore/queries";
import { requireUid, UnauthorizedError } from "@/lib/firebase/server-auth";
import {
  formatArticle,
  EXPORT_MIME,
  EXPORT_EXTENSION,
  slugifyFilename,
} from "@/lib/export/formatters";
import type { ExportFormat } from "@/types/article";

type Params = { params: Promise<{ id: string }> };

const VALID_FORMATS: ExportFormat[] = ["json", "markdown", "txt"];

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const uid = await requireUid(request);
    const { id } = await params;
    const article = await getArticleById(uid, id);
    if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    const formatParam = request.nextUrl.searchParams.get("format") as ExportFormat | null;
    const format: ExportFormat = VALID_FORMATS.includes(formatParam as ExportFormat)
      ? (formatParam as ExportFormat)
      : "json";

    const body = formatArticle(article, format);
    const filename = `${slugifyFilename(article.title)}.${EXPORT_EXTENSION[format]}`;

    await addHistoryEntry(uid, {
      articleId: article.id,
      articleTitle: article.title,
      action: "exported",
      detail: format,
    });

    return new NextResponse(body, {
      headers: {
        "Content-Type": `${EXPORT_MIME[format]}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
