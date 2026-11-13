"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicUser } from "@/types/auth";

export function useCurrentUser() {
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [user, setUser] = useState<PublicUser | null>(null);

  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data: { user: PublicUser | null } = await response.json();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { status, user, reload };
}
