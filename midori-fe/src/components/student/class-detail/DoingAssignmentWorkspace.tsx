import React, { useState, useEffect } from "react";
import { Card } from "@/components/page-ui";
import {
  AlertCircle, Clock, CheckCircle2, ShieldAlert, AlertTriangle, ArrowLeft,
  ChevronLeft, ChevronRight, Flag, Save, Maximize, Minimize, Brain, BookOpen,
  Check, X, Award, HelpCircle, FileText, CheckCircle, XCircle, Sparkles, BookOpen as LessonIcon
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { TEACHER_NOTIFICATIONS } from "@/data/teacher-notifications";

interface DoingAssignmentWorkspaceProps {
  assignment: {
    id: string;
    title: string;
    timeLimit: string | number;
    maxScore: number;
  };
  onClose: () => void;
  onSubmit: (id: string) => void;
  /** If true, skip to the review screen immediately (for "Review Mistakes" from score dialog) */
  reviewMode?: boolean;
}

export function DoingAssignmentWorkspace({ assignment, onClose, onSubmit, reviewMode = false }: DoingAssignmentWorkspaceProps) {
  const { user } = useAuth();
  const userName = user?.name || "Student Yuki T.";

  // Exam state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // In reviewMode, pre-fill a realistic submitted answer set (indices 0-4 mapped)
  const [answers, setAnswers] = useState<Record<number, number>>(
    reviewMode ? { 0: 1, 1: 2, 2: 0, 3: 0, 4: 0 } : { 0: 1 }
  );
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [lastViolationType, setLastViolationType] = useState("");
  const [timeLeft, setTimeLeft] = useState(reviewMode ? 0 : 1200); // 20:00 mins in seconds
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"Saving..." | "Saved">("Saved");
  const [lastSavedSec, setLastSavedSec] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(reviewMode);

  // Review screen states
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [notesStatus, setNotesStatus] = useState<Record<number, string>>({});

  const questions = [
    {
      q: 'Translate: "This is a pencil." in Japanese.',
      options: ["これは本です。", "これは鉛筆です。", "あれはペンです。", "それは鉛筆です。"],
      correctIdx: 1,
      type: "Translation",
      points: 20,
      skill: "Vocabulary",
      weakness: "Demonstratives / Classroom Nouns",
      recommendation: { title: "Vocabulary Lesson 2", link: "/student/vocabulary" },
      aiFeedback: {
        explanation: "The Japanese word for pencil is '鉛筆' (enpitsu). '本' means book, 'ペン' means pen.",
        grammar: "これは [Noun] です (This is [Noun]).",
        vocabulary: "鉛筆 (えんぴつ) = pencil; 本 (ほん) = book; ペン = pen.",
        commonMistake: "Confusing 'これ' (this near speaker) with 'それ' (that near listener) or 'あれ' (that far from both).",
        suggestion: "Review basic classroom vocabulary and demonstratives (ko-so-a-do series)."
      }
    },
    {
      q: 'Which particle is used to mark the topic of a sentence?',
      options: ["が (ga)", "を (wo)", "は (wa)", "に (ni)"],
      correctIdx: 2,
      type: "Grammar Particle",
      points: 20,
      skill: "Particles",
      weakness: "Subject/Topic Particles",
      recommendation: { title: "Grammar Lesson 1", link: "/student/grammar" },
      aiFeedback: {
        explanation: "The particle 'は' (pronounced 'wa' as a particle) marks the topic of the sentence. 'が' marks the grammatical subject.",
        grammar: "Topic Marker: [Noun] は [Information about topic].",
        vocabulary: "は (wa) = topic marker; が (ga) = subject marker; を (wo) = direct object marker.",
        commonMistake: "Confusing topic (は) and subject (が) particles is the most common mistake for beginners.",
        suggestion: "Focus on the context: は is used for general truths or established topics; が is used for new or emphasized information."
      }
    },
    {
      q: 'Translate: "Where is the toilet?" in Japanese.',
      options: ["お手洗いはどこですか。", "駅はどこですか。", "ここはお手洗いですか。", "お手洗いはあそこです。"],
      correctIdx: 0,
      type: "Survival Phrase",
      points: 20,
      skill: "Reading Comprehension",
      weakness: "Directives & Travel phrases",
      recommendation: { title: "Reading Lesson 3", link: "/student/reading" },
      aiFeedback: {
        explanation: "'お手洗い' (otearai) means toilet/restroom. 'どこ' (doko) means where.",
        grammar: "[Topic] は どこ ですか (Where is [Topic]?).",
        vocabulary: "お手洗い (おてあらい) = restroom; どこ = where; 駅 (えき) = station.",
        commonMistake: "Using 'ここ' (here) instead of 'どこ' (where).",
        suggestion: "Memorize asking directions for essential locations like restrooms, stations, and hotels."
      }
    },
    {
      q: 'What is the reading of the kanji "日本語"?',
      options: ["にほんご (nihongo)", "にっぽんご (nippongo)", "にほんじん (nihonjin)", "にほん (nihon)"],
      correctIdx: 0,
      type: "Kanji Reading",
      points: 20,
      skill: "Kanji",
      weakness: "Country/Language Suffixes",
      recommendation: { title: "Vocabulary Lesson 2", link: "/student/vocabulary" },
      aiFeedback: {
        explanation: "日本語 is read as 'にほんご' (nihongo). '日' (ni) + '本' (hon) + '語' (go/language).",
        grammar: "[Country] + 語 = Language of that country.",
        vocabulary: "日本語 (にほんご) = Japanese language; 日本人 (にほんじん) = Japanese person; 日本 (にほん) = Japan.",
        commonMistake: "Adding 'じん' (person suffix) or reading '語' as 'が'.",
        suggestion: "Learn country names and language suffixes together to build vocabulary systematically."
      }
    },
    {
      q: 'Complete the sentence: "私は学生 ______。"',
      options: ["です (desu)", "ます (masu)", "でした (deshita)", "あります (arimasu)"],
      correctIdx: 0,
      type: "Sentence Completion",
      points: 20,
      skill: "Grammar",
      weakness: "Basic Copula Verbs",
      recommendation: { title: "Grammar Lesson 2", link: "/student/grammar" },
      aiFeedback: {
        explanation: "'です' (desu) is the polite copula meaning 'to be' (am/is/are) in the present positive tense.",
        grammar: "Noun A は Noun B です (A is B).",
        vocabulary: "学生 (がくせい) = student; です = polite 'to be'; でした = past polite 'to be'.",
        commonMistake: "Using 'ます' (verb ending) for Nouns, or 'あります' (inanimate existence).",
        suggestion: "Ensure helper copulas (です) match the type of the word preceding it (noun/adjective)."
      }
    }
  ];

  // Auto-Save Effect
  useEffect(() => {
    setAutoSaveStatus("Saving...");
    const timer = setTimeout(() => {
      setAutoSaveStatus("Saved");
      setLastSavedSec(0);
    }, 600);
    return () => clearTimeout(timer);
  }, [answers, flagged]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSavedSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  // Anti-cheat setup
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitted) return;
      const msg = "Are you sure you want to leave? Your exam progress may be lost and this attempt will be reported.";
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
          icon: ShieldAlert
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
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [assignment.title, userName, isSubmitted]);

  // Keyboard support: 1, 2, 3, 4 for selections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showViolationWarning || showSubmitDialog || isSubmitted) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        const optionIdx = parseInt(e.key) - 1;
        if (optionIdx < questions[currentQuestion].options.length) {
          handleSelectOption(currentQuestion, optionIdx);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, showViolationWarning, showSubmitDialog, isSubmitted]);

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
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
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
    setAnswers({ 0: 1 });
    setFlagged({});
    setViolations(0);
    setTimeLeft(1200);
    setCurrentQuestion(0);
    setIsSubmitted(false);
  };

  const answeredCount = Object.keys(answers).length;
  const remainingCount = questions.length - answeredCount;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  const scoreEarned = questions.reduce((acc, q, idx) => {
    return acc + (answers[idx] === q.correctIdx ? q.points : 0);
  }, 0);
  const correctCount = questions.filter((q, idx) => answers[idx] === q.correctIdx).length;
  const wrongCount = questions.length - correctCount;
  const isPassed = scoreEarned >= (assignment.maxScore * 0.5);

  const selectedReviewQuestion = questions[currentReviewIndex];
  const isReviewCorrect = answers[currentReviewIndex] === selectedReviewQuestion.correctIdx;

  // Weak areas statistics calculation
  const weakAreasStats = questions.reduce((acc, q, idx) => {
    if (answers[idx] !== q.correctIdx) {
      acc[q.skill] = (acc[q.skill] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

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
            <div className={`absolute top-0 left-0 right-0 h-1 ${isPassed ? "bg-green-500" : "bg-red-500"}`} />
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Exam Summary</span>
                <h3 className="font-display font-black text-base text-foreground dark:text-white mt-0.5 leading-tight">{assignment.title}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                isPassed ? "bg-green-500/15 text-green-500 border border-green-500/25" : "bg-red-500/15 text-red-500 border border-red-500/25"
              }`}>
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
                <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] mt-0.5">Correct</div>
              </div>
              <div>
                <div className="font-black text-red-500">{wrongCount}</div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] mt-0.5">Incorrect</div>
              </div>
              <div>
                <div className="font-black text-slate-700 dark:text-slate-300">{formatTime(1200 - timeLeft)}</div>
                <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] mt-0.5">Time</div>
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
                    const firstWrong = questions.findIndex((q, i) => answers[i] !== q.correctIdx);
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
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Select Question</h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const correct = answers[idx] === q.correctIdx;
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

          {/* Section 8 & 9: Weak Areas & Performance Analytics */}
          <Card className="p-4 border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0d1020]/45 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Performance Analytics</h4>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Accuracy Rate</span>
                <span className="font-black text-foreground">{Math.round((correctCount / questions.length) * 100)}%</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Avg Time / Question</span>
                <span className="font-black text-foreground">{Math.round((1200 - timeLeft) / questions.length)}s</span>
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
                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                  isReviewCorrect ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
                }`}>
                  {isReviewCorrect ? "✓ Correct" : "✗ Incorrect"}
                </span>
              </div>
            </div>

            <h3 className="font-display font-bold text-base sm:text-lg text-foreground dark:text-white leading-relaxed">
              {selectedReviewQuestion.q}
            </h3>

            {/* Choice Review Options */}
            <div className="space-y-3">
              {selectedReviewQuestion.options.map((opt, optIdx) => {
                const wasChosen = answers[currentReviewIndex] === optIdx;
                const isCorrect = selectedReviewQuestion.correctIdx === optIdx;
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
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          isReviewCorrect ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                        }`}>
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
              <h4 className="font-display font-black text-sm uppercase tracking-wider">AI tutor analysis</h4>
            </div>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              
              {/* Question Mistake Card Difference details */}
              {!isReviewCorrect && (
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs flex flex-col gap-1.5">
                  <div className="font-bold text-red-500">Difference Highlight:</div>
                  <p>
                    You confused <strong className="text-red-500">"{selectedReviewQuestion.options[answers[currentReviewIndex]]}"</strong> with the correct option <strong className="text-green-500">"{selectedReviewQuestion.options[selectedReviewQuestion.correctIdx]}"</strong>.
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">Why correct</span>
                    {selectedReviewQuestion.aiFeedback.explanation}
                  </p>
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">Grammar Focus</span>
                    {selectedReviewQuestion.aiFeedback.grammar}
                  </p>
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">Vocabulary Break-down</span>
                    {selectedReviewQuestion.aiFeedback.vocabulary}
                  </p>
                </div>

                <div className="space-y-3 border-t sm:border-t-0 sm:border-l border-slate-200/50 dark:border-white/5 sm:pl-4 pt-3 sm:pt-0">
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">Common Student Mistakes</span>
                    {selectedReviewQuestion.aiFeedback.commonMistake}
                  </p>
                  <p>
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider">AI Sensei Suggestion</span>
                    {selectedReviewQuestion.aiFeedback.suggestion}
                  </p>
                  
                  {/* Section 5: Knowledge Breakdown tag */}
                  <div className="pt-2">
                    <span className="font-black text-indigo-500 block text-[10px] uppercase tracking-wider mb-1">Knowledge Classification</span>
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

  return (
    <div className="min-h-screen flex flex-col relative text-slate-700 dark:text-slate-200">
      {/* 1. TOP EXAM BAR (Sticky Header) */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0c0d12]/95 border-b border-slate-200 dark:border-white/10 backdrop-blur-md px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-display font-black text-base leading-none text-foreground dark:text-white">
              {assignment.title}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider">
                Reading
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {currentQuestion + 1} / {questions.length} Questions
              </span>
            </div>
          </div>
        </div>

        {/* Timers & Status indicators */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          {/* Auto Save Status */}
          <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>
              {autoSaveStatus} {lastSavedSec > 0 && `(Last saved ${lastSavedSec}s ago)`}
            </span>
          </div>

          {/* Fullscreen Status */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-border/50 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Remaining Time */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary">
            <Clock className="w-4 h-4 animate-pulse" />
            <span className="font-black tracking-wider text-sm">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid md:grid-cols-4 gap-6 items-start">
        
        {/* Left/Center Column: QUESTION AREA & ANSWER OPTIONS */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Question Card */}
          <Card className="p-6 border border-slate-200/50 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-black text-primary tracking-widest">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Type: {questions[currentQuestion].type}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground font-bold bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                Points: {questions[currentQuestion].points}
              </span>
            </div>

            <h2 className="font-display font-bold text-base sm:text-lg text-foreground dark:text-white leading-relaxed">
              {questions[currentQuestion].q}
            </h2>
          </Card>

          {/* Answer Options Card */}
          <Card className="p-6 border border-slate-200/50 dark:border-white/5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Select one option</h3>
            
            <div className="space-y-3">
              {questions[currentQuestion].options.map((opt, optIdx) => {
                const isSelected = answers[currentQuestion] === optIdx;
                return (
                  <label
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQuestion, optIdx)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-150 group w-full ${
                      isSelected
                        ? "bg-primary/5 border-primary text-primary shadow-sm"
                        : "bg-white/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.01]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected 
                          ? "border-primary bg-primary text-white" 
                          : "border-slate-300 dark:border-white/20 group-hover:border-primary"
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-foreground dark:text-slate-200">
                        {opt}
                      </span>
                    </div>
                    {/* Hotkey tag helper */}
                    <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded font-black group-hover:text-primary transition-colors">
                      {optIdx + 1}
                    </span>
                  </label>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 2. RIGHT PANEL (Sidebar Navigator) */}
        <aside className="md:col-span-1 space-y-6 md:sticky md:top-24">
          
          {/* Exam Summary Stat */}
          <Card className="p-4 border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0d1020]/45 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Exam Summary</h4>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs border-b border-slate-200/50 dark:border-white/5 pb-3">
              <div>
                <div className="font-black text-green-500">{answeredCount}</div>
                <div className="text-[9px] text-muted-foreground font-semibold">Answered</div>
              </div>
              <div>
                <div className="font-black text-slate-500">{remainingCount}</div>
                <div className="text-[9px] text-muted-foreground font-semibold">Remaining</div>
              </div>
              <div>
                <div className="font-black text-red-500">{flaggedCount}</div>
                <div className="text-[9px] text-muted-foreground font-semibold">Flagged</div>
              </div>
            </div>

            {/* Quick Navigation grid */}
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Question Navigator</div>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => {
                  const status = getQuestionStatus(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleScrollToQuestion(idx)}
                      className={`w-9 h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center border ${
                        status === "blue"
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                          : status === "green"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : status === "red"
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/10 text-muted-foreground hover:bg-slate-50"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-200 dark:border-white/10 text-[9px] text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-green-500/20 border border-green-500/30" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-primary" />
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/30" />
                <span>Flagged / Review</span>
              </div>
            </div>
          </Card>

          {/* Warnings & Integrity Card */}
          <Card className="p-4 border border-red-500/15 dark:border-red-500/30 bg-red-500/[0.01] dark:bg-red-500/[0.005] space-y-3.5">
            <div className="flex items-center gap-2 text-red-500">
              <ShieldAlert className="w-4 h-4" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Integrity Center</h4>
            </div>
            
            <div className="text-[10px] text-muted-foreground space-y-2 font-medium">
              <div className="flex items-center justify-between">
                <span>Tab Switch Guard</span>
                <span className="text-green-500 font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Page Exit Guard</span>
                <span className="text-green-500 font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between border-t border-red-500/10 pt-2 mt-1">
                <span>Violations Logger</span>
                <span className={`font-black ${violations > 0 ? "text-red-500 animate-pulse" : "text-green-500"}`}>
                  {violations} / 3 Warnings
                </span>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* 3. BOTTOM ACTION BAR (Sticky Footer) */}
      <footer className="sticky bottom-0 z-40 bg-white/95 dark:bg-[#0c0d12]/95 border-t border-slate-200 dark:border-white/10 backdrop-blur-md px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              className="px-4 py-2 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/[0.02] disabled:opacity-50 disabled:pointer-events-none transition flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              disabled={currentQuestion === questions.length - 1}
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              className="px-4 py-2 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/[0.02] disabled:opacity-50 disabled:pointer-events-none transition flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => toggleFlag(currentQuestion)}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                flagged[currentQuestion]
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "border-border/50 text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/[0.02]"
              }`}
            >
              <Flag className="w-4 h-4" />
              {flagged[currentQuestion] ? "Unflag" : "Flag for Review"}
            </button>

            <button
              onClick={() => setShowSubmitDialog(true)}
              className="px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black uppercase text-xs shadow-md transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Submit Exam
            </button>
          </div>
        </div>
      </footer>

      {/* Submit Confirmation Dialog Modal */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 space-y-4 border border-border/50 shadow-2xl bg-white dark:bg-[#0f1118] relative">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-black text-lg text-foreground dark:text-white">Submit Examination</h3>
              <button onClick={() => setShowSubmitDialog(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs border-y border-border/40 py-3 leading-relaxed">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-bold">{answeredCount} / {questions.length}</span>
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
                  <p className="text-[10px] text-muted-foreground font-normal mt-0.5">We recommend returning to answer them before submitting.</p>
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
                onClick={() => {
                  setShowSubmitDialog(false);
                  setIsSubmitted(true);
                }}
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
              You switched tabs or clicked outside the test window. This action violates test guidelines and has been logged and reported to your teacher.
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
