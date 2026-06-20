import { ArrowLeft, ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface QuestionBankStickyHeaderProps {
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  actionButtons?: ReactNode;
  stats?: ReactNode;
  level?: string;
  lessonId?: string | number;
}

export function QuestionBankStickyHeader({
  backHref,
  backLabel = "Back",
  breadcrumbs = [],
  title,
  subtitle,
  actionButtons,
  stats,
  level,
  lessonId,
}: QuestionBankStickyHeaderProps) {
  const handleBackClick = () => {
    // Resolve the back href with params if present
    let resolvedHref = backHref;
    
    if (resolvedHref?.includes("$level") && level) {
      resolvedHref = resolvedHref.replace("$level", level.toLowerCase());
    }
    
    if (resolvedHref?.includes("$lessonId") && lessonId) {
      resolvedHref = resolvedHref.replace("$lessonId", String(lessonId));
    }
    
    // For lesson-detail pages, construct proper URL with query params
    if (resolvedHref === "/admin/question-bank/lesson-detail" && level && lessonId) {
      resolvedHref = `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`;
    }
    
    if (window.history.length > 1) {
      window.history.back();
    } else if (resolvedHref) {
      window.location.href = resolvedHref;
    } else {
      window.location.href = "/admin/question-bank";
    }
  };

  return (
    <div className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Main Sticky Header */}
      <div className="bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Row: Back Button + Breadcrumbs */}
          <div className="flex items-center gap-2 py-3">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center gap-1.5 text-sm text-muted-col hover:text-primary transition bg-[var(--card)] px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-primary/30 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </button>
            
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-col overflow-x-auto scrollbar-hide">
                {breadcrumbs.map((item, index) => (
                  <div key={index} className="flex items-center gap-1 shrink-0">
                    {index > 0 && <ChevronRight className="w-3 h-3 text-[var(--border)]" />}
                    {item.href ? (
                      <a
                        href={item.href}
                        className="hover:text-primary transition whitespace-nowrap"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span className="text-primary-col font-medium whitespace-nowrap">{item.label}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Row: Title + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-display font-black text-primary-col truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-secondary-col mt-0.5 hidden sm:block">{subtitle}</p>
              )}
            </div>
            
            {actionButtons && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                {actionButtons}
              </div>
            )}
          </div>

          {/* Stats Row (if provided) */}
          {stats && (
            <div className="pb-4">
              {stats}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for pages with less content
export function QuestionBankCompactHeader({
  backHref,
  backLabel = "Back",
  breadcrumbs = [],
  title,
  actionButtons,
}: {
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  actionButtons?: ReactNode;
}) {
  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (backHref) {
      window.location.href = backHref;
    } else {
      window.location.href = "/admin/question-bank";
    }
  };

  return (
    <div className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 py-3">
          {/* Left: Back + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center gap-1.5 text-sm text-muted-col hover:text-primary transition bg-[var(--card)] px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-primary/30 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-col overflow-x-auto scrollbar-hide min-w-0">
                {breadcrumbs.map((item, index) => (
                  <div key={index} className="flex items-center gap-1 shrink-0">
                    {index > 0 && <ChevronRight className="w-3 h-3 text-[var(--border)] shrink-0" />}
                    {item.href ? (
                      <a
                        href={item.href}
                        className="hover:text-primary transition whitespace-nowrap"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span className="text-primary-col font-medium whitespace-nowrap truncate">{item.label}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          {actionButtons && (
            <div className="flex items-center gap-2 shrink-0">
              {actionButtons}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
