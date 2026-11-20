import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";
import { eq } from "drizzle-orm";
import { aiByok, db } from "@/db";
import {
  type AiProviderId,
  type ByokWire,
  isAiProviderId,
  isByokWire,
} from "@/lib/ai-providers";

const SALT = "yizhicv.byok.v1";

export class ByokStoreError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function encryptionKey() {
  const secret = process.env.BYOK_ENCRYPTION_KEY?.trim() ?? "";
  if (secret.length < 16) return null;
  return scryptSync(secret, SALT, 32);
}

export function sealByokKey(plain: string) {
  const key = encryptionKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function openByokKey(sealed: string) {
  const key = encryptionKey();
  if (!key) return null;
  const [version, ivText, tagText, dataText] = sealed.split(".");
  if (version !== "v1" || !ivText || !tagText || !dataText) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivText, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataText, "base64url")),
      decipher.final(),
    ]);
    const value = plain.toString("utf8").trim();
    return value || null;
  } catch {
    return null;
  }
}

async function readByokConfig(userId: string) {
  const [row] = await db
    .select({
      provider: aiByok.provider,
      model: aiByok.model,
      baseUrl: aiByok.baseUrl,
      wire: aiByok.wire,
      keyCiphertext: aiByok.keyCiphertext,
    })
    .from(aiByok)
    .where(eq(aiByok.userId, userId))
    .limit(1);
  if (!row || !isAiProviderId(row.provider)) return null;
  return row;
}

export async function readByokStatus(userId: string) {
  const row = await readByokConfig(userId);
  if (!row) {
    return {
      provider: null,
      model: null,
      baseUrl: null,
      wire: null,
      configured: false as const,
    };
  }
  return {
    provider: row.provider,
    model: row.model,
    baseUrl: row.baseUrl,
    wire: isByokWire(row.wire) ? row.wire : null,
    configured: true as const,
  };
}

export async function readByokSecret(userId: string) {
  const row = await readByokConfig(userId);
  if (!row) return null;
  const apiKey = openByokKey(row.keyCiphertext);
  if (!apiKey) {
    throw new ByokStoreError("密钥存储未就绪", 503);
  }
  return {
    provider: row.provider,
    model: row.model,
    baseUrl: row.baseUrl,
    wire: isByokWire(row.wire) ? row.wire : null,
    apiKey,
  };
}

export async function writeByokSecret(
  userId: string,
  provider: AiProviderId,
  apiKey: string,
  model: string,
  custom: { baseUrl: string; wire: ByokWire } | null,
) {
  const keyCiphertext = sealByokKey(apiKey);
  if (!keyCiphertext) {
    throw new ByokStoreError("密钥存储未就绪", 503);
  }
  const baseUrl = custom?.baseUrl ?? null;
  const wire = custom?.wire ?? null;
  await db
    .insert(aiByok)
    .values({ userId, provider, model, baseUrl, wire, keyCiphertext })
    .onConflictDoUpdate({
      target: aiByok.userId,
      set: {
        provider,
        model,
        baseUrl,
        wire,
        keyCiphertext,
        updatedAt: new Date(),
      },
    });
}

export async function clearByokSecret(userId: string) {
  await db.delete(aiByok).where(eq(aiByok.userId, userId));
}
