"use client";

import type {
  OnMuhasebePermissions,
  OnMuhasebeUserRole,
} from "@/lib/onMuhasebe/auth";
import { buildYearScopedUrl, getBrowserWorkYear } from "@/lib/onMuhasebe/workYear";
import { supabaseClient } from "@/lib/supabaseClient";

export type OnMuhasebeClientContext = {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    id: string;
    full_name: string | null;
    phone: string | null;
    role: string | null;
  } | null;
  company: {
    id: string;
    owner_user_id: string;
    company_code: string | null;
    name: string;
    sector: string | null;
    phone: string | null;
  };
  role: OnMuhasebeUserRole;
  permissions: OnMuhasebePermissions;
  isOwner: boolean;
  workYear: number;
};

const CLIENT_CONTEXT_CACHE_KEY = "onMuhasebeClientContext";
const CLIENT_CONTEXT_CACHE_TTL_MS = 2 * 60 * 1000;

type CachedClientContext = {
  expiresAt: number;
  data: OnMuhasebeClientContext;
};

function cacheKey(workYear: number) {
  return `${CLIENT_CONTEXT_CACHE_KEY}:${workYear}`;
}

export function cacheOnMuhasebeClientContext(
  context: OnMuhasebeClientContext,
  ttlMs = CLIENT_CONTEXT_CACHE_TTL_MS,
) {
  if (typeof window === "undefined") return;

  const cached: CachedClientContext = {
    expiresAt: Date.now() + ttlMs,
    data: context,
  };

  window.sessionStorage.setItem(
    cacheKey(context.workYear),
    JSON.stringify(cached),
  );
}

function readCachedClientContext(workYear: number) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(cacheKey(workYear));
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedClientContext;
    if (!cached?.data || cached.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(cacheKey(workYear));
      return null;
    }

    return cached.data;
  } catch {
    window.sessionStorage.removeItem(cacheKey(workYear));
    return null;
  }
}

export async function getOnMuhasebeClientContext() {
  const workYear = getBrowserWorkYear();
  const cached = readCachedClientContext(workYear);

  if (cached) {
    return cached;
  }

  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error || !session) {
    window.location.href = "/on-muhasebe/giris";
    throw new Error("Oturum bulunamadı.");
  }

  const response = await fetch(buildYearScopedUrl("/api/on-muhasebe/me", workYear), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Oturum bilgisi alınamadı.");
  }

  const context = result as OnMuhasebeClientContext;
  cacheOnMuhasebeClientContext(context);

  return context;
}
