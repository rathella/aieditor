import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings, countArticles } from "@/lib/firestore/queries";
import { requireUid, UnauthorizedError } from "@/lib/firebase/server-auth";

export async function GET(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const [settings, counts] = await Promise.all([getSettings(uid), countArticles(uid)]);
    return NextResponse.json({ settings, counts });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
    }
    const saved = await saveSettings(uid, body);
    return NextResponse.json({ settings: saved });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
