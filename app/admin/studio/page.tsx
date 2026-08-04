"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string; owner_id: string; title: string; slug: string; sector: string; status: string;
  management_mode: string | null; payment_status: string; published_at: string | null;
  created_at: string; updated_at: string; owner?: { email?: string; name?: string } | null;
};
type Lead = { id: string; project_id: string | null; owner_id: string | null; type: string; status: string; summary: Record<string, unknown>; admin_notes?: string | null; created_at: string };
type Subscription = { id: string; project_id: string; status: string; amount: number | null; currency: string; renews_at: string | null };
type Payment = { id: string; project_id: string; status: string; amount: number; currency: string; method?: string | null; paid_at?: string | null; created_at: string };
type Domain = { id: string; project_id: string; domain: string; status: string; ssl_status: string; is_primary: boolean; last_checked_at?: string | null };
type Deployment = { id: string; project_id: string; status: string; github_repo_url?: string | null; github_repo_full_name?: string | null; vercel_url?: string | null; vercel_project_name?: string | null; domain?: string | null; last_error?: string | null; updated_at: string };
type FormEntry = { id: string; project_id: string; type: string; name?: string; phone?: string; email?: string; message?: string; status: string; created_at: string };
type UserItem = { id: string; email?: string; name?: string; created_at: string; last_sign_in_at?: string | null };
type Audit = { id: string; actor_label?: string; action: string; entity_type: string; entity_id?: string; created_at: string };
type Sector = { id: string; label: string; active: boolean; keywords?: string[]; services?: string[]; sort_order?: number };
type Setting = { key: string; value: Record<string, unknown>; updated_at: string };
type AdminData = { projects: Project[]; leads: Lead[]; subscriptions: Subscription[]; payments: Payment[]; domains: Domain[]; deployments: Deployment[]; forms: FormEntry[]; users: UserItem[]; audits: Audit[]; sectors: Sector[]; settings: Setting[]; setupRequired?: boolean };
type AdminTab = "overview" | "sites" | "users" | "leads" | "payments" | "deployments" | "domains" | "messages" | "settings" | "logs";

const initialData: AdminData = { projects: [], leads: [], subscriptions: [], payments: [], domains: [], deployments: [], forms: [], users: [], audits: [], sectors: [], settings: [] };

function date(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function money(value?: number | null, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
}

function label(value?: string | null) {
  const labels: Record<string, string> = {
    draft: "Taslak", ready: "Yayına hazır", request_received: "Talep alındı", published: "Yayında", suspended: "Askıda", archived: "Arşiv",
    pending: "Bekliyor", paid: "Ödendi", overdue: "Gecikmiş", grace: "Ek süre", cancelled: "İptal", active: "Aktif", dns_pending: "DNS bekliyor",
    new: "Yeni", contacted: "Görüşüldü", proposal_sent: "Teklif verildi", approved: "Onaylandı", in_progress: "Hazırlanıyor", completed: "Tamamlandı", lost: "Sonuçlanmadı",
    monthly: "Aylık", yearly: "Yıllık", managed: "SiteMix yönetsin", yearly_setup: "Yıllık kurulum", managed_service: "Yönetim talebi", custom_sector: "Özel sektör", queued: "Sırada", provisioning: "Hazırlanıyor", configuration_required: "Kurulum gerekli",
  };
  return labels[value || ""] || value || "—";
}

function statusTone(value?: string | null) {
  if (["active", "paid", "published", "completed", "approved"].includes(value || "")) return "bg-emerald-50 text-emerald-700";
  if (["overdue", "suspended", "cancelled", "lost", "error"].includes(value || "")) return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

export default function StudioAdminPage() {
  const [data, setData] = useState<AdminData>(initialData);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [domainInputs, setDomainInputs] = useState<Record<string, string>>({});

  async function load() {
    setError("");
    const response = await fetch("/api/admin/studio", { cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (response.status === 401) {
      window.location.href = "/admin/giris";
      return;
    }
    if (!response.ok) setError(result?.message || "Yönetim verileri alınamadı.");
    else setData({ ...initialData, ...result });
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function runAction(action: string, id: string, extra: Record<string, unknown> = {}) {
    setBusy(`${action}-${id}`); setError(""); setNotice("");
    const response = await fetch("/api/admin/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, ...extra }) });
    const result = await response.json().catch(() => null);
    if (!response.ok) setError(result?.message || "İşlem tamamlanamadı.");
    else { setNotice(result?.message || "İşlem tamamlandı."); await load(); }
    setBusy("");
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); window.location.href = "/admin/giris"; }

  const filteredProjects = useMemo(() => {
    const q = query.toLocaleLowerCase("tr-TR").trim();
    if (!q) return data.projects;
    return data.projects.filter((item) => [item.title, item.sector, item.slug, item.owner?.email, item.owner?.name].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR").includes(q));
  }, [data.projects, query]);

  const revenue = data.subscriptions.filter((item) => item.status === "active").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const stats = [
    ["Toplam kullanıcı", data.users.length, `${data.users.filter((item) => item.last_sign_in_at).length} giriş yapmış`],
    ["Kurulan site", data.projects.length, `${data.projects.filter((item) => item.status === "published").length} yayında`],
    ["Yeni talep", data.leads.filter((item) => item.status === "new").length, `${data.leads.length} toplam talep`],
    ["Aylık gelir", money(revenue), `${data.subscriptions.filter((item) => item.status === "overdue").length} gecikmiş`],
    ["Domain", data.domains.length, `${data.domains.filter((item) => item.status === "active").length} aktif`],
    ["Bağımsız yayın", data.deployments.length, `${data.deployments.filter((item) => item.status === "ready").length} hazır`],
    ["Yeni mesaj", data.forms.filter((item) => item.status === "new").length, `${data.forms.length} toplam mesaj`],
  ];

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f4f6fb] text-slate-950"><p className="text-sm font-black text-slate-500">SiteMix yönetim merkezi hazırlanıyor...</p></main>;

  return (
    <main className="min-h-screen bg-[#f4f6fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        <aside className="border-b border-slate-200 bg-[#0d1020] p-3 text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-white/8 lg:p-5">
          <div className="flex items-center justify-between lg:block"><Link href="/" className="flex items-center gap-3"><span className="brand-orb"><span>S</span></span><div><strong className="block">SiteMix</strong><span className="text-[10px] font-black uppercase tracking-[.15em] text-white/35">Yönetim merkezi</span></div></Link><button onClick={logout} className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black text-white/45 lg:hidden">Çıkış</button></div>
          <nav className="mt-4 flex gap-1 overflow-x-auto lg:mt-9 lg:block lg:space-y-1">
            {(["overview", "sites", "users", "leads", "payments", "deployments", "domains", "messages", "settings", "logs"] as AdminTab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-xl px-4 py-3 text-left text-xs font-black transition lg:w-full ${tab === item ? "bg-white text-[#111322]" : "text-white/48 hover:bg-white/6 hover:text-white"}`}>{({ overview: "Genel Bakış", sites: "Siteler", users: "Kullanıcılar", leads: "Talepler", payments: "Paket & Ödeme", deployments: "GitHub & Vercel", domains: "Domainler", messages: "Mesajlar", settings: "Sektör & Ayarlar", logs: "İşlem Geçmişi" } as Record<AdminTab, string>)[item]}</button>)}
          </nav>
          <div className="mt-5 hidden border-t border-white/8 pt-5 lg:block"><Link href="/admin" className="block rounded-xl border border-white/8 p-4 text-xs font-black text-white/55 hover:bg-white/6">Ön Muhasebe Yönetimi →</Link><button onClick={logout} className="mt-2 w-full rounded-xl px-4 py-3 text-left text-xs font-black text-white/35 hover:bg-white/6">Güvenli çıkış</button></div>
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-9">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-indigo-600">SiteMix Studio</p><h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">{({ overview: "Bütün sistem", sites: "Kurulan siteler", users: "Kullanıcılar", leads: "Satış ve hizmet talepleri", payments: "Paket ve ödemeler", deployments: "Bağımsız site yayınları", domains: "Domain yönetimi", messages: "Müşteri mesajları", settings: "Sektörler ve sistem ayarları", logs: "İşlem geçmişi" } as Record<AdminTab, string>)[tab]}</h1><p className="mt-2 text-sm font-semibold text-slate-500">SiteMix’e giren, çıkan ve değişen bütün kayıtlar tek yerde.</p></div><button onClick={load} className="min-h-11 rounded-full bg-white px-5 text-xs font-black shadow-sm">Verileri yenile</button></header>
          {notice ? <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{notice}</div> : null}{error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

          {tab === "overview" ? <><div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([name, value, detail]) => <article key={String(name)} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">{name}</p><p className="mt-4 text-3xl font-black tracking-[-0.05em]">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{detail}</p></article>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Panel title="Son kurulan siteler"><SiteTable projects={data.projects.slice(0, 6)} busy={busy} onAction={runAction} compact /></Panel><Panel title="Bekleyen işler"><div className="space-y-3"><Queue label="Yeni hizmet talebi" value={data.leads.filter((item) => item.status === "new").length} onClick={() => setTab("leads")} /><Queue label="Ödeme bekleyen" value={data.projects.filter((item) => item.payment_status === "pending").length} onClick={() => setTab("payments")} /><Queue label="DNS bekleyen" value={data.domains.filter((item) => item.status !== "active").length} onClick={() => setTab("domains")} /><Queue label="Okunmamış mesaj" value={data.forms.filter((item) => item.status === "new").length} onClick={() => setTab("messages")} /></div></Panel></div></> : null}

          {tab === "sites" ? <><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="İşletme, sektör, domain veya müşteri ara" className="mt-7 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-indigo-400" /><div className="mt-4"><SiteTable projects={filteredProjects} busy={busy} onAction={runAction} /></div></> : null}

          {tab === "users" ? <div className="mt-7 grid gap-3">{data.users.map((user) => <article key={user.id} className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto] md:items-center"><div><p className="font-black">{user.name || "İsimsiz kullanıcı"}</p><p className="mt-1 text-xs font-bold text-slate-500">{user.email || "E-posta yok"}</p></div><div className="text-xs font-bold text-slate-500"><p>Kayıt: {date(user.created_at)}</p><p className="mt-1">Son giriş: {date(user.last_sign_in_at)}</p></div><span className="rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">Aktif</span></article>)}</div> : null}

          {tab === "leads" ? <div className="mt-7 grid gap-3">{data.leads.map((lead) => { const project = data.projects.find((item) => item.id === lead.project_id); return <article key={lead.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><span className="rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black text-violet-700">{label(lead.type)}</span><h3 className="mt-3 text-xl font-black">{project?.title || String(lead.summary?.businessName || "Özel talep")}</h3><p className="mt-1 text-xs font-bold text-slate-500">{project?.sector || String(lead.summary?.sector || "Sektör belirtilmedi")} · {date(lead.created_at)}</p></div><select value={lead.status} disabled={busy === `lead_status-${lead.id}`} onChange={(event) => runAction("lead_status", lead.id, { status: event.target.value, notes: lead.admin_notes || "" })} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black"><option value="new">Yeni</option><option value="contacted">Görüşüldü</option><option value="proposal_sent">Teklif verildi</option><option value="approved">Onaylandı</option><option value="in_progress">Hazırlanıyor</option><option value="completed">Tamamlandı</option><option value="lost">Sonuçlanmadı</option></select></div></article>; })}</div> : null}

          {tab === "payments" ? <div className="mt-7 grid gap-3">{data.projects.filter((project) => project.management_mode === "monthly" || project.payment_status !== "not_required").map((project) => { const subscription = data.subscriptions.find((item) => item.project_id === project.id); return <article key={project.id} className="grid gap-5 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><h3 className="font-black">{project.title}</h3><p className="mt-1 text-xs font-bold text-slate-500">{project.owner?.email || "—"} · {label(project.management_mode)}</p></div><div><p className="text-xs font-black">{money(subscription?.amount)}</p><p className="mt-1 text-[10px] font-bold text-slate-400">Yenileme: {date(subscription?.renews_at)}</p></div><div className="flex flex-wrap gap-2">{["active", "pending", "overdue", "grace", "cancelled"].map((status) => <button key={status} disabled={Boolean(busy)} onClick={() => runAction("subscription", project.id, { status, amount: subscription?.amount || 0, renewsAt: subscription?.renews_at })} className={`rounded-full px-3 py-2 text-[10px] font-black ${subscription?.status === status ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"}`}>{label(status)}</button>)}</div></article>; })}</div> : null}

          {tab === "deployments" ? <div className="mt-7 grid gap-3">{data.projects.map((project) => { const deployment = data.deployments.find((item) => item.project_id === project.id); return <article key={project.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{project.title}</h3><span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusTone(deployment?.status)}`}>{label(deployment?.status || "queued")}</span></div><p className="mt-1 text-xs font-bold text-slate-500">{project.sector} · {label(project.management_mode)}</p>{deployment?.last_error ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{deployment.last_error}</p> : null}<div className="mt-3 flex flex-wrap gap-3 text-[10px] font-black">{deployment?.github_repo_url ? <a href={deployment.github_repo_url} target="_blank" className="text-indigo-600">GitHub deposunu aç ↗</a> : null}{deployment?.vercel_url ? <a href={deployment.vercel_url} target="_blank" className="text-emerald-600">Vercel sitesini aç ↗</a> : null}</div></div><button disabled={Boolean(busy)} onClick={() => runAction("provision", project.id)} className="shrink-0 rounded-full bg-slate-950 px-4 py-2.5 text-[10px] font-black text-white">{deployment ? "Yeniden hazırla" : "Depo ve Vercel hazırla"}</button></div><div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row"><input value={domainInputs[project.id] || deployment?.domain || ""} onChange={(event) => setDomainInputs((current) => ({ ...current, [project.id]: event.target.value }))} placeholder="ornekisletme.com" className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none" /><button disabled={Boolean(busy) || !deployment} onClick={() => runAction("connect_domain", project.id, { domain: domainInputs[project.id] || deployment?.domain || "" })} className="rounded-full bg-indigo-600 px-4 py-2.5 text-[10px] font-black text-white disabled:opacity-30">Domaini bağla ve SEO dosyalarını güncelle</button></div></article>; })}</div> : null}

          {tab === "domains" ? <div className="mt-7 grid gap-3">{data.domains.map((domain) => { const project = data.projects.find((item) => item.id === domain.project_id); return <article key={domain.id} className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><h3 className="font-black">{domain.domain}</h3><p className="mt-1 text-xs font-bold text-slate-500">{project?.title || "Proje bulunamadı"} · Son kontrol {date(domain.last_checked_at)}</p></div><div className="flex gap-2"><span className={`rounded-full px-3 py-2 text-[10px] font-black ${statusTone(domain.status)}`}>{label(domain.status)}</span><span className={`rounded-full px-3 py-2 text-[10px] font-black ${statusTone(domain.ssl_status)}`}>SSL {label(domain.ssl_status)}</span></div><div className="flex gap-2"><button onClick={() => runAction("domain_status", domain.id, { status: "active", sslStatus: "active" })} className="rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">Aktif işaretle</button><button onClick={() => runAction("domain_status", domain.id, { status: "dns_pending", sslStatus: "pending" })} className="rounded-full bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-700">DNS bekliyor</button></div></article>; })}</div> : null}

          {tab === "messages" ? <div className="mt-7 grid gap-3">{data.forms.map((form) => { const project = data.projects.find((item) => item.id === form.project_id); return <article key={form.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"><div className="flex justify-between gap-4"><div><p className="text-xs font-black text-indigo-600">{project?.title || "Site mesajı"}</p><h3 className="mt-2 text-lg font-black">{form.name || "İsimsiz ziyaretçi"}</h3><p className="mt-1 text-xs font-bold text-slate-500">{form.phone || form.email || "İletişim bilgisi yok"} · {date(form.created_at)}</p></div><span className={`h-fit rounded-full px-3 py-2 text-[10px] font-black ${statusTone(form.status)}`}>{label(form.status)}</span></div><p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-7 text-slate-600">{form.message || "Mesaj içeriği yok."}</p></article>; })}</div> : null}

          {tab === "settings" ? <div className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Panel title="Site üretim sektörleri"><div className="grid gap-3">{data.sectors.map((sector) => <article key={sector.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div><p className="text-sm font-black">{sector.label}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{sector.services?.length || 0} hazır hizmet · Sıra {sector.sort_order || 0}</p></div><button onClick={() => runAction("sector_status", sector.id, { active: !sector.active })} className={`rounded-full px-3 py-2 text-[10px] font-black ${sector.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{sector.active ? "Aktif" : "Pasif"}</button></article>)}</div></Panel><Panel title="Sistem yapılandırması"><div className="space-y-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black">Ana WhatsApp</p><p className="mt-2 text-sm font-bold text-slate-500">+90 551 555 03 02</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black">Domain paneli</p><p className="mt-2 text-sm font-bold text-emerald-600">Müşteriye ücretsiz</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black">Otomatik askıya alma</p><p className="mt-2 text-sm font-bold text-slate-500">Kapalı · Yönetici onayı gerekli</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black">Ön muhasebe</p><p className="mt-2 text-sm font-bold text-emerald-600">Korunuyor ve aktif</p></div></div></Panel></div> : null}

          {tab === "logs" ? <Panel title="Son işlemler" className="mt-7"><div className="divide-y divide-slate-100">{data.audits.map((audit) => <div key={audit.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]"><div><p className="text-sm font-black">{audit.action}</p><p className="mt-1 text-xs font-bold text-slate-500">{audit.entity_type} · {audit.entity_id || "—"} · {audit.actor_label || "Sistem"}</p></div><span className="text-xs font-bold text-slate-400">{date(audit.created_at)}</span></div>)}</div></Panel> : null}
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) { return <section className={`rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm ${className}`}><h2 className="text-lg font-black tracking-[-0.03em]">{title}</h2><div className="mt-4">{children}</div></section>; }
function Queue({ label: itemLabel, value, onClick }: { label: string; value: number; onClick: () => void }) { return <button onClick={onClick} className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-4 text-left"><span className="text-sm font-black text-slate-600">{itemLabel}</span><span className="grid h-8 min-w-8 place-items-center rounded-full bg-slate-950 px-2 text-xs font-black text-white">{value}</span></button>; }

function SiteTable({ projects, busy, onAction, compact = false }: { projects: Project[]; busy: string; onAction: (action: string, id: string, extra?: Record<string, unknown>) => void; compact?: boolean }) {
  if (!projects.length) return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">Henüz kayıt bulunmuyor.</div>;
  return <div className="grid gap-3">{projects.map((project) => <article key={project.id} className={`rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm ${compact ? "" : "lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-5"}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-black">{project.title}</h3><span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusTone(project.status)}`}>{label(project.status)}</span><span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusTone(project.payment_status)}`}>{label(project.payment_status)}</span></div><p className="mt-2 truncate text-xs font-bold text-slate-500">{project.sector} · {project.owner?.email || "Kullanıcı bilinmiyor"} · {date(project.updated_at)}</p></div><div className="mt-4 flex flex-wrap gap-2 lg:mt-0"><Link href={`/admin/studio/site/${project.id}`} className="rounded-full bg-indigo-50 px-3 py-2 text-[10px] font-black text-indigo-700">İçeriği düzenle</Link><a href={`/site/${project.slug}`} target="_blank" className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600">Ön izleme</a>{project.status === "published" ? <button disabled={Boolean(busy)} onClick={() => onAction("unpublish", project.id)} className="rounded-full bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-700">Yayından kaldır</button> : <button disabled={Boolean(busy)} onClick={() => onAction("publish", project.id)} className="rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">Yayınla</button>}<button disabled={Boolean(busy)} onClick={() => onAction("archive", project.id)} className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-500">Arşivle</button></div></article>)}</div>;
}
