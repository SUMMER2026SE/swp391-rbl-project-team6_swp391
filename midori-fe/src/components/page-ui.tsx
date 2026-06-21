import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, subtitle, action, showBack }: { title: string; subtitle?: string; action?: ReactNode; showBack?: boolean }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/70 dark:border-white/20 flex items-center justify-center hover:bg-white/90 dark:hover:bg-white/20 transition-all duration-200 shadow-sm"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-extrabold font-display text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, accent = "primary" }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; accent?: "primary" | "sakura" | "sky" | "red" }) {
  const ring = { primary: "bg-primary/15 text-primary", sakura: "bg-sakura/40 text-jp-red", sky: "bg-sky-blue/20 text-sky-blue", red: "bg-jp-red/15 text-jp-red" }[accent];
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {icon && <div className={`w-10 h-10 rounded-xl grid place-items-center ${ring}`}>{icon}</div>}
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
      <div className="mt-3 font-display font-extrabold text-2xl">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </motion.div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl p-5 border border-border/50 shadow-sm bg-card text-card-foreground ${className}`}>{children}</div>;
}

export function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = { N5: "bg-primary/15 text-primary", N4: "bg-sky-blue/20 text-sky-blue", N3: "bg-accent text-accent-foreground", N2: "bg-jp-red/15 text-jp-red", N1: "bg-foreground text-background" };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[level] || "bg-muted"}`}>{level}</span>;
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <motion.div initial={{width:0}} animate={{width:`${value}%`}} transition={{duration:0.8}} className="h-full bg-gradient-hero" />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-10 text-center">
      <div className="text-5xl mb-3">🌸</div>
      <div className="font-display font-bold text-lg">{title}</div>
      {hint && <div className="text-sm text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}