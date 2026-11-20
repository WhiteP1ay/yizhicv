import { parseResumeDocument, type ResumeSummary } from "@/lib/resume-document";
import type { YizhiResume } from "@/types/resume";

async function readError(response: Response, fallback: string) {
  const data: { message?: string } = await response.json().catch(() => ({}));
  return data.message || fallback;
}

export async function listRemoteResumes(): Promise<ResumeSummary[]> {
  const response = await fetch("/api/resumes");
  if (!response.ok) {
    throw new Error(await readError(response, "简历列表读不出来"));
  }
  const data: { resumes?: ResumeSummary[] } = await response.json();
  return Array.isArray(data.resumes) ? data.resumes : [];
}

export async function readRemoteResume(id: string) {
  const response = await fetch(`/api/resumes/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(await readError(response, "这份简历读不出来"));
  }
  const data: { resume?: unknown } = await response.json();
  return parseResumeDocument(data.resume);
}

export async function saveRemoteResume(resume: YizhiResume) {
  const response = await fetch(`/api/resumes/${resume.metadata.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ resume }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "简历暂时存不下"));
  }
}

export async function importRemoteResumes(resumes: YizhiResume[]) {
  const response = await fetch("/api/resumes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ resumes }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "简历暂时同步不上"));
  }
}

export async function deleteRemoteResume(id: string) {
  const response = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
  if (response.status === 404) return;
  if (!response.ok) {
    throw new Error(await readError(response, "这份简历删不掉"));
  }
}
