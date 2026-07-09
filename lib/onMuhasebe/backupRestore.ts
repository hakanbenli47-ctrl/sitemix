import {
  createCompanyBackup,
  type BackupPayload,
} from "@/lib/onMuhasebe/backup";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type BackupRecord = Record<string, unknown>;

export type RestoreCompany = {
  id: string;
  owner_user_id: string;
  company_code: string | null;
  name: string;
};

type RestoreTable = {
  key: string;
  table: string;
  optional?: boolean;
  sanitize?: (row: BackupRecord, company: RestoreCompany) => BackupRecord | null;
};

const restoreTables: RestoreTable[] = [
  {
    key: "on_muhasebe_settings",
    table: "on_muhasebe_settings",
    optional: true,
  },
  {
    key: "on_muhasebe_calisma_donemleri",
    table: "on_muhasebe_calisma_donemleri",
    optional: true,
  },
  {
    key: "cari_hesaplar",
    table: "cari_hesaplar",
  },
  {
    key: "urun_kategorileri",
    table: "urun_kategorileri",
  },
  {
    key: "urunler",
    table: "urunler",
  },
  {
    key: "kasa_hesaplari",
    table: "kasa_hesaplari",
  },
  {
    key: "gelir_gider_kategorileri",
    table: "gelir_gider_kategorileri",
  },
  {
    key: "on_muhasebe_yil_devirleri",
    table: "on_muhasebe_yil_devirleri",
    optional: true,
  },
  {
    key: "on_muhasebe_cari_devirleri",
    table: "on_muhasebe_cari_devirleri",
    optional: true,
  },
  {
    key: "cari_hareketleri",
    table: "cari_hareketleri",
  },
  {
    key: "stok_hareketleri",
    table: "stok_hareketleri",
  },
  {
    key: "kasa_hareketleri",
    table: "kasa_hareketleri",
  },
  {
    key: "fatura_fisleri",
    table: "fatura_fisleri",
  },
  {
    key: "fatura_fis_kalemleri",
    table: "fatura_fis_kalemleri",
  },
  {
    key: "on_muhasebe_personel_hareketleri",
    table: "on_muhasebe_personel_hareketleri",
    optional: true,
    sanitize: (row) => ({
      ...row,
      actor_user_id: null,
    }),
  },
];

function isBackupRecord(value: unknown): value is BackupRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const supabaseError = error as { code?: string; message?: string };
  const message = supabaseError.message?.toLowerCase() || "";

  return (
    supabaseError.code === "42P01" ||
    supabaseError.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function tableRows(payload: BackupPayload, key: string) {
  const rows = payload.tables?.[key];
  return Array.isArray(rows) ? rows : null;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function parseBackupPayload(raw: string): BackupPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Yedek dosyasi okunamadi. JSON dosyasi secmelisin.");
  }

  if (!isBackupRecord(parsed)) {
    throw new Error("Yedek dosyasi gecersiz.");
  }

  const payload = parsed as BackupPayload;

  if (!isBackupRecord(payload.metadata)) {
    throw new Error("Yedek dosyasinda firma bilgisi bulunamadi.");
  }

  if (!isBackupRecord(payload.tables)) {
    throw new Error("Yedek dosyasinda tablo verileri bulunamadi.");
  }

  for (const table of restoreTables) {
    if (!table.optional && tableRows(payload, table.key) === null) {
      throw new Error(`${table.key} verisi yedek dosyasinda bulunamadi.`);
    }
  }

  return payload;
}

export function assertBackupBelongsToCompany(
  payload: BackupPayload,
  company: RestoreCompany,
) {
  const backupCompanyId =
    typeof payload.metadata.companyId === "string"
      ? payload.metadata.companyId.trim()
      : "";
  const backupCompanyCode =
    typeof payload.metadata.companyCode === "string"
      ? payload.metadata.companyCode.trim()
      : "";
  const companyCode = company.company_code?.trim() || "";

  if (backupCompanyId === company.id) return;
  if (backupCompanyCode && companyCode && backupCompanyCode === companyCode) return;

  throw new Error(
    "Bu yedek secili firmaya ait gorunmuyor. Yanlis firmanin verisini ezmemek icin islem durduruldu.",
  );
}

function normalizeRestoreRows(
  payload: BackupPayload,
  table: RestoreTable,
  company: RestoreCompany,
) {
  const rows = tableRows(payload, table.key);
  if (rows === null) return null;

  const normalizedRows: BackupRecord[] = [];

  for (const row of rows) {
    if (!isBackupRecord(row)) continue;

    const sanitized = table.sanitize ? table.sanitize(row, company) : row;
    if (!sanitized) continue;

    normalizedRows.push({
      ...sanitized,
      company_id: company.id,
    });
  }

  return normalizedRows;
}

async function deleteCompanyRows(table: RestoreTable, companyId: string) {
  const { error } = await supabaseAdmin
    .from(table.table)
    .delete()
    .eq("company_id", companyId);

  if (error) {
    if (table.optional && isMissingTableError(error)) return;
    throw new Error(`${table.table} temizlenemedi: ${error.message}`);
  }
}

async function insertRows(table: RestoreTable, rows: BackupRecord[]) {
  if (rows.length === 0) return;

  const chunkSize = 500;
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabaseAdmin.from(table.table).insert(chunk);

    if (error) {
      if (table.optional && isMissingTableError(error)) return;
      throw new Error(`${table.table} geri yuklenemedi: ${error.message}`);
    }
  }
}

async function replaceCompanyBusinessData(
  payload: BackupPayload,
  company: RestoreCompany,
) {
  const restoredRows: Record<string, number> = {};
  const tablesToRestore = restoreTables.filter((table) => {
    const rows = tableRows(payload, table.key);
    return rows !== null || !table.optional;
  });

  for (const table of [...tablesToRestore].reverse()) {
    await deleteCompanyRows(table, company.id);
  }

  for (const table of tablesToRestore) {
    const rows = normalizeRestoreRows(payload, table, company) || [];
    await insertRows(table, rows);
    restoredRows[table.key] = rows.length;
  }

  return restoredRows;
}

async function logRestore({
  companyId,
  status,
  fileName,
  rowCount,
  backupExportedAt,
  errorMessage: restoreErrorMessage,
}: {
  companyId: string;
  status: "success" | "failed";
  fileName: string;
  rowCount: number;
  backupExportedAt?: string | null;
  errorMessage?: string | null;
}) {
  const { error } = await supabaseAdmin
    .from("on_muhasebe_restore_logs")
    .insert({
      company_id: companyId,
      status,
      file_name: fileName,
      row_count: rowCount,
      backup_exported_at: backupExportedAt || null,
      error_message: restoreErrorMessage || null,
    });

  if (error && !isMissingTableError(error)) {
    throw error;
  }
}

export async function restoreCompanyBackup({
  company,
  payload,
  fileName,
}: {
  company: RestoreCompany;
  payload: BackupPayload;
  fileName: string;
}) {
  assertBackupBelongsToCompany(payload, company);

  const beforeRestoreBackup = await createCompanyBackup({
    userId: company.owner_user_id,
    userEmail: "",
    companyId: company.id,
    companyName: company.name,
    companyCode: company.company_code,
  });

  const backupExportedAt =
    typeof payload.metadata.exportedAt === "string"
      ? payload.metadata.exportedAt
      : null;

  try {
    const restoredRows = await replaceCompanyBusinessData(payload, company);
    const rowCount = Object.values(restoredRows).reduce(
      (total, count) => total + count,
      0,
    );

    await logRestore({
      companyId: company.id,
      status: "success",
      fileName,
      rowCount,
      backupExportedAt,
    }).catch(() => null);

    return {
      restoredRows,
      rowCount,
      backupExportedAt,
    };
  } catch (error) {
    const restoreError = errorMessage(error, "Yedek geri yuklenemedi.");
    let rollbackMessage = "Mevcut veri guvenlik yedeginden geri alindi.";

    try {
      await replaceCompanyBusinessData(beforeRestoreBackup, company);
    } catch (rollbackError) {
      rollbackMessage = `Geri alma da tamamlanamadi: ${errorMessage(
        rollbackError,
        "Bilinmeyen hata.",
      )}`;
    }

    await logRestore({
      companyId: company.id,
      status: "failed",
      fileName,
      rowCount: 0,
      backupExportedAt,
      errorMessage: restoreError,
    }).catch(() => null);

    throw new Error(`${restoreError} ${rollbackMessage}`);
  }
}
