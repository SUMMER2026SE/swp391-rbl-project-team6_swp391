import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/student/progress/achievements")({
  component: StudentProgressAchievementsPage,
});

function StudentProgressAchievementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Achievements & Badges"
        subtitle="Celebrate milestones and see what challenges are next."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Achievements</h3>
        <p className="text-sm text-muted-foreground">
          Achievements tracking and reward system details are coming soon.
        </p>
      </Card>
    </div>
  );
}
