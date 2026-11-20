"use client";

import { cn } from "cn";
import type { ComponentType } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  title?: string;
};

const itemSize = {
  md: "h-8 gap-1 text-xs [&_svg]:size-3.5",
  sm: "h-7 gap-1 px-1 text-xs [&_svg]:size-3",
  xs: "h-6 gap-1 px-2 text-[11px]",
} as const;

export function SegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  columns,
  size = "md",
  className,
  itemClassName,
}: {
  value: T | null;
  options: SegmentedOption<T>[];
  onValueChange: (value: T) => void;
  columns?: 3 | 4;
  size?: keyof typeof itemSize;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(next) => {
        const picked = next[next.length - 1];
        if (options.some((option) => option.value === picked)) {
          onValueChange(picked as T);
        }
      }}
      className={cn(
        "w-full gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-2xs",
        columns === 3 && "grid grid-cols-3",
        columns === 4 && "grid grid-cols-4",
        !columns && "flex flex-wrap",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            title={option.title ?? option.label}
            onPointerDown={(event) => event.preventDefault()}
            className={cn(
              "cursor-pointer rounded font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 data-pressed:bg-slate-900 data-pressed:text-white data-pressed:shadow-2xs",
              itemSize[size],
              itemClassName,
            )}
          >
            {Icon ? <Icon /> : null}
            <span>{option.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
