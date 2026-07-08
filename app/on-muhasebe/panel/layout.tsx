"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getBrowserWorkYear,
  pickRegisteredWorkYear,
  setBrowserWorkYear,
  sortWorkPeriods,
  type OnMuhasebeWorkPeriod,
} from "@/lib/onMuhasebe/workYear";
import { supabaseClient } from "@/lib/supabaseClient";

type GuardState = "checking" | "allowed" | "redirecting" | "error";

type PeriodResponse = {
  setupRequired?: boolean;
  periods?: OnMuhasebeWorkPeriod[];
  message?: string;
};

const pathPermissions = [
  ["/on-muhasebe/panel/cari", "cari"],
  ["/on-muhasebe/panel/stok", "stok"],
  ["/on-muhasebe/panel/kasa", "kasa"],
  ["/on-muhasebe/panel/fatura-fis", "fatura"],
  ["/on-muhasebe/panel/rapor", "rapor"],
  ["/on-muhasebe/panel/yedekleme", "yedekleme"],
  ["/on-muhasebe/panel/personel", "personel"],
] as const;

export default function OnMuhasebePanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("checking");
  const [message, setMessage] = useState("");
  const [workYear, setWorkYear] = useState<number | null>(null);
  const [periodOptions, setPeriodOptions] = useState<OnMuhasebeWorkPeriod[]>([]);

  function changeWorkYear(nextYear: number) {
    const exists = periodOptions.some((period) => period.yil === nextYear);

    if (!exists) return;

    setBrowserWorkYear(nextYear);
    setWorkYear(nextYear);
    window.location.reload();
  }

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      setState("checking");
      setMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();

        if (sessionError || !session) {
          window.location.replace("/on-muhasebe/giris");
          return;
        }

        const headers = {
          Authorization: `Bearer ${session.access_token}`,
        };

        const response = await fetch("/api/on-muhasebe/subscription-status", {
          headers,
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.message || "Paket durumu kontrol edilemedi.");
        }

        if (!result.allowed) {
          const searchParams = new URLSearchParams();
          const subscription = result.subscription;

          if (subscription?.planLabel) {
            searchParams.set("paket", subscription.planLabel);
          }

          if (subscription?.trial_ends_at) {
            searchParams.set("bitis", subscription.trial_ends_at);
          }

          if (subscription?.statusLabel) {
            searchParams.set("durum", subscription.statusLabel);
          }

          window.location.replace(
            `/on-muhasebe/deneme-bitti?${searchParams.toString()}`,
          );
          return;
        }

        const periodResponse = await fetch("/api/on-muhasebe/donemler", {
          headers,
          cache: "no-store",
        });
        const periodResult = (await periodResponse.json().catch(() => null)) as PeriodResponse | null;

        if (!periodResponse.ok) {
          throw new Error(periodResult?.message || "Çalışma dönemleri alınamadı.");
        }

        if (periodResult?.setupRequired) {
          throw new Error(
            periodResult.message ||
              "Çalışma dönemi tablosu kurulmamış. Önce Supabase SQL dosyasını çalıştır.",
          );
        }

        const registeredPeriods = sortWorkPeriods(periodResult?.periods || []);

        if (registeredPeriods.length === 0) {
          throw new Error(
            "Bu firmada kayıtlı çalışma dönemi yok. Yönetici giriş ekranından ilk dönemi oluşturmalı.",
          );
        }

        const selectedWorkYear = pickRegisteredWorkYear(
          registeredPeriods,
          getBrowserWorkYear(),
        );

        if (!selectedWorkYear) {
          throw new Error("Geçerli çalışma dönemi bulunamadı.");
        }

        setBrowserWorkYear(selectedWorkYear);

        const meResponse = await fetch(`/api/on-muhasebe/me?workYear=${selectedWorkYear}`, {
          headers,
          cache: "no-store",
        });
        const me = await meResponse.json().catch(() => null);

        if (!meResponse.ok) {
          throw new Error(me?.message || "Yetki bilgisi alınamadı.");
        }

        const requiredPermission = pathPermissions.find(([path]) =>
          pathname.startsWith(path),
        )?.[1];

        if (requiredPermission && !me.permissions?.[requiredPermission]) {
          window.location.replace("/on-muhasebe/panel/yetkisiz");
          return;
        }

        if (isMounted) {
          setPeriodOptions(registeredPeriods);
          setWorkYear(selectedWorkYear);
          setState("allowed");
        }
      } catch (error) {
        if (!isMounted) return;

        setMessage(
          error instanceof Error
            ? error.message
            : "Panel erişimi kontrol edilirken hata oluştu.",
        );
        setState("error");
      }
    }

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  if (state === "allowed") {
    return (
      <>
        {children}
        <div className="fixed bottom-4 left-4 z-50 rounded-2xl bg-slate-950/95 p-3 text-white shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              Çalışma dönemi
            </span>
            <select
              value={workYear ?? ""}
              onChange={(event) => changeWorkYear(Number(event.target.value))}
              className="h-10 rounded-xl border border-white/10 bg-white/10 px-3 text-xs font-black text-white outline-none"
            >
              {periodOptions.map((period) => (
                <option key={period.id} value={period.yil} className="text-slate-950">
                  {period.yil} {period.durum === "kapali" ? "(Kapalı)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </>
    );
  }

  if (state === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <p className="text-lg font-black text-red-600">
            Panel erişimi kontrol edilemedi
          </p>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
            {message}
          </p>
          <button
            type="button"
            onClick={() => window.location.replace("/on-muhasebe/giris")}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white"
          >
            Giriş Ekranına Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
        <p className="mt-5 text-sm font-black text-slate-600">
          Paket, dönem ve yetki kontrol ediliyor...
        </p>
      </div>
    </main>
  );
}
