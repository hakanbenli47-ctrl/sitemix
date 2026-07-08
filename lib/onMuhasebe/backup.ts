import { supabaseAdmin } from "@/lib/supabaseAdmin";

type BackupScope = {
  userId: string;
  userEmail: string;
  companyId: string;
  companyName: string;
  companyCode?: string | null;
};

type BackupTable = {
  key: string;
  table: string;
  column: string;
  value: (scope: BackupScope) => string;
};

const backupTables: BackupTable[] = [
  {
    key: "profiles",
    table: "profiles",
    column: "id",
    value: (scope) => scope.userId,
  },
  {
    key: "companies",
    table: "companies",
    column: "id",
    value: (scope) => scope.companyId,
  },
  {
    key: "subscriptions",
    table: "subscriptions",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "cari_hesaplar",
    table: "cari_hesaplar",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "cari_hareketleri",
    table: "cari_hareketleri",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "urun_kategorileri",
    table: "urun_kategorileri",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "urunler",
    table: "urunler",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "stok_hareketleri",
    table: "stok_hareketleri",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "kasa_hesaplari",
    table: "kasa_hesaplari",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "kasa_hareketleri",
    table: "kasa_hareketleri",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "gelir_gider_kategorileri",
    table: "gelir_gider_kategorileri",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "fatura_fisleri",
    table: "fatura_fisleri",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
  {
    key: "fatura_fis_kalemleri",
    table: "fatura_fis_kalemleri",
    column: "company_id",
    value: (scope) => scope.companyId,
  },
];

export type BackupPayload = {
  metadata: {
    product: "Sitemix Ön Muhasebe";
    version: 1;
    exportedAt: string;
    companyId: string;
    companyName: string;
    companyCode?: string | null;
    userId: string;
    userEmail: string;
  };
  tables: Record<string, unknown[]>;
  rowCounts: Record<string, number>;
};

export type BackupEmailResult =
  | { status: "sent"; messageId?: string }
  | { status: "not_configured" }
  | { status: "failed"; message: string };

function safeFilePart(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function backupFileName(companyName: string, date = new Date()) {
  const datePart = date.toISOString().slice(0, 10);
  const companyPart = safeFilePart(companyName) || "isletme";

  return `sitemix-on-muhasebe-yedek-${companyPart}-${datePart}.json`;
}

export function serializeBackup(payload: BackupPayload) {
  return JSON.stringify(payload, null, 2);
}

export async function createCompanyBackup(scope: BackupScope) {
  const tables: BackupPayload["tables"] = {};
  const rowCounts: BackupPayload["rowCounts"] = {};

  for (const item of backupTables) {
    const { data, error } = await supabaseAdmin
      .from(item.table)
      .select("*")
      .eq(item.column, item.value(scope))
      .limit(10000);

    if (error) {
      throw new Error(`${item.table} yedeklenemedi: ${error.message}`);
    }

    tables[item.key] = data || [];
    rowCounts[item.key] = data?.length || 0;
  }

  return {
    metadata: {
      product: "Sitemix Ön Muhasebe" as const,
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      companyId: scope.companyId,
      companyName: scope.companyName,
      companyCode: scope.companyCode,
      userId: scope.userId,
      userEmail: scope.userEmail,
    },
    tables,
    rowCounts,
  };
}

export async function sendBackupEmail({
  to,
  companyName,
  fileName,
  json,
}: {
  to: string;
  companyName: string;
  fileName: string;
  json: string;
}): Promise<BackupEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BACKUP_FROM_EMAIL;

  if (!apiKey || !from) {
    return { status: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Sitemix Ön Muhasebe yedeği - ${companyName}`,
        text: `${companyName} için oluşturulan Sitemix Ön Muhasebe yedeği ektedir.`,
        attachments: [
          {
            filename: fileName,
            content: Buffer.from(json, "utf8").toString("base64"),
          },
        ],
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        status: "failed",
        message: result?.message || "Yedek e-postası gönderilemedi.",
      };
    }

    return { status: "sent", messageId: result?.id };
  } catch (error) {
    return {
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : "Yedek e-postası gönderilemedi.",
    };
  }
}

export function totalBackupRows(rowCounts: Record<string, number>) {
  return Object.values(rowCounts).reduce((sum, count) => sum + count, 0);
}
