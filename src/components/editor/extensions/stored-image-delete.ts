import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { toast } from "sonner";
import { releaseStoredImages } from "@/lib/release-stored-image";
import { useActiveEditorStore } from "@/store/active-editor";

const bypassMeta = "storedImageBypass";

function storedSrcCounts(doc: ProseMirrorNode) {
  const counts = new Map<string, number>();
  doc.descendants((node) => {
    if (node.attrs?.stored !== true) return;
    const src = node.attrs.src;
    if (typeof src !== "string" || !src) return;
    counts.set(src, (counts.get(src) ?? 0) + 1);
  });
  return counts;
}

function copiesInOtherEditors(src: string, currentDoc: ProseMirrorNode) {
  let total = 0;
  for (const editor of Object.values(useActiveEditorStore.getState().editors)) {
    if (editor.isDestroyed) continue;
    let doc: ProseMirrorNode;
    try {
      doc = editor.state.doc;
    } catch {
      continue;
    }
    if (doc === currentDoc) continue;
    total += storedSrcCounts(doc).get(src) ?? 0;
  }
  return total;
}

function lastStoredSrcsRemoved(
  before: ProseMirrorNode,
  after: ProseMirrorNode,
) {
  const previous = storedSrcCounts(before);
  const next = storedSrcCounts(after);
  const removed: string[] = [];
  for (const [src, count] of previous) {
    if (count <= 0 || (next.get(src) ?? 0) > 0) continue;
    if (copiesInOtherEditors(src, before) > 0) continue;
    removed.push(src);
  }
  return removed;
}

export const StoredImageDelete = Extension.create({
  name: "storedImageDelete",
  addProseMirrorPlugins() {
    let pending = false;
    let editorView: EditorView | null = null;

    return [
      new Plugin({
        key: new PluginKey("storedImageDelete"),
        view(nextView) {
          editorView = nextView;
          return {
            destroy() {
              editorView = null;
            },
          };
        },
        filterTransaction(tr, state) {
          if (!tr.docChanged || tr.getMeta(bypassMeta)) return true;
          const removed = lastStoredSrcsRemoved(state.doc, tr.doc);
          if (removed.length === 0) return true;
          if (tr.getMeta("preventUpdate")) {
            void releaseStoredImages(removed);
            return true;
          }
          if (pending) return false;

          const steps = [...tr.steps];
          const message =
            removed.length > 1
              ? "删除后，撤回时这些图片可能无法显示。确定删除吗？"
              : "删除后，撤回时这张图片可能无法显示。确定删除吗？";
          pending = true;
          window.setTimeout(() => {
            if (!window.confirm(message)) {
              pending = false;
              return;
            }
            void (async () => {
              try {
                const released = await releaseStoredImages(removed);
                const view = editorView;
                if (!released) {
                  toast.error("图片没有从存储里删掉，已留在文档里");
                  return;
                }
                if (!view) return;
                const replay = view.state.tr.setMeta(bypassMeta, true);
                for (const step of steps) {
                  if (replay.maybeStep(step).failed) {
                    toast.error("文档已经变了，请再删一次");
                    return;
                  }
                }
                view.dispatch(replay);
              } finally {
                pending = false;
              }
            })();
          }, 0);
          return false;
        },
      }),
    ];
  },
});
