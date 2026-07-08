import { NextResponse } from "next/server";
import { getOnMuhasebeContext } from "@/lib/onMuhasebe/auth";
import { getWorkYearFromRequest } from "@/lib/onMuhasebe/workYear";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", context.user.id)
      .maybeSingle();

    const workYear = getWorkYearFromRequest(request);

    return NextResponse.json({
      user: {
        id: context.user.id,
        email: context.user.email || null,
      },
      profile,
      company: context.company,
      role: context.role,
      permissions: context.permissions,
      isOwner: context.isOwner,
      workYear,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Oturum bilgisi alınamadı.",
      },
      { status: 401 },
    );
  }
}
