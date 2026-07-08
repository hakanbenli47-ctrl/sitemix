import { NextResponse } from "next/server";
import {
  type OnMuhasebePermissions,
  defaultStaffPermissions,
  getOnMuhasebeContext,
  normalizePermissions,
  requireOwner,
} from "@/lib/onMuhasebe/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type StaffMember = {
  id: string;
  company_id: string;
  user_id: string;
  role: "staff";
  status: "active" | "passive";
  permissions: Partial<OnMuhasebePermissions> | null;
  created_at: string;
};

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

function cleanEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function cleanPermissions(value: unknown) {
  const source =
    value && typeof value === "object"
      ? (value as Partial<OnMuhasebePermissions>)
      : defaultStaffPermissions;

  return normalizePermissions("staff", source);
}

async function staffRows(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from("on_muhasebe_company_users")
    .select(
      "id, company_id, user_id, role, status, permissions, created_at",
    )
    .eq("company_id", companyId)
    .eq("role", "staff")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data || []) as StaffMember[];
  const userIds = rows.map((row) => row.user_id);
  const { data: profiles } = userIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds)
    : { data: [] };
  const profileMap = new Map(
    (profiles || []).map((profile) => [
      profile.id,
      {
        fullName: profile.full_name || "",
        phone: profile.phone || "",
      },
    ]),
  );

  return Promise.all(
    rows.map(async (row) => {
      const profile = profileMap.get(row.user_id);
      const {
        data: { user },
      } = await supabaseAdmin.auth.admin.getUserById(row.user_id);

      return {
        id: row.id,
        userId: row.user_id,
        fullName: profile?.fullName || "",
        phone: profile?.phone || "",
        email: user?.email || "",
        status: row.status,
        permissions: normalizePermissions("staff", row.permissions),
        createdAt: row.created_at,
      };
    }),
  );
}

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);

    return NextResponse.json({
      staff: await staffRows(context.company.id),
      defaults: defaultStaffPermissions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Personel listesi alınamadı.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Geçersiz personel isteği." },
        { status: 400 },
      );
    }

    const fullName = cleanText(body.fullName);
    const phone = cleanText(body.phone);
    const email = cleanEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const permissions = cleanPermissions(body.permissions);

    if (fullName.length < 3) {
      return NextResponse.json(
        { message: "Personel adı en az 3 karakter olmalı." },
        { status: 400 },
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Geçerli bir e-posta adresi gir." },
        { status: 400 },
      );
    }

    if (!password || password.length < 6) {
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
          company_id: context.company.id,
          role: "staff",
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          message:
            authError?.message ||
            "Personel hesabı oluşturulamadı. E-posta daha önce kullanılmış olabilir.",
        },
        { status: 400 },
      );
    }

    createdUserId = authData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
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
      .insert({
        company_id: context.company.id,
        user_id: createdUserId,
        role: "staff",
        status: "active",
        permissions,
        created_by: context.user.id,
      });

    if (membershipError) throw membershipError;

    return NextResponse.json({
      success: true,
      message: "Personel hesabı oluşturuldu.",
      staff: await staffRows(context.company.id),
    });
  } catch (error) {
    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Personel oluşturulurken hata oluştu.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);

    const body = await request.json().catch(() => null);

    if (!body || typeof body.id !== "string") {
      return NextResponse.json(
        { message: "Güncellenecek personel bulunamadı." },
        { status: 400 },
      );
    }

    const fullName = cleanText(body.fullName);
    const phone = cleanText(body.phone);
    const password = typeof body.password === "string" ? body.password : "";
    const status = body.status === "passive" ? "passive" : "active";
    const permissions = cleanPermissions(body.permissions);

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("on_muhasebe_company_users")
      .select("id, user_id")
      .eq("id", body.id)
      .eq("company_id", context.company.id)
      .eq("role", "staff")
      .single<{ id: string; user_id: string }>();

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

    if (fullName || phone) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          ...(fullName ? { full_name: fullName } : {}),
          phone,
        })
        .eq("id", membership.user_id);

      if (profileError) throw profileError;
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { message: "Yeni şifre en az 6 karakter olmalı." },
          { status: 400 },
        );
      }

      const { error: passwordError } =
        await supabaseAdmin.auth.admin.updateUserById(membership.user_id, {
          password,
        });

      if (passwordError) throw passwordError;
    }

    return NextResponse.json({
      success: true,
      message: "Personel güncellendi.",
      staff: await staffRows(context.company.id),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Personel güncellenirken hata oluştu.",
      },
      { status: 500 },
    );
  }
}
