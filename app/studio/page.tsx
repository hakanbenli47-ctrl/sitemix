"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SitePreview from "@/app/_components/SitePreview";
import { applyStudioInstruction, generateStudioSite, slugify, type StudioProject, type StudioSite } from "@/lib/sitemixStudio";
import { supabaseClient } from "@/lib/supabaseClient";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
type StudioTab = "chat" | "preview" | "content" | "domain";

const whatsappPhone = "905515550302";

function makeLocalProject(prompt: string): StudioProject {
  const site = generateStudioSite(prompt);
  return {
    id: `local-${Date.now()}`,
    title: site.businessName,
    slug: `${slugify(site.businessName)}-${Math.random().toString(36).slice(2, 6)}`,
    sector: site.sector,
    prompt,
    status: "draft",
    current_version: site,
  };
}

export default function StudioPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [project, setProject] = useState<StudioProject | null>(null);
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<StudioTab>("chat");
  const [previewMobile, setPreviewMobile] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [domain, setDomain] = useState("");
  const [domainBusy, setDomainBusy] = useState(false);
  const [domainResult, setDomainResult] = useState<{ status: string; message: string; records?: Array<{ type: string; name: string; value: string }> } | null>(null);
  const createdPromptRef = useRef("");

  const site = project?.current_version || null;

  async function authorizedFetch(url: string, init?: RequestInit) {
    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${accessToken}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  }

  async function loadProjects(token: string) {
    const response = await fetch("/api/studio/projects", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (response.ok) {
      setProjects(result.projects || []);
      const requestedId = new URLSearchParams(window.location.search).get("project");
      const requestedProject = (result.projects || []).find((item: StudioProject) => item.id === requestedId);
      if (!project && (requestedProject || result.projects?.[0])) setProject(requestedProject || result.projects[0]);
      return;
    }
    if (!result?.setupRequired) setNotice(result?.message || "Projeler alınamadı.");
  }

  async function createProject(prompt: string, token: string) {
    if (!prompt || createdPromptRef.current === prompt) return;
    createdPromptRef.current = prompt;
    setBusy(true);
    setMessages([{ id: "u1", role: "user", content: prompt }]);
    setProject(makeLocalProject(prompt));

    window.setTimeout(() => {
      setMessages((current) => [...current, { id: "a1", role: "assistant", content: "İşletmenin sektörünü ve ihtiyacını anladım. İlk taslağı hazırlıyorum..." }]);
    }, 350);

    try {
      const response = await fetch("/api/studio/projects", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result.project) {
        setProject(result.project);
        setProjects((current) => [result.project, ...current.filter((item) => item.id !== result.project.id)]);
        setNotice("Projen hesabına kaydedildi.");
      } else if (result?.setupRequired) {
        setNotice("Taslağın hazır. Veritabanı kurulumu tamamlanınca hesabına kalıcı olarak kaydedilecek.");
      } else {
        throw new Error(result?.message || "Proje kaydedilemedi.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Taslak yerel olarak hazırlandı.");
    } finally {
      window.setTimeout(() => {
        setMessages((current) => [...current.filter((item) => item.id !== "a1"), { id: `a-${Date.now()}`, role: "assistant", content: "İlk taslak hazır. Renk, sayfa, fiyat listesi veya galeri gibi değişiklikleri buradan yazabilirsin." }]);
        setBusy(false);
      }, 650);
    }
  }

  useEffect(() => {
    let active = true;
    async function boot() {
      let session = (await supabaseClient.auth.getSession()).data.session;
      const returningFromGoogle = window.location.search.includes("auth=google") || window.location.hash.includes("access_token");
      if (!session && returningFromGoogle) {
        for (let attempt = 0; attempt < 15 && !session; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 200));
          session = (await supabaseClient.auth.getSession()).data.session;
        }
      }
      if (!active) return;
      if (!session) {
        window.location.replace("/");
        return;
      }
      const token = session.access_token;
      setAccessToken(token);
      setUserEmail(session.user.email || "");
      setSessionReady(true);
      const pending = window.sessionStorage.getItem("sitemix_pending_prompt") || "";
      if (pending) {
        window.sessionStorage.removeItem("sitemix_pending_prompt");
        await createProject(pending, token);
      } else {
        await loadProjects(token);
      }
    }
    boot();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendInstruction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const instruction = input.trim();
    if (!instruction || !project || !site || busy) return;
    setInput("");
    setBusy(true);
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", content: instruction }]);
    const localSite = applyStudioInstruction(site, instruction);
    setProject({ ...project, current_version: localSite });

    try {
      if (!project.id.startsWith("local-")) {
        const response = await authorizedFetch(`/api/studio/projects/${project.id}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "instruction", instruction }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message || "Değişiklik kaydedilemedi.");
        setProject(result.project);
      }
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: "İsteğini uyguladım. Ön izleme güncellendi. Başka bir değişiklik ister misin?" }]);
      if (window.innerWidth < 1024) setActiveTab("preview");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Değişiklik ön izlemeye uygulandı.");
    } finally {
      setBusy(false);
    }
  }

  function updateSite(patch: Partial<StudioSite>) {
    if (!project || !site) return;
    setProject({ ...project, title: patch.businessName || project.title, current_version: { ...site, ...patch } });
  }

  async function saveContent() {
    if (!project || !site || project.id.startsWith("local-")) {
      setNotice("Değişiklikler ön izlemeye uygulandı.");
      return;
    }
    setBusy(true);
    try {
      const response = await authorizedFetch(`/api/studio/projects/${project.id}`, { method: "PATCH", body: JSON.stringify({ action: "save", site }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Kaydedilemedi.");
      setProject(result.project);
      setNotice("Değişiklikler kaydedildi ve yeni sürüm oluşturuldu.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  function whatsappHref(mode: "yearly" | "managed") {
    if (!project || !site) return `https://wa.me/${whatsappPhone}`;
    const preview = `${window.location.origin}/site/${project.slug}`;
    const lines = [
      "Merhaba, SiteMix Studio üzerinden bir site oluşturdum.",
      "",
      `İşletme: ${site.businessName}`,
      `Sektör: ${site.sector}`,
      `Site türü: ${site.pageMode === "multi" ? "Çok sayfalı" : "Tek sayfalı"}`,
      `Yönetim tercihi: ${mode === "yearly" ? "Yıllık kurulum" : "SiteMix yönetsin"}`,
      `Proje kodu: ${project.id}`,
      `Hesap: ${userEmail}`,
      `Ön izleme: ${preview}`,
    ];
    return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  async function chooseManagement(mode: "monthly" | "yearly" | "managed") {
    if (!project || !site) return;
    if (!project.id.startsWith("local-")) {
      await authorizedFetch(`/api/studio/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "management",
          mode,
          summary: { businessName: site.businessName, sector: site.sector, pageMode: site.pageMode, email: userEmail },
        }),
      });
    }
    if (mode === "monthly") {
      setShowDecision(false);
      setActiveTab("domain");
      setNotice("Aylık yönetim seçildi. Domainini bağlayabilir ve ödeme onayından sonra yayınlayabilirsin.");
    } else {
      window.open(whatsappHref(mode), "_blank", "noopener,noreferrer");
    }
  }

  async function checkDomain() {
    if (!project || !domain.trim()) return;
    setDomainBusy(true);
    setDomainResult(null);
    try {
      const response = await authorizedFetch("/api/studio/domains", {
        method: "POST",
        body: JSON.stringify({ projectId: project.id, domain, action: "check" }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Domain kontrol edilemedi.");
      setDomainResult(result);
    } catch (error) {
      setDomainResult({ status: "error", message: error instanceof Error ? error.message : "Domain kontrol edilemedi." });
    } finally {
      setDomainBusy(false);
    }
  }

  async function signOut() {
    await supabaseClient.auth.signOut();
    window.location.href = "/";
  }

  const projectUrl = useMemo(() => project ? `/site/${project.slug}` : "#", [project]);

  if (!sessionReady) {
    return <main className="grid min-h-screen place-items-center bg-[#090a12] text-white"><div className="text-center"><span className="brand-orb mx-auto"><span>S</span></span><p className="mt-5 text-sm font-black text-white/45">Studio hazırlanıyor...</p></div></main>;
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#090a12] px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3"><span className="brand-orb"><span>S</span></span><strong>SiteMix Studio</strong></Link><button onClick={signOut} className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/55">Çıkış</button></header>
          <section className="mt-20 text-center"><p className="section-kicker">Projelerin</p><h1 className="mt-4 text-5xl font-black tracking-[-0.06em]">Yeni bir fikirle başlayalım.</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45">Henüz bir projen yok. Ana sayfadaki sohbet alanına işletmeni anlat.</p><Link href="/" className="send-button mt-8 inline-flex min-h-14 items-center rounded-full px-7 text-sm font-black text-[#0a0b13]">Yeni site oluştur</Link></section>
        </div>
      </main>
    );
  }

  return (
    <main className="studio-app min-h-screen bg-[#090a12] text-white">
      <header className="sticky top-0 z-50 flex h-[68px] items-center justify-between border-b border-white/8 bg-[#0b0c14]/88 px-3 backdrop-blur-2xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3"><Link href="/" className="brand-orb !h-10 !w-10 !rounded-[13px]"><span>S</span></Link><div className="min-w-0">{projects.length > 1 ? <select value={project.id} onChange={(event) => { const selected = projects.find((item) => item.id === event.target.value); if (selected) { setProject(selected); setMessages([]); } }} className="max-w-[180px] bg-transparent text-sm font-black text-white outline-none sm:max-w-[260px]">{projects.map((item) => <option key={item.id} value={item.id} className="bg-[#11121b]">{item.title}</option>)}</select> : <p className="truncate text-sm font-black">{site?.businessName}</p>}<p className="truncate text-[10px] font-bold text-white/32">{project.status === "published" ? "Yayında" : "Taslak"} · {site?.sector}</p></div></div>
        <div className="flex items-center gap-2">
          <Link href="/" className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/55 md:inline-flex">+ Yeni site</Link>
          <a href={projectUrl} target="_blank" className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/55 sm:inline-flex">Yeni sekmede aç</a>
          <button type="button" onClick={() => setShowDecision(true)} className="send-button min-h-10 rounded-full px-4 text-xs font-black text-[#0a0b13] sm:px-5">Devam et</button>
        </div>
      </header>

      {notice ? <div className="fixed left-1/2 top-[78px] z-[70] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1a1b28]/95 px-4 py-3 text-center text-xs font-bold text-white/70 shadow-2xl backdrop-blur-xl" onClick={() => setNotice("")}>{notice}</div> : null}

      <div className="grid min-h-[calc(100vh-68px)] lg:grid-cols-[410px_1fr]">
        <aside className={`${activeTab === "preview" ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-white/8 bg-[#0d0e17]`}>
          <div className="flex gap-1 border-b border-white/8 p-2">
            {(["chat", "content", "domain"] as StudioTab[]).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 rounded-xl px-3 py-2.5 text-[11px] font-black ${activeTab === tab ? "bg-white/10 text-white" : "text-white/35"}`}>{tab === "chat" ? "Sohbet" : tab === "content" ? "İçerik" : "Domain"}</button>)}
          </div>

          {activeTab === "chat" ? (
            <><div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 ? <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm font-medium leading-7 text-white/45">Bu proje için renk, bölüm veya sayfa değişikliği isteyebilirsin.</div> : null}
              {messages.map((message) => <div key={message.id} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${message.role === "user" ? "ml-auto bg-[#7e68ff] text-white" : "border border-white/8 bg-white/[0.04] text-white/62"}`}>{message.content}</div>)}
              {busy ? <div className="inline-flex gap-1 rounded-full bg-white/6 px-4 py-3"><span className="dot-typing" /><span className="dot-typing" /><span className="dot-typing" /></div> : null}
            </div>
            <form onSubmit={sendInstruction} className="border-t border-white/8 p-3"><textarea value={input} onChange={(event) => setInput(event.target.value)} rows={3} placeholder="Örn. Mor tonlara geç, fiyat listesi ekle..." className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.045] p-4 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/24 focus:border-white/18" /><button disabled={!input.trim() || busy} className="send-button mt-2 min-h-12 w-full rounded-full text-sm font-black text-[#0a0b13] disabled:opacity-40">Değişikliği uygula</button></form></>
          ) : null}

          {activeTab === "content" && site ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <EditorField label="İşletme adı" value={site.businessName} onChange={(value) => updateSite({ businessName: value })} />
              <EditorField label="Konum" value={site.location} onChange={(value) => updateSite({ location: value })} />
              <EditorField label="Telefon" value={site.phone} onChange={(value) => updateSite({ phone: value })} />
              <EditorField label="WhatsApp" value={site.whatsapp} onChange={(value) => updateSite({ whatsapp: value })} />
              <label className="block"><span className="mb-2 block text-xs font-black text-white/45">Site yapısı</span><select value={site.pageMode} onChange={(event) => updateSite({ pageMode: event.target.value as "single" | "multi" })} className="h-12 w-full rounded-xl border border-white/8 bg-[#161722] px-3 text-sm font-bold text-white outline-none"><option value="single">Tek sayfalı</option><option value="multi">Çok sayfalı</option></select></label>
              <div><span className="mb-2 block text-xs font-black text-white/45">Ana renk</span><div className="flex gap-2">{["#7c5cff", "#0eac83", "#3478f6", "#f0528a", "#e65f3d", "#df9f45"].map((color) => <button key={color} type="button" onClick={() => updateSite({ theme: { ...site.theme, accent: color } })} className="h-9 w-9 rounded-full border-2" style={{ background: color, borderColor: site.theme.accent === color ? "white" : "transparent" }} aria-label={`${color} rengini seç`} />)}</div></div>
              <button type="button" onClick={saveContent} disabled={busy} className="send-button min-h-12 w-full rounded-full text-sm font-black text-[#0a0b13]">Değişiklikleri kaydet</button>
            </div>
          ) : null}

          {activeTab === "domain" ? (
            <div className="flex-1 overflow-y-auto p-4"><p className="section-kicker">Ücretsiz domain paneli</p><h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">Domainini bağla.</h2><p className="mt-3 text-xs font-medium leading-6 text-white/42">Mevcut domainini yaz. Gerekli DNS kayıtlarını ve doğrulama durumunu burada görebilirsin.</p>
              <div className="mt-6"><EditorField label="Domain" value={domain} placeholder="ornekisletme.com" onChange={setDomain} /><button type="button" onClick={checkDomain} disabled={!domain.trim() || domainBusy || project.id.startsWith("local-")} className="mt-3 min-h-12 w-full rounded-full bg-white px-5 text-sm font-black text-[#11121b] disabled:opacity-35">{domainBusy ? "Kontrol ediliyor..." : "Domaini kontrol et"}</button></div>
              {domainResult ? <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.035] p-4"><p className="text-sm font-black">{domainResult.status === "active" ? "Bağlantı aktif" : "DNS ayarı gerekli"}</p><p className="mt-2 text-xs font-medium leading-6 text-white/48">{domainResult.message}</p>{domainResult.records?.map((record) => <div key={`${record.type}-${record.name}`} className="mt-3 rounded-xl bg-black/25 p-3 text-[11px] font-bold"><span className="text-[#8ef1d4]">{record.type}</span> · {record.name} → {record.value}</div>)}</div> : null}
              <div className="mt-5 rounded-2xl bg-[#151620] p-4 text-xs font-medium leading-6 text-white/38">Domain paneli ücretsizdir. Domain satın alma ve yenileme ücretleri domain firmasına aittir.</div>
            </div>
          ) : null}
        </aside>

        <section className={`${activeTab !== "preview" && activeTab !== "chat" && activeTab !== "content" && activeTab !== "domain" ? "hidden" : "flex"} min-w-0 flex-col bg-[#11121b]`}>
          <div className="flex h-14 items-center justify-between border-b border-white/8 px-3 sm:px-5"><div className="flex gap-1"><button onClick={() => setPreviewMobile(false)} className={`rounded-lg px-3 py-2 text-[10px] font-black ${!previewMobile ? "bg-white/10" : "text-white/35"}`}>Masaüstü</button><button onClick={() => setPreviewMobile(true)} className={`rounded-lg px-3 py-2 text-[10px] font-black ${previewMobile ? "bg-white/10" : "text-white/35"}`}>Mobil</button></div><button onClick={() => setActiveTab("chat")} className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black text-white/55 lg:hidden">Sohbete dön</button></div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-2 sm:p-5 lg:p-8"><div className={`overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-[0_35px_100px_rgba(0,0,0,.42)] transition-all ${previewMobile ? "w-[390px] max-w-full" : "w-full max-w-[1120px]"}`}>{site ? <SitePreview site={site} compact /> : null}</div></div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-[#0d0e17]/94 p-2 backdrop-blur-xl lg:hidden">
        {(["chat", "preview", "content", "domain"] as StudioTab[]).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-xl py-2.5 text-[10px] font-black ${activeTab === tab ? "bg-white/10 text-white" : "text-white/35"}`}>{tab === "chat" ? "Sohbet" : tab === "preview" ? "Ön izleme" : tab === "content" ? "İçerik" : "Domain"}</button>)}
      </nav>

      <AnimatePresence>{showDecision ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] overflow-y-auto bg-black/78 p-3 backdrop-blur-xl sm:p-6"><div className="mx-auto flex min-h-full max-w-5xl items-center"><motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full rounded-[28px] border border-white/10 bg-[#13141e] p-5 shadow-2xl sm:rounded-[36px] sm:p-8"><div className="flex items-start justify-between"><div><p className="section-kicker">Ön izlemen hazır</p><h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Bundan sonra nasıl ilerleyelim?</h2></div><button onClick={() => setShowDecision(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/7 text-xl text-white/55">×</button></div><div className="mt-7 grid gap-3 lg:grid-cols-3">
        <DecisionCard badge="Aylık" title="Kendim yöneteyim" text="İçerik, hizmet, fiyat, görsel ve domain kontrolleri kendi panelinde olsun." action="Aylık yönetime geç" onClick={() => chooseManagement("monthly")} featured />
        <DecisionCard badge="Yıllık" title="SiteMix kursun" text="Yıllık kurulum isteğin proje özetiyle doğrudan SiteMix ekibine ulaşsın." action="WhatsApp’tan gönder" onClick={() => chooseManagement("yearly")} />
        <DecisionCard badge="Özel destek" title="SiteMix yönetsin" text="Güncellemeler ve özel sektör ihtiyaçları için tüm süreci bize bırak." action="Ekibe yönlendir" onClick={() => chooseManagement("managed")} />
      </div></motion.div></div></motion.div> : null}</AnimatePresence>
    </main>
  );
}

function EditorField({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-black text-white/45">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-white/8 bg-white/[0.045] px-3 text-sm font-bold text-white outline-none placeholder:text-white/22 focus:border-white/18" /></label>;
}

function DecisionCard({ badge, title, text, action, onClick, featured = false }: { badge: string; title: string; text: string; action: string; onClick: () => void; featured?: boolean }) {
  return <article className={`flex min-h-[285px] flex-col rounded-[24px] border p-6 ${featured ? "border-[#86f2d1]/35 bg-[#86f2d1]/[0.07]" : "border-white/8 bg-white/[0.035]"}`}><span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8ef1d4]">{badge}</span><h3 className="mt-7 text-2xl font-black tracking-[-0.045em]">{title}</h3><p className="mt-4 text-sm font-medium leading-7 text-white/45">{text}</p><button type="button" onClick={onClick} className={`mt-auto min-h-12 rounded-full px-4 text-sm font-black ${featured ? "send-button text-[#0a0b13]" : "bg-white text-[#11121b]"}`}>{action}</button></article>;
}
