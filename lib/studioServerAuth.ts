import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function requireStudioUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) throw new Error("Oturum gerekli.");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("Oturum doğrulanamadı.");

  return data.user;
}

export function isMissingStudioTable(error: unknown) {
  const candidate = error as { code?: string; message?: string };
  return (
    candidate?.code === "42P01" ||
    candidate?.code === "PGRST205" ||
    Boolean(candidate?.message?.toLowerCase().includes("does not exist"))
  );
}

