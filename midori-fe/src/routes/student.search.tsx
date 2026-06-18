import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Search } from "lucide-react";

export const Route = createFileRoute("/student/search")({
  component: StudentSearchPage,
});

function StudentSearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Search"
        subtitle="Search across vocabulary, grammar rules, and reading exercises."
      />
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Search className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">Search Library</h3>
        <p className="text-sm text-muted-foreground">
          Type queries to search through all JLPT kanji, vocabulary, and grammar resources.
        </p>
      </Card>
    </div>
  );
}
