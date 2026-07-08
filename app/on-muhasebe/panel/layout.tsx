"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type GuardState = "checking" | "allowed" | "redirecting" | "error";

const pathPermissions = [
  ["/on-muhasebe/panel/cari", "cari"],
  ["/on-muhasebe/panel/stok", "stok"],
  ["/on-muhasebe/panel/kasa", "kasa"],
  ["/on-muhasebe/panel/fatura-fis", "fatura"],
  ["/on-muhasebe/panel/rapor", "rapor"],
  ["/on-muhasebe/panel/ayarlar", "ayarlar"],
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

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();

        if (sessionError || !session) {
          window.location.replace("/on-muhasebe/giris");
          return;
        }

        const response = await fetch("/api/on-muhasebe/subscription-status", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
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

        const meResponse = await fetch("/api/on-muhasebe/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
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
    return children;
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
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white"
          >
            Tekrar Dene
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
          Paket ve deneme süresi kontrol ediliyor...
        </p>
      </div>
    </main>
  );
}
