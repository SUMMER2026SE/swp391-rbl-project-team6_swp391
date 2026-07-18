import React from "react";
import { AlertCircle } from "lucide-react";

interface ValidationBannerProps {
  errors: string[];
}

export const ValidationBanner: React.FC<ValidationBannerProps> = React.memo(({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <div className="px-4 py-2.5 rounded-lg bg-[var(--status-rejected)]/10 border border-[var(--status-rejected)]/20 text-[var(--status-rejected)] text-xs flex items-center gap-2 mt-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <div className="flex-1 font-medium">
        {errors.join(" | ")}
      </div>
    </div>
  );
});

ValidationBanner.displayName = "ValidationBanner";
