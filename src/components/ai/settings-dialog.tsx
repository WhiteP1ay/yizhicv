"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  BYOK_SYNC_FLAG,
  clearLocalByok,
  readLocalByok,
  syncLocalByok,
  writeLocalByok,
} from "@/lib/ai-byok-local";
import { WELCOME_GRANT_PICO_CNY } from "@/lib/ai-money";
import {
  AI_PROVIDERS,
  type AiProviderId,
  isAiProviderId,
  parseByokApiKey,
  parseByokModel,
} from "@/lib/ai-providers";
import { useSettingsDialog } from "@/store/api-key-dialog";
import { useLoginDialog } from "@/store/login-dialog";

function isMac() {
  return /Mac|iPhone|iPad/.test(navigator.userAgent);
}

function remainingRatio(balance: string) {
  try {
    const value = BigInt(balance);
    if (value <= BigInt(0)) return 0;
    if (value >= WELCOME_GRANT_PICO_CNY) return 1;
    return Number(value) / Number(WELCOME_GRANT_PICO_CNY);
  } catch {
    return 0;
  }
}

export function SettingsDialog() {
  const open = useSettingsDialog((state) => state.open);
  const setOpen = useSettingsDialog((state) => state.setOpen);
  const { user } = useCurrentUser();
  const setLoginOpen = useLoginDialog((state) => state.setOpen);
  const loginOpen = useLoginDialog((state) => state.open);
  const askedLogin = useRef(false);
  const [provider, setProvider] = useState<AiProviderId>("openai");
  const [savedProvider, setSavedProvider] = useState<AiProviderId | null>(null);
  const [model, setModel] = useState("");
  const [savedModel, setSavedModel] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [configured, setConfigured] = useState(false);
  const [keySource, setKeySource] = useState<"local" | "account" | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [fetching, setFetching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [allowance, setAllowance] = useState<number | null>(null);
  const [allowanceError, setAllowanceError] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.shiftKey) return;
      if (event.key !== ",") return;
      const modifier = isMac() ? event.metaKey : event.ctrlKey;
      if (!modifier || (isMac() ? event.ctrlKey : event.metaKey)) return;
      event.preventDefault();
      setOpen(!useSettingsDialog.getState().open);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (!askedLogin.current || loginOpen || user) return;
    askedLogin.current = false;
    sessionStorage.removeItem(BYOK_SYNC_FLAG);
  }, [loginOpen, user]);

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(BYOK_SYNC_FLAG) !== "1") return;
    sessionStorage.removeItem(BYOK_SYNC_FLAG);
    void syncLocalByok().then((result) => {
      if (result.ok) toast.success("已同步到账号");
      else if (result.message) toast.error(result.message);
    });
  }, [user]);

  useEffect(() => {
    if (!open) return;
    setApiKey("");
    const local = readLocalByok();
    if (local) {
      setProvider(local.provider);
      setSavedProvider(local.provider);
      setModel(local.model);
      setSavedModel(local.model);
      setModels(local.model ? [local.model] : []);
      setConfigured(true);
      setKeySource("local");
    } else if (!user) {
      setModels([]);
      setModel("");
      setConfigured(false);
      setSavedProvider(null);
      setSavedModel(null);
      setKeySource(null);
    }

    if (!user) {
      setAllowance(null);
      setAllowanceError(false);
      return;
    }

    let cancelled = false;
    if (!local) {
      setConfigured(false);
      setKeySource(null);
      setSavedProvider(null);
      setSavedModel(null);
      setModels([]);
      setModel("");
      void fetch("/api/ai/byok")
        .then(async (response) => {
          const payload: {
            provider?: string;
            model?: string | null;
            configured?: boolean;
          } = await response.json().catch(() => ({}));
          if (cancelled || !response.ok || payload.configured !== true) return;
          const next = isAiProviderId(payload.provider)
            ? payload.provider
            : "openai";
          const nextModel =
            typeof payload.model === "string" && payload.model
              ? payload.model
              : "";
          setProvider(next);
          setSavedProvider(next);
          setSavedModel(nextModel || null);
          setModel(nextModel);
          setModels(nextModel ? [nextModel] : []);
          setConfigured(true);
          setKeySource("account");
        })
        .catch(() => {
          if (!cancelled) setConfigured(false);
        });
    }

    setAllowance(null);
    setAllowanceError(false);
    void fetch("/api/ai/balance")
      .then(async (response) => {
        const payload: { balancePicoCny?: string } = await response
          .json()
          .catch(() => ({}));
        if (cancelled) return;
        if (!response.ok || !payload.balancePicoCny) {
          setAllowanceError(true);
          return;
        }
        setAllowance(remainingRatio(payload.balancePicoCny));
      })
      .catch(() => {
        if (!cancelled) setAllowanceError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const rememberedKey = () => {
    const typed = apiKey.trim();
    if (typed) return typed;
    const local = readLocalByok();
    if (local && local.provider === provider) return local.apiKey;
    return "";
  };

  const loadModels = async () => {
    const nextKey = rememberedKey();
    const canUseAccount =
      !nextKey &&
      user &&
      keySource === "account" &&
      configured &&
      provider === savedProvider;
    if (!nextKey && !canUseAccount) {
      toast.error("请填写 API key");
      return;
    }
    setFetching(true);
    try {
      const response = await fetch("/api/ai/byok/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          ...(nextKey ? { apiKey: nextKey } : {}),
        }),
      });
      const payload: { message?: string; models?: string[] } = await response
        .json()
        .catch(() => ({}));
      if (response.status === 401) {
        setLoginOpen(true);
        return;
      }
      if (!response.ok || !Array.isArray(payload.models)) {
        toast.error(payload.message ?? "暂时拉不到模型列表");
        return;
      }
      const nextModels = payload.models.filter(
        (item) => typeof item === "string" && item,
      );
      setModels(nextModels);
      setModel((current) => (nextModels.includes(current) ? current : ""));
      toast.success(`已获取 ${nextModels.length} 个模型`);
    } catch {
      toast.error("暂时拉不到模型列表");
    } finally {
      setFetching(false);
    }
  };

  const save = async () => {
    const nextKey = rememberedKey();
    const parsedKey = parseByokApiKey(nextKey);
    if (!parsedKey) {
      toast.error("请填写 API key");
      return;
    }
    const parsedModel = parseByokModel(model);
    if (!parsedModel) {
      toast.error("请先获取并选择模型");
      return;
    }
    writeLocalByok({
      provider,
      model: parsedModel,
      apiKey: parsedKey,
    });
    setConfigured(true);
    setKeySource("local");
    setSavedProvider(provider);
    setSavedModel(parsedModel);
    setModel(parsedModel);
    setApiKey("");
    toast.success("已保存在这台浏览器");
  };

  const syncAccount = async () => {
    if (!readLocalByok()) {
      toast.error("请先保存到本地");
      return;
    }
    if (!user) {
      askedLogin.current = true;
      sessionStorage.setItem(BYOK_SYNC_FLAG, "1");
      setLoginOpen(true);
      return;
    }
    setSyncing(true);
    try {
      const result = await syncLocalByok();
      if (result.status === 401) {
        askedLogin.current = true;
        sessionStorage.setItem(BYOK_SYNC_FLAG, "1");
        setLoginOpen(true);
        return;
      }
      if (!result.ok) {
        toast.error(result.message ?? "同步失败");
        return;
      }
      toast.success("已同步到账号");
    } finally {
      setSyncing(false);
    }
  };

  const resetForm = () => {
    setConfigured(false);
    setKeySource(null);
    setSavedProvider(null);
    setSavedModel(null);
    setModel("");
    setModels([]);
    setApiKey("");
  };

  const clear = async () => {
    clearLocalByok();
    resetForm();
    if (!user) {
      toast.success("已清除");
      return;
    }
    const response = await fetch("/api/ai/byok", { method: "DELETE" });
    if (!response.ok) {
      toast.error("本地已清除，账号里的配置还在");
      return;
    }
    toast.success("已清除");
  };

  const fieldClass =
    "h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400/30";

  const percent =
    allowance === null
      ? 0
      : Math.round(Math.min(1, Math.max(0, allowance)) * 100);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden p-0 sm:max-w-[680px]"
        data-testid="settings-dialog"
      >
        <DialogTitle className="sr-only">设置</DialogTitle>
        <DialogDescription className="sr-only">
          AI 的 API key 和账号额度
        </DialogDescription>
        <div className="flex h-[520px] min-h-0">
          <aside className="flex w-40 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-2">
            <p className="px-2 py-1.5 text-[11px] font-medium text-slate-400">
              设置
            </p>
            <button
              type="button"
              className="rounded-md bg-white px-2 py-1.5 text-left text-xs text-slate-800 ring-1 ring-slate-200"
            >
              AI
            </button>
          </aside>
          <div className="min-w-0 flex-1 overflow-auto px-5 py-4">
            <h2 className="text-sm font-medium text-slate-900">AI</h2>

            <section className="mt-5">
              <h3 className="text-xs font-medium text-slate-800">BYOK 模式</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                使用你自己的 API
                key，不消耗账号额度。配置默认存在这台浏览器，登录并同步后可跨设备使用。
              </p>
              <form
                className="mt-3 space-y-2.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save();
                }}
              >
                <label className="block space-y-1.5">
                  <span className="text-[11px] text-slate-500">服务商</span>
                  <select
                    data-testid="api-key-provider"
                    value={provider}
                    className={fieldClass}
                    onChange={(event) => {
                      if (!isAiProviderId(event.target.value)) return;
                      const next = event.target.value;
                      setProvider(next);
                      if (next === savedProvider) {
                        if (savedModel) {
                          setModel(savedModel);
                          setModels([savedModel]);
                        } else {
                          setModel("");
                          setModels([]);
                        }
                        return;
                      }
                      setModel("");
                      setModels([]);
                    }}
                  >
                    {AI_PROVIDERS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] text-slate-500">API key</span>
                  <input
                    data-testid="api-key-input"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={apiKey}
                    placeholder={
                      keySource === "local" && provider === savedProvider
                        ? "已保存在这台浏览器，留空则不修改"
                        : keySource === "account" && provider === savedProvider
                          ? "已保存在账号，填写后保存到本地"
                          : "粘贴 API key"
                    }
                    className={fieldClass}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={fetching || syncing}
                    data-testid="api-key-fetch-models"
                    onClick={() => {
                      void loadModels();
                    }}
                  >
                    {fetching ? "获取中" : "获取模型"}
                  </Button>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-[11px] text-slate-500">模型</span>
                  <select
                    data-testid="api-key-model"
                    value={model}
                    disabled={models.length === 0}
                    className={`${fieldClass} disabled:bg-slate-50 disabled:text-slate-400`}
                    onChange={(event) => setModel(event.target.value)}
                  >
                    <option value="">
                      {models.length === 0 ? "先获取模型" : "选择模型"}
                    </option>
                    {models.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={fetching || syncing}
                    data-testid="api-key-save"
                  >
                    保存
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={fetching || syncing}
                    data-testid="api-key-sync"
                    onClick={() => {
                      void syncAccount();
                    }}
                  >
                    {syncing ? "同步中" : "同步到账号"}
                  </Button>
                  {configured ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void clear();
                      }}
                    >
                      清除
                    </Button>
                  ) : null}
                </div>
              </form>
            </section>

            <section className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-medium text-slate-800">账号额度</h3>
                {user && allowance !== null ? (
                  <span className="text-[11px] text-slate-400">
                    剩余 {percent}%
                  </span>
                ) : null}
              </div>
              {user ? (
                allowanceError ? (
                  <p className="mt-3 text-[11px] text-slate-400">
                    额度暂时不可用
                  </p>
                ) : (
                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-label="账号剩余额度"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                  >
                    <div
                      className="h-full rounded-full bg-slate-500"
                      style={{ width: `${allowance === null ? 0 : percent}%` }}
                    />
                  </div>
                )
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <p className="text-[11px] text-slate-400">
                    新用户可领取免费 AI 额度
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setLoginOpen(true)}
                  >
                    登录
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
