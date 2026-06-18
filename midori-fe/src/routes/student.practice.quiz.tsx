import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Brain } from "lucide-react";

export const Route = createFileRoute("/student/practice/quiz")({
  component: StudentPracticeQuizPage,
});

function StudentPracticeQuizPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Mode"
        subtitle="Quick custom quizzes to test your vocabulary, grammar and kanji skills."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Brain className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Quiz Mode</h3>
        <p className="text-sm text-muted-foreground">
          Quiz customization and timed challenges will be active soon!
        </p>
      </Card>
    </div>
  );
}
