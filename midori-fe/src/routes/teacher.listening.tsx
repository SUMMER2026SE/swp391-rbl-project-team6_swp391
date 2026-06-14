import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload, Play, Pause, Plus, Search, Edit3, Trash2, Eye, Volume2,
  Headphones, Mic, Filter, ArrowUpDown, X, Clock, BarChart2, CheckCircle,
  ChevronDown, ChevronRight, MoreHorizontal, ArrowLeft,
  SkipBack, SkipForward, Rewind, FastForward, Repeat, Volume1,
  PlusCircle, Trash, Save, EyeOff, ChevronLeft, ChevronRight as ChevronRightIcon, FileText, Loader2, AlertCircle, List, Inbox
} from "lucide-react";

type ExerciseType = "Dictation" | "Blank Fill" | "Multiple Choice";
type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type ExerciseStatus = "draft" | "published" | "pending";

interface BlankWord {
  id: number;
  answer: string;
}

interface ListeningExercise {
  id: number;
  title: string;
  level: JLPTLevel;
  type: ExerciseType;
  status: ExerciseStatus;
  topic: string;
  audio: boolean;
  transcript: string;
  answerKey: string;
  description: string;
  duration: string;
  completions: number;
  accuracy: number;
  date: string;
}

interface FormErrors {
  title?: string;
  transcript?: string;
  topic?: string;
}

const initialExercises: ListeningExercise[] = [
  { id: 1, title: "Business Phone Manners", level: "N3", duration: "4:30", type: "Dictation", status: "published", topic: "Business", audio: true, transcript: "もしもし、ABC株式会社ですが、田中さんお願いします。\nはい、田中ですが。\nいつもお世話になっております。", answerKey: "もしもし|ABC株式会社|田中さん|お願いします|田中|お世話になっております", description: "Practice formal business phone etiquette in Japanese.", completions: 1204, accuracy: 72, date: "1 week ago" },
  { id: 2, title: "Job Interview — Self Introduction", level: "N2", duration: "6:15", type: "Multiple Choice", status: "published", topic: "Career", audio: true, transcript: "面接官: まず、自己紹介をお願いします。\n応募者: はい、田中太郎と申します...", answerKey: "選択肢1: 正しい|選択肢2: 正しくない|選択肢3: 不明", description: "Common self-introduction phrases for job interviews.", completions: 890, accuracy: 68, date: "2 weeks ago" },
  { id: 3, title: "Weather Report — Casual", level: "N5", duration: "2:45", type: "Dictation", status: "published", topic: "Daily Life", audio: true, transcript: "今日の天気は晴れです。\n明日は雨が降るかもしれません。", answerKey: "天気|晴れ|明日|雨|降る|かもしれない", description: "Simple weather-related vocabulary and sentences.", completions: 2340, accuracy: 85, date: "3 weeks ago" },
  { id: 4, title: "Restaurant Ordering", level: "N4", duration: "3:20", type: "Blank Fill", status: "pending", topic: "Food & Dining", audio: true, transcript: "店員: いらっしゃいませ。\n客: メニューをください。\n店員: ご注文はお決まりですか。", answerKey: "いらっしゃいませ|メニュー|ご注文|お決まり", description: "Practice ordering food at a Japanese restaurant.", completions: 0, accuracy: 0, date: "3 days ago" },
  { id: 5, title: "Train Announcement Practice", level: "N4", duration: "3:50", type: "Dictation", status: "published", topic: "Transportation", audio: true, transcript: "次は新宿駅です。\nお出口は右側です。\n降りる方はお間違いのないようご注意ください。", answerKey: "新宿駅|お出口|右側|ご注意", description: "Train station announcements commonly heard in Japan.", completions: 1560, accuracy: 79, date: "1 month ago" },
  { id: 6, title: "Doctor Visit — Symptoms", level: "N3", duration: "5:10", type: "Multiple Choice", status: "draft", topic: "Health", audio: false, transcript: "医者: どうされましたか。\n患者: 頭が痛いです。\n医者: 熱はありますか。", answerKey: "選択肢1: 正しい|選択肢2: 正しくない", description: "Vocabulary and phrases for visiting a doctor.", completions: 0, accuracy: 0, date: "Just now" },
  { id: 7, title: "At the Airport", level: "N3", duration: "4:00", type: "Dictation", status: "published", topic: "Travel", audio: true, transcript: "乘客: この荷物検査場はどちらですか。\n職員: あちらです。\n乘客: ありがとうございます。", answerKey: "荷物検査場|どちら|あちら|ありがとうございます", description: "Common airport phrases for travelers.", completions: 980, accuracy: 74, date: "2 weeks ago" },
  { id: 8, title: "Bank Transactions", level: "N2", duration: "5:30", type: "Blank Fill", status: "pending", topic: "Finance", audio: true, transcript: "銀行員: いらっしゃいませ。\n客: お金を下ろしたいです。\n銀行員: いくら下ろしますか。", answerKey: "いらっしゃいませ|下ろしたい|いくら", description: "Vocabulary for banking transactions in Japanese.", completions: 0, accuracy: 0, date: "1 week ago" },
  { id: 9, title: "Asking for Directions", level: "N5", duration: "2:00", type: "Dictation", status: "published", topic: "Daily Life", audio: true, transcript: "客: 駅はどこですか。\n地元: あそこです。\n客: ありがとう。", answerKey: "駅|哪里|あそこ|ありがとう", description: "Basic directional phrases for beginners.", completions: 3200, accuracy: 91, date: "3 weeks ago" },
  { id: 10, title: "Shopping Discounts", level: "N4", duration: "3:45", type: "Multiple Choice", status: "draft", topic: "Shopping", audio: true, transcript: "店員: 今月は割引中です。\n客: それはいいですね。", answerKey: "選択肢1: 正しい|選択肢2: 正しくない", description: "Common shopping expressions and discount phrases.", completions: 0, accuracy: 0, date: "4 days ago" },
];

const levelColors: Record<JLPTLevel, string> = {
  N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30",
  N4: "bg-green-50 text-green-500 dark:bg-green-950/30",
  N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  N1: "bg-red-50 text-red-500 dark:bg-red-950/30",
};

const statusColors: Record<ExerciseStatus, string> = {
  published: "bg-green-50 text-green-600 dark:bg-green-950/30",
  pending: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  draft: "bg-slate-50 text-slate-500 dark:bg-slate-800",
};

const typeColors: Record<ExerciseType, string> = {
  Dictation: "bg-purple-50 text-purple-500 dark:bg-purple-950/30",
  "Blank Fill": "bg-amber-50 text-amber-600 dark:bg-amber-950/30",
  "Multiple Choice": "bg-teal-50 text-teal-500 dark:bg-teal-950/30",
};

type ViewMode = "list" | "detail";

const ITEMS_PER_PAGE = 5;

function parseTime(timeStr: string) {
  const [m, s] = timeStr.split(":").map(Number);
  return m * 60 + (s || 0);
}

function generatePreview(text: string, blanks: BlankWord[]): string {
  if (!text) return "";
  let result = text;
  blanks.forEach(b => {
    result = result.replace(new RegExp(b.answer, "g"), "______");
  });
  return result;
}

function parseTranscriptToSegments(transcript: string): Array<{ id: number; start: string; end: string; text: string }> {
  if (!transcript.trim()) return [];
  const lines = transcript.split("\n").filter(line => line.trim());
  if (lines.length === 0) return [];
  const avgDuration = 270 / Math.max(lines.length, 1);
  return lines.map((text, index) => ({
    id: index + 1,
    start: formatTimeStatic(index * avgDuration),
    end: formatTimeStatic((index + 1) * avgDuration),
    text: text.trim(),
  }));
}

function formatTimeStatic(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getUniqueTopics(exercises: ListeningExercise[]): string[] {
  const topics = new Set<string>();
  exercises.forEach(e => {
    if (e.topic && e.topic.trim()) {
      topics.add(e.topic.trim());
    }
  });
  return Array.from(topics).sort();
}

export const Route = createFileRoute("/teacher/listening")({ component: ListeningPage });

function ListeningPage() {
  const [exercises, setExercises] = useState<ListeningExercise[]>(initialExercises);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All Types");
  const [selectedExercise, setSelectedExercise] = useState<ListeningExercise | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [volume, setVolume] = useState(80);
  const [segments, setSegments] = useState<Array<{ id: number; start: string; end: string; text: string }>>([]);
  const [blankMode, setBlankMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Error states
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New exercise form state
  const [newTitle, setNewTitle] = useState("");
  const [newLevel, setNewLevel] = useState<JLPTLevel>("N5");
  const [newType, setNewType] = useState<ExerciseType>("Dictation");
  const [newTopic, setNewTopic] = useState("");
  const [newTopicCustom, setNewTopicCustom] = useState("");
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [newTranscript, setNewTranscript] = useState("");
  const [newAnswerKey, setNewAnswerKey] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<ExerciseStatus>("draft");
  const [newAudio, setNewAudio] = useState(false);
  const [blankWords, setBlankWords] = useState<BlankWord[]>([]);
  const [previewText, setPreviewText] = useState("");
  const [blankWordInput, setBlankWordInput] = useState("");

  // Edit form state
  const [editFormTitle, setEditFormTitle] = useState("");
  const [editFormLevel, setEditFormLevel] = useState<JLPTLevel>("N3");
  const [editFormType, setEditFormType] = useState<ExerciseType>("Dictation");
  const [editFormTopic, setEditFormTopic] = useState("");
  const [editFormTopicCustom, setEditFormTopicCustom] = useState("");
  const [showEditTopicDropdown, setShowEditTopicDropdown] = useState(false);
  const [editFormTranscript, setEditFormTranscript] = useState("");
  const [editFormAnswerKey, setEditFormAnswerKey] = useState("");
  const [editFormDescription, setEditFormDescription] = useState("");
  const [editFormStatus, setEditFormStatus] = useState<ExerciseStatus>("draft");
  const [editFormAudio, setEditFormAudio] = useState(false);
  const [editBlankWords, setEditBlankWords] = useState<BlankWord[]>([]);
  const [editPreviewText, setEditPreviewText] = useState("");
  const [editBlankWordInput, setEditBlankWordInput] = useState("");

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blankWordInputRef = useRef<HTMLInputElement>(null!);
  const editBlankWordInputRef = useRef<HTMLInputElement>(null!);

  const uniqueTopics = getUniqueTopics(exercises);

  // Show success message with auto-dismiss
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Clear errors with auto-dismiss
  const clearCreateErrors = useCallback(() => {
    setTimeout(() => setCreateErrors({}), 5000);
  }, []);

  const clearEditErrors = useCallback(() => {
    setTimeout(() => setEditErrors({}), 5000);
  }, []);

  // Clear delete error
  useEffect(() => {
    if (deleteError) {
      const timer = setTimeout(() => setDeleteError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteError]);

  // Audio progress simulation
  useEffect(() => {
    if (isPlaying) {
      const totalDuration = 270;
      progressRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + playbackSpeed;
          if (next >= totalDuration) {
            if (isLooping && loopStart !== null && loopEnd !== null) return loopStart;
            setIsPlaying(false);
            return 0;
          }
          if (isLooping && loopEnd !== null && next >= loopEnd) return loopStart ?? 0;
          return next;
        });
      }, 1000);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
    }
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [isPlaying, playbackSpeed, isLooping, loopStart, loopEnd]);

  // Update preview when transcript or blank words change (Create)
  useEffect(() => {
    if (newType === "Blank Fill" && newTranscript) {
      setPreviewText(generatePreview(newTranscript, blankWords));
    } else {
      setPreviewText("");
    }
  }, [newTranscript, blankWords, newType]);

  // Update preview when transcript or blank words change (Edit)
  useEffect(() => {
    if (editFormType === "Blank Fill" && editFormTranscript) {
      setEditPreviewText(generatePreview(editFormTranscript, editBlankWords));
    } else {
      setEditPreviewText("");
    }
  }, [editFormTranscript, editBlankWords, editFormType]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const openDetail = (exercise: ListeningExercise) => {
    setSelectedExercise(exercise);
    setViewMode("detail");
    setIsEditing(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setBlankMode(false);
    setSegments(parseTranscriptToSegments(exercise.transcript));
  };

  const filtered = exercises.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.topic.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "All" || e.level === levelFilter;
    const matchType = typeFilter === "All Types" || e.type === typeFilter;
    return matchSearch && matchLevel && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const resetNewForm = () => {
    setNewTitle(""); setNewLevel("N5"); setNewType("Dictation"); setNewTopic("");
    setNewTopicCustom(""); setNewTranscript(""); setNewAnswerKey(""); setNewDescription("");
    setNewStatus("draft"); setNewAudio(false); setBlankWords([]); setPreviewText("");
    setBlankWordInput(""); setCreateErrors({});
  };

  const validateCreateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!newTitle.trim()) {
      errors.title = "Title is required";
    } else if (newTitle.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }
    if (!newTranscript.trim() && newType === "Dictation") {
      errors.transcript = "Transcript is required for Dictation exercises";
    }
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: FormErrors = {};
    if (!editFormTitle.trim()) {
      errors.title = "Title is required";
    } else if (editFormTitle.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }
    if (!editFormTranscript.trim() && editFormType === "Dictation") {
      errors.transcript = "Transcript is required for Dictation exercises";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateExercise = async () => {
    if (!validateCreateForm()) {
      clearCreateErrors();
      return;
    }
    setIsCreating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    const finalTopic = newTopic === "__custom__" ? newTopicCustom.trim() : newTopic;
    const newExercise: ListeningExercise = {
      id: Date.now(),
      title: newTitle.trim(),
      level: newLevel,
      type: newType,
      status: newStatus,
      topic: finalTopic,
      audio: newAudio,
      transcript: newTranscript,
      answerKey: newAnswerKey,
      description: newDescription,
      duration: "0:00",
      completions: 0,
      accuracy: 0,
      date: "Just now",
    };
    setExercises(prev => [newExercise, ...prev]);
    setShowNewModal(false);
    resetNewForm();
    setCurrentPage(1);
    setIsCreating(false);
    showSuccess("Exercise created successfully!");
  };

  const handleDeleteExercise = async (id: number) => {
    setIsDeleting(id);
    setDeleteError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setExercises(prev => prev.filter(e => e.id !== id));
      if (selectedExercise?.id === id) {
        setSelectedExercise(null);
        setViewMode("list");
      }
      showSuccess("Exercise deleted successfully");
    } catch {
      setDeleteError("Failed to delete exercise. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditModal = (exercise: ListeningExercise) => {
    setEditFormTitle(exercise.title);
    setEditFormLevel(exercise.level);
    setEditFormType(exercise.type);
    setEditFormTopic(exercise.topic || "");
    setEditFormTopicCustom("");
    setEditFormTranscript(exercise.transcript);
    setEditFormAnswerKey(exercise.answerKey);
    setEditFormDescription(exercise.description);
    setEditFormStatus(exercise.status);
    setEditFormAudio(exercise.audio);
    setEditBlankWords([]);
    setEditPreviewText("");
    setEditBlankWordInput("");
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) {
      clearEditErrors();
      return;
    }
    if (!selectedExercise) return;
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      const finalTopic = editFormTopic === "__custom__" ? editFormTopicCustom.trim() : editFormTopic;
      const updated: ListeningExercise = {
        ...selectedExercise,
        title: editFormTitle.trim(),
        level: editFormLevel,
        type: editFormType,
        status: editFormStatus,
        topic: finalTopic,
        audio: editFormAudio,
        transcript: editFormTranscript,
        answerKey: editFormAnswerKey,
        description: editFormDescription,
      };
      setExercises(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedExercise(updated);
      setSegments(parseTranscriptToSegments(updated.transcript));
      setShowEditModal(false);
      showSuccess("Exercise updated successfully!");
    } catch {
      setEditErrors({ title: "Failed to save changes. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlankWord = (text: string, setter: (w: BlankWord[]) => void, blanks: BlankWord[]) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Check for duplicates
    if (blanks.some(b => b.answer === trimmed)) return;
    setter([...blanks, { id: Date.now(), answer: trimmed }]);
  };

  const handleRemoveBlankWord = (id: number, setter: (w: BlankWord[]) => void, blanks: BlankWord[]) => {
    setter(blanks.filter(b => b.id !== id));
  };

  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showTopicDropdown) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-topic-dropdown]')) {
          setShowTopicDropdown(false);
        }
      }
      if (showEditTopicDropdown) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-edit-topic-dropdown]')) {
          setShowEditTopicDropdown(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTopicDropdown, showEditTopicDropdown]);

  // Reset form when opening modal
  useEffect(() => {
    if (showNewModal) {
      resetNewForm();
    }
  }, [showNewModal]);

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS TOAST
  // ─────────────────────────────────────────────────────────────────────────
  const SuccessToast = () => {
    if (!successMessage) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-[100] bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
      >
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-semibold">{successMessage}</span>
      </motion.div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR MESSAGE COMPONENT
  // ─────────────────────────────────────────────────────────────────────────
  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{message}</span>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TOPIC SELECTOR COMPONENT
  // ─────────────────────────────────────────────────────────────────────────
  const TopicSelector = ({
    value,
    onChange,
    onCustomChange,
    customValue,
    showDropdown,
    onToggleDropdown,
    dataAttr,
    errors
  }: {
    value: string;
    onChange: (v: string) => void;
    onCustomChange: (v: string) => void;
    customValue: string;
    showDropdown: boolean;
    onToggleDropdown: () => void;
    dataAttr: string;
    errors?: FormErrors;
  }) => (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Topic / Category</label>
      <div className="relative" data-topic-dropdown={dataAttr}>
        <div
          className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border ${
            errors?.topic ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
          } text-sm outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer flex items-center justify-between`}
          onClick={onToggleDropdown}
        >
          <span className={value ? "text-slate-700 dark:text-slate-200" : "text-muted-foreground"}>
            {value === "__custom__" ? (customValue || "Custom topic...") : (value || "Select a topic...")}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </div>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg max-h-48 overflow-y-auto"
          >
            {uniqueTopics.length > 0 ? (
              <>
                {uniqueTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => { onChange(topic); onToggleDropdown(); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition ${
                      value === topic ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              </>
            ) : (
              <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                No existing topics
              </div>
            )}
            <button
              onClick={() => { onChange("__custom__"); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition ${
                value === "__custom__" ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              + Add custom topic
            </button>
          </motion.div>
        )}
      </div>
      {value === "__custom__" && (
        <input
          value={customValue}
          onChange={e => onCustomChange(e.target.value)}
          placeholder="Enter custom topic..."
          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 mt-2"
        />
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // BLANK WORD EDITOR COMPONENT
  // ─────────────────────────────────────────────────────────────────────────
  const BlankWordEditor = ({
    blankWords,
    setBlankWords,
    preview,
    inputRef,
    inputValue,
    setInputValue,
    type
  }: {
    blankWords: BlankWord[];
    setBlankWords: (w: BlankWord[]) => void;
    preview: string;
    inputRef: React.RefObject<HTMLInputElement>;
    inputValue: string;
    setInputValue: (v: string) => void;
    type: "new" | "edit";
  }) => (
    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/30 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <EyeOff className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">Blank Fill Configuration</span>
      </div>
      <p className="text-xs text-amber-600 dark:text-amber-300">Add words/phrases to hide in the exercise. These will appear as blanks for students.</p>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddBlankWord(inputValue, setBlankWords, blankWords);
              setInputValue("");
            }
          }}
          placeholder="Type a word/phrase to hide..."
          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-sm outline-none focus:ring-2 focus:ring-amber-400/40"
        />
        <button
          onClick={() => {
            handleAddBlankWord(inputValue, setBlankWords, blankWords);
            setInputValue("");
            inputRef.current?.focus();
          }}
          className="px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition"
        >
          Add
        </button>
      </div>

      {blankWords.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] text-amber-500 font-semibold">{blankWords.length} word(s) configured</p>
          {blankWords.map(b => (
            <div key={b.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-3 py-2">
              <EyeOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{b.answer}</span>
              <span className="text-[10px] text-muted-foreground">→ _____</span>
              <button
                onClick={() => handleRemoveBlankWord(b.id, setBlankWords, blankWords)}
                className="p-1 rounded-lg hover:bg-red-50 text-red-400 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">No blank words added yet</p>
        </div>
      )}

      {preview && (
        <div>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5">Preview:</p>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-amber-200 dark:border-amber-700">
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{preview}</p>
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // NEW EXERCISE MODAL
  // ─────────────────────────────────────────────────────────────────────────
  const renderNewExerciseModal = () => {
    if (!showNewModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between rounded-t-3xl">
            <div>
              <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">New Exercise</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Create a new listening exercise for students</p>
            </div>
            <button onClick={() => setShowNewModal(false)} className="p-2 rounded-xl hover:bg-muted transition">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Exercise Title */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Exercise Title *</label>
              <input
                value={newTitle}
                onChange={e => {
                  setNewTitle(e.target.value);
                  if (createErrors.title) setCreateErrors(prev => ({ ...prev, title: undefined }));
                }}
                placeholder="e.g. Business Phone Manners"
                className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border ${
                  createErrors.title ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 dark:border-slate-600 focus:ring-primary/40'
                } text-sm outline-none focus:ring-2 transition`}
              />
              <ErrorMessage message={createErrors.title} />
            </div>

            {/* JLPT Level + Exercise Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">JLPT Level</label>
                <div className="flex gap-1 flex-wrap">
                  {(["N5", "N4", "N3", "N2", "N1"] as JLPTLevel[]).map(l => (
                    <button key={l} onClick={() => setNewLevel(l)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${newLevel === l ? "bg-gradient-hero text-white shadow" : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Exercise Type</label>
                <div className="flex flex-wrap gap-1">
                  {(["Dictation", "Blank Fill", "Multiple Choice"] as ExerciseType[]).map(t => (
                    <button key={t} onClick={() => setNewType(t)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${newType === t ? "bg-gradient-hero text-white shadow" : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic / Category */}
            <TopicSelector
              value={newTopic}
              onChange={setNewTopic}
              onCustomChange={setNewTopicCustom}
              customValue={newTopicCustom}
              showDropdown={showTopicDropdown}
              onToggleDropdown={() => setShowTopicDropdown(!showTopicDropdown)}
              dataAttr="new-topic"
              errors={createErrors}
            />

            {/* Audio Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Audio Upload</label>
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${newAudio ? "border-green-400 bg-green-50/50 dark:bg-green-950/20" : "border-slate-200 dark:border-slate-600 hover:border-primary/40"}`}
                onClick={() => setNewAudio(v => !v)}>
                <Upload className={`w-6 h-6 mx-auto mb-1.5 ${newAudio ? "text-green-500" : "text-muted-foreground"}`} />
                <p className={`text-sm font-semibold ${newAudio ? "text-green-600" : "text-muted-foreground"}`}>
                  {newAudio ? "Audio file attached" : "Click to attach audio file"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">MP3, WAV, M4A — max 50MB</p>
              </div>
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Transcript
                {newType === "Blank Fill" && <span className="text-amber-500 ml-1">(used for blank fill preview)</span>}
                {newType === "Dictation" && <span className="text-red-400 ml-1">*</span>}
              </label>
              <textarea
                value={newTranscript}
                onChange={e => {
                  setNewTranscript(e.target.value);
                  if (createErrors.transcript) setCreateErrors(prev => ({ ...prev, transcript: undefined }));
                }}
                rows={5}
                placeholder="Paste the full transcript here...&#10;&#10;各行がセグメントになります。"
                className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border ${
                  createErrors.transcript ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 dark:border-slate-600 focus:ring-primary/40'
                } text-sm outline-none focus:ring-2 resize-y transition`}
              />
              <ErrorMessage message={createErrors.transcript} />
            </div>

            {/* Blank Fill Mode */}
            {newType === "Blank Fill" && (
              <BlankWordEditor
                blankWords={blankWords}
                setBlankWords={setBlankWords}
                preview={previewText}
                inputRef={blankWordInputRef}
                inputValue={blankWordInput}
                setInputValue={setBlankWordInput}
                type="new"
              />
            )}

            {/* Answer Key */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Answer Key</label>
              <textarea
                value={newAnswerKey}
                onChange={e => setNewAnswerKey(e.target.value)}
                rows={3}
                placeholder="Enter correct answers separated by pipe | for Dictation&#10;e.g. こんにちは|ABC株式会社|田中さん"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Description</label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of this exercise for students..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
              <div className="flex gap-2">
                {(["draft", "published"] as ExerciseStatus[]).map(s => (
                  <button key={s} onClick={() => setNewStatus(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                      newStatus === s
                        ? s === "published" ? "bg-green-500 text-white shadow" : "bg-gradient-hero text-white shadow"
                        : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3 rounded-b-3xl">
            <button
              onClick={() => setShowNewModal(false)}
              disabled={isCreating}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateExercise}
              disabled={isCreating || !newTitle.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create Exercise
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EDIT EXERCISE MODAL
  // ─────────────────────────────────────────────────────────────────────────
  const renderEditExerciseModal = () => {
    if (!showEditModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !isSaving && setShowEditModal(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between rounded-t-3xl">
            <div>
              <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">Edit Exercise</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Update exercise details and content</p>
            </div>
            <button onClick={() => !isSaving && setShowEditModal(false)} className="p-2 rounded-xl hover:bg-muted transition" disabled={isSaving}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Exercise Title *</label>
              <input
                value={editFormTitle}
                onChange={e => {
                  setEditFormTitle(e.target.value);
                  if (editErrors.title) setEditErrors(prev => ({ ...prev, title: undefined }));
                }}
                className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border ${
                  editErrors.title ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 dark:border-slate-600 focus:ring-primary/40'
                } text-sm outline-none focus:ring-2 transition`}
              />
              <ErrorMessage message={editErrors.title} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">JLPT Level</label>
                <div className="flex gap-1 flex-wrap">
                  {(["N5", "N4", "N3", "N2", "N1"] as JLPTLevel[]).map(l => (
                    <button key={l} onClick={() => setEditFormLevel(l)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${editFormLevel === l ? "bg-gradient-hero text-white shadow" : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Exercise Type</label>
                <div className="flex flex-wrap gap-1">
                  {(["Dictation", "Blank Fill", "Multiple Choice"] as ExerciseType[]).map(t => (
                    <button key={t} onClick={() => setEditFormType(t)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${editFormType === t ? "bg-gradient-hero text-white shadow" : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic */}
            <TopicSelector
              value={editFormTopic}
              onChange={setEditFormTopic}
              onCustomChange={setEditFormTopicCustom}
              customValue={editFormTopicCustom}
              showDropdown={showEditTopicDropdown}
              onToggleDropdown={() => setShowEditTopicDropdown(!showEditTopicDropdown)}
              dataAttr="edit-topic"
              errors={editErrors}
            />

            {/* Audio Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Audio Upload</label>
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${editFormAudio ? "border-green-400 bg-green-50/50 dark:bg-green-950/20" : "border-slate-200 dark:border-slate-600 hover:border-primary/40"}`}
                onClick={() => setEditFormAudio(v => !v)}>
                <Upload className={`w-6 h-6 mx-auto mb-1.5 ${editFormAudio ? "text-green-500" : "text-muted-foreground"}`} />
                <p className={`text-sm font-semibold ${editFormAudio ? "text-green-600" : "text-muted-foreground"}`}>
                  {editFormAudio ? "Audio file attached" : "Click to attach audio file"}
                </p>
              </div>
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Transcript
                {editFormType === "Dictation" && <span className="text-red-400 ml-1">*</span>}
              </label>
              <textarea
                value={editFormTranscript}
                onChange={e => {
                  setEditFormTranscript(e.target.value);
                  if (editErrors.transcript) setEditErrors(prev => ({ ...prev, transcript: undefined }));
                }}
                rows={5}
                className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border ${
                  editErrors.transcript ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 dark:border-slate-600 focus:ring-primary/40'
                } text-sm outline-none focus:ring-2 resize-y transition`}
              />
              <ErrorMessage message={editErrors.transcript} />
            </div>

            {/* Blank Fill Mode */}
            {editFormType === "Blank Fill" && (
              <BlankWordEditor
                blankWords={editBlankWords}
                setBlankWords={setEditBlankWords}
                preview={editPreviewText}
                inputRef={editBlankWordInputRef}
                inputValue={editBlankWordInput}
                setInputValue={setEditBlankWordInput}
                type="edit"
              />
            )}

            {/* Answer Key */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Answer Key</label>
              <textarea
                value={editFormAnswerKey}
                onChange={e => setEditFormAnswerKey(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Description</label>
              <textarea
                value={editFormDescription}
                onChange={e => setEditFormDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
              <div className="flex gap-2">
                {(["draft", "published"] as ExerciseStatus[]).map(s => (
                  <button key={s} onClick={() => setEditFormStatus(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                      editFormStatus === s
                        ? s === "published" ? "bg-green-500 text-white shadow" : "bg-gradient-hero text-white shadow"
                        : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3 rounded-b-3xl">
            <button
              onClick={() => setShowEditModal(false)}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving || !editFormTitle.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EMPTY STATE COMPONENTS
  // ─────────────────────────────────────────────────────────────────────────
  const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    actionLabel
  }: {
    icon: typeof Headphones;
    title: string;
    description: string;
    action?: () => void;
    actionLabel?: string;
  }) => (
    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground opacity-40" />
      </div>
      <p className="text-base font-bold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4 inline mr-1" /> {actionLabel}
        </button>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE CONFIRMATION
  // ─────────────────────────────────────────────────────────────────────────
  const DeleteConfirmation = ({ id, onConfirm, onCancel }: { id: number; onConfirm: () => void; onCancel: () => void }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 rounded-2xl flex flex-col items-center justify-center z-10 backdrop-blur-sm"
    >
      <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Delete this exercise?</p>
      <p className="text-xs text-muted-foreground mb-4">This action cannot be undone.</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={isDeleting === id} className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1">
          {isDeleting === id && <Loader2 className="w-3 h-3 animate-spin" />}
          Delete
        </button>
      </div>
    </motion.div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className="space-y-5">
        <SuccessToast />
        {renderNewExerciseModal()}
        {renderEditExerciseModal()}

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-display font-black">Listening Management</h1>
              <span
                data-testid="teacher-listening-demo-badge"
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-sm"
                title="This module is currently using demo data. Created exercises are not saved after refresh."
              >
                Demo
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Upload audio, create dictation exercises, and preview playback.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 max-w-2xl">
              Demo mode: this module uses sample data only. New, edited, or deleted
              exercises are kept in memory and will be lost after refresh — they are
              not sent to a backend yet.
            </p>
          </div>
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> New Exercise
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Exercises", value: exercises.length.toString(), icon: Headphones, color: "bg-blue-50 text-blue-500" },
            { label: "With Audio", value: exercises.filter(e => e.audio).length.toString(), icon: Volume2, color: "bg-green-50 text-green-500" },
            { label: "Avg. Accuracy", value: exercises.filter(e => e.accuracy > 0).length > 0 ? `${Math.round(exercises.filter(e => e.accuracy > 0).reduce((acc, e) => acc + e.accuracy, 0) / exercises.filter(e => e.accuracy > 0).length)}%` : "—", icon: CheckCircle, color: "bg-purple-50 text-purple-500" },
            { label: "Total Plays", value: exercises.reduce((acc, e) => acc + e.completions, 0).toLocaleString(), icon: Play, color: "bg-orange-50 text-orange-500" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-black text-xl">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-64 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search exercises..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {["All", "N5", "N4", "N3", "N2", "N1"].map(l => (
              <button key={l} onClick={() => { setLevelFilter(l); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${levelFilter === l ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"}`}>
                {l}
              </button>
            ))}
          </div>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none">
            {["All Types", "Dictation", "Blank Fill", "Multiple Choice"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Exercise list */}
        <div className="space-y-3">
          {paged.length === 0 ? (
            <EmptyState
              icon={Headphones}
              title={search || levelFilter !== "All" || typeFilter !== "All Types" ? "No matching exercises" : "No exercises yet"}
              description={
                search || levelFilter !== "All" || typeFilter !== "All Types"
                  ? "Try adjusting your search or filters"
                  : "Create your first listening exercise to get started"
              }
              action={search || levelFilter !== "All" || typeFilter !== "All Types" ? undefined : () => setShowNewModal(true)}
              actionLabel={search || levelFilter !== "All" || typeFilter !== "All Types" ? undefined : "New Exercise"}
            />
          ) : (
            paged.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer relative"
                onClick={() => openDetail(ex)}
              >
                {/* Delete Confirmation Overlay */}
                {isDeleting === ex.id && (
                  <DeleteConfirmation
                    id={ex.id}
                    onConfirm={() => handleDeleteExercise(ex.id)}
                    onCancel={() => setIsDeleting(null)}
                  />
                )}

                <div className="flex items-center gap-4">
                  {/* Play button */}
                  <button
                    onClick={e => { e.stopPropagation(); openDetail(ex); setIsPlaying(p => !p); }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition shadow-lg ${
                      isPlaying ? "bg-gradient-hero text-white" : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-bold text-sm">{ex.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${levelColors[ex.level]}`}>{ex.level}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeColors[ex.type]}`}>{ex.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[ex.status]}`}>{ex.status}</span>
                    </div>

                    {/* Waveform */}
                    <div className="flex items-center gap-0.5 h-7 mb-1.5">
                      {Array.from({ length: 40 }).map((_, wi) => (
                        <div
                          key={wi}
                          className={`flex-1 rounded-full transition-all ${isPlaying ? "bg-gradient-hero" : "bg-slate-200 dark:bg-slate-600"}`}
                          style={{
                            height: `${Math.random() * 100}%`,
                            minHeight: "3px",
                            opacity: wi / 40 > 0.5 ? 1 : 0.3
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ex.duration}</span>
                      {ex.audio ? (
                        <span className="flex items-center gap-1 text-green-500"><Volume2 className="w-3 h-3" /> Audio</span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400"><Volume2 className="w-3 h-3" /> No Audio</span>
                      )}
                      {ex.transcript ? (
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Transcript</span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400"><FileText className="w-3 h-3" /> No Transcript</span>
                      )}
                      {ex.topic ? (
                        <span className="flex items-center gap-1"><Headphones className="w-3 h-3" /> {ex.topic}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400"><List className="w-3 h-3" /> No Topic</span>
                      )}
                      {ex.completions > 0 && <span>{ex.completions.toLocaleString()} plays</span>}
                      {ex.accuracy > 0 && <span className="text-green-500 font-bold">{ex.accuracy}% accuracy</span>}
                      <span>{ex.date}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(ex)}
                      disabled={isDeleting !== null}
                      className="p-2 rounded-xl hover:bg-blue-50 text-blue-500 transition disabled:opacity-50"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(ex.id)}
                      disabled={isDeleting !== null}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-muted-foreground pl-1">
              Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-2 rounded-xl hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                    page === safePage
                      ? "bg-gradient-hero text-white shadow"
                      : "hover:bg-muted text-muted-foreground"
                  }`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-2 rounded-xl hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === "detail" && selectedExercise) {
    const progress = (currentTime / 270) * 100;

    return (
      <div className="space-y-5">
        <SuccessToast />
        {renderEditExerciseModal()}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setViewMode("list"); setIsPlaying(false); setCurrentTime(0); }}
              className="p-2 rounded-xl hover:bg-muted transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-black">Listening Exercise</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Preview and edit your listening content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openEditModal(selectedExercise)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition">
              <Edit3 className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => setIsDeleting(selectedExercise.id)}
              disabled={isDeleting !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-400 text-sm font-bold hover:bg-red-100 transition disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {isDeleting === selectedExercise.id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full"
            >
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Exercise?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you sure you want to delete "{selectedExercise.title}"? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setIsDeleting(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(selectedExercise.id)}
                    disabled={isDeleting !== null}
                    className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting !== null && <Loader2 className="w-4 h-4 animate-spin" />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Title + Meta */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display font-bold text-xl">{selectedExercise.title}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${levelColors[selectedExercise.level]}`}>{selectedExercise.level}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeColors[selectedExercise.type]}`}>{selectedExercise.type}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[selectedExercise.status]}`}>{selectedExercise.status}</span>
            {selectedExercise.topic ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-muted-foreground">{selectedExercise.topic}</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-400">No Topic</span>
            )}
          </div>
          {selectedExercise.description ? (
            <p className="text-sm text-muted-foreground mt-2">{selectedExercise.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2 italic">No description provided</p>
          )}
        </div>

        {/* Audio Player */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6">
            {/* Waveform */}
            <div className="mb-4">
              <div className="flex items-center gap-0.5 h-20 mb-1">
                {Array.from({ length: 60 }).map((_, wi) => {
                  const isActive = (wi / 60) * 100 <= progress;
                  const height = 20 + Math.sin(wi * 0.5) * 30 + Math.random() * 20;
                  return (
                    <div key={wi}
                      className={`flex-1 rounded-full transition-all ${isActive ? "bg-gradient-hero" : "bg-slate-200 dark:bg-slate-600"}`}
                      style={{ height: `${height}%`, minHeight: "4px" }}
                    />
                  );
                })}
              </div>
              <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative -mt-14 mb-2 cursor-pointer">
                <motion.div className="h-full bg-gradient-hero rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{selectedExercise.duration}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentTime(Math.max(0, currentTime - 10))} className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition"><Rewind className="w-4 h-4" /></button>
                <button onClick={() => setCurrentTime(Math.max(0, currentTime - 5))} className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition"><SkipBack className="w-4 h-4" /></button>
                <button onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 rounded-full bg-gradient-hero text-white flex items-center justify-center shadow-lg hover:opacity-90 transition">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <button onClick={() => setCurrentTime(Math.min(270, currentTime + 5))} className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition"><SkipForward className="w-4 h-4" /></button>
                <button onClick={() => setCurrentTime(Math.min(270, currentTime + 10))} className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition"><FastForward className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Speed:</span>
                <div className="flex gap-1">
                  {[0.5, 0.75, 1, 1.25].map(speed => (
                    <button key={speed} onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${playbackSpeed === speed ? "bg-gradient-hero text-white" : "bg-white/50 dark:bg-white/10 hover:bg-white/70"}`}>
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsLooping(!isLooping)}
                  className={`p-2 rounded-xl transition ${isLooping ? "bg-primary text-white" : "hover:bg-white/50 dark:hover:bg-white/10"}`} title="Loop">
                  <Repeat className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted-foreground">Volume:</span>
                <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-20 accent-primary" />
                <Volume1 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Transcript Editor */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-display font-bold text-sm">Transcript Editor</h3>
                <button onClick={() => setBlankMode(!blankMode)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${blankMode ? "bg-amber-500 text-white" : "bg-amber-50 dark:bg-amber-950/30 text-amber-500"}`}>
                  <EyeOff className="w-3 h-3 inline mr-1" /> Blank Fill Mode
                </button>
              </div>
              {isEditing && (
                <button onClick={() => setSegments([...segments, { id: Date.now(), start: "0:00", end: "0:05", text: "" }])}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition">
                  <PlusCircle className="w-3.5 h-3.5" /> Add Segment
                </button>
              )}
            </div>
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {segments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">No transcript available</p>
                  <p className="text-xs text-muted-foreground mt-1">Edit this exercise to add a transcript</p>
                </div>
              ) : (
                segments.map((seg, i) => {
                  const segStart = parseTime(seg.start);
                  const segEnd = parseTime(seg.end);
                  const isActive = currentTime >= segStart && currentTime < segEnd;
                  let displayText = seg.text;
                  if (blankMode) {
                    const words = seg.text.split(/([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]|[a-zA-Z]+)/).filter(Boolean);
                    const blanks = words.map((w, wi) => {
                      if (wi % 3 === 0 && w.length > 1) return "_____";
                      return w;
                    });
                    displayText = blanks.join("");
                  }
                  return (
                    <motion.div key={seg.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`flex gap-2 p-3 rounded-xl transition ${isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}>
                      <div className="flex-shrink-0 text-center">
                        <div className="w-14 text-[10px] text-muted-foreground">{seg.start}</div>
                        <div className="w-14 text-[10px] text-muted-foreground">{seg.end}</div>
                      </div>
                      {isEditing ? (
                        <div className="flex-1 flex gap-2">
                          <input value={seg.start} onChange={e => { const ns = [...segments]; ns[i].start = e.target.value; setSegments(ns); }}
                            className="w-14 px-2 py-1 rounded bg-muted text-xs outline-none" />
                          <input value={seg.text} onChange={e => { const ns = [...segments]; ns[i].text = e.target.value; setSegments(ns); }}
                            className="flex-1 px-2 py-1 rounded bg-muted text-sm outline-none" placeholder="Transcript text..." />
                          <input value={seg.end} onChange={e => { const ns = [...segments]; ns[i].end = e.target.value; setSegments(ns); }}
                            className="w-14 px-2 py-1 rounded bg-muted text-xs outline-none" />
                          <button onClick={() => setSegments(segments.filter(s => s.id !== seg.id))}
                            className="p-1 rounded hover:bg-red-50 text-red-400 transition">
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <span className={`text-sm font-semibold ${blankMode ? "text-amber-500 font-bold" : "text-slate-700 dark:text-slate-200"}`}>
                            {displayText}
                          </span>
                          {isActive && <div className="w-2 h-2 rounded-full bg-primary inline-block ml-1 animate-pulse" />}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Stats + Preview */}
          <div className="space-y-4">
            {/* Engagement Stats */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-display font-bold text-sm mb-4">Student Engagement</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Plays", value: selectedExercise.completions > 0 ? selectedExercise.completions.toLocaleString() : "—", color: "text-blue-500" },
                  { label: "Accuracy", value: selectedExercise.accuracy > 0 ? `${selectedExercise.accuracy}%` : "—", color: "text-green-500" },
                  { label: "Duration", value: selectedExercise.duration, color: "text-purple-500" },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-3 rounded-xl bg-muted/50">
                    <div className={`font-display font-black text-lg ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
              {selectedExercise.accuracy > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Average Accuracy</span>
                    <span className="font-bold text-green-500">{selectedExercise.accuracy}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${selectedExercise.accuracy}%` }}
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Student Preview */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-display font-bold text-sm">Student Preview</h3>
              </div>
              <div className="p-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-slate-200 dark:border-slate-600 text-center">
                  <Headphones className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">Student view simulation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {blankMode ? "Blank fill mode: students fill in missing words" : "Listen and practice mode"}
                  </p>
                </div>
                <button className="w-full mt-3 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition">
                  <Play className="w-4 h-4 inline mr-2" /> Start Practice
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return null;
}
