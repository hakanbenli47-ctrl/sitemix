import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  isOnMuhasebePlanId,
  onMuhasebePlans,
  type OnMuhasebePlanId,
} from "@/lib/onMuhasebe/plans";

export const ON_MUHASEBE_STAFF_MONTHLY_PRICE = 99;

type SubscriptionLike = {
  id?: string;
  plan: string;
  billing_period_months?: number | null;
};

export function calculateOnMuhasebeSubscriptionBilling(
  subscription: SubscriptionLike,
  activeStaffCount: number,
) {
  const planId: OnMuhasebePlanId = isOnMuhasebePlanId(subscription.plan)
    ? subscription.plan
    : "monthly";
  const plan = onMuhasebePlans[planId];
  const billingPeriodMonths = Math.max(
    1,
    Number(subscription.billing_period_months || plan.billingPeriodMonths || 1),
  );
  const staffCount = Math.max(0, Number(activeStaffCount || 0));
  const staffMonthlyTotal = staffCount * ON_MUHASEBE_STAFF_MONTHLY_PRICE;

  return {
    planId,
    billingPeriodMonths,
    baseMonthlyPrice: plan.monthlyPrice,
    baseTotalPrice: plan.totalPrice,
    staffCount,
    staffMonthlyPrice: ON_MUHASEBE_STAFF_MONTHLY_PRICE,
    staffMonthlyTotal,
    staffTotalPrice: staffMonthlyTotal * billingPeriodMonths,
    monthlyPrice: plan.monthlyPrice + staffMonthlyTotal,
    totalPrice: plan.totalPrice + staffMonthlyTotal * billingPeriodMonths,
    savingAmount: plan.savingAmount,
  };
}

export async function getActiveStaffCount(companyId: string) {
  const { count, error } = await supabaseAdmin
    .from("on_muhasebe_company_users")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("role", "staff")
    .eq("status", "active");

  if (error) return 0;
  return count || 0;
}

export async function syncLatestSubscriptionBilling(companyId: string) {
  const { data: subscription, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, plan, billing_period_months")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionLike & { id: string }>();

  if (error || !subscription) return null;

  const activeStaffCount = await getActiveStaffCount(companyId);
  const billing = calculateOnMuhasebeSubscriptionBilling(
    subscription,
    activeStaffCount,
  );

  await supabaseAdmin
    .from("subscriptions")
    .update({
      billing_period_months: billing.billingPeriodMonths,
      monthly_price: billing.monthlyPrice,
      total_price: billing.totalPrice,
      saving_amount: billing.savingAmount,
    })
    .eq("id", subscription.id);

  return billing;
}
