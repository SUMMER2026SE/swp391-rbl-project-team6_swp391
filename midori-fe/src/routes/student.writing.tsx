import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Mic } from "lucide-react"; // or any writing icon, let's use Lucide PenTool if available, or just Mic/BookOpen

export const Route = createFileRoute("/student/writing")({
  component: StudentWritingPage,
});

function StudentWritingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Writing Practice"
        subtitle="Practice writing Japanese characters and short paragraphs."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <span className="text-2xl">✍️</span>
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Writing Practice</h3>
        <p className="text-sm text-muted-foreground">
          This module is currently under development. Paragraph writing and essay submission features will be available in the next release.
        </p>
      </Card>
    </div>
  );
}
