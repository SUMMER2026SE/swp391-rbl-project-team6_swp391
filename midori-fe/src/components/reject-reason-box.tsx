import { AlertTriangle } from "lucide-react";

interface RejectReasonBoxProps {
  reason?: string | null;
  className?: string;
}

export function RejectReasonBox({ reason, className = "" }: RejectReasonBoxProps) {
  if (!reason) return null;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 ${className}`}
    >
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-red-600 dark:text-red-400">Reject Reason</p>
        <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed mt-0.5">
          {reason.trim() || "No reason provided"}
        </p>
      </div>
    </div>
  );
}
