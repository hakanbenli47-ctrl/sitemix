export const ON_MUHASEBE_WORK_YEAR_STORAGE_KEY = "onMuhasebeCalismaYili";
export const ON_MUHASEBE_MIN_WORK_YEAR = 2020;
export const ON_MUHASEBE_MAX_WORK_YEAR = 2100;

export type OnMuhasebeWorkPeriod = {
  id: string;
  yil: number;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  durum: "acik" | "kapali" | "pasif" | string;
  locked?: boolean | null;
  created_at?: string | null;
};

export function currentCalendarYear() {
  return new Date().getFullYear();
}

export function normalizeWorkYear(value: unknown, fallback = currentCalendarYear()) {
  const parsed = Number(value);

  if (
    Number.isInteger(parsed) &&
    parsed >= ON_MUHASEBE_MIN_WORK_YEAR &&
    parsed <= ON_MUHASEBE_MAX_WORK_YEAR
  ) {
    return parsed;
  }

  return fallback;
}

export function sortWorkPeriods(periods: OnMuhasebeWorkPeriod[]) {
  return [...periods].sort((a, b) => b.yil - a.yil);
}

export function isWorkYearRegistered(
  periods: OnMuhasebeWorkPeriod[],
  workYear: unknown,
) {
  const normalized = normalizeWorkYear(workYear);
  return periods.some((period) => Number(period.yil) === normalized);
}

export function pickRegisteredWorkYear(
  periods: OnMuhasebeWorkPeriod[],
  preferredYear?: unknown,
) {
  const sorted = sortWorkPeriods(periods);

  if (sorted.length === 0) {
    return null;
  }

  const preferred = normalizeWorkYear(preferredYear, sorted[0].yil);
  const matched = sorted.find((period) => Number(period.yil) === preferred);

  return matched?.yil ?? sorted[0].yil;
}

export function getBrowserWorkYear() {
  if (typeof window === "undefined") {
    return currentCalendarYear();
  }

  const storedYear = window.localStorage.getItem(ON_MUHASEBE_WORK_YEAR_STORAGE_KEY);
  return normalizeWorkYear(storedYear);
}

export function setBrowserWorkYear(year: number) {
  if (typeof window === "undefined") return;

  const normalized = normalizeWorkYear(year);
  window.localStorage.setItem(ON_MUHASEBE_WORK_YEAR_STORAGE_KEY, String(normalized));
}

export function clearBrowserWorkYear() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ON_MUHASEBE_WORK_YEAR_STORAGE_KEY);
}

export function getWorkYearFromRequest(request: Request) {
  const url = new URL(request.url);
  const queryYear = url.searchParams.get("workYear");
  const headerYear = request.headers.get("x-on-muhasebe-work-year");

  return normalizeWorkYear(queryYear || headerYear);
}

export function workYearDateRange(workYear: number) {
  const normalized = normalizeWorkYear(workYear);

  return {
    workYear: normalized,
    start: `${normalized}-01-01`,
    end: `${normalized}-12-31`,
    startIso: `${normalized}-01-01T00:00:00.000Z`,
    endIso: `${normalized}-12-31T23:59:59.999Z`,
  };
}

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function referenceDateForWorkYear(workYear: number) {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (workYear === currentYear) {
    return now;
  }

  const month = now.getMonth();
  const day = Math.min(now.getDate(), 28);

  return new Date(workYear, month, day);
}

export function todayForWorkYear(workYear: number) {
  return dateKey(referenceDateForWorkYear(workYear));
}

export function monthStartForWorkYear(workYear: number) {
  const reference = referenceDateForWorkYear(workYear);
  return dateKey(new Date(workYear, reference.getMonth(), 1));
}

export function weekStartForWorkYear(workYear: number) {
  const reference = referenceDateForWorkYear(workYear);
  const result = new Date(reference);
  const day = result.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + mondayOffset);

  if (result.getFullYear() < workYear) {
    return `${workYear}-01-01`;
  }

  if (result.getFullYear() > workYear) {
    return `${workYear}-12-31`;
  }

  return dateKey(result);
}

export function buildYearScopedUrl(path: string, workYear?: number) {
  const normalized = normalizeWorkYear(workYear ?? getBrowserWorkYear());
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}workYear=${normalized}`;
}
