import { get, set } from "idb-keyval";
import {
  blankResume,
  parseResumeDocument,
  RESUME_LIMIT,
  type ResumeSummary,
  summarizeResume,
} from "@/lib/resume-document";
import {
  deleteRemoteResume,
  importRemoteResumes,
  listRemoteResumes,
  readRemoteResume,
  saveRemoteResume,
} from "@/lib/resumes-remote";
import type { YizhiResume } from "@/types/resume";

const STORAGE_KEY = "yizhicv.resumes.v1";

const remoteTimers = new Map<string, ReturnType<typeof setTimeout>>();

function byRecent(a: ResumeSummary, b: ResumeSummary) {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}

async function readAll(): Promise<YizhiResume[]> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return [];
  }
  try {
    const stored = await get<unknown>(STORAGE_KEY);
    if (!Array.isArray(stored)) return [];
    const resumes: YizhiResume[] = [];
    for (const item of stored) {
      const resume = parseResumeDocument(item);
      if (resume) resumes.push(resume);
    }
    return resumes;
  } catch {
    return [];
  }
}

async function writeAll(resumes: YizhiResume[]) {
  const next = resumes
    .sort(
      (a, b) =>
        Date.parse(b.metadata.updatedAt) - Date.parse(a.metadata.updatedAt),
    )
    .slice(0, RESUME_LIMIT);
  await set(STORAGE_KEY, next);
}

let localChain: Promise<void> = Promise.resolve();

async function readSettled() {
  await localChain;
  return readAll();
}

export async function listLocalResumes(): Promise<ResumeSummary[]> {
  const resumes = await readSettled();
  return resumes.map(summarizeResume).sort(byRecent);
}

export async function readLocalResume(id: string) {
  const resumes = await readSettled();
  return resumes.find((resume) => resume.metadata.id === id) ?? null;
}

function enqueueLocal(task: () => Promise<void>) {
  const run = localChain.then(task);
  localChain = run.catch(() => {});
  return run;
}

export function upsertLocalResume(resume: YizhiResume) {
  return enqueueLocal(async () => {
    const resumes = await readAll();
    const next = resumes.filter(
      (item) => item.metadata.id !== resume.metadata.id,
    );
    next.push(resume);
    await writeAll(next);
  });
}

export function removeLocalResume(id: string) {
  return enqueueLocal(async () => {
    const resumes = await readAll();
    await writeAll(resumes.filter((resume) => resume.metadata.id !== id));
  });
}

export async function loadResumeList(loggedIn: boolean): Promise<{
  resumes: ResumeSummary[];
  synced: boolean;
}> {
  const local = await listLocalResumes();
  if (!loggedIn) return { resumes: local, synced: false };
  try {
    const docs = await readSettled();
    if (docs.length > 0) await importRemoteResumes(docs);
    const remote = await listRemoteResumes();
    const ids = new Set(remote.map((item) => item.id));
    await enqueueLocal(async () => {
      const current = await readAll();
      await writeAll(current.filter((resume) => ids.has(resume.metadata.id)));
    });
    return { resumes: remote, synced: true };
  } catch {
    return { resumes: local, synced: false };
  }
}

export async function openResume(id: string, loggedIn: boolean) {
  const local = await readLocalResume(id);
  if (!loggedIn) return local;
  try {
    const remote = await readRemoteResume(id);
    if (!remote) {
      if (!local) return null;
      await saveRemoteResume(local);
      return local;
    }
    if (
      local &&
      Date.parse(local.metadata.updatedAt) >
        Date.parse(remote.metadata.updatedAt)
    ) {
      await saveRemoteResume(local);
      return local;
    }
    await upsertLocalResume(remote);
    return remote;
  } catch {
    return local;
  }
}

export async function createResume(loggedIn: boolean) {
  const resume = blankResume();
  await upsertLocalResume(resume);
  if (loggedIn) {
    try {
      await saveRemoteResume(resume);
    } catch {
      // 本地已写入，打开编辑器后会再同步
    }
  }
  return resume;
}

export async function renameResume(
  id: string,
  title: string,
  loggedIn: boolean,
) {
  const name = title.trim().slice(0, 80) || "未命名";
  let resume = await readLocalResume(id);
  if (!resume && loggedIn) resume = await readRemoteResume(id);
  if (!resume) return;
  const next: YizhiResume = {
    ...resume,
    metadata: {
      ...resume.metadata,
      title: name,
      updatedAt: new Date().toISOString(),
    },
  };
  await upsertLocalResume(next);
  if (loggedIn) await saveRemoteResume(next);
}

export async function deleteResume(id: string, loggedIn: boolean) {
  if (loggedIn) await deleteRemoteResume(id);
  await removeLocalResume(id);
}

export function schedulePersist(resume: YizhiResume, loggedIn: boolean) {
  void upsertLocalResume(resume);
  if (!loggedIn) return;
  const id = resume.metadata.id;
  const pending = remoteTimers.get(id);
  if (pending) clearTimeout(pending);
  remoteTimers.set(
    id,
    setTimeout(() => {
      remoteTimers.delete(id);
      void saveRemoteResume(resume).catch(() => {});
    }, 600),
  );
}

export function flushPersist(resume: YizhiResume, loggedIn: boolean) {
  void upsertLocalResume(resume);
  const pending = remoteTimers.get(resume.metadata.id);
  if (pending) clearTimeout(pending);
  remoteTimers.delete(resume.metadata.id);
  if (loggedIn) void saveRemoteResume(resume).catch(() => {});
}
