import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingStudioTable, requireStudioUser } from "@/lib/studioServerAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireStudioUser(request);
    const previewCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("studio_projects").delete().eq("owner_id", user.id).eq("status", "draft").is("management_mode", null).lt("created_at", previewCutoff);
    const { data: projects, error } = await supabaseAdmin.from("studio_projects").select("*").eq("owner_id", user.id).order("updated_at", { ascending: false });
    if (error) throw error;
    const ids = (projects || []).map((item) => item.id);
    const empty = Promise.resolve({ data: [], error: null });
    const [subscriptions, domains, forms] = await Promise.all([
      ids.length ? supabaseAdmin.from("studio_subscriptions").select("*").in("project_id", ids) : empty,
      ids.length ? supabaseAdmin.from("studio_domains").select("*").in("project_id", ids) : empty,
      ids.length ? supabaseAdmin.from("studio_form_submissions").select("*").in("project_id", ids).order("created_at", { ascending: false }).limit(100) : empty,
    ]);
    if (subscriptions.error) throw subscriptions.error;
    if (domains.error) throw domains.error;
    if (forms.error) throw forms.error;
    return NextResponse.json({ projects: projects || [], subscriptions: subscriptions.data || [], domains: domains.data || [], forms: forms.data || [] });
  } catch (error) {
    return NextResponse.json({ message: isMissingStudioTable(error) ? "Studio veritabanı henüz kurulmamış." : error instanceof Error ? error.message : "Hesap bilgileri alınamadı." }, { status: isMissingStudioTable(error) ? 503 : 401 });
  }
}
