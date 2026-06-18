import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/student/progress/history")({
  component: StudentProgressHistoryPage,
});

function StudentProgressHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning History"
        subtitle="Review your past study sessions and activities."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Learning History</h3>
        <p className="text-sm text-muted-foreground">
          Detailed timeline of your past lessons and exercises will be available here soon.
        </p>
      </Card>
    </div>
  );
}
