import { NextResponse } from "next/server";
import { applyStudioInstruction, type StudioSite } from "@/lib/sitemixStudio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingStudioTable, requireStudioUser } from "@/lib/studioServerAuth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

function cleanText(value: unknown, limit = 1000) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

async function ownedProject(projectId: string, ownerId: string) {
  const { data, error } = await supabaseAdmin
    .from("studio_projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .single();
  if (error || !data) throw error || new Error("Proje bulunamadı.");
  return data;
}

function responseError(error: unknown) {
  const status = isMissingStudioTable(error) ? 503 : 400;
  return NextResponse.json(
    {
      message: isMissingStudioTable(error)
        ? "SiteMix Studio veritabanı henüz kurulmamış."
        : error instanceof Error
          ? error.message
          : "Proje güncellenemedi.",
      setupRequired: isMissingStudioTable(error),
    },
    { status },
  );
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireStudioUser(request);
    const { projectId } = await context.params;
    const project = await ownedProject(projectId, user.id);
    const { data: messages } = await supabaseAdmin
      .from("studio_messages")
      .select("id, role, content, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    return NextResponse.json({ project, messages: messages || [] });
  } catch (error) {
    return responseError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireStudioUser(request);
    const { projectId } = await context.params;
    const project = await ownedProject(projectId, user.id);
    const body = await request.json().catch(() => null);
    const action = cleanText(body?.action, 40);
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    let nextVersion = project.current_version as StudioSite;
    let note = "Proje güncellendi";

    if (action === "instruction") {
      const instruction = cleanText(body?.instruction, 800);
      if (!instruction) throw new Error("Düzenleme isteği boş olamaz.");
      nextVersion = applyStudioInstruction(nextVersion, instruction);
      update.current_version = nextVersion;
      note = instruction;
      await supabaseAdmin.from("studio_messages").insert([
        { project_id: projectId, owner_id: user.id, role: "user", content: instruction },
        {
          project_id: projectId,
          owner_id: user.id,
          role: "assistant",
          content: "İsteğini tasarıma uyguladım. Ön izleme şimdi güncel.",
        },
      ]);
    } else if (action === "save") {
      nextVersion = body?.site as StudioSite;
      if (!nextVersion?.businessName || !Array.isArray(nextVersion?.sections)) {
        throw new Error("Site içeriği geçersiz.");
      }
      update.current_version = nextVersion;
      update.title = cleanText(nextVersion.businessName, 120);
      note = "İçerik düzenleyiciden kaydedildi";
    } else if (action === "management") {
      const mode = cleanText(body?.mode, 40);
      if (!["monthly", "yearly", "managed"].includes(mode)) {
        throw new Error("Yönetim seçeneği geçersiz.");
      }
      update.management_mode = mode;
      update.payment_status = mode === "monthly" ? "pending" : "not_required";
      update.status = mode === "monthly" ? "ready" : "request_received";
      note = `Yönetim tercihi: ${mode}`;

      if (mode === "monthly") {
        await supabaseAdmin.from("studio_subscriptions").upsert(
          {
            project_id: projectId,
            owner_id: user.id,
            plan: "monthly",
            status: "pending",
            currency: "TRY",
          },
          { onConflict: "project_id" },
        );
      } else {
        await supabaseAdmin.from("studio_leads").insert({
          project_id: projectId,
          owner_id: user.id,
          type: mode === "yearly" ? "yearly_setup" : "managed_service",
          status: "new",
          summary: body?.summary || {},
        });
      }
    } else if (action === "publish") {
      update.status = "published";
      update.published_at = new Date().toISOString();
      note = "Site yayınlandı";
    } else if (action === "unpublish") {
      update.status = "suspended";
      note = "Site yayından kaldırıldı";
    } else {
      throw new Error("Bilinmeyen proje işlemi.");
    }

    const { data, error } = await supabaseAdmin
      .from("studio_projects")
      .update(update)
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .select("*")
      .single();
    if (error) throw error;

    if (action === "instruction" || action === "save") {
      const { count } = await supabaseAdmin
        .from("studio_versions")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId);
      await supabaseAdmin.from("studio_versions").insert({
        project_id: projectId,
        owner_id: user.id,
        version_number: Number(count || 0) + 1,
        snapshot: nextVersion,
        change_note: note,
      });
    }

    return NextResponse.json({ project: data, message: note });
  } catch (error) {
    return responseError(error);
  }
}
