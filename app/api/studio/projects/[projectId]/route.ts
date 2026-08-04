import { NextResponse } from "next/server";
import { applyStudioInstruction, describeStudioChanges, upgradeStudioSite, type StudioProject, type StudioSite } from "@/lib/sitemixStudio";
import { assertCustomerCanManageStudioProject } from "@/lib/studioAccess";
import { provisionStudioProject, syncStudioRepository } from "@/lib/studioProvisioning";
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
  const expired = data.status === "draft"
    && !data.management_mode
    && data.created_at
    && new Date(data.created_at).getTime() + 7 * 24 * 60 * 60 * 1000 <= Date.now();
  if (expired) {
    await supabaseAdmin.from("studio_projects").delete().eq("id", projectId).eq("owner_id", ownerId);
    throw new Error("Bu geçici ön izlemenin süresi dolmuş. Yeni bir site oluşturabilirsiniz.");
  }
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
    const upgraded = upgradeStudioSite(project.current_version as StudioSite);
    if (JSON.stringify(upgraded) !== JSON.stringify(project.current_version)) {
      await supabaseAdmin.from("studio_projects").update({ current_version: upgraded }).eq("id", projectId).eq("owner_id", user.id);
      project.current_version = upgraded;
    }
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
      assertCustomerCanManageStudioProject(project);
      const instruction = cleanText(body?.instruction, 800);
      if (!instruction) throw new Error("Düzenleme isteği boş olamaz.");
      nextVersion = applyStudioInstruction(nextVersion, instruction);
      if (!describeStudioChanges(project.current_version as StudioSite, nextVersion).length) {
        throw new Error("Bu isteği uygulayabilmemiz için işletme adı, renk, bölüm veya içerik değişikliğini biraz daha açık yazın.");
      }
      update.current_version = nextVersion;
      update.title = cleanText(nextVersion.businessName, 120);
      update.sector = cleanText(nextVersion.sector, 120);
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
      assertCustomerCanManageStudioProject(project);
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
      assertCustomerCanManageStudioProject(project);
      update.status = "published";
      update.published_at = new Date().toISOString();
      note = "Site yayınlandı";
    } else if (action === "unpublish") {
      assertCustomerCanManageStudioProject(project);
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

    let deployment = null;
    let deploymentMessage = "";
    if (action === "management") {
      try {
        deployment = await provisionStudioProject(data as StudioProject);
      } catch (error) {
        deploymentMessage = error instanceof Error ? error.message : "Bağımsız site hazırlama kaydı oluşturulamadı.";
      }
    } else if (action === "instruction" || action === "save") {
      const { data: existingDeployment } = await supabaseAdmin.from("studio_deployments").select("*").eq("project_id", projectId).maybeSingle();
      if (existingDeployment?.github_repo_full_name) {
        try {
          await syncStudioRepository(data as StudioProject, existingDeployment);
          deployment = { ...existingDeployment, status: "ready" };
        } catch (error) {
          deploymentMessage = error instanceof Error ? error.message : "Bağımsız site deposu güncellenemedi.";
          await supabaseAdmin.from("studio_deployments").update({ status: "error", last_error: deploymentMessage }).eq("project_id", projectId);
        }
      }
    }

    return NextResponse.json({ project: data, deployment, message: deploymentMessage ? `${note}. ${deploymentMessage}` : note });
  } catch (error) {
    return responseError(error);
  }
}
