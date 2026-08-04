import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireStudioUser } from "@/lib/studioServerAuth";
import { assertCustomerCanManageStudioProject } from "@/lib/studioAccess";

export const runtime = "nodejs";

const bucketName = "studio-media";
const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

async function ensureBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(bucketName);
  if (data) return;
  const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: Object.keys(allowedTypes),
    fileSizeLimit: 8 * 1024 * 1024,
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

export async function POST(request: Request) {
  try {
    const user = await requireStudioUser(request);
    const form = await request.formData();
    const projectId = String(form.get("projectId") || "").trim();
    const slot = String(form.get("slot") || "gallery").trim();
    const file = form.get("file");

    if (!projectId || !(file instanceof File)) {
      return NextResponse.json({ message: "Proje ve görsel seçmelisiniz." }, { status: 400 });
    }
    if (!allowedTypes[file.type]) {
      return NextResponse.json({ message: "JPG, PNG, WEBP veya AVIF görsel yükleyebilirsiniz." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ message: "Görsel en fazla 8 MB olabilir." }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("studio_projects")
      .select("id, management_mode, payment_status")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();
    if (projectError || !project) return NextResponse.json({ message: "Proje bulunamadı." }, { status: 404 });
    assertCustomerCanManageStudioProject(project);

    await ensureBucket();
    const extension = allowedTypes[file.type];
    const safeSlot = ["hero", "logo", "about", "service", "gallery"].includes(slot) ? slot : "gallery";
    const path = `${user.id}/${projectId}/${safeSlot}-${randomUUID()}.${extension}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage.from(bucketName).upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(path);
    return NextResponse.json({ url: publicData.publicUrl, path, slot: safeSlot });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Görsel yüklenemedi." }, { status: 400 });
  }
}
