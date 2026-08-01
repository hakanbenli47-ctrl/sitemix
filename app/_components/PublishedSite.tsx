import SitePreview from "@/app/_components/SitePreview";
import type { StudioSite } from "@/lib/sitemixStudio";

export default function PublishedSite({ site, preview = false, slug }: { site: StudioSite; preview?: boolean; slug?: string }) {
  return (
    <main className="min-h-screen bg-white">
      {preview ? (
        <div className="sticky top-0 z-50 flex flex-col items-center justify-between gap-2 border-b border-amber-200/15 bg-[#11121b] px-4 py-2.5 text-[10px] font-black text-white sm:flex-row">
          <span><strong className="mr-2 text-amber-300">Geçici ön izleme</strong> Google’da görünür olmak ve sitenin silinmemesi için 7 gün içinde paket seç.</span>
          <a href="/studio" className="shrink-0 rounded-full bg-white px-4 py-2" style={{ color: "#11121b" }}>Paketi seç / düzenle</a>
        </div>
      ) : null}
      <SitePreview site={site} slug={preview ? undefined : slug} />
    </main>
  );
}
