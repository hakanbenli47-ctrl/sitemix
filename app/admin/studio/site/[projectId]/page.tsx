"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import SitePreview from "@/app/_components/SitePreview";
import type { StudioProject, StudioSite } from "@/lib/sitemixStudio";

type PageProps = { params: Promise<{ projectId: string }> };

export default function AdminSiteEditor({ params }: PageProps) {
  const { projectId } = use(params);
  const [project, setProject] = useState<StudioProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/studio", { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { window.location.href = "/admin/giris"; return; }
      const result = await response.json().catch(() => null);
      setProject((result?.projects || []).find((item: StudioProject) => item.id === projectId) || null);
      setLoading(false);
    });
  }, [projectId]);

  function patchSite(patch: Partial<StudioSite>) {
    if (!project) return;
    setProject({ ...project, current_version: { ...project.current_version, ...patch } });
  }

  function patchSection(index: number, patch: { title?: string; text?: string }) {
    if (!project) return;
    const sections = project.current_version.sections.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...patch } : section);
    patchSite({ sections });
  }

  async function save() {
    if (!project) return;
    setSaving(true); setMessage("");
    const response = await fetch("/api/admin/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_project", id: project.id, site: project.current_version }) });
    const result = await response.json().catch(() => null);
    setMessage(result?.message || (response.ok ? "Kaydedildi." : "Kaydedilemedi."));
    if (response.ok && result.record) setProject(result.record);
    setSaving(false);
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f4f6fb] text-sm font-black text-slate-500">Site düzenleyici hazırlanıyor...</main>;
  if (!project) return <main className="grid min-h-screen place-items-center bg-[#f4f6fb]"><div className="text-center"><h1 className="text-2xl font-black">Site bulunamadı</h1><Link href="/admin/studio" className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-xs font-black text-white">Yönetim merkezine dön</Link></div></main>;

  const site = project.current_version;
  return <main className="min-h-screen bg-[#eef1f7] text-slate-950"><header className="sticky top-0 z-40 flex min-h-[68px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6"><div className="flex min-w-0 items-center gap-3"><Link href="/admin/studio" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white">←</Link><div className="min-w-0"><h1 className="truncate text-sm font-black">{site.businessName}</h1><p className="truncate text-[10px] font-bold text-slate-400">Admin içerik düzenleyici · {project.sector}</p></div></div><div className="flex items-center gap-2">{message ? <span className="hidden text-xs font-bold text-emerald-600 sm:block">{message}</span> : null}<button onClick={save} disabled={saving} className="min-h-11 rounded-full bg-indigo-600 px-5 text-xs font-black text-white disabled:opacity-50">{saving ? "Kaydediliyor..." : "Yeni sürüm kaydet"}</button></div></header>
    <div className="grid gap-0 lg:grid-cols-[380px_1fr]"><aside className="space-y-4 border-r border-slate-200 bg-white p-4 lg:h-[calc(100vh-68px)] lg:overflow-y-auto"><AdminField label="İşletme adı" value={site.businessName} onChange={(businessName) => patchSite({ businessName })} /><AdminField label="Konum" value={site.location} onChange={(location) => patchSite({ location })} /><AdminField label="Telefon" value={site.phone} onChange={(phone) => patchSite({ phone })} /><AdminField label="WhatsApp" value={site.whatsapp} onChange={(whatsapp) => patchSite({ whatsapp })} /><label className="block"><span className="mb-2 block text-xs font-black text-slate-500">Site yapısı</span><select value={site.pageMode} onChange={(event) => patchSite({ pageMode: event.target.value as "single" | "multi" })} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold"><option value="single">Tek sayfalı</option><option value="multi">Çok sayfalı</option></select></label><div><span className="mb-2 block text-xs font-black text-slate-500">Tema rengi</span><input type="color" value={site.theme.accent} onChange={(event) => patchSite({ theme: { ...site.theme, accent: event.target.value } })} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 p-2" /></div><div className="border-t border-slate-200 pt-4"><h2 className="text-sm font-black">Bölüm içerikleri</h2><div className="mt-3 space-y-4">{site.sections.map((section, index) => <article key={section.id} className="rounded-xl bg-slate-50 p-3"><p className="mb-3 text-[10px] font-black uppercase tracking-[.14em] text-indigo-600">{section.type}</p><AdminField label="Başlık" value={section.title} onChange={(title) => patchSection(index, { title })} /><label className="mt-3 block"><span className="mb-2 block text-xs font-black text-slate-500">Açıklama</span><textarea value={section.text} onChange={(event) => patchSection(index, { text: event.target.value })} rows={4} className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 outline-none" /></label></article>)}</div></div></aside><section className="min-w-0 p-3 sm:p-6 lg:h-[calc(100vh-68px)] lg:overflow-auto"><div className="mx-auto max-w-5xl overflow-hidden rounded-[24px] bg-white shadow-2xl shadow-slate-950/10"><SitePreview site={site} /></div></section></div></main>;
}

function AdminField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-2 block text-xs font-black text-slate-500">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-indigo-400" /></label>; }

