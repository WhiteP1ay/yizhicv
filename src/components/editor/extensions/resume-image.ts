import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageNodeView } from "@/components/editor/node-views/image-node-view";

export interface ImageAttributes {
  src: string;
  alt?: string;
  title?: string;
  width?: number | string | null;
  alignment?: "left" | "center" | "right";
  displayMode?: "block" | "inline";
}

/**
 * 块级图片扩展 (Block Image)
 * 独占一行，支持居中/居左/居右对齐及宽度自定义，适合个人头像、证件照、项目截图等
 */
export const ResumeBlockImage = Image.extend({
  name: "image",
  group: "block",
  inline: false,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: "",
      },
      title: {
        default: "",
      },
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute("width") || el.style.width || null,
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      alignment: {
        default: "center",
        parseHTML: (el) => el.getAttribute("data-alignment") || "center",
        renderHTML: (attrs) => ({
          "data-alignment": attrs.alignment || "center",
        }),
      },
      displayMode: {
        default: "block",
        parseHTML: (el) => el.getAttribute("data-display") || "block",
        renderHTML: () => ({ "data-display": "block" }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-display="block"]',
      },
      {
        tag: "img:not([data-display='inline'])",
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  renderHTML({ HTMLAttributes }) {
    const alignment = HTMLAttributes["data-alignment"] || "center";
    const width = HTMLAttributes.width;

    let marginStyle = "margin: 0.5rem auto;";
    if (alignment === "left") {
      marginStyle = "margin: 0.5rem auto 0.5rem 0;";
    } else if (alignment === "right") {
      marginStyle = "margin: 0.5rem 0 0.5rem auto;";
    }

    const widthStyle = width
      ? `width: ${typeof width === "number" ? `${width}px` : width};`
      : "";
    const style = `display: block; max-width: 100%; height: auto; ${marginStyle} ${widthStyle}`;

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-display": "block",
        class:
          "cv-image-block rounded-xs cursor-pointer transition-shadow hover:ring-2 hover:ring-blue-400/50",
        style,
      }),
    ];
  },
}).configure({
  inline: false,
  allowBase64: true,
});

/**
 * 行内图片扩展 (Inline Image)
 * 嵌入文字行内，与段落或列表并排混排，适合小徽章、图标、签名、单字插图等
 */
export const ResumeInlineImage = Image.extend({
  name: "inlineImage",
  group: "inline",
  inline: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: "",
      },
      title: {
        default: "",
      },
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute("width") || el.style.width || null,
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      displayMode: {
        default: "inline",
        parseHTML: (el) => el.getAttribute("data-display") || "inline",
        renderHTML: () => ({ "data-display": "inline" }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-display="inline"]',
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  renderHTML({ HTMLAttributes }) {
    const width = HTMLAttributes.width;
    const widthStyle = width
      ? `width: ${typeof width === "number" ? `${width}px` : width};`
      : "";
    const style = `display: inline-block; vertical-align: middle; max-width: 100%; height: auto; margin: 0 2px; ${widthStyle}`;

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-display": "inline",
        class:
          "cv-image-inline rounded-xs cursor-pointer align-middle transition-shadow hover:ring-2 hover:ring-blue-400/50",
        style,
      }),
    ];
  },
}).configure({
  inline: true,
  allowBase64: true,
});
