"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  buildYearScopedUrl,
  getBrowserWorkYear,
  pickRegisteredWorkYear,
  setBrowserWorkYear,
  sortWorkPeriods,
  type OnMuhasebeWorkPeriod,
} from "@/lib/onMuhasebe/workYear";
import {
  cacheOnMuhasebeClientContext,
  type OnMuhasebeClientContext,
} from "@/lib/onMuhasebe/client";
import { supabaseClient } from "@/lib/supabaseClient";

type GuardState = "checking" | "allowed" | "error";

type PeriodResponse = {
  setupRequired?: boolean;
  periods?: OnMuhasebeWorkPeriod[];
  message?: string | null;
};

type BootstrapResponse = OnMuhasebeClientContext & {
  allowed: boolean;
  message?: string;
  subscription?: {
    planLabel?: string;
    trial_ends_at?: string | null;
    statusLabel?: string;
  };
  periods?: PeriodResponse & {
    canCreatePeriod?: boolean;
  };
};

type CachedBootstrap = {
  expiresAt: number;
  data: BootstrapResponse;
};

const BOOTSTRAP_CACHE_TTL_MS = 2 * 60 * 1000;
const BOOTSTRAP_CACHE_PREFIX = "onMuhasebeBootstrap";

const pathPermissions = [
  ["/on-muhasebe/panel/cari", "cari"],
  ["/on-muhasebe/panel/stok", "stok"],
  ["/on-muhasebe/panel/kasa", "kasa"],
  ["/on-muhasebe/panel/fatura-fis", "fatura"],
  ["/on-muhasebe/panel/rapor", "rapor"],
  ["/on-muhasebe/panel/yedekleme", "yedekleme"],
  ["/on-muhasebe/panel/personel", "personel"],
] as const;

function bootstrapCacheKey(userId: string) {
  return `${BOOTSTRAP_CACHE_PREFIX}:${userId}`;
}

function readCachedBootstrap(userId: string) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(bootstrapCacheKey(userId));
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedBootstrap;
    if (!cached?.data || cached.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(bootstrapCacheKey(userId));
      return null;
    }

    return cached.data;
  } catch {
    window.sessionStorage.removeItem(bootstrapCacheKey(userId));
    return null;
  }
}

function writeCachedBootstrap(userId: string, data: BootstrapResponse) {
  if (typeof window === "undefined" || !data.allowed) return;

  window.sessionStorage.setItem(
    bootstrapCacheKey(userId),
    JSON.stringify({
      expiresAt: Date.now() + BOOTSTRAP_CACHE_TTL_MS,
      data,
    } satisfies CachedBootstrap),
  );
}

export default function OnMuhasebePanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    function allowWithPeriods(result: BootstrapResponse) {
      if (!result.allowed) {
        const searchParams = new URLSearchParams();
        const subscription = result.subscription;

        if (subscription?.planLabel) searchParams.set("paket", subscription.planLabel);
        if (subscription?.trial_ends_at) searchParams.set("bitis", subscription.trial_ends_at);
        if (subscription?.statusLabel) searchParams.set("durum", subscription.statusLabel);

        window.location.replace(
          `/on-muhasebe/deneme-bitti?${searchParams.toString()}`,
        );
        return;
      }

      const requiredPermission = pathPermissions.find(([path]) =>
        pathname.startsWith(path),
      )?.[1];

      if (requiredPermission && !result.permissions?.[requiredPermission]) {
        window.location.replace("/on-muhasebe/panel/yetkisiz");
        return;
      }

      const registeredPeriods = result.periods?.setupRequired
        ? []
        : sortWorkPeriods(result.periods?.periods || []);
      const selectedWorkYear =
        registeredPeriods.length > 0
          ? pickRegisteredWorkYear(registeredPeriods, getBrowserWorkYear())
          : new Date().getFullYear();

      if (!selectedWorkYear) {
        throw new Error("Geçerli çalışma dönemi bulunamadı.");
      }

      setBrowserWorkYear(selectedWorkYear);
      cacheOnMuhasebeClientContext({ ...result, workYear: selectedWorkYear });

      if (!isMounted) return;

      setState("allowed");
    }

    async function checkAccess() {
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

        const cached = readCachedBootstrap(session.user.id);
        if (cached) {
          allowWithPeriods(cached);
          return;
        }

        setState("checking");

        const response = await fetch(
          buildYearScopedUrl("/api/on-muhasebe/bootstrap", getBrowserWorkYear()),
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          },
        );
        const result = (await response.json().catch(() => null)) as BootstrapResponse | null;

        if (!response.ok || !result) {
          throw new Error(result?.message || "Panel bilgileri alınamadı.");
        }

        writeCachedBootstrap(session.user.id, result);
        allowWithPeriods(result);
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
    return <>{children}</>;
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
          Panel hazırlanıyor...
        </p>
      </div>
    </main>
  );
}
