import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/student/practice/review")({
  component: StudentPracticeReviewPage,
});

function StudentPracticeReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Mistakes"
        subtitle="Review answers you previously got wrong to reinforce learning."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Review Mistakes</h3>
        <p className="text-sm text-muted-foreground">
          You don't have any logged mistakes to review right now!
        </p>
      </Card>
    </div>
  );
}
