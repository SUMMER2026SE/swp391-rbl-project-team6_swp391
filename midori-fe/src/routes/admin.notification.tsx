import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight, Bell, Plus, Search, Eye, Edit, Trash2, Send,
  FileText, Users, Megaphone, Wrench, Calendar, Check, X,
  Sticker, BookOpen, Headphones, PenLine, Clock
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NotificationType = "SYSTEM" | "EXAM" | "CLASS" | "MAINTENANCE";
type TargetAudience = "ALL" | "TEACHERS" | "STUDENTS" | "SPECIFIC_CLASS";
type NotificationStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target: TargetAudience;
  status: NotificationStatus;
  scheduledDate?: string;
  createdAt: string;
  sentAt?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    title: "System Maintenance Notice",
    message: "The system will undergo scheduled maintenance on Saturday from 2:00 AM to 6:00 AM. Please save your work before then.",
    type: "MAINTENANCE",
    target: "ALL",
    status: "PUBLISHED",
    createdAt: "2026-06-15",
    sentAt: "2026-06-15",
  },
  {
    id: "notif-002",
    title: "New JLPT N5 Exam Available",
    message: "A new JLPT N5 practice exam has been added. Students can now access it in the exam section.",
    type: "EXAM",
    target: "STUDENTS",
    status: "PUBLISHED",
    createdAt: "2026-06-10",
    sentAt: "2026-06-10",
  },
  {
    id: "notif-003",
    title: "Class Schedule Update",
    message: "The intermediate Japanese class schedule has been updated. Please check your class page for the new timings.",
    type: "CLASS",
    target: "SPECIFIC_CLASS",
    status: "PUBLISHED",
    createdAt: "2026-06-05",
    sentAt: "2026-06-05",
  },
  {
    id: "notif-004",
    title: "Holiday Closure Notice",
    message: "The platform will be closed during the summer holiday period from July 1-15.",
    type: "SYSTEM",
    target: "ALL",
    status: "SCHEDULED",
    scheduledDate: "2026-06-25",
    createdAt: "2026-06-18",
  },
  {
    id: "notif-005",
    title: "New Grammar Content Added",
    message: "We have added 20 new grammar patterns for N3 level. Check them out in the grammar library!",
    type: "SYSTEM",
    target: "STUDENTS",
    status: "DRAFT",
    createdAt: "2026-06-19",
  },
];

// ─── Routes ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/notification")({
  component: NotificationManagementPage,
});

function NotificationManagementPage() {
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "ALL">("ALL");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Create form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "SYSTEM" as NotificationType,
    target: "ALL" as TargetAudience,
    scheduledDate: "",
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return mockNotifications.filter(notif => {
      const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "ALL" || notif.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || notif.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, typeFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: mockNotifications.length,
    published: mockNotifications.filter(n => n.status === "PUBLISHED").length,
    scheduled: mockNotifications.filter(n => n.status === "SCHEDULED").length,
    draft: mockNotifications.filter(n => n.status === "DRAFT").length,
  }), []);

  const handleView = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const handleDelete = (notification: Notification) => {
    if (confirm(`Are you sure you want to delete "${notification.title}"?`)) {
      alert(`Deleted: ${notification.title}`);
    }
  };

  const handleSend = (notification: Notification) => {
    if (confirm(`Send notification "${notification.title}" now?`)) {
      alert(`Notification sent: ${notification.title}`);
    }
  };

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    alert(`Notification created: ${formData.title}`);
    setShowCreateModal(false);
    setFormData({
      title: "",
      message: "",
      type: "SYSTEM",
      target: "ALL",
      scheduledDate: "",
    });
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case "SYSTEM":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold">
          <FileText className="w-3 h-3" /> System
        </span>;
      case "EXAM":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold">
          <Sticker className="w-3 h-3" /> Exam
        </span>;
      case "CLASS":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 text-xs font-semibold">
          <Users className="w-3 h-3" /> Class
        </span>;
      case "MAINTENANCE":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-semibold">
          <Wrench className="w-3 h-3" /> Maintenance
        </span>;
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case "PUBLISHED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold">
          <Send className="w-3 h-3" /> Published
        </span>;
      case "DRAFT":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-600 text-xs font-semibold">
          <FileText className="w-3 h-3" /> Draft
        </span>;
      case "SCHEDULED":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold">
          <Calendar className="w-3 h-3" /> Scheduled
        </span>;
    }
  };

  const getTargetBadge = (target: TargetAudience) => {
    switch (target) {
      case "ALL":
        return <span>All Users</span>;
      case "TEACHERS":
        return <span>Teachers</span>;
      case "STUDENTS":
        return <span>Students</span>;
      case "SPECIFIC_CLASS":
        return <span>Specific Class</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-col">
        <Link to="/admin" className="hover:text-primary-col transition">Dashboard</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-semibold text-primary-col">Notification</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Notification Management</h1>
          <p className="text-sm text-secondary-col mt-0.5">Send announcements and updates to users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create Notification
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.18_270)]/12 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Total</p>
            <p className="font-display font-black text-lg text-primary-col">{stats.total}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-[var(--status-active)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Published</p>
            <p className="font-display font-black text-lg text-primary-col">{stats.published}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-pending)]/12 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[var(--status-pending)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Drafts</p>
            <p className="font-display font-black text-lg text-primary-col">{stats.draft}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.6_0.22_25)]/12 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[oklch(0.6_0.22_25)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Scheduled</p>
            <p className="font-display font-black text-lg text-primary-col">{stats.scheduled}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl search-input text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as NotificationType | "ALL")}
          className="px-3 py-2.5 rounded-xl search-input text-sm min-w-[140px]"
        >
          <option value="ALL">All Types</option>
          <option value="SYSTEM">System</option>
          <option value="EXAM">Exam</option>
          <option value="CLASS">Class</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as NotificationStatus | "ALL")}
          className="px-3 py-2.5 rounded-xl search-input text-sm min-w-[140px]"
        >
          <option value="ALL">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
        </select>
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="card-base p-12 flex flex-col items-center justify-center empty-state">
          <Bell className="w-12 h-12 text-[var(--status-pending)]/40 mb-3" />
          <h3 className="text-primary-col font-semibold text-sm">No notifications found</h3>
          <p className="text-secondary-col text-xs mt-1">
            {searchQuery || typeFilter !== "ALL" || statusFilter !== "ALL"
              ? "Try adjusting your filters"
              : "Create your first notification to get started"}
          </p>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator">
            <div className="col-span-3 text-[10px] uppercase tracking-wider text-muted-col font-bold">Title</div>
            <div className="col-span-2 text-[10px] uppercase tracking-wider text-muted-col font-bold">Type</div>
            <div className="col-span-2 text-[10px] uppercase tracking-wider text-muted-col font-bold">Target</div>
            <div className="col-span-2 text-[10px] uppercase tracking-wider text-muted-col font-bold text-center">Status</div>
            <div className="col-span-1 text-[10px] uppercase tracking-wider text-muted-col font-bold text-center">Date</div>
            <div className="col-span-2 text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">Actions</div>
          </div>
          {/* Table Rows */}
          <div>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition items-center"
              >
                <div className="col-span-3">
                  <div className="font-semibold text-primary-col text-sm">{notification.title}</div>
                  <div className="text-xs text-muted-col line-clamp-1">{notification.message}</div>
                </div>
                <div className="col-span-2">
                  {getTypeBadge(notification.type)}
                </div>
                <div className="col-span-2">
                  {getTargetBadge(notification.target)}
                </div>
                <div className="col-span-2 text-center">
                  {getStatusBadge(notification.status)}
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-xs text-muted-col">{notification.createdAt}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleView(notification)}
                    className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {notification.status === "DRAFT" && (
                    <button
                      onClick={() => handleSend(notification)}
                      className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition"
                      title="Send"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification)}
                    className="p-2 rounded-lg bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/20 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg glass-modal rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b separator">
              <h2 className="font-display font-bold text-primary-col text-base">Create Notification</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-col uppercase tracking-wider">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as NotificationType }))}
                    className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                  >
                    <option value="SYSTEM">System</option>
                    <option value="EXAM">Exam</option>
                    <option value="CLASS">Class</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-col uppercase tracking-wider">Target Audience</label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value as TargetAudience }))}
                    className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                  >
                    <option value="ALL">All Users</option>
                    <option value="TEACHERS">Teachers</option>
                    <option value="STUDENTS">Students</option>
                    <option value="SPECIFIC_CLASS">Specific Class</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">Schedule Date (optional)</label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t separator">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition"
              >
                Create
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Notification Detail Modal */}
      {showDetailModal && selectedNotification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg glass-modal rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b separator">
              <h2 className="font-display font-bold text-primary-col text-base">Notification Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h3 className="font-bold text-primary-col text-xl">{selectedNotification.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl glass-surface">
                  <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Type</div>
                  <div className="font-semibold text-sm">{getTypeBadge(selectedNotification.type)}</div>
                </div>
                <div className="p-3 rounded-xl glass-surface">
                  <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Target</div>
                  <div className="font-semibold text-sm">{getTargetBadge(selectedNotification.target)}</div>
                </div>
                <div className="p-3 rounded-xl glass-surface">
                  <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Status</div>
                  <div className="font-semibold text-sm">{getStatusBadge(selectedNotification.status)}</div>
                </div>
                <div className="p-3 rounded-xl glass-surface">
                  <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Created</div>
                  <div className="font-semibold text-sm">{selectedNotification.createdAt}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-muted-col uppercase tracking-wider">Message</div>
                <div className="p-3 rounded-xl glass-surface text-sm text-primary-col">
                  {selectedNotification.message}
                </div>
              </div>

              {selectedNotification.scheduledDate && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-muted-col uppercase tracking-wider">Scheduled For</div>
                  <div className="flex items-center gap-2 text-sm text-primary-col">
                    <Calendar className="w-4 h-4 text-muted-col" />
                    {selectedNotification.scheduledDate}
                  </div>
                </div>
              )}

              {selectedNotification.sentAt && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-muted-col uppercase tracking-wider">Sent At</div>
                  <div className="flex items-center gap-2 text-sm text-primary-col">
                    <Send className="w-4 h-4 text-[var(--status-active)]" />
                    {selectedNotification.sentAt}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t separator">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
              >
                Close
              </button>
              {selectedNotification.status === "DRAFT" && (
                <button
                  onClick={() => {
                    alert(`Send notification: ${selectedNotification.title}`);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition"
                >
                  Send Now
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
