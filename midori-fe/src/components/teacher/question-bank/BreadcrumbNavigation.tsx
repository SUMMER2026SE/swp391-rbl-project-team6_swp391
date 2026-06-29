import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbNavigationProps {
  level: string | null;
  lesson: string | null;
  skill: string | null;
  onNavigate: (type: "root" | "level" | "lesson") => void;
}

export function BreadcrumbNavigation({
  level,
  lesson,
  skill,
  onNavigate,
}: BreadcrumbNavigationProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <button
        onClick={() => onNavigate("root")}
        className="flex items-center gap-1 hover:text-primary transition-colors font-medium cursor-pointer"
      >
        <Home className="h-4 w-4" />
        Question Bank
      </button>

      {level && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          <button
            onClick={() => onNavigate("level")}
            className={`hover:text-primary transition-colors font-medium cursor-pointer ${
              !lesson && !skill ? "text-foreground font-semibold" : ""
            }`}
          >
            {level}
          </button>
        </>
      )}

      {lesson && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          <button
            onClick={() => onNavigate("lesson")}
            className={`hover:text-primary transition-colors font-medium cursor-pointer ${
              !skill ? "text-foreground font-semibold" : ""
            }`}
          >
            {lesson}
          </button>
        </>
      )}

      {skill && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          <span className="text-foreground font-semibold">{skill}</span>
        </>
      )}
    </nav>
  );
}
