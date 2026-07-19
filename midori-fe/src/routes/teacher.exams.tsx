import { createFileRoute, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AiPdfImportWorkflow } from "@/components/admin/AiPdfImportWorkflow";
import { Sparkles, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/teacher/exams")({
  component: ExamsPage,
});

type Method = "ai-pdf" | "question-bank";

function ExamsPage() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/teacher/exams") {
    return <Outlet />;
  }

  const [method, setMethod] = useState<Method | null>(null);

  // Question Bank Flow - navigate to the create page with source param
  useEffect(() => {
    if (method === "question-bank") {
      navigate({ to: "/teacher/exams/create", search: { source: "question-bank" } });
    }
  }, [method, navigate]);

  const handleBack = () => {
    if (method) {
      setMethod(null);
    } else {
      navigate({ to: "/teacher" });
    }
  };

  // Show method selection screen
  if (!method) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="New exam"
          title="How do you want to create this exam?"
          subtitle="Pick the source of the questions and content."
          showBack={true}
          onBack={handleBack}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <MethodCard
            icon={Sparkles}
            title="AI PDF Exam"
            desc="Upload a PDF and let AI generate exam questions automatically."
            badge="AI Generator"
            onClick={() => setMethod("ai-pdf")}
          />
          <MethodCard
            icon={HelpCircle}
            title="From Question Bank"
            desc="Generate exam questions by selecting topics and difficulty."
            badge="Generator"
            onClick={() => setMethod("question-bank")}
          />
        </div>
      </div>
    );
  }

  // AI PDF Flow
  if (method === "ai-pdf") {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setMethod(null)} className="-ml-2">
          ← Change method
        </Button>
        <AiPdfImportWorkflow
          title="AI PDF Exam Generator"
          subtitle="Upload a PDF and let AI generate exam questions automatically."
          backHref="/teacher/exams"
          backLabel="Back to Exam Selection"
          onCreate={(questions) => {
            toast.success(`${questions.length} questions imported from PDF!`);
            navigate({ to: "/teacher/exams/create" });
          }}
        />
      </div>
    );
  }



  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => setMethod(null)} className="-ml-2">
        ← Change method
      </Button>
      <div className="text-center py-12">
        <p className="text-muted-foreground">Redirecting to Question Bank exam creator...</p>
      </div>
    </div>
  );
}

function MethodCard({
  icon: Icon,
  title,
  desc,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {badge}
        </span>
      </div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
