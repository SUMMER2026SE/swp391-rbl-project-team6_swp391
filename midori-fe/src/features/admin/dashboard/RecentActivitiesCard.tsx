// Recent Activities card — fed by real backend events from /api/admin/dashboard/activities.

import { Clock, GraduationCap, Users, BookOpen, UserPlus, CheckCircle, FileText, Bell } from "lucide-react";
import { DashboardEmptyState } from "./DashboardStates";
import { formatTimeAgo } from "./dashboard.utils";
import type { RecentActivityItem } from "./dashboard.api";

interface ActivityDisplay {
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bubble: string;
}

const ACTIVITY_PRESETS: Record<RecentActivityItem["kind"], ActivityDisplay> = {
  STUDENT_REGISTERED: {
    icon: UserPlus,
    accent: "text-sky-blue",
    bubble: "from-sky-blue/30 to-sky-blue/5",
  },
  STUDENT_ENROLLED: {
    icon: Users,
    accent: "text-sky-blue",
    bubble: "from-sky-blue/30 to-sky-blue/5",
  },
  TEACHER_REGISTERED: {
    icon: GraduationCap,
    accent: "text-primary",
    bubble: "from-primary/30 to-primary/5",
  },
  CLASS_CREATED: {
    icon: BookOpen,
    accent: "text-jp-red",
    bubble: "from-sakura/40 to-sakura/5",
  },
  HOMEWORK_SUBMITTED: {
    icon: FileText,
    accent: "text-green-500",
    bubble: "from-green-400/30 to-green-400/5",
  },
  EXAM_COMPLETED: {
    icon: CheckCircle,
    accent: "text-amber-500",
    bubble: "from-amber-400/30 to-amber-400/5",
  },
  CONTENT_APPROVED: {
    icon: CheckCircle,
    accent: "text-emerald-500",
    bubble: "from-emerald-400/30 to-emerald-400/5",
  },
  NOTIFICATION_SENT: {
    icon: Bell,
    accent: "text-purple-500",
    bubble: "from-purple-400/30 to-purple-400/5",
  },
};

export interface RecentActivitiesCardProps {
  items: ReadonlyArray<RecentActivityItem>;
  loading?: boolean;
}

export function RecentActivitiesCard({ items, loading }: RecentActivitiesCardProps) {
  return (
    <section
      className="card-base p-5 flex flex-col h-full min-h-[380px]"
      aria-label="Recent activities"
    >
      <header className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-display font-bold text-sm text-primary-col flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Activities
          </h2>
          <p className="text-[11px] text-muted-col mt-0.5">
            Newest platform events in real time
          </p>
        </div>
        <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
          {items.length} {items.length === 1 ? "event" : "events"}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <DashboardEmptyState
            title="No recent activity"
            description="New students, teachers and classes will appear here as they happen."
          />
        ) : (
          <ol className="space-y-3" role="list">
            {items.map((item) => {
              const preset = ACTIVITY_PRESETS[item.kind];
              const Icon = preset.icon;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${preset.bubble} flex items-center justify-center shrink-0 shadow-inner`}
                  >
                    <Icon className={`w-4 h-4 ${preset.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary-col truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-col truncate mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                  <time
                    className="text-[10px] text-muted-col shrink-0 mt-0.5"
                    dateTime={item.timestamp}
                  >
                    {formatTimeAgo(item.timestamp)}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
