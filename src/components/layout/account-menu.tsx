"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLoginDialog } from "@/store/login-dialog";

export function AccountMenu() {
  const { status, user } = useCurrentUser();
  const setLoginOpen = useLoginDialog((state) => state.setOpen);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const login = params.get("login");
    if (login !== "failed" && login !== "config") return;

    if (login === "config") {
      toast.error(
        "请先在 .env.local 写入 GitHub 的 Client ID 和 Client Secret",
      );
    } else {
      toast.error("GitHub 登录没有完成");
    }

    params.delete("login");
    const next = params.toString();
    window.history.replaceState(
      null,
      "",
      next ? `${window.location.pathname}?${next}` : window.location.pathname,
    );
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.reload();
    }
  };

  if (status === "loading") {
    return null;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => setLoginOpen(true)}
        className="h-7 px-2 inline-flex items-center text-xs font-medium rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        登录
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {user.avatarUrl ? (
        // biome-ignore lint/performance/noImgElement: GitHub 头像地址固定尺寸
        <img
          src={user.avatarUrl}
          alt=""
          className="size-4 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <span className="max-w-24 truncate text-xs text-slate-700">
        {user.name || "已登录"}
      </span>
      <button
        type="button"
        onClick={() => {
          void logout();
        }}
        className="h-7 px-2 text-xs font-medium rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
      >
        退出
      </button>
    </div>
  );
}
