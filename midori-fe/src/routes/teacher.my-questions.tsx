import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
  Plus,
  Trash2,
  Eye,
  Send,
  MoreVertical,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { homeworkApi, HomeworkResponse } from "@/lib/api/homework";
import { examsApi, ExamResponse } from "@/lib/api/exams";
import { classesApi } from "@/lib/api/classes";
import { authApi } from "@/lib/api/auth";
import { teacherQuestionsApi } from "@/lib/api/teacherQuestions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/my-questions")({
  head: () => ({ meta: [{ title: "My Library — MIDORI Teacher" }] }),
  component: MyQuestionsPage,
});

const getLevelBadgeStyles = (level: string) => {
  switch (level?.toUpperCase()) {
    case "N5":
      return "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]";
    case "N4":
      return "bg-[#eff6ff] text-[#2563eb] border-[#dbeafe]";
    case "N3":
      return "bg-[#faf5ff] text-[#9333ea] border-[#f3e8ff]";
    case "N2":
      return "bg-[#fff7ed] text-[#ea580c] border-[#ffedd5]";
    case "N1":
      return "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]";
    default:
      return "bg-[#f9fafb] text-[#4b5563] border-[#f3f4f6]";
  }
};

const formatDateTime = (isoString?: string) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function MyQuestionsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [selectedSkill, setSelectedSkill] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"homework" | "exam">("homework");
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    N5: true,
    N4: true,
    N3: true,
    N2: true,
    N1: true,
  });

  // Track active dropdown card ID
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  // Assign & Preview modal states
  const [assignTarget, setAssignTarget] = useState<HomeworkResponse | ExamResponse | null>(null);
  const [assignType, setAssignType] = useState<"homework" | "exam" | null>(null);
  const [assignClassIds, setAssignClassIds] = useState<string[]>([]);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignDueTime, setAssignDueTime] = useState("23:59");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [previewTarget, setPreviewTarget] = useState<HomeworkResponse | ExamResponse | null>(null);
  const [previewType, setPreviewType] = useState<"homework" | "exam" | null>(null);

  // Queries
  const { user } = useAuth();

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getAllClasses(),
  });

  const { data: homeworks = [], isLoading: homeworksLoading } = useQuery({
    queryKey: ["teacherAllHomeworks"],
    queryFn: () => homeworkApi.getTeacherHomeworks().then((res) => res),
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["teacherAllExams", user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return examsApi.getExamsByTeacher(user.id).then((res) => res);
    },
    enabled: !!user?.id,
  });

  // Fetch lessons to map lesson names
  const { data: n5Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N5"],
    queryFn: () => teacherQuestionsApi.getLessons("N5").then((res) => res),
  });
  const { data: n4Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N4"],
    queryFn: () => teacherQuestionsApi.getLessons("N4").then((res) => res),
  });
  const { data: n3Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N3"],
    queryFn: () => teacherQuestionsApi.getLessons("N3").then((res) => res),
  });
  const { data: n2Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N2"],
    queryFn: () => teacherQuestionsApi.getLessons("N2").then((res) => res),
  });
  const { data: n1Lessons = [] } = useQuery({
    queryKey: ["questionBankLessons", "N1"],
    queryFn: () => teacherQuestionsApi.getLessons("N1").then((res) => res),
  });

  const lessonsMap = useMemo(() => {
    const map = new Map<number, string>();
    const all = [...n5Lessons, ...n4Lessons, ...n3Lessons, ...n2Lessons, ...n1Lessons];
    all.forEach((l) => map.set(l.id, l.lessonName));
    return map;
  }, [n5Lessons, n4Lessons, n3Lessons, n2Lessons, n1Lessons]);

  const classMap = useMemo(() => {
    const map = new Map<string, { name: string; level: string }>();
    classes.forEach((c) => {
      map.set(c.id, { name: c.name, level: c.level || "N5" });
    });
    return map;
  }, [classes]);

  // Mutations
  const deleteHomeworkMutation = useMutation({
    mutationFn: (id: string) => homeworkApi.deleteHomework(id),
    onSuccess: () => {
      toast.success("Homework deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["teacherAllHomeworks"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete homework");
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: (id: string) => examsApi.deleteExam(id),
    onSuccess: () => {
      toast.success("Exam deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["teacherAllExams", user?.id] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete exam");
    },
  });

  const handleDeleteHomework = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm("Are you sure you want to delete this homework?")) {
      deleteHomeworkMutation.mutate(id);
    }
  };

  const handleDeleteExam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm("Are you sure you want to delete this exam?")) {
      deleteExamMutation.mutate(id);
    }
  };

  const handleOpenAssign = (item: HomeworkResponse | ExamResponse, type: "homework" | "exam", e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAssignTarget(item);
    setAssignType(type);
    setAssignClassIds([]);
    
    // Set default due date (+2 days)
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000 * 2);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setAssignDueDate(`${yyyy}-${mm}-${dd}`);
    setAssignDueTime("23:59");
  };

  const handleOpenPreview = (item: HomeworkResponse | ExamResponse, type: "homework" | "exam", e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreviewTarget(item);
    setPreviewType(type);
  };

  const handleConfirmAssign = async () => {
    if (!assignTarget || !assignType) return;
    if (assignClassIds.length === 0) {
      toast.error("Please select at least one class.");
      return;
    }
    if (!assignDueDate || !assignDueTime) {
      toast.error("Please specify a valid due date and time.");
      return;
    }

    setAssignSubmitting(true);
    try {
      const fullIsoDueDate = new Date(`${assignDueDate}T${assignDueTime}:00`).toISOString();

      if (assignType === "homework") {
        const hw = assignTarget as HomeworkResponse;
        const questionIds = hw.questions?.map((q) => q.id) || [];
        
        // Try resolving lessonId
        const firstQuestion = hw.questions?.[0];
        let resolvedLessonId = hw.lessonId;
        if (!resolvedLessonId && firstQuestion?.lessonId) {
          resolvedLessonId = String(firstQuestion.lessonId);
        }

        for (const classId of assignClassIds) {
          await homeworkApi.createHomework({
            classId,
            lessonId: resolvedLessonId,
            title: hw.title,
            instructions: hw.instructions || "",
            dueDate: fullIsoDueDate,
            maxScore: hw.maxScore || 100,
            attempts: hw.attempts || 2,
            timeLimit: hw.timeLimit || 0,
            questionIds,
          });
        }
        toast.success(`Homework assigned to ${assignClassIds.length} class(es) successfully!`);
        queryClient.invalidateQueries({ queryKey: ["teacherAllHomeworks"] });
      } else {
        const ex = assignTarget as ExamResponse;
        const questionIds = ex.questions?.map((q) => q.id) || [];

        await examsApi.createExam({
          title: ex.title,
          level: ex.level || "N5",
          totalQuestions: questionIds.length,
          timeLimit: ex.timeLimit || 60,
          classIds: assignClassIds,
          questionIds,
          status: "PUBLISHED",
        });
        toast.success(`Exam assigned to ${assignClassIds.length} class(es) successfully!`);
        queryClient.invalidateQueries({ queryKey: ["teacherAllExams", user?.id] });
      }

      setAssignTarget(null);
      setAssignType(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign item.");
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Group Homeworks by level -> lesson -> skill
  const groupedHomeworks = useMemo(() => {
    const groups: Record<string, Record<string, Record<string, HomeworkResponse[]>>> = {
      N5: {},
      N4: {},
      N3: {},
      N2: {},
      N1: {},
    };

    homeworks.forEach((hw) => {
      const cls = classMap.get(hw.classId);
      const level = (cls?.level || hw.lessonId?.split("_")[0] || "N5").toUpperCase();
      
      const matchesSearch = searchQuery === "" || hw.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = selectedLevel === "All" || level === selectedLevel.toUpperCase();

      // Resolve lesson and skill
      const firstQuestion = hw.questions?.[0];
      
      let lessonIdNum = 0;
      if (hw.lessonId) {
        if (hw.lessonId.includes("_")) {
          const parts = hw.lessonId.split("_");
          if (parts.length >= 2) {
            lessonIdNum = parseInt(parts[1]) || 0;
          }
        } else {
          lessonIdNum = parseInt(hw.lessonId) || 0;
        }
      }
      
      const lessonId = lessonIdNum || firstQuestion?.lessonId || 0;
      const lessonName = lessonId ? (lessonsMap.get(lessonId) || `Lesson ${lessonId}`) : "General Practice";

      let rawSkill = "";
      if (hw.lessonId && hw.lessonId.includes("_")) {
        const parts = hw.lessonId.split("_");
        if (parts.length >= 3) {
          rawSkill = parts[2];
        }
      }
      if (!rawSkill) {
        rawSkill = firstQuestion?.skill || firstQuestion?.questionType || "Vocabulary";
      }

      let skill = "Vocabulary";
      if (rawSkill.toUpperCase().includes("VOCABULARY")) skill = "Vocabulary";
      else if (rawSkill.toUpperCase().includes("GRAMMAR")) skill = "Grammar";
      else if (rawSkill.toUpperCase().includes("READING")) skill = "Reading";
      else if (rawSkill.toUpperCase().includes("LISTENING")) skill = "Listening";

      const matchesSkill = selectedSkill === "All" || skill === selectedSkill;

      if (matchesSearch && matchesLevel && matchesSkill) {
        if (!groups[level]) {
          groups[level] = {};
        }
        if (!groups[level][lessonName]) {
          groups[level][lessonName] = {};
        }
        if (!groups[level][lessonName][skill]) {
          groups[level][lessonName][skill] = [];
        }
        groups[level][lessonName][skill].push(hw);
      }
    });

    return groups;
  }, [homeworks, classMap, lessonsMap, searchQuery, selectedLevel, selectedSkill]);

  // Group Exams by level (directly from exam level)
  const groupedExams = useMemo(() => {
    const groups: Record<string, ExamResponse[]> = {
      N5: [],
      N4: [],
      N3: [],
      N2: [],
      N1: [],
    };

    exams.forEach((ex) => {
      const level = (ex.level || "N5").toUpperCase();

      const matchesSearch = searchQuery === "" || ex.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = selectedLevel === "All" || level === selectedLevel.toUpperCase();

      if (matchesSearch && matchesLevel) {
        if (!groups[level]) {
          groups[level] = [];
        }
        groups[level].push(ex);
      }
    });

    return groups;
  }, [exams, searchQuery, selectedLevel]);

  const toggleLevel = (level: string) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const isLoading = classesLoading || homeworksLoading || examsLoading;

  const sortedLevels = ["N5", "N4", "N3", "N2", "N1"];

  const renderHomeworkList = () => {
    const activeLevels = sortedLevels.filter((lvl) => {
      const lessons = groupedHomeworks[lvl] || {};
      return Object.keys(lessons).length > 0;
    });

    if (activeLevels.length === 0) {
      return (
        <Card className="py-16 text-center border-border/60 shadow-sm flex flex-col items-center justify-center space-y-4">
          <ClipboardList className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-base">
            {searchQuery
              ? "No homework assignments found matching your search."
              : "You haven't created any homework assignments yet."}
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {activeLevels.map((lvl) => {
          const lessonsObj = groupedHomeworks[lvl];
          const isExpanded = expandedLevels[lvl] !== false;

          let totalHwCount = 0;
          Object.values(lessonsObj).forEach((skillsObj) => {
            Object.values(skillsObj).forEach((arr) => {
              totalHwCount += arr.length;
            });
          });

          return (
            <div
              key={lvl}
              className="bg-transparent overflow-hidden"
            >
              {/* Level Header */}
              <div
                className="flex items-center justify-between py-4 cursor-pointer border-b border-slate-200/60 dark:border-white/5 bg-transparent"
                onClick={() => toggleLevel(lvl)}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getLevelBadgeStyles(lvl)}`}>
                    {lvl}
                  </span>
                  <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                    {totalHwCount} {totalHwCount === 1 ? "homework" : "homeworks"}
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Nested Structure: Lesson -> Skill -> Homeworks */}
              {isExpanded && (
                <div className="py-6 space-y-6 divide-y divide-gray-100/40 dark:divide-slate-800/40">
                  {Object.entries(lessonsObj).map(([lessonName, skillsObj], lessonIdx) => (
                    <div key={lessonName} className={cn("space-y-4", lessonIdx > 0 && "pt-6")}>
                      {/* Lesson Title */}
                      <h4 className="text-base font-black text-gray-800 dark:text-slate-200 flex items-center gap-2">
                        <BookOpen className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
                        {lessonName}
                      </h4>

                      <div className="pl-6 space-y-4">
                        {Object.entries(skillsObj).map(([skill, list]) => (
                          <div key={skill} className="space-y-2">
                            {/* Skill Badge/Label */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                {skill}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-semibold">
                                ({list.length} homework{list.length !== 1 ? "s" : ""})
                              </span>
                            </div>

                            {/* Homework Cards Grid */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {list.map((hw) => {
                                const cls = classMap.get(hw.classId);
                                const isDropdownOpen = activeDropdownId === hw.id;
                                return (
                                  <Card
                                    key={hw.id}
                                    className="hover:-translate-y-1.5 hover:shadow-[0_12px_24px_-10px_rgba(99,102,241,0.15)] transition-all duration-300 border border-slate-100 dark:border-white/5 relative group flex flex-col justify-between bg-white dark:bg-slate-900/60 rounded-2xl overflow-hidden"
                                  >
                                    <CardContent className="p-5 flex flex-col justify-between flex-1">
                                      <div className="mb-4">
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/40 dark:border-indigo-950/20">
                                            {cls?.name || "Unknown Class"}
                                          </span>
                                          <div className="flex items-center gap-2 relative">
                                            <span
                                              className={cn(
                                                "px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase border",
                                                hw.status === "ASSIGNED"
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-950/20"
                                                  : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-950/20"
                                              )}
                                            >
                                              {hw.status}
                                            </span>

                                            {/* Dropdown Button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdownId(isDropdownOpen ? null : hw.id);
                                              }}
                                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                            >
                                              <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isDropdownOpen && (
                                              <div className="absolute right-0 top-7 w-32 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-20">
                                                <button
                                                  onClick={(e) => handleOpenPreview(hw, "homework", e)}
                                                  className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-1.5"
                                                >
                                                  <Eye className="w-3.5 h-3.5" /> Preview
                                                </button>
                                                <button
                                                  onClick={(e) => handleOpenAssign(hw, "homework", e)}
                                                  className="w-full text-left px-3 py-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-1.5"
                                                >
                                                  <Send className="w-3.5 h-3.5" /> Assign
                                                </button>
                                                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                                <button
                                                  onClick={(e) => handleDeleteHomework(hw.id, e)}
                                                  className="w-full text-left px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-1.5"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-3">
                                          {hw.title}
                                        </h3>
                                      </div>

                                      <div className="space-y-1.5 border-t border-slate-100/50 dark:border-slate-800/40 pt-3">
                                        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-400" /> Due date
                                          </span>
                                          <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {formatDateTime(hw.dueDate)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3 text-slate-400" /> Questions
                                          </span>
                                          <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {hw.totalQuestions || hw.questions?.length || 0}
                                          </span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderExamList = () => {
    const activeLevels = sortedLevels.filter((lvl) => {
      const list = groupedExams[lvl] || [];
      return list.length > 0;
    });

    if (activeLevels.length === 0) {
      return (
        <Card className="py-16 text-center border-border/60 shadow-sm flex flex-col items-center justify-center space-y-4">
          <FileText className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-base">
            {searchQuery
              ? "No exams found matching your search."
              : "You haven't created any exams yet."}
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {activeLevels.map((lvl) => {
          const list = groupedExams[lvl];
          const isExpanded = expandedLevels[lvl] !== false;

          return (
            <div
              key={lvl}
              className="bg-transparent overflow-hidden"
            >
              {/* Level Header */}
              <div
                className="flex items-center justify-between py-4 cursor-pointer border-b border-slate-200/60 dark:border-white/5 bg-transparent"
                onClick={() => toggleLevel(lvl)}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getLevelBadgeStyles(lvl)}`}>
                    {lvl}
                  </span>
                  <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                    {list.length} {list.length === 1 ? "exam" : "exams"}
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Exam Cards Grid */}
              {isExpanded && (
                <div className="py-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((ex) => {
                    const cls = ex.assignedClassId ? classMap.get(ex.assignedClassId) : null;
                    const isDropdownOpen = activeDropdownId === ex.id;
                    return (
                      <Card
                        key={ex.id}
                        className="hover:-translate-y-1.5 hover:shadow-[0_12px_24px_-10px_rgba(99,102,241,0.15)] transition-all duration-300 border border-slate-100 dark:border-white/5 relative group flex flex-col justify-between bg-white dark:bg-slate-900/60 rounded-2xl overflow-hidden"
                      >
                        <CardContent className="p-5 flex flex-col justify-between flex-1">
                          <div className="mb-4">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/40 dark:border-indigo-950/20">
                                {cls?.name || ex.className || "Not Assigned"}
                              </span>
                              <div className="flex items-center gap-2 relative">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase border",
                                    ex.status === "PUBLISHED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-950/20"
                                      : ex.status === "DRAFT"
                                        ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-950/20"
                                        : "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50"
                                  )}
                                >
                                  {ex.status}
                                </span>

                                {/* Dropdown Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownId(isDropdownOpen ? null : ex.id);
                                  }}
                                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                  <div className="absolute right-0 top-7 w-32 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-20">
                                    <button
                                      onClick={(e) => handleOpenPreview(ex, "exam", e)}
                                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-1.5"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Preview
                                    </button>
                                    <button
                                      onClick={(e) => handleOpenAssign(ex, "exam", e)}
                                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-1.5"
                                    >
                                      <Send className="w-3.5 h-3.5" /> Assign
                                    </button>
                                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                    <button
                                      onClick={(e) => handleDeleteExam(ex.id, e)}
                                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-1.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-3">
                              {ex.title}
                            </h3>
                          </div>

                          <div className="space-y-1.5 border-t border-slate-100/50 dark:border-slate-800/40 pt-3">
                            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" /> Duration
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {ex.timeLimit ? `${ex.timeLimit} mins` : "Unlimited"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-slate-400" /> Questions
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {ex.totalQuestions || 0}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">
              PERSONAL LIBRARY
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100 leading-none">
              My Library
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5">
              Manage your personal homework assignments and exams.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab("homework")}
          className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "homework"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Homework ({homeworks.length})
        </button>
        <button
          onClick={() => setActiveTab("exam")}
          className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "exam"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Exam ({exams.length})
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[140px] h-10 border-border/60 shrink-0">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Levels</SelectItem>
              <SelectItem value="N5">N5</SelectItem>
              <SelectItem value="N4">N4</SelectItem>
              <SelectItem value="N3">N3</SelectItem>
              <SelectItem value="N2">N2</SelectItem>
              <SelectItem value="N1">N1</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === "homework" && (
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger className="w-[140px] h-10 border-border/60 shrink-0">
                <SelectValue placeholder="All Skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Skills</SelectItem>
                <SelectItem value="Vocabulary">Vocabulary</SelectItem>
                <SelectItem value="Grammar">Grammar</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Main Content Areas */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : activeTab === "homework" ? (
        renderHomeworkList()
      ) : (
        renderExamList()
      )}

      {/* Assign Dialog */}
      <Dialog open={!!assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign {assignType === "homework" ? "Homework" : "Exam"}</DialogTitle>
            <DialogDescription>
              Assign "{assignTarget?.title}" to multiple classes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Select Classes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Select Classes
              </label>
              <div className="grid gap-2 border rounded-xl p-3 max-h-40 overflow-y-auto bg-slate-50/50">
                {classes.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No classes available.</span>
                ) : (
                  classes.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <Checkbox
                        checked={assignClassIds.includes(c.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAssignClassIds([...assignClassIds, c.id]);
                          } else {
                            setAssignClassIds(assignClassIds.filter((id) => id !== c.id));
                          }
                        }}
                      />
                      <span>
                        {c.name} ({c.level || "N5"})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Due Time
                </label>
                <Input
                  type="time"
                  value={assignDueTime}
                  onChange={(e) => setAssignDueTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)} disabled={assignSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAssign} disabled={assignSubmitting || assignClassIds.length === 0}>
              {assignSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Assign Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTarget} onOpenChange={(open) => !open && setPreviewTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview {previewType === "homework" ? "Homework" : "Exam"}</DialogTitle>
            <DialogDescription>
              "{previewTarget?.title}" contains {previewTarget?.questions?.length || 0} questions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 divide-y divide-slate-100 dark:divide-slate-800">
            {(!previewTarget?.questions || previewTarget.questions.length === 0) ? (
              <p className="text-sm text-center py-6 text-muted-foreground">No questions inside this assignment.</p>
            ) : (
              previewTarget.questions.map((q, idx) => (
                <div key={q.id || idx} className={cn("space-y-2", idx > 0 && "pt-4")}>
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-relaxed">
                      {q.prompt}
                    </p>
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2 pl-7 mt-1.5">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={cn(
                            "text-xs px-2.5 py-1.5 rounded-md border",
                            oIdx === q.correctAnswerIndex
                              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 font-bold"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                          )}
                        >
                          <span className="font-bold mr-1.5">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <p className="text-xs text-muted-foreground pl-7 mt-1">
                      <span className="font-bold">Explanation:</span> {q.explanation}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setPreviewTarget(null)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
