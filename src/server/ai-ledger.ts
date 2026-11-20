import "server-only";

import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { aiAccounts, aiHolds, aiLedger } from "@/db/schema";
import { WELCOME_GRANT_PICO_CNY } from "@/lib/ai-money";
import {
  planTurn,
  type TokenPrices,
  type TokenUsage,
  tokenPrices,
  usageCostPico,
} from "@/server/ai-pricing";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const HOLD_TTL_MS = 2 * 60 * 1000;
const WELCOME_KEY = "welcome";

/**
 * 可用余额记在账户行上，未结束的预扣已经减掉。
 * 流水是留下来的账：一次新用户赠送、使用扣费，以及以后的充值。
 * 赠送 + 充值 + 扣费 = 可用余额 + 尚未结束的预扣。
 */
async function lockAccount(tx: Tx, userId: string, releaseStale: boolean) {
  await tx
    .insert(aiAccounts)
    .values({ userId, balancePicoCny: BigInt(0) })
    .onConflictDoNothing();

  const [account] = await tx
    .select()
    .from(aiAccounts)
    .where(eq(aiAccounts.userId, userId))
    .for("update");
  if (!account) throw new Error("账户不存在");

  let balance = account.balancePicoCny;
  let dirty = false;

  if (releaseStale) {
    const cutoff = new Date(Date.now() - HOLD_TTL_MS);
    const stale = await tx
      .select()
      .from(aiHolds)
      .where(and(eq(aiHolds.userId, userId), lt(aiHolds.createdAt, cutoff)));
    for (const hold of stale) {
      balance += hold.amountPicoCny;
      dirty = true;
      await tx.delete(aiHolds).where(eq(aiHolds.id, hold.id));
    }
  }

  const granted = await tx
    .insert(aiLedger)
    .values({
      userId,
      kind: "grant",
      amountPicoCny: WELCOME_GRANT_PICO_CNY,
      idempotencyKey: WELCOME_KEY,
    })
    .onConflictDoNothing()
    .returning({ id: aiLedger.id });
  if (granted.length > 0) {
    balance += WELCOME_GRANT_PICO_CNY;
    dirty = true;
  }

  if (dirty) {
    await tx
      .update(aiAccounts)
      .set({ balancePicoCny: balance, updatedAt: new Date() })
      .where(eq(aiAccounts.userId, userId));
  }

  return balance;
}

export async function ensureAiAccount(userId: string) {
  return db.transaction((tx) => lockAccount(tx, userId, true));
}

export async function beginDirectUse(options: {
  userId: string;
  requestId: string;
  estimatedInputTokens: number;
  now: Date;
}) {
  const prices = tokenPrices(options.now);
  return db.transaction(async (tx) => {
    const balance = await lockAccount(tx, options.userId, true);
    const plan = planTurn(balance, options.estimatedInputTokens, prices);
    if (!plan.ok) {
      return { ok: false as const, balancePicoCny: balance, prices };
    }

    await tx.insert(aiHolds).values({
      id: options.requestId,
      userId: options.userId,
      amountPicoCny: plan.reservePicoCny,
    });
    const next = balance - plan.reservePicoCny;
    await tx
      .update(aiAccounts)
      .set({ balancePicoCny: next, updatedAt: new Date() })
      .where(eq(aiAccounts.userId, options.userId));

    return {
      ok: true as const,
      maxTokens: plan.maxTokens,
      prices,
      balancePicoCny: next,
    };
  });
}

export async function settleDirectUse(options: {
  userId: string;
  requestId: string;
  usage: TokenUsage;
  prices: TokenPrices;
}) {
  const actual = usageCostPico(options.usage, options.prices);
  return db.transaction(async (tx) => {
    const balance = await lockAccount(tx, options.userId, false);
    const debitKey = `debit:${options.requestId}`;
    const [existing] = await tx
      .select({ id: aiLedger.id })
      .from(aiLedger)
      .where(
        and(
          eq(aiLedger.userId, options.userId),
          eq(aiLedger.idempotencyKey, debitKey),
        ),
      )
      .limit(1);
    if (existing) {
      await tx.delete(aiHolds).where(eq(aiHolds.id, options.requestId));
      return { balancePicoCny: balance, clamped: false };
    }

    const [hold] = await tx
      .select()
      .from(aiHolds)
      .where(eq(aiHolds.id, options.requestId))
      .limit(1);
    let available = balance;
    if (hold && hold.userId === options.userId) {
      available += hold.amountPicoCny;
      await tx.delete(aiHolds).where(eq(aiHolds.id, hold.id));
    }

    const charged = actual > available ? available : actual;
    const next = available - charged;
    await tx
      .update(aiAccounts)
      .set({ balancePicoCny: next, updatedAt: new Date() })
      .where(eq(aiAccounts.userId, options.userId));
    await tx.insert(aiLedger).values({
      userId: options.userId,
      kind: "debit",
      amountPicoCny: -charged,
      idempotencyKey: debitKey,
    });
    return { balancePicoCny: next, clamped: actual > available };
  });
}

export async function releaseDirectUse(userId: string, requestId: string) {
  return db.transaction(async (tx) => {
    const balance = await lockAccount(tx, userId, false);
    const [debited] = await tx
      .select({ id: aiLedger.id })
      .from(aiLedger)
      .where(
        and(
          eq(aiLedger.userId, userId),
          eq(aiLedger.idempotencyKey, `debit:${requestId}`),
        ),
      )
      .limit(1);
    const [hold] = await tx
      .select()
      .from(aiHolds)
      .where(eq(aiHolds.id, requestId))
      .limit(1);
    if (debited || !hold || hold.userId !== userId) {
      if (hold) await tx.delete(aiHolds).where(eq(aiHolds.id, requestId));
      return balance;
    }

    const next = balance + hold.amountPicoCny;
    await tx.delete(aiHolds).where(eq(aiHolds.id, requestId));
    await tx
      .update(aiAccounts)
      .set({ balancePicoCny: next, updatedAt: new Date() })
      .where(eq(aiAccounts.userId, userId));
    return next;
  });
}

/**
 * 以后的付费充值写入一条流水，并加上同样的金额。
 * 目前还没有对外的充值接口。
 */
export async function creditAiBalance(
  userId: string,
  amountPicoCny: bigint,
  idempotencyKey: string,
) {
  if (amountPicoCny <= BigInt(0)) throw new Error("充值金额必须大于 0");
  const key = idempotencyKey.trim();
  if (!key || key === WELCOME_KEY) throw new Error("无效的充值单号");

  return db.transaction(async (tx) => {
    const balance = await lockAccount(tx, userId, true);
    const inserted = await tx
      .insert(aiLedger)
      .values({
        userId,
        kind: "topup",
        amountPicoCny,
        idempotencyKey: `topup:${key}`,
      })
      .onConflictDoNothing()
      .returning({ id: aiLedger.id });
    if (inserted.length === 0) {
      return { balancePicoCny: balance, applied: false };
    }
    const next = balance + amountPicoCny;
    await tx
      .update(aiAccounts)
      .set({ balancePicoCny: next, updatedAt: new Date() })
      .where(eq(aiAccounts.userId, userId));
    return { balancePicoCny: next, applied: true };
  });
}
