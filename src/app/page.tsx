import { SiGithub } from "@icons-pack/react-simple-icons";
import {
  ArrowRight,
  LayoutGrid,
  Printer,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      {/* 顶部简易导航栏 */}
      <header className="h-14 px-6 md:px-12 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
            一
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">
            一纸简历
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 ml-1">
            v2.0
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/WhiteP1ay/yizhicv"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="GitHub 仓库"
          >
            <SiGithub className="w-4 h-4" />
          </a>
          <Link
            href="/app"
            className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md"
          >
            <span>打开编辑器</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 主视觉 Hero 区域 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center max-w-4xl mx-auto">
        {/* 官网筹备状态徽章 */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="w-3.5 h-3.5 text-slate-500" />
          <span>官网正在筹备完善中 · 编辑器已完整就绪</span>
        </div>

        {/* 核心标语 */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15] mb-6">
          纯粹所见即所得
          <br />
          <span className="text-slate-500 font-medium text-3xl md:text-5xl">
            现代简历排版与创作引擎
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed font-normal">
          摒弃繁琐的结构化表单。直接在真实 A4
          纸张画布上随心书写、拖拽分栏与自由排版。双槽位弹性流布局，极简优雅，一键导出矢量级
          PDF。
        </p>

        {/* 行动号召按钮组 */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-16">
          <Link
            href="/app"
            className="w-full sm:w-auto h-11 px-7 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <span>立即进入编辑器</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="https://github.com/WhiteP1ay/yizhicv"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto h-11 px-6 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-sm font-medium rounded-xl border border-slate-200/80 inline-flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <SiGithub className="w-4 h-4" />
            <span>GitHub 开源</span>
          </a>
        </div>

        {/* 特性卡片概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
          <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center mb-3">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              自由双栏与中线拖拽
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              单栏与侧边栏无缝切换，直接拉拽垂直中线即可微调栏宽或磁吸吸附。
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              本地优先与隐私脱敏
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              数据 100% 留存在浏览器本地与 JSON 文件，支持敏感信息高斯模糊遮盖。
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center mb-3">
              <Printer className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              工业级 A4 矢量打印
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              严格遵循 210mm × 297mm 纸张几何标准，打印即所得，告别排版错位。
            </p>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="py-6 px-6 border-t border-slate-200/60 text-center text-xs text-slate-400">
        <p>© 2025 一纸简历 YizhiCV · 纯粹所见即所得简历解决方案</p>
      </footer>
    </div>
  );
}
