import { Button } from "@/components/ui/button";
import { X, Plus, ArrowLeft } from "lucide-react";

interface SuccessBannerProps {
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  onCreateAnother?: () => void;
  onGoBack?: () => void;
}

export function SuccessBanner({ title, message, children, onDismiss, onCreateAnother, onGoBack }: SuccessBannerProps) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50/60 dark:border-green-800 dark:bg-green-950/30 px-4 py-3 text-sm text-green-800 dark:text-green-200 shadow-sm backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-500 text-white text-xs font-bold">&#10003;</div>
        <div className="min-w-0 flex-1">
          {title && <div className="font-semibold">{title}</div>}
          {(message || children) && (
            <div className="text-green-700 dark:text-green-300 mt-0.5">{message}{children}</div>
          )}
          {(onCreateAnother || onGoBack) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onCreateAnother && (
                <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300" onClick={onCreateAnother}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />Create another
                </Button>
              )}
              {onGoBack && (
                <Button size="sm" variant="ghost" className="text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900" onClick={onGoBack}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back
                </Button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="shrink-0 rounded-md p-1 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900 transition">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
