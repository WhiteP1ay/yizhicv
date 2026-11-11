import { Mark, mergeAttributes } from "@tiptap/core";

export const BlurMark = Mark.create({
  name: "blur",
  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-blur]",
        priority: 1000,
      },
      {
        tag: "mark[data-blur]",
        priority: 1000,
      },
      {
        tag: ".cv-blur-mark",
        priority: 1000,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-blur": "true",
        class: "cv-blur-mark",
      }),
      0,
    ];
  },
});
