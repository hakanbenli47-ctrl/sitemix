import { NextResponse } from "next/server";
import { getAuthenticatedUser, isMissingTableError } from "@/lib/onMuhasebe/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function paymentCodeFromCompany(company: {
  id: string;
  company_code?: string | null;
}) {
  return company.company_code || company.id.slice(0, 8).toUpperCase();
}

async function getPaymentContext(request: Request) {
  const user = await getAuthenticatedUser(request);

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("on_muhasebe_company_users")
    .select("company_id, role")
    .eq("user_id", user.id)
    .maybeSingle<{ company_id: string; role: "owner" | "staff" }>();

  if (membershipError && !isMissingTableError(membershipError)) {
    throw membershipError;
  }

  if (membership?.role === "staff") {
    return {
      user,
      company: null,
      isOwner: false,
    };
  }

  const companyQuery = membership?.company_id
    ? supabaseAdmin
        .from("companies")
        .select("id, company_code")
        .eq("id", membership.company_id)
    : supabaseAdmin
        .from("companies")
        .select("id, company_code")
        .eq("owner_user_id", user.id);

  const { data: company, error: companyError } = await companyQuery
    .limit(1)
    .maybeSingle<{ id: string; company_code: string | null }>();

  if (companyError || !company) {
    throw new Error("Firma bilgisi bulunamadı.");
  }

  return {
    user,
    company,
    isOwner: true,
  };
}

export async function POST(request: Request) {
  try {
    const context = await getPaymentContext(request);
    if (!context.isOwner) {
      return NextResponse.json(
        {
          message:
            "Personel hesapları ödeme bildirimi gönderemez. Ödeme ana kullanıcı tarafından yapılır.",
        },
        { status: 403 },
      );
    }

    if (!context.company) {
      return NextResponse.json(
        { message: "Firma bilgisi bulunamadı." },
        { status: 404 },
      );
    }

    const paymentCode = paymentCodeFromCompany(context.company);
    const description = `SITEMIX ${paymentCode}`;

    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .select("id, company_id, status, trial_ends_at")
        .eq("company_id", context.company.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("on_muhasebe_payment_notifications")
      .select("id, status, description, created_at")
      .eq("company_id", context.company.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError && !isMissingTableError(pendingError)) throw pendingError;

    if (isMissingTableError(pendingError)) {
      return NextResponse.json(
        {
          message:
            "Ödeme bildirimi tablosu henüz kurulmamış. Supabase SQL dosyasını çalıştırman gerekiyor.",
        },
        { status: 500 },
      );
    }

    if (pending) {
      return NextResponse.json({
        success: true,
        notification: pending,
        paymentCode,
        description,
        message: "Ödeme bildirimin zaten admin paneline gönderilmiş.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("on_muhasebe_payment_notifications")
      .insert({
        company_id: context.company.id,
        user_id: context.user.id,
        subscription_id: subscription?.id || null,
        payment_code: paymentCode,
        description,
        status: "pending",
      })
      .select("id, status, description, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      notification: data,
      paymentCode,
      description,
      message: "Ödeme bildirimin admin paneline gönderildi.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Ödeme bildirimi gönderilemedi.",
      },
      { status: 500 },
    );
  }
}
