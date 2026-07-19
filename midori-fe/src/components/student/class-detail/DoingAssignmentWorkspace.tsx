import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/page-ui";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Save,
  Maximize,
  Minimize,
  Brain,
  BookOpen,
  Check,
  X,
  Award,
  HelpCircle,
  FileText,
  CheckCircle,
  XCircle,
  Sparkles,
  BookOpen as LessonIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { TEACHER_NOTIFICATIONS } from "@/data/teacher-notifications";
import { homeworkApi } from "@/lib/api/homework";
import { examsApi } from "@/lib/api/exams";
import { toast } from "sonner";

interface DoingAssignmentWorkspaceProps {
  assignment: {
    id: string;
    title: string;
    timeLimit: string | number;
    maxScore: number;
    type?: "Exam" | "Homework";
  };
  onClose: () => void;
  onSubmit: (id: string) => void;
  /** If true, skip to the review screen immediately (for "Review Mistakes" from score dialog) */
  reviewMode?: boolean;
}

export function DoingAssignmentWorkspace({
  assignment,
  onClose,
  onSubmit,
  reviewMode = false,
}: DoingAssignmentWorkspaceProps) {
  const { user } = useAuth();
  const userName = user?.name || "Student Yuki T.";

  // Exam state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [lastViolationType, setLastViolationType] = useState("");
  const [timeLeft, setTimeLeft] = useState(reviewMode ? 0 : 1200); // default 20 mins
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"Saving..." | "Saved">("Saved");
  const [lastSavedSec, setLastSavedSec] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(reviewMode);

  // Review screen states
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [notesStatus, setNotesStatus] = useState<Record<number, string>>({});

  // Dynamic states
  const [loading, setLoading] = useState(true);
  const [studentExamId, setStudentExamId] = useState<string | null>(null);
  const [dbHomework, setDbHomework] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [submission, setSubmission] = useState<any>(null);

  // Manual homework states
  const [manualText, setManualText] = useState("");
  const [manualAttachment, setManualAttachment] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    if (submission && (!submission.submissionText || !submission.submissionText.startsWith("{"))) {
      setManualText(submission.submissionText || "");
      setManualAttachment(submission.attachmentUrl || "");
    }
  }, [submission]);

  const handleSubmitManual = async () => {
    if (!manualText.trim() && !manualAttachment.trim()) {
      toast.error("Please provide an answer or an attachment link.");
      return;
    }
    setSubmittingManual(true);
    try {
      const req = {
        submissionText: manualText,
        attachmentUrl: manualAttachment,
      };
      const res = await homeworkApi.submitHomework(assignment.id, req);
      setSubmission(res);
      setIsSubmitted(true);
      toast.success("Homework submitted successfully!");
      onSubmit(assignment.id);
    } catch (err: any) {
      console.error("Failed to submit manual homework", err);
      toast.error(err?.message || "Failed to submit homework.");
    } finally {
      setSubmittingManual(false);
    }
  };

  const loadHomeworkData = useCallback(
    async (shouldShowLoading = true) => {
      try {
        if (shouldShowLoading) {
          setLoading(true);
        }

        const isExam = assignment.type === "Exam";
        let hw: any;
        if (isExam) {
          hw = await examsApi.startExam(assignment.id, user?.id || "");
          setStudentExamId(hw.id);
        } else {
          hw = await homeworkApi.getStudentHomeworkById(assignment.id);
        }

        console.log("ACTUAL_API_RESPONSE_PAYLOAD:", JSON.stringify(hw));
        setDbHomework(hw);

        const rawQuestions = hw.questions || [];
        const mappedQuestions = rawQuestions.map((q: any) => ({
          id: q.id,
          q: q.questionText || q.prompt || "",
          jpPrompt: q.jpPrompt || "",
          options: q.options || [],
          correctIdx:
            q.correctAnswerIndex !== undefined && q.correctAnswerIndex !== null
              ? q.correctAnswerIndex
              : undefined,
          type: q.questionType || "MULTIPLE_CHOICE",
          points: q.points || 1,
          skill: q.topicId || "General",
          weakness: q.difficulty || "Medium",
          aiFeedback: {
            explanation: q.explanation || "No explanation available.",
            grammar: "Focus on topic grammar points.",
            vocabulary: "Review vocabulary matching this question.",
            commonMistake: "Verify answer option choices carefully.",
            suggestion: "Keep practicing related grammar and vocabulary.",
          },
        }));

        console.log("MAPPED_QUESTIONS_TABLE:");
        console.table(mappedQuestions);
        setQuestions(mappedQuestions);

        const limit = hw.timeLimit || assignment.timeLimit;
        if (limit && Number(limit) > 0) {
          setTimeLeft(Number(limit) * 60);
        } else {
          setTimeLeft(999999);
        }

        if (isExam) {
          if (hw.status === "SUBMITTED" || hw.status === "GRADED") {
            setIsSubmitted(true);
            setSubmission(hw);
            const newAnswers: Record<number, number> = {};
            mappedQuestions.forEach((q: any, idx: number) => {
              const rawQ = rawQuestions.find((rq: any) => rq.id === q.id);
              if (
                rawQ &&
                rawQ.selectedAnswerIndex !== undefined &&
                rawQ.selectedAnswerIndex !== null
              ) {
                newAnswers[idx] = rawQ.selectedAnswerIndex;
              }
            });
            setAnswers(newAnswers);
          }
        } else {
          try {
            const subResponse = await homeworkApi.getStudentSubmission(assignment.id);
            if (subResponse) {
              const sub = subResponse;
              setSubmission(sub);
              if (sub.status === "GRADED" || sub.status === "SUBMITTED") {
                setIsSubmitted(true);
                if (sub.submissionText) {
                  try {
                    const parsedAnswers = JSON.parse(sub.submissionText);
                    const newAnswers: Record<number, number> = {};
                    mappedQuestions.forEach((q: any, idx: number) => {
                      if (parsedAnswers[q.id] !== undefined) {
                        newAnswers[idx] = parsedAnswers[q.id];
                      }
                    });
                    setAnswers(newAnswers);
                  } catch (e) {
                    console.error("Failed to parse submission answers", e);
                  }
                }
              }
            }
          } catch (subErr) {
            console.log("No submission found yet or error fetching submission", subErr);
          }
        }
      } catch (err) {
        console.error("Error loading workspace data", err);
      } finally {
        if (shouldShowLoading) {
          setLoading(false);
        }
      }
    },
    [assignment.id, assignment.type, assignment.timeLimit, user?.id],
  );

  useEffect(() => {
    loadHomeworkData(true);
  }, [loadHomeworkData]);

  // Auto-Save Effect
  useEffect(() => {
    if (!examStarted || isSubmitted) return;
    setAutoSaveStatus("Saving...");
    const timer = setTimeout(() => {
      setAutoSaveStatus("Saved");
      setLastSavedSec(0);
    }, 600);
    return () => clearTimeout(timer);
  }, [answers, flagged, examStarted, isSubmitted]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSavedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown - chỉ chạy khi exam đã bắt đầu
  useEffect(() => {
    if (!examStarted || isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsSubmitted(true);
          // Exit fullscreen when time runs out
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examStarted, isSubmitted]);

  // Anti-cheat setup - chỉ hoạt động khi exam đã bắt đầu
  useEffect(() => {
    if (!examStarted || isSubmitted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitted) return;
      const msg =
        "Are you sure you want to leave? Your exam progress may be lost and this attempt will be reported.";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };

    const reportViolation = (type: string) => {
      if (isSubmitted) return;
      setViolations((prev) => {
        const nextViolations = prev + 1;
        setLastViolationType(type);
        setShowViolationWarning(true);

        TEACHER_NOTIFICATIONS.unshift({
          id: Date.now() + nextViolations,
          title: "Exam Violation Alert",
          desc: `${userName} left the active test workspace (${type}) during "${assignment.title}". (Violation #${nextViolations})`,
          time: "Just now",
          unread: true,
          icon: ShieldAlert,
        });

        return nextViolations;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted) {
        reportViolation("Tab Switch / Minimized");
      }
    };

    const handleBlur = () => {
      if (!isSubmitted) {
        reportViolation("Lost Window Focus");
      }
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      // If user exits fullscreen during exam, show warning
      if (!isNowFullscreen && !isSubmitted) {
        reportViolation("Exited Fullscreen Mode");
      }
    };

    // Prevent Escape key from exiting fullscreen during exam
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitted) {
        e.preventDefault();
        e.stopPropagation();
        reportViolation("Escape Key Pressed");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleEscapeKey, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleEscapeKey, true);
    };
  }, [examStarted, assignment.title, userName, isSubmitted]);

  // Keyboard support: 1, 2, 3, 4 for selections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!examStarted || showViolationWarning || showSubmitDialog || isSubmitted) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        const optionIdx = parseInt(e.key) - 1;
        if (optionIdx < questions[currentQuestion].options.length) {
          handleSelectOption(currentQuestion, optionIdx);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, examStarted, showViolationWarning, showSubmitDialog, isSubmitted]);

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const toggleFlag = (qIdx: number) => {
    setFlagged((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }));
  };

  const handleScrollToQuestion = (idx: number) => {
    setCurrentQuestion(idx);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getQuestionStatus = (idx: number) => {
    if (currentQuestion === idx) return "blue";
    if (flagged[idx]) return "red";
    if (answers[idx] !== undefined) return "green";
    return "gray";
  };

  const saveNote = (idx: number) => {
    setNotesStatus((prev) => ({ ...prev, [idx]: "Saving..." }));
    setTimeout(() => {
      setNotesStatus((prev) => ({ ...prev, [idx]: "Saved" }));
    }, 600);
  };

  const restartPractice = () => {
    setAnswers({});
    setFlagged({});
    setViolations(0);
    setTimeLeft(1200);
    setCurrentQuestion(0);
    setIsSubmitted(false);
    setExamStarted(true);
    // Enter fullscreen
    document.documentElement.requestFullscreen().catch(() => {});
  };

  // Start exam function
  const startExam = useCallback(() => {
    setExamStarted(true);
    setTimeLeft(1200);
    // Auto enter fullscreen
    setTimeout(() => {
      document.documentElement.requestFullscreen().catch(() => {
        console.log("Fullscreen not supported or blocked");
      });
    }, 100);
  }, []);

  // Exit exam / close exam
  const exitExam = useCallback(() => {
    // Exit fullscreen first
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    // Reset exam state
    setExamStarted(false);
    setAnswers({});
    setFlagged({});
    setViolations(0);
    setTimeLeft(1200);
    setCurrentQuestion(0);
    setIsSubmitted(false);
  }, []);

  const handleSubmitExam = async () => {
    try {
      setShowSubmitDialog(false);
      setAutoSaveStatus("Saving...");

      const submitAnswersMap: Record<string, number> = {};
      questions.forEach((q, idx) => {
        if (answers[idx] !== undefined) {
          submitAnswersMap[q.id] = answers[idx];
        }
      });

      const isExam = assignment.type === "Exam";
      let res: any;
      if (isExam) {
        res = await examsApi.submitExam(studentExamId!, { answers: submitAnswersMap });
      } else {
        const req = {
          submissionText: JSON.stringify(submitAnswersMap),
          answers: submitAnswersMap,
        };
        res = await homeworkApi.submitHomework(assignment.id, req);
      }

      setSubmission(res);
      setIsSubmitted(true);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      try {
        await loadHomeworkData(false);
      } catch (err) {
        console.error("Failed to reload homework details after submission", err);
      }
      onSubmit(assignment.id);
    } catch (err) {
      console.error("Failed to submit homework", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50/95 dark:bg-[#0a0c14]/95 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-semibold">Loading homework details...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    const isGraded = submission?.status === "GRADED";
    const statusText =
      submission?.status === "GRADED"
        ? "Graded"
        : submission?.status === "SUBMITTED"
          ? "Submitted"
          : "Not Started";

    return (
      <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-50/95 dark:bg-[#0a0c14]/95 backdrop-blur-sm p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6 pt-10 pb-16">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                  Manual Homework Workspace
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                  {assignment.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  isGraded
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : submission?.status === "SUBMITTED"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}
              >
                {statusText}
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left/Main Column: Instructions & Submission Form */}
            <div className="md:col-span-2 space-y-6">
              {/* Instructions Card */}
              <Card className="p-6 border border-slate-200/50 dark:border-white/5 bg-white dark:bg-[#0d1020]/45 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wider">
                    Instructions
                  </h3>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {dbHomework?.instructions || "No instructions provided by the teacher."}
                </div>
              </Card>

              {/* Action/Form Card */}
              <Card className="p-6 border border-slate-200/50 dark:border-white/5 bg-white dark:bg-[#0d1020]/45 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-indigo-500">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wider">
                    Your Response
                  </h3>
                </div>

                {!isSubmitted ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Write your answer or comments below *
                      </label>
                      <textarea
                        rows={8}
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-primary transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Attachment Link / Drive Link (Optional)
                      </label>
                      <input
                        type="url"
                        value={manualAttachment}
                        onChange={(e) => setManualAttachment(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-primary transition"
                      />
                    </div>

                    <button
                      onClick={handleSubmitManual}
                      disabled={
                        submittingManual || (!manualText.trim() && !manualAttachment.trim())
                      }
                      className="w-full py-3.5 bg-primary hover:opacity-95 disabled:opacity-50 text-primary-foreground rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                    >
                      {submittingManual ? "Submitting..." : "Submit Assignment"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase text-muted-foreground block mb-2">
                        Submitted Answer
                      </span>
                      <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {submission?.submissionText || "No text answer provided."}
                      </p>
                    </div>

                    {submission?.attachmentUrl && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">
                            Attachment
                          </span>
                          <a
                            href={submission.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary font-semibold hover:underline break-all"
                          >
                            {submission.attachmentUrl}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Info & Grade feedback */}
            <div className="space-y-6">
              {/* Grading / Score Feedback Card */}
              {isGraded ? (
                <Card className="p-5 border border-green-500/30 bg-green-500/5 dark:bg-green-950/10 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-green-500">
                    <Award className="w-5 h-5 animate-bounce" />
                    <h3 className="font-display font-black text-sm uppercase tracking-wider">
                      Grade & Feedback
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-baseline gap-1.5 justify-center py-2 border-b border-green-500/10">
                      <span className="text-4xl font-black text-green-500">
                        {submission?.score !== null ? submission.score : "--"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        / {assignment.maxScore} pts
                      </span>
                    </div>

                    {submission?.feedback ? (
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black tracking-wider text-muted-foreground block">
                          Teacher's Feedback
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                          "{submission.feedback}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center italic">
                        No written feedback provided.
                      </p>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="p-5 border border-slate-200/50 dark:border-white/5 bg-white dark:bg-[#0d1020]/45 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-indigo-500">
                    <Clock className="w-5 h-5" />
                    <h3 className="font-display font-black text-sm uppercase tracking-wider">
                      Details
                    </h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                      <span className="text-muted-foreground">Max Score</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {assignment.maxScore} pts
                      </span>
                    </div>
                    {submission?.submittedAt && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                        <span className="text-muted-foreground">Submitted At</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const remainingCount = questions.length - answeredCount;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  const scoreEarned = questions.reduce((acc, q, idx) => {
    return (
      acc + (q && typeof q.correctIdx === "number" && answers[idx] === q.correctIdx ? q.points : 0)
    );
  }, 0);
  const correctCount = questions.filter(
    (q, idx) => q && typeof q.correctIdx === "number" && answers[idx] === q.correctIdx,
  ).length;
  const wrongCount = questions.length - correctCount;
  const isPassed = scoreEarned >= assignment.maxScore * 0.5;

  const selectedReviewQuestion = questions[currentReviewIndex] || null;
  const isReviewCorrect =
    selectedReviewQuestion && typeof selectedReviewQuestion.correctIdx === "number"
      ? answers[currentReviewIndex] === selectedReviewQuestion.correctIdx
      : false;

  // Weak areas statistics calculation
  const weakAreasStats = questions.reduce(
    (acc, q, idx) => {
      if (q && answers[idx] !== q.correctIdx) {
        acc[q.skill] = (acc[q.skill] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  if (isSubmitted) {
    // ----------------------------------------------------
    // NEW PREMIUM INTERACTIVE AI REVIEW WORKSPACE
    // ----------------------------------------------------
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2 flex flex-col lg:flex-row gap-6 items-start text-slate-700 dark:text-slate-200">
        {/* Left Side: Summary Card, Navigator, Weak Areas & Analytics */}
        <div className="w-full lg:w-96 space-y-6 shrink-0 lg:sticky lg:top-24">
          {/* Section 1: Exam Summary Card */}
          <Card className="p-5 border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0d1020]/45 shadow-sm space-y-4 relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${isPassed ? "bg-green-500" : "bg-red-500"}`}
            />

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">
                  Exam Summary
                </span>
                <h3 className="font-display font-black text-base text-foreground dark:text-white mt-0.5 leading-tight">
                  {assignment.title}
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                  isPassed
                    ? "bg-green-500/15 text-green-500 border border-green-500/25"
                    : "bg-red-500/15 text-red-500 border border-red-500/25"
                }`}
              >
                {isPassed ? "Passed" : "Failed"}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 justify-center py-2">
              <span className="text-3xl font-black text-primary">{scoreEarned}</span>
              <span className="text-muted-foreground text-xs">/ {assignment.maxScore} pts</span>
              <span className="text-xs font-black text-muted-foreground ml-2">
                ({Math.round((scoreEarned / assignment.maxScore) * 100)}%)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-y border-slate-200/40 dark:border-white/5 py-3 mt-1">
              <div>
                <div className="font-black text-green-500">{correctCount}</div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] mt-0.5">
                  Correct
                </div>
              </div>
              <div>
                <div className="font-black text-red-500">{wrongCount}</div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] mt-0.5">
                  Incorrect
                </div>
              </div>
              <div>
                <div className="font-black text-slate-700 dark:text-slate-300">
                  {formatTime(1200 - timeLeft)}
                </div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] mt-0.5">
                  Time
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-foreground text-xs font-black uppercase tracking-wider transition"
              >
                Return to Class
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const firstWrong = questions.findIndex(
                      (q, i) =>
                        q && typeof q.correctIdx === "number" && answers[i] !== q.correctIdx,
                    );
                    setCurrentReviewIndex(firstWrong >= 0 ? firstWrong : 0);
                  }}
                  className="py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black uppercase tracking-wider transition"
                >
                  Review Mistakes
                </button>
                <button
                  onClick={restartPractice}
                  className="py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider shadow hover:opacity-95 transition"
                >
                  Practice Again
                </button>
              </div>
            </div>
          </Card>

          {/* Section 2: Question Review Navigator Panel */}
          <Card className="p-4 border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0d1020]/45 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Select Question
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const correct =
                  q && typeof q.correctIdx === "number" && answers[idx] === q.correctIdx;
                const isSelected = currentReviewIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentReviewIndex(idx)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center border-2 ${
                      isSelected
                        ? "border-primary scale-105 shadow"
                        : correct
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2.5 border-t border-dashed border-slate-200 dark:border-white/10 text-[9px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-green-500/20 border border-green-500/30" />
                <span>Correct Answer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/30" />
                <span>Wrong Answer</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Section 3, 4, 5, 6, 7 Detailed Panel */}
        <div className="flex-1 w-full space-y-6">
          {/* Section 3: Question Detail Panel */}
          <Card className="p-6 border border-slate-200/50 dark:border-white/5 bg-white shadow-sm space-y-5">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <span className="text-[10px] uppercase font-black text-primary tracking-widest">
                  Question {currentReviewIndex + 1} of {questions.length}
                </span>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                  Type: {selectedReviewQuestion.type}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-muted-foreground font-bold bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                  Points: {selectedReviewQuestion.points}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                    isReviewCorrect
                      ? "bg-green-500/15 text-green-500"
                      : "bg-red-500/15 text-red-500"
                  }`}
                >
                  {isReviewCorrect ? "✓ Correct" : "✗ Incorrect"}
                </span>
              </div>
            </div>

            <h3 className="font-display font-bold text-base sm:text-lg text-foreground dark:text-white leading-relaxed">
              {selectedReviewQuestion.q}
            </h3>
            {selectedReviewQuestion.jpPrompt && (
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {selectedReviewQuestion.jpPrompt}
              </p>
            )}

            {/* Choice Review Options */}
            <div className="space-y-3">
              {selectedReviewQuestion &&
                selectedReviewQuestion.options &&
                selectedReviewQuestion.options.map((opt, optIdx) => {
                  const wasChosen = answers[currentReviewIndex] === optIdx;
                  const isCorrect =
                    selectedReviewQuestion &&
                    typeof selectedReviewQuestion.correctIdx === "number" &&
                    selectedReviewQuestion.correctIdx === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-150 text-xs sm:text-sm font-semibold ${
                        isCorrect
                          ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                          : wasChosen
                            ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                            : "bg-white/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold border text-[10px]">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      <div className="flex gap-2 items-center shrink-0">
                        {isCorrect && (
                          <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-600 text-[8px] font-black uppercase">
                            Correct Answer
                          </span>
                        )}
                        {wasChosen && (
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              isReviewCorrect
                                ? "bg-green-500/20 text-green-600"
                                : "bg-red-500/20 text-red-600"
                            }`}
                          >
                            Your Choice
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Section 4 & 5: AI Explanation & Knowledge Breakdown */}
          <Card className="p-6 border border-slate-200/50 dark:border-white/5 space-y-5">
            <div className="flex items-center gap-2 text-indigo-500">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h4 className="font-display font-black text-sm uppercase tracking-wider">
                AI tutor analysis
              </h4>
            </div>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {/* Question Mistake Card Difference details */}
              {!isReviewCorrect && selectedReviewQuestion && selectedReviewQuestion.options && (
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs flex flex-col gap-1.5">
                  <div className="font-bold text-red-500">Difference Highlight:</div>
                  <p>
                    You confused{" "}
                    <strong className="text-red-500">
                      "{selectedReviewQuestion.options[answers[currentReviewIndex]] || ""}"
                    </strong>{" "}
                    with the correct option{" "}
                    <strong className="text-green-500">
                      "
                      {typeof selectedReviewQuestion.correctIdx === "number" &&
                      selectedReviewQuestion.options[selectedReviewQuestion.correctIdx]
                        ? selectedReviewQuestion.options[selectedReviewQuestion.correctIdx]
                        : ""}
                      "
                    </strong>
                    .
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">
                      Why correct
                    </span>
                    {selectedReviewQuestion.aiFeedback.explanation}
                  </p>
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">
                      Grammar Focus
                    </span>
                    {selectedReviewQuestion.aiFeedback.grammar}
                  </p>
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">
                      Vocabulary Break-down
                    </span>
                    {selectedReviewQuestion.aiFeedback.vocabulary}
                  </p>
                </div>

                <div className="space-y-3 border-t sm:border-t-0 sm:border-l border-slate-200/50 dark:border-white/5 sm:pl-4 pt-3 sm:pt-0">
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">
                      Common Student Mistakes
                    </span>
                    {selectedReviewQuestion.aiFeedback.commonMistake}
                  </p>
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">
                      AI Sensei Suggestion
                    </span>
                    {selectedReviewQuestion.aiFeedback.suggestion}
                  </p>

                  {/* Section 5: Knowledge Breakdown tag */}
                  <div className="pt-2">
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider mb-1">
                      Knowledge Classification
                    </span>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-bold border border-indigo-500/20">
                        {selectedReviewQuestion.skill}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                        {selectedReviewQuestion.weakness}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show pre-exam screen if exam hasn't started
  if (!examStarted && !isSubmitted) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50/95 dark:bg-[#0a0c14]/95 backdrop-blur-sm">
        <div className="max-w-lg w-full mx-4">
          <Card className="p-8 border border-slate-200/50 dark:border-white/10 shadow-xl bg-white dark:bg-[#0d1020]/80">
            {/* Exam Info */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display font-black text-2xl text-foreground dark:text-white mb-2">
                {assignment.title}
              </h2>
              <p className="text-sm text-muted-foreground">Ready to start your exam?</p>
            </div>

            {/* Exam Rules */}
            <div className="space-y-3 mb-8 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Exam Rules
              </h3>
              <div className="flex items-start gap-3 text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 dark:text-slate-300">
                  The exam will run in <strong>fullscreen mode</strong> for focus
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-slate-600 dark:text-slate-300">
                  You have <strong>{formatTime(timeLeft)}</strong> to complete {questions.length}{" "}
                  questions
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 dark:text-slate-300">
                  Switching tabs or leaving fullscreen will be{" "}
                  <strong className="text-red-500">logged as violations</strong>
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 dark:text-slate-300">
                  Press <strong>1-4</strong> keys to quickly select answers
                </span>
              </div>
            </div>

            {/* Exam Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="font-black text-lg text-primary">{questions.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Questions
                </div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="font-black text-lg text-primary">{assignment.maxScore}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Total Points
                </div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="font-black text-lg text-primary">{formatTime(timeLeft)}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Time Limit
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={startExam}
                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base uppercase tracking-wider shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Exam
              </button>
              <button
                onClick={exitExam}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/5 font-semibold text-sm transition"
              >
                Cancel & Return
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main Exam Interface (Fullscreen Mode)
  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col text-slate-700 dark:text-slate-200 bg-slate-50/95 dark:bg-[#0a0c14]/98 ${isFullscreen ? "pt-0" : "pt-0"}`}
    >
      {/* 1. FOCUS HEADER - Sticky Top Bar with Timer */}
      <header className="shrink-0 bg-white/95 dark:bg-[#0c0d12]/98 border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Assignment Info */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-display font-black text-lg leading-none text-foreground dark:text-white">
                {assignment.title}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider">
                  {questions[currentQuestion].type}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Timer & Actions */}
          <div className="flex items-center gap-4">
            {/* Auto Save Indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className={`w-1.5 h-1.5 rounded-full ${autoSaveStatus === "Saved" ? "bg-green-500" : "bg-amber-500 animate-pulse"}`}
              />
              {autoSaveStatus === "Saved" ? "Saved" : "Saving..."}
            </div>

            {/* Violations Warning */}
            {violations > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                {violations} / 3
              </div>
            )}

            {/* Countdown Timer - Prominent */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all duration-300 ${
                timeLeft <= 60
                  ? "bg-red-500 text-white animate-pulse"
                  : timeLeft <= 300
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              <Clock className={`w-4 h-4 ${timeLeft <= 60 ? "animate-spin" : ""}`} />
              <span className="tabular-nums font-black tracking-wider">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-white/5">
          <div
            className="h-full bg-linear-to-r from-primary to-pink-500 transition-all duration-300 ease-out"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* 2. MAIN FOCUS LAYOUT - Left Navigator + Right Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: Question Navigator */}
        <aside className="w-64 shrink-0 bg-white/80 dark:bg-[#0d1020]/60 border-r border-slate-200/50 dark:border-white/5 p-4 overflow-y-auto">
          {/* Stats Summary */}
          <div className="mb-4 p-3 rounded-xl bg-linear-to-br from-primary/5 to-pink-500/5 border border-primary/10">
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div>
                <div className="font-black text-green-500 text-sm">{answeredCount}</div>
                <div className="text-muted-foreground font-medium">Done</div>
              </div>
              <div>
                <div className="font-black text-slate-500 text-sm">{remainingCount}</div>
                <div className="text-muted-foreground font-medium">Left</div>
              </div>
              <div>
                <div className="font-black text-red-500 text-sm">{flaggedCount}</div>
                <div className="text-muted-foreground font-medium">Flag</div>
              </div>
            </div>
          </div>

          {/* Question Grid */}
          <div className="mb-4">
            <h4 className="text-[10px] uppercase font-black tracking-wider text-muted-foreground mb-2">
              Questions
            </h4>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((_, idx) => {
                const status = getQuestionStatus(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`w-9 h-9 rounded-lg font-bold text-xs transition-all duration-200 flex items-center justify-center ${
                      status === "blue"
                        ? "bg-primary text-primary-foreground shadow-md scale-110 ring-2 ring-primary/30"
                        : status === "green"
                          ? "bg-green-500/15 text-green-600 border border-green-500/30 hover:bg-green-500/25"
                          : status === "red"
                            ? "bg-red-500/15 text-red-600 border border-red-500/30 hover:bg-red-500/25"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-muted-foreground hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="text-[9px] text-muted-foreground space-y-1.5 border-t border-slate-100 dark:border-white/5 pt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-primary shadow-sm" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />
              <span>Flagged</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10" />
              <span>Not Answered</span>
            </div>
          </div>

          {/* Integrity Status */}
          <div className="mt-4 p-3 rounded-xl bg-red-500/3 border border-red-500/10">
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Integrity Guard</span>
            </div>
            <div className="text-[9px] text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Violations</span>
                <span className={`font-bold ${violations > 0 ? "text-red-500" : "text-green-500"}`}>
                  {violations} / 3
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT: Question & Options - Full Width */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Question Card with Animation */}
            <div className="transition-all duration-300 ease-out">
              <Card className="p-6 border border-slate-200/50 dark:border-white/5 shadow-sm space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                      Question {currentQuestion + 1}
                    </span>
                    <p className="text-[11px] text-muted-foreground font-medium mt-2">
                      {questions[currentQuestion].type} • {questions[currentQuestion].points} points
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFlag(currentQuestion)}
                    className={`p-2 rounded-lg transition-all ${
                      flagged[currentQuestion]
                        ? "bg-red-500/10 text-red-500 border border-red-500/30"
                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                    title={flagged[currentQuestion] ? "Remove flag" : "Flag for review"}
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="font-display font-bold text-xl text-foreground dark:text-white leading-relaxed">
                  {questions[currentQuestion].q}
                </h2>
                {questions[currentQuestion].jpPrompt && (
                  <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {questions[currentQuestion].jpPrompt}
                  </p>
                )}
              </Card>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {questions[currentQuestion].options.map((opt, optIdx) => {
                const isSelected = answers[currentQuestion] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQuestion, optIdx)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? "bg-primary/5 border-primary shadow-md shadow-primary/10"
                        : "bg-white/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-white/10 hover:border-primary/40 hover:bg-white/90 dark:hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                          isSelected
                            ? "bg-primary text-white shadow-md"
                            : "bg-slate-100 dark:bg-white/10 text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span
                        className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground dark:text-white"}`}
                      >
                        {opt}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg font-bold opacity-0 group-hover:opacity-100">
                      {optIdx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion((prev) => prev - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex gap-2">
                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion((prev) => prev + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitDialog(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-500 text-white font-black text-xs shadow-md hover:bg-green-600 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Submit Exam
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Submit Confirmation Dialog Modal */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 space-y-4 border border-border/50 shadow-2xl bg-white dark:bg-[#0f1118] relative">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-black text-lg text-foreground dark:text-white">
                Submit Examination
              </h3>
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs border-y border-border/40 py-3 leading-relaxed">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-bold">
                  {answeredCount} / {questions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Questions:</span>
                <span className="font-bold text-amber-500">{remainingCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Flagged for Review:</span>
                <span className="font-bold text-red-500">{flaggedCount}</span>
              </div>
            </div>

            {remainingCount > 0 && (
              <div className="p-3.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5 font-semibold leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p>Warning: You still have unanswered questions.</p>
                  <p className="text-[10px] text-muted-foreground font-normal mt-0.5">
                    We recommend returning to answer them before submitting.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="px-4 py-2.5 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/[0.02]"
              >
                Continue Exam
              </button>
              <button
                onClick={handleSubmitExam}
                className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs shadow"
              >
                Submit Anyway
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Violation Alert Modal Popup (Tab Switching Guard) */}
      {showViolationWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 space-y-4 border border-red-500/30 dark:border-red-500/40 shadow-2xl relative overflow-hidden bg-white dark:bg-[#0f1118]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />
            <div className="flex items-center gap-3 text-red-500">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
              <h3 className="font-display font-black text-lg">Integrity Warning</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You switched tabs or clicked outside the test window. This action violates test
              guidelines and has been logged and reported to your teacher.
            </p>
            <div className="p-3 bg-red-500/10 rounded-xl text-xs text-red-600 dark:text-red-400 font-semibold space-y-1">
              <p>• Trigger: {lastViolationType}</p>
              <p>• Focus Violations: {violations} / 3</p>
            </div>
            <button
              onClick={() => setShowViolationWarning(false)}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow transition"
            >
              Acknowledge & Resume Test
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
