import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useSearch } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  BookOpen,
  Loader2,
  Trash2,
  Copy,
  Check,
  Circle,
  AlertCircle,
  Save,
  ArrowLeft,
  FileText,
  ChevronDown,
  ChevronUp,
  Music,
  Upload,
  Play,
  Pause,
  Volume2,
  Clock,
  FileAudio,
  Library,
  RotateCcw,
} from "lucide-react";
import { questionBankService, type Question } from "../services/questionBankService";
import { audioService } from "../services/questionBank.audioService";
import type {
  JLPTLevel,
  QuestionType,
  Difficulty,
  ListeningQuestion,
} from "../services/questionBank.types";
import { formatDuration, isListeningQuestion } from "../services/questionBank.types";
import { QuestionBankStickyHeader } from "../components/question-bank-sticky-header";

// ─── Routes ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/question-bank/question-builder")({
  component: QuestionBuilderPage,
});

interface QuestionForm {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  // Listening-specific
  audioUrl: string;
  audioFileName: string;
  audioDuration: number;
}

const createEmptyQuestion = (): QuestionForm => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  type: "Vocabulary",
  difficulty: "Easy",
  questionText: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
  audioUrl: "",
  audioFileName: "",
  audioDuration: 0,
});

const isQuestionComplete = (q: QuestionForm): boolean => {
  if (!q.questionText.trim()) return false;
  if (!q.options.every((opt) => opt.trim())) return false;
  // Listening requires audio
  if (q.type === "Listening" && !q.audioUrl) return false;
  return true;
};

// ─── Audio Upload Component ───────────────────────────────────────────────────────────────────

function AudioUploadSection({
  audioUrl,
  audioFileName,
  audioDuration,
  onUpload,
  onRemove,
}: {
  audioUrl: string;
  audioFileName: string;
  audioDuration: number;
  onUpload: (url: string, fileName: string, duration: number) => void;
  onRemove: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(audioDuration);
  const [showLibrary, setShowLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener("loadedmetadata", () => {
        setTotalDuration(audioRef.current?.duration || audioDuration);
      });
      audioRef.current.addEventListener("timeupdate", () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      alert("File size must be less than 20MB");
      return;
    }
    setIsUploading(true);
    try {
      const audio = await audioService.uploadAudio(file);
      onUpload(audio.url, audio.fileName, audio.duration);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload audio file");
    }
    setIsUploading(false);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSelectFromLibrary = (audio: { url: string; fileName: string; duration: number }) => {
    onUpload(audio.url, audio.fileName, audio.duration);
    setShowLibrary(false);
  };

  const libraryAudios = searchQuery ? audioService.search(searchQuery) : audioService.getAll();

  if (audioUrl) {
    return (
      <div className="space-y-3">
        {/* Audio Player */}
        <div className="p-4 rounded-xl bg-pink-500/8 border border-pink-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <FileAudio className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-col truncate">{audioFileName}</p>
              <p className="text-xs text-muted-col flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(totalDuration)}
              </p>
            </div>
            <button
              onClick={onRemove}
              className="p-2 rounded-lg hover:bg-red-500/10 text-muted-col hover:text-red-500 transition"
              title="Remove Audio"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Player Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <input
                type="range"
                min="0"
                max={totalDuration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <span className="text-xs text-muted-col tabular-nums">
                {formatDuration(currentTime)} / {formatDuration(totalDuration)}
              </span>
            </div>
          </div>
        </div>

        {/* Replace Audio */}
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 rounded-lg border border-dashed border-[var(--border)] hover:border-pink-500/40 text-muted-col hover:text-pink-500 transition text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Replace Audio
          </button>
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-col transition text-sm flex items-center gap-2"
          >
            <Library className="w-4 h-4" />
            Library
          </button>
        </div>

        {/* Audio Library */}
        <AnimatePresence>
          {showLibrary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-muted/50 border border-[var(--border)] space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search audio library..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {libraryAudios.length === 0 ? (
                    <p className="text-sm text-muted-col text-center py-4">No audio files found</p>
                  ) : (
                    libraryAudios.map((audio) => (
                      <button
                        key={audio.id}
                        onClick={() =>
                          handleSelectFromLibrary({
                            url: audio.url,
                            fileName: audio.fileName,
                            duration: audio.duration,
                          })
                        }
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--accent)] transition text-left"
                      >
                        <FileAudio className="w-4 h-4 text-pink-500 shrink-0" />
                        <span className="text-sm text-primary-col truncate flex-1">
                          {audio.fileName}
                        </span>
                        <span className="text-xs text-muted-col">
                          {formatDuration(audio.duration)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/m4a,audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          p-8 rounded-xl border-2 border-dashed cursor-pointer transition text-center
          ${
            isDragging
              ? "border-pink-500 bg-pink-500/5"
              : "border-[var(--border)] hover:border-pink-500/40"
          }
          ${isUploading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/m4a,audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-pink-500/12 flex items-center justify-center mx-auto mb-3">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
          ) : (
            <Music className="w-6 h-6 text-pink-500" />
          )}
        </div>
        <p className="text-sm font-medium text-primary-col mb-1">
          {isUploading ? "Uploading..." : "Upload Audio"}
        </p>
        <p className="text-xs text-muted-col">Drag & drop audio here or click to browse</p>
      </div>

      {/* Supported Formats */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-col">
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3" />
          MP3, WAV, M4A
        </span>
        <span>Max: 20MB</span>
      </div>

      {/* Library Option */}
      <div className="relative">
        <button
          onClick={() => setShowLibrary(!showLibrary)}
          className="w-full py-2 rounded-lg border border-dashed border-[var(--border)] hover:border-primary/40 text-muted-col hover:text-primary transition text-sm flex items-center justify-center gap-2"
        >
          <Library className="w-4 h-4" />
          Select from Audio Library
        </button>

        <AnimatePresence>
          {showLibrary && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 z-10 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg space-y-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audio..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {libraryAudios.length === 0 ? (
                  <p className="text-sm text-muted-col text-center py-4">
                    No audio files in library
                  </p>
                ) : (
                  libraryAudios.map((audio) => (
                    <button
                      key={audio.id}
                      onClick={() =>
                        handleSelectFromLibrary({
                          url: audio.url,
                          fileName: audio.fileName,
                          duration: audio.duration,
                        })
                      }
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--accent)] transition text-left"
                    >
                      <FileAudio className="w-4 h-4 text-pink-500 shrink-0" />
                      <span className="text-sm text-primary-col truncate flex-1">
                        {audio.fileName}
                      </span>
                      <span className="text-xs text-muted-col">
                        {formatDuration(audio.duration)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Question Builder Page ───────────────────────────────────────────────────────────────────

function QuestionBuilderPage() {
  const search = useSearch({ from: "/admin/question-bank/question-builder" }) as {
    level?: string;
    lessonId?: string;
    editId?: string;
  };
  const navigate = useNavigate();

  const level = (search.level?.toUpperCase() || "N5") as JLPTLevel;
  const lessonId = parseInt(search.lessonId || "1");
  const editId = search.editId as string | undefined;

  // Get lesson data from service
  const lesson = questionBankService.getLesson(level, lessonId);
  const lessonName = lesson?.lessonName || `Lesson ${lessonId}`;

  // State
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    audio: true,
    content: true,
    answers: true,
    explanation: false,
  });

  // Load existing questions if editing
  useEffect(() => {
    if (editId) {
      const existing = questionBankService.getQuestion(editId);
      if (existing) {
        const editable: QuestionForm = {
          id: existing.id,
          type: existing.type,
          difficulty: existing.difficulty,
          questionText: existing.questionText,
          options: [...existing.options],
          correctIndex: existing.correctIndex,
          explanation: existing.explanation || "",
          audioUrl: isListeningQuestion(existing) ? existing.audio.audioUrl : "",
          audioFileName: isListeningQuestion(existing) ? existing.audio.audioFileName : "",
          audioDuration: isListeningQuestion(existing) ? existing.audio.audioDuration : 0,
        };
        setQuestions([editable]);
        setSelectedQuestionId(existing.id);
        return;
      }
    }

    const newQ = createEmptyQuestion();
    setQuestions([newQ]);
    setSelectedQuestionId(newQ.id);
  }, [level, lessonId, editId]);

  // Get current selected question
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || questions[0];

  // Update question
  const updateQuestion = (id: string, field: keyof QuestionForm, value: unknown) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  // Add new question
  const addQuestion = () => {
    const newQ = createEmptyQuestion();
    setQuestions((prev) => [...prev, newQ]);
    setSelectedQuestionId(newQ.id);
    setExpandedSections({
      info: true,
      audio: true,
      content: true,
      answers: true,
      explanation: false,
    });
  };

  // Remove question
  const removeQuestion = (id: string) => {
    if (questions.length === 1) return;
    const index = questions.findIndex((q) => q.id === id);
    const newQuestions = questions.filter((q) => q.id !== id);
    setQuestions(newQuestions);

    if (selectedQuestionId === id) {
      const newIndex = Math.min(index, newQuestions.length - 1);
      setSelectedQuestionId(newQuestions[newIndex]?.id || null);
    }
  };

  // Duplicate question
  const duplicateQuestion = (id: string) => {
    const original = questions.find((q) => q.id === id);
    if (!original) return;

    const duplicate: QuestionForm = {
      ...original,
      id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      questionText: "",
      audioUrl: "",
      audioFileName: "",
      audioDuration: 0,
    };

    const index = questions.findIndex((q) => q.id === id);
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicate);
    setQuestions(newQuestions);
    setSelectedQuestionId(duplicate.id);
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Save all questions using service
  const saveAllQuestions = async () => {
    const completeQuestions = questions.filter(isQuestionComplete);
    if (completeQuestions.length === 0) {
      alert("Please complete at least one question before saving.");
      return;
    }

    // Validate listening questions have audio
    for (const q of completeQuestions) {
      if (q.type === "Listening" && !q.audioUrl) {
        alert(
          "Listening questions require an audio file. Please upload audio for all incomplete listening questions.",
        );
        return;
      }
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    completeQuestions.forEach((q) => {
      if (q.type === "Listening") {
        if (q.id.startsWith("temp_")) {
          questionBankService.createQuestion(level, lessonId, {
            type: q.type,
            difficulty: q.difficulty,
            questionText: q.questionText,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            audio: {
              audioUrl: q.audioUrl,
              audioFileName: q.audioFileName,
              audioDuration: q.audioDuration,
            },
          });
        } else {
          questionBankService.updateQuestion(q.id, {
            type: q.type,
            difficulty: q.difficulty,
            questionText: q.questionText,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            audio: {
              audioUrl: q.audioUrl,
              audioFileName: q.audioFileName,
              audioDuration: q.audioDuration,
            },
          });
        }
      } else {
        if (q.id.startsWith("temp_")) {
          questionBankService.createQuestion(level, lessonId, {
            type: q.type,
            difficulty: q.difficulty,
            questionText: q.questionText,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          });
        } else {
          questionBankService.updateQuestion(q.id, {
            type: q.type,
            difficulty: q.difficulty,
            questionText: q.questionText,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          });
        }
      }
    });

    setSavedCount(completeQuestions.length);
    setShowSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
      navigate({
        to: `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`,
      });
    }, 1500);
  };

  const completeCount = questions.filter(isQuestionComplete).length;
  const incompleteCount = questions.length - completeCount;

  const getTypeColor = (type: QuestionType) => {
    switch (type) {
      case "Vocabulary":
        return "bg-blue-500/12 text-blue-600 border-blue-500/20";
      case "Grammar":
        return "bg-purple-500/12 text-purple-600 border-purple-500/20";
      case "Reading":
        return "bg-orange-500/12 text-orange-600 border-orange-500/20";
      case "Listening":
        return "bg-pink-500/12 text-pink-600 border-pink-500/20";
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case "Easy":
        return "bg-green-500/12 text-green-600 border-green-500/20";
      case "Medium":
        return "bg-yellow-500/12 text-yellow-600 border-yellow-500/20";
      case "Hard":
        return "bg-red-500/12 text-red-600 border-red-500/20";
    }
  };

  const isListening = selectedQuestion?.type === "Listening";

  return (
    <div className="space-y-5">
      {/* Sticky Header with Breadcrumb */}
      <QuestionBankStickyHeader
        backHref="/admin/question-bank/lesson-detail"
        backLabel="Back"
        level={level}
        lessonId={lessonId}
        breadcrumbs={[
          { label: "Question Bank", href: "/admin/question-bank" },
          { label: level, href: `/admin/question-bank/${level.toLowerCase()}` },
          {
            label: lessonName,
            href: `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`,
          },
          { label: "Question Builder" },
        ]}
        title="Question Builder"
        subtitle={`${lessonName} - ${level}`}
        actionButtons={
          <>
            {completeCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/12 text-green-600 text-sm font-medium">
                <Check className="w-4 h-4" />
                {completeCount} Complete
              </span>
            )}
            {incompleteCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/12 text-yellow-600 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                {incompleteCount} Incomplete
              </span>
            )}
          </>
        }
      />

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl bg-green-500 text-white font-bold shadow-lg flex items-center gap-3"
          >
            <Check className="w-5 h-5" />
            Saved {savedCount} question{savedCount !== 1 ? "s" : ""} successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left Panel - Questions List (25%) */}
        <div className="col-span-12 lg:col-span-3">
          <div className="card-base overflow-hidden sticky top-4">
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-[var(--border)] bg-muted/30">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-primary-col text-sm">Questions</h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/12 text-primary text-xs font-medium">
                  {questions.length}
                </span>
              </div>
            </div>

            {/* Questions List */}
            <div className="max-h-[calc(100vh-22rem)] overflow-y-auto p-2 space-y-1">
              {questions.map((q, index) => {
                const isComplete = isQuestionComplete(q);
                const isSelected = q.id === selectedQuestionId;

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestionId(q.id)}
                    className={`
                      p-3 rounded-xl cursor-pointer transition-all
                      ${
                        isSelected
                          ? "bg-primary/12 border border-primary/30 shadow-sm"
                          : "border border-transparent hover:bg-muted/50"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isComplete ? "bg-green-500/20" : "bg-yellow-500/20"
                          }`}
                        >
                          {isComplete ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Circle className="w-3 h-3 text-yellow-600" />
                          )}
                        </div>
                        <span className="font-medium text-xs text-primary-col truncate">
                          Q{index + 1}
                        </span>
                        {q.type === "Listening" && q.audioUrl && (
                          <Music className="w-3 h-3 text-pink-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateQuestion(q.id);
                          }}
                          className="p-1 rounded hover:bg-[var(--accent)] text-muted-col hover:text-primary transition"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestion(q.id);
                          }}
                          disabled={questions.length === 1}
                          className="p-1 rounded hover:bg-red-500/10 text-muted-col hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p
                      className={`mt-1.5 text-[11px] line-clamp-2 ml-7 ${q.questionText ? "text-muted-col" : "text-muted-foreground/50 italic"}`}
                    >
                      {q.questionText || "No question text..."}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 ml-7">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getTypeColor(q.type)}`}
                      >
                        {q.type}
                      </span>
                      {q.type === "Listening" && !q.audioUrl && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/12 text-red-600 border border-red-500/20">
                          No Audio
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Question Button */}
            <div className="p-2 border-t border-[var(--border)]">
              <button
                onClick={addQuestion}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-primary/40 text-muted-col hover:text-primary transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Question Editor (75%) */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {selectedQuestion ? (
            <div className="card-base overflow-hidden">
              {/* Question Info Section */}
              <div className="border-b border-[var(--border)]">
                <button
                  onClick={() => toggleSection("info")}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm text-primary-col">
                      Question Information
                    </span>
                  </div>
                  {expandedSections.info ? (
                    <ChevronUp className="w-4 h-4 text-muted-col" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-col" />
                  )}
                </button>
                {expandedSections.info && (
                  <div className="px-5 pb-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
                          Question Type
                        </label>
                        <select
                          value={selectedQuestion.type}
                          onChange={(e) =>
                            updateQuestion(
                              selectedQuestion.id,
                              "type",
                              e.target.value as QuestionType,
                            )
                          }
                          className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                        >
                          <option value="Vocabulary">Vocabulary</option>
                          <option value="Grammar">Grammar</option>
                          <option value="Reading">Reading</option>
                          <option value="Listening">Listening</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
                          Difficulty
                        </label>
                        <select
                          value={selectedQuestion.difficulty}
                          onChange={(e) =>
                            updateQuestion(
                              selectedQuestion.id,
                              "difficulty",
                              e.target.value as Difficulty,
                            )
                          }
                          className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Listening Audio Section - Only show for Listening type */}
              {isListening && (
                <div className="border-b border-[var(--border)]">
                  <button
                    onClick={() => toggleSection("audio")}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-pink-500" />
                      <span className="font-semibold text-sm text-primary-col">
                        Listening Audio
                      </span>
                      {!selectedQuestion.audioUrl && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/12 text-red-600 border border-red-500/20">
                          Required
                        </span>
                      )}
                    </div>
                    {expandedSections.audio ? (
                      <ChevronUp className="w-4 h-4 text-muted-col" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-col" />
                    )}
                  </button>
                  {expandedSections.audio && (
                    <div className="px-5 pb-4">
                      <AudioUploadSection
                        audioUrl={selectedQuestion.audioUrl}
                        audioFileName={selectedQuestion.audioFileName}
                        audioDuration={selectedQuestion.audioDuration}
                        onUpload={(url, fileName, duration) => {
                          updateQuestion(selectedQuestion.id, "audioUrl", url);
                          updateQuestion(selectedQuestion.id, "audioFileName", fileName);
                          updateQuestion(selectedQuestion.id, "audioDuration", duration);
                        }}
                        onRemove={() => {
                          updateQuestion(selectedQuestion.id, "audioUrl", "");
                          updateQuestion(selectedQuestion.id, "audioFileName", "");
                          updateQuestion(selectedQuestion.id, "audioDuration", 0);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Question Content Section */}
              <div className="border-b border-[var(--border)]">
                <button
                  onClick={() => toggleSection("content")}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm text-primary-col">Question Content</span>
                    {isListening && (
                      <span className="text-xs text-muted-col">(Transcript or instruction)</span>
                    )}
                  </div>
                  {expandedSections.content ? (
                    <ChevronUp className="w-4 h-4 text-muted-col" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-col" />
                  )}
                </button>
                {expandedSections.content && (
                  <div className="px-5 pb-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
                        {isListening ? "Instructions" : "Question Text"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={selectedQuestion.questionText}
                        onChange={(e) =>
                          updateQuestion(selectedQuestion.id, "questionText", e.target.value)
                        }
                        placeholder={
                          isListening
                            ? "e.g., Listen to the dialogue and select the correct response..."
                            : "Enter your question here..."
                        }
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Answer Options Section */}
              <div className="border-b border-[var(--border)]">
                <button
                  onClick={() => toggleSection("answers")}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm text-primary-col">Answer Options</span>
                    <span className="text-xs text-muted-col">(Select the correct answer)</span>
                  </div>
                  {expandedSections.answers ? (
                    <ChevronUp className="w-4 h-4 text-muted-col" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-col" />
                  )}
                </button>
                {expandedSections.answers && (
                  <div className="px-5 pb-4 space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuestion(selectedQuestion.id, "correctIndex", i)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition ${
                            selectedQuestion.correctIndex === i
                              ? "bg-primary text-white shadow-md"
                              : "bg-muted text-muted-foreground hover:bg-primary/10"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                        <input
                          type="text"
                          value={selectedQuestion.options[i]}
                          onChange={(e) => {
                            const newOpts = [...selectedQuestion.options];
                            newOpts[i] = e.target.value;
                            updateQuestion(selectedQuestion.id, "options", newOpts);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className="flex-1 px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                        />
                        {selectedQuestion.correctIndex === i && (
                          <Check className="w-5 h-5 text-green-500 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Explanation Section */}
              <div>
                <button
                  onClick={() => toggleSection("explanation")}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm text-primary-col">Explanation</span>
                    <span className="text-xs text-muted-col">(Optional)</span>
                  </div>
                  {expandedSections.explanation ? (
                    <ChevronUp className="w-4 h-4 text-muted-col" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-col" />
                  )}
                </button>
                {expandedSections.explanation && (
                  <div className="px-5 pb-4">
                    <textarea
                      value={selectedQuestion.explanation}
                      onChange={(e) =>
                        updateQuestion(selectedQuestion.id, "explanation", e.target.value)
                      }
                      placeholder="Explain the correct answer to help students understand..."
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card-base p-12 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-col">Select a question to edit</p>
              </div>
            </div>
          )}

          {/* Sticky Footer */}
          <div className="card-base p-4 flex items-center justify-between sticky bottom-4 shadow-lg border border-[var(--border)]">
            <div className="text-sm text-muted-col">
              {completeCount} of {questions.length} question{questions.length !== 1 ? "s" : ""}{" "}
              ready to save
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  navigate({
                    to: `/admin/question-bank/lesson-detail?level=${level.toLowerCase()}&lessonId=${lessonId}`,
                  })
                }
                className="px-4 py-2.5 rounded-xl bg-muted text-muted-col text-sm font-semibold hover:bg-muted/80 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveAllQuestions}
                disabled={isSubmitting || completeCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save {completeCount > 0 ? `All Questions (${completeCount})` : "Questions"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
