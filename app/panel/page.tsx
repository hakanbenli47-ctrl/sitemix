"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StudioProject } from "@/lib/sitemixStudio";
import { supabaseClient } from "@/lib/supabaseClient";

type Subscription = { id: string; project_id: string; plan: string; status: string; amount?: number | null; currency?: string; renews_at?: string | null };
type Domain = { id: string; project_id: string; domain: string; status: string; ssl_status: string };
type FormEntry = { id: string; project_id: string; name?: string; phone?: string; email?: string; message?: string; status: string; created_at: string };

function date(value?: string | null) { return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value)) : "—"; }
function label(value?: string | null) { const map: Record<string, string> = { published: "Yayında", draft: "Geçici ön izleme", ready: "Yayına hazır", suspended: "Askıda", pending: "Ödeme bekliyor", active: "Aktif", paid: "Ödendi", overdue: "Gecikmiş", dns_pending: "DNS bekliyor", monthly: "Aylık yönetim" }; return map[value || ""] || value || "—"; }

export default function CustomerPanelPage() {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session) { window.location.href = "/"; return; }
      setEmail(data.session.user.email || "");
      const response = await fetch("/api/studio/account", { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (response.ok) { setProjects(result.projects || []); setSubscriptions(result.subscriptions || []); setDomains(result.domains || []); setForms(result.forms || []); }
      else setMessage(result?.message || "Panel yüklenemedi.");
      setLoading(false);
    }
    load();
  }, []);

  async function signOut() { await supabaseClient.auth.signOut(); window.location.href = "/"; }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#090a12] text-sm font-black text-white/45">Müşteri paneli hazırlanıyor...</main>;

  return <main className="min-h-screen bg-[#f4f5fa] text-slate-950"><header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-7"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/" className="flex items-center gap-3"><span className="brand-orb"><span>S</span></span><div><strong className="block">SiteMix</strong><span className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Müşteri paneli</span></div></Link><div className="flex items-center gap-2"><span className="hidden text-xs font-bold text-slate-400 sm:block">{email}</span><button onClick={signOut} className="rounded-full bg-slate-100 px-4 py-2.5 text-xs font-black">Çıkış</button></div></div></header><div className="mx-auto max-w-7xl px-4 py-8 sm:px-7 lg:py-12"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-indigo-600">Hesabım</p><h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">Sitelerin ve müşterilerin.</h1><p className="mt-3 text-sm font-semibold text-slate-500">İçeriklerini, domainlerini, paketini ve gelen talepleri buradan takip et.</p></div><Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white">+ Yeni site oluştur</Link></div>{message ? <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{message}</div> : null}<div className="mt-8 grid gap-4 lg:grid-cols-2">{projects.map((project) => { const subscription = subscriptions.find((item) => item.project_id === project.id); const domain = domains.find((item) => item.project_id === project.id); const newMessages = forms.filter((item) => item.project_id === project.id && item.status === "new").length; return <article key={project.id} className="rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-black text-indigo-700">{project.sector}</span><h2 className="mt-4 text-2xl font-black tracking-[-0.045em]">{project.title}</h2><p className="mt-2 text-xs font-bold text-slate-400">Son güncelleme {date(project.updated_at)}</p></div><span className={`rounded-full px-3 py-2 text-[10px] font-black ${project.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{label(project.status)}</span></div><div className="mt-6 grid grid-cols-3 gap-2"><MiniStat label="Paket" value={label(subscription?.plan || project.management_mode)} /><MiniStat label="Domain" value={domain?.domain || "SiteMix adresi"} /><MiniStat label="Yeni mesaj" value={String(newMessages)} /></div><div className="mt-5 flex flex-wrap gap-2"><Link href={`/studio?project=${project.id}`} className="rounded-full bg-slate-950 px-4 py-2.5 text-xs font-black text-white">Siteyi yönet</Link><a href={`/site/${project.slug}`} target="_blank" className="rounded-full bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-600">Siteyi gör</a>{domain ? <span className="rounded-full bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700">{label(domain.status)}</span> : null}</div></article>; })}</div>{forms.length ? <section className="mt-8 rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-black tracking-[-0.04em]">Son müşteri mesajları</h2><div className="mt-4 divide-y divide-slate-100">{forms.slice(0, 12).map((form) => <article key={form.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]"><div><p className="text-sm font-black">{form.name || "İsimsiz ziyaretçi"}</p><p className="mt-1 text-xs font-bold text-slate-400">{form.phone || form.email || "İletişim bilgisi yok"} · {date(form.created_at)}</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.message}</p></div><span className="h-fit rounded-full bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-700">{label(form.status)}</span></article>)}</div></section> : null}</div></main>;
}

function MiniStat({ label: statLabel, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{statLabel}</p><p className="mt-2 truncate text-xs font-black">{value}</p></div>; }
