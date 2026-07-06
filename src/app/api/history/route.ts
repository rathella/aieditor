import { NextRequest, NextResponse } from "next/server";
import { listHistory } from "@/lib/firestore/queries";
import { requireUid, UnauthorizedError } from "@/lib/firebase/server-auth";

export async function GET(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const search = request.nextUrl.searchParams.get("q") ?? undefined;
    const entries = await listHistory(uid, { search, limit: 200 });
    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
