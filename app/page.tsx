import SitemixLanding from "@/app/_components/SitemixLanding";
import PublishedSite from "@/app/_components/PublishedSite";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { StudioSite } from "@/lib/sitemixStudio";

export default async function HomePage() {
  const headerStore = await headers();
  const host = (headerStore.get("x-forwarded-host") || headerStore.get("host") || "")
    .split(":")[0]
    .toLowerCase()
    .replace(/^www\./, "");
  const isMainHost = !host || host === "localhost" || host === "sitemix.com.tr" || host.endsWith(".vercel.app");

  if (!isMainHost) {
    const { data: domain } = await supabaseAdmin
      .from("studio_domains")
      .select("project_id")
      .eq("domain", host)
      .eq("status", "active")
      .maybeSingle();
    if (domain?.project_id) {
      const { data: project } = await supabaseAdmin
        .from("studio_projects")
        .select("title, slug, status, current_version")
        .eq("id", domain.project_id)
        .eq("status", "published")
        .maybeSingle();
      if (project?.current_version) {
        return <PublishedSite site={project.current_version as StudioSite} slug={project.slug} />;
      }
    }
  }

  return <SitemixLanding />;
}
