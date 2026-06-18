import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/student/practice/bookmarks")({
  component: StudentPracticeBookmarksPage,
});

function StudentPracticeBookmarksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookmarks"
        subtitle="Access all your saved words, grammar points, and exercises in one place."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Bookmark className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Bookmarks</h3>
        <p className="text-sm text-muted-foreground">
          You haven't bookmarked any items yet. Tap the bookmark icon on any lesson to save it here.
        </p>
      </Card>
    </div>
  );
}
