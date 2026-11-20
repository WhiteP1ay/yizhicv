import {
  defaultResume,
  type YizhiResume,
  yizhiResumeSchema,
} from "@/types/resume";

export const RESUME_LIMIT = 100;
const MAX_DOCUMENT_CHARS = 1_500_000;
const RESUME_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ResumePreview = {
  html: string;
  pagePadding: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: "sans" | "serif" | "mono";
  themeColor: string;
  sectionGap: number;
  blur: boolean;
};

export type ResumeSummary = {
  id: string;
  title: string;
  preview: ResumePreview;
  createdAt: string;
  updatedAt: string;
};

export function isResumeId(id: string) {
  return RESUME_ID.test(id);
}

function sectionHtml(resume: YizhiResume, slot: "main" | "sidebar") {
  return resume.sections
    .filter((section) => section.visible && section.slot === slot)
    .map((section) => section.content)
    .join("");
}

/** 列表缩略图用的正文。按单栏或双栏拼好，样式仍走简历画布。 */
export function resumePreviewHtml(resume: YizhiResume) {
  const main = sectionHtml(resume, "main");
  const sidebar = sectionHtml(resume, "sidebar");
  if (resume.layout.sidebarWidth <= 0) {
    return `<div class="flex flex-col" style="gap:var(--cv-gap)">${main}${sidebar}</div>`;
  }
  return `<div class="flex w-full"><aside style="width:${resume.layout.sidebarWidth}px;padding-right:16px">${sidebar}</aside><div class="min-w-0 flex-1" style="padding-left:16px">${main}</div></div>`;
}

export function summarizeResume(resume: YizhiResume): ResumeSummary {
  return {
    id: resume.metadata.id,
    title: resume.metadata.title,
    preview: {
      html: resumePreviewHtml(resume),
      pagePadding: resume.design.pagePadding,
      fontSize: resume.design.fontSize,
      lineHeight: resume.design.lineHeight,
      fontFamily: resume.design.fontFamily,
      themeColor: resume.design.themeColor,
      sectionGap: resume.design.sectionGap,
      blur: resume.settings.isBlurMode,
    },
    createdAt: resume.metadata.createdAt,
    updatedAt: resume.metadata.updatedAt,
  };
}

export function parseResumeDocument(value: unknown): YizhiResume | null {
  if (!value || typeof value !== "object") return null;
  try {
    if (JSON.stringify(value).length > MAX_DOCUMENT_CHARS) return null;
  } catch {
    return null;
  }
  const parsed = yizhiResumeSchema.safeParse(value);
  if (!parsed.success || !isResumeId(parsed.data.metadata.id)) return null;
  const created = Date.parse(parsed.data.metadata.createdAt);
  const updated = Date.parse(parsed.data.metadata.updatedAt);
  if (!Number.isFinite(created) || !Number.isFinite(updated)) return null;
  const title = parsed.data.metadata.title.trim().slice(0, 80) || "未命名";
  return {
    ...parsed.data,
    metadata: {
      ...parsed.data.metadata,
      title,
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(updated).toISOString(),
    },
  };
}

export function blankResume(): YizhiResume {
  const now = new Date().toISOString();
  return {
    ...defaultResume,
    metadata: {
      id: crypto.randomUUID(),
      title: "未命名",
      createdAt: now,
      updatedAt: now,
      language: "zh",
    },
    layout: { ...defaultResume.layout },
    settings: {
      ...defaultResume.settings,
      customColors: [...defaultResume.settings.customColors],
      configCards: { ...defaultResume.settings.configCards },
    },
    sections: defaultResume.sections.map((section) => ({ ...section })),
    design: { ...defaultResume.design },
  };
}

/** 清空内容，但保留这份简历的 id、标题和创建时间。 */
export function clearedResume(current: YizhiResume): YizhiResume {
  const next = blankResume();
  next.metadata.id = current.metadata.id;
  next.metadata.title = current.metadata.title;
  next.metadata.createdAt = current.metadata.createdAt;
  next.metadata.updatedAt = new Date().toISOString();
  return next;
}
