import { NextResponse } from "next/server";
import {
  getOnMuhasebeContext,
  isMissingTableError,
  requireOwner,
} from "@/lib/onMuhasebe/auth";
import {
  currentCalendarYear,
  normalizeWorkYear,
} from "@/lib/onMuhasebe/workYear";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type SettingsRecord = {
  company_id: string;
  auto_backup_enabled: boolean;
  backup_email: string | null;
  backup_frequency_hours: number;
  default_kdv_rate: number;
  low_stock_alert_enabled: boolean;
  receipt_prefix: string;
  whatsapp_support_enabled: boolean;
  active_work_year: number | null;
  created_at?: string;
  updated_at?: string;
};

const SETTINGS_SELECT =
  "company_id, auto_backup_enabled, backup_email, backup_frequency_hours, default_kdv_rate, low_stock_alert_enabled, receipt_prefix, whatsapp_support_enabled, active_work_year, created_at, updated_at";

const LEGACY_SETTINGS_SELECT =
  "company_id, auto_backup_enabled, backup_email, backup_frequency_hours, default_kdv_rate, low_stock_alert_enabled, receipt_prefix, whatsapp_support_enabled, created_at, updated_at";

function cleanEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function defaultSettings(companyId: string, email?: string | null): SettingsRecord {
  return {
    company_id: companyId,
    auto_backup_enabled: true,
    backup_email: email || null,
    backup_frequency_hours: 24,
    default_kdv_rate: 20,
    low_stock_alert_enabled: true,
    receipt_prefix: "FIS",
    whatsapp_support_enabled: true,
    active_work_year: null,
  };
}

function isMissingActiveWorkYearColumn(error: unknown) {
  const candidate = error as { code?: string; message?: string } | null;
  return (
    candidate?.code === "42703" ||
    String(candidate?.message || "").includes("active_work_year")
  );
}

function withActiveWorkYear(row: Partial<SettingsRecord> | null | undefined) {
  if (!row) return null;
  return {
    ...row,
    active_work_year: row.active_work_year ?? null,
  } as SettingsRecord;
}

async function readSettings(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from("on_muhasebe_settings")
    .select(SETTINGS_SELECT)
    .eq("company_id", companyId)
    .maybeSingle<SettingsRecord>();

  if (!error) {
    return { data: withActiveWorkYear(data), missingActiveWorkYear: false };
  }

  if (!isMissingActiveWorkYearColumn(error)) {
    throw error;
  }

  const legacy = await supabaseAdmin
    .from("on_muhasebe_settings")
    .select(LEGACY_SETTINGS_SELECT)
    .eq("company_id", companyId)
    .maybeSingle<Omit<SettingsRecord, "active_work_year">>();

  if (legacy.error) throw legacy.error;

  return {
    data: withActiveWorkYear(legacy.data),
    missingActiveWorkYear: true,
  };
}

function buildPayload(
  body: Record<string, unknown>,
  companyId: string,
  fallbackEmail: string | null | undefined,
): SettingsRecord {
  const backupEmail = cleanEmail(body.backupEmail) || fallbackEmail || null;
  const frequency = Math.max(24, Number(body.backupFrequencyHours || 24));
  const defaultKdvRate = Math.min(
    100,
    Math.max(0, Number(body.defaultKdvRate ?? 20)),
  );
  const receiptPrefix =
    cleanEmail(body.receiptPrefix).replace(/[^a-z0-9-]/g, "").toUpperCase() ||
    "FIS";
  const activeWorkYear = body.activeWorkYear
    ? normalizeWorkYear(body.activeWorkYear, currentCalendarYear())
    : null;

  return {
    company_id: companyId,
    auto_backup_enabled: Boolean(body.autoBackupEnabled),
    backup_email: backupEmail,
    backup_frequency_hours: frequency,
    default_kdv_rate: defaultKdvRate,
    low_stock_alert_enabled: Boolean(body.lowStockAlertEnabled),
    receipt_prefix: receiptPrefix.slice(0, 12),
    whatsapp_support_enabled: Boolean(body.whatsappSupportEnabled),
    active_work_year: activeWorkYear,
  };
}

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);
    const { user, company } = context;

    const { data, missingActiveWorkYear } = await readSettings(company.id);

    return NextResponse.json({
      settings: data || defaultSettings(company.id, user.email),
      setupRequired: missingActiveWorkYear,
      message: missingActiveWorkYear
        ? "Aktif dönem ayarı için Supabase SQL güncellemesini çalıştırmalısın."
        : undefined,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      try {
        const context = await getOnMuhasebeContext(request);
        return NextResponse.json({
          settings: defaultSettings(context.company.id, context.user.email),
          setupRequired: true,
          message:
            "Yedekleme ayar tablosu henüz kurulmamış. SQL kurulum dosyasını çalıştırınca otomatik yedekler aktif olur.",
        });
      } catch {
        // Normal hata cevabina dus.
      }
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Ayarlar yüklenirken hata oluştu.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);
    const { user, company } = context;
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body) {
      return NextResponse.json(
        { message: "Geçersiz ayar isteği." },
        { status: 400 },
      );
    }

    const payload = buildPayload(body, company.id, user.email);

    if (payload.backup_email && !payload.backup_email.includes("@")) {
      return NextResponse.json(
        { message: "Geçerli bir yedek e-posta adresi gir." },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("on_muhasebe_settings")
      .upsert(payload, { onConflict: "company_id" })
      .select(SETTINGS_SELECT)
      .single<SettingsRecord>();

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json(
          {
            message:
              "Yedekleme ayar tablosu kurulmadan ayarlar kaydedilemez. supabase/on_muhasebe_backup_setup.sql dosyasını çalıştır.",
          },
          { status: 501 },
        );
      }

      if (isMissingActiveWorkYearColumn(error)) {
        const legacyPayload = { ...payload };
        delete (legacyPayload as Partial<SettingsRecord>).active_work_year;

        const legacy = await supabaseAdmin
          .from("on_muhasebe_settings")
          .upsert(legacyPayload, { onConflict: "company_id" })
          .select(LEGACY_SETTINGS_SELECT)
          .single<Omit<SettingsRecord, "active_work_year">>();

        if (legacy.error) throw legacy.error;

        return NextResponse.json({
          success: true,
          setupRequired: true,
          message:
            "Ayarlar kaydedildi. Girişte seçili dönem için Supabase SQL güncellemesini çalıştırmalısın.",
          settings: withActiveWorkYear(legacy.data),
        });
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Ayarlar kaydedildi.",
      settings: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Ayarlar kaydedilirken hata oluştu.",
      },
      { status: 500 },
    );
  }
}
