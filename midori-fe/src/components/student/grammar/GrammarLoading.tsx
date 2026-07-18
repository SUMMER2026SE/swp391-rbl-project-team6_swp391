"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrammarLoadingProps {
  className?: string;
}

export const GrammarLoading = memo(function GrammarLoading({
  className,
}: GrammarLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[240px]", className)}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading grammar...</p>
      </div>
    </div>
  );
});
