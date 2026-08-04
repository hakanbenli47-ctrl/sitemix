import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingStudioTable, requireStudioUser } from "@/lib/studioServerAuth";
import { assertCustomerCanManageStudioProject } from "@/lib/studioAccess";
import { syncStudioRepository } from "@/lib/studioProvisioning";
import type { StudioProject } from "@/lib/sitemixStudio";

export const runtime = "nodejs";

function normalizeDomain(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/[^a-z0-9.-]/g, "")
    .slice(0, 253);
}

function vercelUrl(path: string) {
  const teamId = process.env.VERCEL_TEAM_ID;
  return `https://api.vercel.com${path}${teamId ? `?teamId=${encodeURIComponent(teamId)}` : ""}`;
}

async function vercelRequest(path: string, init?: RequestInit) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return null;
  const response = await fetch(vercelUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok && response.status !== 409) {
    throw new Error(result?.error?.message || "Vercel domain işlemi tamamlanamadı.");
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const user = await requireStudioUser(request);
    const body = await request.json().catch(() => null);
    const projectId = typeof body?.projectId === "string" ? body.projectId : "";
    const domain = normalizeDomain(body?.domain);
    const action = body?.action === "remove" ? "remove" : "check";

    if (!projectId || !domain || !domain.includes(".")) {
      return NextResponse.json({ message: "Geçerli bir domain yazmalısın." }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("studio_projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();
    if (projectError || !project) throw projectError || new Error("Proje bulunamadı.");
    assertCustomerCanManageStudioProject(project);

    const { data: deployment } = await supabaseAdmin.from("studio_deployments").select("*").eq("project_id", projectId).maybeSingle();

    const vercelProject = deployment?.vercel_project_id || deployment?.vercel_project_name;

    if (action === "remove") {
      if (vercelProject) {
        await vercelRequest(`/v9/projects/${encodeURIComponent(vercelProject)}/domains/${encodeURIComponent(domain)}`, { method: "DELETE" });
      }
      await supabaseAdmin.from("studio_domains").delete().eq("project_id", projectId).eq("domain", domain);
      if (deployment?.github_repo_full_name) await syncStudioRepository(project as StudioProject, deployment);
      return NextResponse.json({ status: "removed", message: "Domain bağlantısı kaldırıldı." });
    }

    let verified = false;
    let verification: Array<{ type?: string; domain?: string; value?: string; reason?: string }> = [];

    if (vercelProject && process.env.VERCEL_TOKEN) {
      const added = await vercelRequest(`/v10/projects/${encodeURIComponent(vercelProject)}/domains`, {
        method: "POST",
        body: JSON.stringify({ name: domain }),
      });
      verified = Boolean(added?.verified);
      verification = Array.isArray(added?.verification) ? added.verification : [];

      if (!verified) {
        const checked = await vercelRequest(`/v9/projects/${encodeURIComponent(vercelProject)}/domains/${encodeURIComponent(domain)}/verify`, { method: "POST" });
        verified = Boolean(checked?.verified);
        verification = Array.isArray(checked?.verification) ? checked.verification : verification;
      }
    }

    const records = verification.length > 0
      ? verification.map((item) => ({
          type: item.type || "TXT",
          name: item.domain || "@",
          value: item.value || item.reason || "Vercel doğrulama kaydı",
        }))
      : [
          { type: "A", name: "@", value: "76.76.21.21" },
          { type: "CNAME", name: "www", value: "cname.vercel-dns-0.com" },
        ];

    const { error: domainError } = await supabaseAdmin.from("studio_domains").upsert(
      {
        project_id: projectId,
        owner_id: user.id,
        domain,
        status: verified ? "active" : "dns_pending",
        is_primary: true,
        ssl_status: verified ? "provisioning" : "pending",
        verification_records: records,
        last_checked_at: new Date().toISOString(),
      },
      { onConflict: "domain" },
    );
    if (domainError) throw domainError;

    if (deployment?.github_repo_full_name) {
      await syncStudioRepository(project as StudioProject, deployment, domain);
    }

    return NextResponse.json({
      status: verified ? "active" : "dns_pending",
      message: verified
        ? "Domain doğrulandı. SSL sertifikası hazırlanıyor."
        : process.env.VERCEL_TOKEN && vercelProject
          ? "Domain eklendi. Aşağıdaki DNS kayıtlarını domain firmanın paneline ekle."
          : "Domain kaydedildi. Otomatik doğrulama için Vercel bağlantısı admin tarafından tamamlanmalı.",
      records,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: isMissingStudioTable(error)
          ? "Domain kayıt tablosu henüz kurulmamış."
          : error instanceof Error
            ? error.message
            : "Domain kontrol edilemedi.",
      },
      { status: isMissingStudioTable(error) ? 503 : 400 },
    );
  }
}
