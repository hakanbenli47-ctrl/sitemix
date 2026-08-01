import { NextResponse } from "next/server";
import { generateStudioSite, slugify } from "@/lib/sitemixStudio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingStudioTable, requireStudioUser } from "@/lib/studioServerAuth";

export const runtime = "nodejs";

function cleanText(value: unknown, limit = 500) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function errorResponse(error: unknown) {
  if (isMissingStudioTable(error)) {
    return NextResponse.json(
      {
        message: "SiteMix Studio veritabanı henüz kurulmamış.",
        setupRequired: true,
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { message: error instanceof Error ? error.message : "İşlem tamamlanamadı." },
    { status: 401 },
  );
}

export async function GET(request: Request) {
  try {
    const user = await requireStudioUser(request);
    const { data, error } = await supabaseAdmin
      .from("studio_projects")
      .select("id, owner_id, title, slug, sector, prompt, status, management_mode, payment_status, current_version, published_at, created_at, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ projects: data || [] });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireStudioUser(request);
    const body = await request.json().catch(() => null);
    const prompt = cleanText(body?.prompt, 1200);

    if (prompt.length < 3) {
      return NextResponse.json({ message: "İşletmeni biraz daha anlatmalısın." }, { status: 400 });
    }

    const generated = generateStudioSite(prompt);
    const baseSlug = slugify(generated.businessName);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    await supabaseAdmin.from("profiles").upsert(
      {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || "SiteMix kullanıcısı",
      },
      { onConflict: "id" },
    );

    const { data, error } = await supabaseAdmin
      .from("studio_projects")
      .insert({
        owner_id: user.id,
        title: generated.businessName,
        slug,
        sector: generated.sector,
        prompt,
        status: "draft",
        management_mode: null,
        payment_status: "not_required",
        current_version: generated,
      })
      .select("id, owner_id, title, slug, sector, prompt, status, management_mode, payment_status, current_version, published_at, created_at, updated_at")
      .single();

    if (error) throw error;

    await supabaseAdmin.from("studio_messages").insert([
      { project_id: data.id, owner_id: user.id, role: "user", content: prompt },
      {
        project_id: data.id,
        owner_id: user.id,
        role: "assistant",
        content: `${generated.sector} için ilk taslağı hazırladım. Ön izlemeden renkleri, bölümleri ve sayfa yapısını birlikte değiştirebiliriz.`,
      },
    ]);

    await supabaseAdmin.from("studio_versions").insert({
      project_id: data.id,
      owner_id: user.id,
      version_number: 1,
      snapshot: generated,
      change_note: "İlk taslak oluşturuldu",
    });

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

