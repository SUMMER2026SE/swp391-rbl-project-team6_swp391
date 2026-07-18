"use client";

interface StatusBadgeProps {
  status?: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = status || "active";
  const styles: Record<string, { color: string; bg: string }> = {
    active: { color: "text-[var(--status-active)]", bg: "bg-[var(--status-active)]" },
    inactive: { color: "text-muted-col", bg: "bg-muted" },
    pending: { color: "text-[var(--status-pending)]", bg: "bg-[var(--status-pending)]" },
    draft: { color: "text-[var(--status-pending)]", bg: "bg-[var(--status-pending)]" },
  };

  const style = styles[s] || styles.active;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.bg} ${style.color}`}
    >
      {s === "active" ? "Published" : s === "inactive" ? "Draft" : s}
    </span>
  );
}
