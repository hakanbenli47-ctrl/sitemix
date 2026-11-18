import SitemixMarketing from "@/app/_components/SitemixMarketing";
import PublishedSite from "@/app/_components/PublishedSite";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { upgradeStudioSite, type StudioSite } from "@/lib/sitemixStudio";

export const metadata: Metadata = {
  title: { absolute: "SiteMix | Antalya Web Tasarım ve İnternet Sitesi" },
  description: "Kuaför, güzellik salonu, restoran, oto servis ve tüm yerel işletmeler için mobil uyumlu profesyonel internet siteleri. Antalya'dan tüm Türkiye'ye. Teklif alın.",
  keywords: ["Antalya web tasarım", "web sitesi yaptırma", "kuaför internet sitesi", "güzellik salonu web sitesi", "yerel işletme internet sitesi", "SiteMix"],
  openGraph: {
    title: "SiteMix | İşinize müşteri getiren internet siteleri",
    description: "Antalya'dan tüm Türkiye'ye profesyonel, mobil uyumlu ve Google'a uygun internet siteleri.",
    url: "https://www.sitemix.com.tr",
    siteName: "SiteMix",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "SiteMix web tasarım" }],
  },
};

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
        return <PublishedSite site={upgradeStudioSite(project.current_version as StudioSite)} slug={project.slug} />;
      }
    }
  }

  return <SitemixMarketing />;
}
