import type { AiThread, AiThreadSummary } from "@/lib/ai-threads";

export async function listRemoteThreads(): Promise<AiThreadSummary[] | null> {
  try {
    const response = await fetch("/api/ai/threads");
    const payload: { threads?: AiThreadSummary[] } = await response
      .json()
      .catch(() => ({}));
    if (!response.ok || !Array.isArray(payload.threads)) return null;
    return payload.threads.filter(
      (thread) =>
        thread &&
        typeof thread.id === "string" &&
        typeof thread.title === "string" &&
        typeof thread.updatedAt === "number",
    );
  } catch {
    return null;
  }
}

export async function readRemoteThread(id: string): Promise<AiThread | null> {
  try {
    const response = await fetch(`/api/ai/threads/${id}`);
    const payload: Partial<AiThread> = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(payload.messages)) return null;
    if (typeof payload.id !== "string" || typeof payload.title !== "string") {
      return null;
    }
    return {
      id: payload.id,
      title: payload.title,
      updatedAt:
        typeof payload.updatedAt === "number" ? payload.updatedAt : Date.now(),
      messages: payload.messages.filter(
        (message) =>
          message &&
          typeof message.id === "string" &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string",
      ),
    };
  } catch {
    return null;
  }
}

export async function saveRemoteThread(thread: AiThread) {
  try {
    const response = await fetch("/api/ai/threads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(thread),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function importRemoteThreads(threads: AiThread[]) {
  try {
    const response = await fetch("/api/ai/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threads }),
    });
    const payload: { threads?: AiThreadSummary[] } = await response
      .json()
      .catch(() => ({}));
    if (!response.ok || !Array.isArray(payload.threads)) return null;
    return payload.threads;
  } catch {
    return null;
  }
}
