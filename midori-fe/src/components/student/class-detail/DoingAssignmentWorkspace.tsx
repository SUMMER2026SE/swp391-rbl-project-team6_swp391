import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/page-ui";
import {
  Clock,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Maximize,
  Minimize,
  Check,
  X,
  Award,
  FileText,
  BookOpen,
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
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [lastViolationType, setLastViolationType] = useState<string>("");
  const initialDurationMins = Number(assignment.timeLimit) > 0 ? Number(assignment.timeLimit) : 20;
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(initialDurationMins * 60);
  const [timeLeft, setTimeLeft] = useState(reviewMode ? 0 : initialDurationMins * 60);
  const startTimeRef = React.useRef<number>(Date.now());
  const [actualTimeTaken, setActualTimeTaken] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"Saving..." | "Saved">("Saved");
  const [lastSavedSec, setLastSavedSec] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(reviewMode);
  const [integrityLocked, setIntegrityLocked] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

  const hasActiveFullscreenViolationRef = React.useRef(false);
  const isIntentionalFullscreenExitRef = React.useRef(false);

  const examStartedRef = React.useRef(examStarted);
  const isSubmittedRef = React.useRef(isSubmitted);
  const violationsRef = React.useRef(violations);
  const assignmentTitleRef = React.useRef(assignment.title);
  const userNameRef = React.useRef(userName);

  React.useEffect(() => { examStartedRef.current = examStarted; }, [examStarted]);
  React.useEffect(() => { isSubmittedRef.current = isSubmitted; }, [isSubmitted]);
  React.useEffect(() => { violationsRef.current = violations; }, [violations]);
  React.useEffect(() => { assignmentTitleRef.current = assignment.title; }, [assignment.title]);
  React.useEffect(() => { userNameRef.current = userName; }, [userName]);

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
      const req: {
        submissionText: string;
        attachmentUrl: string;
        focusViolationCount: number;
      } = {
        submissionText: manualText,
        attachmentUrl: manualAttachment,
        focusViolationCount: violations,
      };
      const res = await homeworkApi.submitHomework(assignment.id, req);
      const elapsedSecs = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const durationKey = `homework_duration_${user?.id || 'guest'}_${assignment.id}`;
      localStorage.setItem(durationKey, elapsedSecs.toString());
      setActualTimeTaken(elapsedSecs);
      setSubmission(res);
      setIsSubmitted(true);
      isIntentionalFullscreenExitRef.current = true;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      try {
        await loadHomeworkData(false);
      } catch (err) {
        console.error("Failed to reload homework details after submission", err);
      }
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
          selectedIdx:
            q.selectedAnswerIndex !== undefined && q.selectedAnswerIndex !== null
              ? q.selectedAnswerIndex
              : undefined,
          isCorrect:
            typeof q.isCorrect === "boolean" ? q.isCorrect : undefined,
          type: q.questionType || "MULTIPLE_CHOICE",
          points: q.points || 1,
          explanation: q.explanation || "",
          selectedAnswerText: q.selectedAnswerText || "",
          correctAnswerText: q.correctAnswerText || "",
          translationMetadata: q.translationMetadata,
          sentenceWritingMetadata: q.sentenceWritingMetadata,
          errorCorrectionMetadata: q.errorCorrectionMetadata,
          matchingMetadata: q.matchingMetadata,
        }));

        console.log("MAPPED_QUESTIONS_TABLE:");
        console.table(mappedQuestions);
        setQuestions(mappedQuestions);

        const limit = hw.timeLimit || assignment.timeLimit;
        const limitSecs = (limit && Number(limit) > 0) ? Number(limit) * 60 : 1200;
        setTotalDurationSeconds(limitSecs);

        let isHwSubmitted = false;
        let sub: any = null;

        if (isExam) {
          isHwSubmitted = hw.status === "SUBMITTED" || hw.status === "GRADED";
          sub = hw;
        } else {
          try {
            const subResponse = await homeworkApi.getStudentSubmission(assignment.id);
            if (subResponse) {
              sub = subResponse;
              isHwSubmitted = sub.status === "GRADED" || sub.status === "SUBMITTED";
            }
          } catch (subErr) {
            console.log("No submission found yet or error fetching submission", subErr);
          }
        }

        if (!isExam) {
          const startKey = `homework_start_${user?.id || 'guest'}_${assignment.id}`;
          const durationKey = `homework_duration_${user?.id || 'guest'}_${assignment.id}`;
          
          if (isHwSubmitted) {
            const savedDuration = localStorage.getItem(durationKey);
            if (savedDuration) {
              setActualTimeTaken(parseInt(savedDuration));
            } else if (sub && sub.submittedAt) {
              const subAt = sub.submittedAt;
              const createdVal = hw.createdAt || (assignment as any).createdAt;
              if (subAt && createdVal) {
                const diff = Math.max(1, Math.round((new Date(subAt).getTime() - new Date(createdVal).getTime()) / 1000));
                setActualTimeTaken(diff);
              }
            }
            setTimeLeft(0);
          } else {
            let savedStart = localStorage.getItem(startKey);
            if (!savedStart) {
              savedStart = Date.now().toString();
              localStorage.setItem(startKey, savedStart);
            }
            const startTime = parseInt(savedStart);
            startTimeRef.current = startTime;
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, limitSecs - elapsed);
            setTimeLeft(limit ? remaining : 999999);
          }
        } else {
          // Exam flow
          startTimeRef.current = hw.startedAt ? new Date(hw.startedAt).getTime() : Date.now();
          if (isHwSubmitted) {
            setTimeLeft(0);
          } else {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const remaining = Math.max(0, limitSecs - elapsed);
            setTimeLeft(limit ? remaining : 999999);
          }
        }

        if (isExam) {
          if (hw.status === "SUBMITTED" || hw.status === "GRADED") {
            setIsSubmitted(true);
            setSubmission(hw);
            const newAnswers: Record<number, any> = {};
            mappedQuestions.forEach((q: any, idx: number) => {
              const rawQ = rawQuestions.find((rq: any) => rq.id === q.id);
              if (rawQ) {
                const type = q.type || "MULTIPLE_CHOICE";
                if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
                  if (rawQ.selectedAnswerIndex !== undefined && rawQ.selectedAnswerIndex !== null) {
                    newAnswers[idx] = rawQ.selectedAnswerIndex;
                  }
                } else if (type === "SENTENCE_REORDER") {
                  const prompt = q.q || "";
                  const rawTokens = (() => {
                    let targetLine = prompt.split(/\r?\n/).find((l: string) => l.includes("/") || l.includes("／")) || prompt;
                    if (targetLine.includes(":")) {
                      targetLine = targetLine.substring(targetLine.lastIndexOf(":") + 1);
                    } else if (targetLine.includes("：")) {
                      targetLine = targetLine.substring(targetLine.lastIndexOf("：") + 1);
                    }
                    return targetLine.split(/[/／]/).map((t: string) => t.trim()).filter(Boolean);
                  })();
                  const studentTokens = rawQ.selectedAnswerText ? rawQ.selectedAnswerText.split("/") : [];
                  const indices: number[] = [];
                  const used = new Set<number>();
                  studentTokens.forEach((t: string) => {
                    const pIdx = rawTokens.findIndex((tok: string, idx: number) => tok === t && !used.has(idx));
                    if (pIdx !== -1) {
                      indices.push(pIdx);
                      used.add(pIdx);
                    }
                  });
                  newAnswers[idx] = indices;
                } else {
                  newAnswers[idx] = rawQ.selectedAnswerText || "";
                }
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
                    const newAnswers: Record<number, any> = {};
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
          isIntentionalFullscreenExitRef.current = true;
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
    if (!examStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmittedRef.current) return;
      const msg =
        "Are you sure you want to leave? Your exam progress may be lost and this attempt will be reported.";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };

    const reportViolation = (type: string) => {
      if (isSubmittedRef.current) return;
      setViolations((prev) => {
        const nextViolations = prev + 1;
        setLastViolationType(type);

        TEACHER_NOTIFICATIONS.unshift({
          id: (Date.now() + nextViolations).toString(),
          type: "EXAM",
          title: "Exam Violation Alert",
          message: `${userNameRef.current} left the active test workspace (${type}) during "${assignmentTitleRef.current}". (Violation #${nextViolations})`,
          time: "Just now",
          read: false,
        });

        return nextViolations;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittedRef.current) {
        reportViolation("Tab Switch / Minimized");
      }
    };

    const handleBlur = () => {
      if (!isSubmittedRef.current) {
        reportViolation("Lost Window Focus");
      }
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (isSubmittedRef.current) return;

      if (!isNowFullscreen) {
        if (isIntentionalFullscreenExitRef.current) {
          return;
        }
        if (!hasActiveFullscreenViolationRef.current) {
          hasActiveFullscreenViolationRef.current = true;
          setIntegrityLocked(true);
          reportViolation("Exited Fullscreen Mode");
        }
      } else {
        hasActiveFullscreenViolationRef.current = false;
        setIntegrityLocked(false);
      }
    };

    // Prevent Escape key from exiting fullscreen during exam
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmittedRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleEscapeKey, true);

    // Initial check if exam started but not in fullscreen
    if (!document.fullscreenElement) {
      setIntegrityLocked(true);
      hasActiveFullscreenViolationRef.current = true;
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleEscapeKey, true);
    };
  }, [examStarted]);

  // Keyboard support: 1, 2, 3, 4 for selections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!examStarted || showViolationWarning || showSubmitDialog || isSubmitted || integrityLocked) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        const optionIdx = parseInt(e.key) - 1;
        if (optionIdx < questions[currentQuestion].options.length) {
          handleSelectOption(currentQuestion, optionIdx);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, examStarted, showViolationWarning, showSubmitDialog, isSubmitted, integrityLocked]);

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (integrityLocked) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const toggleFlag = (qIdx: number) => {
    if (integrityLocked) return;
    setFlagged((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }));
  };

  const handleScrollToQuestion = (idx: number) => {
    if (integrityLocked) return;
    setCurrentQuestion(idx);
  };

  const handleRestoreFullscreen = async () => {
    setFullscreenError(null);
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.error("Failed to restore fullscreen:", err);
      setFullscreenError("Không thể bật chế độ toàn màn hình. Vui lòng cho phép toàn màn hình trong trình duyệt và thử lại.");
    }
  };

  const toggleFullscreen = () => {
    if (integrityLocked) return;
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      isIntentionalFullscreenExitRef.current = true;
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

  // Start exam function
  const startExam = useCallback(() => {
    isIntentionalFullscreenExitRef.current = false;
    hasActiveFullscreenViolationRef.current = false;
    setIntegrityLocked(false);
    setExamStarted(true);
    startTimeRef.current = Date.now();
    setTimeLeft(totalDurationSeconds);
    // Auto enter fullscreen
    setTimeout(() => {
      document.documentElement.requestFullscreen().catch(() => {
        console.log("Fullscreen not supported or blocked");
      });
    }, 100);
  }, [totalDurationSeconds]);

  // Exit exam / close exam
  const exitExam = useCallback(() => {
    isIntentionalFullscreenExitRef.current = true;
    // Exit fullscreen first
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    // Reset exam state
    setExamStarted(false);
    setAnswers({});
    setFlagged({});
    setViolations(0);
    setTimeLeft(totalDurationSeconds);
    setCurrentQuestion(0);
    setIsSubmitted(false);
  }, [totalDurationSeconds]);

  const handleSubmitExam = async () => {
    try {
      setShowSubmitDialog(false);
      setAutoSaveStatus("Saving...");

      const textAnswers = questions.map((q, idx) => {
        const ans = answers[idx];
        const type = q.type || "MULTIPLE_CHOICE";
        const payload: any = { questionId: q.id };

        if (ans === undefined || ans === null) {
          return payload;
        }

        if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
          payload.selectedOptionIndex = ans;
        } else if (type === "SENTENCE_REORDER") {
          const prompt = q.q || "";
          const rawTokens = (() => {
            let targetLine = prompt.split(/\r?\n/).find((l: string) => l.includes("/") || l.includes("／")) || prompt;
            if (targetLine.includes(":")) {
              targetLine = targetLine.substring(targetLine.lastIndexOf(":") + 1);
            } else if (targetLine.includes("：")) {
              targetLine = targetLine.substring(targetLine.lastIndexOf("：") + 1);
            }
            return targetLine.split(/[/／]/).map((t: string) => t.trim()).filter(Boolean);
          })();
          if (Array.isArray(ans)) {
            payload.orderedTokens = ans.map((i: number) => rawTokens[i]);
            payload.textAnswer = ans.map((i: number) => rawTokens[i]).join("");
          } else {
            payload.textAnswer = String(ans);
          }
        } else {
          payload.textAnswer = String(ans);
        }
        return payload;
      });

      const submitAnswersMap: Record<string, any> = {};
      questions.forEach((q, idx) => {
        const ans = answers[idx];
        if (ans !== undefined && ans !== null) {
          const type = q.type || "MULTIPLE_CHOICE";
          if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
            submitAnswersMap[q.id] = ans;
          } else if (type === "SENTENCE_REORDER" && Array.isArray(ans)) {
            const prompt = q.q || "";
            const rawTokens = (() => {
              let targetLine = prompt.split(/\r?\n/).find((l: string) => l.includes("/") || l.includes("／")) || prompt;
              if (targetLine.includes(":")) {
                targetLine = targetLine.substring(targetLine.lastIndexOf(":") + 1);
              } else if (targetLine.includes("：")) {
                targetLine = targetLine.substring(targetLine.lastIndexOf("：") + 1);
              }
              return targetLine.split(/[/／]/).map((t: string) => t.trim()).filter(Boolean);
            })();
            submitAnswersMap[q.id] = ans.map((i: number) => rawTokens[i]);
          } else {
            submitAnswersMap[q.id] = ans;
          }
        }
      });

      const isExam = assignment.type === "Exam";
      let res: any;
      if (isExam) {
        const submitAnswersList = questions.map((q, idx) => {
          const type = q.type || "MULTIPLE_CHOICE";
          if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
            return answers[idx] !== undefined && answers[idx] !== null ? Number(answers[idx]) : null;
          }
          return null;
        });
        res = await examsApi.submitExam(studentExamId!, {
          answers: submitAnswersList as any,
          textAnswers: textAnswers
        } as any);
      } else {
        const legacyAnswersMap: Record<string, number> = {};
        Object.keys(submitAnswersMap).forEach(k => {
           if (typeof submitAnswersMap[k] === 'number') {
              legacyAnswersMap[k] = submitAnswersMap[k];
           }
        });
        const req = {
          submissionText: JSON.stringify(submitAnswersMap),
          answers: legacyAnswersMap,
          textAnswers: textAnswers,
          focusViolationCount: violations,
        };
        res = await homeworkApi.submitHomework(assignment.id, req);
      }

      const elapsedSecs = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      if (assignment.type !== "Exam") {
        const durationKey = `homework_duration_${user?.id || 'guest'}_${assignment.id}`;
        localStorage.setItem(durationKey, elapsedSecs.toString());
      }
      setActualTimeTaken(elapsedSecs);
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

  const correctCount = questions.reduce((acc, q, idx) => {
    const backendFlag = typeof q.isCorrect === "boolean" ? q.isCorrect : null;
    if (backendFlag !== null) return acc + (backendFlag ? 1 : 0);
    return (
      acc +
      (q && typeof q.correctIdx === "number" && answers[idx] === q.correctIdx ? 1 : 0)
    );
  }, 0);
  const wrongCount = questions.length - correctCount;

  // Percentage: prefer backend value (backend returns `correctPercentage`, the rounded
  // percentage of correct answers out of total questions). Falling back to the local
  // calculation keeps the UI usable only when the backend hasn't computed one yet.
  const backendPercentage =
    submission && typeof submission.correctPercentage === "number"
      ? submission.correctPercentage
      : null;
  const computedPercentage =
    questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
  const displayPercentage =
    backendPercentage !== null ? backendPercentage : computedPercentage;
  const roundedPercentage = Math.round(displayPercentage);

  // Time taken: prefer backend fields, otherwise fall back to local recorded time or dynamic duration timer.
  const backendTimeTaken =
    submission && submission.startedAt && submission.submittedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(submission.submittedAt).getTime() -
              new Date(submission.startedAt).getTime()) /
              1000,
          ),
        )
      : submission && typeof submission.timeTakenSeconds === "number"
        ? submission.timeTakenSeconds
        : null;

  const displayTimeTakenSeconds =
    backendTimeTaken !== null && backendTimeTaken > 0
      ? backendTimeTaken
      : actualTimeTaken !== null && actualTimeTaken > 0
        ? actualTimeTaken
        : Math.max(0, totalDurationSeconds - timeLeft);

  const isPassed = roundedPercentage >= 50;

  const selectedReviewQuestion = questions[currentReviewIndex] || null;
  const isQuestionCorrect = (q: any, idx: number) => {
    if (!q) return false;
    if (typeof q.isCorrect === "boolean") return q.isCorrect;
    const type = q.type || "MULTIPLE_CHOICE";
    if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
      return typeof q.correctIdx === "number" && answers[idx] === q.correctIdx;
    }
    return false;
  };

  const isReviewCorrect = isQuestionCorrect(selectedReviewQuestion, currentReviewIndex);

  if (isSubmitted) {
    // Post-submission review screen
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2 flex flex-col lg:flex-row gap-6 items-start text-slate-700 dark:text-slate-200">
        {/* Left Side: Summary Card & Question Navigator */}
        <div className="w-full lg:w-96 space-y-6 shrink-0 lg:sticky lg:top-24">
          {/* Summary Card */}
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

            <div className="flex flex-col items-center justify-center py-2 gap-0.5">
              <span className="text-4xl sm:text-5xl font-black text-primary leading-none tabular-nums">
                {roundedPercentage}%
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-1">
                Correct
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-y border-slate-200/40 dark:border-white/5 py-3 mt-1">
              <div>
                <div className="font-black text-green-500 text-sm tabular-nums">
                  {correctCount} / {questions.length}
                </div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] mt-0.5">
                  Correct
                </div>
              </div>
              <div>
                <div className="font-black text-red-500 text-sm tabular-nums">{wrongCount}</div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] mt-0.5">
                  Wrong
                </div>
              </div>
              <div>
                <div className="font-black text-slate-700 dark:text-slate-300 text-sm tabular-nums">
                  {formatTime(displayTimeTakenSeconds)}
                </div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] mt-0.5">
                  Time Taken
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1 flex flex-col">
              <button
                onClick={() => {
                  const firstWrong = questions.findIndex(
                    (q, i) => q && !isQuestionCorrect(q, i)
                  );
                  setCurrentReviewIndex(firstWrong >= 0 ? firstWrong : 0);
                }}
                className="w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-[0.98]"
              >
                Review Mistakes
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50/50 dark:bg-slate-900/60 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-[0.98]"
              >
                Return to Class
              </button>
            </div>
          </Card>

          {/* Question Review Navigator */}
          <Card className="p-4 border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0d1020]/45 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Select Question
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const correct = q && isQuestionCorrect(q, idx);
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

        {/* Right Side: Question Detail */}
        <div className="flex-1 w-full space-y-6">
          {/* Question Detail Panel */}
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
              {(() => {
                const q = selectedReviewQuestion;
                if (!q) return null;
                const type = q.type || "MULTIPLE_CHOICE";

                if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
                  const optsToRender = type === "TRUE_FALSE" ? ["True", "False"] : (q.options || []);
                  return optsToRender.map((opt: string, optIdx: number) => {
                    const wasChosen = answers[currentReviewIndex] === optIdx;
                    const isCorrect =
                      typeof q.correctIdx === "number" &&
                      q.correctIdx === optIdx;
                    const optionLetter = String.fromCharCode(65 + optIdx);

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-150 text-xs sm:text-sm font-semibold ${
                          isCorrect
                            ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                            : wasChosen
                              ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
                              : "bg-white/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold border text-[11px] shrink-0 ${
                              isCorrect
                                ? "bg-green-500/20 border-green-500/40 text-green-600 dark:text-green-400"
                                : wasChosen
                                  ? "bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400"
                                  : "border-slate-200/60 dark:border-white/10 text-muted-foreground"
                            }`}
                          >
                            {optionLetter}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>

                        <div className="flex gap-2 items-center shrink-0">
                          {wasChosen && !isCorrect && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-500/20 text-red-700 dark:text-red-400">
                              <X className="w-3 h-3" />
                              Your Answer
                            </span>
                          )}
                          {isCorrect && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 text-green-700 dark:text-green-400 text-[9px] font-black uppercase">
                              <Check className="w-3 h-3" />
                              {wasChosen ? "Correct" : "Correct Answer"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                }

                // For writing/text/reorder questions:
                const studentAnsVal = answers[currentReviewIndex];
                let displayStudentAns = "";
                if (Array.isArray(studentAnsVal)) {
                  // For SENTENCE_REORDER, the index order is stored
                  const prompt = q.q || "";
                  const rawTokens = (() => {
                    let targetLine = prompt.split(/\r?\n/).find((l: string) => l.includes("/") || l.includes("／")) || prompt;
                    if (targetLine.includes(":")) {
                      targetLine = targetLine.substring(targetLine.lastIndexOf(":") + 1);
                    } else if (targetLine.includes("：")) {
                      targetLine = targetLine.substring(targetLine.lastIndexOf("：") + 1);
                    }
                    return targetLine.split(/[/／]/).map((t: string) => t.trim()).filter(Boolean);
                  })();
                  displayStudentAns = studentAnsVal.map((i: number) => rawTokens[i]).join(" ");
                } else {
                  displayStudentAns = studentAnsVal !== undefined ? String(studentAnsVal) : "";
                }

                // Correct answer representation
                let displayCorrectAns = q.correctAnswerText || "";
                if (!displayCorrectAns && q.options && q.options.length > 0) {
                  displayCorrectAns = q.options[0];
                }

                // Check other metadata fields
                const meta = q.translationMetadata || q.sentenceWritingMetadata;
                if (!displayCorrectAns && meta && "referenceAnswer" in meta) {
                  displayCorrectAns = (meta as any).referenceAnswer || "";
                }
                const errMeta = q.errorCorrectionMetadata;
                if (!displayCorrectAns && errMeta && "correctedText" in errMeta) {
                  displayCorrectAns = errMeta.correctedText || "";
                }

                const acceptedList: string[] = [];
                if (meta && "acceptedAnswers" in meta && Array.isArray((meta as any).acceptedAnswers)) {
                  acceptedList.push(...(meta as any).acceptedAnswers);
                }

                return (
                  <div className="space-y-4 text-xs sm:text-sm">
                    {type === "TRANSLATION" && q.translationMetadata?.direction && (
                      <div className="text-xs font-bold text-primary">
                        Direction: {q.translationMetadata.direction === "JA_TO_VI" ? "Japanese to Vietnamese" : "Vietnamese to Japanese"}
                      </div>
                    )}
                    {type === "SENTENCE_WRITING" && q.sentenceWritingMetadata && (
                      <div className="text-xs text-slate-500 space-y-1">
                        {q.sentenceWritingMetadata.prompt && <div><strong>Prompt:</strong> {q.sentenceWritingMetadata.prompt}</div>}
                        {q.sentenceWritingMetadata.requiredVocabulary && q.sentenceWritingMetadata.requiredVocabulary.length > 0 && (
                          <div><strong>Required Vocabulary:</strong> {q.sentenceWritingMetadata.requiredVocabulary.join(", ")}</div>
                        )}
                        {q.sentenceWritingMetadata.requiredGrammar && q.sentenceWritingMetadata.requiredGrammar.length > 0 && (
                          <div><strong>Required Grammar:</strong> {q.sentenceWritingMetadata.requiredGrammar.join(", ")}</div>
                        )}
                      </div>
                    )}
                    {type === "ERROR_CORRECTION" && q.errorCorrectionMetadata?.incorrectText && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-600 dark:text-red-400">
                        Incorrect sentence: {q.errorCorrectionMetadata.incorrectText}
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Your Answer</div>
                      <div className={`font-semibold ${q.isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {displayStudentAns || "—"}
                      </div>
                    </div>

                    <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
                      <div className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Correct Answer / Reference Answer</div>
                      <div className="font-semibold text-green-700 dark:text-green-300">
                        {displayCorrectAns || "—"}
                      </div>
                      {acceptedList.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                          <strong>Other Accepted Answers:</strong> {acceptedList.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Backend-provided explanation (only render when present, no mock data) */}
            {selectedReviewQuestion.explanation && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                <span className="text-[9px] uppercase font-black tracking-wider text-muted-foreground block mb-1.5">
                  Explanation
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {selectedReviewQuestion.explanation}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Show pre-exam screen if exam hasn't started
  if (!examStarted && !isSubmitted) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50 dark:bg-[#0a0c14] backdrop-blur-sm">
        <div className="max-w-lg w-full mx-4">
          <Card className="p-8 border border-slate-200/50 dark:border-white/10 shadow-xl bg-white dark:bg-[#0d1020]">
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
    <>
      <div
        className={`fixed inset-0 z-[100] flex flex-col text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#0a0c14] ${isFullscreen ? "pt-0" : "pt-0"} ${integrityLocked ? "filter blur-lg pointer-events-none select-none opacity-40" : ""}`}
        aria-hidden={integrityLocked ? "true" : "false"}
      >
        {/* 1. FOCUS HEADER - Sticky Top Bar with Timer */}
      <header className="shrink-0 bg-white dark:bg-[#0c0d12] border-b border-slate-200 dark:border-white/10 shadow-sm">
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
                {violations}
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
        <aside className="w-64 shrink-0 bg-white dark:bg-[#0d1020] border-r border-slate-200/50 dark:border-white/5 p-4 overflow-y-auto">
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
                  {violations}
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

            {/* Answer Options / Custom Renderer */}
            <div className="space-y-3">
              {(() => {
                const q = questions[currentQuestion];
                if (!q) return null;
                const type = q.type || "MULTIPLE_CHOICE";

                if (type === "MULTIPLE_CHOICE") {
                  return q.options.map((opt: string, optIdx: number) => {
                    const isSelected = answers[currentQuestion] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQuestion, optIdx)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? "bg-primary/5 border-primary shadow-md shadow-primary/10"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/80"
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
                      </button>
                    );
                  });
                }

                if (type === "TRUE_FALSE") {
                  const tfOptions = ["True", "False"];
                  return (
                    <div className="flex gap-4">
                      {tfOptions.map((opt, optIdx) => {
                        const isSelected = answers[currentQuestion] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(currentQuestion, optIdx)}
                            className={`flex-1 flex items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 font-bold text-lg ${
                              isSelected
                                ? "bg-primary/5 border-primary text-primary shadow-md"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-primary/40"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                if (type === "FILL_BLANK") {
                  return (
                    <input
                      type="text"
                      value={answers[currentQuestion] || ""}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
                      placeholder="Type your answer here..."
                      className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:border-primary outline-none transition-all font-medium text-lg text-foreground dark:text-white"
                    />
                  );
                }

                if (type === "SHORT_ANSWER" || type === "TRANSLATION" || type === "SENTENCE_WRITING" || type === "ERROR_CORRECTION") {
                  return (
                    <div className="space-y-3">
                      {type === "TRANSLATION" && q.translationMetadata?.direction && (
                        <div className="text-sm font-bold text-primary">
                          Direction: {q.translationMetadata.direction === "JA_TO_VI" ? "Japanese to Vietnamese" : "Vietnamese to Japanese"}
                        </div>
                      )}
                      {type === "SENTENCE_WRITING" && q.sentenceWritingMetadata && (
                        <div className="text-sm text-slate-500 space-y-1">
                          {q.sentenceWritingMetadata.prompt && <div><strong>Prompt:</strong> {q.sentenceWritingMetadata.prompt}</div>}
                          {q.sentenceWritingMetadata.requiredVocabulary && q.sentenceWritingMetadata.requiredVocabulary.length > 0 && (
                            <div><strong>Required Vocabulary:</strong> {q.sentenceWritingMetadata.requiredVocabulary.join(", ")}</div>
                          )}
                          {q.sentenceWritingMetadata.requiredGrammar && q.sentenceWritingMetadata.requiredGrammar.length > 0 && (
                            <div><strong>Required Grammar:</strong> {q.sentenceWritingMetadata.requiredGrammar.join(", ")}</div>
                          )}
                        </div>
                      )}
                      {type === "ERROR_CORRECTION" && q.errorCorrectionMetadata?.incorrectText && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-600 dark:text-red-400">
                          Incorrect sentence: {q.errorCorrectionMetadata.incorrectText}
                        </div>
                      )}
                      <textarea
                        value={answers[currentQuestion] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
                        placeholder="Type your written answer here..."
                        rows={4}
                        className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:border-primary outline-none transition-all font-medium text-base text-foreground dark:text-white resize-none"
                      />
                    </div>
                  );
                }

                if (type === "SENTENCE_REORDER") {
                  const promptText = q.q || "";
                  const rawTokens = (() => {
                    let targetLine = promptText.split(/\r?\n/).find((l: string) => l.includes("/") || l.includes("／")) || promptText;
                    if (targetLine.includes(":")) {
                      targetLine = targetLine.substring(targetLine.lastIndexOf(":") + 1);
                    } else if (targetLine.includes("：")) {
                      targetLine = targetLine.substring(targetLine.lastIndexOf("：") + 1);
                    }
                    return targetLine.split(/[/／]/).map((t: string) => t.trim()).filter(Boolean);
                  })();

                  const selectedIdxs: number[] = Array.isArray(answers[currentQuestion]) ? answers[currentQuestion] : [];

                  const handleSelectToken = (poolIdx: number) => {
                    if (selectedIdxs.includes(poolIdx)) return;
                    setAnswers(prev => ({ ...prev, [currentQuestion]: [...selectedIdxs, poolIdx] }));
                  };

                  const handleRemoveToken = (idxToRemove: number) => {
                    const next = [...selectedIdxs];
                    next.splice(idxToRemove, 1);
                    setAnswers(prev => ({ ...prev, [currentQuestion]: next }));
                  };

                  return (
                    <div className="space-y-4">
                      {/* Selected Area */}
                      <div className="p-4 min-h-[60px] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-wrap gap-2 items-center bg-slate-50 dark:bg-slate-900/50">
                        {selectedIdxs.length === 0 ? (
                          <span className="text-muted-foreground text-sm font-medium">Click tokens below to reorder...</span>
                        ) : (
                          selectedIdxs.map((poolIdx, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleRemoveToken(idx)}
                              className="px-3 py-1.5 bg-primary text-white font-semibold rounded-xl text-sm shadow-sm hover:bg-primary/95 transition-all"
                            >
                              {rawTokens[poolIdx]}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Pool Area */}
                      <div className="flex flex-wrap gap-2">
                        {rawTokens.map((tok: string, poolIdx: number) => {
                          const isUsed = selectedIdxs.includes(poolIdx);
                          return (
                            <button
                              key={poolIdx}
                              type="button"
                              disabled={isUsed}
                              onClick={() => handleSelectToken(poolIdx)}
                              className={`px-3 py-1.5 font-semibold rounded-xl text-sm border-2 transition-all ${
                                isUsed
                                  ? "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-muted-foreground/40 cursor-not-allowed"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-foreground dark:text-white hover:border-primary"
                              }`}
                            >
                              {tok}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
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

      </div>

      {/* Fullscreen Integrity Lock Overlay */}
      {integrityLocked && examStarted && !isSubmitted && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/90 dark:bg-black/95 backdrop-blur-md p-4">
          <Card className="max-w-md w-full p-8 space-y-6 border border-red-500/30 dark:border-red-500/40 shadow-2xl relative overflow-hidden bg-white dark:bg-[#0f1118] text-center">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                <ShieldAlert className="w-9 h-9 animate-pulse" />
              </div>
              <h3 className="font-display font-black text-xl text-slate-800 dark:text-white">
                Bạn đã thoát chế độ toàn màn hình
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                Bài kiểm tra yêu cầu duy trì chế độ toàn màn hình để đảm bảo tính trung thực. Bài làm đã được tạm khóa. Hãy quay lại toàn màn hình để tiếp tục.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-xs text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Số lần vi phạm:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-extrabold">
                  {violations}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                * Lưu ý: Mọi hành động rời khỏi khu vực làm bài đều được ghi nhận và báo cáo tới giáo viên.
              </p>
            </div>

            {fullscreenError && (
              <div className="p-3 bg-rose-500/10 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {fullscreenError}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleRestoreFullscreen}
                className="w-full py-3.5 rounded-2xl bg-gradient-hero hover:opacity-90 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                Quay lại toàn màn hình
              </button>
              <p className="text-[10px] text-slate-400">
                Bạn cần nhấn nút bên trên để có thể tiếp tục bài kiểm tra.
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
