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

type SideDrag = {
  tablePos: number;
  left: number;
  originLeft: number;
  originX: number;
  moved: boolean;
};

type SideChrome = {
  drag: SideDrag | null;
};

type SideChromeMeta =
  | { type: "drag"; drag: SideDrag | null }
  | { type: "clear" };

const sideChromeKey = new PluginKey<SideChrome>("sideLayoutChrome");

const EMPTY_CHROME: SideChrome = { drag: null };

const HANDLE_PX = 8;
const DRAG_THRESHOLD_PX = 3;

const SIDE_DELETE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';

const gestures = new WeakMap<EditorView, SideDrag>();

function mapSidePos(tr: Transaction, pos: number | null): number | null {
  if (pos == null) return null;
  const mapped = tr.mapping.map(pos);
  const node = tr.doc.nodeAt(mapped);
  if (!node || node.attrs.layout !== "side") return null;
  return mapped;
}

function createSideHandle(): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "cv-side-handle no-print";
  wrap.contentEditable = "false";

  const button = document.createElement("button");
  button.type = "button";
  button.tabIndex = -1;
  button.className = "cv-side-delete";
  button.title = "删除这组左右布局";
  button.setAttribute("aria-label", "删除这组左右布局");
  button.innerHTML = SIDE_DELETE_ICON;

  wrap.append(button);
  return wrap;
}

function sideFrameNodeView(node: ProseMirrorNode) {
  let current = node;
  const frame = document.createElement("div");
  frame.classList.add("cv-side-frame");
  const handle = createSideHandle();
  const table = document.createElement("table");
  table.className = "cv-side-layout";
  const tbody = document.createElement("tbody");
  table.append(tbody);
  frame.append(handle, table);

  const paint = (next: ProseMirrorNode) => {
    current = next;
    const left = clampSideLayoutLeft(next.attrs.left);
    frame.style.setProperty("--cv-side-left", String(left));
    table.setAttribute("data-layout", "side");
    table.setAttribute("data-left", String(left));
  };
  paint(node);

  return {
    dom: frame,
    contentDOM: tbody,
    update(next: ProseMirrorNode) {
      if (next.type !== current.type || next.attrs.layout !== "side") {
        return false;
      }
      paint(next);
      return true;
    },
    ignoreMutation(mutation: { type: string; target: Node }) {
      if (mutation.target === frame || mutation.target === table) {
        return mutation.type === "attributes";
      }
      return handle.contains(mutation.target);
    },
    stopEvent(event: Event) {
      return (
        event.target instanceof Element &&
        Boolean(event.target.closest(".cv-side-handle"))
      );
    },
  };
}

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

function sideTableElement(event: Event): HTMLTableElement | null {
  if (!(event.target instanceof Element)) return null;
  const direct = event.target.closest("table.cv-side-layout");
  if (direct instanceof HTMLTableElement) return direct;
  const nested = event.target
    .closest(".cv-side-frame")
    ?.querySelector("table.cv-side-layout");
  return nested instanceof HTMLTableElement ? nested : null;
}

function sideTableFromDOM(
  view: EditorView,
  event: Event,
): { pos: number; dom: HTMLTableElement; left: number } | null {
  const dom = sideTableElement(event);
  if (!dom) return null;
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
    const drag = sideChromeKey.getState(view.state)?.drag;
    const left =
      drag && drag.tablePos === pos
        ? drag.left
        : clampSideLayoutLeft(node.attrs.left);
    return { pos, dom, left };
  }
  return null;
}

function frameAt(view: EditorView, tablePos: number): HTMLElement | null {
  const dom = view.nodeDOM(tablePos);
  return dom instanceof HTMLElement ? dom : null;
}

function paintFrameLeft(view: EditorView, tablePos: number, left: number) {
  frameAt(view, tablePos)?.style.setProperty("--cv-side-left", String(left));
}

function restoreFrameLeft(view: EditorView, tablePos: number) {
  const node = view.state.doc.nodeAt(tablePos);
  if (!node) return;
  paintFrameLeft(view, tablePos, clampSideLayoutLeft(node.attrs.left));
}

function percentFromEvent(dom: HTMLElement, event: PointerEvent): number {
  const table = dom.matches("table")
    ? dom
    : dom.querySelector("table.cv-side-layout");
  const rect = (
    table instanceof HTMLElement ? table : dom
  ).getBoundingClientRect();
  if (rect.width <= 0) return SIDE_LAYOUT_DEFAULT;
  return clampSideLayoutLeft(((event.clientX - rect.left) / rect.width) * 100);
}

function dispatchChrome(view: EditorView, meta: SideChromeMeta): void {
  view.dispatch(view.state.tr.setMeta(sideChromeKey, meta));
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

function sideLayoutPlugins() {
  let listening = false;
  let boundView: EditorView | null = null;

  const stopListening = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    listening = false;
  };

  const onMove = (event: PointerEvent) => {
    if (!boundView) return;
    const gesture = gestures.get(boundView);
    if (!gesture) return;
    if (
      !gesture.moved &&
      Math.abs(event.clientX - gesture.originX) < DRAG_THRESHOLD_PX
    ) {
      return;
    }
    const dom = boundView.nodeDOM(gesture.tablePos);
    if (!(dom instanceof HTMLElement)) return;
    gesture.moved = true;
    gesture.left = percentFromEvent(dom, event);
    paintFrameLeft(boundView, gesture.tablePos, gesture.left);
    boundView.dom.classList.add("cv-side-resize");
    const drag = sideChromeKey.getState(boundView.state)?.drag;
    if (!drag || drag.tablePos !== gesture.tablePos) {
      dispatchChrome(boundView, { type: "drag", drag: { ...gesture } });
    }
  };

  const onUp = () => {
    stopListening();
    const view = boundView;
    if (!view) return;
    view.dom.classList.remove("cv-side-resize");
    const gesture = gestures.get(view);
    gestures.delete(view);
    if (!gesture?.moved) {
      if (gesture) restoreFrameLeft(view, gesture.tablePos);
      if (sideChromeKey.getState(view.state)?.drag) {
        dispatchChrome(view, { type: "drag", drag: null });
      }
      return;
    }
    const node = view.state.doc.nodeAt(gesture.tablePos);
    const tr = view.state.tr;
    if (node && gesture.left !== clampSideLayoutLeft(node.attrs.left)) {
      tr.setNodeMarkup(gesture.tablePos, undefined, {
        ...node.attrs,
        left: gesture.left,
      });
    }
    tr.setMeta(sideChromeKey, { type: "drag", drag: null });
    view.dispatch(tr);
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
    new Plugin<SideChrome>({
      key: sideChromeKey,
      state: {
        init: () => EMPTY_CHROME,
        apply(tr, value) {
          const meta = tr.getMeta(sideChromeKey) as SideChromeMeta | undefined;
          let next = value;
          if (meta?.type === "clear") next = EMPTY_CHROME;
          if (meta?.type === "drag") next = { ...next, drag: meta.drag };
          if (tr.docChanged) {
            const dragPos = next.drag
              ? mapSidePos(tr, next.drag.tablePos)
              : null;
            next = {
              drag:
                next.drag && dragPos != null
                  ? { ...next.drag, tablePos: dragPos }
                  : null,
            };
          }
          return next;
        },
      },
      props: {
        decorations(state) {
          const chrome = sideChromeKey.getState(state) ?? EMPTY_CHROME;
          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.isText || node.attrs.layout !== "side") return;
            const classes = [
              chrome.drag?.tablePos === pos ? "is-dragging" : "",
            ].filter(Boolean);
            if (classes.length === 0) return;
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: classes.join(" "),
              }),
            );
          });
          return DecorationSet.create(state.doc, decorations);
        },
        handleDOMEvents: {
          pointerdown(view, event) {
            if (event.button !== 0) return false;
            const target = event.target;
            if (!(target instanceof Element)) return false;
            if (target.closest(".cv-side-delete")) {
              event.preventDefault();
              const hit = sideTableFromDOM(view, event);
              if (!hit) return true;
              const node = view.state.doc.nodeAt(hit.pos);
              if (!node) return true;
              view.dispatch(
                view.state.tr.delete(hit.pos, hit.pos + node.nodeSize),
              );
              return true;
            }
            const hit = sideTableFromDOM(view, event);
            if (hit && nearBoundary(hit, event)) {
              event.preventDefault();
              event.stopPropagation();
              gestures.set(view, {
                tablePos: hit.pos,
                left: hit.left,
                originLeft: hit.left,
                originX: event.clientX,
                moved: false,
              });
              boundView = view;
              if (!listening) {
                listening = true;
                window.addEventListener("pointermove", onMove);
                window.addEventListener("pointerup", onUp);
              }
              return true;
            }
            return false;
          },
          pointermove(view, event) {
            if (gestures.has(view)) return true;
            const hit = sideTableFromDOM(view, event);
            view.dom.classList.toggle(
              "cv-side-resize",
              Boolean(hit && nearBoundary(hit, event)),
            );
            return false;
          },
          pointerleave(view) {
            if (gestures.has(view)) return false;
            view.dom.classList.remove("cv-side-resize");
            return false;
          },
          blur(view) {
            queueMicrotask(() => {
              if (view.isDestroyed || view.hasFocus()) return;
              const gesture = gestures.get(view);
              if (gesture) {
                gestures.delete(view);
                stopListening();
                view.dom.classList.remove("cv-side-resize");
                restoreFrameLeft(view, gesture.tablePos);
              }
              const chrome = sideChromeKey.getState(view.state);
              if (!chrome?.drag) return;
              restoreFrameLeft(view, chrome.drag.tablePos);
              dispatchChrome(view, { type: "clear" });
            });
            return false;
          },
        },
      },
      view() {
        return {
          destroy() {
            stopListening();
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
 * 拖中间的线改宽度。悬停时左侧直接出现删除。
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

  addNodeView() {
    return ({ node }) => sideFrameNodeView(node);
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
