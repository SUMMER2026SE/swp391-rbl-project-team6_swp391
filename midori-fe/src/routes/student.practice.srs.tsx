import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/student/practice/srs")({
  component: StudentPracticeSRSPage,
});

function StudentPracticeSRSPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SRS Review"
        subtitle="Spaced Repetition System review schedule for flashcards."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Spaced Repetition System</h3>
        <p className="text-sm text-muted-foreground">
          SRS algorithm is currently tracking your flashcards. View SRS review schedules here soon.
        </p>
      </Card>
    </div>
  );
}
