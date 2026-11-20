const THREADS_KEY = "yizhicv.ai-threads.v1";
const CURRENT_KEY = "yizhicv.ai-thread-current";
export const AI_THREAD_LIMIT = 80;

export const AI_THREAD_PAGE = 10;

export type AiChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type AiThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: AiChatTurn[];
};

export type AiThreadSummary = {
  id: string;
  title: string;
  updatedAt: number;
};

function isTurn(value: unknown): value is AiChatTurn {
  if (!value || typeof value !== "object") return false;
  const turn = value as Partial<AiChatTurn>;
  return (
    typeof turn.id === "string" &&
    (turn.role === "user" || turn.role === "assistant") &&
    typeof turn.content === "string"
  );
}

export function titleFromMessages(messages: AiChatTurn[]) {
  const text =
    messages
      .find((message) => message.role === "user")
      ?.content.replace(/\s+/g, " ")
      .trim() || "新对话";
  return text.length > 24 ? `${text.slice(0, 24)}…` : text;
}

function readThreads() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(THREADS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const threads: AiThread[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as Partial<AiThread>;
      if (typeof row.id !== "string" || !Array.isArray(row.messages)) continue;
      const messages = row.messages.filter(isTurn);
      if (messages.length === 0) continue;
      threads.push({
        id: row.id,
        title:
          typeof row.title === "string" && row.title.trim()
            ? row.title.trim()
            : titleFromMessages(messages),
        updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : 0,
        messages,
      });
    }
    return threads.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function readStoredThreads() {
  return readThreads();
}

export function clearStoredThreads() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(THREADS_KEY);
}

function writeThreads(threads: AiThread[]) {
  let next = threads.slice(0, AI_THREAD_LIMIT);
  for (;;) {
    try {
      window.localStorage.setItem(THREADS_KEY, JSON.stringify(next));
      return next;
    } catch {
      if (next.length <= 1) return readThreads();
      next = next.slice(0, -1);
    }
  }
}

export function listThreadSummaries(): AiThreadSummary[] {
  return readThreads().map(({ id, title, updatedAt }) => ({
    id,
    title,
    updatedAt,
  }));
}

export function readThread(id: string) {
  return readThreads().find((thread) => thread.id === id) ?? null;
}

export function readCurrentThreadId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}

export function writeCurrentThreadId(id: string | null) {
  if (id) window.localStorage.setItem(CURRENT_KEY, id);
  else window.localStorage.removeItem(CURRENT_KEY);
}

export function upsertThread(thread: AiThread) {
  const rest = readThreads().filter((item) => item.id !== thread.id);
  return writeThreads([thread, ...rest]).map(({ id, title, updatedAt }) => ({
    id,
    title,
    updatedAt,
  }));
}
