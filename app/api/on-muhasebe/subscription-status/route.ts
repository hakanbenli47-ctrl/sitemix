import { NextResponse } from "next/server";
import { getOnMuhasebeContext } from "@/lib/onMuhasebe/auth";
import {
  type OnMuhasebeSubscriptionStatus,
  getOnMuhasebeDaysLeft,
  isTrialExpired,
  onMuhasebePlans,
  onMuhasebeStatusLabels,
} from "@/lib/onMuhasebe/plans";
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

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);

    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .select(
          "id, company_id, user_id, plan, status, trial_started_at, trial_ends_at, monthly_price, total_price, saving_amount, currency",
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
      subscription: {
        ...subscription,
        status: normalizedStatus,
        statusLabel: onMuhasebeStatusLabels[normalizedStatus],
        planLabel: plan?.name || subscription.plan,
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
