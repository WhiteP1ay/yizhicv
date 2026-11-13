import { mergeAttributes } from "@tiptap/core";
import { Table } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  clampSideLayoutLeft,
  SIDE_LAYOUT_DEFAULT,
} from "@/components/editor/extensions/side-layout-shared";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    sideLayout: {
      /**
       * 插入一行两格的左右布局。光标已经在一组里面时，插到这一组后面。
       */
      insertSideLayout: () => ReturnType;
    };
  }
}

type SideResizeState = { tablePos: number; left: number } | null;

const sideResizeKey = new PluginKey<SideResizeState>("sideLayoutResize");

const HANDLE_PX = 8;

type Dragging = { tablePos: number };

const drags = new WeakMap<EditorView, Dragging>();

function sideTableShapeOk(node: ProseMirrorNode): boolean {
  if (node.isText || node.attrs.layout !== "side") return true;
  if (node.childCount !== 1) return false;
  const row = node.firstChild;
  if (!row || row.childCount !== 2) return false;
  for (let index = 0; index < row.childCount; index += 1) {
    const cell = row.child(index);
    if (cell.attrs.colspan !== 1 || cell.attrs.rowspan !== 1) return false;
  }
  return true;
}

function focusFirstCell(tr: Transaction): void {
  const { $from } = tr.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.spec.tableRole !== "table") continue;
    const target = Math.min($from.start(depth) + 3, tr.doc.content.size);
    const $target = tr.doc.resolve(target);
    const selection = $target.parent.isTextblock
      ? TextSelection.create(tr.doc, target)
      : TextSelection.near($target, 1);
    tr.setSelection(selection);
    return;
  }
}

function sideTableFromDOM(
  view: EditorView,
  event: Event,
): { pos: number; dom: HTMLTableElement; left: number } | null {
  if (!(event.target instanceof Element)) return null;
  const dom = event.target.closest("table.cv-side-layout");
  if (!(dom instanceof HTMLTableElement)) return null;
  let found: number;
  try {
    found = view.posAtDOM(dom, 0);
  } catch {
    return null;
  }
  const $pos = view.state.doc.resolve(found);
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.attrs.layout !== "side") continue;
    const pos = $pos.before(depth);
    const drag = sideResizeKey.getState(view.state);
    const left =
      drag && drag.tablePos === pos
        ? drag.left
        : clampSideLayoutLeft(node.attrs.left);
    return { pos, dom, left };
  }
  return null;
}

function nearBoundary(
  hit: { dom: HTMLTableElement; left: number },
  event: PointerEvent | MouseEvent,
): boolean {
  const rect = hit.dom.getBoundingClientRect();
  if (rect.width <= 0) return false;
  const boundary = rect.left + (rect.width * hit.left) / 100;
  return Math.abs(event.clientX - boundary) <= HANDLE_PX;
}

function percentFromEvent(dom: HTMLElement, event: PointerEvent): number {
  const rect = dom.getBoundingClientRect();
  if (rect.width <= 0) return SIDE_LAYOUT_DEFAULT;
  return clampSideLayoutLeft(((event.clientX - rect.left) / rect.width) * 100);
}

function finishDrag(view: EditorView): void {
  const drag = drags.get(view);
  if (!drag) return;
  drags.delete(view);
  view.dom.classList.remove("cv-side-resize");
  const live = sideResizeKey.getState(view.state);
  const node = view.state.doc.nodeAt(drag.tablePos);
  const tr = view.state.tr;
  if (node && live && live.left !== clampSideLayoutLeft(node.attrs.left)) {
    tr.setNodeMarkup(drag.tablePos, undefined, {
      ...node.attrs,
      left: live.left,
    });
  }
  tr.setMeta(sideResizeKey, null);
  view.dispatch(tr);
}

function sideLayoutPlugins() {
  let listening = false;
  let boundView: EditorView | null = null;

  const onMove = (event: PointerEvent) => {
    if (!boundView) return;
    const drag = drags.get(boundView);
    if (!drag) return;
    const dom = boundView.nodeDOM(drag.tablePos);
    if (!(dom instanceof HTMLElement)) return;
    const left = percentFromEvent(dom, event);
    boundView.dom.classList.add("cv-side-resize");
    boundView.dispatch(
      boundView.state.tr.setMeta(sideResizeKey, {
        tablePos: drag.tablePos,
        left,
      }),
    );
  };

  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    listening = false;
    if (boundView) finishDrag(boundView);
  };

  return [
    new Plugin({
      filterTransaction(tr) {
        if (!tr.docChanged) return true;
        let allowed = true;
        tr.doc.descendants((node) => {
          if (!allowed) return false;
          if (!sideTableShapeOk(node)) allowed = false;
        });
        return allowed;
      },
    }),
    new Plugin<SideResizeState>({
      key: sideResizeKey,
      state: {
        init: (): SideResizeState => null,
        apply(tr, value): SideResizeState {
          const meta = tr.getMeta(sideResizeKey) as SideResizeState | undefined;
          if (meta !== undefined) return meta;
          if (!value || !tr.docChanged) return value;
          return { ...value, tablePos: tr.mapping.map(value.tablePos) };
        },
      },
      props: {
        decorations(state) {
          const drag = sideResizeKey.getState(state);
          const { selection } = state;
          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.isText || node.attrs.layout !== "side") return;
            const end = pos + node.nodeSize;
            const inside = selection.from > pos && selection.to < end;
            const dragging = drag?.tablePos === pos;
            if (!inside && !dragging) return;
            const attrs: Record<string, string> = {};
            const classes = [
              inside ? "is-focused" : "",
              dragging ? "is-dragging" : "",
            ].filter(Boolean);
            if (classes.length > 0) attrs.class = classes.join(" ");
            if (dragging && drag) attrs.style = `--cv-side-left: ${drag.left};`;
            decorations.push(Decoration.node(pos, end, attrs));
          });
          return DecorationSet.create(state.doc, decorations);
        },
        handleDOMEvents: {
          pointerdown(view, event) {
            if (event.button !== 0) return false;
            const hit = sideTableFromDOM(view, event);
            if (!hit || !nearBoundary(hit, event)) return false;
            event.preventDefault();
            event.stopPropagation();
            drags.set(view, { tablePos: hit.pos });
            boundView = view;
            view.dom.classList.add("cv-side-resize");
            view.dispatch(
              view.state.tr.setMeta(sideResizeKey, {
                tablePos: hit.pos,
                left: percentFromEvent(hit.dom, event),
              }),
            );
            if (!listening) {
              listening = true;
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }
            return true;
          },
          pointermove(view, event) {
            if (drags.has(view)) return true;
            const hit = sideTableFromDOM(view, event);
            view.dom.classList.toggle(
              "cv-side-resize",
              Boolean(hit && nearBoundary(hit, event)),
            );
            return false;
          },
          pointerleave(view) {
            if (!drags.has(view)) view.dom.classList.remove("cv-side-resize");
            return false;
          },
        },
      },
      view() {
        return {
          destroy() {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            listening = false;
          },
        };
      },
    }),
  ];
}

const sideLayoutJson = {
  type: "table",
  attrs: { layout: "side", left: SIDE_LAYOUT_DEFAULT },
  content: [
    {
      type: "tableRow",
      content: [
        { type: "tableCell", content: [{ type: "paragraph" }] },
        { type: "tableCell", content: [{ type: "paragraph" }] },
      ],
    },
  ],
};

/**
 * 左右布局。用表格的一行两格装内容，宽度记成左格百分比。
 * 不使用官方按像素记的列宽，避免画布缩放后拖拽对不齐。
 */
export const ResumeTable = Table.extend({
  addOptions() {
    const parent = this.parent?.() ?? {
      HTMLAttributes: {},
      resizable: false,
      renderWrapper: false,
      handleWidth: 5,
      cellMinWidth: 25,
      View: null,
      lastColumnResizable: true,
      allowTableNodeSelection: false,
    };
    return {
      ...parent,
      resizable: false,
      View: null,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      layout: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-layout"),
        renderHTML: (attributes) =>
          attributes.layout ? { "data-layout": attributes.layout } : {},
      },
      left: {
        default: SIDE_LAYOUT_DEFAULT,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-left");
          if (raw == null || raw === "") return SIDE_LAYOUT_DEFAULT;
          return clampSideLayoutLeft(raw);
        },
        renderHTML: (attributes) =>
          attributes.layout === "side"
            ? { "data-left": clampSideLayoutLeft(attributes.left) }
            : {},
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const merged = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
    if (node.attrs.layout === "side") {
      const left = clampSideLayoutLeft(node.attrs.left);
      merged["data-layout"] = "side";
      merged["data-left"] = String(left);
      merged.class = `${merged.class ?? ""} cv-side-layout`.trim();
      merged.style = `--cv-side-left: ${left};`;
    }
    return ["table", merged, ["tbody", 0]];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      insertSideLayout:
        () =>
        ({ commands, tr }) => {
          const $from = tr.selection.$from;
          let position: number | { from: number; to: number } = $from.pos;

          for (let depth = $from.depth; depth > 0; depth -= 1) {
            const node = $from.node(depth);
            if (node.attrs.layout !== "side") continue;
            position = $from.after(depth);
            break;
          }

          if (position === $from.pos && $from.depth >= 1) {
            const top = $from.node(1);
            if (top.isTextblock && top.content.size === 0) {
              position = { from: $from.before(1), to: $from.after(1) };
            } else {
              position = $from.after(1);
            }
          }

          if (!commands.insertContentAt(position, sideLayoutJson)) return false;
          return commands.command(({ tr: nextTr }) => {
            focusFirstCell(nextTr);
            return true;
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Tab: () => {
        if (!this.editor.isActive("table")) return false;
        this.editor.commands.goToNextCell();
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [...(this.parent?.() ?? []), ...sideLayoutPlugins()];
  },
});
