import { NextResponse } from "next/server";
import {
  getOnMuhasebeContext,
  isMissingTableError,
  requireOwner,
} from "@/lib/onMuhasebe/auth";
import {
  backupFileName,
  createCompanyBackup,
  sendBackupEmail,
  serializeBackup,
  totalBackupRows,
} from "@/lib/onMuhasebe/backup";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function logBackup({
  companyId,
  type,
  status,
  emailTo,
  fileName,
  rowCount,
  errorMessage,
}: {
  companyId: string;
  type: "manual" | "auto";
  status: "success" | "failed";
  emailTo: string | null;
  fileName: string;
  rowCount: number;
  errorMessage?: string | null;
}) {
  const { error } = await supabaseAdmin.from("on_muhasebe_backup_logs").insert({
    company_id: companyId,
    backup_type: type,
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

export async function POST(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);
    const { user, company } = context;
    const body = await request.json().catch(() => ({}));
    const emailTo =
      typeof body?.emailTo === "string" && body.emailTo.includes("@")
        ? body.emailTo.trim().toLowerCase()
        : user.email || null;

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

    await logBackup({
      companyId: company.id,
      type: "manual",
      status: email.status === "failed" ? "failed" : "success",
      emailTo,
      fileName,
      rowCount: totalBackupRows(backup.rowCounts),
      errorMessage: email.status === "failed" ? email.message : null,
    });

    return NextResponse.json({
      success: true,
      message:
        email.status === "sent"
          ? "Yedek oluşturuldu ve e-posta ile gönderildi."
          : "Yedek oluşturuldu. E-posta servisi tanımlı değilse dosyayı indirebilirsin.",
      fileName,
      backup,
      email,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Yedek oluşturulurken hata oluştu.",
      },
      { status: 500 },
    );
  }
}
