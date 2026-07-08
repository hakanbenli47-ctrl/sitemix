export type OnMuhasebePlanId = "monthly" | "six_month" | "yearly";

export type OnMuhasebeSubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "cancelled";

export const ON_MUHASEBE_TRIAL_DAYS = 7;

export const onMuhasebePlans: Record<
  OnMuhasebePlanId,
  {
    name: string;
    billingPeriodMonths: number;
    monthlyPrice: number;
    totalPrice: number;
    savingAmount: number;
  }
> = {
  monthly: {
    name: "Aylık Paket",
    billingPeriodMonths: 1,
    monthlyPrice: 399,
    totalPrice: 399,
    savingAmount: 0,
  },
  six_month: {
    name: "6 Aylık Paket",
    billingPeriodMonths: 6,
    monthlyPrice: 359,
    totalPrice: 2154,
    savingAmount: 240,
  },
  yearly: {
    name: "Yıllık Paket",
    billingPeriodMonths: 12,
    monthlyPrice: 319,
    totalPrice: 3828,
    savingAmount: 960,
  },
};

export const onMuhasebeStatusLabels: Record<
  OnMuhasebeSubscriptionStatus,
  string
> = {
  trial: "Deneme",
  active: "Aktif",
  expired: "Süresi Doldu",
  cancelled: "İptal",
};

export function isOnMuhasebePlanId(
  value: unknown,
): value is OnMuhasebePlanId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(onMuhasebePlans, value)
  );
}

export function addTrialDays(date: Date, dayCount = ON_MUHASEBE_TRIAL_DAYS) {
  const result = new Date(date);
  result.setDate(result.getDate() + dayCount);
  return result;
}

export function getOnMuhasebeDaysLeft(value?: string | null) {
  if (!value) return 0;

  const end = new Date(value).getTime();
  if (!Number.isFinite(end)) return 0;

  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isTrialExpired(
  status: OnMuhasebeSubscriptionStatus,
  trialEndsAt?: string | null,
) {
  if (status === "active") return false;
  if (status === "expired" || status === "cancelled") return true;
  if (status !== "trial" || !trialEndsAt) return true;

  return new Date(trialEndsAt).getTime() <= Date.now();
}
