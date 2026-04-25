/**
 * /api/admin/<...> — same-origin proxy to the api worker's /admin/* routes.
 *
 * Auth: Cloudflare Access JWT (via verifyAccess). Browser carries CF Access
 * cookie automatically since /api/admin/* is in the same Access app as /review.
 *
 * The proxy injects the worker-internal ADMIN_TOKEN before forwarding to the
 * service-bound `API`. This keeps the bearer token off the browser entirely.
 */

import { verifyAccess, isAllowed } from "@/lib/cf-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const claims = await verifyAccess(req);
  if (!claims) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isAllowed(claims.email)) {
    return Response.json({ error: "forbidden", email: claims.email }, { status: 403 });
  }

  const { path } = await ctx.params;
  const u = new URL(req.url);
  const targetPath = `/admin/${path.join("/")}${u.search}`;

  const mod = await import("@opennextjs/cloudflare");
  const cfctx = (mod as { getCloudflareContext?: () => { env?: Record<string, unknown> } })
    .getCloudflareContext?.();
  const api = cfctx?.env?.["API"] as { fetch?: typeof fetch } | undefined;
  const token = (cfctx?.env?.["ADMIN_TOKEN"] as string | undefined) ?? "";

  if (!api?.fetch || !token) {
    return Response.json({ error: "proxy_misconfigured" }, { status: 500 });
  }

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  if (req.headers.get("content-type")) {
    headers.set("Content-Type", req.headers.get("content-type")!);
  }
  // Trace who acted (server adds it; browser can't fake it once CF Access is in front)
  headers.set("X-Admin-Email", claims.email);

  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer();
  const r = await api.fetch(`https://api${targetPath}`, {
    method: req.method,
    headers,
    body,
  });
  return new Response(r.body, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
export const PUT = handle;
