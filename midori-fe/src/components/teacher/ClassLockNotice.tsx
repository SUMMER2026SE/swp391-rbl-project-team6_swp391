import { LevelBadge } from "@/components/teacher/badges";
import type { JLPTLevel } from "@/data/teacher-data";

interface ClassLockNoticeProps {
  className: string;
  level: string;
}

export function ClassLockNotice({ className, level }: ClassLockNoticeProps) {
  return (
    <div className="flex w-fit items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-card px-4 py-2.5 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{className}</span>
        <LevelBadge level={level as JLPTLevel} />
      </div>
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Class locked
      </span>
    </div>
  );
}
