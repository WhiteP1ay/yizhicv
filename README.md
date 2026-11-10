# 📝 一纸简历 (YizhiCV)

> 现代极简、高自由度的 AI-Native 一页纸简历编辑器与求职副驾。  
> 经典 v1.x 版本完整代码已归档至 [`v1-legacy`](https://github.com/WhiteP1ay/yizhicv/tree/v1-legacy) 分支与 [`v1.0.0`](https://github.com/WhiteP1ay/yizhicv/releases/tag/v1.0.0) Release 标签。

---

## 核心设计与实现思路

本项目旨在解决传统简历工具“格式死板”、“排版溢出难调”以及“空白画布创作焦虑”的核心痛点，基于现代化 Web 与 AI 智能体技术构建：

1. **双轨画布架构 (Artifacts Mode)**
   * **左侧 AI 访谈助手**：通过结构化对话挖掘用户经历，基于 STAR 原则提炼高量化成果与技术亮点；
   * **右侧 A4 实时画布**：所见即所得实时渲染，同时保留直接点击修改正文的能力，兼顾效率与精细控制。

2. **万物皆 Section 积木模型**
   * 内容块采用通用积木抽象，不预设死板的模块类型，用户可自由定义经历、作品、技能或自由文本；
   * 全面拥抱富文本表现力，支持行内高亮、关键词着色与链接插入。

3. **双槽位自适应布局 (Unified Slot Grid)**
   * 画布底层统一采用 `main` 与 `sidebar` 双槽位网格；
   * **侧栏宽度支持拖拽微调**，用户可根据文字体量自由分配左右留白；
   * **单栏布局为侧栏宽度归零时的自然折叠退化**，无需维护两套割裂的模板组件。

4. **语义化 DOM 与稳定 Style Hooks**
   * 摒弃无序嵌套的 Div 结构，输出扁平语义化标签（`<section>`、`<article>`、`<time>`）；
   * 暴露稳定、层级浅的样式钩子（如 `.cv-section`、`.cv-title`、`.cv-item`），由全局 CSS 变量驱动；
   * 既保证开箱即用的高审美排版，又赋予高级用户通过全局 CSS 窗口进行像素级定制的自由，确保打印与机筛稳定性。

5. **本地优先与 BYOK (Bring Your Own Key)**
   * **数据安全**：核心简历数据保存在本地浏览器中，不强制登录，零隐私泄露风险；
   * **自备算力**：支持用户自填 DeepSeek / OpenAI 等大模型 API Key 免费调用 AI 润色能力，零门槛开箱即用。

6. **局部内容敏感脱敏 (Redaction / Blur)**
   * 支持选中文本一键标记为脱敏内容；
   * 在公开发享或社交平台展示时自动应用高阶磨砂模糊遮盖，免去手动截图打码的繁琐流程。

---

## 核心数据结构规范 (Data Schema Specification)

简历采用统一、严谨的 TypeScript / JSON 领域模型定义，兼顾 ATS 机器检索、流式 Tool Calling 与高自由度前端拖拽渲染：

### 1. TypeScript 接口定义

```typescript
/** 个人基础信息（兼顾 PDF 文件名导出、ATS 检索与社交分享） */
export interface ResumeBasics {
  name: string;
  headline: string;
  avatar?: {
    url: string;
    shape: 'circle' | 'rounded' | 'square';
    size: number; // 默认 84px
    visible: boolean;
  };
  contacts: Array<{
    id: string;
    type: 'phone' | 'email' | 'link' | 'location' | 'github' | 'wechat' | 'linkedin' | 'custom';
    icon?: string;
    label: string;
    value: string;
    href?: string;
  }>;
}

/** 经历 / 项目 / 技能等明细项目 */
export interface ResumeItem {
  id: string;
  title: string;              // 职位 / 项目名 / 学位
  subtitle?: string;          // 公司名 / 院校名 / 角色
  dateRange?: string;         // "2023.03 - 至今"
  location?: string;          // 城市 / 工作地
  description: string;        // Tiptap 富文本 HTML (支持高亮与脱敏 mark)
  tags?: string[];            // 技术栈或标签词
  visible: boolean;
}

/** 通用 Section 积木块 */
export interface ResumeSection {
  id: string;
  title: string;              // 模块标题，如 "工作经历"
  icon?: string;              // 图标标识
  type: 'experience' | 'education' | 'project' | 'skill' | 'richtext' | 'custom';
  slot: 'main' | 'sidebar';   // 渲染槽位：主区域 或 侧边栏
  visible: boolean;
  items: ResumeItem[];
}

/** 双槽位网格布局配置 */
export interface ResumeLayout {
  mode: 'single' | 'split';
  sidebarWidth: number;       // 侧栏宽度 (px，默认 260px，支持 180~360px 拖拽调节)
  sidebarPosition: 'left' | 'right';
}

/** 设计规范与排版弹性 Tokens */
export interface ResumeDesign {
  themeColor: string;         // 主题强调色 (Hex)
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: number;           // 基准字号 (pt，默认 10.5pt，9~12pt 弹性伸缩)
  lineHeight: number;         // 基准行高 (默认 1.45，1.2~1.8 弹性伸缩)
  sectionGap: number;         // 模块垂直间距 (px，默认 16px)
  itemGap: number;            // 经历条目间距 (px，默认 12px)
  pagePadding: number;        // A4 画布内边距 (mm，默认 16mm)
  customCss: string;          // 高级用户自定义 CSS 覆写代码
}

/** 顶层完整简历实体 */
export interface YizhiResume {
  version: '2.0.0';
  metadata: {
    title: string;
    createdAt: string;
    updatedAt: string;
    language: 'zh' | 'en';
    paperSize: 'A4' | 'Letter';
  };
  basics: ResumeBasics;
  layout: ResumeLayout;
  sections: ResumeSection[];
  design: ResumeDesign;
}
```

### 2. 标准 JSON 载荷示例

```json
{
  "version": "2.0.0",
  "metadata": {
    "title": "求职简历",
    "createdAt": "2026-11-10T09:00:00.000Z",
    "updatedAt": "2026-11-10T09:00:00.000Z",
    "language": "zh",
    "paperSize": "A4"
  },
  "basics": {
    "name": "求职者",
    "headline": "资深前端全栈工程师",
    "avatar": { "url": "", "shape": "circle", "size": 84, "visible": false },
    "contacts": [
      { "id": "c1", "type": "phone", "label": "电话", "value": "138-0000-0000", "href": "tel:13800000000" },
      { "id": "c2", "type": "email", "label": "邮箱", "value": "me@example.com", "href": "mailto:me@example.com" },
      { "id": "c3", "type": "github", "label": "GitHub", "value": "github.com", "href": "https://github.com" }
    ]
  },
  "layout": {
    "mode": "single",
    "sidebarWidth": 260,
    "sidebarPosition": "left"
  },
  "sections": [
    {
      "id": "sec_experience",
      "title": "工作经历",
      "type": "experience",
      "slot": "main",
      "visible": true,
      "items": [
        {
          "id": "item_exp_1",
          "title": "高级全栈工程师",
          "subtitle": "某知名互联网科技公司",
          "dateRange": "2023.03 - 至今",
          "location": "北京",
          "description": "<p>负责核心平台架构演进，重构组件库与富文本编辑器，首屏 LCP 优化 45%。</p>",
          "visible": true
        }
      ]
    }
  ],
  "design": {
    "themeColor": "#0f172a",
    "fontFamily": "sans",
    "fontSize": 10.5,
    "lineHeight": 1.45,
    "sectionGap": 16,
    "itemGap": 12,
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

* **核心框架**：[Next.js](https://nextjs.org/) (App Router, Turbopack) + [React 19](https://react.dev/)
* **语言与类型**：[TypeScript](https://www.typescriptlang.org/) + [Zod](https://zod.dev/) (运行时类型校验与 Schema 推导)
* **样式系统**：[Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix / Base UI)
* **状态管理**：[Zustand](https://github.com/pmndrs/zustand) (轻量响应式与 LocalStorage 持久化)
* **富文本引擎**：[Tiptap 全家桶](https://tiptap.dev/) (`@tiptap/react`, `@tiptap/pm`, StarterKit, 链接/下划线/颜色/脱敏扩展)
* **拖拽编排**：[@dnd-kit](https://dndkit.com/) (`@dnd-kit/core`, `@dnd-kit/sortable`, 现代化 React 19 弹性拖拽排序)
* **代码编辑器**：[CodeMirror 6](https://codemirror.net/) (`@uiw/react-codemirror` + `@codemirror/lang-css`, 轻量无 WebWorker 负担)
* **图标系统**：[Lucide React](https://lucide.dev/) + [@icons-pack/react-simple-icons](https://simpleicons.org/) (技术品牌与社交全量 SVG 图标)
* **图片裁剪**：[react-image-crop](https://github.com/DominicTobias/react-image-crop) (轻量无头头像裁剪器)
* **通知与工具**：[Sonner](https://sonner.emilkowal.ski/) (现代化 Toast 通知) + [nanoid](https://github.com/ai/nanoid) (紧凑安全唯一 ID)
* **代码质量**：[Biome](https://biomejs.dev/) (极速格式化与代码规范检查)
* **包管理器**：[pnpm](https://pnpm.io/)

---

## 快速开始

### 1. 环境要求
* Node.js >= 18.18.0
* pnpm >= 9.0.0

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
