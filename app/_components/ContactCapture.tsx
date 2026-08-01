"use client";

import { FormEvent, useState } from "react";

export default function ContactCapture({ slug, background, foreground }: { slug: string; background: string; foreground: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/public/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, name: form.get("name"), phone: form.get("phone"), email: form.get("email"), message: form.get("message"), website: form.get("website") }) });
    const result = await response.json().catch(() => null);
    setMessage(result?.message || (response.ok ? "Mesajınız iletildi." : "Mesaj gönderilemedi."));
    if (response.ok) event.currentTarget.reset();
    setBusy(false);
  }

  return <form onSubmit={submit} className="mx-auto mt-7 grid max-w-2xl gap-3 text-left sm:grid-cols-2"><input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" /><input name="name" required placeholder="Adınız" className="h-12 rounded-xl border px-4 text-sm font-bold outline-none" style={{ background, color: foreground, borderColor: `${foreground}20` }} /><input name="phone" placeholder="Telefon" className="h-12 rounded-xl border px-4 text-sm font-bold outline-none" style={{ background, color: foreground, borderColor: `${foreground}20` }} /><input name="email" type="email" placeholder="E-posta" className="h-12 rounded-xl border px-4 text-sm font-bold outline-none sm:col-span-2" style={{ background, color: foreground, borderColor: `${foreground}20` }} /><textarea name="message" required rows={4} placeholder="Mesajınız" className="resize-none rounded-xl border p-4 text-sm font-bold outline-none sm:col-span-2" style={{ background, color: foreground, borderColor: `${foreground}20` }} /><button disabled={busy} className="min-h-12 rounded-full px-5 text-sm font-black sm:col-span-2" style={{ background, color: foreground }}>{busy ? "Gönderiliyor..." : "Mesaj gönder"}</button>{message ? <p className="text-center text-xs font-black sm:col-span-2">{message}</p> : null}</form>;
}
