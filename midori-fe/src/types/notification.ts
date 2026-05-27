import type { LucideIcon } from "lucide-react";

export type Notification = {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: LucideIcon;
};
