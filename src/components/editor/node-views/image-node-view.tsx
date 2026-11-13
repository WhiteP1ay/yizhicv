"use client";

import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const MIN_IMAGE_WIDTH = 32;

function widthStyleOf(width: unknown, live: number | null): string | null {
  if (live != null) return `${live}px`;
  if (typeof width === "number" && Number.isFinite(width) && width > 0) {
    return `${width}px`;
  }
  if (typeof width === "string" && width.trim()) {
    if (width.endsWith("%") || width.endsWith("px")) return width;
    const parsed = Number(width);
    if (Number.isFinite(parsed) && parsed > 0) return `${parsed}px`;
  }
  return null;
}

export const ImageNodeView: React.FC<NodeViewProps> = ({
  node,
  selected,
  editor,
  updateAttributes,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const draggingRef = useRef(false);
  const liveWidthRef = useRef<number | null>(null);
  const startRef = useRef({ x: 0, width: 0, scale: 1 });
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const [focused, setFocused] = useState(editor.isFocused);

  const isBlock = node.type.name === "image";
  const alignment =
    node.attrs.alignment === "left" || node.attrs.alignment === "right"
      ? node.attrs.alignment
      : "center";
  const explicitWidth = widthStyleOf(node.attrs.width, liveWidth);

  useEffect(() => {
    const syncFocus = () => setFocused(editor.isFocused);
    editor.on("focus", syncFocus);
    editor.on("blur", syncFocus);
    return () => {
      editor.off("focus", syncFocus);
      editor.off("blur", syncFocus);
    };
  }, [editor]);

  useEffect(() => {
    if (draggingRef.current) return;
    if (node.attrs.width == null && liveWidthRef.current == null) return;
    setLiveWidth(null);
    liveWidthRef.current = null;
  }, [node.attrs.width]);

  const showHandle = (selected && focused) || liveWidth != null;

  const commit = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const next = liveWidthRef.current;
    const current =
      typeof node.attrs.width === "number" ? node.attrs.width : null;
    if (next != null && next !== current) {
      updateAttributes({ width: next });
      return;
    }
    setLiveWidth(null);
    liveWidthRef.current = null;
  };

  return (
    <NodeViewWrapper
      as={isBlock ? "div" : "span"}
      className={`cv-image-frame ${isBlock ? "is-block" : "is-inline"}${showHandle ? " is-selected" : ""}`}
      data-align={isBlock ? alignment : undefined}
      style={explicitWidth ? { width: explicitWidth } : undefined}
    >
      {/* biome-ignore lint/performance/noImgElement: editor image node, width is measured from the element */}
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        title={node.attrs.title || undefined}
        draggable={false}
        className={
          isBlock ? "cv-image-block cv-image-el" : "cv-image-inline cv-image-el"
        }
        style={{ width: explicitWidth ? "100%" : "auto" }}
      />
      {showHandle && (
        <span
          className="cv-image-resize-handle no-print"
          contentEditable={false}
          title="拖拽调整图片宽度"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const img = imgRef.current;
            if (!img) return;
            const layoutWidth = img.offsetWidth;
            const rect = img.getBoundingClientRect();
            const scale = layoutWidth > 0 ? rect.width / layoutWidth : 1;
            draggingRef.current = true;
            startRef.current = {
              x: event.clientX,
              width: layoutWidth,
              scale,
            };
            liveWidthRef.current = layoutWidth;
            setLiveWidth(layoutWidth);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!draggingRef.current) return;
            const img = imgRef.current;
            const box = img?.closest("td, .ProseMirror");
            const max =
              box instanceof HTMLElement && box.clientWidth > 0
                ? box.clientWidth
                : 2000;
            const { x, width, scale } = startRef.current;
            const next = Math.round(
              Math.min(
                max,
                Math.max(MIN_IMAGE_WIDTH, width + (event.clientX - x) / scale),
              ),
            );
            liveWidthRef.current = next;
            setLiveWidth(next);
          }}
          onPointerUp={commit}
          onPointerCancel={commit}
          onLostPointerCapture={commit}
        >
          {liveWidth != null && (
            <span className="cv-image-resize-label">{liveWidth}px</span>
          )}
        </span>
      )}
    </NodeViewWrapper>
  );
};
