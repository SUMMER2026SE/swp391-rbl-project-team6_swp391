import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/page-ui";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/auth";

export const Route = createFileRoute("/student/settings/language")({
  component: StudentSettingsLanguagePage,
});

function StudentSettingsLanguagePage() {
  const { language, setLanguage } = useLanguage();

  const tabs = [
    { label: "Theme", to: "/student/settings/theme" },
    { label: "Language", to: "/student/settings/language" },
    { label: "Notifications", to: "/student/settings/notifications" },
  ];

  const languages = [
    {
      code: "en" as const,
      name: "English",
      nativeName: "English",
      flag: "🇬🇧",
      description: "Full English interface",
    },
    {
      code: "vi" as const,
      name: "Vietnamese",
      nativeName: "Tiếng Việt",
      flag: "🇻🇳",
      description: "Giao diện tiếng Việt",
    },
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
        
        <div className="space-y-3">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                )}
              >
                <span className="text-3xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{lang.name}</span>
                    <span className="text-xs text-muted-foreground">({lang.nativeName})</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{lang.description}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Language preference is saved automatically and will be applied across the app.
        </p>
      </Card>
    </div>
  );
}
