"use client";

import { GripHorizontal, X } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { type CanvasImageItem, useCanvasImagesStore } from "@/store/canvas-images";

/** A4 纸张物理像素尺寸 */
const A4_W = 794;
const A4_H = 1123;

/** 最小显示尺寸 */
const MIN_SIZE = 40;
/** 最大显示尺寸 */
const MAX_SIZE = 400;

interface DraggableImageProps {
  item: CanvasImageItem;
}

const DraggableImage: React.FC<DraggableImageProps> = ({ item }) => {
  const { updateItem, removeItem } = useCanvasImagesStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // 仅响应左键、非 button 控件
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button")) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = containerRef.current?.parentElement?.getBoundingClientRect();
      if (!rect) return;

      // 相对纸张的指针偏移（此时 item.x/y 已是相对纸张左上角）
      const paperX = (e.clientX - rect.left);
      const paperY = (e.clientY - rect.top);
      dragOffsetRef.current = {
        x: paperX - item.x,
        y: paperY - item.y,
      };

      const onMove = (ev: PointerEvent) => {
        const r = containerRef.current?.parentElement?.getBoundingClientRect();
        if (!r) return;
        const nx = Math.max(0, Math.min(A4_W - item.width, ev.clientX - r.left - dragOffsetRef.current.x));
        const ny = Math.max(0, Math.min(A4_H - item.height, ev.clientY - r.top - dragOffsetRef.current.y));
        updateItem(item.id, { x: nx, y: ny });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [item, updateItem],
  );

  return (
    <div
      ref={containerRef}
      className="absolute select-none group/cimg"
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        cursor: "grab",
        zIndex: 20,
      }}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={item.slot.base64}
        alt={item.slot.fileName}
        draggable={false}
        className="w-full h-full object-cover rounded pointer-events-none select-none"
        style={{
          boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.18)" : "0 1px 4px rgba(0,0,0,0.10)",
          border: isHovered ? "1.5px solid #3b82f6" : "1.5px solid transparent",
          transition: "box-shadow 0.15s, border 0.15s",
        }}
      />

      {/* 悬停右上角删除按钮 */}
      <button
        type="button"
        className="absolute -top-1.5 -right-1.5 size-4 bg-slate-700 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/cimg:opacity-100 transition-opacity shadow-xs cursor-pointer z-30 no-print"
        title="移除此图片"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
      >
        <X className="size-2.5 stroke-[3]" />
      </button>

      {/* 右下角尺寸调节把手 */}
      <div
        className="absolute -bottom-1.5 -right-1.5 size-4 bg-white border border-slate-300 rounded-sm flex items-center justify-center opacity-0 group-hover/cimg:opacity-100 transition-opacity cursor-se-resize z-30 no-print"
        title="拖拽调整大小"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startW = item.width;
          const startH = item.height;
          const onMove = (ev: PointerEvent) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            const newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, startW + dx));
            const newH = Math.max(MIN_SIZE, Math.min(MAX_SIZE, startH + dy));
            updateItem(item.id, { width: newW, height: newH });
          };
          const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }}
      >
        <GripHorizontal className="size-2.5 text-slate-400 rotate-45" />
      </div>
    </div>
  );
};

export const CanvasImageLayer: React.FC = () => {
  const { items } = useCanvasImagesStore();

  if (items.length === 0) return null;

  return (
    <>
      {items.map((item) => (
        <DraggableImage key={item.id} item={item} />
      ))}
    </>
  );
};
