import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, UserPlus, Mail, CheckCircle2, XCircle, Trash2,
  EyeOff, Send, Users, TrendingUp, Clock, Shield, ChevronRight
} from "lucide-react";
import { PageHeader, Card, EmptyState, Progress, LevelBadge } from "@/components/page-ui";
import { MOCK_CLASSES, type StudentInvitation } from "@/data/teacher-classes";
import { cn } from "@/lib/utils";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function InvitationStatusBadge({ status }: { status: StudentInvitation["status"] }) {
  const cfg: Record<string, { label: string; dot: string; text: string }> = {
    Active:   { label: "Active",   dot: "bg-[var(--status-active)]",   text: "text-[var(--status-active)]" },
    Invited:  { label: "Invited",  dot: "bg-[var(--status-pending)]",  text: "text-[var(--status-pending)]" },
    Rejected: { label: "Rejected", dot: "bg-[var(--status-rejected)]", text: "text-[var(--status-rejected)]" },
    Removed:  { label: "Removed",  dot: "bg-gray-400",               text: "text-gray-400" },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const TEACHER_ADMIN_EMAILS = new Set([
  "teacher@midori.vn",
  "admin@midori.vn",
  "teacher@example.com",
  "admin@example.com",
]);

/* ─── Main Component ──────────────────────────────────────────────────────── */

export const Route = createFileRoute("/teacher/classes/$classId/students")({
  component: TeacherClassStudentsPage,
});

function TeacherClassStudentsPage() {
  const { classId } = Route.useParams();
  const cls = MOCK_CLASSES.find((c) => c.id === classId);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [invitations, setInvitations] = useState<StudentInvitation[]>(
    cls ? [...cls.invitations] : []
  );

  const activeCount = invitations.filter((i) => i.status === "Active").length;
  const pendingCount = invitations.filter((i) => i.status === "Invited").length;
  const rejectedCount = invitations.filter((i) => i.status === "Rejected").length;
  const avgProgress = useMemo(() => {
    const actives = invitations.filter((i) => i.status === "Active");
    if (actives.length === 0) return 0;
    return Math.round(actives.reduce((s, i) => s + i.progress, 0) / actives.length);
  }, [invitations]);

  const handleInvite = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setInviteError("");
      setInviteSuccess("");

      const trimmed = inviteEmail.trim();
      if (!trimmed) {
        setInviteError("Email is required.");
        return;
      }
      if (!validateEmail(trimmed)) {
        setInviteError("Please enter a valid email address.");
        return;
      }
      const existsActive = invitations.some(
        (i) => i.email.toLowerCase() === trimmed.toLowerCase() && i.status === "Active"
      );
      if (existsActive) {
        setInviteError("This student is already an active member of this class.");
        return;
      }
      const existsPending = invitations.some(
        (i) => i.email.toLowerCase() === trimmed.toLowerCase() && i.status === "Invited"
      );
      if (existsPending) {
        setInviteError("An invitation has already been sent to this email.");
        return;
      }
      if (TEACHER_ADMIN_EMAILS.has(trimmed.toLowerCase())) {
        setInviteError("Cannot invite a teacher or admin account.");
        return;
      }

      const newInv: StudentInvitation = {
        id: `local-${Date.now()}`,
        name: "Pending Student",
        email: trimmed,
        status: "Invited",
        progress: 0,
        averageScore: null,
        invitedAt: new Date().toISOString().split("T")[0],
        lastActive: "Not joined yet",
      };

      setInvitations((prev) => [newInv, ...prev]);
      setInviteEmail("");
      setInviteMessage("");
      setInviteSuccess("Invitation sent. The student must accept it before joining this class.");
    },
    [inviteEmail, inviteMessage, invitations]
  );

  // Not found
  if (!cls) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            to="/teacher/classes"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Classes
          </Link>
        </div>
        <EmptyState
          title="Class not found"
          hint="The class you are looking for does not exist or has been removed."
          action={
            <Link
              to="/teacher/classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Classes
            </Link>
          }
        />
      </div>
    );
  }

  const basePath = `/teacher/classes/${classId}`;

  return (
    <div className="space-y-5">
      {/* ── A. Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Class Students"
        subtitle={`${cls.name} · Invite students by Gmail and manage class members.`}
        action={
          <div className="flex items-center gap-2">
            <Link
              to={basePath}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
            <Link
              to={`${basePath}/lessons`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite Student
            </Link>
          </div>
        }
      />

      {/* Level + Description */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm flex flex-wrap items-center gap-3">
        <LevelBadge level={cls.level} />
        <p className="text-sm text-muted-foreground">
          {cls.description}
        </p>
      </div>

      {/* ── B. Overview Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { label: "Total Students",    value: invitations.filter(i => i.status === "Active").length, icon: <Users className="w-4 h-4" />,          accent: "primary" as const },
          { label: "Active",            value: activeCount,    icon: <CheckCircle2 className="w-4 h-4" />,  accent: "sakura" as const },
          { label: "Pending",           value: pendingCount,   icon: <Clock className="w-4 h-4" />,         accent: "sky" as const },
          { label: "Rejected",          value: rejectedCount,  icon: <XCircle className="w-4 h-4" />,      accent: "red" as const },
          { label: "Avg Progress",      value: `${avgProgress}%`, icon: <TrendingUp className="w-4 h-4" />, accent: "primary" as const },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-lg grid place-items-center ${
                stat.accent === "primary" ? "bg-primary/15 text-primary" :
                stat.accent === "sakura"  ? "bg-sakura/40 text-jp-red" :
                stat.accent === "sky"     ? "bg-sky-blue/20 text-sky-blue" :
                                           "bg-[var(--jp-red)]/15 text-[var(--jp-red)]"
              }`}>{stat.icon}</div>
              <div className="font-display font-black text-lg">{stat.value}</div>
              <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── C. Invite Student Form ────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">Invite Student</h2>
            <p className="text-[10px] text-muted-col">
              Students only join this class after accepting the invitation.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {inviteSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Invitation sent</p>
                <p className="text-xs text-green-700 dark:text-green-400/80 mt-0.5">
                  {inviteSuccess}
                </p>
              </div>
              <button
                onClick={() => setInviteSuccess("")}
                className="text-xs text-muted-col hover:text-foreground ml-auto"
              >
                Dismiss
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Student Gmail <span className="text-[var(--jp-red)]">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                    placeholder="student@gmail.com"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl bg-white/95 border text-sm outline-none transition-all",
                      "bg-white/95 border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200",
                      "focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm",
                      inviteError && "border-[var(--jp-red)] focus:ring-[var(--jp-red)]/30"
                    )}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Message <span className="text-[10px] text-muted-col font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Welcome to our class!"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
                  />
                </div>
              </div>

              {inviteError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-[var(--jp-red)] font-medium"
                >
                  {inviteError}
                </motion.p>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
                Send Invitation
              </button>
            </form>
          )}
        </AnimatePresence>
      </Card>

      {/* ── D. Student / Invitation List ──────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          Class Members
          <span className="text-[10px] text-muted-col font-normal ml-auto">
            {invitations.length} total
          </span>
        </h2>

        {invitations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="pb-2.5 pr-4 font-semibold text-muted-col uppercase tracking-wider text-[10px]">Student</th>
                  <th className="pb-2.5 pr-4 font-semibold text-muted-col uppercase tracking-wider text-[10px]">Status</th>
                  <th className="pb-2.5 pr-4 font-semibold text-muted-col uppercase tracking-wider text-[10px] hidden sm:table-cell">Progress</th>
                  <th className="pb-2.5 pr-4 font-semibold text-muted-col uppercase tracking-wider text-[10px] hidden md:table-cell">Avg Score</th>
                  <th className="pb-2.5 pr-4 font-semibold text-muted-col uppercase tracking-wider text-[10px] hidden lg:table-cell">Date</th>
                  <th className="pb-2.5 pr-4 font-semibold text-muted-col uppercase tracking-wider text-[10px] hidden lg:table-cell">Last Active</th>
                  <th className="pb-2.5 text-right font-semibold text-muted-col uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-muted/20 transition">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold">
                            {inv.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[140px]">{inv.name}</p>
                          <p className="text-[10px] text-muted-col truncate max-w-[160px]">{inv.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <InvitationStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      {inv.status === "Active" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-hero rounded-full"
                              style={{ width: `${inv.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-foreground">{inv.progress}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-col">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      {inv.averageScore !== null ? (
                        <span className="font-semibold text-foreground">{inv.averageScore.toFixed(1)}</span>
                      ) : (
                        <span className="text-muted-col">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell text-muted-col">
                      {inv.joinedAt || inv.invitedAt || "—"}
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell text-muted-col">
                      {inv.lastActive}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {inv.status === "Invited" && (
                          <button
                            title="Resend Invitation"
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {inv.status === "Active" && (
                          <>
                            <Link
                              to={`${basePath}/progress`}
                              title="View Progress"
                              className="p-1.5 rounded-lg hover:bg-sky-blue/10 text-sky-blue transition"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              title="Remove Student"
                              className="p-1.5 rounded-lg hover:bg-[var(--jp-red)]/10 text-[var(--jp-red)] transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {inv.status === "Rejected" && (
                          <span className="text-[10px] text-muted-col px-2 py-1 rounded-lg bg-muted/40">
                            <EyeOff className="w-3 h-3 inline mr-1" />
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No students yet"
            hint="Invite students by Gmail to get started."
            action={
              <button
                onClick={() => document.getElementById("invite-email-input")?.focus()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition mt-4"
              >
                <UserPlus className="w-4 h-4" />
                Invite Student
              </button>
            }
          />
        )}
      </Card>

      {/* ── F. Rules / Info Card ──────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          Class Rules
        </h2>
        <ul className="space-y-2">
          {[
            "Teacher invites students by Gmail. Students only join after accepting the invitation.",
            "Student cannot see class lessons before joining.",
            "Teacher only manages students in this class — not all students in the platform.",
            "Active students show progress and scores. Pending and rejected students are listed with their invitation status.",
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
