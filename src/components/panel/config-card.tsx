"use client";

import { ChevronRight } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/resume";

interface ConfigCardProps extends React.ComponentProps<"div"> {
  /** 写入 settings.configCards 的键 */
  id: string;
  title: string;
  icon: React.ReactNode;
  /** 标题右侧的状态或操作，折叠后仍留在标题行 */
  extra?: React.ReactNode;
  /** 紧挨标题的标记，例如已选中 */
  badge?: React.ReactNode;
  /** 当前配置块对应的内容已在画布中选中 */
  active?: boolean;
  /** 空状态：虚线边框 */
  dashed?: boolean;
  defaultOpen?: boolean;
}

export const ConfigCard: React.FC<ConfigCardProps> = ({
  id,
  title,
  icon,
  extra,
  badge,
  className,
  active = false,
  dashed = false,
  defaultOpen = true,
  children,
  ...props
}) => {
  const open = useResumeStore(
    (state) => state.resume.settings.configCards[id] ?? defaultOpen,
  );
  const setConfigCardOpen = useResumeStore((state) => state.setConfigCardOpen);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 transition-colors duration-200",
        dashed && "border-dashed border-slate-200 text-xs text-slate-500",
        active &&
          "border-blue-200/80 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/20",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={open}
          title={open ? "折叠" : "展开"}
          onClick={() => setConfigCardOpen(id, !open)}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform duration-200",
              open && "rotate-90",
            )}
          />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-semibold text-slate-800">
          {icon}
          <span className="truncate">{title}</span>
          {badge}
        </div>
        {extra}
      </div>
      {open ? children : null}
    </div>
  );
};
