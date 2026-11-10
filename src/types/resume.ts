import { z } from "zod";

/**
 * 联系方式项定义
 */
export const contactItemSchema = z.object({
  id: z.string(),
  type: z.enum([
    "phone",
    "email",
    "link",
    "location",
    "github",
    "wechat",
    "linkedin",
    "custom",
  ]),
  icon: z.string().optional(),
  label: z.string(),
  value: z.string(),
  href: z.string().optional(),
});
export type ContactItem = z.infer<typeof contactItemSchema>;

/**
 * 个人基础信息（兼顾 PDF 文件名、ATS 检索与卡片展示）
 */
export const resumeBasicsSchema = z.object({
  name: z.string().default(""),
  headline: z.string().default(""),
  avatar: z
    .object({
      url: z.string(),
      shape: z.enum(["circle", "rounded", "square"]).default("circle"),
      size: z.number().default(84),
      visible: z.boolean().default(false),
    })
    .optional(),
  contacts: z.array(contactItemSchema).default([]),
});
export type ResumeBasics = z.infer<typeof resumeBasicsSchema>;

/**
 * 经历/项目/技能细项
 */
export const resumeItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  dateRange: z.string().optional(),
  location: z.string().optional(),
  description: z.string().default(""),
  tags: z.array(z.string()).optional(),
  visible: z.boolean().default(true),
});
export type ResumeItem = z.infer<typeof resumeItemSchema>;

/**
 * 通用 Section 积木块
 */
export const resumeSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string().optional(),
  type: z
    .enum(["experience", "education", "project", "skill", "richtext", "custom"])
    .default("custom"),
  slot: z.enum(["main", "sidebar"]).default("main"),
  visible: z.boolean().default(true),
  items: z.array(resumeItemSchema).default([]),
});
export type ResumeSection = z.infer<typeof resumeSectionSchema>;

/**
 * 双槽位网格布局配置
 */
export const resumeLayoutSchema = z.object({
  mode: z.enum(["single", "split"]).default("single"),
  sidebarWidth: z.number().min(0).max(400).default(260),
  sidebarPosition: z.enum(["left", "right"]).default("left"),
});
export type ResumeLayout = z.infer<typeof resumeLayoutSchema>;

/**
 * 设计规范与排版弹性 Tokens
 */
export const resumeDesignSchema = z.object({
  themeColor: z.string().default("#0f172a"),
  fontFamily: z.enum(["sans", "serif", "mono"]).default("sans"),
  fontSize: z.number().min(8).max(14).default(10.5),
  lineHeight: z.number().min(1.2).max(2.0).default(1.45),
  sectionGap: z.number().min(4).max(36).default(16),
  itemGap: z.number().min(2).max(28).default(12),
  pagePadding: z.number().min(8).max(30).default(16),
  customCss: z.string().default(""),
});
export type ResumeDesign = z.infer<typeof resumeDesignSchema>;

/**
 * 顶层简历完整文档结构
 */
export const yizhiResumeSchema = z.object({
  version: z.literal("2.0.0"),
  metadata: z.object({
    title: z.string().default("未命名简历"),
    createdAt: z.string(),
    updatedAt: z.string(),
    language: z.enum(["zh", "en"]).default("zh"),
    paperSize: z.enum(["A4", "Letter"]).default("A4"),
  }),
  basics: resumeBasicsSchema,
  layout: resumeLayoutSchema,
  sections: z.array(resumeSectionSchema).default([]),
  design: resumeDesignSchema,
});
export type YizhiResume = z.infer<typeof yizhiResumeSchema>;

/**
 * 默认初始简历模板数据
 */
export const defaultResume: YizhiResume = {
  version: "2.0.0",
  metadata: {
    title: "求职简历",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    language: "zh",
    paperSize: "A4",
  },
  basics: {
    name: "求职者",
    headline: "资深前端全栈工程师",
    avatar: {
      url: "",
      shape: "circle",
      size: 84,
      visible: false,
    },
    contacts: [
      {
        id: "c_phone",
        type: "phone",
        icon: "phone",
        label: "电话",
        value: "138-0000-0000",
        href: "tel:13800000000",
      },
      {
        id: "c_email",
        type: "email",
        icon: "mail",
        label: "邮箱",
        value: "example@gmail.com",
        href: "mailto:example@gmail.com",
      },
      {
        id: "c_location",
        type: "location",
        icon: "map-pin",
        label: "城市",
        value: "北京",
      },
      {
        id: "c_github",
        type: "github",
        icon: "github",
        label: "GitHub",
        value: "github.com",
        href: "https://github.com",
      },
    ],
  },
  layout: {
    mode: "single",
    sidebarWidth: 260,
    sidebarPosition: "left",
  },
  sections: [
    {
      id: "sec_experience",
      title: "工作经历",
      type: "experience",
      slot: "main",
      visible: true,
      items: [
        {
          id: "item_exp_1",
          title: "高级全栈工程师",
          subtitle: "某知名互联网科技公司",
          dateRange: "2023.03 - 至今",
          location: "北京",
          description:
            "<p>负责核心平台架构演进与全栈功能交付，主导千万级 PV 架构重构与性能优化，首屏 LCP 缩减 45%。</p>",
          visible: true,
        },
      ],
    },
    {
      id: "sec_project",
      title: "项目经历",
      type: "project",
      slot: "main",
      visible: true,
      items: [
        {
          id: "item_proj_1",
          title: "一纸简历 (YizhiCV) 2.0",
          subtitle: "核心作者 / 独立开发者",
          dateRange: "2024.01 - 至今",
          description:
            "<p>基于 Next.js 15、Tailwind CSS 与 Tiptap 构建的现代化开源简历编辑器，提供双轨 AI 协作与高自由度排版引擎。</p>",
          tags: ["Next.js", "React 19", "Tailwind CSS", "TypeScript", "Tiptap"],
          visible: true,
        },
      ],
    },
    {
      id: "sec_education",
      title: "教育背景",
      type: "education",
      slot: "main",
      visible: true,
      items: [
        {
          id: "item_edu_1",
          title: "计算机科学与技术",
          subtitle: "某重点大学 · 本科",
          dateRange: "2018.09 - 2022.06",
          description:
            "<p>主修数据结构、操作系统、计算机网络，多次获得学术奖学金。</p>",
          visible: true,
        },
      ],
    },
    {
      id: "sec_skills",
      title: "专业技能",
      type: "skill",
      slot: "sidebar",
      visible: true,
      items: [
        {
          id: "item_skill_1",
          title: "前端技术栈",
          description:
            "<p>精通 TypeScript、React 19、Next.js App Router、Tailwind CSS 体系与前端工程化建设。</p>",
          tags: ["TypeScript", "React", "Next.js", "Node.js"],
          visible: true,
        },
      ],
    },
  ],
  design: {
    themeColor: "#0f172a",
    fontFamily: "sans",
    fontSize: 10.5,
    lineHeight: 1.45,
    sectionGap: 16,
    itemGap: 12,
    pagePadding: 16,
    customCss: "",
  },
};
