import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/student/progress/streak")({
  component: StudentProgressStreakPage,
});

function StudentProgressStreakPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Streak Calendar"
        subtitle="Keep your streak active and view your daily consistency log."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Flame className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Streak Calendar</h3>
        <p className="text-sm text-muted-foreground">
          Your daily streak calendar log will be rendered here to track your consistency.
        </p>
      </Card>
    </div>
  );
}
