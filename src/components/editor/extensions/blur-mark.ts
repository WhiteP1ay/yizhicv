import { Mark, mergeAttributes } from "@tiptap/core";

export const BlurMark = Mark.create({
  name: "blur",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "mark[data-blur]",
      },
      {
        tag: "span[data-blur]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-blur": "true",
        class: "cv-blur-mark",
      }),
      0,
    ];
  },
});
