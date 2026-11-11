import { z } from "zod";

/**
 * 极致纯粹的 Section 积木块
 * 彻底消除冗余字段（无 type、无 title、无 showHeader）。
 * 标题、正文、时间轴与联系方式全部内联于 Tiptap 富文本 HTML 中，所见即所得。
 */
export const resumeSectionSchema = z.object({
  id: z.string(),
  slot: z.enum(["main", "sidebar"]).default("main"),
  visible: z.boolean().default(true),
  content: z.string().default(""),
});
export type ResumeSection = z.infer<typeof resumeSectionSchema>;

/**
 * 双槽位自适应布局配置 (Unified Slot Grid)
 * 摒弃冗余的 mode 字段：
 * - sidebarWidth === 0: 纯单栏自然文档流
 * - sidebarWidth > 0: 开启侧边栏 (默认 260px，支持 180~360px 自由拖拽)
 */
export const resumeLayoutSchema = z.object({
  sidebarWidth: z.number().min(0).max(400).default(260),
  sidebarPosition: z.enum(["left", "right"]).default("left"),
});
export type ResumeLayout = z.infer<typeof resumeLayoutSchema>;

/**
 * 设计规范与排版弹性 Tokens
 * 页面尺寸锁死为工业级标准 A4 (210mm × 297mm)
 */
export const resumeDesignSchema = z.object({
  themeColor: z.string().default("#0f172a"),
  fontFamily: z.enum(["sans", "serif", "mono"]).default("sans"),
  fontSize: z.number().min(8).max(14).default(10.5),
  lineHeight: z.number().min(1.2).max(2.0).default(1.45),
  sectionGap: z.number().min(4).max(36).default(16),
  pagePadding: z.number().min(8).max(30).default(16),
  customCss: z.string().default(""),
});
export type ResumeDesign = z.infer<typeof resumeDesignSchema>;

/**
 * 顶层简历实体（纯扁平积木流模型）
 */
export const yizhiResumeSchema = z.object({
  version: z.literal("2.0.0"),
  metadata: z.object({
    id: z.string(),
    title: z.string().default("未命名"),
    createdAt: z.string(),
    updatedAt: z.string(),
    language: z.enum(["zh", "en"]).default("zh"),
  }),
  layout: resumeLayoutSchema,
  sections: z.array(resumeSectionSchema).default([]),
  design: resumeDesignSchema,
});
export type YizhiResume = z.infer<typeof yizhiResumeSchema>;

/**
 * 内置模块初始化预设（Presets）
 * 用于用户点击“添加模块”时快速插入对应的 HTML 模板
 */
export interface SectionPreset {
  key: string;
  name: string;
  description: string;
  defaultSlot: "main" | "sidebar";
  initialContent: string;
}

export const SECTION_PRESETS: Record<string, SectionPreset> = {
  profile: {
    key: "profile",
    name: "个人信息名片",
    description: "姓名、求职意向、联系方式胶囊与头像",
    defaultSlot: "main",
    initialContent: `
<div class="cv-profile-card text-center pb-2">
  <h1 class="text-3xl font-bold tracking-tight text-slate-900">求职者</h1>
  <p class="text-base font-medium text-slate-600 mt-1">资深前端全栈工程师</p>
  <div class="cv-contacts-wrap flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-600">
    <span>📱 138-0000-0000</span>
    <span>✉️ <a href="mailto:me@example.com">me@example.com</a></span>
    <span>📍 北京</span>
    <span>🌐 <a href="https://github.com" target="_blank">github.com</a></span>
  </div>
</div>
`.trim(),
  },
  experience: {
    key: "experience",
    name: "工作经历",
    description: "标准两端对齐经历排版，带公司、岗位、日期与要点",
    defaultSlot: "main",
    initialContent: `
<div class="cv-section-block mb-4">
  <h2 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3">工作经历</h2>
  <div class="cv-entry mb-4">
    <div class="flex justify-between items-baseline font-semibold text-slate-900">
      <span class="text-base">高级全栈工程师 · 某知名互联网科技公司</span>
      <span class="text-sm font-normal text-slate-500">2023.03 - 至今</span>
    </div>
    <div class="text-sm text-slate-500 mb-1">北京 · 核心平台研发部</div>
    <ul class="list-disc list-outside pl-4 space-y-1 text-sm text-slate-700">
      <li>主导核心业务系统重构，全面采用 Next.js App Router 与 Tailwind CSS 体系，提升首屏加载性能 45%。</li>
      <li>设计并落地微前端与无头组件库方案，支撑公司 10+ 业务线独立交付。</li>
    </ul>
  </div>
</div>
`.trim(),
  },
  project: {
    key: "project",
    name: "项目经历",
    description: "作品与项目经验展示，带技术标签与量化成果",
    defaultSlot: "main",
    initialContent: `
<div class="cv-section-block mb-4">
  <h2 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3">项目经历</h2>
  <div class="cv-entry mb-3">
    <div class="flex justify-between items-baseline font-semibold text-slate-900">
      <span class="text-base">一纸简历 (YizhiCV) 2.0 · 独立开发者</span>
      <span class="text-sm font-normal text-slate-500">2024.01 - 至今</span>
    </div>
    <p class="text-sm text-slate-700 mt-1">基于 Next.js 15、Tailwind CSS 与 Tiptap 构建的现代化开源简历编辑器，提供双轨 AI 协作与高自由度排版引擎。</p>
  </div>
</div>
`.trim(),
  },
  education: {
    key: "education",
    name: "教育背景",
    description: "院校名、专业、学位与在校时间",
    defaultSlot: "main",
    initialContent: `
<div class="cv-section-block mb-4">
  <h2 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3">教育背景</h2>
  <div class="cv-entry">
    <div class="flex justify-between items-baseline font-semibold text-slate-900">
      <span class="text-base">某重点大学 · 计算机科学与技术</span>
      <span class="text-sm font-normal text-slate-500">2018.09 - 2022.06</span>
    </div>
    <div class="text-sm text-slate-500">本科 · 学士学位 · 获国家励志奖学金</div>
  </div>
</div>
`.trim(),
  },
  skill: {
    key: "skill",
    name: "专业技能",
    description: "技术栈标签与技能熟练度概述",
    defaultSlot: "sidebar",
    initialContent: `
<div class="cv-section-block mb-4">
  <h2 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3">专业技能</h2>
  <div class="cv-entry text-sm text-slate-700 space-y-2">
    <div>
      <span class="font-semibold text-slate-900">前端技术：</span>
      <span>TypeScript, React 19, Next.js, Tailwind CSS, Tiptap, Zustand</span>
    </div>
    <div>
      <span class="font-semibold text-slate-900">后端与工程：</span>
      <span>Node.js, PostgreSQL, Docker, Playwright, Linux</span>
    </div>
  </div>
</div>
`.trim(),
  },
  custom: {
    key: "custom",
    name: "自定义内容",
    description: "自由富文本块，适合荣誉奖项、自我评价或开源贡献",
    defaultSlot: "main",
    initialContent: `
<div class="cv-section-block mb-4">
  <h2 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3">更多信息</h2>
  <p class="text-sm text-slate-700">在这里输入任何自由富文本内容，支持行内加粗、高亮、超链接与列表...</p>
</div>
`.trim(),
  },
};

/**
 * 运行时动态提取 Section 概要显示名（用于图层列表或调试）
 */
export function getSectionLabel(content: string): string {
  if (!content) return "空白模块";
  // 抓取第一个 <h2> 或 <h1>
  const headingMatch = content.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }
  // 抓取首行文本
  const textMatch = content
    .replace(/<[^>]+>/g, " ")
    .trim()
    .slice(0, 12);
  return textMatch ? `${textMatch}...` : "内容模块";
}

/**
 * 提取简历智能导出文件名（优先级：用户自定义标题 > 网页内第一条姓名 > 保底时间戳）
 */
export function getResumeExportName(resume: YizhiResume): string {
  if (resume.metadata.title && resume.metadata.title !== "未命名") {
    return resume.metadata.title;
  }
  const firstContent = resume.sections[0]?.content || "";
  const match = firstContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (match?.[1]) {
    const rawName = match[1].trim();
    if (rawName && rawName !== "求职者") {
      return `${rawName}_简历`;
    }
  }
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `简历_${dateStr}`;
}

/**
 * 默认初始简历模板数据
 */
export const defaultResume: YizhiResume = {
  version: "2.0.0",
  metadata: {
    id: "cv_default",
    title: "未命名",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    language: "zh",
  },
  layout: {
    sidebarWidth: 260,
    sidebarPosition: "left",
  },
  sections: [
    {
      id: "sec_profile",
      slot: SECTION_PRESETS.profile.defaultSlot,
      visible: true,
      content: SECTION_PRESETS.profile.initialContent,
    },
    {
      id: "sec_experience",
      slot: SECTION_PRESETS.experience.defaultSlot,
      visible: true,
      content: SECTION_PRESETS.experience.initialContent,
    },
    {
      id: "sec_project",
      slot: SECTION_PRESETS.project.defaultSlot,
      visible: true,
      content: SECTION_PRESETS.project.initialContent,
    },
    {
      id: "sec_education",
      slot: SECTION_PRESETS.education.defaultSlot,
      visible: true,
      content: SECTION_PRESETS.education.initialContent,
    },
    {
      id: "sec_skills",
      slot: SECTION_PRESETS.skill.defaultSlot,
      visible: true,
      content: SECTION_PRESETS.skill.initialContent,
    },
  ],
  design: {
    themeColor: "#0f172a",
    fontFamily: "sans",
    fontSize: 10.5,
    lineHeight: 1.45,
    sectionGap: 16,
    pagePadding: 16,
    customCss: "",
  },
};
