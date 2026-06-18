import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/student/reading")({
  component: StudentReadingPage,
});

function StudentReadingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reading Comprehension"
        subtitle="Read Japanese passages and practice answering questions."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Reading Comprehension</h3>
        <p className="text-sm text-muted-foreground">
          This module is currently under development. Read passages and quizzes will be available in the next release.
        </p>
      </Card>
    </div>
  );
}
