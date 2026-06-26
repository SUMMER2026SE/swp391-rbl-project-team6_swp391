import { useState, useMemo, useEffect } from "react";
import { mockClasses } from "@/mock/classes";
import type { DetailedClassInfo, Assignment, Announcement } from "@/types/class-detail";

export function useClassDetail(classId: string) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("All");
  const [assignmentSort, setAssignmentSort] = useState<string>("deadline");
  const [announcementFilter, setAnnouncementFilter] = useState<string>("all");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Find class information
  const classInfo = useMemo(() => {
    return mockClasses.find((c) => c.id === classId);
  }, [classId]);

  // Sync announcements
  useEffect(() => {
    if (classInfo) {
      setAnnouncements(classInfo.announcements || []);
    }
  }, [classInfo]);

  const markAnnouncementAsRead = (annId: string) => {
    setAnnouncements((prev) =>
      prev.map((ann) => (ann.id === annId ? { ...ann, read: true } : ann)),
    );
  };

  // Filtered and Sorted Assignments
  const processedAssignments = useMemo(() => {
    if (!classInfo) return [];
    let list = [...classInfo.assignments];

    // Filter status mapping
    if (assignmentFilter !== "All") {
      list = list.filter((a) => {
        if (assignmentFilter === "Homework") return a.status !== "Overdue" && a.status !== "Graded";
        if (assignmentFilter === "Upcoming")
          return a.status === "Not Started" || a.status === "In Progress";
        if (assignmentFilter === "Submitted") return a.status === "Submitted";
        if (assignmentFilter === "Graded") return a.status === "Graded";
        if (assignmentFilter === "Overdue") return a.status === "Overdue";
        return true;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (assignmentSort === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (assignmentSort === "assigned") {
        return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
      }
      if (assignmentSort === "score") {
        return (b.score || 0) - (a.score || 0);
      }
      return 0;
    });

    return list;
  }, [classInfo, assignmentFilter, assignmentSort]);

  // Filtered Announcements
  const processedAnnouncements = useMemo(() => {
    if (announcementFilter === "unread") {
      return announcements.filter((ann) => !ann.read);
    }
    return announcements;
  }, [announcements, announcementFilter]);

  return {
    classInfo,
    activeTab,
    setActiveTab,
    assignmentFilter,
    setAssignmentFilter,
    assignmentSort,
    setAssignmentSort,
    announcementFilter,
    setAnnouncementFilter,
    announcements: processedAnnouncements,
    allAssignments: classInfo?.assignments || [],
    filteredAssignments: processedAssignments,
    markAnnouncementAsRead,
  };
}
