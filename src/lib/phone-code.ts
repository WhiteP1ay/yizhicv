import { eq } from "drizzle-orm";
import { db, phoneCodeCooldowns } from "@/db";

export const SMS_COOLDOWN_SECONDS = 60;

export async function smsRetryAfter(phone: string) {
  const [row] = await db
    .select({ requestedAt: phoneCodeCooldowns.requestedAt })
    .from(phoneCodeCooldowns)
    .where(eq(phoneCodeCooldowns.phone, phone))
    .limit(1);
  if (!row) return 0;

  const remainingMs =
    row.requestedAt.getTime() + SMS_COOLDOWN_SECONDS * 1000 - Date.now();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / 1000);
}

export async function rememberSmsRequest(phone: string) {
  const requestedAt = new Date();
  await db
    .insert(phoneCodeCooldowns)
    .values({ phone, requestedAt })
    .onConflictDoUpdate({
      target: phoneCodeCooldowns.phone,
      set: { requestedAt },
    });
}
