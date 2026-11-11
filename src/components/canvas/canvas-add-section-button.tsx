"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";

interface CanvasAddSectionButtonProps {
  slot: "main" | "sidebar";
  onAdd: (slot: "main" | "sidebar") => void;
  className?: string;
}

export const CanvasAddSectionButton: React.FC<CanvasAddSectionButtonProps> = ({
  slot,
  onAdd,
  className = "",
}) => {
  const isSidebar = slot === "sidebar";

  return (
    <div
      className={`no-print flex justify-center items-center w-full ${
        isSidebar ? "mt-3" : "mt-4"
      } ${className}`}
    >
      <Button
        type="button"
        variant="outline"
        onClick={() => onAdd(slot)}
        className={`w-full border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:bg-slate-50/50 hover:text-slate-600 shadow-none transition-all flex items-center justify-center ${
          isSidebar ? "h-7" : "h-8"
        }`}
        title={isSidebar ? "添加侧栏模块" : "添加新模块"}
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};
