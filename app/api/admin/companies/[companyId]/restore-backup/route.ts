import { NextResponse } from "next/server";
import {
  parseBackupPayload,
  restoreCompanyBackup,
  type RestoreCompany,
} from "@/lib/onMuhasebe/backupRestore";
import { requireSitemixAdmin } from "@/lib/sitemixAdminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MAX_BACKUP_FILE_SIZE = 30 * 1024 * 1024;

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ companyId: string }> },
) {
  try {
    await requireSitemixAdmin();

    const { companyId } = await context.params;
    if (!companyId) {
      return NextResponse.json(
        { message: "Firma bilgisi bulunamadi." },
        { status: 400 },
      );
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, owner_user_id, company_code, name")
      .eq("id", companyId)
      .single<RestoreCompany>();

    if (companyError || !company) {
      return NextResponse.json(
        { message: companyError?.message || "Firma bulunamadi." },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("backup");

    if (!file || typeof file === "string" || typeof file.text !== "function") {
      return NextResponse.json(
        { message: "Geri yuklenecek JSON yedek dosyasini secmelisin." },
        { status: 400 },
      );
    }

    if (typeof file.size === "number" && file.size > MAX_BACKUP_FILE_SIZE) {
      return NextResponse.json(
        { message: "Yedek dosyasi cok buyuk. En fazla 30 MB yuklenebilir." },
        { status: 400 },
      );
    }

    const payload = parseBackupPayload(await file.text());
    const result = await restoreCompanyBackup({
      company,
      payload,
      fileName: "name" in file && typeof file.name === "string" ? file.name : "yedek.json",
    });

    return NextResponse.json({
      success: true,
      message: `${company.name} yedegi geri yuklendi. ${result.rowCount} satir is verisi dosyadan geri yazildi.`,
      restore: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: errorMessage(error, "Yedek geri yuklenirken hata olustu."),
      },
      { status: 500 },
    );
  }
}
