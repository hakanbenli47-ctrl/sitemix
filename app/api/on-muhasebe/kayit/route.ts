import { NextResponse } from "next/server";
import { allOnMuhasebePermissions } from "@/lib/onMuhasebe/auth";
import {
  addTrialDays,
  isOnMuhasebePlanId,
  onMuhasebePlans,
} from "@/lib/onMuhasebe/plans";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

function cleanEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function cleanPhone(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[^\d+]/g, "").trim();
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const supabaseError = error as { code?: string; message?: string };

  return (
    supabaseError.code === "42P01" ||
    Boolean(supabaseError.message?.toLowerCase().includes("does not exist"))
  );
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Geçersiz kayıt isteği." },
        { status: 400 },
      );
    }

    const fullName = cleanText(body.fullName);
    const phone = cleanPhone(body.phone);
    const companyName = cleanText(body.companyName);
    const sector = cleanText(body.sector);
    const email = cleanEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const plan = body.plan;
    const agreement = Boolean(body.agreement);

    if (!fullName || fullName.length < 3) {
      return NextResponse.json(
        { message: "Ad soyad en az 3 karakter olmalı." },
        { status: 400 },
      );
    }

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { message: "Geçerli bir telefon numarası gir." },
        { status: 400 },
      );
    }

    if (!companyName || companyName.length < 2) {
      return NextResponse.json(
        { message: "İşletme adı zorunlu." },
        { status: 400 },
      );
    }

    if (!sector) {
      return NextResponse.json(
        { message: "Sektör seçimi zorunlu." },
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

    if (!isOnMuhasebePlanId(plan)) {
      return NextResponse.json(
        { message: "Geçerli bir paket seç." },
        { status: 400 },
      );
    }

    if (!agreement) {
      return NextResponse.json(
        { message: "7 gün ücretsiz deneme onayını işaretlemelisin." },
        { status: 400 },
      );
    }

    const selectedPlan = onMuhasebePlans[plan];
    const trialStartedAt = new Date();
    const trialEndsAt = addTrialDays(trialStartedAt);

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
          company_name: companyName,
          sector,
          plan,
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          message:
            authError?.message ||
            "Kullanıcı oluşturulamadı. Bilgileri kontrol et.",
        },
        { status: 400 },
      );
    }

    createdUserId = authData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: createdUserId,
        full_name: fullName,
        phone,
        role: "owner",
      });

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { data: companyData, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        owner_user_id: createdUserId,
        name: companyName,
        sector,
        phone,
      })
      .select("id, company_code")
      .single();

    if (companyError || !companyData) {
      throw new Error(companyError?.message || "İşletme kaydı oluşturulamadı.");
    }

    const { error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        company_id: companyData.id,
        user_id: createdUserId,
        plan,
        billing_period_months: selectedPlan.billingPeriodMonths,
        monthly_price: selectedPlan.monthlyPrice,
        total_price: selectedPlan.totalPrice,
        saving_amount: selectedPlan.savingAmount,
        currency: "TRY",
        status: "trial",
        trial_started_at: trialStartedAt.toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
      });

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    const { error: membershipError } = await supabaseAdmin
      .from("on_muhasebe_company_users")
      .upsert(
        {
          company_id: companyData.id,
          user_id: createdUserId,
          role: "owner",
          status: "active",
          permissions: allOnMuhasebePermissions,
          created_by: createdUserId,
        },
        { onConflict: "company_id,user_id" },
      );

    if (membershipError && !isMissingTableError(membershipError)) {
      throw new Error(membershipError.message);
    }

    const { error: settingsError } = await supabaseAdmin
      .from("on_muhasebe_settings")
      .upsert(
        {
          company_id: companyData.id,
          auto_backup_enabled: true,
          backup_email: email,
          backup_frequency_hours: 24,
        },
        { onConflict: "company_id" },
      );

    if (settingsError && !isMissingTableError(settingsError)) {
      throw new Error(settingsError.message);
    }

    const initialWorkYear = new Date().getFullYear();
    const { error: periodError } = await supabaseAdmin
      .from("on_muhasebe_calisma_donemleri")
      .upsert(
        {
          company_id: companyData.id,
          yil: initialWorkYear,
          baslangic_tarihi: `${initialWorkYear}-01-01`,
          bitis_tarihi: `${initialWorkYear}-12-31`,
          durum: "acik",
          locked: false,
          created_by: createdUserId,
        },
        { onConflict: "company_id,yil" },
      );

    if (periodError && !isMissingTableError(periodError)) {
      throw new Error(periodError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Kayıt oluşturuldu. Giriş yapabilirsin.",
      companyCode: companyData.company_code,
      trialEndsAt: trialEndsAt.toISOString(),
      redirectTo: `/on-muhasebe/giris?kayit=basarili&firma=${companyData.company_code}`,
    });
  } catch (error) {
    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Kayıt sırasında beklenmeyen bir hata oluştu.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
