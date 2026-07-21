import { createFileRoute, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Sparkles, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/teacher/exams")({
  component: ExamsPage,
});

type Method = "ai-exam" | "question-bank";

/**
 * Outer Exam creation screen.
 *
 * This route owns ONLY the method-selection step. The actual creation
 * wizard (including the AI sub-screen and Question Bank flow) lives at
 * `/teacher/exams/create`. Both cards here simply navigate there with
 * a `source` query param so the create route can render the appropriate
 * workflow.
 *
 * Two-card layout per the current product spec:
 *   1. AI Exam            -> /teacher/exams/create?source=ai-pdf
 *      (the create route then shows an inner sub-screen with two
 *       options: "Generate from Content" via the lesson library, and
 *       "Import Existing Questions" via PDF)
 *   2. From Question Bank -> /teacher/exams/create?source=question-bank
 */
function ExamsPage() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [method, setMethod] = useState<Method | null>(null);

  // Effect-driven navigation. Must run on every render, so it lives
  // above the early return — React hooks must always be called in the
  // same order.
  useEffect(() => {
    if (method === "question-bank") {
      navigate({
        to: "/teacher/exams/create",
        search: { classId: undefined, source: "question-bank", topicId: undefined },
      });
    } else if (method === "ai-exam") {
      navigate({
        to: "/teacher/exams/create",
        search: { classId: undefined, source: "ai-pdf", topicId: undefined },
      });
    }
  }, [method, navigate]);

  // Render the child create route as-is when we're on /teacher/exams/create.
  if (pathname !== "/teacher/exams") {
    return <Outlet />;
  }

  const handleBack = () => {
    if (method) {
      setMethod(null);
    } else {
      navigate({ to: "/teacher" });
    }
  };

  // Show method selection screen — exactly two cards.
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
            title="AI Exam"
            desc="Upload a PDF and let AI generate or extract exam questions automatically."
            badge="AI Generator"
            onClick={() => setMethod("ai-exam")}
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

  // The two cards above trigger navigation via the effect, so we never
  // reach this branch with a non-null method. The fallback below keeps
  // React Router happy if navigation is somehow interrupted.
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="text-center py-12">
        <p className="text-muted-foreground">Redirecting to the exam wizard...</p>
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
      data-testid={`exam-method-${title.toLowerCase().replace(/\s+/g, "-")}`}
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
