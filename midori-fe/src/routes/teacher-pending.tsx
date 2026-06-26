import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SakuraBg } from "@/components/sakura-bg";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Hourglass,
  Clock,
  CheckCircle2,
  Circle,
  Home,
  LogOut,
  Mail,
  Info,
  RefreshCw,
  Loader2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/teacher-pending")({
  component: TeacherPendingPage,
});

// ── Timeline step types ──────────────────────────────────────────────────────
type TimelineStep = {
  label: string;
  status: "done" | "active" | "pending";
};

// ── Static checklist items ───────────────────────────────────────────────────
const applicationItems = [
  { label: "Application submitted successfully", done: true },
  { label: "Email verified", done: true },
  { label: "Waiting for administrator review", done: true },
  { label: "Teacher dashboard access will be granted after approval", done: false },
] as const;

// ── 4-step progress timeline ──────────────────────────────────────────────────
const timelineSteps: TimelineStep[] = [
  { label: "Account Registered", status: "done" },
  { label: "Email Verified", status: "done" },
  { label: "Waiting for Approval", status: "active" },
  { label: "Teacher Dashboard Access", status: "pending" },
];

// ── "What happens next" steps ────────────────────────────────────────────────
const nextSteps = [
  "Administrator reviews your application",
  "Application gets approved",
  "Teacher dashboard becomes available",
] as const;

// Future improvement:
// Replace polling with WebSocket or Supabase Realtime for instant status updates.
const POLL_INTERVAL_MS = 30_000;

function TeacherPendingPage() {
  const navigate = useNavigate();
  const { user, logout, updateCurrentUser } = useAuth();

  // ── React Query: Poll profile/me every 30s ─────────────────────────────
  const {
    data: profile,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["teacher-pending-status"],
    queryFn: async () => {
      const res = await authApi.getMe();
      return res;
    },
    enabled: !!user,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const isRejected = profile?.status === "REJECTED";
  const rejectionReason = profile?.rejectionReason?.trim();

  // ── Detect approval and redirect ──────────────────────────────────────
  if (profile && user) {
    if (profile.status === "ACTIVE" && user.status !== "active") {
      toast.success("Your teacher account has been approved.");
      updateCurrentUser({ status: "active" });
      navigate({ to: "/teacher" });
    }
  }

  const handleLogout = async () => {
    logout();
    await navigate({ to: "/login" });
  };

  const handleCheckNow = async () => {
    await refetch();
  };

  return (
    <AuthGuard pendingOnly>
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
        <SakuraBg count={14} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-2xl space-y-6"
        >
          {/* ── User Info Banner ─────────────────────────────────────────── */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-center"
            >
              <h1 className="text-2xl md:text-3xl font-extrabold font-display text-foreground mb-1">
                Welcome back, {user.name}!
              </h1>
              <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
            </motion.div>
          )}

          {/* ── Main Status Card ─────────────────────────────────────────── */}
          <Card className="bg-card/80 backdrop-blur-xl border border-border shadow-xl">
            <CardHeader className="text-center pb-2">
              {isRejected ? (
                <>
                  <div className="flex justify-center mb-4">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-xl shadow-red-500/25"
                      aria-hidden="true"
                    >
                      <XCircle className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>

                  <Badge
                    variant="destructive"
                    className="mx-auto mb-3 text-xs font-bold tracking-wide uppercase px-3 py-1"
                  >
                    Application Rejected
                  </Badge>

                  <CardTitle className="text-2xl font-extrabold text-foreground font-display">
                    Your teacher application was not approved
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-base pt-1">
                    Unfortunately, your teacher account application has been rejected.
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/25"
                      aria-hidden="true"
                    >
                      <Hourglass className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>

                  <Badge
                    variant="warning"
                    className="mx-auto mb-3 text-xs font-bold tracking-wide uppercase px-3 py-1"
                  >
                    Pending Approval
                  </Badge>

                  <CardTitle className="text-2xl font-extrabold text-foreground font-display">
                    Your teacher application is under review
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-base pt-1">
                    Your teacher account has been created successfully and is currently awaiting
                    administrator approval.
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {isRejected && rejectionReason ? (
                <Alert variant="destructive" className="py-3">
                  <XCircle className="w-4 h-4" aria-hidden="true" />
                  <AlertDescription className="text-foreground text-sm">
                    <span className="font-semibold">Reason: </span>
                    <span className="text-red-700 dark:text-red-300 break-words">
                      {rejectionReason}
                    </span>
                  </AlertDescription>
                </Alert>
              ) : null}

              {/* ── Application Information ───────────────────────────────── */}
              <section aria-labelledby="app-info-heading">
                <h2
                  id="app-info-heading"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2.5"
                >
                  Application Status
                </h2>
                <div className="space-y-2">
                  {applicationItems.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        item.done
                          ? "bg-green-500/10 dark:bg-green-500/15 border border-green-500/25 dark:border-green-500/30 text-green-700 dark:text-green-300"
                          : "bg-muted border border-border text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${item.done ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                      />
                      <span className={item.done ? "" : "italic"}>{item.label}</span>
                      {item.done ? (
                        <CheckCircle2
                          className="ml-auto w-4 h-4 text-green-600 dark:text-green-400"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Progress Timeline ────────────────────────────────────── */}
              <section aria-labelledby="timeline-heading">
                <h2
                  id="timeline-heading"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3"
                >
                  Progress
                </h2>
                <div className="relative">
                  {/* Connector line */}
                  <div
                    className="absolute top-4 left-5 right-5 h-0.5 bg-border dark:bg-white/10"
                    aria-hidden="true"
                  />

                  <div className="flex justify-between relative">
                    {timelineSteps.map((step, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        {/* Step circle */}
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                            step.status === "done"
                              ? "bg-green-500 border-green-500 text-white"
                              : step.status === "active"
                                ? "bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-400/30"
                                : "bg-muted border-border text-muted-foreground"
                          }`}
                          aria-label={`${step.label}: ${step.status === "done" ? "completed" : step.status === "active" ? "in progress" : "pending"}`}
                        >
                          {step.status === "done" ? (
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          ) : step.status === "active" ? (
                            <Hourglass className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Circle className="w-4 h-4" aria-hidden="true" />
                          )}
                        </div>
                        {/* Step label */}
                        <span
                          className={`text-[10px] font-semibold text-center leading-tight max-w-[72px] ${
                            step.status === "done"
                              ? "text-green-600 dark:text-green-400"
                              : step.status === "active"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── Estimated Review Time ────────────────────────────────── */}
              {!isRejected && (
                <Alert variant="warning" className="py-3">
                  <Info className="w-4 h-4" aria-hidden="true" />
                  <AlertDescription className="text-foreground text-sm">
                    Teacher applications are typically reviewed within{" "}
                    <span className="font-semibold">1–3 business days</span>.
                  </AlertDescription>
                </Alert>
              )}

              {/* ── What Happens Next ────────────────────────────────────── */}
              {!isRejected && (
                <section aria-labelledby="next-steps-heading">
                  <Card className="bg-muted/50 border border-border">
                    <CardHeader className="pb-3 pt-4 px-5">
                      <CardTitle className="text-base font-bold text-foreground">
                        What happens next?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                      <ol className="space-y-2.5" aria-label="Next steps">
                        {nextSteps.map((label, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary text-xs font-black flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="text-sm text-muted-foreground pt-0.5">{label}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* ── Action Buttons ───────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button
                  asChild
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold shadow-lg shadow-primary/25 transition-all"
                  aria-label="Back to home"
                >
                  <Link to="/">
                    <Home className="w-4 h-4" aria-hidden="true" />
                    Back to Home
                  </Link>
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1 border-border text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all"
                  aria-label="Logout of your account"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Logout
                </Button>
              </div>

              {/* ── Manual status refresh ─────────────────────────────── */}
              <Button
                onClick={handleCheckNow}
                variant="secondary"
                disabled={isFetching}
                className="w-full"
                aria-label="Check teacher approval status now"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Checking status…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Check Status Now
                  </>
                )}
              </Button>

              {/* ── Support Section ──────────────────────────────────────── */}
              <section aria-labelledby="support-heading" className="text-center pt-1">
                <h2 id="support-heading" className="sr-only">
                  Support
                </h2>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-muted-foreground">Need help?</p>
                  <p className="text-xs text-muted-foreground">
                    If your application has been pending for an extended period, please contact{" "}
                    <a
                      href="mailto:support@midori.app"
                      className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      support@midori.app
                    </a>
                  </p>
                </div>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
