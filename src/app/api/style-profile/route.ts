import { NextRequest, NextResponse } from "next/server";
import { listApprovedContents } from "@/lib/firestore/queries";
import { requireUid, UnauthorizedError } from "@/lib/firebase/server-auth";
import { computeStyleProfile } from "@/lib/style-analysis/analyze";

export async function GET(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const approved = await listApprovedContents(uid);
    const profile = computeStyleProfile(approved);
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
