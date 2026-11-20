import { Suspense } from "react";
import { ResumeEditor } from "@/components/editor/resume-editor";

export default function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ResumeEditorFallback />}>
      <ResumeRoute params={params} />
    </Suspense>
  );
}

function ResumeEditorFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100/90 text-xs text-slate-400">
      正在打开这份简历…
    </div>
  );
}

async function ResumeRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResumeEditor resumeId={id} />;
}
