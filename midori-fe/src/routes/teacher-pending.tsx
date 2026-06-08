import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SakuraBg } from "@/components/sakura-bg";
import { motion } from "framer-motion";
import { getDashboardPath, rolePath, useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/teacher-pending")({
  component: TeacherPendingPage,
});

function TeacherPendingPage() {
  const { user, loaded } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loaded) return;

    if (!user) {
      nav({ to: "/login" });
      return;
    }

    if (getDashboardPath(user) !== "/teacher-pending") {
      nav({ to: rolePath(user.role) });
    }
  }, [loaded, nav, user]);

  if (!loaded || !user || getDashboardPath(user) !== "/teacher-pending") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <SakuraBg count={14} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-lg glass rounded-3xl p-10 md:p-12 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-hero flex items-center justify-center mb-6 shadow-lg shadow-primary/30"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </motion.div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-widest mb-5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Awaiting Approval
        </div>

        <h1 className="text-3xl font-extrabold font-display tracking-tight mb-3">
          Your application is in review 🌸
        </h1>

        <p className="text-muted-foreground leading-relaxed mb-8 text-base">
          Thank you for applying to teach on <strong className="text-foreground font-semibold">MIDORI</strong>. Our admin team will review your application and credentials shortly. You'll be notified once approved.
        </p>

        <div className="space-y-3 mb-8 text-left">
          {[
            { icon: "📋", label: "Application submitted", done: true },
            { icon: "🔍", label: "Admin reviewing credentials", done: true },
            { icon: "✅", label: "Approval & account activation", done: false },
          ].map((step, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${step.done ? "bg-green-50 dark:bg-green-900/20" : "bg-muted/50"}`}>
              <span className="text-xl">{step.icon}</span>
              <span className={`text-sm font-medium ${step.done ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              {step.done ? (
                <svg className="ml-auto w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="ml-auto text-xs text-muted-foreground">pending</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="w-full px-4 py-3.5 rounded-xl bg-gradient-hero text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl transition-all text-center"
          >
            Back to home
          </Link>
          <Link
            to="/login"
            className="w-full px-4 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted/50 transition-all text-center text-muted-foreground"
          >
            Sign in as student instead
          </Link>
        </div>

        <p className="mt-5 text-xs text-muted-foreground/70">
          Questions? Contact us at{" "}
          <a href="mailto:support@midori.app" className="text-primary font-medium underline underline-offset-2">
            support@midori.app
          </a>
        </p>
      </motion.div>
    </div>
  );
}
