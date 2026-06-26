import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Headphones,
  ListChecks,
  Check,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Mic,
  FileText,
  MousePointer,
  Search,
  X,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { listeningApi } from "@/lib/api/listening";
import { ApiError } from "@/lib/api/client";
import { studentAccessibleLevels } from "./student.classes";

type Tab = "select" | "practice";
type JLPTLevel = "All" | "N5" | "N4" | "N3" | "N2" | "N1";
type PracticeMode = "dictation" | "multiple-choice" | null;

const JLPT_LEVELS: JLPTLevel[] = ["All", "N5", "N4", "N3", "N2", "N1"];
const ITEMS_PER_PAGE = 5;

const PRACTICE_MODES = [
  {
    id: "dictation" as const,
    label: "Dictation",
    description: "Listen and type the full sentence",
    icon: Mic,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    activeBg: "bg-emerald-500",
  },
  {
    id: "multiple-choice" as const,
    label: "Multiple Choice",
    description: "Listen and choose the correct answer",
    icon: ListChecks,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    activeBg: "bg-blue-500",
  },
] as const;

interface StudentListeningExercise {
  id: string;
  title: string;
  level: string;
  type: string;
  topic: string;
  audioUrl?: string;
  transcript: string;
  meaning: string;
  hiddenWords: string[];
  duration: string;
  questions?: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[];
  mode?: "dictation" | "quiz" | "both";
}

function getLevelBoxStyle(level: string, isSelected: boolean) {
  if (isSelected) return "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-md";
  const styles: Record<string, string> = {
    N5: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200",
    N4: "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200",
    N3: "bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-200",
    N2: "bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-200",
    N1: "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200",
  };
  return styles[level] ?? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
}

function getBlankedText(text: string, hiddenWords: string[]): string {
  if (!text || !hiddenWords || hiddenWords.length === 0) return text;
  let result = text;
  hiddenWords.forEach((word) => {
    if (word && word.trim()) {
      result = result.split(word).join(" ____ ");
    }
  });
  return result;
}

function getBlankedTextArray(text: string, hiddenWords: string[]): string[] {
  if (!text) return [];
  return text.split(/(\s+)/).filter(Boolean);
}

interface HighlightSegment {
  text: string;
  isCorrect: boolean;
  isHidden: boolean;
}

function getHighlightedSegments(
  userAnswer: string,
  correctAnswer: string,
  hiddenWords: string[],
): HighlightSegment[] {
  if (!userAnswer.trim() || !correctAnswer) return [];

  const userNormalized = userAnswer.trim();
  const correctNormalized = correctAnswer.trim();

  const userChars = userNormalized.split("");
  const correctChars = correctNormalized.split("");

  const segments: HighlightSegment[] = [];
  let userIdx = 0;
  let correctIdx = 0;

  while (correctIdx < correctChars.length) {
    const correctChar = correctChars[correctIdx];

    if (userIdx < userChars.length && userChars[userIdx] === correctChar) {
      segments.push({ text: correctChar, isCorrect: true, isHidden: false });
      userIdx++;
      correctIdx++;
    } else {
      let matchFound = false;
      if (userIdx < userChars.length) {
        for (
          let lookAhead = Math.min(3, correctChars.length - correctIdx);
          lookAhead > 0;
          lookAhead--
        ) {
          const userSlice = userChars.slice(userIdx, userIdx + lookAhead).join("");
          const correctSlice = correctChars.slice(correctIdx, correctIdx + lookAhead).join("");
          if (userSlice === correctSlice) {
            for (let i = 0; i < lookAhead; i++) {
              segments.push({
                text: correctChars[correctIdx + i],
                isCorrect: true,
                isHidden: false,
              });
            }
            userIdx += lookAhead;
            correctIdx += lookAhead;
            matchFound = true;
            break;
          }
        }
      }

      if (!matchFound) {
        if (userIdx < userChars.length) {
          segments.push({ text: userChars[userIdx], isCorrect: false, isHidden: false });
          userIdx++;
        } else {
          segments.push({ text: correctChar, isCorrect: true, isHidden: true });
          correctIdx++;
        }
      }
    }
  }

  while (userIdx < userChars.length) {
    segments.push({ text: userChars[userIdx], isCorrect: false, isHidden: false });
    userIdx++;
  }

  const merged: HighlightSegment[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.isCorrect === seg.isCorrect && last.isHidden === seg.isHidden) {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

export const Route = createFileRoute("/student/listening")({ component: Listening });

function Listening() {
  // Use accessible levels (mock - later from API)
  const studentLevels = studentAccessibleLevels as JLPTLevel[];

  // Default to first accessible level
  const defaultLevel: JLPTLevel = studentLevels.length > 0 ? studentLevels[0] : "N5";

  const [activeTab, setActiveTab] = useState<Tab>("select");
  const [exercises, setExercises] = useState<StudentListeningExercise[]>([]);
  const [selectedEx, setSelectedEx] = useState<StudentListeningExercise | null>(null);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(false);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizChecked, setQuizChecked] = useState(false);

  const [levelFilter, setLevelFilter] = useState<JLPTLevel>(defaultLevel);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const completedExercises = new Set<string>(["list-001", "list-002"]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentDuration, setDuration] = useState(0);

  const fetchExercises = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listeningApi.getStudentListenings(
        levelFilter === "All" ? undefined : { level: levelFilter },
      );
      const mapped = list.map((item) => {
        const detail = item as any;
        const parsedMeaning = (() => {
          try {
            const parsed = JSON.parse(detail.meaning || "");
            if (parsed && typeof parsed === "object") {
              return {
                text: parsed.text || "",
                type: parsed.type || "Dictation",
                blankWords: parsed.blankWords || [],
              };
            }
          } catch (e) {}
          return {
            text: detail.meaning || "",
            type: "Dictation",
            blankWords: [],
          };
        })();

        let exerciseType = parsedMeaning.type;
        let mode = detail.mode || "dictation";

        const isQuizMode =
          detail.mode === "quiz" ||
          detail.exerciseType === "MULTIPLE_CHOICE" ||
          (detail.questions && detail.questions.length > 0 && detail.questions[0].options);

        if (isQuizMode) {
          exerciseType = "Multiple Choice";
          mode = "quiz";
        } else {
          exerciseType = "Dictation";
          mode = "dictation";
        }

        return {
          id: item.id,
          title: item.title,
          level: item.level || "N5",
          type: exerciseType,
          topic: detail.topic || "General",
          audioUrl: item.audioUrl
            ? item.audioUrl.startsWith("http")
              ? item.audioUrl
              : `http://localhost:8080${item.audioUrl}`
            : undefined,
          transcript: detail.transcript || "",
          meaning: parsedMeaning.text,
          hiddenWords: parsedMeaning.blankWords,
          duration: "0:00",
          questions: detail.questions || [],
          mode: mode,
        };
      });
      setExercises(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load listening exercises.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [levelFilter]);

  useEffect(() => {
    if (audioRef.current && selectedEx?.audioUrl) {
      if (playing) {
        audioRef.current.play().catch((err) => {
          console.error("Audio play failed:", err);
          setPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [playing, selectedEx]);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [selectedEx]);

  const correct = useMemo(() => {
    if (!selectedEx) return false;
    const cleanAnswer = answer.replace(/\s/g, "").toLowerCase();
    if (selectedEx.type === "Blank Fill") {
      const cleanHidden = (selectedEx.hiddenWords || []).map((w) =>
        w.replace(/\s/g, "").toLowerCase(),
      );
      if (cleanHidden.length === 0) return false;
      if (cleanHidden.length === 1) {
        return cleanAnswer === cleanHidden[0];
      }
      return (
        cleanHidden.every((word) => cleanAnswer.includes(word)) ||
        cleanHidden.join(",") === cleanAnswer ||
        cleanHidden.join("|") === cleanAnswer
      );
    } else {
      return cleanAnswer === (selectedEx.transcript || "").replace(/\s/g, "").toLowerCase();
    }
  }, [answer, selectedEx]);

  const filteredExercises = useMemo(() => {
    let result = exercises;
    if (practiceMode) {
      if (practiceMode === "dictation") {
        result = result.filter((ex) => ex.type !== "Multiple Choice");
      } else if (practiceMode === "multiple-choice") {
        result = result.filter((ex) => ex.type === "Multiple Choice");
      }
    }
    if (appliedSearch) {
      const search = appliedSearch.toLowerCase();
      result = result.filter(
        (ex) =>
          ex.title.toLowerCase().includes(search) ||
          ex.topic.toLowerCase().includes(search) ||
          ex.type.toLowerCase().includes(search),
      );
    }
    return result;
  }, [exercises, practiceMode, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedExercises = filteredExercises.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleSelectLevel = (level: JLPTLevel) => {
    setLevelFilter(level);
    setPage(1);
  };

  const handleSelectExercise = async (ex: StudentListeningExercise) => {
    setIsLoading(true);
    try {
      const detail = await listeningApi.getStudentListeningById(ex.id);
      const parsedMeaning = (() => {
        try {
          const parsed = JSON.parse(detail.meaning || "");
          if (parsed && typeof parsed === "object") {
            return {
              text: parsed.text || "",
              type: parsed.type || "Dictation",
              blankWords: parsed.blankWords || [],
            };
          }
        } catch (e) {}
        return {
          text: detail.meaning || "",
          type: "Dictation",
          blankWords: [],
        };
      })();

      let selectedType = (detail.exerciseType as string) || parsedMeaning.type || "Dictation";
      let exerciseMode = detail.mode || ex.mode;

      const isQuizMode =
        detail.mode === "quiz" ||
        exerciseMode === "quiz" ||
        detail.exerciseType === "MULTIPLE_CHOICE" ||
        (detail.questions && detail.questions.length > 0 && detail.questions[0].options);

      if (isQuizMode) {
        selectedType = "Multiple Choice";
        exerciseMode = "quiz";
      } else {
        selectedType = "Dictation";
        exerciseMode = "dictation";
      }

      setSelectedEx({
        ...ex,
        type: selectedType,
        transcript: detail.transcript || "",
        meaning: parsedMeaning.text,
        hiddenWords: parsedMeaning.blankWords,
        audioUrl: detail.audioUrl
          ? detail.audioUrl.startsWith("http")
            ? detail.audioUrl
            : `http://localhost:8080${detail.audioUrl}`
          : undefined,
        questions: detail.questions || [],
        mode: exerciseMode as "dictation" | "quiz" | "both",
      });
      setAnswer("");
      setChecked(false);
      setSelectedAnswers({});
      setQuizChecked(false);
      setActiveTab("practice");
    } catch (err) {
      console.error(err);
      alert("Failed to load exercise details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setAnswer("");
    setChecked(false);
    setPlaying(false);
    setSelectedAnswers({});
    setQuizChecked(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    if (!quizChecked) {
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: answerIndex,
      }));
    }
  };

  const handleCheckQuiz = () => {
    setQuizChecked(true);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = currentDuration > 0 ? (currentTime / currentDuration) * 100 : 0;

  return (
    <div className="dark:bg-linear-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-black">Listening Lessons</h1>
              <p className="text-sm text-muted-foreground dark:text-slate-300 mt-0.5 leading-relaxed">
                Practice listening and improve your Japanese comprehension.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {[
                { label: "Completed", value: completedExercises.size, color: "text-green-500" },
                { label: "Total", value: exercises.length, color: "text-blue-500" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center px-3 py-2 rounded-xl bg-card/70 dark:bg-indigo-950/50 backdrop-blur-sm border border-border/50 dark:border-indigo-400/20 shadow-sm"
                >
                  <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(searchInput.trim());
                }
              }}
              placeholder="Search listening exercises..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-card/70 dark:bg-white/5.5 backdrop-blur-sm border border-border/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 dark:focus:ring-cyan-300/30 dark:focus:border-cyan-300/30 shadow-sm dark:placeholder:text-slate-400 dark:text-slate-200 dark:focus:bg-white/[0.07] pr-20"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setAppliedSearch("");
                }}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setAppliedSearch(searchInput.trim())}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {selectedEx?.audioUrl && (
            <audio
              ref={audioRef}
              src={selectedEx.audioUrl}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => {
                setPlaying(false);
                setCurrentTime(0);
              }}
            />
          )}

          {!selectedEx && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MousePointer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    Select practice skill
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRACTICE_MODES.map((mode) => {
                    const isActive = practiceMode === mode.id;
                    const Icon = mode.icon;
                    const count =
                      mode.id === "dictation"
                        ? exercises.filter((e) => e.type !== "Multiple Choice").length
                        : exercises.filter((e) => e.type === "Multiple Choice").length;

                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setPracticeMode(isActive ? null : mode.id);
                          setPage(1);
                          setSelectedEx(null);
                          setActiveTab("select");
                          setAnswer("");
                          setChecked(false);
                          setSelectedAnswers({});
                          setQuizChecked(false);
                        }}
                        className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                          isActive
                            ? `border-transparent bg-linear-to-br ${mode.bgColor} shadow-lg scale-[1.02]`
                            : `bg-white/80 dark:bg-indigo-950/30 backdrop-blur-sm border-white/60 dark:border-indigo-400/20 shadow-sm hover:shadow-md hover:-translate-y-0.5`
                        }`}
                      >
                        {isActive && (
                          <div
                            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${mode.activeBg} flex items-center justify-center shadow-md`}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? mode.bgColor
                              : "bg-white/80 dark:bg-indigo-950/50 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-400/30"
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 ${isActive ? mode.color.replace("from-", "text-").replace(" to-", "/") : "text-muted-foreground"}`}
                          />
                        </div>

                        <div className="flex-1 text-left">
                          <div
                            className={`font-bold text-sm mb-0.5 ${isActive ? "text-foreground" : "text-foreground/80"}`}
                          >
                            {mode.label}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {mode.description}
                          </div>
                        </div>

                        <div
                          className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isActive
                              ? `bg-white/80 dark:bg-white/10 ${mode.color.split(" ")[0].replace("from-", "text-")}`
                              : "bg-slate-100 dark:bg-white/10 text-muted-foreground"
                          }`}
                        >
                          {count}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-5">
                {studentLevels.length > 1 && (
                  <button
                    onClick={() => handleSelectLevel("All")}
                    className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      levelFilter === "All"
                        ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-md"
                        : "bg-white/70 dark:bg-indigo-950/50 backdrop-blur-sm border border-white/60 dark:border-indigo-400/20 shadow-sm text-muted-foreground hover:bg-white/90 dark:hover:bg-indigo-950/60 hover:text-foreground hover:-translate-y-0.5"
                    }`}
                  >
                    All
                  </button>
                )}
                {studentLevels.map((level) => {
                  const isActive = levelFilter === level;
                  return (
                    <button
                      key={level}
                      onClick={() => handleSelectLevel(level)}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-md"
                          : "bg-white/70 dark:bg-indigo-950/50 backdrop-blur-sm border border-white/60 dark:border-indigo-400/20 shadow-sm text-muted-foreground hover:bg-white/90 dark:hover:bg-indigo-950/60 hover:text-foreground hover:-translate-y-0.5"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[1.5rem] bg-white/80 dark:bg-indigo-950/30 backdrop-blur-xl border border-white/60 dark:border-indigo-400/20 shadow-sm overflow-hidden">
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground/80">
                      Choose a listening exercise
                    </p>
                    {practiceMode && (
                      <span className="text-xs text-muted-foreground">
                        {filteredExercises.length} exercise
                        {filteredExercises.length !== 1 ? "s" : ""} available
                      </span>
                    )}
                  </div>
                </div>

                {!practiceMode && (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-6 m-4 rounded-2xl bg-linear-to-br from-slate-50/80 to-blue-50/50 dark:from-indigo-950/50 dark:to-blue-900/20 border border-dashed border-slate-300 dark:border-indigo-400/30">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 backdrop-blur-sm flex items-center justify-center mb-4">
                      <Headphones className="w-7 h-7 text-primary opacity-60" />
                    </div>
                    <h3 className="font-display font-bold text-base text-foreground dark:text-white mb-2">
                      Select a practice skill
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Please select one of the practice modes above to view the exercises.
                    </p>
                  </div>
                )}

                {practiceMode && isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary mb-3" />
                    <p className="text-muted-foreground text-sm">Loading listening exercises...</p>
                  </div>
                )}

                {practiceMode && error && (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <AlertCircle className="text-red-500 mb-3 w-8 h-8" />
                    <p className="text-red-500 font-medium text-sm">{error}</p>
                    <button
                      onClick={fetchExercises}
                      className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                )}

                {practiceMode && !isLoading && !error && paginatedExercises.length === 0 && (
                  <div className="text-center py-16 px-4 m-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50">
                    <Headphones className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">
                      No listening exercises available for this mode.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exercises will appear here once created by a teacher.
                    </p>
                  </div>
                )}

                {practiceMode && !isLoading && !error && (
                  <div className="p-3 sm:p-4 space-y-2">
                    {paginatedExercises.map((ex, i) => {
                      const isSelected = selectedEx?.id === ex.id;
                      return (
                        <motion.div
                          key={ex.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <button
                            onClick={() => handleSelectExercise(ex)}
                            className={`w-full text-left rounded-2xl p-4 transition-all duration-300 ease-out border ${
                              isSelected
                                ? "bg-white/95 dark:bg-indigo-950/50 backdrop-blur-sm border-primary/30 dark:border-indigo-400/40 shadow-xl shadow-primary/10"
                                : "bg-white/70 dark:bg-indigo-950/20 backdrop-blur-sm border-white/60 dark:border-indigo-400/20 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-indigo-950/30 hover:border-indigo-400/30"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${getLevelBoxStyle(ex.level, isSelected)}`}
                              >
                                <span className="font-display font-black text-sm">{ex.level}</span>
                                <span className="text-[7px] font-semibold opacity-60">JLPT</span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-display font-bold text-base text-foreground dark:text-white truncate pr-2 leading-relaxed">
                                    {ex.title}
                                  </h3>
                                  {isSelected && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-[10px] font-bold shrink-0">
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                                  {ex.topic && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/[0.07] dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 font-medium">
                                      <Headphones className="w-3 h-3" />
                                      {ex.topic}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/[0.07] dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 font-medium">
                                    <ListChecks className="w-3 h-3" />
                                    {ex.type}
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ease-out ${
                                  isSelected
                                    ? "bg-primary text-white shadow-sm"
                                    : "bg-slate-100/80 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-400 text-muted-foreground"
                                }`}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>

                            {isSelected && (
                              <motion.div
                                layoutId="selectedBar"
                                className="h-1 mt-3 rounded-full bg-linear-to-r from-blue-400 to-pink-400"
                              />
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {practiceMode && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-5 pb-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-sm hover:shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-300 ease-out shadow-sm ${
                        p === safePage
                          ? "bg-linear-to-r from-blue-400 to-pink-400 text-white shadow-lg shadow-pink-500/20"
                          : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground hover:shadow-md"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-sm hover:shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {selectedEx && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSelectedEx(null);
                    setAnswer("");
                    setChecked(false);
                    setSelectedAnswers({});
                    setQuizChecked(false);
                    setPlaying(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground hover:-translate-x-1 transition-all duration-300 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back to exercises</span>
                </button>

                <div className="relative rounded-2xl overflow-hidden p-6 shadow-xl shadow-indigo-500/[0.07] dark:shadow-black/15">
                  <div className="absolute inset-0 bg-linear-to-br from-indigo-600 via-violet-500 to-pink-400 dark:from-indigo-800/85 dark:via-violet-800/80 dark:to-pink-700/75" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(255,255,255,0.22),transparent_35%),radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.09),transparent_30%),radial-gradient(ellipse_at_50%_100%,rgba(139,92,246,0.15),transparent_40%)]" />
                  <div className="relative z-10 flex items-center gap-4 text-white">
                    <button
                      onClick={() => setPlaying((p) => !p)}
                      className="w-16 h-16 rounded-full bg-white text-indigo-600 grid place-items-center shadow-xl shadow-black/10 shrink-0 hover:scale-105 active:scale-95 transition-transform"
                    >
                      {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-sm">
                          {selectedEx.level}
                        </span>
                        <span className="text-xs text-white/70">{selectedEx.type}</span>
                      </div>
                      <div className="font-display font-bold text-xl leading-tight mb-3">
                        {selectedEx.title}
                      </div>

                      <div className="flex items-end gap-0.5 h-8 mb-1">
                        {Array.from({ length: 40 }).map((_, wi) => {
                          const raw =
                            20 +
                            Math.abs(Math.sin(wi * 0.75)) * 46 +
                            Math.abs(Math.cos(wi * 0.38)) * 20;
                          const height = Math.min(90, Math.max(20, raw));
                          return (
                            <div
                              key={wi}
                              className={`flex-1 rounded-full transition-all ${playing ? "bg-white" : "bg-white/60"}`}
                              style={{ height: `${height}%`, minHeight: "3px" }}
                            />
                          );
                        })}
                      </div>
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden relative mb-2">
                        <div
                          className="h-full bg-white rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-white/75">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(currentDuration)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setPlaying(false);
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                        }
                        setTimeout(() => setPlaying(true), 100);
                      }}
                      className="p-3 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm transition shrink-0"
                      title="Replay"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {selectedEx.type !== "Multiple Choice" && (
                  <div className="rounded-2xl border border-border/60 bg-card/80 dark:bg-slate-800/90 shadow-sm overflow-hidden backdrop-blur-sm">
                    <div className="px-5 py-3 border-b border-border/60 dark:border-slate-700">
                      <h3 className="font-display font-bold text-sm text-foreground">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          Dictation Exercise
                        </span>
                      </h3>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-muted-foreground mb-4">
                        Listen to the audio and type what you hear. Pay attention to the highlighted
                        blanks.
                      </p>

                      <div className="mb-4 p-4 rounded-xl bg-muted/50 dark:bg-slate-900/50 border border-border/60 dark:border-slate-700">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          Original text:
                        </p>
                        <p className="font-medium text-foreground">
                          {getBlankedText(selectedEx.transcript, selectedEx.hiddenWords)}
                        </p>
                      </div>

                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type what you hear..."
                        disabled={checked}
                        className="w-full px-4 py-3 rounded-xl border border-border/60 dark:border-slate-700 bg-card dark:bg-slate-900/50 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 transition-all"
                        rows={3}
                      />

                      {!checked && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => setChecked(true)}
                            disabled={!answer.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Sparkles className="w-4 h-4" />
                            Check Answer
                          </button>
                          <button
                            onClick={handleRetry}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-border/60 dark:border-white/10 text-foreground dark:text-slate-200 font-semibold text-sm hover:bg-white dark:hover:bg-white/10 transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Clear
                          </button>
                        </div>
                      )}

                      {checked && (
                        <div className="mt-4">
                          <div
                            className={`p-4 rounded-xl border ${
                              correct
                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                            }`}
                          >
                            <div
                              className={`flex items-center gap-2 font-bold text-sm ${
                                correct
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {correct ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
                              {correct
                                ? "Excellent! Perfect score!"
                                : "Not quite right. Try again!"}
                            </div>

                            {!correct && (
                              <div className="mt-3 pt-3 border-t border-current/20">
                                <p className="text-xs text-muted-foreground mb-1">
                                  Correct answer:
                                </p>
                                <p className="font-semibold text-foreground">
                                  {selectedEx.transcript}
                                </p>
                              </div>
                            )}

                            {selectedEx.meaning && (
                              <div className="mt-3 pt-3 border-t border-current/20">
                                <p className="text-xs text-muted-foreground mb-1">Meaning:</p>
                                <p className="text-sm text-foreground">{selectedEx.meaning}</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleRetry}
                            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-border/60 dark:border-white/10 text-foreground dark:text-slate-200 font-semibold text-sm hover:bg-white dark:hover:bg-white/10 transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Try Another Exercise
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEx.type === "Multiple Choice" && selectedEx.questions && (
                  <div className="rounded-2xl border border-border/60 bg-card/80 dark:bg-slate-800/90 shadow-sm overflow-hidden backdrop-blur-sm">
                    <div className="px-5 py-3 border-b border-border/60 dark:border-slate-700">
                      <h3 className="font-display font-bold text-sm text-foreground">
                        <span className="inline-flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-muted-foreground" />
                          Multiple Choice Quiz
                        </span>
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      {selectedEx.questions.map((q, qi) => {
                        const selected = selectedAnswers[q.id];
                        const isCorrect = quizChecked && selected === q.correctAnswer;
                        const isWrong =
                          quizChecked && selected !== undefined && selected !== q.correctAnswer;

                        return (
                          <div key={q.id} className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">
                              {qi + 1}. {q.question}
                            </p>
                            <div className="space-y-1.5">
                              {q.options.map((opt, oi) => {
                                const isSelected = selected === oi;
                                return (
                                  <button
                                    key={oi}
                                    onClick={() => !quizChecked && handleSelectAnswer(q.id, oi)}
                                    disabled={quizChecked}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 border ${
                                      isSelected
                                        ? quizChecked
                                          ? isCorrect
                                            ? "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                                            : "bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                                          : "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/50 text-primary dark:text-primary-foreground"
                                        : quizChecked && oi === q.correctAnswer
                                          ? "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                                          : "bg-muted/50 dark:bg-slate-900/50 border-border/60 dark:border-slate-700 text-foreground/80 dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800/50"
                                    }`}
                                  >
                                    <span className="font-medium mr-2">
                                      {String.fromCharCode(65 + oi)}.
                                    </span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {quizChecked && (
                              <div
                                className={`mt-2 p-3 rounded-xl ${
                                  isCorrect
                                    ? "bg-emerald-50 dark:bg-emerald-950/30"
                                    : "bg-red-50 dark:bg-red-950/30"
                                }`}
                              >
                                <div
                                  className={`flex items-center gap-2 text-sm font-semibold ${
                                    isCorrect
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                  {isCorrect
                                    ? "Correct!"
                                    : `Incorrect. The correct answer is: ${q.options[q.correctAnswer]}`}
                                </div>
                                {q.explanation && (
                                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 pl-6">
                                    {q.explanation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!quizChecked && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            onClick={handleRetry}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-border/60 dark:border-white/10 text-foreground dark:text-slate-200 font-semibold text-sm hover:bg-white dark:hover:bg-white/10 transition-all duration-200"
                          >
                            <RotateCcw className="w-4 h-4" /> Retry
                          </button>
                          <button
                            onClick={handleCheckQuiz}
                            disabled={
                              Object.keys(selectedAnswers).length !== selectedEx.questions?.length
                            }
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-linear-to-r from-blue-500 to-pink-500 text-white font-bold text-sm shadow-md hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Check className="w-4 h-4" /> Check answers
                          </button>
                        </div>
                      )}

                      {quizChecked && (
                        <div className="pt-2">
                          <div className="p-4 rounded-2xl bg-linear-to-r from-blue-500/10 to-pink-500/10 dark:from-blue-500/20 dark:to-pink-500/20 border border-blue-200/50 dark:border-blue-500/30">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-foreground dark:text-white">
                                  Quiz Complete!
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {
                                    selectedEx.questions?.filter(
                                      (q) => selectedAnswers[q.id] === q.correctAnswer,
                                    ).length
                                  }{" "}
                                  / {selectedEx.questions?.length} correct
                                </p>
                              </div>
                              <div
                                className={`px-3 py-1.5 rounded-xl font-bold text-sm ${
                                  (selectedEx.questions?.filter(
                                    (q) => selectedAnswers[q.id] === q.correctAnswer,
                                  ).length || 0) === selectedEx.questions?.length
                                    ? "bg-emerald-500 text-white"
                                    : "bg-blue-500 text-white"
                                }`}
                              >
                                {Math.round(
                                  ((selectedEx.questions?.filter(
                                    (q) => selectedAnswers[q.id] === q.correctAnswer,
                                  ).length || 0) /
                                    (selectedEx.questions?.length || 1)) *
                                    100,
                                )}
                                %
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>Want to switch exercises?</span>
                  <button
                    onClick={() => setActiveTab("select")}
                    className="text-primary font-semibold hover:underline underline-offset-4 transition-all"
                  >
                    Back to exercises
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
