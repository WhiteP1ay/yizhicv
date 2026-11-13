import { Extension } from "@tiptap/core";

export type BlockTextAlign = "left" | "center" | "right";

const ALIGNABLE = ["paragraph", "heading"] as const;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textAlign: {
      /** 把当前段落或标题设为居左、居中或居右。 */
      setTextAlign: (alignment: BlockTextAlign) => ReturnType;
    };
  }
}

function readAlign(value: string | null): BlockTextAlign | null {
  if (value === "center" || value === "right" || value === "left") return value;
  return null;
}

/**
 * 段落和标题的水平对齐。居左不写进样式，避免正文里堆满默认值。
 */
export const TextAlign = Extension.create({
  name: "textAlign",

  addGlobalAttributes() {
    return [
      {
        types: [...ALIGNABLE],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) => readAlign(element.style.textAlign),
            renderHTML: (attributes) => {
              const align = readAlign(attributes.textAlign);
              if (!align || align === "left") return {};
              return { style: `text-align: ${align}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        (alignment) =>
        ({ editor, commands }) => {
          const type = editor.isActive("heading")
            ? "heading"
            : editor.isActive("paragraph")
              ? "paragraph"
              : null;
          if (!type) return false;
          return commands.updateAttributes(type, { textAlign: alignment });
        },
    };
  },
});
