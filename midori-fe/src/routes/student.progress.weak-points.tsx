import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Target } from "lucide-react";

export const Route = createFileRoute("/student/progress/weak-points")({
  component: StudentProgressWeakPointsPage,
});

function StudentProgressWeakPointsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Weak Points Analysis"
        subtitle="Identify and work on the kanji or grammar structures you struggle with."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Target className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Weak Points</h3>
        <p className="text-sm text-muted-foreground">
          AI analysis of your mock exam results and quiz performance is currently compiling.
        </p>
      </Card>
    </div>
  );
}
