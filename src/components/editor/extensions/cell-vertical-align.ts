import { TableCell } from "@tiptap/extension-table";

export type CellVerticalAlign = "top" | "middle" | "bottom";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    cellVerticalAlign: {
      /** 把当前左右布局格子里的内容贴上边、居中或贴下边。 */
      setCellVerticalAlign: (alignment: CellVerticalAlign) => ReturnType;
    };
  }
}

function readVerticalAlign(value: unknown): "middle" | "bottom" | null {
  if (value === "middle" || value === "bottom") return value;
  return null;
}

/**
 * 左右布局格子的垂直对齐。贴上边是默认，不写进样式。
 */
export const ResumeTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      verticalAlign: {
        default: null,
        parseHTML: (element) => readVerticalAlign(element.style.verticalAlign),
        renderHTML: (attributes) => {
          const align = readVerticalAlign(attributes.verticalAlign);
          if (!align) return {};
          return { style: `vertical-align: ${align}` };
        },
      },
    };
  },

  addCommands() {
    return {
      setCellVerticalAlign:
        (alignment) =>
        ({ commands, editor }) => {
          if (!editor.isActive("tableCell")) return false;
          return commands.setCellAttribute(
            "verticalAlign",
            alignment === "top" ? null : alignment,
          );
        },
    };
  },
});
