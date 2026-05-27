import {
  UserPlus,
  FileText,
  Clock,
  MessageCircle,
  MessageSquare,
  Award,
  ClipboardList,
} from "lucide-react";
import type { Notification } from "@/types/notification";

export const TEACHER_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "New student enrolled",
    desc: "A new student joined your N5 Grammar class. Welcome them and review their profile.",
    time: "5 min ago",
    unread: true,
    icon: UserPlus,
  },
  {
    id: 2,
    title: "Assignment submitted",
    desc: "Nguyen Van A submitted the homework for Lesson 3. Please review and provide feedback.",
    time: "28 min ago",
    unread: true,
    icon: FileText,
  },
  {
    id: 3,
    title: "Class schedule reminder",
    desc: "Your speaking class starts in 30 minutes. Make sure your audio equipment is ready.",
    time: "1 hour ago",
    unread: true,
    icon: Clock,
  },
  {
    id: 4,
    title: "Student question",
    desc: "A student asked a question about the 〜なければならない grammar pattern. Please reply when you have time.",
    time: "3 hours ago",
    unread: false,
    icon: MessageCircle,
  },
  {
    id: 5,
    title: "Feedback request",
    desc: "You have pending feedback for a student's shadowing practice. Help them improve by leaving constructive comments.",
    time: "Yesterday",
    unread: false,
    icon: MessageSquare,
  },
  {
    id: 6,
    title: "Certificate approval",
    desc: "A student has requested certificate review for completing the N4 JLPT preparation course.",
    time: "2 days ago",
    unread: false,
    icon: Award,
  },
  {
    id: 7,
    title: "Lesson review needed",
    desc: "Several students reported difficulty understanding today's listening practice. Please review their feedback and consider adding clarification notes to the lesson materials.",
    time: "2 days ago",
    unread: false,
    icon: ClipboardList,
  },
];
