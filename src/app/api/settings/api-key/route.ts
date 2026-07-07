import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveOpenAiApiKey, hasOpenAiApiKey } from "@/lib/firestore/queries";
import { requireUid, UnauthorizedError } from "@/lib/firebase/server-auth";

const schema = z.object({ apiKey: z.string().min(10, "That doesn't look like a valid API key.") });

export async function GET(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const hasKey = await hasOpenAiApiKey(uid);
    return NextResponse.json({ hasKey });
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
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid API key." },
        { status: 400 }
      );
    }
    await saveOpenAiApiKey(uid, parsed.data.apiKey);
    return NextResponse.json({ hasKey: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
