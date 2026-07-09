import { NextResponse } from "next/server";
import {
  getOnMuhasebeContext,
  isMissingTableError,
  normalizePermissions,
  requireOwner,
  type OnMuhasebePermissions,
} from "@/lib/onMuhasebe/auth";
import { syncLatestSubscriptionBilling } from "@/lib/onMuhasebe/billing";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type StaffMembershipRow = {
  id: string;
  company_id: string;
  user_id: string;
  status: "active" | "passive";
  permissions: Partial<OnMuhasebePermissions> | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function normalizeStatus(value: unknown): "active" | "passive" {
  return value === "passive" ? "passive" : "active";
}

function safeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function readStaff(companyId: string) {
  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from("on_muhasebe_company_users")
    .select("id, company_id, user_id, status, permissions, created_at")
    .eq("company_id", companyId)
    .eq("role", "staff")
    .order("created_at", { ascending: false })
    .returns<StaffMembershipRow[]>();

  if (membershipError) {
    if (isMissingTableError(membershipError)) return [];
    throw membershipError;
  }

  const rows = memberships || [];
  const userIds = rows.map((row) => row.user_id).filter(Boolean);

  const { data: profiles, error: profileError } =
    userIds.length > 0
      ? await supabaseAdmin
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", userIds)
          .returns<ProfileRow[]>()
      : { data: [], error: null };

  if (profileError) throw profileError;

  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile]),
  );

  const authUsers = await Promise.all(
    rows.map(async (row) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(
        row.user_id,
      );

      return {
        userId: row.user_id,
        email: error ? "" : data.user?.email || "",
      };
    }),
  );
  const emailMap = new Map(
    authUsers.map((user) => [user.userId, user.email]),
  );

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    const email = emailMap.get(row.user_id) || "";

    return {
      id: row.id,
      userId: row.user_id,
      fullName: profile?.full_name || email || "Personel",
      phone: profile?.phone || "",
      email,
      status: row.status || "active",
      permissions: normalizePermissions("staff", row.permissions),
      createdAt: row.created_at || new Date().toISOString(),
    };
  });
}

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);
    await syncLatestSubscriptionBilling(context.company.id);

    return NextResponse.json({
      staff: await readStaff(context.company.id),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: safeErrorMessage(error, "Personel listesi alınamadı."),
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  let createdUserId = "";

  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);

    const body = await request.json().catch(() => ({}));
    const fullName = cleanText(body.fullName);
    const phone = cleanText(body.phone);
    const email = cleanEmail(body.email);
    const password = cleanText(body.password);
    const status = normalizeStatus(body.status);
    const permissions = normalizePermissions("staff", body.permissions || {});

    if (!fullName) {
      return NextResponse.json(
        { message: "Personel adı zorunlu." },
        { status: 400 },
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Geçerli bir e-posta gir." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Şifre en az 6 karakter olmalı." },
        { status: 400 },
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
        },
      });

    if (authError || !authData.user) {
      const alreadyExists = authError?.message
        ?.toLowerCase()
        .includes("already");

      return NextResponse.json(
        {
          message: alreadyExists
            ? "Bu e-posta ile zaten bir kullanıcı var."
            : authError?.message || "Personel kullanıcısı oluşturulamadı.",
        },
        { status: 400 },
      );
    }

    createdUserId = authData.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: createdUserId,
        full_name: fullName,
        phone,
        role: "staff",
      },
      { onConflict: "id" },
    );

    if (profileError) throw profileError;

    const { error: membershipError } = await supabaseAdmin
      .from("on_muhasebe_company_users")
      .upsert(
        {
          company_id: context.company.id,
          user_id: createdUserId,
          role: "staff",
          status,
          permissions,
          created_by: context.user.id,
        },
        { onConflict: "company_id,user_id" },
      );

    if (membershipError) throw membershipError;
    await syncLatestSubscriptionBilling(context.company.id);

    return NextResponse.json({
      message: "Personel hesabı oluşturuldu.",
      staff: await readStaff(context.company.id),
    });
  } catch (error) {
    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => null);
    }

    return NextResponse.json(
      {
        message: safeErrorMessage(error, "Personel kaydedilemedi."),
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);

    const body = await request.json().catch(() => ({}));
    const membershipId = cleanText(body.id);
    const fullName = cleanText(body.fullName);
    const phone = cleanText(body.phone);
    const password = cleanText(body.password);
    const status = normalizeStatus(body.status);
    const permissions = normalizePermissions("staff", body.permissions || {});

    if (!membershipId) {
      return NextResponse.json(
        { message: "Personel kaydı bulunamadı." },
        { status: 400 },
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { message: "Personel adı zorunlu." },
        { status: 400 },
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { message: "Yeni şifre en az 6 karakter olmalı." },
        { status: 400 },
      );
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("on_muhasebe_company_users")
      .select("id, company_id, user_id, role")
      .eq("id", membershipId)
      .eq("company_id", context.company.id)
      .eq("role", "staff")
      .single<{ id: string; company_id: string; user_id: string; role: string }>();

    if (membershipError || !membership) {
      return NextResponse.json(
        { message: "Personel kaydı bulunamadı." },
        { status: 404 },
      );
    }

    const { error: updateMembershipError } = await supabaseAdmin
      .from("on_muhasebe_company_users")
      .update({
        status,
        permissions,
      })
      .eq("id", membership.id);

    if (updateMembershipError) throw updateMembershipError;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: membership.user_id,
        full_name: fullName,
        phone,
        role: "staff",
      },
      { onConflict: "id" },
    );

    if (profileError) throw profileError;

    if (password) {
      const { error: passwordError } =
        await supabaseAdmin.auth.admin.updateUserById(membership.user_id, {
          password,
        });

    if (passwordError) throw passwordError;
    }
    await syncLatestSubscriptionBilling(context.company.id);

    return NextResponse.json({
      message: "Personel bilgileri güncellendi.",
      staff: await readStaff(context.company.id),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: safeErrorMessage(error, "Personel kaydedilemedi."),
      },
      { status: 400 },
    );
  }
}
