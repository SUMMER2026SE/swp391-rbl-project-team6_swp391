import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Send, Bell, Clock, Users, Eye,
  CheckCircle, Calendar, AlertTriangle, X, ChevronDown,
  Loader2, Search, Zap, Info, Star, LayoutList,
  ChevronLeft,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type NotificationType = "announcement" | "update" | "system" | "warning" | "event";
type NotificationStatus = "sent" | "scheduled" | "draft";

type DeliveryEntry = {
  time: string;
  status: string;
};

type Notification = {
  id: number;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  recipients: string;
  recipientCount: number;
  openRate: number;
  sentAt: string;
  scheduledAt?: string;
  createdBy: string;
  deliveryHistory: DeliveryEntry[];
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockUsers = [
  { id: "u1", name: "Yuki Tanaka",  email: "yuki.t@mail.com",   role: "student", level: "N3" },
  { id: "u2", name: "Taro Yamamoto", email: "taro.y@midori.jp",  role: "teacher", level: "N1" },
  { id: "u3", name: "Sakura Hayashi",email: "sakura.h@mail.com",  role: "student", level: "N3" },
  { id: "u4", name: "Kenji Yamamoto",email: "kenji.y@mail.com",   role: "teacher", level: "N2" },
  { id: "u5", name: "Mei Lin Chen",  email: "mei.lin@mail.com",  role: "student", level: "N4" },
  { id: "u6", name: "Alex Kim",      email: "alex.k@mail.com",   role: "student", level: "N5" },
  { id: "u7", name: "Sofia Martinez",email: "sofia.m@mail.com",   role: "student", level: "N4" },
  { id: "u8", name: "Ravi Sharma",   email: "ravi.s@mail.com",   role: "student", level: "N5" },
  { id: "u9", name: "Park Joon-ho",  email: "joonho.p@midori.jp",role: "teacher", level: "N1" },
  { id: "u10",name: "Anna Kowalski", email: "anna.k@mail.com",    role: "student", level: "N4" },
];

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "New JLPT N3 Grammar Lesson Published",
    body: "Sakura Hayashi published a new grammar lesson on ながらも. Check it out and practice the patterns!",
    type: "announcement",
    status: "sent",
    recipients: "All students",
    recipientCount: 8420,
    openRate: 74,
    sentAt: "May 22, 2026",
    createdBy: "Admin",
    deliveryHistory: [
      { time: "May 22, 2026 09:00 AM", status: "Delivered to 8,420 recipients" },
      { time: "May 22, 2026 09:15 AM", status: "Open rate: 6,231 opens (74%)" },
    ],
  },
  {
    id: 2,
    title: "Weekly Leaderboard Update",
    body: "Top performers this week: Sakura Hayashi, Kenji Yamamoto, Mei Lin Chen. Congratulations to our champions!",
    type: "update",
    status: "sent",
    recipients: "All users",
    recipientCount: 12847,
    openRate: 68,
    sentAt: "May 19, 2026",
    createdBy: "Admin",
    deliveryHistory: [
      { time: "May 19, 2026 08:00 AM", status: "Delivered to 12,847 recipients" },
      { time: "May 19, 2026 08:30 AM", status: "Open rate: 8,736 opens (68%)" },
    ],
  },
  {
    id: 3,
    title: "System Maintenance Notice",
    body: "Scheduled maintenance on Sunday 2–4 AM JST. Some features may be temporarily unavailable.",
    type: "system",
    status: "sent",
    recipients: "All users",
    recipientCount: 12847,
    openRate: 91,
    sentAt: "May 16, 2026",
    createdBy: "Admin",
    deliveryHistory: [
      { time: "May 16, 2026 06:00 PM", status: "Delivered to 12,847 recipients" },
    ],
  },
  {
    id: 4,
    title: "New Teacher Approved: Hiroshi Tanaka",
    body: "We're excited to welcome Hiroshi Tanaka as our newest certified teacher! Check out his profile.",
    type: "announcement",
    status: "sent",
    recipients: "All students",
    recipientCount: 8420,
    openRate: 62,
    sentAt: "May 14, 2026",
    createdBy: "Admin",
    deliveryHistory: [
      { time: "May 14, 2026 10:00 AM", status: "Delivered to 8,420 recipients" },
    ],
  },
  {
    id: 5,
    title: "Content Guidelines Update",
    body: "We've updated our content guidelines for teachers. Please review before submitting new materials.",
    type: "system",
    status: "sent",
    recipients: "All teachers",
    recipientCount: 127,
    openRate: 85,
    sentAt: "May 10, 2026",
    createdBy: "Admin",
    deliveryHistory: [
      { time: "May 10, 2026 02:00 PM", status: "Delivered to 127 recipients" },
    ],
  },
  {
    id: 6,
    title: "N3 Mock Exam — Last Day to Submit",
    body: "The N3 Mock Exam submission deadline is tomorrow. Don't miss your chance to earn bonus XP!",
    type: "warning",
    status: "scheduled",
    recipients: "All students",
    recipientCount: 8420,
    openRate: 0,
    sentAt: "",
    scheduledAt: "May 27, 2026 08:00 AM",
    createdBy: "Admin",
    deliveryHistory: [],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
  announcement: { label: "Announcement", bg: "bg-[var(--status-announcement)]/12", text: "text-[var(--status-announcement)]", border: "border-[var(--status-announcement)]/25", icon: Megaphone },
  update:       { label: "Update",       bg: "bg-[var(--status-active)]/12",    text: "text-[var(--status-active)]",     border: "border-[var(--status-active)]/25",     icon: Star       },
  system:       { label: "System",       bg: "bg-[var(--status-pending)]/12", text: "text-[var(--status-pending)]",   border: "border-[var(--status-pending)]/25", icon: Zap        },
  warning:      { label: "Warning",      bg: "bg-[var(--status-pending)]/12", text: "text-[var(--status-pending)]",   border: "border-[var(--status-pending)]/25", icon: AlertTriangle },
  event:        { label: "Event",        bg: "bg-[var(--status-teacher)]/12", text: "text-[var(--status-teacher)]",   border: "border-[var(--status-teacher)]/25", icon: Bell      },
};

const STATUS_CONFIG: Record<NotificationStatus, { label: string; bg: string; text: string; border: string }> = {
  sent:       { label: "Sent",       bg: "badge-active",      text: "text-[var(--status-active)]",    border: "border-[var(--status-active)]/25"    },
  scheduled:  { label: "Scheduled",   bg: "badge-pending",     text: "text-[var(--status-pending)]",  border: "border-[var(--status-pending)]/25"  },
  draft:      { label: "Draft",      bg: "bg-muted",          text: "text-muted-col",               border: "border-[var(--border)]"              },
};

// ─── Toast ───────────────────────────────────────────────────────────────────

type Toast = { message: string; type: "success" | "error"; visible: boolean };

function Toast({ message, type, visible }: Toast) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border shadow-xl glass-modal ${
            type === "success"
              ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
              : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Notification Type Badge ───────────────────────────────────────────────────

function TypeBadge({ type }: { type: NotificationType }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: NotificationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {status === "sent" ? <CheckCircle className="w-3 h-3" />
       : status === "scheduled" ? <Clock className="w-3 h-3" />
       : <LayoutList className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

// ─── View Drawer ──────────────────────────────────────────────────────────────

function ViewDrawer({ notif, onClose }: { notif: Notification; onClose: () => void }) {
  const typeCfg = TYPE_CONFIG[notif.type];
  const Icon = typeCfg.icon;

  return (
    <>
      <motion.div className="fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      </motion.div>

      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg glass-modal rounded-l-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-right"
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-muted-col uppercase tracking-wider">Notification Details</span>
          </div>
          <StatusBadge status={notif.status} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-5">

          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-9 h-9 rounded-xl ${typeCfg.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${typeCfg.text}`} />
              </div>
              <TypeBadge type={notif.type} />
            </div>
            <h2 className="font-display font-black text-primary-col text-xl leading-tight">{notif.title}</h2>
          </div>

          {/* Message */}
          <div className="p-4 rounded-xl glass-surface">
            <p className="text-sm text-secondary-col leading-relaxed">{notif.body}</p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Recipients",         value: notif.recipients },
              { label: "Total Recipients",   value: notif.recipientCount.toLocaleString() },
              { label: notif.status === "sent" ? "Sent Date" : "Scheduled Date",
                value: notif.status === "sent" ? notif.sentAt : (notif.scheduledAt ?? "—") },
              { label: "Open Rate",           value: notif.openRate > 0 ? `${notif.openRate}%` : "—" },
              { label: "Created By",         value: notif.createdBy },
              { label: "Status",             value: STATUS_CONFIG[notif.status].label },
            ].map(row => (
              <div key={row.label} className="p-3 rounded-xl glass-surface">
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">{row.label}</p>
                <p className="text-sm font-semibold text-primary-col">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Delivery History */}
          {notif.deliveryHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LayoutList className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-secondary-col">Delivery History</span>
              </div>
              <div className="space-y-2">
                {notif.deliveryHistory.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl glass-surface">
                    <div className="w-2 h-2 rounded-full bg-[var(--status-active)] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-primary-col">{entry.time}</p>
                      <p className="text-[10px] text-muted-col mt-0.5">{entry.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t separator">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── New Notification Modal ───────────────────────────────────────────────────

type RecipientTarget = "all_users" | "all_students" | "all_teachers" | "specific" | "by_level" | "by_status";

const RECIPIENT_OPTIONS: { value: RecipientTarget; label: string }[] = [
  { value: "all_users",    label: "All users" },
  { value: "all_students", label: "All students" },
  { value: "all_teachers", label: "All teachers" },
  { value: "specific",    label: "Specific users" },
  { value: "by_level",    label: "By JLPT level" },
  { value: "by_status",   label: "By account status" },
];

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const ACCOUNT_STATUSES = ["Active", "Suspended", "Banned"];

function NewNotificationModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (n: Notification) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notifType, setNotifType] = useState<NotificationType>("announcement");
  const [recipientTarget, setRecipientTarget] = useState<RecipientTarget>("all_users");
  const [selectedUsers, setSelectedUsers] = useState<typeof mockUsers>([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [deliveryNow, setDeliveryNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [loading, setLoading] = useState(false);

  // Search
  const [searchQ, setSearchQ] = useState("");
  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return [];
    const q = searchQ.toLowerCase();
    return mockUsers.filter(u =>
      !selectedUsers.find(s => s.id === u.id) &&
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q))
    ).slice(0, 5);
  }, [searchQ, selectedUsers]);

  // Validation
  const isSpecific = recipientTarget === "specific";
  const isScheduled = !deliveryNow;
  const now = new Date();
  const minDate = now.toISOString().split("T")[0];
  const isPastDateTime = isScheduled && scheduledDate && scheduledTime &&
    new Date(`${scheduledDate}T${scheduledTime}`) <= now;

  const errors = {
    title: !title.trim(),
    body: !body.trim(),
    recipients: isSpecific && selectedUsers.length === 0,
    schedule: isScheduled && (!scheduledDate || !scheduledTime || isPastDateTime),
  };
  const hasError = errors.title || errors.body || errors.recipients || errors.schedule;

  const toggleUser = (u: typeof mockUsers[0]) => {
    setSelectedUsers(prev => prev.find(s => s.id === u.id)
      ? prev.filter(s => s.id !== u.id)
      : [...prev, u]
    );
  };

  const toggleStatus = (s: string) => {
    setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = async () => {
    if (hasError) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));

    const scheduledAt = !deliveryNow && scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : undefined;

    const recipientLabel = {
      all_users: "All users",
      all_students: "All students",
      all_teachers: "All teachers",
      specific: `${selectedUsers.length} specific users`,
      by_level: `JLPT ${selectedLevel}`,
      by_status: selectedStatuses.join(", "),
    }[recipientTarget];

    const newNotif: Notification = {
      id: Date.now(),
      title: title.trim(),
      body: body.trim(),
      type: notifType,
      status: deliveryNow ? "sent" : "scheduled",
      recipients: recipientLabel,
      recipientCount: recipientTarget === "all_users" ? 12847
        : recipientTarget === "all_students" ? 8420
        : recipientTarget === "all_teachers" ? 127
        : selectedUsers.length,
      openRate: 0,
      sentAt: deliveryNow
        ? new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "",
      scheduledAt,
      createdBy: "Admin",
      deliveryHistory: deliveryNow ? [
        { time: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }), status: "Delivered" },
      ] : [],
    };
    onSubmit(newNotif);
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-xl max-h-[92vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-col text-base">New Notification</h3>
              <p className="text-xs text-muted-col">Broadcast to users</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-auto p-6 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Title <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter notification title…"
              className={`w-full px-4 py-3 rounded-xl input-glass text-sm ${
                errors.title ? "border-[var(--status-rejected)]/50" : ""
              }`}
            />
            {errors.title && <p className="text-[10px] text-[var(--status-rejected)] mt-1">Title is required.</p>}
          </div>

          {/* Message */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Message <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your notification message…"
              rows={3}
              className={`w-full px-4 py-3 rounded-xl input-glass text-sm ${
                errors.body ? "border-[var(--status-rejected)]/50" : ""
              }`}
            />
            {errors.body && <p className="text-[10px] text-[var(--status-rejected)] mt-1">Message is required.</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Notification Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(TYPE_CONFIG) as NotificationType[]).map(t => {
                const cfg2 = TYPE_CONFIG[t];
                const TypeIcon = cfg2.icon;
                return (
                  <button
                    key={t}
                    onClick={() => setNotifType(t)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold capitalize transition-all duration-200 ${
                      notifType === t
                        ? `${cfg2.bg} ${cfg2.text} ${cfg2.border}`
                        : "glass-surface text-secondary-col"
                    }`}
                  >
                    <TypeIcon className="w-4 h-4" />
                    {cfg2.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Recipients <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
            </label>
            <select
              value={recipientTarget}
              onChange={e => setRecipientTarget(e.target.value as RecipientTarget)}
              className="w-full px-4 py-3 rounded-xl input-glass text-sm appearance-none cursor-pointer"
            >
              {RECIPIENT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-[var(--popover)]">{o.label}</option>
              ))}
            </select>

            {/* Specific users search */}
            {isSpecific && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 space-y-2"
              >
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-col absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search by name, email, or role…"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl search-input text-xs"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="rounded-xl glass-modal overflow-hidden">
                    {searchResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => toggleUser(u)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--accent)] transition text-left"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                          u.role === "teacher" ? "avatar-teacher" : "avatar-student"
                        }`}>
                          {u.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-primary-col truncate">{u.name}</p>
                          <p className="text-[10px] text-muted-col truncate">{u.email}</p>
                        </div>
                        <span className="text-[10px] text-muted-col capitalize">{u.role}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map(u => (
                      <div key={u.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/12 text-primary text-xs font-bold border border-primary/20">
                        {u.name}
                        <button onClick={() => toggleUser(u)} className="hover:text-primary-col transition">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {errors.recipients && (
                  <p className="text-[10px] text-[var(--status-rejected)]">Select at least one recipient.</p>
                )}
              </motion.div>
            )}

            {/* By JLPT level */}
            {recipientTarget === "by_level" && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex gap-2">
                {JLPT_LEVELS.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      selectedLevel === lvl
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "glass-surface text-secondary-col"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </motion.div>
            )}

            {/* By status */}
            {recipientTarget === "by_status" && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-wrap gap-2">
                {ACCOUNT_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border capitalize transition ${
                      selectedStatuses.includes(s)
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "glass-surface text-secondary-col"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Delivery Time */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Delivery Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeliveryNow(true)}
                className={`py-2.5 rounded-xl text-xs font-bold capitalize border transition flex items-center justify-center gap-2 ${
                  deliveryNow
                    ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/30"
                    : "glass-surface text-secondary-col"
                }`}
              >
                <Send className="w-3.5 h-3.5" /> Send now
              </button>
              <button
                onClick={() => setDeliveryNow(false)}
                className={`py-2.5 rounded-xl text-xs font-bold capitalize border transition flex items-center justify-center gap-2 ${
                  !deliveryNow
                    ? "bg-[var(--status-pending)]/15 text-[var(--status-pending)] border-[var(--status-pending)]/30"
                    : "glass-surface text-secondary-col"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Schedule
              </button>
            </div>

            {!deliveryNow && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-muted-col mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    min={minDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl input-glass text-xs ${
                      errors.schedule ? "border-[var(--status-rejected)]/50" : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-col mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl input-glass text-xs ${
                      errors.schedule ? "border-[var(--status-rejected)]/50" : ""
                    }`}
                  />
                </div>
                {errors.schedule && (
                  <p className="col-span-2 text-[10px] text-[var(--status-rejected)]">Select a future date and time.</p>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t separator flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={hasError || loading}
            className="flex-1 py-2.5 rounded-xl bg-primary/15 text-primary text-sm font-bold border border-primary/25 hover:bg-primary/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {deliveryNow ? "Sending…" : "Scheduling…"}</>
              : <><Bell className="w-4 h-4" /> {deliveryNow ? "Send Notification" : "Schedule Notification"}</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [viewing, setViewing] = useState<Notification | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const sentThisWeek = notifications.filter(n => n.status === "sent").length;
  const scheduledCount = notifications.filter(n => n.status === "scheduled").length;
  const totalRecipients = notifications.reduce((acc, n) => acc + n.recipientCount, 0);
  const avgOpenRate = notifications.filter(n => n.openRate > 0).length > 0
    ? Math.round(notifications.filter(n => n.openRate > 0).reduce((acc, n) => acc + n.openRate, 0) / notifications.filter(n => n.openRate > 0).length)
    : 0;

  const handleNewNotif = (notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
    setShowCreate(false);
    showToast(notif.status === "sent" ? "Notification sent successfully!" : "Notification scheduled successfully!");
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Notifications</h1>
          <p className="text-sm text-secondary-col mt-0.5">Broadcast announcements to users</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition"
        >
          <Bell className="w-4 h-4" /> New Notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Sent This Week",    value: sentThisWeek.toString(),           icon: Send,   color: "text-[var(--status-announcement)]",  bg: "bg-[var(--status-announcement)]/12" },
          { label: "Avg Open Rate",    value: `${Math.round(avgOpenRate)}%`,     icon: Eye,    color: "text-[var(--status-active)]",      bg: "bg-[var(--status-active)]/12" },
          { label: "Total Recipients", value: totalRecipients.toLocaleString(), icon: Users,  color: "text-[var(--status-teacher)]",      bg: "bg-[var(--status-teacher)]/12" },
          { label: "Scheduled",        value: scheduledCount.toString(),        icon: Clock,  color: "text-[var(--status-pending)]",    bg: "bg-[var(--status-pending)]/12" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-base p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{stat.label}</span>
              </div>
              <div className="font-display font-black text-xl text-primary-col">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 empty-state">
            <Bell className="w-12 h-12 text-muted-col/40 mb-3" />
            <p className="text-secondary-col font-semibold text-sm">No notifications yet.</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 px-4 py-2 rounded-xl bg-primary/12 text-primary text-xs font-bold hover:bg-primary/20 transition">
              Create first notification
            </button>
          </div>
        ) : (
          notifications.map((notif, i) => {
            const typeCfg = TYPE_CONFIG[notif.type];
            const TypeIcon = typeCfg.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-base p-5"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl ${typeCfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${typeCfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display font-bold text-primary-col text-sm">{notif.title}</span>
                      <TypeBadge type={notif.type} />
                      <StatusBadge status={notif.status} />
                    </div>
                    <p className="text-xs text-muted-col mb-2 line-clamp-2">{notif.body}</p>
                    <div className="flex items-center gap-4 text-[10px] text-muted-col">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{notif.recipients}</span>
                      <span className="flex items-center gap-1">
                        {notif.status === "sent" ? <Clock className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                        {notif.status === "sent" ? notif.sentAt : notif.scheduledAt}
                      </span>
                      {notif.openRate > 0 && (
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{notif.openRate}% opened</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setViewing(notif)}
                    className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition flex-shrink-0"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* View Drawer */}
      <AnimatePresence>
        {viewing && <ViewDrawer notif={viewing} onClose={() => setViewing(null)} />}
      </AnimatePresence>

      {/* New Notification Modal */}
      <AnimatePresence>
        {showCreate && (
          <NewNotificationModal
            onClose={() => setShowCreate(false)}
            onSubmit={handleNewNotif}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast
        message={toast?.message ?? ""}
        type={toast?.type ?? "success"}
        visible={!!toast}
      />
    </div>
  );
}
