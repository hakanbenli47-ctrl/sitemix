import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  SITEMIX_ADMIN_COOKIE,
  verifyAdminCredentials,
} from "@/lib/sitemixAdminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!verifyAdminCredentials(body?.username, body?.password)) {
    return NextResponse.json(
      { message: "Admin kullanıcı adı veya şifre hatalı." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true, redirectTo: "/admin/studio" });

  response.cookies.set({
    name: SITEMIX_ADMIN_COOKIE,
    value: createAdminSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
