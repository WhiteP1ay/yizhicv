"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  flushPersist,
  openResume,
  schedulePersist,
} from "@/lib/resume-library";
import { useResumeStore } from "@/store/resume";

export function useResumeDocument(resumeId: string) {
  const router = useRouter();
  const { status, user } = useCurrentUser();
  const importResume = useResumeStore((state) => state.importResume);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;
    readyRef.current = false;
    setReady(false);
    void (async () => {
      const resume = await openResume(resumeId, Boolean(userRef.current));
      if (cancelled) return;
      if (!resume) {
        router.replace("/list");
        return;
      }
      importResume(resume);
      readyRef.current = true;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [importResume, resumeId, router, status]);

  useEffect(() => {
    return useResumeStore.subscribe((state, previous) => {
      if (!readyRef.current) return;
      if (state.resume === previous.resume) return;
      if (state.resume.metadata.id !== resumeId) return;
      schedulePersist(state.resume, Boolean(userRef.current));
    });
  }, [resumeId]);

  useEffect(() => {
    return () => {
      if (!readyRef.current) return;
      const current = useResumeStore.getState().resume;
      if (current.metadata.id !== resumeId) return;
      flushPersist(current, Boolean(userRef.current));
    };
  }, [resumeId]);

  useEffect(() => {
    if (status !== "ready" || !user || !readyRef.current) return;
    const current = useResumeStore.getState().resume;
    if (current.metadata.id !== resumeId) return;
    flushPersist(current, true);
  }, [resumeId, status, user]);

  return ready;
}
