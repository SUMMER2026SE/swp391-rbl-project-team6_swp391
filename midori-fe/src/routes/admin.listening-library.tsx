import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones, Search, Plus, Eye, Edit3, Trash2,
  X, Loader2, CheckCircle, ChevronRight, ChevronDown,
  Save, Clock, Upload, FileAudio, Wand2, RefreshCw,
  Play, Pause, Mic, Lock, Unlock, Eye as EyeIcon, EyeOff,
  Settings, FileText, ListChecks, Check, AlertCircle,
  BookOpen, Settings2, ArrowRight, ArrowLeft, Calendar
} from "lucide-react";
import { mockListening } from "../mock/listening";
import type {
  ListeningItem,
  ListeningQuestion,
  ListeningMode,
  JLPTLevel,
  ListeningTranscript,
} from "../types/content-library";

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

type WorkflowStep = 1 | 2 | 3 | 4 | 5;

interface ProcessingStep {
  id: 'transcript' | 'questions';
  label: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
}

export const Route = createFileRoute("/admin/listening-library")({
  component: ListeningLibraryPage,
});

function ListeningLibraryPage() {
  const [items, setItems] = useState<ListeningItem[]>(mockListening);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "all">("all");
  const [viewingItem, setViewingItem] = useState<ListeningItem | null>(null);
  const [editingItem, setEditingItem] = useState<ListeningItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = selectedLevel === "all" || item.jlptLevel === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }, [items, searchQuery, selectedLevel]);

  const itemsByLevel = useMemo(() => {
    const grouped: Record<JLPTLevel, ListeningItem[]> = {
      N5: [], N4: [], N3: [], N2: [], N1: [],
    };
    filteredItems.forEach((item) => {
      grouped[item.jlptLevel].push(item);
    });
    return grouped;
  }, [filteredItems]);

  const totalCount = items.length;
  const publishedCount = items.filter((item) => (item as any).isPublished).length;
  const draftCount = totalCount - publishedCount;

  const handleCreate = (newItem: ListeningItem) => {
    setItems((prev) => [newItem, ...prev]);
    showToast("Listening exercise created!", "success");
    setShowCreateModal(false);
  };

  const handleUpdate = (updatedItem: ListeningItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    showToast("Listening exercise updated!", "success");
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast("Listening exercise deleted!", "success");
    if (viewingItem?.id === id) setViewingItem(null);
    if (editingItem?.id === id) setEditingItem(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Listening Library</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Upload audio, AI generates content, review & publish
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl glass-surface text-xs">
            <div className="text-center">
              <p className="text-primary font-bold text-lg">{totalCount}</p>
              <p className="text-muted-col">Total</p>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div className="text-center">
              <p className="text-[var(--status-active)] font-bold text-lg">{publishedCount}</p>
              <p className="text-muted-col">Published</p>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div className="text-center">
              <p className="text-[var(--status-pending)] font-bold text-lg">{draftCount}</p>
              <p className="text-muted-col">Drafts</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> New Exercise
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
          <input
            type="text"
            placeholder="Search by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl input-glass text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedLevel("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              selectedLevel === "all"
                ? "bg-gradient-hero text-white"
                : "glass-surface text-secondary-col hover:text-primary"
            }`}
          >
            All
          </button>
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                selectedLevel === level
                  ? "bg-gradient-hero text-white"
                  : "glass-surface text-secondary-col hover:text-primary"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {selectedLevel === "all" ? (
        <div className="space-y-6">
          {JLPT_LEVELS.map((level) =>
            itemsByLevel[level].length > 0 ? (
              <div key={level} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-bold">{level}</span>
                  <span className="text-muted-col text-sm">{itemsByLevel[level].length} exercises</span>
                </div>
                <div className="grid gap-3">
                  {itemsByLevel[level].map((item) => (
                    <ListeningCard 
                      key={item.id} 
                      item={item} 
                      onView={() => setViewingItem(item)} 
                      onEdit={() => setEditingItem(item)} 
                      onDelete={() => handleDelete(item.id)}
                      onPublish={() => {
                        handleUpdate({ ...item, isPublished: true } as ListeningItem);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((item) => (
            <ListeningCard 
              key={item.id} 
              item={item} 
              onView={() => setViewingItem(item)} 
              onEdit={() => setEditingItem(item)} 
              onDelete={() => handleDelete(item.id)}
              onPublish={() => {
                handleUpdate({ ...item, isPublished: true } as ListeningItem);
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="card-base p-12 text-center">
          <Headphones className="w-12 h-12 text-muted-col/40 mx-auto mb-4" />
          <h3 className="font-display font-bold text-primary-col text-lg mb-2">
            No Listening Exercises Found
          </h3>
          <p className="text-secondary-col text-sm mb-6">
            {searchQuery ? "Try adjusting your search" : "Create your first listening exercise"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold mx-auto"
          >
            <Plus className="w-4 h-4" /> New Exercise
          </button>
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {viewingItem && (
          <ListeningDetailModal 
            item={viewingItem} 
            onClose={() => setViewingItem(null)} 
            onEdit={() => { 
              setEditingItem(viewingItem); 
              setViewingItem(null); 
            }} 
          />
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingItem) && (
          <ListeningWorkflowModal
            item={editingItem}
            onClose={() => { setShowCreateModal(false); setEditingItem(null); }}
            onSubmit={editingItem ? handleUpdate : handleCreate}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-bold border shadow-lg z-50 ${
            toast.type === "success"
              ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
              : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </div>
  );
}

// ─── Listening Card ──────────────────────────────────────────────────────────────
function ListeningCard({ 
  item, 
  onView, 
  onEdit, 
  onDelete,
  onPublish
}: { 
  item: ListeningItem; 
  onView: () => void; 
  onEdit: () => void; 
  onDelete: () => void;
  onPublish: () => void;
}) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isPublished = (item as any).isPublished || false;

  const getModeLabel = (mode: ListeningMode) => {
    switch (mode) {
      case "dictation": return "Dictation";
      case "quiz": return "Quiz";
      case "both": return "Dictation + Quiz";
      default: return mode;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-4 hover:border-primary/20 transition cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isPublished ? "bg-[var(--status-active)]/10 text-[var(--status-active)]" : "bg-primary/10 text-primary"
        }`}>
          {isPublished ? <Lock className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{item.jlptLevel}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              isPublished ? "bg-[var(--status-active)]/10 text-[var(--status-active)]" : "bg-[var(--status-pending)]/10 text-[var(--status-pending)]"
            }`}>
              {isPublished ? "Published" : "Draft"}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted/10 text-muted-col">{getModeLabel(item.mode)}</span>
            <span className="text-muted-col text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDuration(item.duration)}
            </span>
            <span className="text-muted-col text-xs">{item.questions.length} questions</span>
          </div>
          <h3 className="font-display font-bold text-primary-col text-base mb-1">{item.title}</h3>
          <div className="flex gap-2 flex-wrap">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted/10 text-muted-col">{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          {!isPublished && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPublish(); }} 
              className="p-2 rounded-lg glass-surface text-[var(--status-active)] hover:bg-[var(--status-active)]/10"
              title="Publish"
            >
              <Unlock className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="p-2 rounded-lg glass-surface text-secondary-col hover:text-primary"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); if (confirm("Delete this exercise?")) onDelete(); }} 
            className="p-2 rounded-lg glass-surface text-secondary-col hover:text-[var(--status-rejected)]"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Listening Detail Modal ──────────────────────────────────────────────────────
function ListeningDetailModal({ 
  item, 
  onClose, 
  onEdit 
}: { 
  item: ListeningItem; 
  onClose: () => void; 
  onEdit: () => void 
}) {
  const [showTranscript, setShowTranscript] = useState(true);
  const isPublished = (item as any).isPublished || false;

  const transcriptText = typeof item.transcript === 'string' 
    ? item.transcript 
    : item.transcript && typeof item.transcript === 'object' 
      ? (item.transcript as ListeningTranscript).cleaned || "" 
      : "";

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPublished ? "bg-[var(--status-active)]/10 text-[var(--status-active)]" : "bg-primary/10 text-primary"
            }`}>
              {isPublished ? <Lock className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{item.jlptLevel}</span>
              <h2 className="font-display font-bold text-primary-col text-lg mt-0.5">{item.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Audio Player */}
          <AudioPlayer src={item.audioUrl} />

          {/* Transcript Toggle */}
          <div>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-col transition mb-2"
            >
              {showTranscript ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4" />}
              Transcript
            </button>
            {showTranscript && (
              <div className="p-4 rounded-xl bg-primary/5 whitespace-pre-wrap text-sm text-secondary-col border border-primary/10">
                {transcriptText || "No transcript available"}
              </div>
            )}
          </div>

          {/* Questions */}
          <div>
            <h3 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3">Questions ({item.questions.length})</h3>
            <div className="space-y-4">
              {item.questions.map((q, i) => (
                <div key={q.id} className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="font-medium text-primary-col mb-3">{i + 1}. {q.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, j) => (
                      <span key={j} className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        j === q.correctAnswer 
                          ? "bg-[var(--status-active)]/20 text-[var(--status-active)] border border-[var(--status-active)]/30" 
                          : "bg-muted/10 text-secondary-col border border-transparent"
                      }`}>
                        {String.fromCharCode(65 + j)}. {opt}
                      </span>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-muted-col text-xs mt-2 italic pt-2 border-t border-primary/10">Explanation: {q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Tags</h3>
            <div className="flex gap-2 flex-wrap">
              {item.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{tag}</span>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-col pt-4 border-t separator">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created: {item.createdAt}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Updated: {item.updatedAt}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t separator flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
            Close
          </button>
          <button onClick={onEdit} className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Audio Player Component ──────────────────────────────────────────────────────
function AudioPlayer({ src, className = "" }: { src: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className={`p-4 rounded-xl bg-primary/5 border border-primary/10 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 transition shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 rounded-full bg-primary/20 appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-primary mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Listening Workflow Modal ────────────────────────────────────────────────────
function ListeningWorkflowModal({ 
  item, 
  onClose, 
  onSubmit 
}: { 
  item: ListeningItem | null; 
  onClose: () => void; 
  onSubmit: (item: ListeningItem) => void 
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  
  // Current step in workflow
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(item ? 4 : 1);
  
  // Step 1: Basic Info
  const [title, setTitle] = useState(item?.title || "");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(item?.jlptLevel || "N5");
  const [mode, setMode] = useState<ListeningMode>(item?.mode || "quiz");
  const [audioUrl, setAudioUrl] = useState(item?.audioUrl || "");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  // Step 2: AI Processing
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'transcript', label: 'Speech-to-Text (ASR)', status: 'pending', progress: 0 },
    { id: 'questions', label: 'Generating Quiz Questions', status: 'pending', progress: 0 },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Step 3 & 4: Admin Review & Edit
  const [transcript, setTranscript] = useState(
    typeof item?.transcript === 'string' 
      ? item.transcript 
      : item?.transcript && typeof item.transcript === 'object' 
        ? (item.transcript as ListeningTranscript).cleaned || "" 
        : ""
  );
  const [questions, setQuestions] = useState<ListeningQuestion[]>(
    item?.questions?.length ? item.questions : []
  );
  const [hintWords, setHintWords] = useState("");
  const [tags, setTags] = useState(item?.tags.join(", ") || "");
  const [duration, setDuration] = useState(item?.duration || 120);
  
  // Step 5: Preview & Publish
  const [showTranscriptInPreview, setShowTranscriptInPreview] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState((item as any)?.isPublished || false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  const toggleAudioPreview = () => {
    if (audioPreviewRef.current) {
      if (isPlaying) {
        audioPreviewRef.current.pause();
      } else {
        audioPreviewRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const startAIProcessing = async () => {
    if (!audioUrl || !title) {
      alert("Please upload audio and enter a title first");
      return;
    }

    setIsProcessing(true);
    setCurrentStep(2);

    // Reset processing steps
    setProcessingSteps([
      { id: 'transcript', label: 'Speech-to-Text (ASR)', status: 'pending', progress: 0 },
      { id: 'questions', label: 'Generating Quiz Questions', status: 'pending', progress: 0 },
    ]);

    // Process based on mode
    if (mode === 'dictation' || mode === 'both') {
      // Step 1: Speech-to-Text
      setProcessingSteps(prev => prev.map(s => s.id === 'transcript' ? { ...s, status: 'processing' } : s));
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 200));
        setProcessingSteps(prev => prev.map(s => s.id === 'transcript' ? { ...s, progress: i } : s));
      }
      setProcessingSteps(prev => prev.map(s => s.id === 'transcript' ? { ...s, status: 'done', progress: 100 } : s));
      
      // Generate transcript
      setTranscript(`駅で電車を待っています。今日は天気が很好です。次の電車は5分後に来ます。`);
      setHintWords("駅, 電車, 天気, 分");
    }

    if (mode === 'quiz' || mode === 'both') {
      // Step 2: Generate Questions
      setProcessingSteps(prev => prev.map(s => s.id === 'questions' ? { ...s, status: 'processing' } : s));
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 300));
        setProcessingSteps(prev => prev.map(s => s.id === 'questions' ? { ...s, progress: i } : s));
      }
      setProcessingSteps(prev => prev.map(s => s.id === 'questions' ? { ...s, status: 'done', progress: 100 } : s));
      
      // Generate quiz questions
      setQuestions([
        { id: "q1", question: "Where is the speaker waiting?", options: ["At the station", "At home", "At school", "At work"], correctAnswer: 0, explanation: "駅 means station" },
        { id: "q2", question: "How is the weather today?", options: ["Bad", "Good", "Cloudy", "Rainy"], correctAnswer: 1, explanation: "天気が很好 means the weather is good" },
        { id: "q3", question: "When will the next train arrive?", options: ["Now", "In 5 minutes", "In 10 minutes", "Tomorrow"], correctAnswer: 1, explanation: "5分後 means in 5 minutes" },
      ]);
    }

    setIsProcessing(false);
    
    // Auto advance to review step
    setTimeout(() => setCurrentStep(3), 500);
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: `q${questions.length + 1}`, question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const updateQuestion = (index: number, field: keyof ListeningQuestion, value: any) => {
    const updated = [...questions];
    if (field === "options") {
      updated[index].options = value;
    } else {
      (updated[index] as any)[field] = value;
    }
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      alert("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newItem: ListeningItem & { isPublished?: boolean } = {
      id: item?.id || `listen-${Date.now()}`,
      title,
      audioUrl,
      mode,
      transcript,
      questions: questions.filter((q) => q.question && q.options.some((o) => o)),
      jlptLevel,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      duration,
      createdAt: item?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      isPublished,
    };

    setIsSubmitting(false);
    onSubmit(newItem as ListeningItem);
  };

  const commonTags = ["dialogue", "daily-life", "transportation", "shopping", "restaurant", "school", "work", "travel", "weather", "time"];

  const toggleTag = (tag: string) => {
    const currentTags = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    if (currentTags.includes(tag)) {
      setTags(currentTags.filter((t) => t !== tag).join(", "));
    } else {
      setTags([...currentTags, tag].join(", "));
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return title && audioUrl;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Step 1: Upload Audio & Settings";
      case 2: return "Step 2: AI Processing";
      case 3: return "Step 3: Review & Edit";
      case 4: return "Step 4: Preview";
      case 5: return "Step 5: Publish";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Upload audio file and configure exercise settings";
      case 2: return "AI is generating transcript and quiz content...";
      case 3: return "Review and edit AI-generated content";
      case 4: return "Preview how students will see this exercise";
      case 5: return "Publish to make available for students";
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">
                {item ? "Edit Exercise" : "Create Listening Exercise"}
              </h2>
              <p className="text-gray-500 text-xs">{getStepDescription()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {([1, 2, 3, 4, 5] as WorkflowStep[]).map((step, idx) => (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => step <= currentStep && (step === 1 || (step === 2 && !isProcessing) || step <= 3 || step <= currentStep) ? setCurrentStep(step) : null}
                  disabled={step > currentStep && !(item && step <= currentStep)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    currentStep === step 
                      ? "bg-blue-600 text-white" 
                      : step < currentStep
                        ? "bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200"
                        : item && step <= currentStep
                          ? "bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {step < currentStep ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current flex items-center justify-center text-[10px]">
                      {step}
                    </span>
                  )}
                  <span className="hidden sm:inline">
                    {step === 1 && "Upload"}
                    {step === 2 && "AI"}
                    {step === 3 && "Review"}
                    {step === 4 && "Preview"}
                    {step === 5 && "Publish"}
                  </span>
                </button>
                {idx < 4 && (
                  <div className={`w-6 h-px mx-1 ${
                    step < currentStep ? "bg-blue-400" : "bg-gray-300"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Step 1: Upload Audio & Settings */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Audio Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FileAudio className="w-4 h-4 text-blue-600" />
                  <span>Audio File</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*,.mp3,.wav,.m4a"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!audioUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition"
                  >
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Click to upload audio file</p>
                    <p className="text-gray-400 text-xs mt-1">MP3, WAV, M4A supported</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <audio ref={audioPreviewRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                    <button
                      onClick={toggleAudioPreview}
                      className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shrink-0"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 text-sm font-medium truncate">{audioFile?.name || "Audio loaded"}</p>
                      <p className="text-gray-400 text-xs">{audioFile ? (audioFile.size / 1024).toFixed(1) + " KB" : "Ready to play"}</p>
                    </div>
                    <button
                      onClick={() => {
                        setAudioUrl("");
                        setAudioFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <span>Title</span>
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g., N5 - At the Station" 
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-base text-gray-900 placeholder-gray-400" 
                />
              </div>

              {/* Level & Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Level</label>
                  <div className="flex gap-1">
                    {JLPT_LEVELS.map((l) => (
                      <button
                        key={l}
                        onClick={() => setJlptLevel(l)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                          jlptLevel === l
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Mode</label>
                  <select 
                    value={mode} 
                    onChange={(e) => setMode(e.target.value as ListeningMode)} 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 outline-none text-gray-900"
                  >
                    <option value="dictation">Dictation</option>
                    <option value="quiz">Quiz</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              {/* Mode Description */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-700 mb-2">
                  {mode === 'dictation' ? '📝 Dictation Mode' : mode === 'quiz' ? '❓ Quiz Mode' : '📝❓ Both Modes'}
                </h4>
                <ul className="text-xs text-blue-600 space-y-1">
                  {mode === 'dictation' && (
                    <>
                      <li>• AI generates clean transcript</li>
                      <li>• Optional hint words for difficulty</li>
                      <li>• Students type what they hear</li>
                    </>
                  )}
                  {mode === 'quiz' && (
                    <>
                      <li>• AI generates 2-5 multiple choice questions</li>
                      <li>• Options A/B/C/D with correct answer</li>
                      <li>• Questions mapped to transcript segments</li>
                    </>
                  )}
                  {mode === 'both' && (
                    <>
                      <li>• AI generates both transcript and quiz</li>
                      <li>• Full dictation + comprehension practice</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: AI Processing */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">AI is Processing...</h3>
                <p className="text-sm text-gray-500">
                  {mode === 'dictation' && 'Generating transcript with speech recognition'}
                  {mode === 'quiz' && 'Creating quiz questions from audio'}
                  {mode === 'both' && 'Generating transcript and quiz questions'}
                </p>
              </div>

              {/* Processing Steps */}
              <div className="space-y-4">
                {(mode === 'dictation' || mode === 'both') && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {processingSteps.find(s => s.id === 'transcript')?.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                        {processingSteps.find(s => s.id === 'transcript')?.status === 'processing' && (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        )}
                        {processingSteps.find(s => s.id === 'transcript')?.status === 'done' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        <span className="text-sm font-medium text-gray-700">Speech-to-Text (ASR)</span>
                      </div>
                      {processingSteps.find(s => s.id === 'transcript')?.status === 'done' && (
                        <span className="text-xs text-green-600 font-medium">Complete</span>
                      )}
                    </div>
                    {processingSteps.find(s => s.id === 'transcript')?.status === 'processing' && (
                      <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${processingSteps.find(s => s.id === 'transcript')?.progress || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {(mode === 'quiz' || mode === 'both') && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {processingSteps.find(s => s.id === 'questions')?.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                        {processingSteps.find(s => s.id === 'questions')?.status === 'processing' && (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        )}
                        {processingSteps.find(s => s.id === 'questions')?.status === 'done' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        <span className="text-sm font-medium text-gray-700">Generating Quiz Questions</span>
                      </div>
                      {processingSteps.find(s => s.id === 'questions')?.status === 'done' && (
                        <span className="text-xs text-green-600 font-medium">Complete</span>
                      )}
                    </div>
                    {processingSteps.find(s => s.id === 'questions')?.status === 'processing' && (
                      <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${processingSteps.find(s => s.id === 'questions')?.progress || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Preview of generated content */}
              {processingSteps.every(s => s.status === 'done') && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-bold text-green-700">Content Generated Successfully!</span>
                  </div>
                  <p className="text-xs text-green-600">
                    {mode === 'dictation' && 'Transcript ready. Click "Continue" to review.'}
                    {mode === 'quiz' && `${questions.length} questions generated. Click "Continue" to review.`}
                    {mode === 'both' && 'Transcript and quiz questions ready. Click "Continue" to review.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Edit */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Transcript Editor */}
              {(mode === 'dictation' || mode === 'both') && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Transcript (Dictation)</span>
                  </label>
                  <textarea 
                    value={transcript} 
                    onChange={(e) => setTranscript(e.target.value)} 
                    rows={5} 
                    placeholder="AI-generated transcript will appear here..." 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-sm text-gray-900 resize-none placeholder-gray-400" 
                  />
                  
                  {/* Hint Words */}
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-600 mb-2 block">Hint Words (optional)</label>
                    <input 
                      type="text" 
                      value={hintWords} 
                      onChange={(e) => setHintWords(e.target.value)} 
                      placeholder="駅, 電車, 天気" 
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-500 outline-none text-gray-900" 
                    />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated words to help students</p>
                  </div>
                </div>
              )}

              {/* Questions Editor */}
              {(mode === 'quiz' || mode === 'both') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <ListChecks className="w-4 h-4 text-blue-600" />
                      <span>Questions ({questions.length})</span>
                    </label>
                    <button 
                      onClick={addQuestion} 
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      + Add Question
                    </button>
                  </div>
                  <div className="space-y-4">
                    {questions.map((q, i) => (
                      <div key={q.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Question {i + 1}</span>
                          {questions.length > 1 && (
                            <button onClick={() => removeQuestion(i)} className="text-xs text-red-500 hover:text-red-700 hover:underline">Remove</button>
                          )}
                        </div>
                        <input 
                          type="text" 
                          value={q.question} 
                          onChange={(e) => updateQuestion(i, "question", e.target.value)} 
                          placeholder="Question text" 
                          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:border-blue-500 outline-none text-gray-900" 
                        />
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                checked={q.correctAnswer === j} 
                                onChange={() => updateQuestion(i, "correctAnswer", j)} 
                                className="accent-blue-600" 
                              />
                              <input 
                                type="text" 
                                value={opt} 
                                onChange={(e) => { const newOpts = [...q.options]; newOpts[j] = e.target.value; updateQuestion(i, "options", newOpts); }} 
                                placeholder={`Option ${j + 1}`} 
                                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs focus:border-blue-500 outline-none text-gray-900" 
                              />
                            </div>
                          ))}
                        </div>
                        <input 
                          type="text" 
                          value={q.explanation || ""} 
                          onChange={(e) => updateQuestion(i, "explanation", e.target.value)} 
                          placeholder="Explanation (optional)" 
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Settings2 className="w-4 h-4 text-blue-600" />
                  <span>Difficulty Tags</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {commonTags.map((tag) => {
                    const currentTags = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
                    const isSelected = currentTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <input 
                  type="text" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder="Custom tags (comma separated)" 
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400" 
                />
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">This is how students will see this exercise</p>

              {/* Preview Card */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Preview Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">{jlptLevel}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                      {mode === 'both' ? 'Dictation + Quiz' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900">{title || "Untitled Exercise"}</h4>
                </div>

                {/* Audio Player */}
                {audioUrl && (
                  <div className="p-4 border-b border-gray-200">
                    <audio ref={audioPreviewRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                    <div className="flex items-center gap-4">
                      <button
                        onClick={toggleAudioPreview}
                        className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shrink-0"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 h-2 rounded-full bg-blue-100" />
                    </div>
                  </div>
                )}

                {/* Transcript (Dictation mode) */}
                {showTranscriptInPreview && transcript && (mode === 'dictation' || mode === 'both') && (
                  <div className="p-4 border-b border-gray-200 bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-yellow-700">TRANSCRIPT</p>
                      <button
                        onClick={() => setShowTranscriptInPreview(!showTranscriptInPreview)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Hide
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
                    {hintWords && (
                      <div className="mt-2 pt-2 border-t border-yellow-200">
                        <p className="text-xs text-yellow-600">Hint: {hintWords}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Questions Preview (Quiz mode) */}
                {(mode === 'quiz' || mode === 'both') && questions.filter(q => q.question).length > 0 && (
                  <div className="p-4 space-y-4">
                    <p className="text-xs font-bold text-gray-500">QUESTIONS</p>
                    {questions.filter(q => q.question).map((q, i) => (
                      <div key={q.id} className="space-y-2">
                        <p className="font-medium text-gray-900 text-sm">{i + 1}. {q.question}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, j) => (
                            <div key={j} className={`p-3 rounded-lg border text-sm ${
                              j === q.correctAnswer 
                                ? "border-green-300 bg-green-50 text-green-700" 
                                : "border-gray-200 text-gray-600"
                            }`}>
                              {String.fromCharCode(65 + j)}. {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dictation Input Preview */}
                {mode === 'dictation' && (
                  <div className="p-4">
                    <p className="text-xs font-bold text-gray-500 mb-2">TYPE WHAT YOU HEAR</p>
                    <textarea 
                      rows={4} 
                      placeholder="Student's answer area..." 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm resize-none" 
                      disabled
                    />
                  </div>
                )}
              </div>

              {!showTranscriptInPreview && (mode === 'dictation' || mode === 'both') && (
                <button
                  onClick={() => setShowTranscriptInPreview(true)}
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Show Transcript
                </button>
              )}
            </div>
          )}

          {/* Step 5: Publish */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="text-center py-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isPublished ? "bg-green-100" : "bg-blue-100"
                }`}>
                  {isPublished ? (
                    <Lock className="w-8 h-8 text-green-600" />
                  ) : (
                    <Unlock className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {isPublished ? "Exercise Published!" : "Ready to Publish?"}
                </h3>
                <p className="text-sm text-gray-500">
                  {isPublished 
                    ? "This exercise is live and students can access it"
                    : "Make this exercise available for students"}
                </p>
              </div>

              {/* Publishing Toggle */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {isPublished ? "Published" : "Publish Exercise"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isPublished 
                        ? "Students can access. Uncheck to make it a draft."
                        : "Once published, students can access and attempt."}
                    </p>
                  </div>
                </label>
              </div>

              {/* What's included */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-700 mb-3">Exercise Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Level:</span>
                    <span className="font-medium text-gray-900">{jlptLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode:</span>
                    <span className="font-medium text-gray-900">{mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Questions:</span>
                    <span className="font-medium text-gray-900">{questions.filter(q => q.question).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transcript:</span>
                    <span className="font-medium text-gray-900">{transcript ? "Yes" : "No"}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 mb-2">When published:</p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>✓ Content locked for students</li>
                    <li>✓ Tracking attempts enabled</li>
                    <li>✓ Score recording active</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as WorkflowStep)}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            
            {currentStep === 1 ? (
              <button
                onClick={startAIProcessing}
                disabled={!audioUrl || !title}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-4 h-4" />
                Generate with AI
              </button>
            ) : currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep((currentStep + 1) as WorkflowStep)}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition disabled:opacity-50 ${
                  isPublished 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isPublished ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {item ? "Update" : (isPublished ? "Publish" : "Save Draft")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
