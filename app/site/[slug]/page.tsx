import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublishedSite from "@/app/_components/PublishedSite";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { upgradeStudioSite, type StudioSite } from "@/lib/sitemixStudio";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

function isExpiredPreview(project: { status: string; management_mode?: string | null; created_at?: string | null }) {
  if (project.status === "published" || project.management_mode || !project.created_at) return false;
  return new Date(project.created_at).getTime() + 7 * 24 * 60 * 60 * 1000 <= Date.now();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabaseAdmin.from("studio_projects").select("title, status, management_mode, created_at").eq("slug", slug).maybeSingle();
  const published = Boolean(data && data.status === "published" && !isExpiredPreview(data));
  return {
    title: data?.title || "Site ön izleme",
    robots: { index: published, follow: published },
  };
}

export default async function StudioPublishedPage({ params }: PageProps) {
  const { slug } = await params;
  const { data } = await supabaseAdmin
    .from("studio_projects")
    .select("status, management_mode, created_at, current_version")
    .eq("slug", slug)
    .maybeSingle();

  if (!data?.current_version || isExpiredPreview(data)) notFound();

  return <PublishedSite site={upgradeStudioSite(data.current_version as StudioSite)} preview={data.status !== "published"} slug={slug} />;
}
