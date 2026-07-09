"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { OnMuhasebeModuleKey, OnMuhasebePermissions } from "@/lib/onMuhasebe/auth";
import { supabaseClient } from "@/lib/supabaseClient";

type Staff = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  status: "active" | "passive";
  permissions: OnMuhasebePermissions;
  createdAt: string;
};

const STAFF_MONTHLY_PRICE = 99;

const permissionItems: Array<{
  key: OnMuhasebeModuleKey;
  label: string;
  desc: string;
}> = [
  {
    key: "dashboard",
    label: "Ana Panel",
    desc: "Günlük özet ekranını görür.",
  },
  {
    key: "cari",
    label: "Cari",
    desc: "Müşteri ve tedarikçi kayıtlarını yönetir.",
  },
  {
    key: "stok",
    label: "Stok",
    desc: "Ürün, hizmet ve stok hareketlerini yönetir.",
  },
  {
    key: "kasa",
    label: "Kasa",
    desc: "Tahsilat, ödeme, gelir ve gider girer.",
  },
  {
    key: "fatura",
    label: "Fatura / Fiş",
    desc: "Satış ve alış fişi oluşturur.",
  },
  {
    key: "rapor",
    label: "Rapor",
    desc: "Cari, stok, kasa ve fiş raporlarını görür.",
  },
];

const emptyPermissions: OnMuhasebePermissions = {
  dashboard: true,
  cari: false,
  stok: false,
  kasa: false,
  fatura: false,
  rapor: false,
  ayarlar: false,
  yedekleme: false,
  personel: false,
};

function applyPermissionDependencies(
  value: OnMuhasebePermissions,
): OnMuhasebePermissions {
  const next = {
    ...value,
    dashboard: true,
    ayarlar: false,
    yedekleme: false,
    personel: false,
  };

  if (next.kasa) {
    next.cari = true;
  }

  if (next.fatura) {
    next.cari = true;
    next.stok = true;
  }

  if (!next.cari) {
    next.kasa = false;
    next.fatura = false;
  }

  if (!next.stok) {
    next.fatura = false;
  }

  return next;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

async function readApiResult(response: Response) {
  const result = await response.json().catch(() => null);

  if (!result) {
    throw new Error("Sunucudan geçerli cevap alınamadı. Lütfen tekrar dene.");
  }

  return result;
}

export default function OnMuhasebePersonelPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"active" | "passive">("active");
  const [permissions, setPermissions] =
    useState<OnMuhasebePermissions>(emptyPermissions);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedStaff = useMemo(
    () => staff.find((item) => item.id === selectedStaffId) || null,
    [selectedStaffId, staff],
  );
  const activeStaffCount = useMemo(
    () => staff.filter((item) => item.status === "active").length,
    [staff],
  );
  const staffMonthlyTotal = activeStaffCount * STAFF_MONTHLY_PRICE;

  async function authHeaders() {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error || !session) {
      window.location.href = "/on-muhasebe/giris";
      throw new Error("Oturum bulunamadı.");
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  }

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const headers = await authHeaders();
      const response = await fetch("/api/on-muhasebe/personel", {
        headers,
        cache: "no-store",
      });
      const result = await readApiResult(response);

      if (!response.ok) {
        throw new Error(result.message || "Personel listesi alınamadı.");
      }

      setStaff(result.staff || []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Personel listesi alınamadı.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  function resetForm() {
    setSelectedStaffId(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setStatus("active");
    setPermissions(emptyPermissions);
    setMessage("");
    setErrorMessage("");
  }

  function editStaff(item: Staff) {
    setSelectedStaffId(item.id);
    setFullName(item.fullName);
    setPhone(item.phone || "");
    setEmail(item.email);
    setPassword("");
    setStatus(item.status);
    setPermissions(item.permissions);
    setMessage("");
    setErrorMessage("");
  }

  function togglePermission(key: OnMuhasebeModuleKey) {
    if (key === "dashboard") return;

    setPermissions((current) => ({
      ...applyPermissionDependencies({
        ...current,
        [key]: !current[key],
      }),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const headers = await authHeaders();
      const response = await fetch("/api/on-muhasebe/personel", {
        method: selectedStaff ? "PATCH" : "POST",
        headers,
        body: JSON.stringify({
          id: selectedStaff?.id,
          fullName,
          phone,
          email,
          password,
          status,
          permissions,
        }),
      });
      const result = await readApiResult(response);

      if (!response.ok) {
        throw new Error(result.message || "Personel kaydedilemedi.");
      }

      setStaff(result.staff || []);
      setMessage(result.message || "Personel kaydedildi.");
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Personel kaydedilemedi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <p className="mt-5 text-sm font-black text-slate-600">
            Personel ekranı yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] px-5 py-6 text-slate-950 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Yönetici
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Personel ve Yetkiler
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              Personel hesabı oluştur, giriş bilgilerini belirle ve sadece
              kullanmasını istediğin modülleri aktif et.
            </p>
          </div>
          <Link
            href="/on-muhasebe/panel"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-slate-950 shadow-lg shadow-slate-200 transition hover:bg-slate-100"
          >
            Panele Dön
          </Link>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mt-5 rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
              Personel Paketi
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              Her aktif personel için ana firma paketine aylık {formatMoney(STAFF_MONTHLY_PRICE)} eklenir. Personel hesabına ayrı ödeme yansıtılmaz.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-950">
            {activeStaffCount} x {formatMoney(STAFF_MONTHLY_PRICE)} = {formatMoney(staffMonthlyTotal)} / ay
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleSubmit}
            className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  {selectedStaff ? "Güncelle" : "Yeni Personel"}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  {selectedStaff ? "Personeli düzenle" : "Giriş bilgisi oluştur"}
                </h2>
              </div>
              {selectedStaff ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600"
                >
                  Yeni Kayıt
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black">Ad Soyad</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="min-h-12 border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white"
                  placeholder="Personel adı"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black">Telefon</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="min-h-12 border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white"
                  placeholder="05xx xxx xx xx"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black">E-posta</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={Boolean(selectedStaff)}
                  className="min-h-12 border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="personel@firma.com"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black">
                  {selectedStaff ? "Yeni Şifre" : "Şifre"}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-12 border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white"
                  placeholder={selectedStaff ? "Boşsa değişmez" : "En az 6 karakter"}
                />
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-black">Hesap Durumu</span>
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as "active" | "passive")
                  }
                  className="min-h-12 border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="active">Aktif</option>
                  <option value="passive">Pasif</option>
                </select>
              </label>
            </div>

            <div className="mt-6">
              <p className="text-sm font-black">Modül Yetkileri</p>
              <div className="mt-3 divide-y divide-slate-200 border border-slate-200">
                {permissionItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => togglePermission(item.key)}
                    className="grid w-full gap-3 bg-white p-4 text-left transition hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <span>
                      <span className="block text-sm font-black">{item.label}</span>
                      <span className="mt-1 block text-xs font-bold text-slate-500">
                        {item.desc}
                      </span>
                    </span>
                    <span
                      className={[
                        "inline-flex min-w-20 justify-center rounded-full px-3 py-2 text-xs font-black",
                        permissions[item.key]
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {permissions[item.key] ? "Açık" : "Kapalı"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Kaydediliyor..."
                : selectedStaff
                  ? "Personeli Güncelle"
                  : "Personeli Oluştur"}
            </button>
          </form>

          <div className="border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Kayıtlı Personel
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                {staff.length} kullanıcı
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {staff.length === 0 ? (
                <div className="p-8 text-center text-sm font-bold text-slate-500">
                  Henüz personel hesabı yok.
                </div>
              ) : null}

              {staff.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-black tracking-[-0.04em]">
                        {item.fullName || "Personel"}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {item.email}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {item.phone || "Telefon yok"} / {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => editStaff(item)}
                      className="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-xs font-black text-white"
                    >
                      Düzenle
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-black",
                        item.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700",
                      ].join(" ")}
                    >
                      {item.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                      {item.status === "active" ? `${formatMoney(STAFF_MONTHLY_PRICE)} / ay` : "Ücrete dahil değil"}
                    </span>
                    {permissionItems
                      .filter((permission) => item.permissions[permission.key])
                      .map((permission) => (
                        <span
                          key={permission.key}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
                        >
                          {permission.label}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
