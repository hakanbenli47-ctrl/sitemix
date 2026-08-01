import { NextResponse } from "next/server";
import { generateStudioSite, slugify } from "@/lib/sitemixStudio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingStudioTable, requireStudioUser } from "@/lib/studioServerAuth";

export const runtime = "nodejs";

function cleanText(value: unknown, limit = 500) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function cleanConversation(value: unknown) {
  if (!Array.isArray(value)) return [] as Array<{ role: "user" | "assistant"; content: string }>;
  return value
    .slice(-30)
    .map((item) => ({
      role: item?.role === "assistant" ? "assistant" as const : "user" as const,
      content: cleanText(item?.content, 1200),
    }))
    .filter((item) => item.content.length > 0);
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
    const previewCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from("studio_projects")
      .delete()
      .eq("owner_id", user.id)
      .eq("status", "draft")
      .is("management_mode", null)
      .lt("created_at", previewCutoff);
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
    const conversation = cleanConversation(body?.conversation);

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

    const history = conversation.length ? conversation : [{ role: "user" as const, content: prompt }];
    await supabaseAdmin.from("studio_messages").insert([
      ...history.map((message) => ({ project_id: data.id, owner_id: user.id, role: message.role, content: message.content })),
      { project_id: data.id, owner_id: user.id, role: "assistant", content: `${generated.sector} için ilk ön izlemeyi hazırladım. Her bölümün metnini, sırasını ve görünümünü konuşarak değiştirebilir; gerçek işletme görsellerini içerik alanından yükleyebilirsin.` },
    ]);

    await supabaseAdmin.from("studio_versions").insert({
      project_id: data.id,
      owner_id: user.id,
      version_number: 1,
      snapshot: generated,
      change_note: "İlk geçici ön izleme oluşturuldu",
    });

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
