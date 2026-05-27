import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  GraduationCap, Flame, Trophy, Bot, Sparkles,
  CheckCheck, Bell, ArrowLeft
} from "lucide-react";

type Notification = {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: React.ElementType;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "New grammar lesson available",
    desc: "~なければならない pattern is ready. This essential grammar pattern expresses obligation and necessity in Japanese.",
    time: "2 min ago",
    unread: true,
    icon: GraduationCap,
  },
  {
    id: 2,
    title: "Daily streak reminder",
    desc: "Complete today's lesson to keep your 32-day streak going strong!",
    time: "1 hour ago",
    unread: true,
    icon: Flame,
  },
  {
    id: 3,
    title: "Weekly leaderboard update",
    desc: "You're now #4 — just 80 XP behind #3! Keep pushing!",
    time: "3 hours ago",
    unread: false,
    icon: Trophy,
  },
  {
    id: 4,
    title: "AI Sensei feedback",
    desc: "Sensei reviewed your shadowing session and left detailed feedback on your pronunciation.",
    time: "Yesterday",
    unread: false,
    icon: Bot,
  },
  {
    id: 5,
    title: "New badge earned",
    desc: "You unlocked the 'Week Warrior' badge for completing lessons 7 days in a row!",
    time: "2 days ago",
    unread: false,
    icon: Sparkles,
  },
];

export const Route = createFileRoute("/student/notifications")({
  component: StudentNotificationsPage,
});

function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
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
          to="/student"
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
              Stay updated with your learning activity
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition mb-0.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-base font-medium text-gray-500 dark:text-gray-400">
            No notifications yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            You're all caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;
            const isExpanded = expandedIds.has(n.id);
            const showToggle = isLong(n.desc);

            return (
              <div
                key={n.id}
                className={`
                  relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200
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
                        onClick={() => toggleExpanded(n.id)}
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
