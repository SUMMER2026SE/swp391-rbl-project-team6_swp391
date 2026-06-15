import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  UserCheck,
  Bell,
  CheckCheck,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  NotificationResponse,
} from "@/lib/api/notifications";

type NotificationItem = {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: React.ElementType;
};

// Map notification type to icon
function getIconForType(type: string): React.ElementType {
  switch (type) {
    case "LESSON":
      return GraduationCap;
    case "CONTENT_APPROVED":
      return CheckCircle;
    case "CONTENT_REJECTED":
      return XCircle;
    case "TEACHER_APPROVED":
      return UserCheck;
    case "SYSTEM":
    default:
      return Bell;
  }
}

// Format relative time
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// Map API response to UI format
function mapNotification(apiNotification: NotificationResponse): NotificationItem {
  return {
    id: apiNotification.id,
    title: apiNotification.title,
    desc: apiNotification.content || "",
    time: formatTime(apiNotification.createdAt),
    unread: !apiNotification.isRead,
    icon: getIconForType(apiNotification.type),
  };
}

export const Route = createFileRoute("/teacher/notifications")({
  component: TeacherNotificationsPage,
});

function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await getNotifications();
      const mapped = response.notifications.map(mapNotification);
      setNotifications(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load notifications";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAsRead = async (id: number) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    try {
      await markAsRead(id);
    } catch (err) {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic update
    const previousNotifications = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await markAllAsRead();
    } catch (err) {
      // Revert on error
      setNotifications(previousNotifications);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isLong = (text: string) => text.length > 65;

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/teacher"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Title row */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Notifications
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              Stay updated with your teaching activity
            </p>
          </div>

          {unreadCount > 0 && !loading && (
            <button
              onClick={handleMarkAllRead}
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition mb-0.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 animate-pulse" />
          </div>
          <p className="text-base font-medium text-gray-500 dark:text-gray-400">
            Loading notifications...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-base font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            onClick={fetchNotifications}
            className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-base font-medium text-gray-500 dark:text-gray-400">
            No notifications
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            You're all caught up!
          </p>
        </div>
      )}

      {/* Notification list */}
      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;
            const isExpanded = expandedIds.has(n.id);
            const showToggle = isLong(n.desc);

            return (
              <div
                key={n.id}
                onClick={() => n.unread && handleMarkAsRead(n.id)}
                className={`
                  relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer
                  hover:-translate-y-px hover:shadow-lg
                  ${
                    n.unread
                      ? // Unread — indigo tint + left accent border
                        "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/60 border-l-[3px] border-l-indigo-500 dark:border-l-indigo-400 border-t-indigo-100 dark:border-t-indigo-900/60 border-r-indigo-100 dark:border-r-indigo-900/60 border-b-indigo-100 dark:border-b-indigo-900/60 shadow-sm hover:shadow-indigo-200/40 dark:hover:shadow-indigo-900/30"
                      : // Read — clean white surface, subtle border
                        "bg-white dark:bg-[#111827] border-gray-200 dark:border-gray-700/80 shadow-sm hover:shadow-gray-200/60 dark:hover:shadow-black/40"
                  }
                `}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.unread
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold leading-tight ${
                        n.unread
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {n.title}
                    </span>
                    {n.unread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 flex-shrink-0 mt-0.5" />
                    )}
                  </div>

                  <p
                    className={`text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed ${
                      isExpanded ? "" : "line-clamp-2"
                    }`}
                  >
                    {n.desc}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                      {n.time}
                    </span>
                    {showToggle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(n.id);
                        }}
                        className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                      >
                        {isExpanded ? "Less" : "More"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
