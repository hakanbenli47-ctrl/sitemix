import { NextResponse } from "next/server";
import { getOnMuhasebeContext } from "@/lib/onMuhasebe/auth";
import {
  type OnMuhasebeSubscriptionStatus,
  getOnMuhasebeDaysLeft,
  isSubscriptionExpired,
  onMuhasebePlans,
  onMuhasebeStatusLabels,
} from "@/lib/onMuhasebe/plans";
import {
  calculateOnMuhasebeSubscriptionBilling,
  getActiveStaffCount,
} from "@/lib/onMuhasebe/billing";
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

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);

    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .select(
          "id, company_id, user_id, plan, status, trial_started_at, trial_ends_at, billing_period_months, monthly_price, total_price, saving_amount, currency",
        )
        .eq("company_id", context.company.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<SubscriptionRecord>();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { message: "Paket bilgisi bulunamadı." },
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
      role: context.role,
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Paket durumu kontrol edilirken hata oluştu.",
      },
      { status: 500 },
    );
  }
}
