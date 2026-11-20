import "server-only";

import { and, desc, eq, notInArray } from "drizzle-orm";
import { aiThreads, db } from "@/db";
import {
  AI_THREAD_LIMIT,
  type AiChatTurn,
  type AiThread,
  type AiThreadSummary,
  titleFromMessages,
} from "@/lib/ai-threads";

const MAX_MESSAGES = 80;
const MAX_MESSAGE_CHARS = 8000;
const THREAD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class AiThreadError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function parseTurn(value: unknown): AiChatTurn | null {
  if (!value || typeof value !== "object") return null;
  const turn = value as Partial<AiChatTurn>;
  if (typeof turn.id !== "string" || !THREAD_ID.test(turn.id)) return null;
  if (turn.role !== "user" && turn.role !== "assistant") return null;
  if (typeof turn.content !== "string") return null;
  const content = turn.content.trim();
  if (!content || content.length > MAX_MESSAGE_CHARS) return null;
  return { id: turn.id, role: turn.role, content };
}

export function parseStoredThread(value: unknown): AiThread | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<AiThread>;
  if (typeof row.id !== "string" || !THREAD_ID.test(row.id)) return null;
  if (!Array.isArray(row.messages) || row.messages.length > MAX_MESSAGES) {
    return null;
  }
  const turns: AiChatTurn[] = [];
  for (const item of row.messages) {
    const turn = parseTurn(item);
    if (!turn) return null;
    turns.push(turn);
  }
  if (turns.length === 0) return null;
  const updatedAt =
    typeof row.updatedAt === "number" && Number.isFinite(row.updatedAt)
      ? row.updatedAt
      : Date.now();
  return {
    id: row.id,
    title: titleFromMessages(turns),
    updatedAt,
    messages: turns,
  };
}

function fromRow(row: {
  id: string;
  title: string;
  messages: unknown;
  updatedAt: Date;
}): AiThread | null {
  const thread = parseStoredThread({
    id: row.id,
    title: row.title,
    messages: row.messages,
    updatedAt: row.updatedAt.getTime(),
  });
  return thread;
}

async function pruneThreads(tx: Tx, userId: string) {
  const keep = await tx
    .select({ id: aiThreads.id })
    .from(aiThreads)
    .where(eq(aiThreads.userId, userId))
    .orderBy(desc(aiThreads.updatedAt))
    .limit(AI_THREAD_LIMIT);
  if (keep.length < AI_THREAD_LIMIT) return;
  await tx.delete(aiThreads).where(
    and(
      eq(aiThreads.userId, userId),
      notInArray(
        aiThreads.id,
        keep.map((row) => row.id),
      ),
    ),
  );
}

async function writeThread(tx: Tx, userId: string, thread: AiThread) {
  const [existing] = await tx
    .select({
      userId: aiThreads.userId,
      updatedAt: aiThreads.updatedAt,
    })
    .from(aiThreads)
    .where(eq(aiThreads.id, thread.id))
    .limit(1);
  if (existing && existing.userId !== userId) {
    throw new AiThreadError("找不到这段对话", 404);
  }
  if (existing && existing.updatedAt.getTime() > thread.updatedAt) return;

  const updatedAt = new Date(thread.updatedAt);
  await tx
    .insert(aiThreads)
    .values({
      id: thread.id,
      userId,
      title: thread.title,
      messages: thread.messages,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: aiThreads.id,
      set: {
        title: thread.title,
        messages: thread.messages,
        updatedAt,
      },
    });
}

export async function listAiThreads(
  userId: string,
): Promise<AiThreadSummary[]> {
  const rows = await db
    .select({
      id: aiThreads.id,
      title: aiThreads.title,
      updatedAt: aiThreads.updatedAt,
    })
    .from(aiThreads)
    .where(eq(aiThreads.userId, userId))
    .orderBy(desc(aiThreads.updatedAt))
    .limit(AI_THREAD_LIMIT);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.getTime(),
  }));
}

export async function readAiThread(userId: string, id: string) {
  if (!THREAD_ID.test(id)) return null;
  const [row] = await db
    .select({
      id: aiThreads.id,
      title: aiThreads.title,
      messages: aiThreads.messages,
      updatedAt: aiThreads.updatedAt,
    })
    .from(aiThreads)
    .where(and(eq(aiThreads.id, id), eq(aiThreads.userId, userId)))
    .limit(1);
  if (!row) return null;
  return fromRow(row);
}

export async function saveAiThread(userId: string, thread: AiThread) {
  await db.transaction(async (tx) => {
    await writeThread(tx, userId, thread);
    await pruneThreads(tx, userId);
  });
}

export async function importAiThreads(userId: string, threads: AiThread[]) {
  const next = threads.slice(0, AI_THREAD_LIMIT);
  await db.transaction(async (tx) => {
    for (const thread of next) {
      await writeThread(tx, userId, thread);
    }
    await pruneThreads(tx, userId);
  });
}
