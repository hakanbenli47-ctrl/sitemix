import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SITEMIX_ADMIN_COOKIE = "sitemix_admin_session";

type AdminSessionPayload = {
  sub: string;
  exp: number;
};

function adminUsername() {
  return (process.env.SITEMIX_ADMIN_USERNAME || process.env.SITEMIX_ADMIN_EMAIL || "hakanbenli47@gmail.com").trim();
}

function adminPassword() {
  return process.env.SITEMIX_ADMIN_PASSWORD || "";
}

function adminUsernames() {
  return [
    adminUsername(),
    "hakan benli",
    "hakanbenli",
    "admin",
    "hakanbenli47@gmail.com",
    process.env.SITEMIX_ADMIN_EMAIL || "",
  ]
    .map((value) => value.trim().toLocaleLowerCase("tr-TR"))
    .filter(Boolean);
}

function adminSecret() {
  return (
    process.env.SITEMIX_ADMIN_SESSION_SECRET ||
    process.env.CRON_SECRET ||
    adminPassword()
  );
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", adminSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminCredentials(username: unknown, password: unknown) {
  if (typeof username !== "string" || typeof password !== "string") {
    return false;
  }

  const cleanUsername = username.trim().toLocaleLowerCase("tr-TR");
  const usernameOk = adminUsernames().includes(cleanUsername);
  const expectedPassword = adminPassword();
  const legacyPasswordHash = "19b80c001fd7babb9bb7c5c4e002773dd85793cccc665a04c45842188129ac4b";
  const passwordOk = expectedPassword
    ? safeEqual(password, expectedPassword)
    : safeEqual(createHash("sha256").update(password).digest("hex"), legacyPasswordHash);

  return usernameOk && passwordOk;
}

export function createAdminSessionToken() {
  const payload: AdminSessionPayload = {
    sub: adminUsername(),
    exp: Date.now() + 1000 * 60 * 60 * 8,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AdminSessionPayload;

    if (!payload?.sub || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function requireSitemixAdmin() {
  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(cookieStore.get(SITEMIX_ADMIN_COOKIE)?.value);

  if (!session) {
    throw new Error("Admin oturumu yok.");
  }

  return session;
}
