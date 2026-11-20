"use client";

import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";

const plugins = { code };

export function AssistantMarkdown({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  return (
    <Streamdown
      className="ai-markdown max-w-none min-w-0 text-xs leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
      codeBlockMaxHeight={240}
      controls={{ code: { copy: true, download: false } }}
      isAnimating={streaming}
      lineNumbers
      mode={streaming ? "streaming" : "static"}
      parseIncompleteMarkdown={streaming}
      plugins={plugins}
    >
      {text}
    </Streamdown>
  );
}
