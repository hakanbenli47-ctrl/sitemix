import { notFound } from "next/navigation";
import PublishedSite from "@/app/_components/PublishedSite";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { StudioSite } from "@/lib/sitemixStudio";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default async function StudioPublishedPage({ params }: PageProps) {
  const { slug } = await params;
  const { data } = await supabaseAdmin
    .from("studio_projects")
    .select("status, current_version")
    .eq("slug", slug)
    .maybeSingle();

  if (!data?.current_version) notFound();

  return <PublishedSite site={data.current_version as StudioSite} preview={data.status !== "published"} slug={slug} />;
}
