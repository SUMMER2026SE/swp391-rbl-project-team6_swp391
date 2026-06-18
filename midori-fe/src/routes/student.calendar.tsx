import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/student/calendar")({
  component: StudentCalendarPage,
});

function StudentCalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Calendar"
        subtitle="Schedule lessons, upcoming mock exams, and school assignments."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Calendar</h3>
        <p className="text-sm text-muted-foreground">
          No events scheduled. Your learning agenda and school schedules will sync here.
        </p>
      </Card>
    </div>
  );
}
