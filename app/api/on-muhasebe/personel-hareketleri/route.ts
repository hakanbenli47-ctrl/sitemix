import { NextResponse } from "next/server";
import {
  getOnMuhasebeContext,
  isMissingTableError,
  requireOwner,
} from "@/lib/onMuhasebe/auth";
import {
  dateKey,
  getWorkYearFromRequest,
  referenceDateForWorkYear,
  workYearDateRange,
} from "@/lib/onMuhasebe/workYear";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type Period = "gunluk" | "haftalik" | "aylik" | "yillik";

type StaffMemberRow = {
  id: string;
  user_id: string;
  status: "active" | "passive";
  permissions: Record<string, boolean> | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type ActivityRow = {
  id: string;
  company_id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  module_key: string;
  action_type: string;
  title: string;
  detail: string | null;
  entity_table: string | null;
  entity_id: string | null;
  amount: number | null;
  movement_date: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function periodStart(period: Period, workYear: number) {
  const yearRange = workYearDateRange(workYear);
  const reference = referenceDateForWorkYear(workYear);

  if (period === "gunluk") {
    return dateKey(reference);
  }

  if (period === "haftalik") {
    const start = new Date(reference);
    start.setDate(start.getDate() - 6);
    const key = dateKey(start);
    return key < yearRange.start ? yearRange.start : key;
  }

  if (period === "aylik") {
    return dateKey(new Date(workYear, reference.getMonth(), 1));
  }

  return yearRange.start;
}

function periodLabel(period: Period) {
  if (period === "gunluk") return "Günlük";
  if (period === "haftalik") return "Haftalık";
  if (period === "aylik") return "Aylık";
  return "Yıllık";
}

function safePeriod(value: string | null): Period {
  if (value === "haftalik" || value === "aylik" || value === "yillik") {
    return value;
  }

  return "gunluk";
}

async function getStaff(companyId: string) {
  const { data: rows, error } = await supabaseAdmin
    .from("on_muhasebe_company_users")
    .select("id, user_id, status, permissions, created_at")
    .eq("company_id", companyId)
    .eq("role", "staff")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const staffRows = (rows || []) as StaffMemberRow[];
  const userIds = staffRows.map((row) => row.user_id);

  const { data: profiles } = userIds.length
    ? await supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", userIds)
    : { data: [] as ProfileRow[] };

  const profileMap = new Map<string, { fullName: string; phone: string }>(
    ((profiles || []) as ProfileRow[]).map((profile) => [
      profile.id,
      {
        fullName: profile.full_name || "",
        phone: profile.phone || "",
      },
    ]),
  );

  return Promise.all(
    staffRows.map(async (row) => {
      const profile = profileMap.get(row.user_id);
      const {
        data: { user },
      } = await supabaseAdmin.auth.admin.getUserById(row.user_id);

      return {
        id: row.id,
        userId: row.user_id,
        fullName: profile?.fullName || user?.email || "Personel",
        phone: profile?.phone || "",
        email: user?.email || "",
        status: row.status,
        createdAt: row.created_at,
      };
    }),
  );
}

function summarize(rows: ActivityRow[]) {
  const summary = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc.byModule[row.module_key] = (acc.byModule[row.module_key] || 0) + 1;
      acc.byAction[row.action_type] = (acc.byAction[row.action_type] || 0) + 1;
      acc.totalAmount += Number(row.amount || 0);
      return acc;
    },
    {
      total: 0,
      totalAmount: 0,
      byModule: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
    },
  );

  return summary;
}

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);

    const url = new URL(request.url);
    const period = safePeriod(url.searchParams.get("period"));
    const staffUserId = url.searchParams.get("staffUserId") || "all";
    const workYear = getWorkYearFromRequest(request);
    const yearRange = workYearDateRange(workYear);
    const startDate = periodStart(period, workYear);
    const staff = await getStaff(context.company.id);

    let query = supabaseAdmin
      .from("on_muhasebe_personel_hareketleri")
      .select(
        "id, company_id, actor_user_id, actor_role, module_key, action_type, title, detail, entity_table, entity_id, amount, movement_date, metadata, created_at",
      )
      .eq("company_id", context.company.id)
      .gte("movement_date", startDate)
      .lte("movement_date", yearRange.end)
      .order("created_at", { ascending: false })
      .limit(250);

    if (staffUserId !== "all") {
      query = query.eq("actor_user_id", staffUserId);
    } else {
      const staffIds = staff.map((item) => item.userId);

      if (staffIds.length > 0) {
        query = query.in("actor_user_id", staffIds);
      }
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({
          setupRequired: true,
          staff,
          activities: [],
          summary: summarize([]),
          period,
          periodLabel: periodLabel(period),
          workYear,
          message:
            "Personel hareket tablosu henüz kurulmamış. Supabase SQL dosyasını çalıştırınca hareketler görünür olur.",
        });
      }

      throw error;
    }

    const activities = (data || []) as ActivityRow[];

    return NextResponse.json({
      setupRequired: false,
      staff,
      activities,
      summary: summarize(activities),
      period,
      periodLabel: periodLabel(period),
      workYear,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Personel hareketleri alınamadı.",
      },
      { status: 500 },
    );
  }
}
