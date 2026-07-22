import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Bell,
  Plus,
  Search,
  Eye,
  Trash2,
  Send,
  FileText,
  Users,
  Megaphone,
  Wrench,
  Calendar,
  X,
  RefreshCw,
  Loader2,
  Pencil,
} from "lucide-react";
import {
  notificationApi,
  type AdminNotificationResponse,
  type AdminNotificationDetailResponse,
  type CreateNotificationRequest,
  type UpdateNotificationRequest,
  type SendNotificationRequest,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUSES,
  TARGET_AUDIENCE,
  getNotificationTypeConfig,
  getNotificationStatusConfig,
  NOTIFICATION_TYPE_LIST,
  TARGET_AUDIENCE_LIST,
  type NotificationType,
  type TargetAudience,
} from "@/lib/api/notification";
import { toast } from "sonner";

type LocalNotificationStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";

interface LocalNotification extends AdminNotificationResponse {
  status: LocalNotificationStatus;
}

export const Route = createFileRoute("/admin/notification")({
  component: NotificationManagementPage,
});

// Format an ISO/string timestamp into the `YYYY-MM-DDTHH:mm` value expected
// by an <input type="datetime-local">. We work in local time because the
// datetime-local input is timezone-naive: it picks up the browser's local
// timezone, which matches what the user picked in the Create modal.
function toDatetimeLocalValue(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Sort a notifications array by createdAt descending, with id desc as the
// tie-breaker. This mirrors the DB sort so the rendered order is stable
// regardless of whether the backend is currently passing a Sort object to
// the repository. Without this, a freshly-created Draft could end up at
// the bottom of the list whenever the backend ordering regresses.
function sortByCreatedAtDesc<T extends { createdAt: string; id: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return b.id - a.id;
  });
}

function NotificationManagementPage() {
  // Track the active pathname so we re-fetch whenever the user navigates
  // back to /admin/notification (e.g. from another tab) even if the filters
  // (page / typeFilter / searchQuery) are unchanged. This is the proper way
  // to re-sync local state with the backend on remount - it does NOT use a
  // timer / polling, it relies purely on router state changes.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onAdminNotificationsRoute = pathname === "/admin/notification";

  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<AdminNotificationDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotificationId, setEditingNotificationId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    type: NotificationType;
    target: TargetAudience;
    classCode: string;
    scheduledDate: string;
  }>({
    title: "",
    content: "",
    type: NOTIFICATION_TYPES.SYSTEM,
    target: TARGET_AUDIENCE.ALL,
    classCode: "",
    scheduledDate: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [classIdError, setClassIdError] = useState<string | null>(null);

  const [classLookup, setClassLookup] = useState<{
    name: string;
    studentCount: number;
    teacherName: string | null;
  } | null>(null);
  const [classLookupLoading, setClassLookupLoading] = useState(false);
  const [classLookupError, setClassLookupError] = useState<string | null>(null);

  const lookupClass = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      setClassLookup(null);
      setClassLookupError(null);
      return;
    }
    setClassLookupLoading(true);
    setClassLookupError(null);
    try {
      const data = await notificationApi.lookupClass(code);
      setClassLookup({
        name: data.name,
        studentCount: data.studentCount ?? 0,
        teacherName: data.teacherName ?? null,
      });
    } catch (err) {
      setClassLookup(null);
      setClassLookupError(err instanceof Error ? err.message : "Class not found");
    } finally {
      setClassLookupLoading(false);
    }
  };

  // Track which notifications currently have a Send request in flight so we
  // can disable the Send / Edit buttons while waiting. We do NOT track a
  // persistent "sent" set here - the backend is the source of truth for
  // whether a notification has been published (recipientCount > 0), and the
  // next refetch will surface that authoritative status back into the list.
  const [sendingIds, setSendingIds] = useState<Set<number>>(new Set());
  const [sendErrors, setSendErrors] = useState<Record<number, string>>({});

  // Mirror of showEditModal so async handlers (e.g. getNotificationById
  // inside handleOpenEdit) can read the latest value at resolve time
  // instead of capturing a stale snapshot from when the call started.
  const showEditModalRef = useRef<boolean>(false);
  useEffect(() => {
    showEditModalRef.current = showEditModal;
  }, [showEditModal]);

  const fetchNotifications = async () => {
    setLoading(true);
    setListError(null);
    try {
      const params: {
        type?: NotificationType;
        keyword?: string;
        page: number;
        size: number;
      } = {
        page,
        size,
      };
      if (typeFilter !== "ALL") params.type = typeFilter;
      if (searchQuery.trim()) params.keyword = searchQuery.trim();

      const data = await notificationApi.getNotifications(params);

      // Trust the backend's displayStatus as the single source of truth. Any
      // local override (e.g. an optimistic DRAFT -> PUBLISHED flip) must be
      // discarded on the next fetch because the backend is what other
      // admin tabs / after-reload sessions see. Doing the override here
      // would cause the row to revert to DRAFT on a hard reload, which was
      // the original bug.
      const mapped: LocalNotification[] = data.map((item) => ({
        ...item,
        status: (item.displayStatus as LocalNotificationStatus) || "DRAFT",
      }));
      // Defence-in-depth sort: backend already sorts by createdAt DESC, but we
      // re-apply the same order on the client so a freshly-created Draft is
      // always at the top regardless of any backend regression.
      setNotifications(sortByCreatedAtDesc(mapped));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever filters change OR whenever the route becomes the active
  // admin notifications page again. The `onAdminNotificationsRoute` boolean
  // is a router-state-derived value, so navigating away and back flips it
  // false -> true and re-runs this effect without needing a timer or a
  // mount-time hack. The first mount also satisfies this condition so the
  // initial fetch still happens.
  useEffect(() => {
    if (!onAdminNotificationsRoute) return;
    fetchNotifications();
    // fetchNotifications reads `page`, `typeFilter`, `searchQuery`; include
    // them in deps so a filter change also triggers a fetch. We intentionally
    // omit `fetchNotifications` because it is recreated on every render; the
    // effect must only run when the listed inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAdminNotificationsRoute, page, typeFilter, searchQuery]);

  const handleView = async (notification: LocalNotification) => {
    setShowDetailModal(true);
    setSelectedNotification(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await notificationApi.getNotificationById(notification.id);
      setSelectedNotification(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to load notification detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (notification: LocalNotification) => {
    if (!confirm(`Are you sure you want to delete "${notification.title}"?`)) {
      return;
    }
    try {
      await notificationApi.deleteNotification(notification.id);
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete notification");
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setCreateError("Please fill in all required fields");
      return;
    }

    if (formData.target === TARGET_AUDIENCE.SPECIFIC_CLASS) {
      const code = formData.classCode.trim();
      if (!code) {
        setClassIdError("Class Code is required when Target Audience is Specific Class");
        setCreateError("Please enter the Class Code before creating");
        return;
      }
      if (!classLookup || classLookupError) {
        setClassIdError("Please verify the Class Code by clicking the Verify button");
        setCreateError("Please verify the Class Code before creating");
        return;
      }
      setClassIdError(null);
    } else {
      setClassIdError(null);
    }

    setCreateLoading(true);
    setCreateError(null);
    try {
      const payload: CreateNotificationRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        targetType: formData.target,
        targetRole:
          formData.target === "TEACHERS"
            ? "TEACHER"
            : formData.target === "STUDENTS"
              ? "STUDENT"
              : undefined,
        scheduledAt: formData.scheduledDate
          ? new Date(formData.scheduledDate).toISOString()
          : undefined,
      };

      if (formData.target === TARGET_AUDIENCE.SPECIFIC_CLASS) {
        payload.classCode = formData.classCode.trim();
      }

      const created = await notificationApi.createNotification(payload);
      const mapped: LocalNotification = {
        ...created,
        status: (created.displayStatus as LocalNotificationStatus) || "DRAFT",
      };

      setNotifications((prev) => sortByCreatedAtDesc([mapped, ...prev]));
      setShowCreateModal(false);
      setFormData({
        title: "",
        content: "",
        type: NOTIFICATION_TYPES.SYSTEM,
        target: TARGET_AUDIENCE.ALL,
        classCode: "",
        scheduledDate: "",
      });
      setClassLookup(null);
      setClassLookupError(null);
      setClassIdError(null);
      setPage(0);
      toast.success("Notification created successfully!");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create notification");
      toast.error("Failed to create notification");
    } finally {
      setCreateLoading(false);
    }
  };

  // Opens the Edit modal prefilled with the selected notification's data.
  // Only Draft notifications are editable; the button is hidden for sent
  // notifications, but we guard again here in case the call is made from
  // elsewhere (e.g. a future shortcut).
  const handleOpenEdit = async (notification: LocalNotification) => {
    setEditError(null);
    setEditLoading(false);
    setEditingNotificationId(notification.id);
    setFormData({
      title: notification.title ?? "",
      content: notification.content ?? "",
      type: (notification.type ?? NOTIFICATION_TYPES.SYSTEM) as NotificationType,
      target: (notification.targetType as TargetAudience) ?? TARGET_AUDIENCE.ALL,
      classCode: notification.classCode ?? "",
      scheduledDate: notification.scheduledAt ? toDatetimeLocalValue(notification.scheduledAt) : "",
    });
    setShowEditModal(true);

    // If the list view is missing some fields (e.g. when entered from the
    // View modal), pull the latest detail from the backend so the form has
    // authoritative values.
    try {
      const detail = await notificationApi.getNotificationById(notification.id);
      // While loading, the user might have closed the modal — bail out so we
      // do not clobber nothing with stale data.
      if (!showEditModalRef.current) {
        return;
      }
      setFormData({
        title: detail.title ?? "",
        content: detail.content ?? "",
        type: (detail.type ?? NOTIFICATION_TYPES.SYSTEM) as NotificationType,
        target: (detail.targetType as TargetAudience) ?? TARGET_AUDIENCE.ALL,
        classCode: detail.classCode ?? "",
        scheduledDate: detail.scheduledAt ? toDatetimeLocalValue(detail.scheduledAt) : "",
      });

      // Hydrate class lookup if the notification targets a specific class.
      if (
        (detail.targetType as TargetAudience) === TARGET_AUDIENCE.SPECIFIC_CLASS &&
        detail.classCode
      ) {
        try {
          const lookup = await notificationApi.lookupClass(detail.classCode);
          setClassLookup({
            name: lookup.name,
            studentCount: lookup.studentCount ?? 0,
            teacherName: lookup.teacherName ?? null,
          });
          setClassLookupError(null);
        } catch (err) {
          setClassLookup(null);
          setClassLookupError(err instanceof Error ? err.message : "Class not found");
        }
      } else {
        setClassLookup(null);
        setClassLookupError(null);
      }
    } catch (err) {
      // Stale list data is still displayed in the form; surface a soft error.
      setEditError(err instanceof Error ? err.message : "Failed to load notification details");
    }
  };

  const handleUpdate = async () => {
    if (editingNotificationId === null) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      setEditError("Please fill in all required fields");
      return;
    }

    if (formData.target === TARGET_AUDIENCE.SPECIFIC_CLASS) {
      const code = formData.classCode.trim();
      if (!code) {
        setClassIdError("Class Code is required when Target Audience is Specific Class");
        setEditError("Please enter the Class Code before saving");
        return;
      }
      if (!classLookup || classLookupError) {
        setClassIdError("Please verify the Class Code by clicking the Verify button");
        setEditError("Please verify the Class Code before saving");
        return;
      }
      setClassIdError(null);
    } else {
      setClassIdError(null);
    }

    setEditLoading(true);
    setEditError(null);
    try {
      const payload: UpdateNotificationRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        targetType: formData.target,
        targetRole:
          formData.target === "TEACHERS"
            ? "TEACHER"
            : formData.target === "STUDENTS"
              ? "STUDENT"
              : undefined,
        scheduledAt: formData.scheduledDate
          ? new Date(formData.scheduledDate).toISOString()
          : undefined,
      };

      if (formData.target === TARGET_AUDIENCE.SPECIFIC_CLASS) {
        payload.classCode = formData.classCode.trim();
      }

      const updated = await notificationApi.updateNotification(editingNotificationId, payload);

      // Replace the row in-place so the list keeps the current order (the row
      // was already in the list and its position was chosen by createdAt,
      // which we have not changed here).
      const mapped: LocalNotification = {
        ...(updated as AdminNotificationResponse),
        status: (updated.displayStatus as LocalNotificationStatus) || "DRAFT",
      };
      setNotifications((prev) => prev.map((n) => (n.id === mapped.id ? { ...n, ...mapped } : n)));
      // If the View modal happens to be open with this same notification,
      // sync its data so the user sees the fresh values without a refetch.
      setSelectedNotification((prev) => (prev && prev.id === updated.id ? updated : prev));

      setShowEditModal(false);
      setEditingNotificationId(null);
      setClassLookup(null);
      setClassLookupError(null);
      setClassIdError(null);
      toast.success("Notification updated successfully!");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update notification");
      toast.error("Failed to update notification");
    } finally {
      setEditLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = notifications.length;
    const draft = notifications.filter((n) => n.status === "DRAFT").length;
    const published = notifications.filter((n) => n.status === "PUBLISHED").length;
    const scheduled = notifications.filter((n) => n.status === "SCHEDULED").length;
    return { total, published, scheduled, draft };
  }, [notifications]);

  const getTypeBadge = (type: NotificationType) => {
    const config = getNotificationTypeConfig(type);
    const colorClasses: Record<string, string> = {
      emerald: "bg-emerald-500/10 text-emerald-600",
      green: "bg-green-500/10 text-green-600",
      red: "bg-red-500/10 text-red-600",
      blue: "bg-blue-500/10 text-blue-600",
      gray: "bg-gray-500/10 text-gray-600",
    };
    const colorClass = colorClasses[config.color] || colorClasses.gray;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${colorClass}`}
      >
        <config.icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: LocalNotificationStatus) => {
    const config = getNotificationStatusConfig(status);
    const colorClasses: Record<string, string> = {
      yellow: "bg-yellow-500/10 text-yellow-600",
      green: "bg-green-500/10 text-green-600",
      blue: "bg-blue-500/10 text-blue-600",
      gray: "bg-gray-500/10 text-gray-600",
    };
    const colorClass = colorClasses[config.color] || colorClasses.gray;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${colorClass}`}
      >
        <config.icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  const getTargetBadge = (target: string | null | undefined) => {
    if (!target) {
      return <span>All Users</span>;
    }
    const config = TARGET_AUDIENCE_LIST.find((t) => t.value === target);
    return <span>{config?.label || target}</span>;
  };

  const renderDetailField = (label: string, value?: string | null) => {
    if (!value) return null;
    return (
      <div className="p-3 rounded-xl glass-surface">
        <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">
          {label}
        </div>
        <div className="flex items-center gap-2 text-sm text-primary-col">
          <Calendar className="w-4 h-4 text-muted-col" />
          {value}
        </div>
      </div>
    );
  };

  const handleSend = async (notification: LocalNotification) => {
    // Prevent re-entry: a second click on the same Send button must not slip
    // through while the first request is in flight. We deliberately do NOT
    // gate on a persistent "sent" set - the backend's displayStatus is the
    // single source of truth, and the next refetch will reflect whether the
    // notification has already been sent (recipientCount > 0).
    if (sendingIds.has(notification.id)) {
      return;
    }

    // Lock the Send / Edit buttons BEFORE the confirm dialog so a second
    // click cannot slip in during the same render cycle. If the user
    // cancels, we release the lock in the cleanup branch below.
    setSendErrors((prev) => ({ ...prev, [notification.id]: "" }));
    setSendingIds((prev) => new Set(prev).add(notification.id));

    const confirmed = confirm(`Send notification "${notification.title}" now?`);
    if (!confirmed) {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
      return;
    }

    try {
      const targetType =
        notification.targetType === "ALL"
          ? "ALL"
          : notification.targetType === "TEACHERS"
            ? "ROLE"
            : notification.targetType === "STUDENTS"
              ? "ROLE"
              : notification.targetType === "SPECIFIC_CLASS"
                ? "CLASS"
                : "CLASS";

      if (targetType === "CLASS" && !notification.classCode) {
        setSendErrors((prev) => ({
          ...prev,
          [notification.id]:
            "Sending by Class is not available because no class code was provided when the notification was created.",
        }));
        return;
      }

      const body: SendNotificationRequest = {
        targetType,
        ...(targetType === "ROLE" && {
          role: notification.targetType === "TEACHERS" ? "TEACHER" : "STUDENT",
        }),
        ...(targetType === "CLASS" && {
          classCode: notification.classCode ?? undefined,
        }),
      };

      await notificationApi.sendNotification(notification.id, body);

      // Optimistically flip the row so the Status badge + buttons update
      // immediately without waiting for the refetch round-trip. The next
      // fetch (below) will replace this with the authoritative server
      // value, so this is purely a UX nicety - not the source of truth.
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, displayStatus: "PUBLISHED", status: "PUBLISHED" } : n,
        ),
      );
      toast.success("Notification sent successfully!");

      // Authoritative refetch: the @Transactional sendNotification has
      // committed user_notifications rows by now, so the next read of
      // recipientCount will be > 0 and resolveDisplayStatus will report
      // PUBLISHED. This guarantees the row stays in PUBLISHED state across
      // page reloads and other admin sessions.
      await fetchNotifications();
    } catch (err) {
      // On failure, revert any optimistic change so the user can retry.
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, displayStatus: notification.displayStatus, status: notification.status }
            : n,
        ),
      );
      setSendErrors((prev) => ({
        ...prev,
        [notification.id]: err instanceof Error ? err.message : "Failed to send notification",
      }));
      toast.error("Failed to send notification");
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-col">
        <Link to="/admin" className="hover:text-primary-col transition">
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-semibold text-primary-col">Notification</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">
            Notification Management
          </h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Send announcements and updates to users
          </p>
        </div>
        <button
          onClick={() => {
            setCreateError(null);
            setClassIdError(null);
            setClassLookup(null);
            setClassLookupError(null);
            setShowCreateModal(true);
          }}
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
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Published
            </p>
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
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Scheduled
            </p>
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl search-input text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as NotificationType | "ALL");
            setPage(0);
          }}
          className="px-3 py-2.5 rounded-xl search-input text-sm min-w-[160px]"
        >
          <option value="ALL">All Types</option>
          {NOTIFICATION_TYPE_LIST.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="card-base p-8 flex items-center justify-center gap-2 text-sm text-muted-col">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading notifications...
        </div>
      )}
      {listError && (
        <div className="card-base p-6 text-sm text-red-500">
          {listError}
          <button onClick={fetchNotifications} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {/* Notification List */}
      {!loading && !listError && notifications.length === 0 && (
        <div className="card-base p-12 flex flex-col items-center justify-center empty-state">
          <Bell className="w-12 h-12 text-[var(--status-pending)]/40 mb-3" />
          <h3 className="text-primary-col font-semibold text-sm">No notifications found</h3>
          <p className="text-secondary-col text-xs mt-1">
            {searchQuery || typeFilter !== "ALL"
              ? "Try adjusting your filters"
              : "Create your first notification to get started"}
          </p>
        </div>
      )}

      {!loading && !listError && notifications.length > 0 && (
        <div className="card-base overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator">
            <div className="col-span-3 text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Title
            </div>
            <div className="col-span-2 text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Type
            </div>
            <div className="col-span-2 text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Target
            </div>
            <div className="col-span-2 text-[10px] uppercase tracking-wider text-muted-col font-bold text-center">
              Status
            </div>
            <div className="col-span-1 text-[10px] uppercase tracking-wider text-muted-col font-bold text-center">
              Date
            </div>
            <div className="col-span-2 text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Actions
            </div>
          </div>
          <div>
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition items-center"
              >
                <div className="col-span-3">
                  <div className="font-semibold text-primary-col text-sm">{notification.title}</div>
                  <div className="text-xs text-muted-col line-clamp-1">{notification.content}</div>
                </div>
                <div className="col-span-2">{getTypeBadge(notification.type)}</div>
                <div className="col-span-2">{getTargetBadge(notification.targetType)}</div>
                <div className="col-span-2 text-center">{getStatusBadge(notification.status)}</div>
                <div className="col-span-1 text-center">
                  <span className="text-xs text-muted-col">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleView(notification)}
                    className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {/* Edit + Send: shown only while the notification is still
                      a Draft AND no Send request is in flight for it. The
                      Draft status comes straight from the backend's
                      displayStatus, which is the single source of truth for
                      whether a notification has been published. */}
                  {notification.status === "DRAFT" && !sendingIds.has(notification.id) && (
                    <button
                      onClick={() => handleOpenEdit(notification)}
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {notification.status === "DRAFT" && !sendingIds.has(notification.id) && (
                    <button
                      onClick={() => handleSend(notification)}
                      className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition"
                      title="Send"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  {sendingIds.has(notification.id) && (
                    <button
                      disabled
                      className="p-2 rounded-lg bg-green-500/10 text-green-500 opacity-70 cursor-not-allowed transition"
                      title="Sending"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" />
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
                {sendErrors[notification.id] && (
                  <div className="col-span-12 text-xs text-red-500">
                    {sendErrors[notification.id]}
                  </div>
                )}
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
            className="relative z-10 w-full max-w-lg glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b separator flex-shrink-0">
              <h2 className="font-display font-bold text-primary-col text-base">
                Create Notification
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Message *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Notification message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value as NotificationType }))
                  }
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                >
                  {NOTIFICATION_TYPE_LIST.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Target Audience
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => {
                    const next = e.target.value as TargetAudience;
                    if (next !== TARGET_AUDIENCE.SPECIFIC_CLASS) {
                      setFormData((prev) => ({ ...prev, target: next, classCode: "" }));
                      setClassLookup(null);
                      setClassLookupError(null);
                      setClassIdError(null);
                    } else {
                      setFormData((prev) => ({ ...prev, target: next }));
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                >
                  {TARGET_AUDIENCE_LIST.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                data-testid="class-code-block"
                className={formData.target === TARGET_AUDIENCE.SPECIFIC_CLASS ? "" : "hidden"}
                aria-hidden={formData.target !== TARGET_AUDIENCE.SPECIFIC_CLASS}
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                    Class Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.classCode}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData((prev) => ({ ...prev, classCode: v }));
                        setClassLookup(null);
                        setClassLookupError(null);
                        setClassIdError(null);
                      }}
                      placeholder="Enter class code (e.g. N5-A1)"
                      className={`flex-1 px-4 py-3 rounded-xl input-glass text-sm ${
                        classIdError ? "border border-red-500 focus:outline-red-500" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => lookupClass(formData.classCode)}
                      disabled={classLookupLoading || !formData.classCode.trim()}
                      className="px-4 py-3 rounded-xl bg-primary/12 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition disabled:opacity-50"
                    >
                      {classLookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </button>
                  </div>
                  {classLookup && (
                    <div className="p-3 rounded-xl border border-[var(--status-active)]/30 bg-[var(--status-active)]/5">
                      <div className="text-[10px] font-bold text-[var(--status-active)] uppercase tracking-wider mb-1">
                        Class Found
                      </div>
                      <div className="text-sm font-semibold text-primary-col">
                        {classLookup.name}
                      </div>
                      <div className="text-xs text-muted-col mt-0.5">
                        {classLookup.studentCount} student
                        {classLookup.studentCount === 1 ? "" : "s"}
                        {classLookup.teacherName ? ` · Teacher: ${classLookup.teacherName}` : ""}
                      </div>
                    </div>
                  )}
                  {classLookupError && (
                    <div className="text-xs text-red-500">{classLookupError}</div>
                  )}
                  {classIdError && !classLookupError && (
                    <div className="text-xs text-red-500 mt-1">{classIdError}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                />
              </div>

              {createError && <div className="text-xs text-red-500">{createError}</div>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t separator flex-shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createLoading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition disabled:opacity-70"
              >
                {createLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Notification Modal */}
      {/* Reuses the same form layout as Create to keep the editing UX
          consistent. `formData` and `classLookup` are reset on close so the
          next open starts from a clean slate. */}
      {showEditModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setShowEditModal(false);
            setEditingNotificationId(null);
            setEditError(null);
            setClassLookup(null);
            setClassLookupError(null);
            setClassIdError(null);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b separator flex-shrink-0">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-500" />
                <h2 className="font-display font-bold text-primary-col text-base">
                  Edit Notification
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingNotificationId(null);
                  setEditError(null);
                  setClassLookup(null);
                  setClassLookupError(null);
                  setClassIdError(null);
                }}
                className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Message *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Notification message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value as NotificationType }))
                  }
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                >
                  {NOTIFICATION_TYPE_LIST.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Target Audience
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => {
                    const next = e.target.value as TargetAudience;
                    if (next !== TARGET_AUDIENCE.SPECIFIC_CLASS) {
                      setFormData((prev) => ({ ...prev, target: next, classCode: "" }));
                      setClassLookup(null);
                      setClassLookupError(null);
                      setClassIdError(null);
                    } else {
                      setFormData((prev) => ({ ...prev, target: next }));
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                >
                  {TARGET_AUDIENCE_LIST.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                data-testid="edit-class-code-block"
                className={formData.target === TARGET_AUDIENCE.SPECIFIC_CLASS ? "" : "hidden"}
                aria-hidden={formData.target !== TARGET_AUDIENCE.SPECIFIC_CLASS}
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                    Class Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.classCode}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData((prev) => ({ ...prev, classCode: v }));
                        setClassLookup(null);
                        setClassLookupError(null);
                        setClassIdError(null);
                      }}
                      placeholder="Enter class code (e.g. N5-A1)"
                      className={`flex-1 px-4 py-3 rounded-xl input-glass text-sm ${
                        classIdError ? "border border-red-500 focus:outline-red-500" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => lookupClass(formData.classCode)}
                      disabled={classLookupLoading || !formData.classCode.trim()}
                      className="px-4 py-3 rounded-xl bg-primary/12 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition disabled:opacity-50"
                    >
                      {classLookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </button>
                  </div>
                  {classLookup && (
                    <div className="p-3 rounded-xl border border-[var(--status-active)]/30 bg-[var(--status-active)]/5">
                      <div className="text-[10px] font-bold text-[var(--status-active)] uppercase tracking-wider mb-1">
                        Class Found
                      </div>
                      <div className="text-sm font-semibold text-primary-col">
                        {classLookup.name}
                      </div>
                      <div className="text-xs text-muted-col mt-0.5">
                        {classLookup.studentCount} student
                        {classLookup.studentCount === 1 ? "" : "s"}
                        {classLookup.teacherName ? ` · Teacher: ${classLookup.teacherName}` : ""}
                      </div>
                    </div>
                  )}
                  {classLookupError && (
                    <div className="text-xs text-red-500">{classLookupError}</div>
                  )}
                  {classIdError && !classLookupError && (
                    <div className="text-xs text-red-500 mt-1">{classIdError}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-col uppercase tracking-wider">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                />
              </div>

              {editError && <div className="text-xs text-red-500">{editError}</div>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t separator flex-shrink-0">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingNotificationId(null);
                  setEditError(null);
                  setClassLookup(null);
                  setClassLookupError(null);
                  setClassIdError(null);
                }}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={editLoading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-500/90 transition disabled:opacity-70"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Notification Detail Modal */}
      {showDetailModal && (
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
            className="relative z-10 w-full max-w-lg glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b separator flex-shrink-0">
              <h2 className="font-display font-bold text-primary-col text-base">
                Notification Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {detailLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-col">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading notification...
                </div>
              )}
              {detailError && (
                <div className="text-sm text-red-500">
                  {detailError}
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      fetchNotifications();
                    }}
                    className="ml-3 underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!detailLoading && !detailError && selectedNotification && (
                <>
                  <div>
                    <h3 className="font-bold text-primary-col text-xl">
                      {selectedNotification.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl glass-surface">
                      <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">
                        Type
                      </div>
                      <div className="font-semibold text-sm">
                        {getTypeBadge(selectedNotification.type)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl glass-surface">
                      <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">
                        Status
                      </div>
                      <div className="font-semibold text-sm">
                        {getStatusBadge(
                          selectedNotification.displayStatus as LocalNotificationStatus,
                        )}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl glass-surface">
                      <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">
                        Recipients
                      </div>
                      <div className="font-semibold text-sm">
                        {selectedNotification.recipientCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl glass-surface">
                      <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">
                        Created
                      </div>
                      <div className="font-semibold text-sm">
                        {new Date(selectedNotification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                      Message
                    </div>
                    <div className="p-3 rounded-xl glass-surface text-sm text-primary-col whitespace-pre-wrap">
                      {selectedNotification.content}
                    </div>
                  </div>

                  {selectedNotification.sentAt &&
                    renderDetailField("Sent At", selectedNotification.sentAt)}
                </>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t separator flex-shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
              >
                Close
              </button>
              {!detailLoading &&
                !detailError &&
                selectedNotification &&
                selectedNotification.displayStatus === "DRAFT" && (
                  <button
                    onClick={() => {
                      const target = {
                        ...selectedNotification,
                        status: "DRAFT",
                      } as LocalNotification;
                      setShowDetailModal(false);
                      handleOpenEdit(target);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500/12 text-amber-500 text-sm font-bold border border-amber-500/20 hover:bg-amber-500/20 transition"
                  >
                    Edit
                  </button>
                )}
              {!detailLoading &&
                !detailError &&
                selectedNotification &&
                selectedNotification.displayStatus === "DRAFT" && (
                  <button
                    onClick={() => {
                      handleSend({
                        ...selectedNotification,
                        status: "DRAFT",
                      } as LocalNotification);
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
