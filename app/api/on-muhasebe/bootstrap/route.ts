import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getOnMuhasebeContext,
  isOnMuhasebeAccessError,
  isMissingTableError,
} from "@/lib/onMuhasebe/auth";
import {
  getOnMuhasebeDaysLeft,
  isSubscriptionExpired,
  onMuhasebePlans,
  onMuhasebeStatusLabels,
  type OnMuhasebeSubscriptionStatus,
} from "@/lib/onMuhasebe/plans";
import {
  calculateOnMuhasebeSubscriptionBilling,
  getActiveStaffCount,
} from "@/lib/onMuhasebe/billing";
import { getWorkYearFromRequest } from "@/lib/onMuhasebe/workYear";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type SubscriptionRecord = {
  id: string;
  company_id: string;
  user_id: string;
  plan: keyof typeof onMuhasebePlans;
  status: OnMuhasebeSubscriptionStatus;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  billing_period_months: number | null;
  monthly_price: number;
  total_price: number;
  saving_amount: number;
  currency: string;
};

type PassiveMembershipRecord = {
  company_id: string;
  role: "owner" | "staff";
};

type PassiveCompanyRecord = {
  id: string;
  owner_user_id: string;
  company_code: string | null;
  name: string;
  sector: string | null;
  phone: string | null;
};

async function getPassiveAccountSnapshot(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("on_muhasebe_company_users")
      .select("company_id, role")
      .eq("user_id", user.id)
      .maybeSingle<PassiveMembershipRecord>();

    if (membershipError || !membership) return null;

    const [{ data: company }, { data: subscription }] = await Promise.all([
      supabaseAdmin
        .from("companies")
        .select("id, owner_user_id, company_code, name, sector, phone")
        .eq("id", membership.company_id)
        .maybeSingle<PassiveCompanyRecord>(),
      supabaseAdmin
        .from("subscriptions")
        .select(
          "id, company_id, user_id, plan, status, trial_started_at, trial_ends_at, billing_period_months, monthly_price, total_price, saving_amount, currency",
        )
        .eq("company_id", membership.company_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<SubscriptionRecord>(),
    ]);

    if (!company || !subscription) return null;

    const plan = onMuhasebePlans[subscription.plan];
    const activeStaffCount = await getActiveStaffCount(membership.company_id);
    const billing = calculateOnMuhasebeSubscriptionBilling(
      subscription,
      activeStaffCount,
    );

    return {
      company,
      role: membership.role,
      subscription: {
        ...subscription,
        billing_period_months: billing.billingPeriodMonths,
        monthly_price: billing.monthlyPrice,
        total_price: billing.totalPrice,
        saving_amount: billing.savingAmount,
        staff_count: billing.staffCount,
        staff_monthly_price: billing.staffMonthlyPrice,
        staff_monthly_total: billing.staffMonthlyTotal,
        statusLabel: onMuhasebeStatusLabels.cancelled,
        planLabel: plan?.name || subscription.plan,
        expiresAt: subscription.trial_ends_at,
        daysLeft: 0,
        trialDaysLeft: 0,
      },
    };
  } catch {
    return null;
  }
}
async function getPeriods(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from("on_muhasebe_calisma_donemleri")
    .select("id, company_id, yil, baslangic_tarihi, bitis_tarihi, durum, locked, created_at")
    .eq("company_id", companyId)
    .neq("durum", "pasif")
    .order("yil", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    const workYear = getWorkYearFromRequest(request);

    const [profileResponse, subscriptionResponse, periodsResult] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("id", context.user.id)
          .maybeSingle(),
        supabaseAdmin
          .from("subscriptions")
          .select(
            "id, company_id, user_id, plan, status, trial_started_at, trial_ends_at, billing_period_months, monthly_price, total_price, saving_amount, currency",
          )
          .eq("company_id", context.company.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<SubscriptionRecord>(),
        getPeriods(context.company.id)
          .then((periods) => ({
            setupRequired: false,
            periods,
            message: null as string | null,
          }))
          .catch((error) => {
            if (!isMissingTableError(error)) throw error;

            return {
              setupRequired: true,
              periods: [],
              message:
                "Calisma donemi tablosu henuz kurulmamis. Supabase SQL dosyasi calistirilinca donem secimi aktif olur.",
            };
          }),
      ]);

    if (profileResponse.error) throw profileResponse.error;

    const subscription = subscriptionResponse.data;

    if (subscriptionResponse.error || !subscription) {
      return NextResponse.json(
        { message: "Paket bilgisi bulunamadi." },
        { status: 404 },
      );
    }

    let normalizedStatus = subscription.status;
    const expired = isSubscriptionExpired(
      subscription.status,
      subscription.trial_ends_at,
    );

    if (expired && (subscription.status === "trial" || subscription.status === "active")) {
      normalizedStatus = "expired";

      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", subscription.id);
    }

    const plan = onMuhasebePlans[subscription.plan];
    const activeStaffCount = await getActiveStaffCount(context.company.id);
    const billing = calculateOnMuhasebeSubscriptionBilling(
      subscription,
      activeStaffCount,
    );

    return NextResponse.json({
      allowed: !expired,
      reason: expired ? "subscription_expired" : null,
      user: {
        id: context.user.id,
        email: context.user.email || null,
      },
      profile: profileResponse.data || null,
      company: context.company,
      role: context.role,
      permissions: context.permissions,
      isOwner: context.isOwner,
      workYear,
      subscription: {
        ...subscription,
        billing_period_months: billing.billingPeriodMonths,
        monthly_price: billing.monthlyPrice,
        total_price: billing.totalPrice,
        saving_amount: billing.savingAmount,
        staff_count: billing.staffCount,
        staff_monthly_price: billing.staffMonthlyPrice,
        staff_monthly_total: billing.staffMonthlyTotal,
        status: normalizedStatus,
        statusLabel: onMuhasebeStatusLabels[normalizedStatus],
        planLabel: plan?.name || subscription.plan,
        expiresAt: subscription.trial_ends_at,
        daysLeft: getOnMuhasebeDaysLeft(subscription.trial_ends_at),
        trialDaysLeft: getOnMuhasebeDaysLeft(subscription.trial_ends_at),
      },
      periods: {
        setupRequired: periodsResult.setupRequired,
        canCreatePeriod: context.isOwner,
        periods: periodsResult.periods,
        message: periodsResult.message,
      },
    });
  } catch (error) {
    if (isOnMuhasebeAccessError(error)) {
      const snapshot = await getPassiveAccountSnapshot(request);

      return NextResponse.json({
        allowed: false,
        reason: error.reason,
        message: error.message,
        role: snapshot?.role || "owner",
        company: snapshot?.company || null,
        subscription: snapshot?.subscription || {
          status: "cancelled",
          statusLabel: "Pasif",
          planLabel: "Panel erişimi",
          trial_ends_at: null,
          expiresAt: null,
          daysLeft: 0,
          trialDaysLeft: 0,
        },
      });
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Panel bilgileri alinirken hata olustu.",
      },
      { status: 500 },
    );
  }
}
