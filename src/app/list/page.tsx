"use client";

import { FileText, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { AccountMenu } from "@/components/layout/account-menu";
import { LoginDialog } from "@/components/layout/login-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { ResumeSummary } from "@/lib/resume-document";
import {
  createResume,
  deleteResume,
  loadResumeList,
  renameResume,
} from "@/lib/resume-library";
import { confirmDialog } from "@/store/confirm-dialog";

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ResumeListPage() {
  const router = useRouter();
  const { status, user } = useCurrentUser();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [ready, setReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const skipSave = useRef(false);
  const blockOpen = useRef(false);

  const reload = useCallback(async () => {
    const result = await loadResumeList(Boolean(user));
    setResumes(result.resumes);
    return result;
  }, [user]);

  useEffect(() => {
    const release = () => {
      window.setTimeout(() => {
        blockOpen.current = false;
      }, 0);
    };
    window.addEventListener("pointerup", release);
    return () => window.removeEventListener("pointerup", release);
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;
    void (async () => {
      const result = await reload();
      if (cancelled) return;
      if (user && !result.synced) {
        toast.error("账号暂时连不上，先显示这台浏览器里的简历");
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [reload, status, user]);

  const create = async () => {
    const resume = await createResume(Boolean(user));
    router.push(`/app/${resume.metadata.id}`);
  };

  const remove = async (resume: ResumeSummary) => {
    const ok = await confirmDialog({
      title: "删除简历",
      description: `「${resume.title}」会被删掉，此操作不可撤销。`,
      confirmLabel: "删除",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteResume(resume.id, Boolean(user));
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "这份简历删不掉");
    }
  };

  const commitTitle = async (id: string) => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const current = resumes.find((item) => item.id === id);
    const next = title.trim() || "未命名";
    setEditingId(null);
    if (!current || next === current.title) return;
    try {
      await renameResume(id, next, Boolean(user));
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "名字没有改成");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
            一
          </div>
          <span className="text-sm font-bold tracking-tight">一纸简历</span>
        </Link>
        <AccountMenu />
      </header>

      <main className="flex flex-1 flex-col px-6 py-6">
        {!ready || resumes.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl bg-white">
            {!ready ? (
              <p className="text-sm text-slate-400">正在读取简历…</p>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText />
                  </EmptyMedia>
                  <EmptyTitle>还没有简历</EmptyTitle>
                  <EmptyDescription>
                    新建一份，从空白页面开始写。
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button type="button" onClick={() => void create()}>
                    新建简历
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {resumes.map((resume) => (
              <div key={resume.id} className="group">
                <div className="relative transition duration-200 group-hover:-translate-y-1">
                  <button
                    type="button"
                    aria-label="删除"
                    className="absolute -top-2 -right-2 z-10 flex size-7 items-center justify-center rounded-full bg-white text-rose-500 opacity-0 shadow-sm ring-1 ring-slate-200 transition group-hover:opacity-100 hover:text-rose-600"
                    onClick={(event) => {
                      event.stopPropagation();
                      void remove(resume);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <article
                    className="relative aspect-[210/297] cursor-pointer overflow-hidden rounded-sm bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 transition duration-200 group-hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                    style={{ containerType: "inline-size" }}
                    onMouseDown={() => {
                      if (editingId !== resume.id) return;
                      blockOpen.current = true;
                    }}
                    onClick={() => {
                      if (blockOpen.current) {
                        blockOpen.current = false;
                        return;
                      }
                      router.push(`/app/${resume.id}`);
                    }}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter") {
                        router.push(`/app/${resume.id}`);
                      }
                    }}
                  >
                    <div
                      className={`cv-sheet pointer-events-none absolute top-0 left-0 h-[1123px] w-[794px] origin-top-left text-slate-800 ${
                        resume.preview.fontFamily === "serif"
                          ? "font-serif"
                          : resume.preview.fontFamily === "mono"
                            ? "font-mono"
                            : "font-sans"
                      } ${resume.preview.blur ? "cv-preview-blur" : ""}`}
                      style={{
                        transform: "scale(calc(100cqw / 794px))",
                        padding: `${resume.preview.pagePadding}mm`,
                        fontSize: `${resume.preview.fontSize}pt`,
                        lineHeight: resume.preview.lineHeight,
                        ["--cv-theme" as string]: resume.preview.themeColor,
                        ["--cv-line-height" as string]: String(
                          resume.preview.lineHeight,
                        ),
                        ["--cv-gap" as string]: `${resume.preview.sectionGap}px`,
                      }}
                      dangerouslySetInnerHTML={{ __html: resume.preview.html }}
                    />
                  </article>
                </div>
                <div className="mt-2">
                  {editingId === resume.id ? (
                    <Input
                      value={title}
                      maxLength={80}
                      autoFocus
                      className="h-7"
                      onChange={(event) => setTitle(event.target.value)}
                      onBlur={() => void commitTitle(resume.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                        if (event.key === "Escape") {
                          skipSave.current = true;
                          setEditingId(null);
                        }
                      }}
                    />
                  ) : (
                    <div className="group/title flex min-w-0 items-center gap-1">
                      <h2 className="truncate text-sm font-medium">
                        {resume.title}
                      </h2>
                      <button
                        type="button"
                        aria-label="改名"
                        className="shrink-0 text-slate-400 opacity-0 hover:text-slate-700 group-hover/title:opacity-100"
                        onClick={() => {
                          setEditingId(resume.id);
                          setTitle(resume.title);
                        }}
                      >
                        <Pencil className="size-3" />
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">
                    创建 {formatWhen(resume.createdAt)}
                    <span className="mx-1.5">·</span>
                    修改 {formatWhen(resume.updatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <LoginDialog />
      <ConfirmDialog />
      <Toaster position="top-center" richColors />
    </div>
  );
}
