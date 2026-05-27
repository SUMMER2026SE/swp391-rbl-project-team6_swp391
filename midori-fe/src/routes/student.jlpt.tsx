import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/student/jlpt")({ component: JlptPage });

function JlptPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-6">📝</div>
      <h1 className="text-3xl font-display font-black text-foreground mb-3">JLPT Practice</h1>
      <p className="text-muted-foreground text-base">Coming soon</p>
      <p className="text-muted-foreground/60 text-sm mt-2 max-w-sm">
        Full timed mock exams with AI-generated explanations are currently under development.
      </p>
    </div>
  );
}
