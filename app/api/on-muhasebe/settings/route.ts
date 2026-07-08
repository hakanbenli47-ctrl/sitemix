import { NextResponse } from "next/server";
import {
  getOnMuhasebeContext,
  isMissingTableError,
  requireOwner,
} from "@/lib/onMuhasebe/auth";
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
  created_at?: string;
  updated_at?: string;
};

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
  };
}

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);
    const { user, company } = context;

    const { data, error } = await supabaseAdmin
      .from("on_muhasebe_settings")
      .select(
        "company_id, auto_backup_enabled, backup_email, backup_frequency_hours, default_kdv_rate, low_stock_alert_enabled, receipt_prefix, whatsapp_support_enabled, created_at, updated_at",
      )
      .eq("company_id", company.id)
      .maybeSingle<SettingsRecord>();

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({
          settings: defaultSettings(company.id, user.email),
          setupRequired: true,
          message:
            "Yedekleme ayar tablosu henüz kurulmamış. SQL kurulum dosyasını çalıştırınca otomatik yedekler aktif olur.",
        });
      }

      throw error;
    }

    return NextResponse.json({
      settings: data || defaultSettings(company.id, user.email),
      setupRequired: false,
    });
  } catch (error) {
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
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Geçersiz ayar isteği." },
        { status: 400 },
      );
    }

    const backupEmail = cleanEmail(body.backupEmail) || user.email || null;
    const autoBackupEnabled = Boolean(body.autoBackupEnabled);
    const frequency = Math.max(24, Number(body.backupFrequencyHours || 24));
    const defaultKdvRate = Math.min(
      100,
      Math.max(0, Number(body.defaultKdvRate ?? 20)),
    );
    const receiptPrefix =
      cleanEmail(body.receiptPrefix).replace(/[^a-z0-9-]/g, "").toUpperCase() ||
      "FIS";

    if (backupEmail && !backupEmail.includes("@")) {
      return NextResponse.json(
        { message: "Geçerli bir yedek e-posta adresi gir." },
        { status: 400 },
      );
    }

    const payload: SettingsRecord = {
      company_id: company.id,
      auto_backup_enabled: autoBackupEnabled,
      backup_email: backupEmail,
      backup_frequency_hours: frequency,
      default_kdv_rate: defaultKdvRate,
      low_stock_alert_enabled: Boolean(body.lowStockAlertEnabled),
      receipt_prefix: receiptPrefix.slice(0, 12),
      whatsapp_support_enabled: Boolean(body.whatsappSupportEnabled),
    };

    const { data, error } = await supabaseAdmin
      .from("on_muhasebe_settings")
      .upsert(payload, { onConflict: "company_id" })
      .select(
        "company_id, auto_backup_enabled, backup_email, backup_frequency_hours, default_kdv_rate, low_stock_alert_enabled, receipt_prefix, whatsapp_support_enabled, created_at, updated_at",
      )
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
