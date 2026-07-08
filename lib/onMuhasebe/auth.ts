import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type OnMuhasebeModuleKey =
  | "dashboard"
  | "cari"
  | "stok"
  | "kasa"
  | "fatura"
  | "rapor"
  | "ayarlar"
  | "yedekleme"
  | "personel";

export type OnMuhasebePermissions = Record<OnMuhasebeModuleKey, boolean>;

export const allOnMuhasebePermissions: OnMuhasebePermissions = {
  dashboard: true,
  cari: true,
  stok: true,
  kasa: true,
  fatura: true,
  rapor: true,
  ayarlar: true,
  yedekleme: true,
  personel: true,
};

export const defaultStaffPermissions: OnMuhasebePermissions = {
  dashboard: true,
  cari: true,
  stok: true,
  kasa: false,
  fatura: false,
  rapor: false,
  ayarlar: false,
  yedekleme: false,
  personel: false,
};

export type OnMuhasebeUserRole = "owner" | "staff";

type MembershipRecord = {
  id: string;
  company_id: string;
  user_id: string;
  role: OnMuhasebeUserRole;
  status: "active" | "passive";
  permissions: Partial<OnMuhasebePermissions> | null;
};

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  const [type, token] = header.split(" ");

  if (type?.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token;
}

export async function getAuthenticatedUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    throw new Error("Oturum bilgisi bulunamadı.");
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new Error("Oturum geçersiz. Lütfen tekrar giriş yap.");
  }

  return user;
}

export async function getUserCompany(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("id, owner_user_id, company_code, name, sector, phone")
    .eq("owner_user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("İşletme bilgisi bulunamadı.");
  }

  return data as {
    id: string;
    owner_user_id: string;
    company_code: string | null;
    name: string;
    sector: string | null;
    phone: string | null;
  };
}

export function normalizePermissions(
  role: OnMuhasebeUserRole,
  permissions?: Partial<OnMuhasebePermissions> | null,
) {
  if (role === "owner") {
    return allOnMuhasebePermissions;
  }

  const normalized = {
    ...defaultStaffPermissions,
    ...(permissions || {}),
    dashboard: true,
    ayarlar: false,
    yedekleme: false,
    personel: false,
  };

  if (normalized.kasa) {
    normalized.cari = true;
  }

  if (normalized.fatura) {
    normalized.cari = true;
    normalized.stok = true;
  }

  if (normalized.rapor) {
    normalized.cari = true;
    normalized.stok = true;
    normalized.kasa = true;
    normalized.fatura = true;
  }

  return normalized;
}

export async function getOnMuhasebeContext(request: Request) {
  const user = await getAuthenticatedUser(request);

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("on_muhasebe_company_users")
    .select("id, company_id, user_id, role, status, permissions")
    .eq("user_id", user.id)
    .maybeSingle<MembershipRecord>();

  if (membershipError && !isMissingTableError(membershipError)) {
    throw membershipError;
  }

  if (membership && membership.status !== "active") {
    throw new Error("Personel hesabı pasif durumda.");
  }

  if (membership) {
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, owner_user_id, company_code, name, sector, phone")
      .eq("id", membership.company_id)
      .single();

    if (companyError || !company) {
      throw new Error("İşletme bilgisi bulunamadı.");
    }

    const permissions = normalizePermissions(
      membership.role,
      membership.permissions,
    );

    return {
      user,
      company: company as Awaited<ReturnType<typeof getUserCompany>>,
      membership,
      role: membership.role,
      permissions,
      isOwner: membership.role === "owner",
    };
  }

  const company = await getUserCompany(user.id);

  return {
    user,
    company,
    membership: null,
    role: "owner" as const,
    permissions: allOnMuhasebePermissions,
    isOwner: true,
  };
}

export function requireOwner(context: Awaited<ReturnType<typeof getOnMuhasebeContext>>) {
  if (!context.isOwner) {
    throw new Error("Bu işlem için yönetici yetkisi gerekir.");
  }
}

export function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const supabaseError = error as { code?: string; message?: string };

  return (
    supabaseError.code === "42P01" ||
    Boolean(supabaseError.message?.toLowerCase().includes("does not exist"))
  );
}
