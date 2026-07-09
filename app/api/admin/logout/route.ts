import { NextResponse } from "next/server";
import { SITEMIX_ADMIN_COOKIE } from "@/lib/sitemixAdminAuth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ success: true, redirectTo: "/on-muhasebe/giris" });

  response.cookies.set({
    name: SITEMIX_ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
