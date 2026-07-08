import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/api/notifications";
import { PreviewSheet } from "@/components/teacher/dialogs";
import {
  Bell,
  Check,
  CheckCheck,
  ClipboardList,
  FileText,
  User,
  Settings,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  time: string;
  link?: string;
}

export const Route = createFileRoute("/teacher/notifications")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: TeacherNotificationsPage,
});

type TabType = "All" | "Unread" | "homework" | "exam" | "student" | "system";

const TABS: { id: TabType; label: string }[] = [
  { id: "All", label: "All" },
  { id: "Unread", label: "Unread" },
  { id: "homework", label: "Homework" },
  { id: "exam", label: "Exam" },
  { id: "student", label: "Student" },
  { id: "system", label: "System" },
];

const typeIcons: Record<string, typeof Bell> = {
  homework: ClipboardList,
  exam: FileText,
  student: User,
  system: Settings,
};

const typeColors: Record<string, string> = {
  homework: "bg-warning/10 text-warning",
  exam: "bg-info/10 text-info",
  student: "bg-sakura/20 text-sakura",
  system: "bg-muted text-muted-foreground",
};

function NotificationCard({
  notification,
  onMarkRead,
  onPreview,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onPreview: (n: Notification) => void;
}) {
  const Icon = typeIcons[notification.type] ?? Bell;
  const colorClass = typeColors[notification.type] ?? "bg-muted text-muted-foreground";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        !notification.read && "border-l-4 border-l-primary bg-primary/5",
      )}
      onClick={() => {
        onPreview(notification);
        if (!notification.read) {
          onMarkRead(notification.id);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              colorClass,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <span className="grid h-2 w-2 place-items-center rounded-full bg-primary" />
                  )}
                  <h3 className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
                    {notification.title}
                  </h3>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {notification.message}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {notification.time}
                </span>
                {notification.link && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationPreviewSheet({
  notification,
  open,
  onOpenChange,
}: {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  if (!notification) return null;

  const Icon = typeIcons[notification.type] ?? Bell;
  const colorClass = typeColors[notification.type] ?? "bg-muted text-muted-foreground";

  return (
    <PreviewSheet
      open={open}
      onOpenChange={onOpenChange}
      title={notification.title}
      description={`${notification.type} · ${notification.time}`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          </div>
        </div>

        <div className="rounded-lg border p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Time</p>
          <p className="mt-1 font-medium">{notification.time}</p>
        </div>

        <div className="rounded-lg border p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Type</p>
          <p className="mt-1 capitalize font-medium">{notification.type}</p>
        </div>

        {notification.link ? (
          <div>
            <p className="mb-2 text-sm font-medium">Related Link</p>
            <Link
              to={notification.link}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Go to related item
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
            No linked item
          </div>
        )}
      </div>
    </PreviewSheet>
  );
}

function TeacherNotificationsPage() {
  const { q: urlQ } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("All");
  const [previewNotification, setPreviewNotification] = useState<Notification | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["teacherNotifications"],
    queryFn: () => getNotifications(),
  });

  const notifications: Notification[] = useMemo(() => {
    if (!apiData?.notifications) return [];
    return apiData.notifications.map((n) => ({
      id: String(n.id),
      title: n.title,
      message: n.content,
      type: n.type?.toLowerCase() ?? "system",
      read: n.isRead,
      time: n.createdAt ? n.createdAt.slice(0, 10) : "",
      link: undefined,
    }));
  }, [apiData]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "All") return true;
    if (activeTab === "Unread") return !n.read;
    return n.type === activeTab;
  }).filter((n) => {
    if (!urlQ) return true;
    const q = urlQ.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || n.type.toLowerCase().includes(q);
  });

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(Number(id));
      queryClient.invalidateQueries({ queryKey: ["teacherNotifications"] });
      toast.success("Marked as read");
    } catch {
      toast.error("Failed to mark as read.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ["teacherNotifications"] });
      toast.success(`All notifications marked as read`);
    } catch {
      toast.error("Failed to mark all as read.");
    }
  };

  const handlePreview = (notification: Notification) => {
    setPreviewNotification(notification);
    setPreviewOpen(true);
  };

  const tabCounts: Record<string, number> = {
    All: filteredNotifications.length,
    Unread: filteredNotifications.filter((n) => !n.read).length,
    homework: filteredNotifications.filter((n) => n.type === "homework").length,
    exam: filteredNotifications.filter((n) => n.type === "exam").length,
    student: filteredNotifications.filter((n) => n.type === "student").length,
    system: filteredNotifications.filter((n) => n.type === "system").length,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle={`${unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}`}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {/* Tab bar */}
      <div className="mb-4 flex flex-wrap items-center gap-1 border-b">
        {TABS.map((tab) => {
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onPreview={handlePreview}
              />
            ))}
            {filteredNotifications.length === 0 && (
              <Card>
                <CardContent className="p-10 text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold">No notifications</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeTab === "Unread"
                      ? "You've read all your notifications."
                      : `No ${activeTab} notifications right now.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <NotificationPreviewSheet
        notification={previewNotification}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
