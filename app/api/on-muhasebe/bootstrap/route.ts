import { NextResponse } from "next/server";
import {
  getOnMuhasebeContext,
  isMissingTableError,
} from "@/lib/onMuhasebe/auth";
import {
  getOnMuhasebeDaysLeft,
  isTrialExpired,
  onMuhasebePlans,
  onMuhasebeStatusLabels,
  type OnMuhasebeSubscriptionStatus,
} from "@/lib/onMuhasebe/plans";
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
  monthly_price: number;
  total_price: number;
  saving_amount: number;
  currency: string;
};

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
            "id, company_id, user_id, plan, status, trial_started_at, trial_ends_at, monthly_price, total_price, saving_amount, currency",
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
    const expired = isTrialExpired(
      subscription.status,
      subscription.trial_ends_at,
    );

    if (expired && subscription.status === "trial") {
      normalizedStatus = "expired";

      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", subscription.id);
    }

    const plan = onMuhasebePlans[subscription.plan];

    return NextResponse.json({
      allowed: !expired,
      reason: expired ? "trial_expired" : null,
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
        status: normalizedStatus,
        statusLabel: onMuhasebeStatusLabels[normalizedStatus],
        planLabel: plan?.name || subscription.plan,
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
