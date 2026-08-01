import { NextResponse } from "next/server";
import { requireSitemixAdmin } from "@/lib/sitemixAdminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingStudioTable } from "@/lib/studioServerAuth";

export const runtime = "nodejs";

function cleanText(value: unknown, limit = 500) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

async function tableRows(table: string, select = "*", order = "created_at", limit = 250) {
  const { data, error } = await supabaseAdmin.from(table).select(select).order(order, { ascending: false }).limit(limit);
  if (error && !isMissingStudioTable(error)) throw error;
  return error ? [] : data || [];
}

async function audit(actor: string, action: string, entityType: string, entityId: string, beforeData?: unknown, afterData?: unknown) {
  const { error } = await supabaseAdmin.from("studio_audit_logs").insert({
    actor_label: actor,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_data: beforeData || null,
    after_data: afterData || null,
  });
  if (error && !isMissingStudioTable(error)) throw error;
}

export async function GET() {
  try {
    await requireSitemixAdmin();
    const [projects, leads, subscriptions, payments, domains, forms, audits, sectors, settings, usersResult] = await Promise.all([
      tableRows("studio_projects", "id, owner_id, title, slug, sector, status, management_mode, payment_status, published_at, created_at, updated_at, current_version"),
      tableRows("studio_leads"),
      tableRows("studio_subscriptions"),
      tableRows("studio_payments"),
      tableRows("studio_domains"),
      tableRows("studio_form_submissions"),
      tableRows("studio_audit_logs", "*", "created_at", 100),
      tableRows("studio_sectors", "*", "sort_order", 100),
      tableRows("studio_settings", "*", "updated_at", 100),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 }),
    ]);

    const users = usersResult.data?.users || [];
    const userMap = new Map(users.map((user) => [user.id, { email: user.email || "", name: user.user_metadata?.full_name || user.user_metadata?.name || "" }]));
    const enrichedProjects = projects.map((project) => {
      const projectRow = project as unknown as Record<string, unknown>;
      return { ...projectRow, owner: userMap.get(String(projectRow.owner_id || "")) || null };
    });

    return NextResponse.json({
      projects: enrichedProjects,
      leads,
      subscriptions,
      payments,
      domains,
      forms,
      audits,
      sectors,
      settings,
      users: users.map((user) => ({ id: user.id, email: user.email, name: user.user_metadata?.full_name || user.user_metadata?.name || "", created_at: user.created_at, last_sign_in_at: user.last_sign_in_at })),
      setupRequired: projects.length === 0 && leads.length === 0 && domains.length === 0,
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Admin verileri alınamadı." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSitemixAdmin();
    const body = await request.json().catch(() => null);
    const action = cleanText(body?.action, 50);
    const id = cleanText(body?.id, 80);
    if (!action || !id) return NextResponse.json({ message: "İşlem bilgisi eksik." }, { status: 400 });

    if (["publish", "unpublish", "archive", "payment_status"].includes(action)) {
      const { data: before, error: beforeError } = await supabaseAdmin.from("studio_projects").select("*").eq("id", id).single();
      if (beforeError) throw beforeError;
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (action === "publish") Object.assign(update, { status: "published", published_at: new Date().toISOString() });
      if (action === "unpublish") Object.assign(update, { status: "suspended" });
      if (action === "archive") Object.assign(update, { status: "archived" });
      if (action === "payment_status") Object.assign(update, { payment_status: cleanText(body?.status, 30) });
      const { data: after, error } = await supabaseAdmin.from("studio_projects").update(update).eq("id", id).select("*").single();
      if (error) throw error;
      await audit(session.sub, action, "project", id, before, after);
      return NextResponse.json({ message: "Site durumu güncellendi.", record: after });
    }

    if (action === "save_project") {
      const site = body?.site;
      if (!site || typeof site !== "object") {
        return NextResponse.json({ message: "Site içeriği geçersiz." }, { status: 400 });
      }
      const { data: before, error: beforeError } = await supabaseAdmin.from("studio_projects").select("*").eq("id", id).single();
      if (beforeError) throw beforeError;
      const title = cleanText((site as { businessName?: unknown }).businessName, 120) || before.title;
      const { data: after, error } = await supabaseAdmin.from("studio_projects").update({ current_version: site, title, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
      if (error) throw error;
      const { count } = await supabaseAdmin.from("studio_versions").select("id", { count: "exact", head: true }).eq("project_id", id);
      await supabaseAdmin.from("studio_versions").insert({ project_id: id, owner_id: before.owner_id, version_number: Number(count || 0) + 1, snapshot: site, change_note: "Admin içerik düzenlemesi" });
      await audit(session.sub, action, "project", id, before, after);
      return NextResponse.json({ message: "Site içeriği kaydedildi.", record: after });
    }

    if (action === "lead_status") {
      const status = cleanText(body?.status, 40);
      const notes = cleanText(body?.notes, 2000);
      const { data: before } = await supabaseAdmin.from("studio_leads").select("*").eq("id", id).single();
      const { data: after, error } = await supabaseAdmin.from("studio_leads").update({ status, admin_notes: notes, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
      if (error) throw error;
      await audit(session.sub, action, "lead", id, before, after);
      return NextResponse.json({ message: "Talep güncellendi.", record: after });
    }

    if (action === "subscription") {
      const status = cleanText(body?.status, 30);
      const amount = Number(body?.amount || 0);
      const renewsAt = cleanText(body?.renewsAt, 40) || null;
      const projectId = id;
      const { data: project, error: projectError } = await supabaseAdmin.from("studio_projects").select("owner_id").eq("id", projectId).single();
      if (projectError) throw projectError;
      const { data: subscription, error } = await supabaseAdmin.from("studio_subscriptions").upsert({
        project_id: projectId,
        owner_id: project.owner_id,
        plan: "monthly",
        status,
        amount,
        renews_at: renewsAt,
        starts_at: status === "active" ? new Date().toISOString() : null,
        admin_notes: cleanText(body?.notes, 2000),
      }, { onConflict: "project_id" }).select("*").single();
      if (error) throw error;
      await supabaseAdmin.from("studio_projects").update({ payment_status: status === "active" ? "paid" : status }).eq("id", projectId);
      await audit(session.sub, action, "subscription", subscription.id, null, subscription);
      return NextResponse.json({ message: "Abonelik güncellendi.", record: subscription });
    }

    if (action === "domain_status") {
      const status = cleanText(body?.status, 40);
      const sslStatus = cleanText(body?.sslStatus, 40);
      const { data: after, error } = await supabaseAdmin.from("studio_domains").update({ status, ssl_status: sslStatus, last_checked_at: new Date().toISOString() }).eq("id", id).select("*").single();
      if (error) throw error;
      await audit(session.sub, action, "domain", id, null, after);
      return NextResponse.json({ message: "Domain durumu güncellendi.", record: after });
    }

    if (action === "sector_status") {
      const active = Boolean(body?.active);
      const { data: after, error } = await supabaseAdmin.from("studio_sectors").update({ active, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
      if (error) throw error;
      await audit(session.sub, action, "sector", id, null, after);
      return NextResponse.json({ message: "Sektör durumu güncellendi.", record: after });
    }

    return NextResponse.json({ message: "Bilinmeyen admin işlemi." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "İşlem tamamlanamadı." }, { status: 500 });
  }
}
