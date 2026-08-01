"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let handled = false;
    async function completeGoogleSession(accessToken: string) {
      if (handled) return;
      handled = true;
      setBusy(true);
      const response = await fetch("/api/admin/oauth-session", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      const result = await response.json().catch(() => null);
      if (response.ok) window.location.href = result?.redirectTo || "/admin/studio";
      else { setError(result?.message || "Yönetici yetkisi doğrulanamadı."); setBusy(false); }
    }
    supabaseClient.auth.getSession().then(({ data }) => { if (data.session) completeGoogleSession(data.session.access_token); });
    const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => { if (session) completeGoogleSession(session.access_token); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function googleLogin() {
    setBusy(true); setError("");
    const { error: oauthError } = await supabaseClient.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/admin/giris` } });
    if (oauthError) { setError("Google girişi başlatılamadı."); setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.message || "Giriş yapılamadı.");
      setBusy(false);
      return;
    }
    window.location.href = result?.redirectTo || "/admin/studio";
  }

  return <main className="grid min-h-screen place-items-center bg-[#090a12] px-4 text-white"><section className="w-full max-w-md rounded-[30px] border border-white/10 bg-white/[0.045] p-6 shadow-2xl sm:p-8"><Link href="/" className="flex items-center gap-3"><span className="brand-orb"><span>S</span></span><div><strong className="block">SiteMix</strong><span className="text-[10px] font-black uppercase tracking-[.18em] text-white/35">Yönetim merkezi</span></div></Link><h1 className="mt-9 text-3xl font-black tracking-[-0.05em]">Admin girişi</h1><p className="mt-3 text-sm font-medium leading-7 text-white/42">Site, kullanıcı, ödeme, talep ve domain yönetimi.</p><button type="button" onClick={googleLogin} disabled={busy} className="mt-7 flex min-h-13 w-full items-center justify-center gap-3 rounded-full bg-white px-5 text-sm font-black text-[#11121b] disabled:opacity-50"><span className="font-black text-[#4285f4]">G</span>Google ile güvenli giriş</button><div className="my-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[.14em] text-white/22"><span className="h-px flex-1 bg-white/8" />veya şifre<span className="h-px flex-1 bg-white/8" /></div><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-black text-white/45">E-posta veya kullanıcı adı</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="h-13 w-full rounded-2xl border border-white/8 bg-white/[0.055] px-4 text-sm font-bold text-white outline-none" /></label><label className="block"><span className="mb-2 block text-xs font-black text-white/45">Şifre</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="h-13 w-full rounded-2xl border border-white/8 bg-white/[0.055] px-4 text-sm font-bold text-white outline-none" /></label>{error ? <p className="rounded-xl bg-red-500/12 p-3 text-xs font-bold text-red-200">{error}</p> : null}<button disabled={busy} className="send-button min-h-13 w-full rounded-full text-sm font-black text-[#0a0b13] disabled:opacity-50">{busy ? "Giriş yapılıyor..." : "Yönetim merkezine gir"}</button></form></section></main>;
}
