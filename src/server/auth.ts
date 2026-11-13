import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { NextRequest, NextResponse } from "next/server";
import { db, identities, sessions, users } from "@/db";
import type { PublicUser } from "@/types/auth";

const SESSION_COOKIE = "yizhicv_session";
const OAUTH_STATE_COOKIE = "yizhicv_oauth_state";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

export function readGithubConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function callbackUrl(origin: string) {
  return new URL("/api/auth/callback/github", origin).toString();
}

export function setOauthStateCookie(response: NextResponse, state: string) {
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    ...cookieBase,
    maxAge: 60 * 10,
  });
}

export function readOauthState(request: NextRequest) {
  return request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? null;
}

export function clearOauthStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, "", {
    ...cookieBase,
    maxAge: 0,
  });
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    ...cookieBase,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    ...cookieBase,
    maxAge: 0,
  });
}

export function readSessionToken(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value ?? null;
}

function toPublicUser(user: {
  id: string;
  name: string;
  avatarUrl: string | null;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

export async function upsertGithubUser(profile: {
  providerUserId: string;
  name: string;
  avatarUrl: string | null;
}) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ userId: identities.userId })
      .from(identities)
      .where(
        and(
          eq(identities.provider, "github"),
          eq(identities.providerUserId, profile.providerUserId),
        ),
      )
      .limit(1);

    if (existing) {
      await tx
        .update(users)
        .set({ name: profile.name, avatarUrl: profile.avatarUrl })
        .where(eq(users.id, existing.userId));
      return existing.userId;
    }

    const [created] = await tx
      .insert(users)
      .values({ name: profile.name, avatarUrl: profile.avatarUrl })
      .returning({ id: users.id });
    if (!created) {
      throw new Error("创建用户失败");
    }

    await tx.insert(identities).values({
      userId: created.id,
      provider: "github",
      providerUserId: profile.providerUserId,
    });
    return created.id;
  });
}

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return token;
}

export async function currentUser(
  request: NextRequest,
): Promise<PublicUser | null> {
  const token = readSessionToken(request);
  if (!token) return null;

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return row ? toPublicUser(row) : null;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}
