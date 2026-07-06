import { NextRequest } from "next/server";
import { getAdminAuth } from "./admin";

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in to do that.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Verifies the Firebase ID token sent as `Authorization: Bearer <token>` and
 * returns the caller's uid. Every API route that touches user data must call
 * this first — it is the single point where tenant isolation is enforced on
 * the server (in addition to Firestore Security Rules).
 */
export async function requireUid(request: NextRequest): Promise<string> {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError();
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new UnauthorizedError("Your session has expired. Please sign in again.");
  }
}
