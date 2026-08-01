import SitePreview from "@/app/_components/SitePreview";
import type { StudioSite } from "@/lib/sitemixStudio";

export default function PublishedSite({ site, preview = false, slug }: { site: StudioSite; preview?: boolean; slug?: string }) {
  return (
    <main className="min-h-screen bg-white">
      {preview ? (
        <div className="sticky top-0 z-50 flex items-center justify-between bg-[#11121b] px-4 py-3 text-xs font-black text-white">
          <span>SiteMix ön izleme</span>
          <a href="/studio" className="rounded-full bg-white px-4 py-2" style={{ color: "#11121b" }}>Studio’ya dön</a>
        </div>
      ) : null}
      <SitePreview site={site} slug={preview ? undefined : slug} />
    </main>
  );
}
