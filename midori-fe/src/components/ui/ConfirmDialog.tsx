"use client";

import { motion } from "framer-motion";
import { Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: "destructive" | "primary" | "warning";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  confirmVariant = "destructive",
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDestructive = confirmVariant === "destructive";
  const isWarning = confirmVariant === "warning";
  const isPrimary = confirmVariant === "primary";

  let iconColor = "text-red-500";
  let iconBg = "bg-red-500/10";
  let Icon = Trash2;

  if (isWarning) {
    iconColor = "text-amber-500";
    iconBg = "bg-amber-500/10";
    Icon = AlertTriangle;
  } else if (isPrimary) {
    iconColor = "text-emerald-500";
    iconBg = "bg-emerald-500/10";
    Icon = CheckCircle2;
  }

  let buttonClass = "flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md hover:bg-red-600 transition";
  if (isWarning) {
    buttonClass = "flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold shadow-md hover:bg-amber-600 transition";
  } else if (isPrimary) {
    buttonClass = "flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-md hover:bg-emerald-600 transition";
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 space-y-4">
          <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mx-auto`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <h3 className="font-display font-bold text-primary-col text-lg text-center">{title}</h3>
          <p className="text-secondary-col text-sm text-center">{message}</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t separator">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={buttonClass}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
