import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/settings/language")({
  component: StudentSettingsLanguagePage,
});

function StudentSettingsLanguagePage() {
  const tabs = [
    { label: "Theme", to: "/student/settings/theme" },
    { label: "Language", to: "/student/settings/language" },
    { label: "Notifications", to: "/student/settings/notifications" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage theme preferences, languages and notifications."
      />

      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
              tab.to === "/student/settings/language"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card className="p-6 max-w-lg mx-auto mt-6">
        <h3 className="font-display font-bold text-base text-foreground mb-4">Language Settings</h3>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <Globe className="w-5 h-5 text-primary" />
          <div>
            <div className="text-sm font-semibold text-foreground">App Language</div>
            <div className="text-xs text-muted-foreground">English (US) / Vietnamese options coming soon</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
