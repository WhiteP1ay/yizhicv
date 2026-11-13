"use client";

import { X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { IMAGE_TRAY_DRAG_TYPE } from "@/lib/image-tray-drag";
import { useImageTray } from "@/store/image-tray";
import { useResumeStore } from "@/store/resume";

const TRAY_WIDTH = 216;

function clampPosition(x: number, y: number) {
  const maxX = Math.max(8, window.innerWidth - TRAY_WIDTH - 8);
  const maxY = Math.max(48, window.innerHeight - 120);
  return {
    x: Math.min(maxX, Math.max(8, x)),
    y: Math.min(maxY, Math.max(48, y)),
  };
}

export const ImageTray: React.FC = () => {
  const open = useResumeStore((state) => state.resume.settings.imageTrayOpen);
  const savedX = useResumeStore((state) => state.resume.settings.imageTrayX);
  const savedY = useResumeStore((state) => state.resume.settings.imageTrayY);
  const setOpen = useResumeStore((state) => state.setImageTrayOpen);
  const setPosition = useResumeStore((state) => state.setImageTrayPosition);
  const items = useImageTray((state) => state.items);
  const [pos, setPos] = useState({ x: savedX, y: savedY });
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setPos({ x: savedX, y: savedY });
  }, [savedX, savedY]);

  if (!open) return null;

  return (
    <section
      className="image-tray no-print fixed z-20 flex w-[216px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
      style={{ left: pos.x, top: pos.y }}
    >
      <header
        className="flex cursor-grab items-center gap-1 border-b border-slate-100 bg-slate-50 px-1.5 py-1 active:cursor-grabbing"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          const handle = event.currentTarget;
          dragging.current = true;
          const origin = {
            dx: event.clientX - pos.x,
            dy: event.clientY - pos.y,
          };
          handle.setPointerCapture(event.pointerId);
          const move = (next: PointerEvent) => {
            setPos(
              clampPosition(next.clientX - origin.dx, next.clientY - origin.dy),
            );
          };
          const up = (next: PointerEvent) => {
            dragging.current = false;
            const nextPos = clampPosition(
              next.clientX - origin.dx,
              next.clientY - origin.dy,
            );
            setPos(nextPos);
            setPosition(nextPos.x, nextPos.y);
            handle.removeEventListener("pointermove", move);
            handle.removeEventListener("pointerup", up);
          };
          handle.addEventListener("pointermove", move);
          handle.addEventListener("pointerup", up);
        }}
      >
        <button
          type="button"
          className="inline-flex size-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          aria-label="关闭备选"
          onClick={() => setOpen(false)}
        >
          <X className="size-3" />
        </button>
        <span className="text-xs font-medium text-slate-700">备选</span>
      </header>
      <div className="max-h-80 space-y-1 overflow-auto p-1.5">
        {items.length === 0 ? (
          <p className="px-1 py-6 text-center text-[11px] leading-relaxed text-slate-400">
            从图片库放进来的图片会出现在这里。
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.src}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  IMAGE_TRAY_DRAG_TYPE,
                  JSON.stringify({
                    src: item.src,
                    name: item.name,
                    stored: item.stored,
                  }),
                );
                event.dataTransfer.effectAllowed = "copy";
              }}
              className="flex cursor-grab items-center gap-2 rounded-md border border-slate-100 bg-slate-50 p-1 active:cursor-grabbing"
            >
              {/* biome-ignore lint/performance/noImgElement: tray thumbnail of a remote image */}
              <img
                src={item.src}
                alt=""
                draggable={false}
                className="size-10 shrink-0 rounded object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-700">
                {item.name || "未命名"}
              </span>
            </div>
          ))
        )}
      </div>
      <p className="border-t border-slate-100 px-2 py-1.5 text-center text-[11px] text-slate-400">
        可拖拽入文档
      </p>
    </section>
  );
};
