# 📝 一纸简历 (YizhiCV)

> 现代极简、高自由度的 AI-Native 一页纸简历编辑器与求职副驾。  
> 经典 v1.x 版本完整代码已归档至 [`v1-legacy`](https://github.com/WhiteP1ay/yizhicv/tree/v1-legacy) 分支与 [`v1.0.0`](https://github.com/WhiteP1ay/yizhicv/releases/tag/v1.0.0) Release 标签。

---

## 核心设计与实现思路

本项目旨在解决传统简历工具“格式死板”、“排版溢出难调”以及“空白画布创作焦虑”的核心痛点，基于现代化 Web 与 AI 智能体技术构建：

1. **双轨画布架构 (Artifacts Mode)**
   - **左侧 AI 访谈助手**：通过结构化对话挖掘用户经历，基于 STAR 原则提炼高量化成果与技术亮点；
   - **右侧 A4 实时画布**：所见即所得实时渲染，全量拥抱 Tiptap 富文本内联输入，像在 Notion 一样点击即编辑。

2. **极致纯粹的「无类型 Section 积木流」**
   - **彻底消灭数据冗余**：彻底干掉 `type`、`title`、`showHeader` 等外挂字段，标题与正文完全内联于富文本 HTML 中；
   - **系统开箱预设（Presets）**：内置名片、工作经历、项目经历、技能矩阵等开箱即用的 HTML 模板，用户一键插入后可随心所欲微调；
   - **极致自由度**：个人信息模块可自由拖入 `sidebar` 侧栏或 `main` 主栏，在匿名简历评审或特定作品集场景下亦可直接隐藏或删除。

3. **双槽位自适应布局 (Unified Slot Grid)**
   - 画布底层统一采用 `main` 与 `sidebar` 双槽位网格；
   - **侧栏宽度支持拖拽微调**：`sidebarWidth === 0` 即为极简单栏上下流，`sidebarWidth > 0` 即为黄金比例双栏网格，无需冗余维护 `mode` 字段；
   - **纸张规格锁死工业级 A4 (210mm × 297mm)**：摒弃无用纸张下拉配置，保障打印与导出绝对一致。

4. **语义化 DOM 与稳定 Style Hooks**
   - 摒弃无序嵌套的 Div 结构，输出扁平语义化标签（`<section>`、`<article>`、`<time>`）；
   - 暴露稳定、层级浅的样式钩子（如 `.cv-section`、`.cv-entry`），由全局 CSS 变量驱动；
   - 既保证开箱即用的高审美排版，又赋予高级用户通过全局 CSS 窗口进行像素级定制的自由，确保打印与机筛稳定性。

5. **本地优先与 BYOK (Bring Your Own Key)**
   - **数据安全**：核心简历数据保存在本地浏览器中，不强制登录，零隐私泄露风险；
   - **自备算力**：支持用户自填 DeepSeek / OpenAI 等大模型 API Key 免费调用 AI 润色能力，零门槛开箱即用。

6. **局部内容敏感脱敏 (Redaction / Blur)**
   - 支持选中文本一键标记为脱敏内容；
   - 在公开发享或社交平台展示时自动应用高阶磨砂模糊遮盖，免去手动截图打码的繁琐流程。

---

## 核心数据结构规范 (Data Schema Specification)

简历采用高度统一、扁平且类型安全的 TypeScript / JSON 领域模型，消灭了所有冗余状态分支：

### 1. TypeScript 接口定义

```typescript
/** 通用 Section 积木块（无冗余字段，内容完全由 Tiptap 富文本内联驱动） */
export interface ResumeSection {
  id: string; // 唯一标识 (nanoid)
  slot: "main" | "sidebar"; // 物理槽位：主栏 或 侧栏
  visible: boolean; // 可见性开关
  content: string; // Tiptap 富文本 HTML (标题、正文全部包含其中)
}

/** 双槽位自适应布局配置 (Unified Slot Grid) */
export interface ResumeLayout {
  sidebarWidth: number; // 侧栏宽度 (px，0 = 纯单栏上下流；>0 = 双栏网格，默认 260px)
}

/** 工作台偏好设置 (Workspace Settings) */
export interface ResumeSetting {
  rightPanelWidth: number; // 右侧面板展开宽度 (px, 默认 336px)
  isRightPanelCollapsed: boolean; // 右侧面板是否折叠 (默认 false)
  previewScale: number; // 画布缩放比例 (默认 0.88)
  isBlurMode: boolean; // 是否开启全局脱敏预览 (默认 false)
  isJsonEditorEnabled: boolean; // 是否开启 JSON 源码编辑模式 (默认 false)
}

/** 设计规范与排版弹性 Tokens */
export interface ResumeDesign {
  themeColor: string; // 主题强调色 (Hex)
  fontFamily: "sans" | "serif" | "mono";
  fontSize: number; // 基准字号 (pt，默认 10.5pt，9~12pt 弹性伸缩)
  lineHeight: number; // 基准行高 (默认 1.45，1.2~1.8 弹性伸缩)
  sectionGap: number; // 模块垂直间距 (px，默认 16px)
  pagePadding: number; // A4 画布内边距 (mm，默认 16mm)
  customCss: string; // 高级用户自定义 CSS 覆写代码
}

/** 顶层完整简历文档（极致扁平的积木流模型） */
export interface YizhiResume {
  version: "2.0.0";
  metadata: {
    id: string;
    title: string; // 简历文档名称，如 "前端专家简历"
    createdAt: string;
    updatedAt: string;
    language: "zh" | "en";
  };
  layout: ResumeLayout;
  setting: ResumeSetting; // 工作台与编辑器设置项
  sections: ResumeSection[]; // 所有的内容积木，统一编排与排序
  design: ResumeDesign;
}
```

### 2. 标准 JSON 载荷示例

```json
{
  "version": "2.0.0",
  "metadata": {
    "id": "cv_20261110_01",
    "title": "求职简历",
    "createdAt": "2026-11-10T09:00:00.000Z",
    "updatedAt": "2026-11-10T09:00:00.000Z",
    "language": "zh"
  },
  "layout": {
    "sidebarWidth": 260
  },
  "setting": {
    "rightPanelWidth": 336,
    "isRightPanelCollapsed": false,
    "previewScale": 0.88,
    "isBlurMode": false,
    "isJsonEditorEnabled": false
  },
  "sections": [
    {
      "id": "sec_profile",
      "slot": "main",
      "visible": true,
      "content": "<div class=\"cv-profile-card text-center pb-2\"><h1 class=\"text-3xl font-bold tracking-tight text-slate-900\">求职者</h1><p class=\"text-base font-medium text-slate-600 mt-1\">资深前端全栈工程师</p><div class=\"cv-contacts-wrap flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-600\"><span>📱 138-0000-0000</span><span>✉️ <a href=\"mailto:me@example.com\">me@example.com</a></span><span>📍 北京</span><span>🌐 <a href=\"https://github.com\" target=\"_blank\">github.com</a></span></div></div>"
    },
    {
      "id": "sec_experience",
      "slot": "main",
      "visible": true,
      "content": "<div class=\"cv-section-block mb-4\"><h2 class=\"text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3\">工作经历</h2><div class=\"cv-entry mb-4\"><div class=\"flex justify-between items-baseline font-semibold text-slate-900\"><span class=\"text-base\">高级全栈工程师 · 某知名互联网科技公司</span><span class=\"text-sm font-normal text-slate-500\">2023.03 - 至今</span></div><div class=\"text-sm text-slate-500 mb-1\">北京 · 核心平台研发部</div><ul class=\"list-disc list-outside pl-4 space-y-1 text-sm text-slate-700\"><li>主导核心业务系统重构，全面采用 Next.js App Router 与 Tailwind CSS 体系，提升首屏加载性能 45%。</li><li>设计并落地微前端与无头组件库方案，支撑公司 10+ 业务线独立交付。</li></ul></div></div>"
    }
  ],
  "design": {
    "themeColor": "#0f172a",
    "fontFamily": "sans",
    "fontSize": 10.5,
    "lineHeight": 1.45,
    "sectionGap": 16,
    "pagePadding": 16,
    "customCss": ""
  }
}
```

---

## 为什么手写一个工具而不是xxx？

这是该项目被问到最多的问题。

**Q：为什么不是 office 的简历模板？**  
A：因为 office 调整格式太繁琐，找模板也费精力。

**Q：为什么不是 wps 的简历助手？**  
A：因为收费。

**Q：为什么不是 xx 直聘等招聘网站？**  
A：因为它们自由度不够，通常会要求某些字段必填，或者对某些模块固定格式。  
比如学历，假如一个人学历一般，可能只想放到基本信息里，学历漂亮会更倾向于拿出来单独一块展示。  
再比如工作经历，有的人希望具体介绍每份工作的工作内容，有的人希望只提及一下公司名就一笔带过。

**Q：为什么不是别的 xx 简历制作工具？**  
A：注册登录、看广告、有收费功能、收集个人信息、样式过于花哨、自由度不足、操作繁琐等等至少占一条。

---

## 技术栈

- **核心框架**：[Next.js](https://nextjs.org/) (App Router, Turbopack) + [React 19](https://react.dev/)
- **语言与类型**：[TypeScript](https://www.typescriptlang.org/) + [Zod](https://zod.dev/) (运行时类型校验与 Schema 推导)
- **样式系统**：[Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix / Base UI)
- **状态管理**：[Zustand](https://github.com/pmndrs/zustand) (轻量响应式与 LocalStorage 持久化)
- **富文本引擎**：[Tiptap 全家桶](https://tiptap.dev/) (`@tiptap/react`, `@tiptap/pm`, StarterKit, 链接/下划线/颜色/脱敏扩展)
- **拖拽编排**：[@dnd-kit](https://dndkit.com/) (`@dnd-kit/core`, `@dnd-kit/sortable`, 现代化 React 19 弹性拖拽排序)
- **代码编辑器**：[CodeMirror 6](https://codemirror.net/) (`@uiw/react-codemirror` + `@codemirror/lang-css`, 轻量无 WebWorker 负担)
- **图标系统**：[Lucide React](https://lucide.dev/) + [@icons-pack/react-simple-icons](https://simpleicons.org/) (技术品牌与社交全量 SVG 图标)
- **图片裁剪**：[react-image-crop](https://github.com/DominicTobias/react-image-crop) (轻量无头头像裁剪器)
- **通知与工具**：[Sonner](https://sonner.emilkowal.ski/) (现代化 Toast 通知) + [nanoid](https://github.com/ai/nanoid) (紧凑安全唯一 ID)
- **代码质量**：[Biome](https://biomejs.dev/) (极速格式化与代码规范检查)
- **包管理器**：[pnpm](https://pnpm.io/)

---

## 快速开始

### 1. 环境要求

- Node.js >= 18.18.0
- pnpm >= 9.0.0

### 2. 本地运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 代码质量检查与格式化
pnpm lint
pnpm format

# 构建生产产物
pnpm build
```

---

## 开源协议

本项目采用 [MIT](LICENSE) 协议开源。
