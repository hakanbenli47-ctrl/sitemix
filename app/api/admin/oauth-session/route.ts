import { NextResponse } from "next/server";
import { createAdminSessionToken, SITEMIX_ADMIN_COOKIE } from "@/lib/sitemixAdminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return NextResponse.json({ message: "Google oturumu bulunamadı." }, { status: 401 });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const allowedEmail = (process.env.SITEMIX_ADMIN_EMAIL || "hakanbenli47@gmail.com").trim().toLowerCase();
  if (error || !data.user?.email || data.user.email.toLowerCase() !== allowedEmail) {
    return NextResponse.json({ message: "Bu Google hesabının yönetici yetkisi yok." }, { status: 403 });
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
