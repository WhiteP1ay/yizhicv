# yizhicv 开工约定

下面两段都要遵守：开工边界，以及原来的 Next.js 约定。原来的约定整段保留，不要删。

## 不要自己提交代码

当前这条消息没有明确要求提交时，不要执行 `git commit`、`git push`，也不要开 pull request。改完停在工作区，说明改了哪些文件，等用户决定要不要提交。

## 不要自己做 e2e

当前这条消息没有明确要求时，不要做端到端测试，也不要自己用浏览器把整条用户路径点一遍验收。这包括 Playwright、浏览器自动化，以及为了验收页面去走完整交互流程。

做完代码改动后：停在工作区，说明改了什么。不要接着提交，也不要接着跑浏览器验收。

## 原有 Next.js 约定

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
