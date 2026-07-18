import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import type { DetailedClassInfo, Assignment, Announcement } from "@/types/class-detail";

export function useClassDetail(classId: string) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("All");
  const [assignmentSort, setAssignmentSort] = useState<string>("deadline");
  const [announcementFilter, setAnnouncementFilter] = useState<string>("all");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const { data: classDetail, isLoading: isClassLoading } = useQuery({
    queryKey: ["classDetail", classId],
    queryFn: () => classesApi.getStudentClassDetail(classId),
    enabled: !!classId,
  });

  const { data: homeworkList = [], isLoading: isHwLoading } = useQuery({
    queryKey: ["classHomework", classId],
    queryFn: () => classesApi.getClassHomework(classId),
    enabled: !!classId,
  });

  const { data: examList = [], isLoading: isExamsLoading } = useQuery({
    queryKey: ["classExams", classId],
    queryFn: () => classesApi.getClassExams(classId),
    enabled: !!classId,
  });

  // Map homework and exams to the "assignments" array structure expected by the frontend
  const assignments = useMemo((): Assignment[] => {
    const hwMapped = homeworkList.map((hw: any): Assignment => {
      let mappedStatus: "Not Started" | "In Progress" | "Submitted" | "Graded" | "Overdue" =
        "Not Started";
      if (hw.submissionStatus === "GRADED") mappedStatus = "Graded";
      else if (hw.submissionStatus === "SUBMITTED") mappedStatus = "Submitted";
      else if (hw.submissionStatus === "IN_PROGRESS") mappedStatus = "In Progress";

      const isExpired = hw.dueDate ? new Date(hw.dueDate).getTime() < new Date().getTime() : false;
      if (isExpired && mappedStatus !== "Graded" && mappedStatus !== "Submitted") {
        mappedStatus = "Overdue";
      }

      if (mappedStatus === "Not Started" && hw.status === "CLOSED") {
        mappedStatus = "Graded";
      }

      return {
        id: hw.id,
        title: hw.title,
        moduleType: "Grammar" as const,
        type: "Homework" as const,
        status: mappedStatus,
        deadline: hw.dueDate || "-",
        assignedDate: hw.createdAt,
        timeLimit: typeof hw.timeLimit === "number" ? hw.timeLimit : 0,
        maxScore: typeof hw.maxScore === "number" ? hw.maxScore : 100,
        score: hw.score !== undefined && hw.score !== null ? hw.score : null,
      };
    });

    const examMapped = examList.map((ex: any): Assignment => {
      // Map backend status (NOT_STARTED / IN_PROGRESS / SUBMITTED / GRADED) to UI
      let mappedStatus: "Not Started" | "In Progress" | "Submitted" | "Graded" | "Overdue" =
        "Not Started";
      const rawStatus = ex.status as string;
      if (rawStatus === "GRADED") mappedStatus = "Graded";
      else if (rawStatus === "SUBMITTED") mappedStatus = "Submitted";
      else if (rawStatus === "IN_PROGRESS") mappedStatus = "In Progress";
      else if (rawStatus === "NOT_STARTED") mappedStatus = "Not Started";

      const isExpired =
        ex.scheduledAt || ex.updatedAt
          ? new Date(ex.scheduledAt || ex.updatedAt).getTime() < new Date().getTime()
          : false;
      if (isExpired && mappedStatus !== "Graded" && mappedStatus !== "Submitted") {
        mappedStatus = "Overdue";
      }

      return {
        id: ex.id,
        title: ex.title,
        moduleType: "Grammar" as const,
        type: "Exam" as const,
        status: mappedStatus,
        deadline: ex.scheduledAt || ex.updatedAt || "-",
        assignedDate: ex.createdAt,
        timeLimit: typeof ex.timeLimit === "number" ? ex.timeLimit : 0,
        maxScore:
          typeof ex.totalPoints === "number"
            ? ex.totalPoints
            : typeof ex.totalQuestions === "number"
              ? ex.totalQuestions
              : 100,
        score: ex.score !== undefined && ex.score !== null ? ex.score : null,
      };
    });

    return [...hwMapped, ...examMapped];
  }, [homeworkList, examList]);

  // Find class information
  const classInfo = useMemo((): DetailedClassInfo | null => {
    if (!classDetail) return null;

    // Get teacher name from the class detail response or use email as fallback
    const teacherName = classDetail.teacherName || "Teacher";

    return {
      id: classDetail.id,
      name: classDetail.name,
      level: classDetail.level as any,
      classCode: classDetail.classCode,
      status: (classDetail.status === "ACTIVE" ? "active" : "archived") as any,
      teacher: teacherName,
      teacherAvatarInitials: teacherName.substring(0, 2).toUpperCase(),
      members: classDetail.maxStudents,
      assignments,
      joinDate: classDetail.joinDate ? new Date(classDetail.joinDate).toLocaleDateString() : "-",
      announcements: [],
    };
  }, [classDetail, assignments]);

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
          return (
            a.status === "Not Started" || a.status === "In Progress" || a.status === "Upcoming"
          );
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
    isLoading: isClassLoading || isHwLoading || isExamsLoading,
  };
}
