"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TextareaAutosize from "react-textarea-autosize";
import {
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDot,
  ExternalLink,
  FileText,
  Globe2,
  ImagePlus,
  Laptop,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Palette,
  Plus,
  Rocket,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";
import SitePreview from "@/app/_components/SitePreview";
import { applyStudioInstruction, describeStudioChanges, generateStudioSite, getStudioVisualPrompt, slugify, suggestStudioInstructions, type StudioProject, type StudioSite } from "@/lib/sitemixStudio";
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
  const [mediaBusy, setMediaBusy] = useState<"hero" | "logo" | "about" | "service" | "gallery" | null>(null);
  const [domainResult, setDomainResult] = useState<{ status: string; message: string; records?: Array<{ type: string; name: string; value: string }> } | null>(null);
  const createdPromptRef = useRef("");

  const site = project?.current_version || null;
  const isTemporaryPreview = Boolean(project && !project.management_mode);
  const previewDaysLeft = project?.created_at
    ? Math.max(0, Math.ceil((new Date(project.created_at).getTime() + 7 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)))
    : 7;

  async function authorizedFetch(url: string, init?: RequestInit) {
    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${accessToken}`,
        ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
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
        setNotice("Geçici ön izlemen hazır. Paket seçilmezse 7 gün sonra otomatik silinir.");
      } else if (result?.setupRequired) {
        setNotice("Ön izlemen hazır. Veritabanı kurulumu tamamlanınca geçici olarak hesabına bağlanacak.");
      } else {
        throw new Error(result?.message || "Proje kaydedilemedi.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Taslak yerel olarak hazırlandı.");
    } finally {
      window.setTimeout(() => {
        setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: `İlk ön izlemen hazır. ${localProject.current_version.pageMode === "multi" ? "Ana sayfa, hakkımızda, hizmetler, çalışmalar ve iletişim sayfalarını ayrı ayrı hazırladım." : "Bölümleri tek ve akıcı bir sayfada topladım."} Şimdi metinleri, bölüm sırasını ve görünümü konuşarak değiştirebilir; ana ekran, hakkımızda, hizmet ve galeri görsellerini ayrı alanlara ekleyebilirsin.` }]);
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

  function updateSection(index: number, patch: Partial<StudioSite["sections"][number]>) {
    if (!project || !site) return;
    const sections = site.sections.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...patch } : section);
    setProject({ ...project, current_version: { ...site, sections } });
  }

  function moveSection(index: number, direction: -1 | 1) {
    if (!project || !site) return;
    const target = index + direction;
    if (target < 0 || target >= site.sections.length) return;
    const sections = [...site.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setProject({ ...project, current_version: { ...site, sections } });
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

  async function uploadMedia(file: File, slot: "hero" | "logo" | "about" | "service" | "gallery") {
    if (!project || !site || project.id.startsWith("local-")) {
      setNotice("Görsel yüklemek için projenin hesabına kaydedilmesi gerekiyor.");
      return;
    }
    setMediaBusy(slot);
    try {
      const form = new FormData();
      form.set("projectId", project.id);
      form.set("slot", slot);
      form.set("file", file);
      const response = await authorizedFetch("/api/studio/media", { method: "POST", body: form });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.url) throw new Error(result?.message || "Görsel yüklenemedi.");
      const nextMedia = {
        ...(site.media || {}),
        ...(slot === "gallery"
          ? { gallery: [...(site.media?.gallery || []), result.url].slice(0, 12) }
          : slot === "service"
            ? { services: [...(site.media?.services || []), result.url].slice(0, 12) }
          : { [slot]: result.url }),
      };
      const nextSite = { ...site, media: nextMedia };
      setProject({ ...project, current_version: nextSite });
      const saveResponse = await authorizedFetch(`/api/studio/projects/${project.id}`, { method: "PATCH", body: JSON.stringify({ action: "save", site: nextSite }) });
      const saveResult = await saveResponse.json().catch(() => null);
      if (!saveResponse.ok) throw new Error(saveResult?.message || "Görsel siteye kaydedilemedi.");
      setProject(saveResult.project);
      setNotice(slot === "gallery" ? "Görsel galeriye eklendi." : slot === "service" ? "Hizmet görseli eklendi." : slot === "about" ? "Hakkımızda görseli güncellendi." : slot === "hero" ? "Ana ekran görseli güncellendi." : "Logo güncellendi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    } finally {
      setMediaBusy(null);
    }
  }

  function removeMedia(slot: "hero" | "logo" | "about" | "service" | "gallery", index?: number) {
    if (!project || !site) return;
    const media = { ...(site.media || {}) };
    if (slot === "gallery") media.gallery = (media.gallery || []).filter((_, itemIndex) => itemIndex !== index);
    else if (slot === "service") media.services = (media.services || []).filter((_, itemIndex) => itemIndex !== index);
    else delete media[slot];
    setProject({ ...project, current_version: { ...site, media } });
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
      const response = await authorizedFetch(`/api/studio/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "management",
          mode,
          summary: { businessName: site.businessName, sector: site.sector, pageMode: site.pageMode, email: userEmail },
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setNotice(result?.message || "Paket tercihi kaydedilemedi.");
        return;
      }
      if (result?.project) {
        setProject(result.project);
        setProjects((current) => current.map((item) => item.id === result.project.id ? result.project : item));
      }
    } else {
      setProject({ ...project, management_mode: mode, status: mode === "monthly" ? "ready" : "request_received" });
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
            <div className="flex items-center gap-2"><span className="hidden text-[11px] font-bold text-white/30 sm:block">{userEmail}</span><button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-white/9 bg-white/[0.025] px-4 py-2.5 text-[11px] font-black text-white/50 transition hover:bg-white/7 hover:text-white"><LogOut size={13} />Çıkış</button></div>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-[1540px] gap-5 px-3 py-4 sm:px-7 sm:py-7 xl:grid-cols-[230px_minmax(0,1fr)_350px]">
          <aside className="hidden xl:block">
            <div className="sticky top-[100px] space-y-4">
              <div className="rounded-[26px] border border-white/8 bg-[#0d0e17]/88 p-4 shadow-[0_22px_70px_rgba(0,0,0,.22)] backdrop-blur-xl">
                <div className="flex items-center gap-3 border-b border-white/7 pb-4"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8f7cff]/12 text-[#b2a7ff]"><LayoutGrid size={18} /></span><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-white/25">Proje akışı</p><strong className="text-xs text-white/75">Yeni web sitesi</strong></div></div>
                <div className="mt-4 space-y-1">
                  <DiscoveryStep index="01" title="İşletmeni tanı" active={progress < 65} done={progress >= 65} />
                  <DiscoveryStep index="02" title="Tasarımı belirle" active={progress >= 65 && progress < 100} done={progress === 100} />
                  <DiscoveryStep index="03" title="Canlı ön izleme" active={false} done={false} />
                  <DiscoveryStep index="04" title="Yönetim ve yayın" active={false} done={false} />
                </div>
              </div>
              <div className="rounded-[24px] border border-[#78ebc8]/12 bg-[#78ebc8]/[0.045] p-4"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-[#8bf1d2]"><Sparkles size={13} /> Akıllı öneri</div><p className="mt-3 text-[11px] font-medium leading-5 text-white/38">Kısa cevap verebilirsin. Eksik kalan noktalar için sana seçenekler sunacağım.</p></div>
            </div>
          </aside>
          <section className="flex min-h-[calc(100svh-112px)] flex-col overflow-hidden rounded-[26px] border border-white/9 bg-[#0e0f18]/92 shadow-[0_30px_100px_rgba(0,0,0,.38)] sm:rounded-[32px]">
            <div className="relative overflow-hidden border-b border-white/7 px-4 py-4 sm:px-6 sm:py-5">
              <div className="pointer-events-none absolute -right-10 -top-20 h-44 w-44 rounded-full bg-[#7a61ff]/10 blur-3xl" />
              <div className="relative flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="studio-avatar studio-avatar-assistant !h-11 !w-11"><WandSparkles size={18} /></span><div><div className="flex items-center gap-2"><p className="text-[10px] font-black uppercase tracking-[.17em] text-[#a598ff]">SiteMix tasarım görüşmesi</p><span className="hidden rounded-full border border-[#7ee9c7]/15 bg-[#7ee9c7]/[0.055] px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] text-[#8ff0d2] sm:inline-flex">Canlı</span></div><h1 className="mt-1.5 text-xl font-black tracking-[-.035em] sm:text-2xl">İşletmeni birlikte tanıyalım.</h1></div></div><div className="shrink-0 rounded-2xl border border-white/7 bg-white/[0.025] px-3.5 py-2.5 text-right"><strong className="block text-lg font-black text-[#8ff3d2]">%{progress}</strong><span className="text-[8px] font-bold uppercase tracking-[.12em] text-white/25">Brif hazır</span></div></div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/6"><motion.div animate={{ width: `${Math.max(progress, 4)}%` }} className="h-full rounded-full bg-gradient-to-r from-[#755cff] via-[#9c83ff] to-[#75efc7]" /></div>
            </div>

            <div className="studio-conversation flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6 sm:py-7">
              {messages.map((message) => <ConversationMessage key={message.id} message={message} />)}
              {busy ? <div className="ml-11 inline-flex gap-1 rounded-full border border-white/7 bg-white/[0.035] px-4 py-3"><span className="dot-typing" /><span className="dot-typing" /><span className="dot-typing" /></div> : null}
            </div>

            <div className="border-t border-white/7 bg-[#090a12]/95 p-3 sm:p-4">
              {quickReplies.length ? <div className="mb-3"><div className="mb-2 flex items-center gap-2 px-1 text-[9px] font-black uppercase tracking-[.14em] text-white/25"><Sparkles size={11} className="text-[#9d90ff]" /> Hazır cevaplar</div><PromptSuggestions items={quickReplies} onSelect={(reply) => void continueDiscovery(reply)} busy={busy} compact /></div> : null}
              <StudioComposer value={input} onChange={setInput} onSubmit={sendDiscovery} busy={busy} label="Cevabını yaz" placeholder="İşletmen hakkında doğal bir şekilde yaz..." />
            </div>
          </section>

          <aside className="hidden xl:block">
            <div className="sticky top-[100px] overflow-hidden rounded-[28px] border border-white/9 bg-[#0e0f18]/92 p-5 shadow-[0_25px_80px_rgba(0,0,0,.28)]">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/28">Canlı proje hafızası</p><h2 className="mt-2 text-2xl font-black tracking-[-.045em]">Seni anladıkça dolar.</h2></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#8f7cff]/12 text-lg font-black text-[#a99cff]">{brief.businessName ? brief.businessName.charAt(0) : "S"}</span></div>
              <p className="mt-3 text-xs font-medium leading-6 text-white/35">Her cevabın tasarım kararına dönüşür. Eksik bilgi varken rastgele site üretmeyiz.</p>

              <div className="mt-6 space-y-2">
                <BriefMemory label="Sektör" value={brief.sectorLabel} />
                <BriefMemory label="İşletme" value={brief.businessName} />
                <BriefMemory label="Konum" value={brief.location} />
                <BriefMemory label="Hizmetler" value={brief.services.length ? brief.services.join(", ") : undefined} />
                <BriefMemory label="Neden tercih edilmeli" value={brief.businessDetails} />
                <BriefMemory label="Ana hedef" value={brief.goal} />
                <BriefMemory label="Telefon / WhatsApp" value={brief.whatsapp || brief.phone || (brief.contactSkipped ? "Daha sonra eklenecek" : undefined)} />
                <BriefMemory label="Görsel tarz" value={brief.style} />
                <BriefMemory label="Fotoğraflar" value={brief.photoPreference === "upload" ? "Taslak açılınca yüklenecek" : brief.photoPreference === "later" ? "Daha sonra eklenecek" : brief.photoPreference === "placeholder" ? "Alanlar hazır bırakılacak" : undefined} />
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
      <header className="sticky top-0 z-50 flex h-[72px] items-center justify-between border-b border-white/8 bg-[#090a12]/90 px-3 backdrop-blur-2xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3"><Link href="/" className="brand-orb !h-10 !w-10 !rounded-[13px]"><span>S</span></Link><div className="hidden h-7 w-px bg-white/8 sm:block" /><div className="min-w-0"><div className="flex items-center gap-2">{projects.length > 1 ? <select value={project.id} onChange={(event) => void openProject(event.target.value)} className="max-w-[180px] bg-transparent text-sm font-black text-white outline-none sm:max-w-[260px]">{projects.map((item) => <option key={item.id} value={item.id} className="bg-[#11121b]">{item.title}</option>)}</select> : <p className="truncate text-sm font-black">{site?.businessName}</p>}<span className="hidden rounded-full border border-white/8 bg-white/[0.035] px-2 py-1 text-[8px] font-black uppercase tracking-[.11em] text-white/32 sm:inline-flex">Studio</span></div><p className="flex items-center gap-1.5 truncate text-[10px] font-bold text-white/32"><span className={`h-1.5 w-1.5 rounded-full ${project.status === "published" ? "bg-[#79ecc9]" : "bg-[#f0bd72]"}`} />{project.status === "published" ? "Yayında" : isTemporaryPreview ? "Geçici ön izleme" : "Yayına hazırlanıyor"} · {site?.sector}</p></div></div>
        <div className="flex items-center gap-2">
          <Link href="/" className="hidden h-10 items-center gap-2 rounded-full border border-white/9 bg-white/[0.025] px-4 text-[11px] font-black text-white/48 transition hover:bg-white/[0.06] hover:text-white md:inline-flex"><Plus size={14} /> Yeni site</Link>
          <a href={projectUrl} target="_blank" className="hidden h-10 items-center gap-2 rounded-full border border-white/9 bg-white/[0.025] px-4 text-[11px] font-black text-white/48 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex"><ExternalLink size={14} /> Ön izleme</a>
          <button type="button" onClick={signOut} className="grid h-10 w-10 place-items-center rounded-full border border-white/9 bg-white/[0.025] text-white/42 transition hover:bg-white/[0.06] hover:text-white" aria-label="Çıkış yap"><LogOut size={15} /></button>
          <button type="button" onClick={() => setShowDecision(true)} className="send-button inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-black text-[#0a0b13] sm:px-5"><Rocket size={14} /> <span className="hidden sm:inline">Yayınlamaya geç</span><span className="sm:hidden">Devam</span></button>
        </div>
      </header>

      {isTemporaryPreview ? <div className="relative z-40 flex min-h-10 items-center justify-center gap-3 border-b border-amber-300/15 bg-amber-300/[0.07] px-3 py-2 text-center text-[10px] font-bold text-amber-100/72"><span className="hidden h-1.5 w-1.5 rounded-full bg-amber-300 sm:block" /><span>Bu geçici bir ön izlemedir. Google’da görünür olmak ve siteni korumak için paket seçmelisin. Paket seçilmezse {previewDaysLeft} gün içinde silinir.</span><button type="button" onClick={() => setShowDecision(true)} className="shrink-0 rounded-full border border-amber-200/20 bg-amber-100/10 px-3 py-1.5 text-[9px] font-black text-amber-100">Paket seç</button></div> : null}

      {notice ? <div className="fixed left-1/2 top-[78px] z-[70] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1a1b28]/95 px-4 py-3 text-center text-xs font-bold text-white/70 shadow-2xl backdrop-blur-xl" onClick={() => setNotice("")}>{notice}</div> : null}

      <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[440px_1fr] xl:grid-cols-[470px_1fr]">
        <aside className={`${activeTab === "preview" ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-white/8 bg-[#0d0e17]`}>
          <div className="border-b border-white/8 px-3 pb-3 pt-4">
            <div className="mb-3 flex items-center justify-between px-1"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#9f91ff]">Proje çalışma alanı</p><p className="mt-1 text-[11px] font-semibold text-white/28">Konuş, düzenle ve anında gör</p></div><span className="grid h-9 w-9 place-items-center rounded-xl border border-[#82ebca]/12 bg-[#82ebca]/[0.05] text-[#82ebca]"><Sparkles size={15} /></span></div>
            <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/7 bg-black/15 p-1">
              {([{ id: "chat", label: "Sohbet", icon: MessageCircle }, { id: "content", label: "İçerik", icon: FileText }, { id: "domain", label: "Domain", icon: Globe2 }] as const).map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black transition ${activeTab === id ? "bg-white/9 text-white shadow-[0_8px_20px_rgba(0,0,0,.18)]" : "text-white/30 hover:text-white/55"}`}><Icon size={13} />{label}</button>)}
            </div>
          </div>

          {activeTab === "chat" ? (
            <><div className="studio-conversation flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              {messages.length === 0 ? <div className="studio-empty-state"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8f7cff]/12 text-[#b0a4ff]"><WandSparkles size={20} /></span><p className="mt-4 text-[10px] font-black uppercase tracking-[.15em] text-[#9f91ff]">Tasarım komut merkezi</p><h2 className="mt-2 text-xl font-black tracking-[-.04em]">Siteni yazarak yönet.</h2><p className="mt-2 text-xs font-medium leading-6 text-white/38">Renk, başlık, hareket, bölüm sırası, hizmetler veya sayfa yapısı için ne istediğini söyle.</p></div> : null}
              {!site?.media?.hero ? <button type="button" onClick={() => setActiveTab("content")} className="group flex w-full items-start gap-3 rounded-[22px] border border-[#7ce8c5]/14 bg-[#7ce8c5]/[0.045] p-4 text-left transition hover:bg-[#7ce8c5]/[0.075]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#7ce8c5]/10 text-[#89efd2]"><ImagePlus size={18} /></span><span className="flex-1"><span className="block text-[9px] font-black uppercase tracking-[.15em] text-[#89efd2]">Sıradaki güçlü adım</span><strong className="mt-1.5 block text-sm">Ana ekran için gerçek fotoğraf ekle</strong><span className="mt-1.5 block text-[10px] font-medium leading-5 text-white/35">{getStudioVisualPrompt(site as StudioSite)} sitenin güvenini ve kalitesini belirgin biçimde yükseltir.</span></span><ChevronRight size={16} className="mt-3 text-white/25 transition group-hover:translate-x-1 group-hover:text-white/60" /></button> : null}
              {messages.map((message) => <ConversationMessage key={message.id} message={message} />)}
              {busy ? <div className="inline-flex gap-1 rounded-full bg-white/6 px-4 py-3"><span className="dot-typing" /><span className="dot-typing" /><span className="dot-typing" /></div> : null}
            </div>
            <div className="border-t border-white/8 bg-[#090a12]/96 p-3"><div className="mb-3 flex items-center justify-between px-1"><span className="text-[9px] font-black uppercase tracking-[.15em] text-white/24">Önerilen düzenlemeler</span><span className="text-[9px] font-bold text-[#82ebca]/55">Ön izlemeye anında uygulanır</span></div><PromptSuggestions items={editSuggestions.slice(0, 4)} onSelect={(suggestion) => void runInstruction(suggestion)} busy={busy} compact /><div className={editSuggestions.length ? "mt-3" : ""}><StudioComposer value={input} onChange={setInput} onSubmit={sendInstruction} busy={busy} label="Tasarım komutu" placeholder="Başlığı kısalt, hizmetleri yukarı al, daha premium yap..." /></div></div></>
          ) : null}

          {activeTab === "content" && site ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.025] p-4"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8f7cff]/12 text-[#b1a5ff]"><Palette size={17} /></span><h2 className="mt-4 text-lg font-black tracking-[-.035em]">İçerik ve görünüm</h2><p className="mt-1.5 text-[11px] font-medium leading-5 text-white/32">Temel bilgileri elle düzenleyebilir veya sohbetten doğal dille değiştirebilirsin.</p></div>
              <div className="rounded-[22px] border border-[#78ebc8]/12 bg-[#78ebc8]/[0.035] p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#78ebc8]/10 text-[#86efd0]"><ImagePlus size={18} /></span><div><h3 className="text-sm font-black">Siten için gerçek görseller</h3><p className="mt-1.5 text-[11px] font-medium leading-5 text-white/38">{getStudioVisualPrompt(site)} yükle. Net, aydınlık ve mümkünse yatay görsel seç.</p></div></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <MediaUpload label={site.media?.hero ? "Ana görseli değiştir" : "Ana ekran görseli yükle"} busy={mediaBusy === "hero"} onFile={(file) => void uploadMedia(file, "hero")} />
                  <MediaUpload label={site.media?.logo ? "Logoyu değiştir" : "Logo yükle"} busy={mediaBusy === "logo"} onFile={(file) => void uploadMedia(file, "logo")} />
                  <MediaUpload label={site.media?.about ? "Hakkımızda görselini değiştir" : "Hakkımızda görseli yükle"} busy={mediaBusy === "about"} onFile={(file) => void uploadMedia(file, "about")} />
                  <MediaUpload label="Hizmet görseli ekle" busy={mediaBusy === "service"} onFile={(file) => void uploadMedia(file, "service")} />
                </div>
                {site.media?.hero ? <div className="relative mt-3 aspect-[16/7] overflow-hidden rounded-2xl border border-white/8 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top, rgba(5,6,8,.55), transparent), url("${site.media.hero}")` }}><button type="button" onClick={() => removeMedia("hero")} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white/70" aria-label="Ana görseli kaldır"><Trash2 size={13} /></button><span className="absolute bottom-3 left-3 text-[9px] font-black uppercase tracking-[.13em] text-white/70">Ana ekran görseli</span></div> : null}
                {site.media?.about ? <div className="relative mt-3 aspect-[16/7] overflow-hidden rounded-2xl border border-white/8 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top, rgba(5,6,8,.55), transparent), url("${site.media.about}")` }}><button type="button" onClick={() => removeMedia("about")} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white/70" aria-label="Hakkımızda görselini kaldır"><Trash2 size={13} /></button><span className="absolute bottom-3 left-3 text-[9px] font-black uppercase tracking-[.13em] text-white/70">Hakkımızda görseli</span></div> : null}
                <div className="mt-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black text-white/65">Hizmet görselleri</p><p className="mt-1 text-[9px] font-medium text-white/25">Sırayla hizmet kartlarına yerleştirilir</p></div><span className="text-[9px] font-black text-white/25">{site.media?.services?.length || 0}/12</span></div>
                {site.media?.services?.length ? <div className="mt-3 grid grid-cols-3 gap-2">{site.media.services.map((url, index) => <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-white/8 bg-cover bg-center" style={{ backgroundImage: `url("${url}")` }}><button type="button" onClick={() => removeMedia("service", index)} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/70" aria-label={`Hizmet görseli ${index + 1} kaldır`}><Trash2 size={12} /></button><span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/65 px-2 py-1 text-[8px] font-black">0{index + 1}</span></div>)}</div> : <div className="mt-3 rounded-2xl border border-dashed border-white/8 px-4 py-4 text-center text-[10px] font-bold text-white/22">Hizmet kartları şimdilik renkli görsel alanlarıyla gösterilecek.</div>}
                <div className="mt-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black text-white/65">Çalışma galerisi</p><p className="mt-1 text-[9px] font-medium text-white/25">En fazla 12 gerçek çalışma fotoğrafı</p></div><MediaUpload label="Galeriye ekle" busy={mediaBusy === "gallery"} onFile={(file) => void uploadMedia(file, "gallery")} compact /></div>
                {site.media?.gallery?.length ? <div className="mt-3 grid grid-cols-3 gap-2">{site.media.gallery.map((url, index) => <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-white/8 bg-cover bg-center" style={{ backgroundImage: `url("${url}")` }}><button type="button" onClick={() => removeMedia("gallery", index)} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/70 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100" aria-label={`Galeri görseli ${index + 1} kaldır`}><Trash2 size={12} /></button></div>)}</div> : <div className="mt-3 rounded-2xl border border-dashed border-white/8 px-4 py-5 text-center text-[10px] font-bold text-white/22">Henüz galeri görseli yüklenmedi.</div>}
              </div>
              <EditorField label="İşletme adı" value={site.businessName} onChange={(value) => updateSite({ businessName: value })} />
              <EditorField label="Konum" value={site.location} onChange={(value) => updateSite({ location: value })} />
              <EditorField label="Telefon" value={site.phone} onChange={(value) => updateSite({ phone: value })} />
              <EditorField label="WhatsApp" value={site.whatsapp} onChange={(value) => updateSite({ whatsapp: value })} />
              <label className="block"><span className="mb-2 block text-xs font-black text-white/45">Site yapısı</span><select value={site.pageMode} onChange={(event) => updateSite(event.target.value === "multi" ? applyStudioInstruction(site, "Siteyi çok sayfalı yap") : { pageMode: "single" })} className="h-12 w-full rounded-xl border border-white/8 bg-[#161722] px-3 text-sm font-bold text-white outline-none"><option value="single">Tek sayfalı</option><option value="multi">Çok sayfalı</option></select></label>
              <div><span className="mb-2 block text-xs font-black text-white/45">Ana renk</span><div className="flex gap-2">{["#7c5cff", "#0eac83", "#3478f6", "#f0528a", "#e65f3d", "#df9f45"].map((color) => <button key={color} type="button" onClick={() => updateSite({ theme: { ...site.theme, accent: color } })} className="h-9 w-9 rounded-full border-2" style={{ background: color, borderColor: site.theme.accent === color ? "white" : "transparent" }} aria-label={`${color} rengini seç`} />)}</div></div>
              <div className="border-t border-white/8 pt-4"><div className="flex items-center justify-between"><div><span className="text-xs font-black text-white/62">Tüm site bölümleri</span><p className="mt-1 text-[10px] font-medium text-white/25">Başlık, açıklama, buton ve liste içeriklerini açıp düzenle.</p></div><span className="rounded-full bg-white/[0.045] px-2.5 py-1.5 text-[9px] font-black text-white/30">{site.sections.length} bölüm</span></div><div className="mt-3 space-y-2">{site.sections.map((section, index) => <SectionContentEditor key={section.id} section={section} index={index} total={site.sections.length} onChange={(patch) => updateSection(index, patch)} onMove={(direction) => moveSection(index, direction)} />)}</div></div>
              <button type="button" onClick={saveContent} disabled={busy} className="send-button flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-black text-[#0a0b13]"><Check size={16} />Değişiklikleri kaydet</button>
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
          <div className="flex h-14 items-center justify-between border-b border-white/8 px-3 sm:px-5"><div className="flex items-center gap-1 rounded-xl border border-white/7 bg-black/15 p-1"><button onClick={() => setPreviewMobile(false)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black transition ${!previewMobile ? "bg-white/10 text-white" : "text-white/30"}`}><Laptop size={13} />Masaüstü</button><button onClick={() => setPreviewMobile(true)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black transition ${previewMobile ? "bg-white/10 text-white" : "text-white/30"}`}><Smartphone size={13} />Mobil</button></div><div className="flex items-center gap-2"><span className="hidden items-center gap-2 text-[9px] font-black uppercase tracking-[.13em] text-white/22 sm:flex"><CircleDot size={10} className="text-[#82ebca]" /> Canlı ön izleme</span><button onClick={() => setActiveTab("chat")} className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black text-white/55 lg:hidden">Sohbete dön</button></div></div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-2 sm:p-5 lg:p-8"><div className={`overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-[0_35px_100px_rgba(0,0,0,.42)] transition-all ${previewMobile ? "w-[390px] max-w-full" : "w-full max-w-[1120px]"}`}>{site ? <SitePreview site={site} compact /> : null}</div></div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-[#0d0e17]/94 p-2 backdrop-blur-xl lg:hidden">
        {([{ id: "chat", label: "Sohbet", icon: MessageCircle }, { id: "preview", label: "Ön izleme", icon: Laptop }, { id: "content", label: "İçerik", icon: FileText }, { id: "domain", label: "Domain", icon: Globe2 }] as const).map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-1.5 rounded-xl py-2 text-[9px] font-black ${activeTab === id ? "bg-white/10 text-white" : "text-white/30"}`}><Icon size={15} />{label}</button>)}
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

function DiscoveryStep({ index, title, active, done }: { index: string; title: string; active: boolean; done: boolean }) {
  return <div className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${active ? "border border-[#8f7cff]/18 bg-[#8f7cff]/[0.07]" : "border border-transparent"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[9px] font-black ${done ? "bg-[#82ebca]/12 text-[#82ebca]" : active ? "bg-[#8f7cff]/18 text-[#b5aaff]" : "bg-white/[0.025] text-white/18"}`}>{done ? <Check size={13} /> : index}</span><div><p className={`text-[11px] font-black ${active ? "text-white/72" : done ? "text-white/45" : "text-white/22"}`}>{title}</p><span className="text-[8px] font-bold uppercase tracking-[.11em] text-white/18">{done ? "Tamamlandı" : active ? "Şimdi" : "Sıradaki"}</span></div></div>;
}

function ConversationMessage({ message }: { message: ChatMessage }) {
  const assistant = message.role === "assistant";
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`group flex gap-3 ${assistant ? "justify-start" : "justify-end"}`}>
      {assistant ? <span className="studio-avatar studio-avatar-assistant"><WandSparkles size={15} strokeWidth={2.2} /></span> : null}
      <div className={`max-w-[88%] sm:max-w-[76%] ${assistant ? "" : "text-right"}`}>
        <div className={`mb-1.5 flex items-center gap-2 px-1 text-[9px] font-black uppercase tracking-[.14em] text-white/24 ${assistant ? "" : "justify-end"}`}>
          <span>{assistant ? "SiteMix tasarım danışmanı" : "Sen"}</span>
          {assistant ? <span className="inline-flex items-center gap-1 text-[#82ebca]/70"><CircleDot size={9} /> Aktif</span> : null}
        </div>
        <div className={`studio-message whitespace-pre-line px-4 py-3.5 text-left text-sm font-semibold leading-6 ${assistant ? "studio-message-assistant text-white/72" : "studio-message-user text-white"}`}>{message.content}</div>
      </div>
      {!assistant ? <span className="studio-avatar studio-avatar-user">S</span> : null}
    </motion.div>
  );
}

function PromptSuggestions({ items, onSelect, busy, compact = false }: { items: string[]; onSelect: (value: string) => void; busy: boolean; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <div className={`grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-1"}`}>
      {items.map((item, index) => (
        <button key={item} type="button" onClick={() => onSelect(item)} disabled={busy} className="studio-suggestion group flex min-h-12 items-center gap-3 text-left disabled:opacity-40">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.035] text-[#ad9fff]"><Sparkles size={13} /></span>
          <span className="flex-1 text-[11px] font-bold leading-4 text-white/58">{item}</span>
          <ChevronRight size={14} className="text-white/18 transition group-hover:translate-x-0.5 group-hover:text-white/55" />
          <span className="sr-only">Öneri {index + 1}</span>
        </button>
      ))}
    </div>
  );
}

function StudioComposer({ value, onChange, onSubmit, busy, placeholder, label }: { value: string; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean; placeholder: string; label: string }) {
  return (
    <form onSubmit={onSubmit} className="studio-composer">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.055] px-4 py-3">
        <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#9f91ff]"><Sparkles size={12} />{label}</span>
        <span className="text-[9px] font-bold text-white/18">{value.length}/1200</span>
      </div>
      <div className="flex items-end gap-3 p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/7 bg-white/[0.025] text-white/25" aria-hidden="true"><Sparkles size={16} /></span>
        <TextareaAutosize value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (value.trim() && !busy) event.currentTarget.form?.requestSubmit(); } }} minRows={1} maxRows={6} maxLength={1200} placeholder={placeholder} className="min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/22" />
        <button disabled={!value.trim() || busy} className="studio-send grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-[#090a12] disabled:cursor-not-allowed disabled:opacity-25" aria-label="Mesajı gönder"><ArrowUp size={18} strokeWidth={2.8} /></button>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 pb-3 text-[9px] font-semibold text-white/18"><span>Enter gönderir · Shift + Enter yeni satır</span><span className="hidden sm:inline">Kararların projeye kaydedilir</span></div>
    </form>
  );
}

function MediaUpload({ label, busy, onFile, compact = false }: { label: string; busy: boolean; onFile: (file: File) => void; compact?: boolean }) {
  return <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/9 bg-white/[0.035] font-black text-white/55 transition hover:border-[#8f7cff]/25 hover:bg-[#8f7cff]/8 hover:text-white ${compact ? "min-h-9 px-3 text-[9px]" : "min-h-11 px-3 text-[10px]"}`}><Upload size={compact ? 12 : 14} />{busy ? "Yükleniyor..." : label}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file); event.currentTarget.value = ""; }} /></label>;
}

function SectionContentEditor({ section, index, total, onChange, onMove }: { section: StudioSite["sections"][number]; index: number; total: number; onChange: (patch: Partial<StudioSite["sections"][number]>) => void; onMove: (direction: -1 | 1) => void }) {
  const labels: Record<StudioSite["sections"][number]["type"], string> = { hero: "Ana ekran", features: "Neden biz", services: "Hizmetler", process: "Çalışma süreci", about: "Hakkımızda", pricing: "Paketler", gallery: "Galeri", testimonials: "Yorumlar", faq: "SSS", contact: "İletişim" };
  const listEditor = (label: string, values: string[], key: "items" | "details" | "answers") => <label className="block"><span className="mb-2 block text-xs font-black text-white/45">{label} <small className="font-medium text-white/22">(her satıra bir tane)</small></span><textarea value={values.join("\n")} onChange={(event) => onChange({ [key]: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 12) })} rows={Math.min(Math.max(values.length, 3), 7)} className="w-full resize-y rounded-xl border border-white/8 bg-white/[0.045] p-3 text-xs font-semibold leading-6 text-white outline-none focus:border-white/18" /></label>;
  return <details className="group overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025]"><summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#8f7cff]/10 text-[9px] font-black text-[#ad9fff]">0{index + 1}</span><span className="flex-1 text-[11px] font-black text-white/58">{labels[section.type]}</span><span className="flex items-center gap-1"><button type="button" disabled={index === 0} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onMove(-1); }} className="grid h-7 w-7 place-items-center rounded-lg text-white/25 hover:bg-white/6 hover:text-white disabled:opacity-15" aria-label="Bölümü yukarı taşı"><ChevronUp size={13} /></button><button type="button" disabled={index === total - 1} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onMove(1); }} className="grid h-7 w-7 place-items-center rounded-lg text-white/25 hover:bg-white/6 hover:text-white disabled:opacity-15" aria-label="Bölümü aşağı taşı"><ChevronDown size={13} /></button><ChevronRight size={14} className="ml-1 text-white/20 transition group-open:rotate-90" /></span></summary><div className="space-y-3 border-t border-white/7 p-3"><EditorField label="Üst başlık" value={section.eyebrow || ""} onChange={(value) => onChange({ eyebrow: value })} /><EditorField label="Başlık" value={section.title} onChange={(value) => onChange({ title: value })} /><label className="block"><span className="mb-2 block text-xs font-black text-white/45">Açıklama</span><textarea value={section.text} onChange={(event) => onChange({ text: event.target.value })} rows={4} className="w-full resize-y rounded-xl border border-white/8 bg-white/[0.045] p-3 text-sm font-semibold leading-6 text-white outline-none focus:border-white/18" /></label>{section.ctaLabel !== undefined || section.type === "hero" || section.type === "contact" ? <EditorField label="Buton yazısı" value={section.ctaLabel || ""} onChange={(value) => onChange({ ctaLabel: value })} /> : null}{section.items ? listEditor(section.type === "faq" ? "Sorular" : "Liste öğeleri", section.items, "items") : null}{section.details ? listEditor("Öğe açıklamaları", section.details, "details") : null}{section.answers ? listEditor("Cevaplar", section.answers, "answers") : null}</div></details>;
}

function DecisionCard({ badge, title, text, action, onClick, featured = false }: { badge: string; title: string; text: string; action: string; onClick: () => void; featured?: boolean }) {
  return <article className={`flex min-h-[285px] flex-col rounded-[24px] border p-6 ${featured ? "border-[#86f2d1]/35 bg-[#86f2d1]/[0.07]" : "border-white/8 bg-white/[0.035]"}`}><span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8ef1d4]">{badge}</span><h3 className="mt-7 text-2xl font-black tracking-[-0.045em]">{title}</h3><p className="mt-4 text-sm font-medium leading-7 text-white/45">{text}</p><button type="button" onClick={onClick} className={`mt-auto min-h-12 rounded-full px-4 text-sm font-black ${featured ? "send-button text-[#0a0b13]" : "bg-white text-[#11121b]"}`}>{action}</button></article>;
}
