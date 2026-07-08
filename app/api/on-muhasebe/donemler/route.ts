import { NextResponse } from "next/server";
import {
  getOnMuhasebeContext,
  isMissingTableError,
  requireOwner,
} from "@/lib/onMuhasebe/auth";
import { currentCalendarYear, normalizeWorkYear } from "@/lib/onMuhasebe/workYear";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type WorkPeriodRow = {
  id: string;
  company_id: string;
  yil: number;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  durum: "acik" | "kapali" | "pasif" | string;
  locked: boolean | null;
  created_at: string | null;
};

function periodDates(year: number) {
  return {
    baslangic_tarihi: `${year}-01-01`,
    bitis_tarihi: `${year}-12-31`,
  };
}

function cleanYear(value: unknown) {
  return normalizeWorkYear(value, currentCalendarYear());
}

async function listPeriods(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from("on_muhasebe_calisma_donemleri")
    .select("id, company_id, yil, baslangic_tarihi, bitis_tarihi, durum, locked, created_at")
    .eq("company_id", companyId)
    .neq("durum", "pasif")
    .order("yil", { ascending: false });

  if (error) throw error;

  return (data || []) as WorkPeriodRow[];
}

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    const periods = await listPeriods(context.company.id);

    return NextResponse.json({
      setupRequired: false,
      canCreatePeriod: context.isOwner,
      periods,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({
        setupRequired: true,
        canCreatePeriod: false,
        periods: [],
        message:
          "Çalışma dönemi tablosu henüz kurulmamış. Supabase SQL dosyasını çalıştırınca dönem seçimi aktif olur.",
      });
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Çalışma dönemleri alınamadı.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);

    const body = await request.json().catch(() => null);
    const year = cleanYear(body?.year);
    const dates = periodDates(year);

    const { error } = await supabaseAdmin
      .from("on_muhasebe_calisma_donemleri")
      .upsert(
        {
          company_id: context.company.id,
          yil: year,
          ...dates,
          durum: "acik",
          locked: false,
          created_by: context.user.id,
        },
        { onConflict: "company_id,yil" },
      );

    if (error) throw error;

    const periods = await listPeriods(context.company.id);

    return NextResponse.json({
      success: true,
      setupRequired: false,
      canCreatePeriod: true,
      periods,
      selectedYear: year,
      message: `${year} çalışma dönemi oluşturuldu.`,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        {
          message:
            "Çalışma dönemi tablosu kurulmadan dönem oluşturulamaz. Supabase SQL dosyasını çalıştır.",
        },
        { status: 501 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Çalışma dönemi oluşturulamadı.",
      },
      { status: 500 },
    );
  }
}
