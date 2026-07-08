import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOnMuhasebeContext } from "@/lib/onMuhasebe/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function cleanPassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Geçersiz şifre değiştirme isteği." },
        { status: 400 },
      );
    }

    const oldPassword = cleanPassword(body.oldPassword);
    const newPassword = cleanPassword(body.newPassword);
    const newPasswordAgain = cleanPassword(body.newPasswordAgain);

    if (!context.user.email) {
      return NextResponse.json(
        { message: "Bu hesapta e-posta bilgisi bulunamadığı için şifre değiştirilemedi." },
        { status: 400 },
      );
    }

    if (!oldPassword) {
      return NextResponse.json(
        { message: "Eski şifreyi yazmalısın." },
        { status: 400 },
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { message: "Yeni şifre en az 6 karakter olmalı." },
        { status: 400 },
      );
    }

    if (newPassword !== newPasswordAgain) {
      return NextResponse.json(
        { message: "Yeni şifre tekrarı aynı değil." },
        { status: 400 },
      );
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(
        { message: "Yeni şifre eski şifre ile aynı olamaz." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase anon bağlantı bilgileri eksik.");
    }

    const passwordCheckClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: signInError } = await passwordCheckClient.auth.signInWithPassword({
      email: context.user.email,
      password: oldPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { message: "Eski şifre yanlış. Kontrol edip tekrar dene." },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      context.user.id,
      { password: newPassword },
    );

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Şifre başarıyla değiştirildi. Bir sonraki girişte yeni şifre kullanılacak.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Şifre değiştirilirken hata oluştu.",
      },
      { status: 500 },
    );
  }
}
