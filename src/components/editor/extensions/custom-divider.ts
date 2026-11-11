import { mergeAttributes } from "@tiptap/core";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DividerNodeView } from "@/components/editor/node-views/divider-node-view";

export interface CustomDividerOptions {
  HTMLAttributes: Record<string, unknown>;
  nextNodeType: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customDivider: {
      /**
       * 插入带自定义高度（粗细）与颜色的水平分割线
       */
      setCustomDivider: (attrs?: {
        height?: number;
        color?: string;
      }) => ReturnType;
    };
  }
}

/**
 * 支持高度（粗细）与颜色自定义、可视化选中与二次编辑的简历水平分割线扩展
 */
export const CustomDivider = HorizontalRule.extend<CustomDividerOptions>({
  name: "horizontalRule",

  selectable: true,
  draggable: true,
  atom: true,

  addNodeView() {
    return ReactNodeViewRenderer(DividerNodeView);
  },

  addAttributes() {
    return {
      color: {
        default: "#e2e8f0",
        parseHTML: (element) =>
          element.getAttribute("data-color") ||
          element.style.borderTopColor ||
          element.style.borderColor ||
          "#e2e8f0",
        renderHTML: (attributes) => ({
          "data-color": attributes.color || "#e2e8f0",
        }),
      },
      height: {
        default: 1,
        parseHTML: (element) => {
          const attr = element.getAttribute("data-height");
          if (attr) return Number.parseInt(attr, 10) || 1;
          const styleW = element.style.borderTopWidth || element.style.height;
          return styleW ? Number.parseInt(styleW, 10) || 1 : 1;
        },
        renderHTML: (attributes) => ({
          "data-height": attributes.height || 1,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const height = HTMLAttributes["data-height"] ?? HTMLAttributes.height ?? 1;
    const color =
      HTMLAttributes["data-color"] ?? HTMLAttributes.color ?? "#e2e8f0";

    return [
      "hr",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-height": height,
        "data-color": color,
        style: `border: none !important; border-top: ${height}px solid ${color} !important; margin: 0.6em 0 !important;`,
      }),
    ];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setCustomDivider:
        (attrs) =>
        ({ chain, state, tr, dispatch }) => {
          const height = attrs?.height ?? 1;
          const color = attrs?.color ?? "#e2e8f0";

          // 若当前选区正处于已有分割线上，直接热更新其属性
          const selection = state.selection as {
            node?: { type: { name: string }; attrs: Record<string, unknown> };
            from: number;
          };
          if (selection.node && selection.node.type.name === this.name) {
            if (dispatch) {
              tr.setNodeMarkup(selection.from, undefined, {
                ...selection.node.attrs,
                height,
                color,
              });
            }
            return true;
          }

          return chain()
            .insertContent({
              type: this.name,
              attrs: { height, color },
            })
            .run();
        },
    };
  },
});
