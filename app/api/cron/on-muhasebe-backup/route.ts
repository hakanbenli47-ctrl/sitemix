import { NextResponse } from "next/server";
import { isMissingTableError } from "@/lib/onMuhasebe/auth";
import {
  backupFileName,
  createCompanyBackup,
  sendBackupEmail,
  serializeBackup,
  totalBackupRows,
} from "@/lib/onMuhasebe/backup";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type SettingsRecord = {
  company_id: string;
  auto_backup_enabled: boolean;
  backup_email: string | null;
  backup_frequency_hours: number | null;
};

type CompanyRecord = {
  id: string;
  owner_user_id: string;
  company_code: string | null;
  name: string;
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) return true;

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function hasRecentSuccessfulBackup(companyId: string, hours: number) {
  const threshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("on_muhasebe_backup_logs")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "success")
    .gte("created_at", threshold)
    .limit(1);

  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }

  return Boolean(data?.length);
}

async function logBackup({
  companyId,
  status,
  emailTo,
  fileName,
  rowCount,
  errorMessage,
}: {
  companyId: string;
  status: "success" | "failed";
  emailTo: string | null;
  fileName: string;
  rowCount: number;
  errorMessage?: string | null;
}) {
  const { error } = await supabaseAdmin.from("on_muhasebe_backup_logs").insert({
    company_id: companyId,
    backup_type: "auto",
    status,
    email_to: emailTo,
    file_name: fileName,
    row_count: rowCount,
    error_message: errorMessage || null,
  });

  if (error && !isMissingTableError(error)) {
    throw error;
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Yetkisiz cron isteği." }, { status: 401 });
  }

  try {
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("on_muhasebe_settings")
      .select("company_id, auto_backup_enabled, backup_email, backup_frequency_hours")
      .eq("auto_backup_enabled", true)
      .limit(500);

    if (settingsError) {
      if (isMissingTableError(settingsError)) {
        return NextResponse.json({
          success: false,
          setupRequired: true,
          message:
            "Otomatik yedek için on_muhasebe_settings tablosu kurulmalı.",
        });
      }

      throw settingsError;
    }

    const results = [];

    for (const setting of (settings || []) as SettingsRecord[]) {
      const frequencyHours = Math.max(24, Number(setting.backup_frequency_hours || 24));

      if (await hasRecentSuccessfulBackup(setting.company_id, frequencyHours)) {
        results.push({
          companyId: setting.company_id,
          status: "skipped_recent_backup",
        });
        continue;
      }

      const { data: company, error: companyError } = await supabaseAdmin
        .from("companies")
        .select("id, owner_user_id, company_code, name")
        .eq("id", setting.company_id)
        .single<CompanyRecord>();

      if (companyError || !company) {
        results.push({
          companyId: setting.company_id,
          status: "failed",
          message: companyError?.message || "Firma bulunamadı.",
        });
        continue;
      }

      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.admin.getUserById(company.owner_user_id);

      if (userError || !user) {
        results.push({
          companyId: setting.company_id,
          status: "failed",
          message: userError?.message || "Kullanıcı bulunamadı.",
        });
        continue;
      }

      const emailTo = setting.backup_email || user.email || null;

      try {
        const backup = await createCompanyBackup({
          userId: user.id,
          userEmail: user.email || "",
          companyId: company.id,
          companyName: company.name,
          companyCode: company.company_code,
        });
        const json = serializeBackup(backup);
        const fileName = backupFileName(company.name);
        const email = emailTo
          ? await sendBackupEmail({
              to: emailTo,
              companyName: company.name,
              fileName,
              json,
            })
          : { status: "not_configured" as const };
        const failed = email.status === "failed" || email.status === "not_configured";

        await logBackup({
          companyId: company.id,
          status: failed ? "failed" : "success",
          emailTo,
          fileName,
          rowCount: totalBackupRows(backup.rowCounts),
          errorMessage:
            email.status === "failed"
              ? email.message
              : email.status === "not_configured"
                ? "RESEND_API_KEY veya BACKUP_FROM_EMAIL tanımlı değil."
                : null,
        });

        results.push({
          companyId: company.id,
          companyName: company.name,
          status: failed ? "failed" : "sent",
          email,
        });
      } catch (error) {
        results.push({
          companyId: company.id,
          companyName: company.name,
          status: "failed",
          message:
            error instanceof Error
              ? error.message
              : "Otomatik yedek alınamadı.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Otomatik yedek çalışırken hata oluştu.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
