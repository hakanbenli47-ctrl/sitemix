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

export async function getOnMuhasebeClientContext() {
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error || !session) {
    window.location.href = "/on-muhasebe/giris";
    throw new Error("Oturum bulunamadı.");
  }

  const response = await fetch(buildYearScopedUrl("/api/on-muhasebe/me", getBrowserWorkYear()), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Oturum bilgisi alınamadı.");
  }

  return result as OnMuhasebeClientContext;
}
