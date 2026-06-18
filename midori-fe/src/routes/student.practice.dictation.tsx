import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Headphones } from "lucide-react";

export const Route = createFileRoute("/student/practice/dictation")({
  component: StudentPracticeDictationPage,
});

function StudentPracticeDictationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dictation Practice"
        subtitle="Listen to audio clips and write down what you hear to improve spelling and listening."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Headphones className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Dictation Mode</h3>
        <p className="text-sm text-muted-foreground">
          Dictation lessons and speech-to-text accuracy grading are under development.
        </p>
      </Card>
    </div>
  );
}
