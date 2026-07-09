import { NextResponse } from "next/server";
import { allOnMuhasebePermissions, isMissingTableError } from "@/lib/onMuhasebe/auth";
import {
  addBillingMonths,
  addTrialDays,
  getOnMuhasebeDaysLeft,
  isOnMuhasebePlanId,
  onMuhasebePlans,
} from "@/lib/onMuhasebe/plans";
import { currentCalendarYear, normalizeWorkYear } from "@/lib/onMuhasebe/workYear";
import { requireSitemixAdmin } from "@/lib/sitemixAdminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  calculateOnMuhasebeSubscriptionBilling,
  ON_MUHASEBE_STAFF_MONTHLY_PRICE,
  syncLatestSubscriptionBilling,
} from "@/lib/onMuhasebe/billing";

export const runtime = "nodejs";

type AdminAction =
  | "set_access"
  | "set_subscription"
  | "create_period"
  | "set_period_status"
  | "set_owner_email"
  | "set_owner_password"
  | "set_payment_notification_status";

type CompanyRow = {
  id: string;
  owner_user_id: string;
  company_code: string | null;
  name: string;
  sector: string | null;
  phone: string | null;
};

type MembershipRow = {
  id: string;
  company_id: string;
  user_id: string;
  role: "owner" | "staff";
  status: "active" | "passive";
  permissions: Record<string, boolean> | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
};

type SubscriptionRow = {
  id: string;
  company_id: string;
  user_id: string;
  plan: string;
  status: "trial" | "active" | "expired" | "cancelled" | string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  billing_period_months: number | null;
  monthly_price: number | null;
  total_price: number | null;
  currency: string | null;
  created_at?: string | null;
};

type PeriodRow = {
  id: string;
  company_id: string;
  yil: number;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  durum: string;
  locked: boolean | null;
};

type PaymentNotificationRow = {
  id: string;
  company_id: string;
  user_id: string | null;
  subscription_id: string | null;
  payment_code: string;
  description: string;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
  updated_at: string | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function customerPaymentCode(company: CompanyRow) {
  return company.company_code || company.id.slice(0, 8).toUpperCase();
}

function nextSubscriptionEnd(subscription: SubscriptionRow, status: string) {
  const now = new Date();

  if (status === "trial") {
    return addTrialDays(now).toISOString();
  }

  if (status === "active") {
    const planMonths = isOnMuhasebePlanId(subscription.plan)
      ? onMuhasebePlans[subscription.plan].billingPeriodMonths
      : 1;
    return addBillingMonths(
      now,
      subscription.billing_period_months || planMonths,
    ).toISOString();
  }

  return null;
}

function adminDaysLeft(subscription: SubscriptionRow) {
  if (subscription.status !== "active" && subscription.status !== "trial") {
    return 0;
  }

  return getOnMuhasebeDaysLeft(subscription.trial_ends_at);
}

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function periodDates(year: number) {
  return {
    baslangic_tarihi: `${year}-01-01`,
    bitis_tarihi: `${year}-12-31`,
  };
}

async function optionalRows<T>(
  table: string,
  companyIds: string[],
  select: string,
) {
  if (companyIds.length === 0) return [] as T[];

  const { data, error } = await supabaseAdmin
    .from(table)
    .select(select)
    .in("company_id", companyIds);

  if (error && !isMissingTableError(error)) throw error;
  return error ? [] : ((data || []) as T[]);
}

async function getCompany(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("id, owner_user_id, company_code, name, sector, phone")
    .eq("id", companyId)
    .single<CompanyRow>();

  if (error || !data) {
    throw new Error("Firma bulunamadı.");
  }

  return data;
}

async function getLatestSubscription(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, company_id, user_id, plan, status, trial_started_at, trial_ends_at, billing_period_months, monthly_price, total_price, currency, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();

  if (error) throw error;
  return data || null;
}

async function setOwnerMembership(company: CompanyRow, status: "active" | "passive") {
  const payload = {
    company_id: company.id,
    user_id: company.owner_user_id,
    role: "owner",
    status,
    permissions: allOnMuhasebePermissions,
    created_by: company.owner_user_id,
  };

  const { error } = await supabaseAdmin
    .from("on_muhasebe_company_users")
    .upsert(payload, { onConflict: "company_id,user_id" });

  if (error && !isMissingTableError(error)) throw error;
}

async function closePendingPaymentNotifications(
  companyId: string,
  status: "approved" | "rejected",
) {
  const { error } = await supabaseAdmin
    .from("on_muhasebe_payment_notifications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("status", "pending");

  if (error && !isMissingTableError(error)) throw error;
}

export async function GET() {
  try {
    await requireSitemixAdmin();

    const { data: companies, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, owner_user_id, company_code, name, sector, phone")
      .order("name", { ascending: true })
      .limit(200);

    if (companyError) throw companyError;

    const companyRows = (companies || []) as CompanyRow[];
    const companyIds = companyRows.map((company) => company.id);
    const ownerIds = companyRows.map((company) => company.owner_user_id).filter(Boolean);

    const [
      profileResult,
      subscriptionRows,
      membershipRows,
      periodRows,
      paymentNotificationRows,
    ] = await Promise.all([
      ownerIds.length > 0
        ? supabaseAdmin
            .from("profiles")
            .select("id, full_name, phone, role")
            .in("id", ownerIds)
        : Promise.resolve({ data: [], error: null }),
      optionalRows<SubscriptionRow>(
        "subscriptions",
        companyIds,
        "id, company_id, user_id, plan, status, trial_started_at, trial_ends_at, billing_period_months, monthly_price, total_price, currency, created_at",
      ),
      optionalRows<MembershipRow>(
        "on_muhasebe_company_users",
        companyIds,
        "id, company_id, user_id, role, status, permissions, created_at",
      ),
      optionalRows<PeriodRow>(
        "on_muhasebe_calisma_donemleri",
        companyIds,
        "id, company_id, yil, baslangic_tarihi, bitis_tarihi, durum, locked",
      ),
      optionalRows<PaymentNotificationRow>(
        "on_muhasebe_payment_notifications",
        companyIds,
        "id, company_id, user_id, subscription_id, payment_code, description, status, created_at, updated_at",
      ),
    ]);

    if (profileResult.error) throw profileResult.error;

    const profiles = (profileResult.data || []) as ProfileRow[];
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const ownerEmailMap = new Map<string, string | null>();
    await Promise.all(
      ownerIds.map(async (ownerId) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(ownerId);
        ownerEmailMap.set(ownerId, data.user?.email || null);
      }),
    );

    const memberIds = Array.from(
      new Set(membershipRows.map((membership) => membership.user_id).filter(Boolean)),
    );
    const { data: memberProfiles, error: memberProfileError } =
      memberIds.length > 0
        ? await supabaseAdmin
            .from("profiles")
            .select("id, full_name, phone, role")
            .in("id", memberIds)
        : { data: [], error: null };

    if (memberProfileError) throw memberProfileError;

    const memberProfileMap = new Map(
      ((memberProfiles || []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile,
      ]),
    );
    const memberEmailMap = new Map<string, string | null>();
    await Promise.all(
      memberIds.map(async (memberId) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(memberId);
        memberEmailMap.set(memberId, data.user?.email || null);
      }),
    );

    const result = companyRows.map((company) => {
      const ownerProfile = profileMap.get(company.owner_user_id) || null;
      const companyMemberships = membershipRows.filter((membership) => membership.company_id === company.id);
      const ownerMembership = companyMemberships.find((membership) => membership.user_id === company.owner_user_id) || null;
      const staffMemberships = companyMemberships.filter((membership) => membership.role === "staff");
      const activeStaffCount = staffMemberships.filter((membership) => membership.status === "active").length;
      const subscriptions = subscriptionRows
        .filter((subscription) => subscription.company_id === company.id)
        .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
      const periods = periodRows
        .filter((period) => period.company_id === company.id)
        .sort((a, b) => b.yil - a.yil);
      const paymentNotifications = paymentNotificationRows
        .filter((notification) => notification.company_id === company.id)
        .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
      const paymentNotification =
        paymentNotifications.find((notification) => notification.status === "pending") ||
        paymentNotifications[0] ||
        null;
      const subscription = subscriptions[0] || null;
      const billing = subscription
        ? calculateOnMuhasebeSubscriptionBilling(subscription, activeStaffCount)
        : null;
      const staff = staffMemberships.map((membership) => {
        const profile = memberProfileMap.get(membership.user_id);
        const email = memberEmailMap.get(membership.user_id) || null;

        return {
          id: membership.id,
          userId: membership.user_id,
          fullName: profile?.full_name || email || "Personel",
          phone: profile?.phone || null,
          email,
          status: membership.status,
          permissions: membership.permissions || {},
          createdAt: membership.created_at,
        };
      });

      return {
        id: company.id,
        code: company.company_code,
        name: company.name,
        sector: company.sector,
        phone: company.phone,
        paymentCode: customerPaymentCode(company),
        owner: {
          userId: company.owner_user_id,
          name: ownerProfile?.full_name || "-",
          phone: ownerProfile?.phone || company.phone,
          email: ownerEmailMap.get(company.owner_user_id) || null,
          accessStatus: ownerMembership?.status || "active",
        },
        subscription: subscription
          ? {
              ...subscription,
              billing_period_months: billing?.billingPeriodMonths || subscription.billing_period_months,
              monthly_price: billing?.monthlyPrice || subscription.monthly_price,
              total_price: billing?.totalPrice || subscription.total_price,
              staff_count: billing?.staffCount || 0,
              staff_monthly_price: ON_MUHASEBE_STAFF_MONTHLY_PRICE,
              staff_monthly_total: billing?.staffMonthlyTotal || 0,
              daysLeft: adminDaysLeft(subscription),
            }
          : null,
        paymentNotification,
        periods,
        staffCount: staffMemberships.length,
        activeStaffCount,
        staffMonthlyPrice: ON_MUHASEBE_STAFF_MONTHLY_PRICE,
        staffMonthlyTotal: activeStaffCount * ON_MUHASEBE_STAFF_MONTHLY_PRICE,
        staff,
      };
    });

    return NextResponse.json({ companies: result });
  } catch (error) {
    return NextResponse.json(
      {
        message: errorMessage(error, "Admin firmaları alınamadı."),
      },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireSitemixAdmin();

    const body = await request.json().catch(() => null);
    const action = cleanText(body?.action) as AdminAction;
    const companyId = cleanText(body?.companyId);

    if (!companyId || !action) {
      return NextResponse.json(
        { message: "Firma ve işlem bilgisi zorunlu." },
        { status: 400 },
      );
    }

    const company = await getCompany(companyId);

    if (action === "set_access") {
      const status = body?.status === "passive" ? "passive" : "active";
      await setOwnerMembership(company, status);

      const subscription = await getLatestSubscription(company.id);
      if (subscription) {
        const subscriptionUpdate: Record<string, string | null> = {
          status: status === "active" ? "active" : "cancelled",
        };
        if (status === "active") {
          subscriptionUpdate.trial_ends_at = nextSubscriptionEnd(subscription, "active");
          await closePendingPaymentNotifications(company.id, "approved");
        }

        await supabaseAdmin
          .from("subscriptions")
          .update(subscriptionUpdate)
          .eq("id", subscription.id);
        await syncLatestSubscriptionBilling(company.id);
      }

      return NextResponse.json({
        success: true,
        message: status === "active" ? "Firma erişimi aktif edildi." : "Firma erişimi pasife alındı.",
      });
    }

    if (action === "set_subscription") {
      const status = cleanText(body?.status) || "trial";
      const allowed = ["trial", "active", "expired", "cancelled"];
      if (!allowed.includes(status)) {
        return NextResponse.json({ message: "Geçersiz paket durumu." }, { status: 400 });
      }

      const subscription = await getLatestSubscription(company.id);
      if (!subscription) {
        return NextResponse.json({ message: "Paket kaydı bulunamadı." }, { status: 404 });
      }

      const update: Record<string, string | null> = { status };
      const trialEndsAt = cleanText(body?.trialEndsAt);
      if (trialEndsAt) {
        update.trial_ends_at = new Date(trialEndsAt).toISOString();
      } else {
        const automaticEnd = nextSubscriptionEnd(subscription, status);
        if (automaticEnd) update.trial_ends_at = automaticEnd;
      }

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update(update)
        .eq("id", subscription.id);

      if (error) throw error;
      await syncLatestSubscriptionBilling(company.id);
      if (status === "active" || status === "trial") await setOwnerMembership(company, "active");
      if (status === "active") await closePendingPaymentNotifications(company.id, "approved");

      return NextResponse.json({ success: true, message: "Paket durumu güncellendi." });
    }

    if (action === "create_period") {
      const year = normalizeWorkYear(body?.year, currentCalendarYear());
      const { error } = await supabaseAdmin
        .from("on_muhasebe_calisma_donemleri")
        .upsert(
          {
            company_id: company.id,
            yil: year,
            ...periodDates(year),
            durum: "acik",
            locked: false,
            created_by: company.owner_user_id,
          },
          { onConflict: "company_id,yil" },
        );

      if (error && !isMissingTableError(error)) throw error;
      return NextResponse.json({ success: true, message: `${year} dönemi hazırlandı.` });
    }

    if (action === "set_period_status") {
      const periodId = cleanText(body?.periodId);
      const status = cleanText(body?.status) || "acik";
      if (!periodId || !["acik", "kapali", "pasif"].includes(status)) {
        return NextResponse.json({ message: "Dönem bilgisi geçersiz." }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from("on_muhasebe_calisma_donemleri")
        .update({ durum: status, locked: status === "kapali" })
        .eq("id", periodId)
        .eq("company_id", company.id);

      if (error && !isMissingTableError(error)) throw error;
      return NextResponse.json({ success: true, message: "Dönem durumu güncellendi." });
    }

    if (action === "set_owner_email") {
      const email = cleanEmail(body?.email);
      if (!email || !email.includes("@")) {
        return NextResponse.json({ message: "Geçerli bir e-posta gir." }, { status: 400 });
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        company.owner_user_id,
        {
          email,
          email_confirm: true,
        },
      );

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Müşteri giriş e-postası güncellendi." });
    }

    if (action === "set_owner_password") {
      const password = cleanText(body?.password);
      if (!password || password.length < 6) {
        return NextResponse.json({ message: "Geçici şifre en az 6 karakter olmalı." }, { status: 400 });
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        company.owner_user_id,
        { password },
      );

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Müşteri şifresi geçici şifreyle güncellendi." });
    }

    if (action === "set_payment_notification_status") {
      const notificationStatus = cleanText(body?.status);
      if (!["approved", "rejected"].includes(notificationStatus)) {
        return NextResponse.json({ message: "Geçersiz ödeme bildirimi durumu." }, { status: 400 });
      }

      await closePendingPaymentNotifications(
        company.id,
        notificationStatus as "approved" | "rejected",
      );

      return NextResponse.json({
        success: true,
        message:
          notificationStatus === "approved"
            ? "Ödeme bildirimi onaylandı."
            : "Ödeme bildirimi kapatıldı.",
      });
    }

    return NextResponse.json({ message: "Bilinmeyen admin işlemi." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        message: errorMessage(error, "Admin işlemi tamamlanamadı."),
      },
      { status: 500 },
    );
  }
}

