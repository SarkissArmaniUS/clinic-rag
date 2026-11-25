import { cookies } from "next/headers";
import { verifyKey } from "@/core/access";
import { checkRateLimit } from "@/core/ratelimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  if (!(await checkRateLimit(`access:${ip}`))) {
    return Response.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const key = typeof body?.key === "string" ? body.key.trim() : "";

  if (!verifyKey(key)) {
    return Response.json({ error: "Invalid access code." }, { status: 401 });
  }

  (await cookies()).set("access_key", key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ ok: true });
}