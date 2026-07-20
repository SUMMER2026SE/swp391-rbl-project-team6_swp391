// KPI cards used on the first row of the Admin Dashboard.

import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { formatCount } from "./dashboard.utils";

export type KpiKey = "students" | "teachers" | "classes" | "completion";

interface KpiDefinition {
  key: KpiKey;
  label: string;
  icon: LucideIcon;
  /** Tailwind class for the icon bubble accent. */
  accentClass: string;
}

export const KPI_DEFINITIONS: KpiDefinition[] = [
  {
    key: "students",
    label: "Total Students",
    icon: Users,
    accentClass: "from-sky-blue/30 to-sky-blue/10 text-sky-blue",
  },
  {
    key: "teachers",
    label: "Total Teachers",
    icon: GraduationCap,
    accentClass: "from-primary/30 to-primary/10 text-primary",
  },
  {
    key: "classes",
    label: "Total Classes",
    icon: BookOpen,
    accentClass: "from-sakura/40 to-sakura/10 text-jp-red",
  },
  {
    key: "completion",
    label: "Completion Rate",
    icon: TrendingUp,
    accentClass: "from-lavender/40 to-lavender/10 text-primary",
  },
];

export interface KpiCardProps {
  definition: KpiDefinition;
  /** The number to display. `null` means "not available, show —". */
  value: number | null;
  /** Optional suffix, e.g. "%" for rates. Ignored when value === null. */
  suffix?: string;
}

/**
 * Single KPI tile — icon, label, big number. Designed to have a balanced
 * min-height across all four tiles so they line up in the grid.
 */
export function KpiCard({ definition, value, suffix }: KpiCardProps) {
  const { label, icon: Icon, accentClass } = definition;
  const display =
    value === null || Number.isNaN(value) ? "—" : `${formatCount(value)}${suffix ?? ""}`;
  return (
    <div className="card-base p-4 flex flex-col min-h-[6.75rem] group">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentClass} flex items-center justify-center shadow-inner`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wider font-bold leading-tight text-muted-col">
        {label}
      </span>
      <div className="font-display font-black text-2xl text-primary-col mt-auto pt-1 tabular-nums">
        {display}
      </div>
    </div>
  );
}
