import React, { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getClasses } from "@/data/teacher-data";
import { mockTeacherClasses } from "@/mock/teacherClasses";
import { LevelBadge } from "@/components/teacher/badges";
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock3,
  HelpCircle,
  BookOpen,
  Lock,
  Unlock,
  Clock,
  CheckSquare
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/progress")({
  validateSearch: (search: Record<string, unknown>) => ({
    classId: typeof search.classId === "string" ? search.classId : undefined,
    view: (search.view === "homework" || search.view === "roadmap") ? (search.view as "homework" | "roadmap") : undefined,
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: TeacherProgressPage,
});

interface StudentRoadmap {
  id: string;
  name: string;
  progressPct: number;
  currentModule: string;
  completedLessons: string;
  nextUnlock: string;
  status: "On track" | "Behind" | "Stuck" | "Completed";
}

interface Submission {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
  status: "Submitted" | "Not submitted" | "Late" | "Graded";
  submittedAt?: string;
  score?: number;
  feedback?: string;
  studentAnswer?: string;
  duration?: string;
}

// Helper to generate deterministic self-study roadmap progress matching Yêu cầu B & F
function getSelfStudyRoadmapFor(level: string, students: any[]): StudentRoadmap[] {
  return students.map((student, idx) => {
    let progressPct = 0;
    let currentModule = "";
    let completedLessons = "";
    let nextUnlock = "";
    let status: "On track" | "Behind" | "Stuck" | "Completed" = "On track";

    const cycle = idx % 4;
    
    if (cycle === 0) {
      progressPct = 100;
      currentModule = `${level} Mock Test`;
      completedLessons = "30/30";
      nextUnlock = "Course Completed";
      status = "Completed";
    } else if (cycle === 1) {
      progressPct = 75;
      currentModule = `Grammar ${level} - Unit 4`;
      completedLessons = "22/30";
      nextUnlock = "Unit 4 Review Quiz";
      status = "On track";
    } else if (cycle === 2) {
      progressPct = 45;
      currentModule = `Basic Vocabulary ${level} - Unit 2`;
      completedLessons = "13/30";
      nextUnlock = "Vocabulary Unit 2 Quiz";
      status = "Behind";
    } else {
      progressPct = 25;
      currentModule = `Alphabet Foundations ${level} - Unit 3`;
      completedLessons = "7/30";
      nextUnlock = "Alphabet Unit 3 Quiz";
      status = "Stuck";
    }

    // Explicit overrides for Nguyễn Văn A and Yuki Sato to match attention/support state
    if (student.name.includes("Nguyễn Văn A")) {
      progressPct = 35;
      currentModule = `Basic Vocabulary ${level} - Unit 1`;
      completedLessons = "10/30";
      nextUnlock = "Vocabulary Unit 1 Quiz";
      status = "Stuck";
    } else if (student.name.includes("Yuki Sato")) {
      progressPct = 20;
      currentModule = `Alphabet Foundations ${level} - Unit 2`;
      completedLessons = "5/30";
      nextUnlock = "Alphabet Unit 2 Quiz";
      status = "Stuck";
    }
    return {
      id: student.id,
      name: student.name,
      progressPct,
      currentModule,
      completedLessons,
      nextUnlock,
      status,
    };
  });
}

// Smart mock submission generator for homework drill-down
function getMockSubmissionsFor(assignment: any, students: any[]): Submission[] {
  return students.map((student, idx) => {
    let status: "Submitted" | "Not submitted" | "Late" | "Graded";
    
    if (idx === 0) {
      status = "Graded";
    } else if (idx === 1) {
      status = "Submitted";
    } else if (idx === 2) {
      status = "Late";
    } else if (idx === 3) {
      status = "Not submitted";
    } else {
      const remainder = idx % 4;
      if (remainder === 0) status = "Graded";
      else if (remainder === 1) status = "Submitted";
      else if (remainder === 2) status = "Late";
      else status = "Not submitted";
    }

    let score: number | undefined;
    let feedback = "";
    let submittedAt: string | undefined;
    let studentAnswer = "";
    let duration = "25 mins";

    if (status === "Graded") {
      score = 9.0;
      submittedAt = "2026-06-18 14:25";
      feedback = "Excellent results! Good grammar usage and smooth sentences.";
      studentAnswer = `[Lesson content mock] - Module: ${assignment.moduleType}\nSelected Answers:\n1. A (Correct)\n2. B (Correct)\n3. A (Correct)\n4. C (Correct)\n\nStudent's short answer:\nTôi rất thích học tiếng Nhật tại lớp Midori. Chúc sensei nhiều sức khỏe!`;
      duration = "15 mins";
    } else if (status === "Submitted") {
      submittedAt = "2026-06-19 09:10";
      studentAnswer = `[Lesson content mock] - Module: ${assignment.moduleType}\nSelected Answers:\n1. A (Correct)\n2. C (Incorrect - Correct: B)\n3. B (Correct)\n4. C (Correct)\n\nStudent's short answer:\nEm mong muốn học tốt hơn mỗi ngày. Cảm ơn cô giáo!`;
      duration = "18 mins";
    } else if (status === "Late") {
      score = 7.5;
      submittedAt = "2026-06-21 11:45";
      feedback = "Please submit on time. Watch out for particle choices.";
      studentAnswer = `[Lesson content mock] - Module: ${assignment.moduleType}\nSelected Answers:\n1. B (Incorrect)\n2. C (Correct)\n3. A (Correct)\n4. D (Incorrect)\n\nStudent's short answer:\nEm xin lỗi vì nộp bài muộn ạ. Em sẽ chú ý hạn nộp bài lần sau.`;
      duration = "30 mins";
    }

    return {
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      studentAvatar: student.avatar,
      status,
      submittedAt,
      score,
      feedback,
      studentAnswer,
      duration,
    };
  });
}

function TeacherProgressPage() {
  const { classId: searchClassId, view: searchView, q: urlQ } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const allClasses = getClasses();

  // Selected class & view state
  const selectedClassId = searchClassId || null;
  const activeSubTab = searchView || "homework";

  // Drill-down states for Homework tab
  const [viewStep, setViewStep] = useState<"list" | "submissions" | "detail" | "student-subs">("list");
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [subFilter, setSubFilter] = useState<string>("All");
  
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [viewStepSource, setViewStepSource] = useState<"assignment" | "student">("assignment");
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, Record<string, Submission>>>({});
  
  const [roadmapStep, setRoadmapStep] = useState<"list" | "detail">("list");
  const [selectedRoadmapStudent, setSelectedRoadmapStudent] = useState<any | null>(null);

  // Search query derived from URL ?q= param
  const searchQ = urlQ ?? "";

  // Update URL q param when user types in header search
  const handleSearchQ = (q: string) => {
    navigate({
      search: { classId: searchClassId, view: searchView, q },
    });
  };

  // Filtered classes based on search query
  const filteredClasses = useMemo(() => {
    if (!searchQ.trim()) return allClasses;
    const q = searchQ.trim().toLowerCase();
    return allClasses.filter((cls) =>
      cls.name.toLowerCase().includes(q) ||
      cls.level.toLowerCase().includes(q) ||
      (cls.jpName && cls.jpName.toLowerCase().includes(q)) ||
      cls.status.toLowerCase().includes(q)
    );
  }, [allClasses, searchQ]);

  // Reset drill-down view when classId or active tab changes
  useEffect(() => {
    setViewStep("list");
    setSelectedAssignment(null);
    setSelectedSubmission(null);
    setSubmissions([]);
    setSelectedStudent(null);
    setViewStepSource("assignment");
    setRoadmapStep("list");
    setSelectedRoadmapStudent(null);
  }, [selectedClassId, activeSubTab]);

  // Resolve detailed mock class info
  const classInfo = useMemo(() => {
    if (!selectedClassId) return null;
    let found = mockTeacherClasses.find((c) => c.id === selectedClassId);
    if (!found) {
      // Find fallback from base classes
      const baseClass = allClasses.find((c) => c.id === selectedClassId);
      if (baseClass) {
        const template = baseClass.level === "N4" ? (mockTeacherClasses[1] || mockTeacherClasses[0]) : mockTeacherClasses[0];
        found = {
          ...template,
          id: baseClass.id,
          name: baseClass.name,
          level: baseClass.level,
          members: baseClass.studentCount,
          avgScore: baseClass.progress / 10 + 2,
          nextDeadline: baseClass.startDate,
          createdDate: baseClass.startDate,
        };
      }
    }
    return found || null;
  }, [selectedClassId, allClasses]);

  useEffect(() => {
    if (!classInfo) return;
    const initialData: Record<string, Record<string, Submission>> = {};
    classInfo.students.forEach((student) => {
      initialData[student.id] = {};
    });

    classInfo.assignments.forEach((assignment) => {
      const submissionsForAssign = getMockSubmissionsFor(assignment, classInfo.students);
      submissionsForAssign.forEach((sub) => {
        if (initialData[sub.studentId]) {
          initialData[sub.studentId][assignment.id] = sub;
        }
      });
    });

    setStudentSubmissions(initialData);
  }, [classInfo]);

  const studentMetrics = useMemo(() => {
    if (!classInfo || !studentSubmissions) return [];

    return classInfo.students.map((student) => {
      const subsMap = studentSubmissions[student.id] || {};
      const subsList = Object.values(subsMap);

      let submitted = 0;
      let missing = 0;
      let late = 0;
      let needsGrading = 0;
      let totalScore = 0;
      let gradedCount = 0;
      let lastSubmitted = "";

      subsList.forEach((sub) => {
        if (sub.status === "Submitted") {
          submitted++;
          needsGrading++;
          if (sub.submittedAt && (!lastSubmitted || sub.submittedAt > lastSubmitted)) {
            lastSubmitted = sub.submittedAt;
          }
        } else if (sub.status === "Late") {
          submitted++;
          late++;
          needsGrading++;
          if (sub.submittedAt && (!lastSubmitted || sub.submittedAt > lastSubmitted)) {
            lastSubmitted = sub.submittedAt;
          }
        } else if (sub.status === "Graded") {
          submitted++;
          if (sub.score !== undefined) {
            totalScore += sub.score;
            gradedCount++;
          }
          if (sub.submittedAt && (!lastSubmitted || sub.submittedAt > lastSubmitted)) {
            lastSubmitted = sub.submittedAt;
          }
        } else {
          missing++;
        }
      });

      const avgScore = gradedCount > 0 ? parseFloat((totalScore / gradedCount).toFixed(1)) : 0;

      let status: "On Track" | "Needs Grading" | "Missing Homework" | "At Risk" = "On Track";
      if ((avgScore > 0 && avgScore < 6.5) || missing > 2) {
        status = "At Risk";
      } else if (missing > 0) {
        status = "Missing Homework";
      } else if (needsGrading > 0) {
        status = "Needs Grading";
      }

      return {
        student,
        submitted,
        missing,
        late,
        needsGrading,
        avgScore,
        lastSubmitted: lastSubmitted || "N/A",
        status,
      };
    });
  }, [classInfo, studentSubmissions]);

  const studentRoadmapData = useMemo(() => {
    if (!classInfo) return [];
    const students = classInfo.students;
    const roadmap = getSelfStudyRoadmapFor(classInfo.level, students);

    return roadmap.map((r) => {
      const studentInfo = students.find((s) => s.id === r.id) || { lastActivity: "Unknown", needSupport: false, avgScore: 8 };
      
      let unlockStatus: "Unlocked" | "Locked" | "Ready to Unlock" | "Needs Review Quiz" = "Ready to Unlock";
      if (r.status === "Completed") unlockStatus = "Unlocked";
      else if (r.status === "Stuck") unlockStatus = "Locked";
      else if (r.status === "Behind") unlockStatus = "Needs Review Quiz";

      let riskLevel: "Good" | "Watch" | "At Risk" = "Good";
      if (studentInfo.needSupport || r.status === "Stuck") {
        riskLevel = "At Risk";
      } else if (r.status === "Behind") {
        riskLevel = "Watch";
      }

      let lockedNextModule = "Next Unit Content";
      let requiredCondition = "Complete previous reviews";
      let weakSkill = "None";
      let recommendation = "Keep studying!";

      if (r.name.includes("Nguyễn Văn A")) {
        lockedNextModule = `Basic Vocabulary ${classInfo.level} - Unit 2`;
        requiredCondition = "Pass Unit 1 Review Quiz with score > 8.0";
        weakSkill = "Kanji Recognition";
        recommendation = "Practice Unit 1 kanji flashcards and grammar patterns before re-attempting the quiz.";
      } else if (r.name.includes("Yuki Sato")) {
        lockedNextModule = `Alphabet Foundations ${classInfo.level} - Unit 3`;
        requiredCondition = "Pass Hiragana/Katakana Writing Quiz";
        weakSkill = "Katakana spelling";
        recommendation = "Focus on writing practice for combination sounds (shya, chyu, etc.).";
      } else if (r.name.includes("Daniel Kim")) {
        lockedNextModule = `Basic Vocabulary ${classInfo.level} - Unit 4`;
        requiredCondition = "Complete Vocabulary Unit 3 Exercises";
        weakSkill = "Listening comprehension";
        recommendation = "Listen to N5 listening dialogues at least 3 times.";
      }

      return {
        ...r,
        lastActivity: studentInfo.lastActivity || "2 hours ago",
        unlockStatus,
        riskLevel,
        lockedNextModule,
        requiredCondition,
        weakSkill,
        recommendation,
      };
    });
  }, [classInfo]);

  const needyStudents = useMemo(() => {
    if (!classInfo) return [];
    const students = classInfo.students;
    return students.filter(s => s.needSupport || s.avgScore < 7.5).map((s, idx) => {
      let missingHw = 1;
      let lateHw = 0;
      let suggestion = "Review grammar particles and basic vocabulary.";

      if (s.name.includes("Nguyễn Văn A")) {
        missingHw = 3;
        lateHw = 2;
        suggestion = "Urgent: Assign extra Vocabulary Unit 1 quiz & schedule 1-on-1 tutoring.";
      } else if (s.name.includes("Yuki Sato")) {
        missingHw = 4;
        lateHw = 1;
        suggestion = "High risk: Recommend reviewing Alphabet Foundations Hiragana basic tables.";
      } else if (s.name.includes("Daniel Kim")) {
        missingHw = 2;
        lateHw = 1;
        suggestion = "Behind schedule: Send reminder message for past assignments.";
      }

      return {
        id: s.id,
        name: s.name,
        missingHw,
        lateHw,
        avgScore: s.avgScore,
        suggestion,
      };
    });
  }, [classInfo]);

  const handleSelectClass = (id: string | null) => {
    navigate({
      search: (prev) => ({
        ...prev,
        classId: id ? id : undefined,
      }),
    });
  };

  const handleSelectSubTab = (tab: "homework" | "roadmap") => {
    navigate({
      search: (prev) => ({
        ...prev,
        view: tab === "homework" ? undefined : tab,
      }),
    });
  };

  // Helper status badge builders
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500 dark:bg-green-500/25 border-green-500/20";
      case "Closed":
        return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border-border/40";
      case "Upcoming":
      default:
        return "bg-blue-500/10 text-blue-500 dark:bg-blue-500/25 border-blue-500/20";
    }
  };

  const getSubStatusBadge = (status: Submission["status"]) => {
    switch (status) {
      case "Graded":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Graded
          </span>
        );
      case "Submitted":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20 flex items-center gap-1 w-fit">
            <Clock3 className="w-3 h-3" /> Submitted
          </span>
        );
      case "Late":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200/50 dark:border-orange-500/20 flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Late
          </span>
        );
      case "Not submitted":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200/50 dark:border-white/10 flex items-center gap-1 w-fit">
            <HelpCircle className="w-3 h-3" /> Missing
          </span>
        );
    }
  };

  const getRoadmapStatusBadge = (status: StudentRoadmap["status"]) => {
    switch (status) {
      case "Completed":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20">Completed</span>;
      case "On track":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">On track</span>;
      case "Behind":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">Behind</span>;
      case "Stuck":
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200/50 dark:border-red-500/20">Stuck</span>;
    }
  };

  const getUnlockStatusBadge = (status: "Unlocked" | "Locked" | "Ready to Unlock" | "Needs Review Quiz") => {
    switch (status) {
      case "Unlocked":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200/50 dark:border-green-500/20">Unlocked</span>;
      case "Locked":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400 border border-slate-200/50 dark:border-white/10">Locked</span>;
      case "Ready to Unlock":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20">Ready to Unlock</span>;
      case "Needs Review Quiz":
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">Needs Review Quiz</span>;
    }
  };

  const getRiskLevelBadge = (level: "Good" | "Watch" | "At Risk") => {
    switch (level) {
      case "Good":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">Good</span>;
      case "Watch":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">Watch</span>;
      case "At Risk":
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200/50 dark:border-red-500/20">At Risk</span>;
    }
  };

  const getHomeworkStatusBadge = (status: "On Track" | "Needs Grading" | "Missing Homework" | "At Risk") => {
    switch (status) {
      case "On Track":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">On Track</span>;
      case "Needs Grading":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">Needs Grading</span>;
      case "Missing Homework":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/20">Missing Homework</span>;
      case "At Risk":
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200/50 dark:border-red-500/20">At Risk</span>;
    }
  };


  // Actions for Homework drill-down
  const handleOpenSubmissions = (assignment: any) => {
    setSelectedAssignment(assignment);
    const list: Submission[] = [];
    if (classInfo) {
      classInfo.students.forEach((student) => {
        const sub = studentSubmissions[student.id]?.[assignment.id] || {
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          studentAvatar: student.avatar,
          status: "Not submitted" as const,
          studentAnswer: "",
          duration: "",
        };
        list.push(sub);
      });
    }
    setSubmissions(list);
    setSubFilter("All");
    setViewStepSource("assignment");
    setViewStep("submissions");
  };

  const handleOpenDetail = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeScore(submission.score !== undefined ? submission.score : 10);
    setGradeFeedback(submission.feedback ?? "");
    setViewStep("detail");
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !selectedAssignment) return;

    if (gradeScore < 0 || gradeScore > 10) {
      toast.error("Score must be between 0 and 10");
      return;
    }

    const updatedSub: Submission = {
      ...selectedSubmission,
      status: "Graded",
      score: gradeScore,
      feedback: gradeFeedback,
    };

    setStudentSubmissions((prev) => ({
      ...prev,
      [selectedSubmission.studentId]: {
        ...(prev[selectedSubmission.studentId] || {}),
        [selectedAssignment.id]: updatedSub,
      },
    }));

    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.studentId === selectedSubmission.studentId ? updatedSub : sub
      )
    );

    toast.success(`Successfully graded ${selectedSubmission.studentName}'s homework!`);
    
    if (viewStepSource === "student") {
      setViewStep("student-subs");
    } else {
      setViewStep("submissions");
    }
  };

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    if (subFilter === "All") return submissions;
    return submissions.filter((sub) => {
      if (subFilter === "Submitted") return sub.status === "Submitted";
      if (subFilter === "Graded") return sub.status === "Graded";
      if (subFilter === "Missing") return sub.status === "Not submitted";
      if (subFilter === "Late") return sub.status === "Late";
      return true;
    });
  }, [submissions, subFilter]);



  // ----------------------------------------------------
  // RENDER SELECTED CLASS DETAILED PROGRESS REPORT
  // ----------------------------------------------------
  if (classInfo) {
    const students = classInfo.students;
    const roadmap = getSelfStudyRoadmapFor(classInfo.level, students);

    // Compute Homework Metrics
    const avgScore = classInfo.avgScore || 8.2;
    const submittedCount = classInfo.assignments.reduce((acc, a) => acc + a.totalSubmissions, 0);
    const missingCount = classInfo.assignments.reduce((acc, a) => acc + a.notSubmittedCount, 0);
    const hwCompletionRate = Math.round((submittedCount / (submittedCount + missingCount || 1)) * 100);

    return (
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Back and Class quick switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => handleSelectClass(null)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Class List
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold">Class:</span>
            <select
              value={classInfo.id}
              onChange={(e) => handleSelectClass(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none cursor-pointer focus:ring-1 focus:ring-primary text-foreground dark:text-white"
            >
              {filteredClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Level {c.level})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hero Header */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/20 text-primary border border-primary/30 uppercase">
                Level {classInfo.level}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-semibold">Teacher: {classInfo.teacher}</span>
            </div>
            <h1 className="text-2xl font-black font-display text-foreground dark:text-white mt-2 leading-tight">
              {classInfo.name} — Progress Report
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Detailed tracking of coursework completion and interactive study roadmap metrics.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.success("Class Progress report exported")}><Users className="mr-1.5 h-3.5 w-3.5" /> Export PDF</Button>
          </div>
        </div>

        {/* Segmented Sub-tab Toggle Switcher */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 w-fit border border-slate-200/50 dark:border-white/5">
          <button
            onClick={() => handleSelectSubTab("homework")}
            className={`px-4 py-2 rounded-lg font-display text-xs font-bold transition-all uppercase tracking-wider ${
              activeSubTab === "homework"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            Homework Progress
          </button>
          <button
            onClick={() => handleSelectSubTab("roadmap")}
            className={`px-4 py-2 rounded-lg font-display text-xs font-bold transition-all uppercase tracking-wider ${
              activeSubTab === "roadmap"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            Self-study Roadmap Progress
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* RENDER ACTIVE TAB CONTENT */}
        {/* ---------------------------------------------------- */}
        {activeSubTab === "homework" ? (
          viewStep === "detail" && selectedAssignment && selectedSubmission ? (
            /* Step 3: Student submission detail view */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (viewStepSource === "student") {
                      setViewStep("student-subs");
                    } else {
                      setViewStep("submissions");
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Submissions
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Submission Detail
                    </span>
                    <h2 className="text-xl font-bold font-display text-foreground dark:text-white mt-1">
                      {selectedAssignment.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>Student: <strong className="text-foreground dark:text-slate-200">{selectedSubmission.studentName}</strong></span>
                      <span>•</span>
                      <span>{selectedSubmission.studentEmail}</span>
                    </div>
                  </div>
                  <div>
                    {getSubStatusBadge(selectedSubmission.status)}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Card className="p-6 space-y-4">
                    <h3 className="font-display font-bold text-base text-foreground dark:text-white">
                      Student Answers
                    </h3>
                    {selectedSubmission.status === "Not submitted" ? (
                      <div className="py-12 text-center text-muted-foreground border border-dashed rounded-2xl border-border/40">
                        <HelpCircle className="w-10 h-10 mx-auto opacity-30 mb-2" />
                        <p className="text-sm font-semibold">This student has not submitted this homework yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-xs border border-border/40">
                          <div>
                            <div className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider mb-0.5">Submitted at</div>
                            <div className="font-bold text-foreground dark:text-white flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {selectedSubmission.submittedAt || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider mb-0.5">Attempt Duration</div>
                            <div className="font-bold text-foreground dark:text-white flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              {selectedSubmission.duration || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider mb-0.5">Late / On Time</div>
                            <div className="font-bold">
                              {selectedSubmission.status === "Late" ? (
                                <span className="text-orange-500 font-bold flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> Late</span>
                              ) : (
                                <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> On Time</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30 font-mono text-xs whitespace-pre-wrap text-foreground dark:text-slate-300 leading-relaxed">
                          {selectedSubmission.studentAnswer}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="p-6">
                    <h3 className="font-display font-bold text-base text-foreground dark:text-white mb-4">
                      Grading & Feedback
                    </h3>
                    <form onSubmit={handleSaveGrade} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                          Score (Out of 10)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          disabled={selectedSubmission.status === "Not submitted"}
                          value={gradeScore}
                          onChange={(e) => setGradeScore(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-bold text-foreground dark:text-white focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                          Teacher Feedback
                        </label>
                        <textarea
                          rows={6}
                          disabled={selectedSubmission.status === "Not submitted"}
                          placeholder="Write constructive comments, tips or next steps..."
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-foreground dark:text-white focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={selectedSubmission.status === "Not submitted"}
                        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-display uppercase tracking-wider"
                      >
                        <Award className="w-4 h-4" /> Save Grade & Feedback
                      </button>
                    </form>
                  </Card>
                </div>
              </div>
            </div>
          ) : viewStep === "submissions" && selectedAssignment ? (
            /* Step 2: Homework submissions list view */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewStep("list")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Homework Progress
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary font-display">
                      {selectedAssignment.moduleType} Assignment
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${getStatusColor(selectedAssignment.status)}`}>
                      {selectedAssignment.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-display text-foreground dark:text-white mt-1 leading-tight">
                    {selectedAssignment.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due date: <strong className="text-foreground dark:text-slate-300">{selectedAssignment.deadline}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                    <div className="text-sm font-black text-foreground dark:text-white">
                      {submissions.filter(s => s.status !== "Not submitted").length}/{students.length}
                    </div>
                    <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Submitted</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                    <div className="text-sm font-black text-amber-500">
                      {submissions.filter(s => s.status === "Submitted").length}
                    </div>
                    <div className="text-[8px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">To Grade</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                    <div className="text-sm font-black text-emerald-500">
                      {Math.round((submissions.filter(s => s.status !== "Not submitted").length / (students.length || 1)) * 100)}%
                    </div>
                    <div className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Rate</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-3">
                {[
                  { id: "All", label: "All Students" },
                  { id: "Submitted", label: "Needs Grading" },
                  { id: "Graded", label: "Graded" },
                  { id: "Late", label: "Late" },
                  { id: "Missing", label: "Missing" },
                ].map((tab) => {
                  const isActive = subFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSubFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3">
                {filteredSubmissions.map((sub) => (
                  <Card
                    key={sub.studentId}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all ${
                      sub.status === "Submitted" ? "border-amber-500/15 bg-amber-500/[0.005]" : "hover:border-slate-300 dark:hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-xs shrink-0">
                        {sub.studentAvatar}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-sm text-foreground dark:text-white truncate">
                          {sub.studentName}
                        </h4>
                        <p className="text-[10px] text-muted-foreground truncate">{sub.studentEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 self-start sm:self-center">
                      <div className="w-28 flex flex-col justify-center">
                        <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">Status</div>
                        {getSubStatusBadge(sub.status)}
                      </div>

                      <div className="w-36">
                        {sub.submittedAt ? (
                          <div>
                            <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">Submitted at</div>
                            <div className="text-[10px] font-semibold text-foreground dark:text-slate-300 truncate">
                              {sub.submittedAt}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">Submitted at</div>
                            <div className="text-[10px] text-muted-foreground italic">No submission</div>
                          </div>
                        )}
                      </div>

                      <div className="w-16 text-center">
                        <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">Score</div>
                        <div className="text-xs font-black text-foreground dark:text-white">
                          {sub.score !== undefined ? (
                            <span className="text-emerald-500 font-bold">{sub.score}/10</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="self-end sm:self-center shrink-0">
                      {sub.status === "Not submitted" ? (
                        <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-black text-muted-foreground opacity-50 select-none cursor-default uppercase tracking-wider">
                          Missing
                        </span>
                      ) : sub.status === "Submitted" ? (
                        <button
                          onClick={() => handleOpenDetail(sub)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-amber-600 transition shadow-sm flex items-center gap-1 font-display"
                        >
                          Grade
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenDetail(sub)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-bold text-foreground dark:text-white uppercase tracking-wider transition border border-border/40 font-display"
                        >
                          View submission
                        </button>
                      )}
                    </div>
                  </Card>
                ))}

                {filteredSubmissions.length === 0 && (
                  <div className="text-center py-12 border border-dashed rounded-3xl border-border/40 bg-slate-50/50 dark:bg-white/[0.01]">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground font-semibold">No student submissions match this status.</p>
                  </div>
                )}
              </div>
            </div>
          ) : viewStep === "student-subs" && selectedStudent ? (
            /* Drill-down: Student Submissions View */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewStep("list");
                    setSelectedStudent(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Student Roster
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">
                    {selectedStudent.avatar}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary font-display">
                      Student Submissions
                    </span>
                    <h2 className="text-xl font-bold font-display text-foreground dark:text-white mt-1 leading-tight">
                      {selectedStudent.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  {(() => {
                    const metrics = studentMetrics.find(m => m.student.id === selectedStudent.id);
                    if (!metrics) return null;
                    return (
                      <>
                        <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 text-center min-w-[80px]">
                          <div className="text-sm font-black text-foreground dark:text-white">{metrics.submitted}</div>
                          <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Submitted</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 text-center min-w-[80px]">
                          <div className="text-sm font-black text-red-500">{metrics.missing}</div>
                          <div className="text-[8px] text-red-500 font-bold uppercase tracking-wider">Missing</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 text-center min-w-[80px]">
                          <div className="text-sm font-black text-emerald-500">{metrics.avgScore > 0 ? `${metrics.avgScore}/10` : "—"}</div>
                          <div className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider">Avg Score</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <Card className="p-5 space-y-4">
                <h3 className="font-display font-bold text-sm text-foreground dark:text-white">Assignments List</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 pb-2 text-muted-foreground font-bold">
                        <th className="py-2.5">Assignment Title</th>
                        <th className="py-2.5">Due Date</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-center">Score</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {classInfo.assignments.map((assignment) => {
                        const sub = studentSubmissions[selectedStudent.id]?.[assignment.id] || {
                          studentId: selectedStudent.id,
                          studentName: selectedStudent.name,
                          studentEmail: selectedStudent.email,
                          studentAvatar: selectedStudent.avatar,
                          status: "Not submitted" as const,
                          studentAnswer: "",
                          duration: "",
                        };
                        return (
                          <tr key={assignment.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                            <td className="py-3 font-semibold text-foreground dark:text-white">{assignment.title}</td>
                            <td className="py-3 text-muted-foreground">{assignment.deadline}</td>
                            <td className="py-3">{getSubStatusBadge(sub.status)}</td>
                            <td className="py-3 text-center font-bold">
                              {sub.score !== undefined ? (
                                <span className="text-emerald-500">{sub.score}/10</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              {sub.status === "Not submitted" ? (
                                <span className="inline-block px-2.5 py-1 text-[10px] text-muted-foreground italic font-semibold">No Submission</span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setSelectedSubmission(sub);
                                    setViewStepSource("student");
                                    setGradeScore(sub.score !== undefined ? sub.score : 10);
                                    setGradeFeedback(sub.feedback ?? "");
                                    setViewStep("detail");
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition font-display uppercase tracking-wider"
                                >
                                  {sub.status === "Submitted" ? "Grade" : "View & Edit"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : (
            /* Step 1: Homework progress main student roster listing */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-white/5 pb-2">
                <h2 className="font-display font-black text-lg text-foreground dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Homework Progress Summary
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assigned homework completion rates, student rosters, and actions matrix.
                </p>
              </div>

              {/* Stats KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Homework Completion</div>
                  <div className="text-2xl font-black text-foreground dark:text-white mt-1">{hwCompletionRate}%</div>
                  <Progress value={hwCompletionRate} className="mt-2 h-1.5" />
                </Card>
                <Card className="p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Submitted Ratio</div>
                  <div className="text-2xl font-black text-foreground dark:text-white mt-1">{submittedCount} / {submittedCount + missingCount}</div>
                  <div className="text-[9px] text-muted-foreground mt-1.5 uppercase font-semibold">Total Submissions</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Average Homework Score</div>
                  <div className="text-2xl font-black text-emerald-500 mt-1">{avgScore}/10</div>
                  <div className="text-[9px] text-muted-foreground mt-1.5 uppercase font-semibold">Class Roster Mean</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Missing / Late Tasks</div>
                  <div className="text-2xl font-black text-destructive mt-1">{missingCount} / {studentMetrics.reduce((acc, s) => acc + s.late, 0)}</div>
                  <div className="text-[9px] text-muted-foreground mt-1.5 uppercase font-semibold">Requires Intervention</div>
                </Card>
              </div>

              {/* Primary Student Homework Progress Table */}
              <Card className="p-5 space-y-4">
                <h3 className="font-display font-bold text-sm text-foreground dark:text-white">Student Homework Progress</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 pb-2 text-muted-foreground font-bold">
                        <th className="py-2.5">Student Name</th>
                        <th className="py-2.5 text-center">Submitted</th>
                        <th className="py-2.5 text-center">Missing</th>
                        <th className="py-2.5 text-center">Late</th>
                        <th className="py-2.5 text-center">Needs Grading</th>
                        <th className="py-2.5 text-center">Average Score</th>
                        <th className="py-2.5">Last Submitted</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {studentMetrics.map(({ student, submitted, missing, late, needsGrading, avgScore, lastSubmitted, status }) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                          <td className="py-3 font-semibold text-foreground dark:text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-[10px] shrink-0">
                              {student.avatar}
                            </div>
                            <div>
                              <div className="font-semibold">{student.name}</div>
                              <div className="text-[9px] text-muted-foreground font-normal">{student.email}</div>
                            </div>
                          </td>
                          <td className="py-3 text-center font-bold">{submitted}</td>
                          <td className="py-3 text-center font-bold text-red-500">{missing}</td>
                          <td className="py-3 text-center font-bold text-orange-500">{late}</td>
                          <td className="py-3 text-center font-bold text-amber-500">{needsGrading}</td>
                          <td className={`py-3 text-center font-bold ${
                            avgScore >= 8.0 ? "text-emerald-500" : avgScore >= 6.5 ? "text-amber-500" : "text-red-500"
                          }`}>{avgScore > 0 ? `${avgScore}/10` : "—"}</td>
                          <td className="py-3 text-muted-foreground">{lastSubmitted}</td>
                          <td className="py-3">{getHomeworkStatusBadge(status)}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setViewStepSource("student");
                                setViewStep("student-subs");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition font-display uppercase tracking-wider"
                            >
                              View Submissions
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Lower Section: Homework Assignments (Overview) */}
                <Card className="lg:col-span-2 p-5 space-y-4">
                  <h3 className="font-display font-bold text-sm text-foreground dark:text-white">Assignment Overview</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 pb-2 text-muted-foreground font-bold">
                          <th className="py-2.5">Homework Title</th>
                          <th className="py-2.5">Due Date</th>
                          <th className="py-2.5 text-center">Submitted</th>
                          <th className="py-2.5 text-center">Missing</th>
                          <th className="py-2.5 text-center">Avg Score</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {classInfo.assignments.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                            <td className="py-3 font-semibold text-foreground dark:text-white">{a.title}</td>
                            <td className="py-3 text-muted-foreground">{a.deadline}</td>
                            <td className="py-3 text-center font-bold text-foreground dark:text-slate-300">
                              {a.totalSubmissions} / {students.length}
                            </td>
                            <td className="py-3 text-center font-bold text-red-500">{a.notSubmittedCount}</td>
                            <td className="py-3 text-center font-bold text-emerald-500">{a.avgScore ? `${a.avgScore}/10` : "—"}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleOpenSubmissions(a)}
                                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition font-display uppercase tracking-wider"
                              >
                                View submissions
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Students needing attention (span 1) */}
                <Card className="p-5 space-y-4">
                  <h3 className="font-display font-bold text-sm text-foreground dark:text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
                    Intervention Needed
                  </h3>
                  <div className="space-y-3">
                    {needyStudents.slice(0, 3).map((student) => (
                      <div key={student.id} className="p-3 rounded-xl border border-destructive/20 bg-destructive/[0.02] space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-xs text-foreground dark:text-white">{student.name}</span>
                          <span className="text-[10px] font-black text-red-500">{student.avgScore}/10 Avg</span>
                        </div>
                        <div className="flex gap-3 text-[10px] text-muted-foreground font-semibold">
                          <span>Missing HW: <strong className="text-red-500">{student.missingHw}</strong></span>
                          <span>Late HW: <strong className="text-orange-500">{student.lateHw}</strong></span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-[10px] text-muted-foreground leading-relaxed">
                          <span className="font-bold text-primary">Suggest:</span> {student.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )
        ) : (
          /* Roadmap Tab active content */
          roadmapStep === "detail" && selectedRoadmapStudent ? (
            /* Drill-down: Student Roadmap Detail View */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRoadmapStep("list");
                    setSelectedRoadmapStudent(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Student Roadmap List
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">
                    {selectedRoadmapStudent.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary font-display">
                      Self-study Roadmap Detail
                    </span>
                    <h2 className="text-xl font-bold font-display text-foreground dark:text-white mt-1 leading-tight flex items-center gap-2">
                      {selectedRoadmapStudent.name}
                      {getRiskLevelBadge(selectedRoadmapStudent.riskLevel)}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Status: {getRoadmapStatusBadge(selectedRoadmapStudent.status)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast.success(`Reminder sent to ${selectedRoadmapStudent.name} regarding self-study activity!`);
                    }}
                  >
                    Send Study Reminder
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Left panel: progress metrics */}
                <Card className="md:col-span-2 p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                      <span>Overall Roadmap Progress</span>
                      <span className="text-foreground dark:text-white">{selectedRoadmapStudent.progressPct}%</span>
                    </div>
                    <Progress value={selectedRoadmapStudent.progressPct} className="h-3 rounded-full" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Current Module</span>
                      <span className="text-sm font-bold text-foreground dark:text-white mt-1 block">{selectedRoadmapStudent.currentModule}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Completed Lessons</span>
                      <span className="text-sm font-bold text-foreground dark:text-white mt-1 block">{selectedRoadmapStudent.completedLessons}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Last Activity</span>
                      <span className="text-sm font-bold text-foreground dark:text-white mt-1 block">{selectedRoadmapStudent.lastActivity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Unlock Status</span>
                      <span className="mt-1 block">{getUnlockStatusBadge(selectedRoadmapStudent.unlockStatus)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border/40 space-y-2">
                    <h4 className="text-xs font-bold text-foreground dark:text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Next Unlocked Step
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground font-semibold">Next Module:</span>
                        <p className="font-bold mt-0.5 text-foreground dark:text-slate-200">{selectedRoadmapStudent.lockedNextModule}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold">Required Condition:</span>
                        <p className="font-bold mt-0.5 text-amber-500 font-mono text-[11px]">{selectedRoadmapStudent.requiredCondition}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Right panel: learning diagnosis & recommendation */}
                <Card className="p-6 space-y-6">
                  <h3 className="font-display font-bold text-sm text-foreground dark:text-white pb-2 border-b border-border/40 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" /> Learning Diagnostics
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Diagnosed Weak Skill</span>
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 mt-1">{selectedRoadmapStudent.weakSkill}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tailored AI Recommendations</span>
                      <div className="p-3 rounded-xl border border-primary/20 bg-primary/[0.01] text-muted-foreground leading-relaxed font-semibold">
                        {selectedRoadmapStudent.recommendation}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          toast.success(`Assigned extra exercises for ${selectedRoadmapStudent.name} on ${selectedRoadmapStudent.weakSkill}!`);
                        }}
                        className="w-full py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold transition text-center text-[10px] uppercase tracking-wider font-display"
                      >
                        Assign Extra Skill Exercise
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Step 1: Student self-study progress roster list */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-white/5 pb-2">
                <h2 className="font-display font-black text-lg text-foreground dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Self-study Roadmap Progress Summary
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  System-managed curriculum progress matching the unlocked levels path.
                </p>
              </div>

              {/* Stats KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Roadmap Completion</div>
                  <div className="text-2xl font-black text-primary mt-1">68%</div>
                  <Progress value={68} className="mt-2 h-1.5" />
                </Card>
                <Card className="p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Current Active Module</div>
                  <div className="text-xs font-black text-foreground dark:text-white mt-2 truncate font-mono">Grammar {classInfo.level} - Unit 4</div>
                  <div className="text-[9px] text-muted-foreground mt-1 uppercase font-semibold">Unlocked Course Section</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Completed Modules</div>
                  <div className="text-2xl font-black text-foreground dark:text-white mt-1">3 / 6</div>
                  <div className="text-[9px] text-muted-foreground mt-1.5 uppercase font-semibold">Milestones Checked</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Next Unlock Condition</div>
                  <div className="text-[10px] font-black text-amber-500 mt-2">Pass Unit 4 Review Quiz</div>
                  <div className="text-[9px] text-muted-foreground mt-1 uppercase font-semibold">Needs Grade &gt; 8.0</div>
                </Card>
              </div>

              {/* Unlock Status Summary */}
              <Card className="p-5 space-y-3">
                <h3 className="font-display font-bold text-sm text-foreground dark:text-white">Unlock Status Summary</h3>
                <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                  <p>
                    The self-study roadmap is automatically unlocked for students based on their performance:
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-left mt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-border/40 space-y-1">
                      <span className="font-bold text-emerald-500 uppercase tracking-wider text-[9px] block">Performance Based</span>
                      <span>Unlocks automatically when student scores average &gt; 8.0 in previous review quizzes.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-border/40 space-y-1">
                      <span className="font-bold text-primary uppercase tracking-wider text-[9px] block">Curriculum Control</span>
                      <span>System-managed curriculum ensures correct learning order (Alphabet ➔ Vocabulary ➔ Grammar).</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Student study progress list */}
              <Card className="p-5 space-y-4">
                <h3 className="font-display font-bold text-sm text-foreground dark:text-white">Student Study Progress</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 pb-2 text-muted-foreground font-bold">
                        <th className="py-2.5">Student Name</th>
                        <th className="py-2.5">Roadmap Progress</th>
                        <th className="py-2.5">Current Module</th>
                        <th className="py-2.5 text-center">Completed Lessons</th>
                        <th className="py-2.5">Last Activity</th>
                        <th className="py-2.5">Next Unlock Condition</th>
                        <th className="py-2.5">Unlock Status</th>
                        <th className="py-2.5">Risk Level</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {studentRoadmapData.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                          <td className="py-3 font-semibold text-foreground dark:text-white">{s.name}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Progress value={s.progressPct} className="h-1.5 w-16" />
                              <span className="font-bold text-[10px]">{s.progressPct}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground">{s.currentModule}</td>
                          <td className="py-3 text-center font-bold text-foreground dark:text-slate-300">{s.completedLessons}</td>
                          <td className="py-3 text-muted-foreground">{s.lastActivity}</td>
                          <td className="py-3 text-muted-foreground font-mono text-[10px]">{s.nextUnlock}</td>
                          <td className="py-3">
                            {getUnlockStatusBadge(s.unlockStatus)}
                          </td>
                          <td className="py-3">
                            {getRiskLevelBadge(s.riskLevel)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedRoadmapStudent(s);
                                  setRoadmapStep("detail");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition font-display uppercase tracking-wider"
                              >
                                View Detail
                              </button>
                              <button
                                onClick={() => {
                                  toast.success(`Reminder sent to ${s.name} regarding self-study activity!`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-bold transition font-display uppercase tracking-wider border border-border/40 text-foreground dark:text-slate-300"
                              >
                                Send Reminder
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // CLASS SELECTOR - BROWSE ALL CLASSES LIST VIEW
  // ----------------------------------------------------
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Class Progress"
        subtitle="Track homework completion and self-study roadmap progress across your classes."
      />

      {/* Search results count */}
      {searchQ && (
        <div className="text-xs text-muted-foreground">
          {filteredClasses.length} / {allClasses.length} class{allClasses.length !== 1 ? "es" : ""} found
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 rounded-3xl border border-dashed border-border bg-slate-50/50 dark:bg-white/[0.01] text-center">
            <AlertTriangle className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No classes found for this search.</p>
            {searchQ && (
              <button
                onClick={() => handleSearchQ("")}
                className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition"
              >
                Clear search
              </button>
            )}
          </div>
        ) : filteredClasses.map((cls) => {
          let classMock = mockTeacherClasses.find((c) => c.id === cls.id);
          const atRiskCount = classMock?.students.filter(s => s.needSupport).length || 0;

          return (
            <Card
              key={cls.id}
              className="cursor-pointer transition-all border border-border hover:border-primary/50 hover:shadow-md overflow-hidden flex flex-col justify-between group"
              onClick={() => handleSelectClass(cls.id)}
            >
              <div className="h-1 bg-gradient-to-r from-primary via-blue-400 to-purple-400 opacity-50 group-hover:opacity-100 transition-all" />
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <LevelBadge level={cls.level} />
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black ${
                      cls.status === "Active" ? "bg-green-500/10 text-green-500" : "bg-slate-100 text-slate-500 dark:bg-white/5"
                    }`}>
                      {cls.status}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-foreground dark:text-white leading-tight">{cls.name}</h3>
                  <p className="font-jp text-xs text-muted-foreground mt-0.5">{cls.jpName}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Average Progress</span>
                      <span className="font-bold text-foreground dark:text-white">{cls.progress}%</span>
                    </div>
                    <Progress value={cls.progress} className="h-1.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-100 dark:border-white/5">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                      <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black">Students</div>
                      <div className="text-xs font-bold text-foreground dark:text-white mt-0.5 flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        {cls.studentCount}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                      <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black">At Risk</div>
                      <div className="text-xs font-bold mt-0.5 flex items-center justify-center gap-1 text-red-500">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        {atRiskCount}
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition flex items-center justify-center gap-1 group-hover:bg-primary group-hover:text-primary-foreground font-display uppercase tracking-wider">
                  View Class Progress
                </button>
              </CardContent>
            </Card>
          );
        })
        }
      </div>
    </div>
  );
}
