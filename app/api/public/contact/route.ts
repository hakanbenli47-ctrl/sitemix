import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingStudioTable } from "@/lib/studioServerAuth";

export const runtime = "nodejs";

function clean(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (clean(body?.website, 100)) return NextResponse.json({ success: true });
    const slug = clean(body?.slug, 80);
    const name = clean(body?.name, 100);
    const phone = clean(body?.phone, 40);
    const email = clean(body?.email, 180).toLowerCase();
    const message = clean(body?.message, 2000);
    if (!slug || !name || (!phone && !email) || !message) {
      return NextResponse.json({ message: "Ad, iletişim bilgisi ve mesaj zorunludur." }, { status: 400 });
    }
    const { data: project, error: projectError } = await supabaseAdmin
      .from("studio_projects")
      .select("id")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (projectError || !project) return NextResponse.json({ message: "Yayındaki site bulunamadı." }, { status: 404 });
    const { error } = await supabaseAdmin.from("studio_form_submissions").insert({
      project_id: project.id,
      type: "contact",
      name,
      phone,
      email,
      message,
      status: "new",
      source_url: request.headers.get("referer") || "",
      metadata: { userAgent: (request.headers.get("user-agent") || "").slice(0, 300) },
    });
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Mesajınız iletildi." });
  } catch (error) {
    return NextResponse.json({
      message: isMissingStudioTable(error) ? "Mesaj sistemi hazırlanıyor." : "Mesaj gönderilemedi. Lütfen WhatsApp üzerinden ulaşın.",
    }, { status: 500 });
  }
}

