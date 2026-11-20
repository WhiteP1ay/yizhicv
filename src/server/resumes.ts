import "server-only";

import { and, desc, eq, notInArray } from "drizzle-orm";
import { db, resumes } from "@/db";
import {
  isResumeId,
  parseResumeDocument,
  RESUME_LIMIT,
  type ResumeSummary,
  resumePreviewHtml,
} from "@/lib/resume-document";
import type { YizhiResume } from "@/types/resume";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class ResumeError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function summaryOf(row: {
  id: string;
  title: string;
  document: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ResumeSummary {
  const resume = parseResumeDocument(row.document);
  return {
    id: row.id,
    title: row.title,
    preview: resume
      ? {
          html: resumePreviewHtml(resume),
          pagePadding: resume.design.pagePadding,
          fontSize: resume.design.fontSize,
          lineHeight: resume.design.lineHeight,
          fontFamily: resume.design.fontFamily,
          themeColor: resume.design.themeColor,
          sectionGap: resume.design.sectionGap,
          blur: resume.settings.isBlurMode,
        }
      : {
          html: "",
          pagePadding: 16,
          fontSize: 10.5,
          lineHeight: 1.45,
          fontFamily: "sans" as const,
          themeColor: "#0f172a",
          sectionGap: 16,
          blur: false,
        },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function pruneResumes(tx: Tx, userId: string) {
  const keep = await tx
    .select({ id: resumes.id })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt))
    .limit(RESUME_LIMIT);
  if (keep.length < RESUME_LIMIT) return;
  await tx.delete(resumes).where(
    and(
      eq(resumes.userId, userId),
      notInArray(
        resumes.id,
        keep.map((row) => row.id),
      ),
    ),
  );
}

async function writeResume(tx: Tx, userId: string, resume: YizhiResume) {
  const [existing] = await tx
    .select({
      userId: resumes.userId,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(eq(resumes.id, resume.metadata.id))
    .limit(1);
  if (existing && existing.userId !== userId) {
    throw new ResumeError("找不到这份简历", 404);
  }
  const updatedAt = new Date(resume.metadata.updatedAt);
  if (existing && existing.updatedAt.getTime() > updatedAt.getTime()) return;

  await tx
    .insert(resumes)
    .values({
      id: resume.metadata.id,
      userId,
      title: resume.metadata.title,
      document: resume,
      createdAt: new Date(resume.metadata.createdAt),
      updatedAt,
    })
    .onConflictDoUpdate({
      target: resumes.id,
      set: {
        title: resume.metadata.title,
        document: resume,
        updatedAt,
      },
    });
}

export async function listResumes(userId: string): Promise<ResumeSummary[]> {
  const rows = await db
    .select({
      id: resumes.id,
      title: resumes.title,
      document: resumes.document,
      createdAt: resumes.createdAt,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt))
    .limit(RESUME_LIMIT);
  return rows.map(summaryOf);
}

export async function readResume(userId: string, id: string) {
  if (!isResumeId(id)) return null;
  const [row] = await db
    .select({
      id: resumes.id,
      title: resumes.title,
      document: resumes.document,
      createdAt: resumes.createdAt,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1);
  if (!row) return null;
  const resume = parseResumeDocument(row.document);
  if (!resume) throw new ResumeError("这份简历读不出来", 500);
  return {
    ...resume,
    metadata: {
      ...resume.metadata,
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}

export async function saveResume(userId: string, resume: YizhiResume) {
  await db.transaction(async (tx) => {
    await writeResume(tx, userId, resume);
    await pruneResumes(tx, userId);
  });
}

export async function importResumes(userId: string, items: YizhiResume[]) {
  const next = items.slice(0, RESUME_LIMIT);
  await db.transaction(async (tx) => {
    for (const resume of next) {
      await writeResume(tx, userId, resume);
    }
    await pruneResumes(tx, userId);
  });
}

export async function removeResume(userId: string, id: string) {
  if (!isResumeId(id)) throw new ResumeError("找不到这份简历", 404);
  const deleted = await db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .returning({ id: resumes.id });
  if (deleted.length === 0) throw new ResumeError("找不到这份简历", 404);
}
