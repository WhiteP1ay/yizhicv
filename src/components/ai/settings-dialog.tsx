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
  type ByokWire,
  isAiProviderId,
  isByokWire,
  parseByokApiKey,
  parseByokBaseUrl,
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
  const [wire, setWire] = useState<ByokWire>("openai");
  const [savedWire, setSavedWire] = useState<ByokWire | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [savedBaseUrl, setSavedBaseUrl] = useState<string | null>(null);
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
      setBaseUrl(local.baseUrl ?? "");
      setSavedBaseUrl(local.baseUrl);
      setWire(local.wire ?? "openai");
      setSavedWire(local.wire);
      setConfigured(true);
      setKeySource("local");
    } else if (!user) {
      setModels([]);
      setModel("");
      setBaseUrl("");
      setWire("openai");
      setConfigured(false);
      setSavedProvider(null);
      setSavedModel(null);
      setSavedBaseUrl(null);
      setSavedWire(null);
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
      setSavedBaseUrl(null);
      setSavedWire(null);
      setModels([]);
      setModel("");
      setBaseUrl("");
      setWire("openai");
      void fetch("/api/ai/byok")
        .then(async (response) => {
          const payload: {
            provider?: string;
            model?: string | null;
            baseUrl?: string | null;
            wire?: string | null;
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
          const nextBase =
            typeof payload.baseUrl === "string" ? payload.baseUrl : "";
          const nextWire = isByokWire(payload.wire) ? payload.wire : "openai";
          setProvider(next);
          setSavedProvider(next);
          setSavedModel(nextModel || null);
          setSavedBaseUrl(nextBase || null);
          setSavedWire(isByokWire(payload.wire) ? payload.wire : null);
          setModel(nextModel);
          setModels(nextModel ? [nextModel] : []);
          setBaseUrl(nextBase);
          setWire(nextWire);
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
    const custom = customFields();
    if (custom === false) return;
    setFetching(true);
    try {
      const response = await fetch("/api/ai/byok/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          ...(nextKey ? { apiKey: nextKey } : {}),
          ...(custom ?? {}),
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
      setModel((current) =>
        nextModels.includes(current) || (provider === "custom" && current)
          ? current
          : "",
      );
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
      toast.error(provider === "custom" ? "请填写模型" : "请先获取并选择模型");
      return;
    }
    const custom = customFields();
    if (custom === false) return;
    const base = custom?.baseUrl ?? null;
    const nextWire = custom?.wire ?? null;
    writeLocalByok({
      provider,
      model: parsedModel,
      apiKey: parsedKey,
      baseUrl: base,
      wire: nextWire,
    });
    setConfigured(true);
    setKeySource("local");
    setSavedProvider(provider);
    setSavedModel(parsedModel);
    setSavedBaseUrl(base);
    setSavedWire(nextWire);
    setModel(parsedModel);
    if (base) setBaseUrl(base);
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
    setSavedBaseUrl(null);
    setSavedWire(null);
    setModel("");
    setModels([]);
    setBaseUrl("");
    setWire("openai");
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

  const customFields = () => {
    if (provider !== "custom") return null;
    const parsed = parseByokBaseUrl(baseUrl);
    if (parsed === "") {
      toast.error("请填写 base URL");
      return false;
    }
    if (!parsed) {
      toast.error("base URL 格式不正确");
      return false;
    }
    return { baseUrl: parsed, wire };
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
          AI 的 API key 和直接使用额度
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
              <h3 className="text-xs font-medium text-slate-800">API key</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                选择服务商并填写 API key，再获取该 key
                当前可用的模型。配置保存在这台浏览器，不登录也能用。登录后可以同步到账号。BYOK
                使用你的 key，不占用直接使用额度。
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
                        setBaseUrl(savedBaseUrl ?? "");
                        setWire(savedWire ?? "openai");
                        if (savedModel) {
                          setModel(savedModel);
                          setModels([savedModel]);
                        } else {
                          setModel("");
                          setModels([]);
                        }
                        return;
                      }
                      setBaseUrl("");
                      setWire("openai");
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
                {provider === "custom" ? (
                  <>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] text-slate-500">
                        接口格式
                      </span>
                      <select
                        data-testid="api-key-wire"
                        value={wire}
                        className={fieldClass}
                        onChange={(event) => {
                          if (isByokWire(event.target.value)) {
                            setWire(event.target.value);
                          }
                        }}
                      >
                        <option value="openai">OpenAI 兼容</option>
                        <option value="anthropic">Anthropic 兼容</option>
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] text-slate-500">
                        Base URL
                      </span>
                      <input
                        data-testid="api-key-base-url"
                        type="url"
                        autoComplete="off"
                        spellCheck={false}
                        value={baseUrl}
                        placeholder="https://example.com/v1"
                        className={fieldClass}
                        onChange={(event) => setBaseUrl(event.target.value)}
                      />
                    </label>
                  </>
                ) : null}
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
                {provider === "custom" ? (
                  <label className="block space-y-1.5">
                    <span className="text-[11px] text-slate-500">模型</span>
                    <input
                      data-testid="api-key-model"
                      list="byok-model-options"
                      value={model}
                      placeholder="获取列表，或直接填写模型 id"
                      spellCheck={false}
                      className={fieldClass}
                      onChange={(event) => setModel(event.target.value)}
                    />
                    <datalist id="byok-model-options">
                      {models.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                  </label>
                ) : (
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
                )}
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
                <h3 className="text-xs font-medium text-slate-800">
                  直接使用额度
                </h3>
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
                    aria-label="直接使用剩余额度"
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
                <p className="mt-3 text-[11px] text-slate-400">
                  登录后可查看剩余额度
                </p>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
