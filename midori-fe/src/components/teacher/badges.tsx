import { cn } from "@/lib/utils";
import type { JLPTLevel, Difficulty } from "@/data/teacher-data";

const levelColors: Record<JLPTLevel, string> = {
  N5: "bg-success/15 text-success border-success/30",
  N4: "bg-info/15 text-info border-info/30",
  N3: "bg-warning/20 text-warning-foreground border-warning/40 dark:text-warning",
  N2: "bg-sakura/25 text-foreground border-sakura/40",
  N1: "bg-destructive/15 text-destructive border-destructive/30",
};

export function LevelBadge({ level, className }: { level: JLPTLevel; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wide", levelColors[level], className)}>
      {level}
    </span>
  );
}

const diffColors: Record<Difficulty, string> = {
  Easy: "bg-success/15 text-success border-success/30",
  Medium: "bg-warning/20 text-foreground border-warning/40 dark:text-warning",
  Hard: "bg-destructive/15 text-destructive border-destructive/30",
};

export function DifficultyBadge({ d, className }: { d: Difficulty; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", diffColors[d], className)}>
      {d}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/15 text-success border-success/30",
    Upcoming: "bg-info/15 text-info border-info/30",
    Archived: "bg-muted text-muted-foreground border-border",
    Draft: "bg-muted text-muted-foreground border-border",
    Published: "bg-success/15 text-success border-success/30",
    Assigned: "bg-info/15 text-info border-info/30",
    Closed: "bg-muted text-muted-foreground border-border",
    Scheduled: "bg-info/15 text-info border-info/30",
    Completed: "bg-success/15 text-success border-success/30",
    Open: "bg-warning/20 text-foreground border-warning/40 dark:text-warning",
    "In review": "bg-info/15 text-info border-info/30",
    Resolved: "bg-success/15 text-success border-success/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", map[status] ?? "bg-muted text-muted-foreground border-border")}>
      {status}
    </span>
  );
}
