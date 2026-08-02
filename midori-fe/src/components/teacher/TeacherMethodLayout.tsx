import { ClassLockNotice } from "@/components/teacher/ClassLockNotice";

interface TeacherMethodLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  showBack?: boolean;
  onBack?: () => void;
  lockedClass?: { name: string; level: string } | null;
  children: React.ReactNode;
}

export function TeacherMethodLayout({
  eyebrow,
  title,
  subtitle,
  showBack,
  onBack,
  lockedClass,
  children,
}: TeacherMethodLayoutProps) {
  return (
    <div className="space-y-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1.5 shrink-0"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </button>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]">
                {eyebrow}
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-primary-col sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-muted-col">{subtitle}</p>}
          </div>
        </div>
      </div>

      {children}

      {lockedClass && (
        <div className="mt-6 flex justify-center">
          <ClassLockNotice className={lockedClass.name} level={lockedClass.level} />
        </div>
      )}
    </div>
  );
}
