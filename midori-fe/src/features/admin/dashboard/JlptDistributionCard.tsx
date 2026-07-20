// Classes by JLPT Level — bar chart card.
//
// Data source: AdminClassResponse[].level (a JLPT enum value) from
// GET /api/admin/classes. We render one bar per N5..N1 (count = 0 still gets
// rendered so the band shape is consistent across renders).

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award } from "lucide-react";
import { DashboardEmptyState } from "./DashboardStates";
import { formatCount, type JlptBucket } from "./dashboard.utils";

export interface JlptDistributionCardProps {
  buckets: ReadonlyArray<JlptBucket>;
  /** Set true when the parent is still loading. */
  loading?: boolean;
  /** Total classes count, used to express "0 / 0" emptiness clearly. */
  totalClasses: number;
}

export function JlptDistributionCard({
  buckets,
  loading,
  totalClasses,
}: JlptDistributionCardProps) {
  const hasAny = buckets.some((b) => b.count > 0);

  return (
    <section
      className="card-base p-5 flex flex-col h-full min-h-[380px]"
      aria-label="Classes by JLPT level"
    >
      <header className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-display font-bold text-sm text-primary-col flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Students by JLPT Level
          </h2>
          <p className="text-[11px] text-muted-col mt-0.5">Distribution across N5 → N1</p>
        </div>
        <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
          Total {formatCount(totalClasses)}
        </span>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : !hasAny ? (
        <DashboardEmptyState
          title="No classes yet"
          description="Once teachers start creating classes, their JLPT distribution will appear here."
        />
      ) : (
        <>
          <div className="flex-1 w-full min-h-[200px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={buckets as JlptBucket[]}
                margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
              >
                <XAxis
                  dataKey="level"
                  tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 0.05)" }}
                  contentStyle={{
                    background: "rgba(15,20,40,0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    color: "#F3F4F6",
                    backdropFilter: "blur(12px)",
                  }}
                  formatter={(value: number) => [formatCount(value), "Classes"]}
                  labelFormatter={(label) => `Level ${label}`}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {buckets.map((bucket) => (
                    <Cell key={bucket.level} fill={bucket.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid grid-cols-5 gap-2 mt-4 text-center">
            {buckets.map((bucket) => (
              <li key={bucket.level} className="flex flex-col items-center">
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full mb-1"
                  style={{ backgroundColor: bucket.color }}
                />
                <span className="text-[11px] font-semibold text-primary-col tabular-nums">
                  {formatCount(bucket.count)}
                </span>
                <span className="text-[10px] text-muted-col">{bucket.level}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
