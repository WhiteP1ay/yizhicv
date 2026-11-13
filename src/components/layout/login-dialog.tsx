"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLoginDialog } from "@/store/login-dialog";

const phonePattern = /^1\d{10}$/;

export function LoginDialog() {
  const open = useLoginDialog((state) => state.open);
  const setOpen = useLoginDialog((state) => state.setOpen);
  const [phone, setPhone] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [code, setCode] = useState("");
  const [captchaStamp, setCaptchaStamp] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState<{
    phone: string;
    remaining: number;
  } | null>(null);

  const reset = () => {
    setPhone("");
    setCaptcha("");
    setCode("");
    setSending(false);
  };

  const remaining = cooldown?.phone === phone ? cooldown.remaining : 0;

  useEffect(() => {
    if (open) setCaptchaStamp(Date.now());
  }, [open]);

  useEffect(() => {
    if (!cooldown || cooldown.remaining <= 0) return;
    const timer = window.setTimeout(() => {
      setCooldown((current) =>
        current ? { ...current, remaining: current.remaining - 1 } : current,
      );
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const refreshCaptcha = () => {
    setCaptcha("");
    setCaptchaStamp(Date.now());
  };

  const requirePhone = () => {
    if (phonePattern.test(phone)) return true;
    toast.error("请输入 11 位手机号");
    return false;
  };

  const requestSmsCode = async () => {
    if (!requirePhone() || sending || remaining > 0) return;
    if (!/^[a-zA-Z0-9]{4}$/.test(captcha)) {
      toast.error("请输入图形验证码");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/auth/phone/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, captcha }),
      });
      const payload: {
        message?: string;
        refresh?: boolean;
        retryAfter?: number;
      } = await response.json().catch(() => ({}));
      toast.error(payload.message ?? "获取验证码失败");
      if (payload.refresh) refreshCaptcha();
      if (payload.retryAfter && payload.retryAfter > 0) {
        setCooldown({ phone, remaining: payload.retryAfter });
      }
    } catch {
      toast.error("获取验证码失败");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-[440px] gap-5 p-5">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-base font-semibold text-slate-900">
            登录
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            未注册的手机号验证通过后会自动创建账号
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!requirePhone()) return;
            toast.error("手机验证码还没接上");
          }}
        >
          <label className="block space-y-2.5">
            <span className="text-xs font-medium text-slate-700">手机号</span>
            <span className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-500/40">
              <span className="inline-flex items-center border-r border-slate-200 px-3 text-xs text-slate-500">
                +86
              </span>
              <input
                value={phone}
                inputMode="numeric"
                autoComplete="tel"
                maxLength={11}
                placeholder="请输入手机号"
                className="min-w-0 flex-1 bg-transparent px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400"
                onChange={(event) => {
                  setPhone(event.target.value.replace(/\D/g, "").slice(0, 11));
                }}
              />
            </span>
          </label>

          <label className="block space-y-2.5">
            <span className="text-xs font-medium text-slate-700">
              图形验证码
            </span>
            <span className="flex h-9 gap-2">
              <input
                value={captcha}
                autoComplete="off"
                maxLength={4}
                placeholder="请输入图中字符"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/40"
                onChange={(event) => {
                  setCaptcha(
                    event.target.value
                      .replace(/[^a-zA-Z0-9]/g, "")
                      .slice(0, 4)
                      .toUpperCase(),
                  );
                }}
              />
              <button
                type="button"
                title="换一张"
                className="h-9 w-32 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
                onClick={refreshCaptcha}
              >
                {captchaStamp ? (
                  // biome-ignore lint/performance/noImgElement: 图形验证码由接口按次生成
                  <img
                    alt="图形验证码，点击换一张"
                    src={`/api/auth/captcha?t=${captchaStamp}`}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </button>
            </span>
          </label>

          <label className="block space-y-2.5">
            <span className="text-xs font-medium text-slate-700">
              短信验证码
            </span>
            <span className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-500/40">
              <input
                value={code}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6 位验证码"
                className="min-w-0 flex-1 bg-transparent px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400"
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                }}
              />
              <button
                type="button"
                disabled={sending || remaining > 0}
                className="shrink-0 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer disabled:cursor-default disabled:text-slate-400"
                onClick={() => {
                  void requestSmsCode();
                }}
              >
                {remaining > 0 ? `${remaining}s` : "获取验证码"}
              </button>
            </span>
          </label>

          <Button type="submit" className="w-full">
            登录
          </Button>
        </form>

        <div className="relative">
          <div className="border-t border-slate-200" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-[11px] text-slate-400">
            其他方式
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.assign("/api/auth/github");
          }}
        >
          <SiGithub />
          使用 GitHub 登录
        </Button>
      </DialogContent>
    </Dialog>
  );
}
