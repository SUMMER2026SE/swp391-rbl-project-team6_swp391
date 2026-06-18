import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic2, Search, Plus, Eye, Edit3, Trash2,
  X, Loader2, CheckCircle, ChevronRight, Play, Pause,
  Tag, Calendar, Save, Clock, Upload, FileAudio,
  Wand2, RefreshCw, Lock, Unlock, ArrowRight, ArrowLeft,
  FileText, ListChecks, Settings2, Check, Volume2
} from "lucide-react";
import { mockShadowing } from "../mock/shadowing";
import type {
  ShadowingItem,
  ShadowingSegment,
  JLPTLevel,
} from "../types/content-library";

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

type WorkflowStep = 1 | 2 | 3 | 4 | 5;

interface ProcessingStep {
  id: 'transcript' | 'split' | 'slow';
  label: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
}

export const Route = createFileRoute("/admin/shadowing-library")({
  component: ShadowingLibraryPage,
});

function ShadowingLibraryPage() {
  const [items, setItems] = useState<ShadowingItem[]>(mockShadowing);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | "all">("all");
  const [viewingItem, setViewingItem] = useState<ShadowingItem | null>(null);
  const [editingItem, setEditingItem] = useState<ShadowingItem | null>(null);
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
    const grouped: Record<JLPTLevel, ShadowingItem[]> = {
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

  const handleCreate = (newItem: ShadowingItem) => {
    setItems((prev) => [newItem, ...prev]);
    showToast("Shadowing lesson created!", "success");
    setShowCreateModal(false);
  };

  const handleUpdate = (updatedItem: ShadowingItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    showToast("Shadowing lesson updated!", "success");
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast("Shadowing lesson deleted!", "success");
    if (viewingItem?.id === id) setViewingItem(null);
    if (editingItem?.id === id) setEditingItem(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Shadowing Library</h1>
          <p className="text-sm text-secondary-col mt-0.5">Upload audio, AI generates script, publish lessons</p>
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
            <Plus className="w-4 h-4" /> New Lesson
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
              selectedLevel === "all" ? "bg-gradient-hero text-white" : "glass-surface text-secondary-col hover:text-primary"
            }`}
          >
            All
          </button>
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                selectedLevel === level ? "bg-gradient-hero text-white" : "glass-surface text-secondary-col hover:text-primary"
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
                  <span className="text-muted-col text-sm">{itemsByLevel[level].length} lessons</span>
                </div>
                <div className="grid gap-3">
                  {itemsByLevel[level].map((item) => (
                    <ShadowingCard 
                      key={item.id} 
                      item={item} 
                      onView={() => setViewingItem(item)} 
                      onEdit={() => setEditingItem(item)} 
                      onDelete={() => handleDelete(item.id)}
                      onPublish={() => {
                        handleUpdate({ ...item, isPublished: true } as ShadowingItem);
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
            <ShadowingCard 
              key={item.id} 
              item={item} 
              onView={() => setViewingItem(item)} 
              onEdit={() => setEditingItem(item)} 
              onDelete={() => handleDelete(item.id)}
              onPublish={() => {
                handleUpdate({ ...item, isPublished: true } as ShadowingItem);
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="card-base p-12 text-center">
          <Mic2 className="w-12 h-12 text-muted-col/40 mx-auto mb-4" />
          <h3 className="font-display font-bold text-primary-col text-lg mb-2">No Shadowing Lessons Found</h3>
          <p className="text-secondary-col text-sm mb-6">
            {searchQuery ? "Try adjusting your search" : "Add your first shadowing lesson"}
          </p>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold mx-auto">
            <Plus className="w-4 h-4" /> New Lesson
          </button>
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {viewingItem && (
          <ShadowingDetailModal 
            item={viewingItem} 
            onClose={() => setViewingItem(null)} 
            onEdit={() => { setEditingItem(viewingItem); setViewingItem(null); }} 
          />
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingItem) && (
          <ShadowingWorkflowModal
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
            toast.type === "success" ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25" : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </div>
  );
}

// ─── Shadowing Card ──────────────────────────────────────────────────────────────
function ShadowingCard({ 
  item, 
  onView, 
  onEdit, 
  onDelete,
  onPublish
}: { 
  item: ShadowingItem; 
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-4 hover:border-primary/20 transition cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPublished ? "bg-[var(--status-active)]/10 text-[var(--status-active)]" : "bg-primary/10 text-primary"
        }`}>
          {isPublished ? <Lock className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{item.jlptLevel}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              isPublished ? "bg-[var(--status-active)]/10 text-[var(--status-active)]" : "bg-[var(--status-pending)]/10 text-[var(--status-pending)]"
            }`}>
              {isPublished ? "Published" : "Draft"}
            </span>
            <span className="text-muted-col text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDuration(item.duration)}
            </span>
            <span className="text-muted-col text-xs">{item.script.length} sentences</span>
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
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-lg glass-surface text-secondary-col hover:text-primary">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) onDelete(); }} className="p-2 rounded-lg glass-surface text-secondary-col hover:text-[var(--status-rejected)]">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Shadowing Detail Modal ──────────────────────────────────────────────────────
function ShadowingDetailModal({ item, onClose, onEdit }: { item: ShadowingItem; onClose: () => void; onEdit: () => void }) {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPublished = (item as any).isPublished || false;

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

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPublished ? "bg-[var(--status-active)]/10 text-[var(--status-active)]" : "bg-primary/10 text-primary"
            }`}>
              {isPublished ? <Lock className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />}
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
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <audio ref={audioRef} src={item.audioUrl} onEnded={() => setIsPlaying(false)} />
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 transition shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-primary/20" />
                <p className="text-primary text-xs mt-2">Original Audio</p>
              </div>
            </div>
          </div>

          {/* Slow Version */}
          {(item as any).slowAudioUrl && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-4">
                <button className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center hover:opacity-90 transition shrink-0">
                  <Volume2 className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-purple-100" />
                  <p className="text-purple-600 text-xs mt-2 font-medium">Slow Version Audio</p>
                </div>
              </div>
            </div>
          )}

          {/* Script/Sentences */}
          <div>
            <h3 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3">Script ({item.script.length} sentences)</h3>
            <div className="space-y-3">
              {item.script.map((seg, i) => (
                <div
                  key={seg.id}
                  onClick={() => setActiveSegment(activeSegment === i ? null : i)}
                  className={`p-4 rounded-xl cursor-pointer transition ${
                    activeSegment === i ? "bg-primary/15 border border-primary/30" : "bg-primary/5 border border-transparent hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-primary-col mb-1">{seg.text}</p>
                      {activeSegment === i && (
                        <div className="mt-2 space-y-1 pt-2 border-t border-primary/10">
                          <p className="text-secondary-col text-sm">{seg.translation}</p>
                          {seg.pitchAccent && (
                            <p className="text-muted-col text-xs">Pitch: {seg.pitchAccent}</p>
                          )}
                          <p className="text-muted-col text-xs">{seg.startTime}s - {seg.endTime}s</p>
                        </div>
                      )}
                    </div>
                  </div>
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

// ─── Shadowing Workflow Modal ────────────────────────────────────────────────────
function ShadowingWorkflowModal({ 
  item, 
  onClose, 
  onSubmit 
}: { 
  item: ShadowingItem | null; 
  onClose: () => void; 
  onSubmit: (item: ShadowingItem) => void 
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  
  // Current step
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(item ? 4 : 1);
  
  // Step 1: Basic Info
  const [title, setTitle] = useState(item?.title || "");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(item?.jlptLevel || "N5");
  const [audioUrl, setAudioUrl] = useState(item?.audioUrl || "");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Step 2: AI Processing
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'transcript', label: 'Speech-to-Text (ASR)', status: 'pending', progress: 0 },
    { id: 'split', label: 'Split Sentences', status: 'pending', progress: 0 },
    { id: 'slow', label: 'Generate Slow Version', status: 'pending', progress: 0 },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generateSlowVersion, setGenerateSlowVersion] = useState(false);
  
  // Step 3: Admin Review
  const [segments, setSegments] = useState<ShadowingSegment[]>(
    item?.script?.length ? item.script : []
  );
  const [tags, setTags] = useState(item?.tags.join(", ") || "");
  const [duration, setDuration] = useState(item?.duration || 60);
  
  // Step 4: Preview
  const [slowAudioUrl, setSlowAudioUrl] = useState((item as any)?.slowAudioUrl || "");
  
  // Step 5: Publish
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

    // Reset steps
    const stepsToProcess = [
      { id: 'transcript', label: 'Speech-to-Text (ASR)', duration: 2500 },
      { id: 'split', label: 'Split Sentences', duration: 2000 },
      ...(generateSlowVersion ? [{ id: 'slow', label: 'Generate Slow Version', duration: 3000 }] : []),
    ];
    
    setProcessingSteps(stepsToProcess.map(s => ({ id: s.id as ProcessingStep['id'], label: s.label, status: 'pending' as const, progress: 0 })));

    for (const s of stepsToProcess) {
      setProcessingSteps(prev => prev.map(p => p.id === s.id ? { ...p, status: 'processing' } : p));
      
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, s.duration / 10));
        setProcessingSteps(prev => prev.map(p => p.id === s.id ? { ...p, progress: i } : p));
      }
      
      setProcessingSteps(prev => prev.map(p => p.id === s.id ? { ...p, status: 'done', progress: 100 } : p));
    }

    // Generate mock transcript
    const mockSegments: ShadowingSegment[] = [
      { id: "seg-1", startTime: 0, endTime: 5, text: "おはようございます。", translation: "Good morning." },
      { id: "seg-2", startTime: 5, endTime: 10, text: "今日は天気が良いですね。", translation: "The weather is nice today." },
      { id: "seg-3", startTime: 10, endTime: 15, text: "一緒に散歩ませんか？", translation: "Would you like to take a walk together?" },
      { id: "seg-4", startTime: 15, endTime: 20, text: "はい、ぜひ行きましょう。", translation: "Yes, let's definitely go." },
      { id: "seg-5", startTime: 20, endTime: 25, text: "花が咲いていますね。", translation: "The flowers are blooming." },
    ];
    
    setSegments(mockSegments);
    if (generateSlowVersion) {
      setSlowAudioUrl(audioUrl + "?slow=true");
    }

    setIsProcessing(false);
    setTimeout(() => setCurrentStep(3), 500);
  };

  const addSegment = () => {
    const lastSeg = segments[segments.length - 1];
    setSegments([...segments, {
      id: `seg-${segments.length + 1}`,
      startTime: lastSeg ? lastSeg.endTime + 1 : 0,
      endTime: lastSeg ? lastSeg.endTime + 6 : 5,
      text: "",
      translation: ""
    }]);
  };

  const updateSegment = (index: number, field: keyof ShadowingSegment, value: any) => {
    const updated = [...segments];
    (updated[index] as any)[field] = value;
    setSegments(updated);
  };

  const removeSegment = (index: number) => {
    if (segments.length > 1) {
      setSegments(segments.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      alert("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newItem = {
      id: item?.id || `shadow-${Date.now()}`,
      title,
      audioUrl,
      slowAudioUrl: generateSlowVersion ? slowAudioUrl : undefined,
      script: segments.filter((s) => s.text && s.translation),
      practiceSegments: segments.filter((s) => s.text).map((s) => ({
        segmentId: s.id,
        repetitions: 3,
        speed: 1.0
      })),
      jlptLevel,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      duration,
      createdAt: item?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      isPublished,
    };

    setIsSubmitting(false);
    onSubmit(newItem as ShadowingItem);
  };

  const commonTags = ["daily-conversation", "greeting", "beginner", "intermediate", "advanced", "speaking", "pronunciation", "JLPT"];

  const toggleTag = (tag: string) => {
    const currentTags = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    if (currentTags.includes(tag)) {
      setTags(currentTags.filter((t) => t !== tag).join(", "));
    } else {
      setTags([...currentTags, tag].join(", "));
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              <Mic2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">
                {item ? "Edit Shadowing Lesson" : "Create Shadowing Lesson"}
              </h2>
              <p className="text-gray-500 text-xs">
                {currentStep === 1 && "Upload audio and configure settings"}
                {currentStep === 2 && "AI is processing..."}
                {currentStep === 3 && "Review and edit AI-generated content"}
                {currentStep === 4 && "Preview how students will see"}
                {currentStep === 5 && "Publish lesson"}
              </p>
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
                  onClick={() => step <= currentStep ? setCurrentStep(step) : null}
                  disabled={step > currentStep}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    currentStep === step 
                      ? "bg-blue-600 text-white" 
                      : step < currentStep
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
                  <div className={`w-6 h-px mx-1 ${step < currentStep ? "bg-blue-400" : "bg-gray-300"}`} />
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
                      <p className="text-gray-400 text-xs">Ready to process</p>
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
                  placeholder="e.g., N5 Daily Conversation" 
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-base text-gray-900 placeholder-gray-400" 
                />
              </div>

              {/* Level */}
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

              {/* Slow Version Option */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={generateSlowVersion}
                    onChange={(e) => setGenerateSlowVersion(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-purple-600" />
                      Generate Slow Version Audio
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      AI will create a slower version of the audio for beginners to practice shadowing
                    </p>
                  </div>
                </label>
              </div>

              {/* Process Description */}
              {audioUrl && title && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <h4 className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    What AI will do:
                  </h4>
                  <ul className="text-xs text-purple-600 space-y-1">
                    <li>1. Speech-to-Text to generate transcript</li>
                    <li>2. Split audio into individual sentences</li>
                    {generateSlowVersion && <li>3. Generate slow version audio (0.75x speed)</li>}
                  </ul>
                </div>
              )}
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
                <p className="text-sm text-gray-500">Generating transcript and splitting sentences</p>
              </div>

              {/* Processing Steps */}
              <div className="space-y-4">
                {processingSteps.filter(s => s.status !== 'pending' || processingSteps.some(ps => ps.id === 'transcript' && (ps.status === 'processing' || ps.status === 'done'))).map((step) => (
                  <div key={step.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {step.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                        {step.status === 'processing' && (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        )}
                        {step.status === 'done' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        <span className="text-sm font-medium text-gray-700">{step.label}</span>
                      </div>
                      {step.status === 'done' && (
                        <span className="text-xs text-green-600 font-medium">Complete</span>
                      )}
                    </div>
                    {step.status === 'processing' && (
                      <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Completion */}
              {processingSteps.every(s => s.status === 'done') && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-bold text-green-700">Processing Complete!</span>
                  </div>
                  <p className="text-xs text-green-600">
                    {segments.length} sentences extracted. Click "Continue" to review.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Edit */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Sentences Editor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <ListChecks className="w-4 h-4 text-blue-600" />
                    <span>Script Sentences ({segments.length})</span>
                  </label>
                  <button 
                    onClick={addSegment} 
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    + Add Sentence
                  </button>
                </div>
                <div className="space-y-4">
                  {segments.map((seg, i) => (
                    <div key={seg.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Sentence {i + 1}</span>
                        {segments.length > 1 && (
                          <button onClick={() => removeSegment(i)} className="text-xs text-red-500 hover:text-red-700 hover:underline">Remove</button>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={seg.text} 
                        onChange={(e) => updateSegment(i, "text", e.target.value)} 
                        placeholder="Japanese sentence" 
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:border-blue-500 outline-none text-gray-900" 
                      />
                      <input 
                        type="text" 
                        value={seg.translation} 
                        onChange={(e) => updateSegment(i, "translation", e.target.value)} 
                        placeholder="English translation" 
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:border-blue-500 outline-none text-gray-900" 
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="number" 
                          value={seg.startTime} 
                          onChange={(e) => updateSegment(i, "startTime", parseInt(e.target.value) || 0)} 
                          placeholder="Start (s)" 
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs focus:border-blue-500 outline-none text-gray-900" 
                        />
                        <input 
                          type="number" 
                          value={seg.endTime} 
                          onChange={(e) => updateSegment(i, "endTime", parseInt(e.target.value) || 0)} 
                          placeholder="End (s)" 
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs focus:border-blue-500 outline-none text-gray-900" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Settings2 className="w-4 h-4 text-blue-600" />
                  <span>Tags</span>
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
              <p className="text-sm text-gray-500">This is how students will see this lesson</p>

              {/* Preview Card */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Preview Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">{jlptLevel}</span>
                  </div>
                  <h4 className="font-bold text-gray-900">{title || "Untitled Lesson"}</h4>
                </div>

                {/* Audio Players */}
                <div className="p-4 space-y-3 border-b border-gray-200">
                  {/* Original */}
                  {audioUrl && (
                    <div className="flex items-center gap-3">
                      <button className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shrink-0">
                        <Play className="w-4 h-4" />
                      </button>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-blue-100" />
                        <p className="text-blue-600 text-xs mt-1 font-medium">Original Audio</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Slow Version */}
                  {generateSlowVersion && (
                    <div className="flex items-center gap-3">
                      <button className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition shrink-0">
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-purple-100" />
                        <p className="text-purple-600 text-xs mt-1 font-medium">Slow Version (0.75x)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sentences Preview */}
                <div className="p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 mb-3">SCRIPT ({segments.length} sentences)</p>
                  {segments.filter(s => s.text).map((seg, i) => (
                    <div key={seg.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{seg.text}</p>
                          <p className="text-gray-500 text-xs mt-1">{seg.translation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                  {isPublished ? "Lesson Published!" : "Ready to Publish?"}
                </h3>
                <p className="text-sm text-gray-500">
                  {isPublished 
                    ? "This lesson is live and students can access it"
                    : "Make this lesson available for students"}
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
                      {isPublished ? "Published" : "Publish Lesson"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isPublished 
                        ? "Students can access. Uncheck to make it a draft."
                        : "Once published, students can access and practice."}
                    </p>
                  </div>
                </label>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-700 mb-3">Lesson Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Level:</span>
                    <span className="font-medium text-gray-900">{jlptLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sentences:</span>
                    <span className="font-medium text-gray-900">{segments.filter(s => s.text).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Slow Version:</span>
                    <span className="font-medium text-gray-900">{generateSlowVersion ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${isPublished ? "text-green-600" : "text-yellow-600"}`}>
                      {isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 mb-2">When published:</p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>✓ Shadowing practice enabled</li>
                    <li>✓ Slow version available</li>
                    <li>✓ Progress tracking active</li>
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
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700">
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
