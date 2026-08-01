"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SitePreview from "@/app/_components/SitePreview";
import { applyStudioInstruction, describeStudioChanges, generateStudioSite, slugify, suggestStudioInstructions, type StudioProject, type StudioSite } from "@/lib/sitemixStudio";
import { advanceStudioConversation, composeStudioPrompt, emptyStudioBrief, getBriefProgress, type StudioBrief } from "@/lib/studioConversation";
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
  const [brief, setBrief] = useState<StudioBrief>(() => ({ ...emptyStudioBrief, services: [], notes: [] }));
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [editSuggestions, setEditSuggestions] = useState<string[]>([]);
  const [pendingContactMode, setPendingContactMode] = useState<"both" | "whatsapp" | "phone" | null>(null);
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

  async function openProject(projectId: string, token = accessToken) {
    const response = await fetch(`/api/studio/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.project) {
      setNotice(result?.message || "Proje açılamadı.");
      return;
    }
    setProject(result.project);
    setMessages((result.messages || []).map((message: { id: string; role: "user" | "assistant"; content: string }) => ({ id: message.id, role: message.role, content: message.content })));
    setEditSuggestions(suggestStudioInstructions(result.project.current_version as StudioSite));
    setActiveTab("chat");
  }

  async function loadProjects(token: string) {
    const response = await fetch("/api/studio/projects", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (response.ok) {
      setProjects(result.projects || []);
      const requestedId = new URLSearchParams(window.location.search).get("project");
      const requestedProject = (result.projects || []).find((item: StudioProject) => item.id === requestedId);
      const selectedProject = requestedProject || result.projects?.[0];
      if (!project && selectedProject) await openProject(selectedProject.id, token);
      return (result.projects || []) as StudioProject[];
    }
    if (!result?.setupRequired) setNotice(result?.message || "Projeler alınamadı.");
    return [] as StudioProject[];
  }

  async function createProject(prompt: string, token: string, conversation: ChatMessage[] = []) {
    if (!prompt || createdPromptRef.current === prompt) return;
    createdPromptRef.current = prompt;
    setBusy(true);
    setQuickReplies([]);
    const localProject = makeLocalProject(prompt);
    setProject(localProject);
    setEditSuggestions(suggestStudioInstructions(localProject.current_version));

    try {
      const response = await fetch("/api/studio/projects", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, conversation }),
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
        setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: "İlk taslak hazır. Şimdi ön izlemede gezebilir; renk, bölüm, içerik veya sayfa yapısını konuşarak değiştirebilirsin." }]);
        setBusy(false);
      }, 650);
    }
  }

  function welcomeToDiscovery() {
    const seed: StudioBrief = { ...emptyStudioBrief, services: [], notes: [] };
    const result = advanceStudioConversation(seed, "merhaba");
    setBrief(result.brief);
    setMessages([{ id: `a-${Date.now()}`, role: "assistant", content: result.reply }]);
    setQuickReplies(result.quickReplies);
  }

  async function continueDiscovery(rawValue: string, token = accessToken) {
    const value = rawValue.trim();
    if (!value || busy) return;

    if (/bir bilgiyi değiştir/i.test(value) && getBriefProgress(brief) === 100) {
      const nextMessages: ChatMessage[] = [
        ...messages,
        { id: `u-${Date.now()}`, role: "user", content: value },
        { id: `a-${Date.now() + 1}`, role: "assistant", content: "Elbette. Değiştirmek istediğin bilgiyi doğal biçimde yazabilirsin. Örneğin “işletme adı Luna olsun” veya “site koyu ve modern olsun” demen yeterli." },
      ];
      setMessages(nextMessages);
      setQuickReplies(["İşletme adını değiştireceğim", "Konumu değiştireceğim", "Numarayı değiştireceğim", "Tarzı değiştireceğim", "Sayfa yapısını değiştireceğim"]);
      return;
    }

    const result = advanceStudioConversation(brief, value);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: `u-${Date.now()}`, role: "user", content: value },
      { id: `a-${Date.now() + 1}`, role: "assistant", content: result.reply },
    ];
    setBrief(result.brief);
    setMessages(nextMessages);
    setQuickReplies(result.quickReplies);
    setInput("");

    if (result.shouldBuild && token) {
      await createProject(composeStudioPrompt(result.brief), token, nextMessages);
    }
  }

  function sendDiscovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void continueDiscovery(input);
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
      const pending = window.sessionStorage.getItem("sitemix_pending_prompt") || window.localStorage.getItem("sitemix_pending_prompt_backup") || "";
      if (pending) {
        window.sessionStorage.removeItem("sitemix_pending_prompt");
        window.localStorage.removeItem("sitemix_pending_prompt_backup");
        const seed: StudioBrief = { ...emptyStudioBrief, services: [], notes: [] };
        const result = advanceStudioConversation(seed, pending);
        const firstMessages: ChatMessage[] = [
          { id: "u-first", role: "user", content: pending },
          { id: "a-first", role: "assistant", content: result.reply },
        ];
        setBrief(result.brief);
        setMessages(firstMessages);
        setQuickReplies(result.quickReplies);
        if (result.shouldBuild) await createProject(composeStudioPrompt(result.brief), token, firstMessages);
      } else {
        const loadedProjects = await loadProjects(token);
        if (!loadedProjects.length) welcomeToDiscovery();
      }
    }
    boot();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runInstruction(rawInstruction: string) {
    const visibleInstruction = rawInstruction.trim();
    if (!visibleInstruction || !project || !site || busy) return;
    const normalizedInstruction = visibleInstruction.toLocaleLowerCase("tr-TR");
    const contactNumber = visibleInstruction.match(/\+?[\d\s()-]{10,22}/)?.[0]?.trim();

    if (pendingContactMode && !contactNumber) {
      const selectedMode = /telefon.*whatsapp.*aynı|aynı numara/.test(normalizedInstruction)
        ? "both"
        : /sadece whatsapp/.test(normalizedInstruction)
          ? "whatsapp"
          : /sadece telefon/.test(normalizedInstruction)
            ? "phone"
            : pendingContactMode;
      setPendingContactMode(selectedMode);
      setInput("");
      setEditSuggestions([]);
      setMessages((current) => [
        ...current,
        { id: `u-${Date.now()}`, role: "user", content: visibleInstruction },
        { id: `a-${Date.now() + 1}`, role: "assistant", content: `${selectedMode === "both" ? "Telefon ve WhatsApp" : selectedMode === "whatsapp" ? "WhatsApp" : "Telefon"} numaranı yazabilir misin? Örnek: 0555 555 55 55` },
      ]);
      return;
    }

    let instruction = visibleInstruction;
    if (pendingContactMode && contactNumber) {
      instruction = pendingContactMode === "both"
        ? `Telefon: ${contactNumber}. WhatsApp: ${contactNumber}`
        : pendingContactMode === "whatsapp"
          ? `WhatsApp: ${contactNumber}`
          : `Telefon: ${contactNumber}`;
      setPendingContactMode(null);
    }
    setInput("");
    setEditSuggestions([]);
    setBusy(true);
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", content: visibleInstruction }]);
    const localSite = applyStudioInstruction(site, instruction);
    const understoodChanges = describeStudioChanges(site, localSite);
    if (!understoodChanges.length) {
      if (/(whatsapp|telefon|numara)/.test(normalizedInstruction) && !contactNumber) {
        const mode = /whatsapp/.test(normalizedInstruction) && !/telefon/.test(normalizedInstruction) ? "whatsapp" : /telefon/.test(normalizedInstruction) && !/whatsapp/.test(normalizedInstruction) ? "phone" : "both";
        setPendingContactMode(mode);
        setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: "Elbette. Hangi iletişim bilgisini ekleyelim? Bir seçeneğe dokun; ardından numaranı yazmanı isteyeceğim." }]);
        setEditSuggestions(["Telefon ve WhatsApp aynı", "Sadece WhatsApp", "Sadece telefon"]);
        setBusy(false);
        return;
      }
      const suggestions = suggestStudioInstructions(site, instruction);
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: "Ne yapmak istediğini tam eşleştiremedim. Aşağıdakilerden birini mi demek istedin? Bir seçeneğe dokunabilir veya isteğini biraz daha ayrıntılı yazabilirsin." }]);
      setEditSuggestions(suggestions);
      setBusy(false);
      return;
    }
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
        setProjects((current) => current.map((item) => item.id === result.project.id ? result.project : item));
      }
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: `Güncelledim: ${understoodChanges.join(", ")}. Ön izleme şimdi yeni kararlarını gösteriyor. Başka neyi değiştirelim?` }]);
      setEditSuggestions(suggestStudioInstructions(localSite));
      if (window.innerWidth < 1024) setActiveTab("preview");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Değişiklik ön izlemeye uygulandı.");
    } finally {
      setBusy(false);
    }
  }

  function sendInstruction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runInstruction(input);
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
      setProjects((current) => current.map((item) => item.id === result.project.id ? result.project : item));
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
    const progress = getBriefProgress(brief);
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#080910] text-white">
        <div className="pointer-events-none absolute -left-48 top-10 h-[520px] w-[520px] rounded-full bg-[#684cf0]/15 blur-[130px]" />
        <div className="pointer-events-none absolute -right-48 bottom-0 h-[520px] w-[520px] rounded-full bg-[#4fe0b1]/10 blur-[140px]" />

        <header className="relative z-20 border-b border-white/7 bg-[#090a12]/78 backdrop-blur-2xl">
          <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between px-4 sm:px-7">
            <Link href="/" className="flex items-center gap-3"><span className="brand-orb"><span>S</span></span><div><strong className="block text-sm font-black">SiteMix Studio</strong><span className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">Site görüşmesi</span></div></Link>
            <div className="flex items-center gap-2"><span className="hidden text-[11px] font-bold text-white/30 sm:block">{userEmail}</span><button onClick={signOut} className="rounded-full border border-white/9 bg-white/[0.025] px-4 py-2.5 text-[11px] font-black text-white/50 transition hover:bg-white/7 hover:text-white">Çıkış</button></div>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-[1380px] gap-5 px-3 py-4 sm:px-7 sm:py-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="flex min-h-[calc(100svh-112px)] flex-col overflow-hidden rounded-[26px] border border-white/9 bg-[#0e0f18]/92 shadow-[0_30px_100px_rgba(0,0,0,.38)] sm:rounded-[32px]">
            <div className="border-b border-white/7 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-[#9484ff]">Akıllı site brifi</p><h1 className="mt-1.5 text-xl font-black tracking-[-.035em] sm:text-2xl">İşletmeni birlikte tanıyalım.</h1></div><div className="shrink-0 text-right"><strong className="block text-lg font-black text-[#8ff3d2]">%{progress}</strong><span className="text-[9px] font-bold uppercase tracking-[.12em] text-white/25">Hazır</span></div></div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/6"><motion.div animate={{ width: `${Math.max(progress, 4)}%` }} className="h-full rounded-full bg-gradient-to-r from-[#755cff] via-[#9c83ff] to-[#75efc7]" /></div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
              {messages.map((message) => (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" ? <span className="brand-orb mt-1 !h-8 !w-8 !shrink-0 !rounded-[11px] !text-[11px]"><span>S</span></span> : null}
                  <div className={`max-w-[88%] whitespace-pre-line rounded-[20px] px-4 py-3.5 text-sm font-semibold leading-6 sm:max-w-[72%] ${message.role === "user" ? "rounded-br-md bg-gradient-to-br from-[#765cff] to-[#5a43d4] text-white shadow-[0_12px_30px_rgba(73,51,171,.22)]" : "rounded-bl-md border border-white/8 bg-white/[0.035] text-white/68"}`}>{message.content}</div>
                </motion.div>
              ))}
              {busy ? <div className="ml-11 inline-flex gap-1 rounded-full border border-white/7 bg-white/[0.035] px-4 py-3"><span className="dot-typing" /><span className="dot-typing" /><span className="dot-typing" /></div> : null}
            </div>

            <div className="border-t border-white/7 bg-[#0b0c14]/90 p-3 sm:p-4">
              {quickReplies.length ? <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{quickReplies.map((reply) => <button key={reply} type="button" onClick={() => void continueDiscovery(reply)} disabled={busy} className="shrink-0 rounded-full border border-white/9 bg-white/[0.035] px-4 py-2.5 text-[11px] font-black text-white/55 transition hover:border-[#8f7cff]/35 hover:bg-[#8f7cff]/10 hover:text-white disabled:opacity-40">{reply}</button>)}</div> : null}
              <form onSubmit={sendDiscovery} className="flex items-end gap-2 rounded-[20px] border border-white/9 bg-white/[0.035] p-2 focus-within:border-[#8c79ff]/35 focus-within:bg-white/[0.05]">
                <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (input.trim()) void continueDiscovery(input); } }} rows={2} maxLength={1200} placeholder="Cevabını doğal bir şekilde yaz..." className="min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/22" />
                <button disabled={!input.trim() || busy} className="send-button grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-black text-[#090a12] disabled:opacity-30" aria-label="Yanıtı gönder">↑</button>
              </form>
              <p className="mt-2 px-2 text-[9px] font-medium text-white/20">SiteMix cevaplarını bu proje için hatırlar; taslak yalnızca sen onayladığında oluşturulur.</p>
            </div>
          </section>

          <aside className="hidden lg:block">
            <div className="sticky top-[100px] overflow-hidden rounded-[28px] border border-white/9 bg-[#0e0f18]/92 p-5 shadow-[0_25px_80px_rgba(0,0,0,.28)]">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/28">Canlı proje hafızası</p><h2 className="mt-2 text-2xl font-black tracking-[-.045em]">Seni anladıkça dolar.</h2></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#8f7cff]/12 text-lg font-black text-[#a99cff]">{brief.businessName ? brief.businessName.charAt(0) : "S"}</span></div>
              <p className="mt-3 text-xs font-medium leading-6 text-white/35">Her cevabın tasarım kararına dönüşür. Eksik bilgi varken rastgele site üretmeyiz.</p>

              <div className="mt-6 space-y-2">
                <BriefMemory label="Sektör" value={brief.sectorLabel} />
                <BriefMemory label="İşletme" value={brief.businessName} />
                <BriefMemory label="Konum" value={brief.location} />
                <BriefMemory label="Hizmetler" value={brief.services.length ? brief.services.join(", ") : undefined} />
                <BriefMemory label="Ana hedef" value={brief.goal} />
                <BriefMemory label="Telefon / WhatsApp" value={brief.whatsapp || brief.phone || (brief.contactSkipped ? "Daha sonra eklenecek" : undefined)} />
                <BriefMemory label="Görsel tarz" value={brief.style} />
                <BriefMemory label="Sayfa yapısı" value={brief.pageMode ? (brief.pageMode === "multi" ? "Çok sayfalı" : "Tek sayfalı") : undefined} />
              </div>

              <div className="mt-5 rounded-2xl border border-[#7ce8c5]/12 bg-[#7ce8c5]/[0.055] p-4"><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-[#8ff3d2]"><span className="h-1.5 w-1.5 rounded-full bg-[#8ff3d2]" />Kontrollü üretim</p><p className="mt-2 text-[11px] font-medium leading-5 text-white/38">Bilgileri istediğin an düzeltebilirsin. Ön izleme açılmadan önce senden son onay alınır.</p></div>
            </div>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="studio-app min-h-screen bg-[#090a12] text-white">
      <header className="sticky top-0 z-50 flex h-[68px] items-center justify-between border-b border-white/8 bg-[#0b0c14]/88 px-3 backdrop-blur-2xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3"><Link href="/" className="brand-orb !h-10 !w-10 !rounded-[13px]"><span>S</span></Link><div className="min-w-0">{projects.length > 1 ? <select value={project.id} onChange={(event) => void openProject(event.target.value)} className="max-w-[180px] bg-transparent text-sm font-black text-white outline-none sm:max-w-[260px]">{projects.map((item) => <option key={item.id} value={item.id} className="bg-[#11121b]">{item.title}</option>)}</select> : <p className="truncate text-sm font-black">{site?.businessName}</p>}<p className="truncate text-[10px] font-bold text-white/32">{project.status === "published" ? "Yayında" : "Taslak"} · {site?.sector}</p></div></div>
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
            <form onSubmit={sendInstruction} className="border-t border-white/8 p-3">{editSuggestions.length ? <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{editSuggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void runInstruction(suggestion)} disabled={busy} className="shrink-0 rounded-full border border-[#8e7bff]/20 bg-[#8e7bff]/8 px-3.5 py-2 text-[10px] font-black text-[#b7adff] transition hover:bg-[#8e7bff]/15 disabled:opacity-40">{suggestion}</button>)}</div> : null}<textarea value={input} onChange={(event) => setInput(event.target.value)} rows={3} placeholder="Örn. Başlığı ortaya al, kısalt ve girişi daha premium yap..." className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.045] p-4 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/24 focus:border-white/18" /><button disabled={!input.trim() || busy} className="send-button mt-2 min-h-12 w-full rounded-full text-sm font-black text-[#0a0b13] disabled:opacity-40">İsteği uygula</button></form></>
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

function BriefMemory({ label, value }: { label: string; value?: string }) {
  return <div className={`rounded-2xl border px-4 py-3.5 ${value ? "border-white/8 bg-white/[0.035]" : "border-dashed border-white/7 bg-transparent"}`}><div className="flex items-center justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[.13em] text-white/27">{label}</span><span className={`h-1.5 w-1.5 rounded-full ${value ? "bg-[#7ce8c5] shadow-[0_0_10px_#7ce8c5]" : "bg-white/12"}`} /></div><p className={`mt-1.5 line-clamp-2 text-xs font-bold leading-5 ${value ? "text-white/68" : "text-white/18"}`}>{value || "Henüz öğrenilmedi"}</p></div>;
}

function DecisionCard({ badge, title, text, action, onClick, featured = false }: { badge: string; title: string; text: string; action: string; onClick: () => void; featured?: boolean }) {
  return <article className={`flex min-h-[285px] flex-col rounded-[24px] border p-6 ${featured ? "border-[#86f2d1]/35 bg-[#86f2d1]/[0.07]" : "border-white/8 bg-white/[0.035]"}`}><span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8ef1d4]">{badge}</span><h3 className="mt-7 text-2xl font-black tracking-[-0.045em]">{title}</h3><p className="mt-4 text-sm font-medium leading-7 text-white/45">{text}</p><button type="button" onClick={onClick} className={`mt-auto min-h-12 rounded-full px-4 text-sm font-black ${featured ? "send-button text-[#0a0b13]" : "bg-white text-[#11121b]"}`}>{action}</button></article>;
}
