import { auth, currentUser } from "@clerk/nextjs/server";

const ALLOWED_EMAILS = (process.env["ADMIN_ALLOWED_EMAILS"] ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export interface AdminIdentity {
  userId: string;
  email: string;
}

export async function requireAdmin(): Promise<
  | { ok: true; identity: AdminIdentity }
  | { ok: false; status: 401 | 403; body: { error: string; email?: string } }
> {
  const { userId } = await auth();
  if (!userId) return { ok: false, status: 401, body: { error: "unauthorized" } };

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (!email) return { ok: false, status: 403, body: { error: "missing_email" } };

  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
    return { ok: false, status: 403, body: { error: "forbidden", email } };
  }

  return { ok: true, identity: { userId, email } };
}
