import { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Play,
  Pause,
  Clock,
  Settings,
  Eye,
  Video,
  Layers,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  ChevronRight,
  Info,
  UploadCloud,
  ArrowRight,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Loader2,
  LayoutGrid,
  List,
  Sparkles,
  Trash,
  Languages,
  Save
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type ShadowingVideo,
  type JLPTLevel,
  type VideoStatus,
  type DifficultyLevel,
  type SentenceItem
} from "@/types/shadowing";
import { adminShadowingApi, type ShadowingVideoUploadResponse, type ShadowingProcessingStatusResponse } from "@/lib/api/shadowing";

interface AdminShadowingManagementProps {
  defaultLevel?: JLPTLevel;
}

  // Sub-component to handle inline background polling for PROCESSING videos.
  // Note: Log appending lives in the parent component's pollProcessingStatus.
  // This component only tracks pipeline step progress (progress bar + stage icons).
  function ProcessingCardContent({ video, onComplete }: { video: ShadowingVideo; onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [stages, setStages] = useState<Record<string, "waiting" | "processing" | "completed" | "failed">>({
      download: "processing",
      extract_audio: "waiting",
      transcribe: "waiting",
      translate: "waiting",
      save_database: "waiting",
    });

    useEffect(() => {
      let interval: NodeJS.Timeout;

      async function checkStatus() {
        try {
          const status = await adminShadowingApi.getProcessingStatus(video.id);
          const currentStatus = status.status.toUpperCase();

          if (currentStatus === "COMPLETED" || currentStatus === "READY") {
            setProgress(100);
            setStages({
              download: "completed",
              extract_audio: "completed",
              transcribe: "completed",
              translate: "completed",
              save_database: "completed",
            });
            clearInterval(interval);
            setTimeout(onComplete, 1000);
            return;
          }

          if (currentStatus === "FAILED") {
            setStages(prev => {
              const next = { ...prev };
              const lastProcessing = Object.entries(next).find(([, v]) => v === "processing");
              if (lastProcessing) next[lastProcessing[0]] = "failed";
              return next;
            });
            clearInterval(interval);
            setTimeout(onComplete, 500);
            return;
          }

          if (status.currentStep) {
            const stepUpper = status.currentStep.toUpperCase();
            setStages(prev => {
              const next = { ...prev };
              switch (stepUpper) {
                case "DOWNLOAD_VIDEO":
                  next.download = "processing";
                  next.extract_audio = "waiting";
                  next.transcribe = "waiting";
                  next.translate = "waiting";
                  next.save_database = "waiting";
                  setProgress(10);
                  break;
                case "EXTRACT_AUDIO":
                  next.download = "completed";
                  next.extract_audio = "processing";
                  next.transcribe = "waiting";
                  next.translate = "waiting";
                  next.save_database = "waiting";
                  setProgress(25);
                  break;
                case "TRANSCRIBE":
                  next.download = "completed";
                  next.extract_audio = "completed";
                  next.transcribe = "processing";
                  next.translate = "waiting";
                  next.save_database = "waiting";
                  setProgress(45);
                  break;
                case "TRANSLATE":
                  next.download = "completed";
                  next.extract_audio = "completed";
                  next.transcribe = "completed";
                  next.translate = "processing";
                  next.save_database = "waiting";
                  setProgress(70);
                  break;
                case "SAVE_DATABASE":
                  next.download = "completed";
                  next.extract_audio = "completed";
                  next.transcribe = "completed";
                  next.translate = "completed";
                  next.save_database = "processing";
                  setProgress(90);
                  break;
                case "COMPLETE":
                  next.download = "completed";
                  next.extract_audio = "completed";
                  next.transcribe = "completed";
                  next.translate = "completed";
                  next.save_database = "completed";
                  setProgress(100);
                  break;
              }
              return next;
            });
          }
        } catch (err) {
          console.error("Error polling in card:", err);
        }
      }

      checkStatus();
      interval = setInterval(checkStatus, 4000);
      return () => clearInterval(interval);
    }, [video.id, onComplete]);

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-foreground">
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin text-primary" />
            AI Processing pipeline
          </span>
          <span className="text-primary font-mono">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-[var(--border)]">
          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-muted-foreground pt-1 border-t border-[var(--border)]/60">
        {[
          { name: "Download Video", status: stages.download },
          { name: "Extract Audio", status: stages.extract_audio },
          { name: "Transcribe (Whisper)", status: stages.transcribe },
          { name: "Translate (Gemini)", status: stages.translate },
          { name: "Save to Database", status: stages.save_database },
        ].map((stage, sIdx) => (
          <div key={sIdx} className="flex items-center gap-1.5">
            {stage.status === "completed" && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
            {stage.status === "processing" && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />}
            {stage.status === "waiting" && <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />}
            {stage.status === "failed" && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
            <span className={stage.status === "processing" ? "text-primary" : stage.status === "completed" ? "text-foreground" : ""}>
              {stage.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminShadowingManagement({ defaultLevel }: AdminShadowingManagementProps) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<ShadowingVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [jlptFilter, setJlptFilter] = useState<string>("all");

  // Modals & Popups
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<ShadowingVideo | null>(null);

  // Single-Page Workspace State
  const [uploadStep, setUploadStep] = useState<1 | 3 | 4>(1);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");

  // Metadata Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(defaultLevel || "N5");
  const [topic, setTopic] = useState("Daily Conversation");
  const [lessonName, setLessonName] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("3:00");

  // AI Pipeline Processing State
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineStepStatus, setPipelineStepStatus] = useState<Record<string, "waiting" | "processing" | "completed" | "failed">>({
    download: "waiting",
    extract_audio: "waiting",
    transcribe: "waiting",
    translate: "waiting",
    save_database: "waiting",
  });
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(35);
  const pipelineIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Editor State
  const [transcriptSentences, setTranscriptSentences] = useState<SentenceItem[]>([]);
  const [subtitleLanguage, setSubtitleLanguage] = useState<"japanese" | "vietnamese">("japanese");
  const [subtitleSearch, setSubtitleSearch] = useState("");
  const [editingSubtitleId, setEditingSubtitleId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ japanese: string; vietnamese: string; startTime: number; endTime: number }>({ japanese: "", vietnamese: "", startTime: 0, endTime: 0 });
  const uploadVideoRef = useRef<HTMLVideoElement | null>(null);
  const [uploadCurrentTime, setUploadCurrentTime] = useState(0);
  const [uploadIsPlaying, setUploadIsPlaying] = useState(false);
  const subtitleListRef = useRef<HTMLDivElement | null>(null);

  // Load videos on mount
  async function loadVideos() {
    setIsLoadingVideos(true);
    setVideoLoadError(null);
    try {
      const data = await adminShadowingApi.getAllVideos();
      const mapped: ShadowingVideo[] = data.map((v: ShadowingVideoUploadResponse) => {
        let status = (v.status || "processing").toLowerCase() as VideoStatus;
        if (status === "ready" || status === "completed" || status === "published" || status === "draft") {
          status = "completed";
        } else if (status === "pending" || status === "processing") {
          status = "processing";
        } else {
          status = "failed";
        }
        return {
          id: v.id,
          title: v.title,
          description: v.description ?? "",
          jlptLevel: (v.jlptLevel || "N5") as JLPTLevel,
          lesson: v.lesson || "Lesson 1",
          difficulty: (v.difficulty || "Beginner") as DifficultyLevel,
          topic: v.topic || "Daily Conversation",
          duration: v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, "0")}` : "0:00",
          thumbnail: "",
          status: status,
          storagePath: v.storagePath ?? "",
          videoUrl: v.videoUrl ?? "",
          createdDate: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          updatedDate: new Date().toLocaleDateString(),
          tags: [],
          sentences: [],
          sentenceCount: v.sentenceCount ?? 0,
          statistics: {
            totalStudents: 0,
            completedCount: 0,
            averageScore: 0,
            averageCompletionTime: "0:00",
          },
        };
      });
      setVideos(mapped);
    } catch (err) {
      console.error("[AdminShadowing] Failed to load videos:", err);
      setVideoLoadError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setIsLoadingVideos(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  // Filter & Sort
  const filteredVideos = videos
    .filter((vid) => {
      const matchesSearch =
        vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vid.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vid.lesson.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTopic = topicFilter === "all" || vid.topic === topicFilter;
      const matchesJlpt = jlptFilter === "all" || vid.jlptLevel === jlptFilter;
      return matchesSearch && matchesTopic && matchesJlpt;
    })
    .sort((a, b) => {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });

  const loadSentencesForEdit = async (videoId: string) => {
    try {
      setIsLoadingVideos(true);
      const res = await fetch(`/api/student/shadowing/videos/${videoId}/transcript`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.segments) {
          const mappedSentences = json.data.segments.map((s: any) => ({
            id: s.id.toString(),
            startTime: s.startTime,
            endTime: s.endTime,
            japanese: s.jpText || "",
            vietnamese: s.vnText || ""
          }));
          setTranscriptSentences(mappedSentences);
        }
      }
      setUploadStep(4);
      setIsUploadOpen(true);
    } catch (e) {
      console.error("Failed to load sentences for edit:", e);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Delete video Action
  const handleDeleteConfirm = async () => {
    if (videoToDelete) {
      try {
        await adminShadowingApi.deleteVideo(videoToDelete.id);
        setVideos(prev => prev.filter(v => v.id !== videoToDelete.id));
        setVideoToDelete(null);
      } catch (err) {
        console.error("Failed to delete video:", err);
        alert("Xóa video thất bại. Vui lòng thử lại.");
      }
    }
  };



  // Handle source file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({ name: file.name, size: (file.size / (1024 * 1024)).toFixed(2) + " MB" });
      setUploadError(null);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("title", file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
        formData.append("description", "");
        formData.append("video", file);

        const result = await adminShadowingApi.uploadVideo(formData);
        setUploadedVideoId(result.id);
        setVideoUrl(result.videoUrl ?? "");
        setTitle(result.title ?? file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
        setUploadProgress(100);
      } catch (err) {
        console.error("[AdminShadowing] Upload failed:", err);
        setUploadError(err instanceof Error ? err.message : "Upload failed. Check backend logs.");
        setUploadedFile(null);
        setUploadedVideoId(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Track seen log IDs to prevent duplicate frontend rendering.
  // Each poll returns the FULL log array. Without ID tracking, the frontend
  // generates a NEW timestamped string each poll from the same backend log row,
  // causing the string comparison to fail and appending duplicates every 3s.
  const seenLogIds = useRef<Set<string>>(new Set());

  const pollProcessingStatus = (videoId: string) => {
    if (pipelineIntervalRef.current) clearInterval(pipelineIntervalRef.current);
    // Reset seen IDs when starting a new polling session (e.g., regenerate).
    seenLogIds.current = new Set();

    pipelineIntervalRef.current = setInterval(async () => {
      try {
        const status = await adminShadowingApi.getProcessingStatus(videoId);
        const currentStatus = status.status.toUpperCase();

        setPipelineProgress(prev => {
          if (currentStatus === "COMPLETED") return 100;
          if (currentStatus === "FAILED") return prev;
          if (status.currentStep) {
            const stepUpper = status.currentStep.toUpperCase();
            switch (stepUpper) {
              case "DOWNLOAD_VIDEO": return Math.min(prev, 15);
              case "EXTRACT_AUDIO": return Math.min(prev, 30);
              case "TRANSCRIBE": return Math.min(prev, 55);
              case "TRANSLATE": return Math.min(prev, 80);
              case "SAVE_DATABASE": return Math.min(prev, 95);
              case "COMPLETE": return 100;
            }
          }
          return Math.min(prev + 3, 90);
        });

        // Only append logs that haven't been seen before.
        // Use log.id (UUID) as the deduplication key — not the generated
        // display string — so that re-polling the same log row does NOT
        // produce a new entry even when toLocaleTimeString() differs.
        for (const log of status.logs ?? []) {
          if (!seenLogIds.current.has(log.id)) {
            seenLogIds.current.add(log.id);
            setProcessingLogs(logs => {
              const newLog = `[${new Date().toLocaleTimeString()}] ${log.step}: ${log.errorMessage ?? log.status}`;
              return [...logs, newLog];
            });
          }
        }

        if (status.currentStep) {
          const stepUpper = status.currentStep.toUpperCase();
          const isFailed = currentStatus === "FAILED";

          setPipelineStepStatus(prev => {
            const next = { ...prev };
            switch (stepUpper) {
              case "DOWNLOAD_VIDEO":
                next.download = isFailed ? "failed" : "processing";
                break;
              case "EXTRACT_AUDIO":
                next.download = "completed";
                next.extract_audio = isFailed ? "failed" : "processing";
                break;
              case "TRANSCRIBE":
                next.download = "completed";
                next.extract_audio = "completed";
                next.transcribe = isFailed ? "failed" : "processing";
                break;
              case "TRANSLATE":
                next.download = "completed";
                next.extract_audio = "completed";
                next.transcribe = "completed";
                next.translate = isFailed ? "failed" : "processing";
                break;
              case "SAVE_DATABASE":
                next.download = "completed";
                next.extract_audio = "completed";
                next.transcribe = "completed";
                next.translate = "completed";
                next.save_database = isFailed ? "failed" : "processing";
                break;
              case "COMPLETE":
                next.download = "completed";
                next.extract_audio = "completed";
                next.transcribe = "completed";
                next.translate = "completed";
                next.save_database = isFailed ? "failed" : "completed";
                break;
            }
            return next;
          });
        }

        if (currentStatus === "COMPLETED") {
          clearInterval(pipelineIntervalRef.current!);
          setPipelineStepStatus({
            download: "completed",
            extract_audio: "completed",
            transcribe: "completed",
            translate: "completed",
            save_database: "completed"
          });
          setPipelineProgress(100);
          setProcessingLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] Pipeline completed successfully.`]);

          // Fetch segments to show in workspace
          try {
            const res = await fetch(`/api/student/shadowing/videos/${videoId}/transcript`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
              },
            });
            if (res.ok) {
              const json = await res.json();
              if (json.data && json.data.segments) {
                const mappedSentences = json.data.segments.map((s: any) => ({
                  id: s.id.toString(),
                  startTime: s.startTime,
                  endTime: s.endTime,
                  japanese: s.jpText || "",
                  vietnamese: s.vnText || ""
                }));
                setTranscriptSentences(mappedSentences);
              }
            }
          } catch (e) {
            console.error("Failed to load final sentences:", e);
          }

          setTimeout(() => setUploadStep(4), 1000);
        } else if (currentStatus === "FAILED") {
          clearInterval(pipelineIntervalRef.current!);
          setProcessingLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] Pipeline FAILED: ${status.errorMessage ?? "Unknown error"}`]);
        }
      } catch (err) {
        console.error("[AdminShadowing] Polling error:", err);
      }
    }, 3000);
  };

  const handleFinishWizard = async (publishStatus: VideoStatus) => {
    if (uploadedVideoId) {
      try {
        const updatePayload = {
          title,
          description,
          jlptLevel,
          difficulty: "Beginner",
          lesson: lessonName || "Lesson 1",
          topic,
          status: publishStatus,
          sentences: transcriptSentences.map(s => ({
            startTime: s.startTime,
            endTime: s.endTime,
            jpText: s.japanese,
            vnText: s.vietnamese
          }))
        };
        await adminShadowingApi.updateVideo(uploadedVideoId, updatePayload);
        await loadVideos();

        setIsUploadOpen(false);
        setUploadStep(1);
        setUploadedFile(null);
        setVideoUrl("");
        setTitle("");
        setDescription("");
        setJlptLevel("N5");
        setTopic("Daily Conversation");
        setTagsInput("");
        setUploadedVideoId(null);
        setTranscriptSentences([]);
      } catch (err) {
        console.error("[AdminShadowing] Failed to save video details:", err);
      }
    }
  };

  // Interactive Editor Action Helpers
  const handleAddSentence = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTranscriptSentences(prev => [
      ...prev,
      { id: newId, startTime: 0, endTime: 5, japanese: "日本語の文", vietnamese: "Câu dịch mới." }
    ]);
  };

  const handleDeleteSentence = (id: string) => {
    setTranscriptSentences(prev => prev.filter(s => s.id !== id));
  };

  const handleMergeWithNext = (index: number) => {
    if (index >= transcriptSentences.length - 1) return;
    const current = transcriptSentences[index];
    const next = transcriptSentences[index + 1];
    const merged = {
      ...current,
      endTime: next.endTime,
      japanese: current.japanese + " " + next.japanese,
      vietnamese: current.vietnamese + " " + next.vietnamese
    };
    setTranscriptSentences(prev => {
      const copy = [...prev];
      copy.splice(index, 2, merged);
      return copy;
    });
  };

  const handleSplitSentence = (index: number) => {
    const current = transcriptSentences[index];
    const midTime = Math.round((current.startTime + current.endTime) / 2);
    const first = {
      ...current,
      id: Math.random().toString(36).substr(2, 9),
      endTime: midTime
    };
    const second = {
      ...current,
      id: Math.random().toString(36).substr(2, 9),
      startTime: midTime
    };
    setTranscriptSentences(prev => {
      const copy = [...prev];
      copy.splice(index, 1, first, second);
      return copy;
    });
  };

  const seekVideoTo = (time: number) => {
    if (uploadVideoRef.current) {
      uploadVideoRef.current.currentTime = time;
      uploadVideoRef.current.play();
    } else {
      const video = document.getElementById("edit-video-player") as HTMLVideoElement;
      if (video) {
        video.currentTime = time;
        video.play();
      }
    }
  };

  // Active subtitle detection based on current playback time
  const activeUploadSubtitle = transcriptSentences.find(
    s => uploadCurrentTime >= s.startTime && uploadCurrentTime < s.endTime
  );

  // Auto-scroll to active subtitle
  useEffect(() => {
    if (activeUploadSubtitle && subtitleListRef.current) {
      const el = subtitleListRef.current.querySelector(`[data-subtitle-id="${activeUploadSubtitle.id}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeUploadSubtitle?.id]);

  // Format seconds to MM:SS
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Inline editing helpers
  const startEditing = (sen: SentenceItem) => {
    setEditingSubtitleId(sen.id);
    setEditDraft({ japanese: sen.japanese, vietnamese: sen.vietnamese, startTime: sen.startTime, endTime: sen.endTime });
  };

  const saveEditing = () => {
    if (!editingSubtitleId) return;
    setTranscriptSentences(prev => prev.map(s =>
      s.id === editingSubtitleId
        ? { ...s, japanese: editDraft.japanese, vietnamese: editDraft.vietnamese, startTime: editDraft.startTime, endTime: editDraft.endTime }
        : s
    ));
    setEditingSubtitleId(null);
  };

  const cancelEditing = () => {
    setEditingSubtitleId(null);
  };

  // Filtered subtitles for search
  const filteredUploadSubtitles = transcriptSentences.filter(s => {
    if (!subtitleSearch) return true;
    const q = subtitleSearch.toLowerCase();
    return s.japanese.toLowerCase().includes(q) || s.vietnamese.toLowerCase().includes(q);
  });

  const renderStatusBadge = (status: VideoStatus) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-lg text-[10px]">AI Ready</Badge>;
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-lg text-[10px] inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </Badge>
        );
      case "uploading":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-lg text-[10px] inline-flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Uploading
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive" className="font-bold px-2 py-0.5 rounded-lg text-[10px]">AI Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] rounded-lg">{status}</Badge>;
    }
  };

  return (
    <Fragment>
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 p-6 rounded-3xl shadow-xl shadow-slate-100/10 dark:shadow-none transition-all duration-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground inline-flex items-center gap-2">
            <Video className="w-8 h-8 text-primary drop-shadow-[0_2px_8px_rgba(var(--primary-rgb),0.3)]" />
            Shadowing Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, transcribe, translate and manage AI Shadowing lessons for student exercises
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={() => {
              setIsUploadOpen(true);
              setUploadStep(1);
              setUploadedFile(null);
              setVideoUrl("");
              setTitle("");
              setDescription("");
              setJlptLevel("N5");
              setTopic("Daily Conversation");
              setTagsInput("");
              setUploadedVideoId(null);
              setTranscriptSentences([]);
            }}
            className="bg-gradient-to-r from-primary to-sakura hover:opacity-95 text-white font-bold rounded-2xl px-5 py-6 inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-300 active:scale-95 w-full md:w-auto animate-pulse-subtle"
          >
            <Plus className="w-5 h-5" />
            Upload Video
          </Button>
        </div>
      </div>

      {/* 2. STATISTICS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { title: "Total Lessons", count: videos.length, icon: Video, color: "text-blue-500 bg-blue-500/10" },
          { title: "Completed", count: videos.filter(v => v.status === "completed").length, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
          { title: "Processing", count: videos.filter(v => v.status === "processing").length, icon: RefreshCw, color: "text-amber-500 bg-amber-500/10 animate-spin-slow" },
          { title: "Failed", count: videos.filter(v => v.status === "failed").length, icon: AlertTriangle, color: "text-rose-500 bg-rose-500/10" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="border border-[var(--border)] bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-2xl font-black text-foreground mt-1.5">{stat.count}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. FILTER BAR */}
      <div className="mt-6 bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 p-4 rounded-3xl shadow-xl shadow-slate-100/5 dark:shadow-none transition-all duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 flex h-10 w-full rounded-xl border border-white/20 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/45 px-3 py-1 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Topic Filter */}
          <div>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-white/20 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/45 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground cursor-pointer"
            >
              <option value="all" className="bg-background text-foreground">All Topics</option>
              <option value="Daily Conversation" className="bg-background text-foreground">Daily Conversation</option>
              <option value="Travel" className="bg-background text-foreground">Travel</option>
              <option value="Restaurant" className="bg-background text-foreground">Restaurant</option>
              <option value="School" className="bg-background text-foreground">School</option>
              <option value="Business" className="bg-background text-foreground">Business</option>
              <option value="Shopping" className="bg-background text-foreground">Shopping</option>
              <option value="Culture" className="bg-background text-foreground">Culture</option>
              <option value="Anime" className="bg-background text-foreground">Anime</option>
              <option value="News" className="bg-background text-foreground">News</option>
              <option value="Custom" className="bg-background text-foreground">Custom</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={jlptFilter}
              onChange={(e) => setJlptFilter(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-white/20 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/45 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground cursor-pointer"
            >
              <option value="all" className="bg-background text-foreground">All JLPT Levels</option>
              <option value="N5" className="bg-background text-foreground">JLPT N5</option>
              <option value="N4" className="bg-background text-foreground">JLPT N4</option>
              <option value="N3" className="bg-background text-foreground">JLPT N3</option>
              <option value="N2" className="bg-background text-foreground">JLPT N2</option>
              <option value="N1" className="bg-background text-foreground">JLPT N1</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. LESSON CARDS GRID */}
      {isLoadingVideos ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border border-[var(--border)] bg-white/40 dark:bg-slate-900/35 p-5 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-4 w-24 rounded mt-1" />
              <Skeleton className="h-6 w-16 rounded mt-1" />
              <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border)]/60">
                <Skeleton className="h-8 flex-1 rounded-xl" />
                <Skeleton className="h-8 flex-1 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      ) : videoLoadError ? (
        <div className="mt-8 bg-destructive/10 border border-destructive/20 p-8 rounded-3xl text-center max-w-xl mx-auto text-destructive space-y-3">
          <AlertTriangle className="w-10 h-10 mx-auto" />
          <h3 className="font-bold text-base">Error Loading Lessons</h3>
          <p className="text-sm">{videoLoadError}</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="mt-12 border-2 border-dashed border-[var(--border)] p-16 rounded-3xl text-center max-w-xl mx-auto space-y-5">
          <Video className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <div className="space-y-1.5">
            <h3 className="font-bold text-lg text-foreground">No shadowing videos yet.</h3>
            <p className="text-sm text-muted-foreground">Upload your first video to generate AI subtitles.</p>
          </div>
          <Button 
            onClick={() => {
              setIsUploadOpen(true);
              setUploadStep(1);
              setUploadedFile(null);
              setVideoUrl("");
              setTitle("");
              setDescription("");
              setJlptLevel("N5");
              setTopic("Daily Conversation");
              setTagsInput("");
              setUploadedVideoId(null);
              setTranscriptSentences([]);
            }}
            className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-5 py-5 inline-flex items-center gap-2 shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Video
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((vid) => {
            const isProcessing = vid.status === "processing";
            return (
              <Card 
                key={vid.id} 
                className="group border border-[var(--border)] bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                {/* 1. Thumbnail & Video Duration */}
                <div className="relative aspect-video w-full bg-slate-950/80 overflow-hidden shrink-0">
                  <img
                    src={vid.thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=340&fit=crop"}
                    alt={vid.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/75 text-white font-mono text-[10px] font-black tracking-wider flex items-center gap-1 shadow-md">
                    <Clock className="w-3 h-3 text-sakura" />
                    {vid.duration}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* 2. Title */}
                    <h4 className="font-bold text-foreground text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {vid.title}
                    </h4>

                    {/* 3. Small metadata row (Level & Topic) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <Badge variant="outline" className="border-primary/20 text-primary font-bold px-2 py-0">
                        {vid.jlptLevel}
                      </Badge>
                      <Badge variant="outline" className="border-muted/20 text-muted-foreground font-bold px-2 py-0">
                        {vid.topic}
                      </Badge>
                    </div>

                    {/* 4. Upload Date */}
                    <div className="text-[10px] text-muted-foreground font-medium">
                      Upload Date: {vid.createdDate}
                    </div>

                    {/* 5. Status Badge */}
                    <div className="pt-1">
                      {renderStatusBadge(vid.status)}
                    </div>

                    {/* Inline progress display for cards currently processing */}
                    {isProcessing && (
                      <ProcessingCardContent video={vid} onComplete={loadVideos} />
                    )}
                  </div>

                  {/* 6. Action Buttons */}
                  <div className="pt-3 border-t border-[var(--border)]/60 flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/admin/shadowing/${vid.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-xl px-2.5">
                          <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                        </Button>
                      </Link>
                      {!isProcessing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setUploadedVideoId(vid.id);
                            setVideoUrl(vid.videoUrl);
                            setTitle(vid.title);
                            setDescription(vid.description);
                            setJlptLevel(vid.jlptLevel);
                            setTopic(vid.topic);
                            setLessonName(vid.lesson);
                            loadSentencesForEdit(vid.id);
                          }}
                          className="h-8 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl px-2.5"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                      )}
                    </div>

                    {!isProcessing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setVideoToDelete(vid)}
                        className="w-8 h-8 rounded-xl hover:bg-destructive/10 text-destructive/80 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. CREATE & UPLOAD WORKSPACE MODAL (SINGLE-PAGE) */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-y-auto rounded-3xl p-6 bg-white dark:bg-slate-950 border border-[var(--border)] text-foreground flex flex-col justify-between">
          <DialogHeader className="border-b border-[var(--border)]/60 pb-3 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                {uploadStep === 4 ? "Interactive Shadowing Lesson Workspace" : "Create New Shadowing Lesson"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {uploadStep === 4 ? "Review generated timestamps and inline edit Japanese & Vietnamese subtitles." : "Upload media file and configure AI processing pipeline metadata."}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsUploadOpen(false)} className="rounded-xl w-8 h-8 cursor-pointer">
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <div className="flex-1 py-6 overflow-y-auto">
            {/* STATE A: Initial Form & Upload */}
            {uploadStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                {/* Left: Drag and Drop Upload */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                      <Upload className="w-4.5 h-4.5 text-primary" />
                      Upload Source Video
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select or drop the video file you wish to process. The AI engine will analyze, transcribe, segment, and translate the text automatically.
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary rounded-3xl p-8 bg-primary/5 hover:bg-primary/10 transition-all text-center relative group min-h-[300px]">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-16 h-16 text-primary/70 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    {isUploading ? (
                      <div className="space-y-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                        <p className="text-sm font-bold text-foreground">Uploading video file...</p>
                        <div className="w-48 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mx-auto">
                          <div className="bg-primary h-full rounded-full transition-all duration-300 animate-pulse" style={{ width: "100%" }} />
                        </div>
                      </div>
                    ) : uploadedFile ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-foreground max-w-[280px] truncate mx-auto">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{uploadedFile.size}</p>
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-2.5 py-0.5 rounded-lg text-xs">Uploaded & Ready</Badge>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-foreground">Drag & Drop Video Here</p>
                        <p className="text-xs text-muted-foreground">Supports MP4, MOV formats up to 100MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Metadata Form */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                      <Settings className="w-4.5 h-4.5 text-primary" />
                      Lesson Metadata
                    </h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">Lesson Title *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Intro Greeting Dialogue"
                        className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">Description</label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief lesson guidelines or notes..."
                        className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/80">JLPT Level *</label>
                        <select
                          value={jlptLevel}
                          onChange={(e) => setJlptLevel(e.target.value as JLPTLevel)}
                          className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <option value="N5">N5 (Beginner)</option>
                          <option value="N4">N4 (Elementary)</option>
                          <option value="N3">N3 (Intermediate)</option>
                          <option value="N2">N2 (Upper-Int)</option>
                          <option value="N1">N1 (Advanced)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/80">Topic *</label>
                        <select
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <option value="Daily Conversation">Daily Conversation</option>
                          <option value="Travel">Travel</option>
                          <option value="Restaurant">Restaurant</option>
                          <option value="School">School</option>
                          <option value="Business">Business</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Culture">Culture</option>
                          <option value="Anime">Anime</option>
                          <option value="News">News</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="greeting, anime, culture"
                        className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
                    <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="rounded-xl border-[var(--border)] cursor-pointer">
                      Cancel
                    </Button>
                    <Button
                      disabled={!uploadedFile || isUploading || !title}
                      onClick={() => {
                        setUploadStep(3);
                        setPipelineProgress(0);
                        setEstimatedTimeRemaining(120);
                        setPipelineStepStatus({
                          download: "processing",
                          extract_audio: "waiting",
                          transcribe: "waiting",
                          translate: "waiting",
                          save_database: "waiting",
                        });
                        setProcessingLogs([
                          `[${new Date().toLocaleTimeString()}] Upload confirmed. Video ID: ${uploadedVideoId}`,
                          `[${new Date().toLocaleTimeString()}] Starting AI processing pipeline. This may take 30–180 seconds.`,
                        ]);
                        pollProcessingStatus(uploadedVideoId!);
                      }}
                      className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-5 flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      Start AI Processing
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STATE B: Live AI Processing Status Dashboard */}
            {uploadStep === 3 && (
              <div className="space-y-8 max-w-3xl mx-auto py-8">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-foreground">AI Transcription & Segmenting Pipeline</h3>
                  <p className="text-xs text-muted-foreground">Please wait while our models analyze speech patterns, generate sentence segments, and translate translations.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-primary flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Pipeline Processing
                    </span>
                    <span className="font-mono text-primary">{pipelineProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-[var(--border)]">
                    <div className="bg-gradient-to-r from-primary to-sakura h-full rounded-full transition-all duration-500" style={{ width: `${pipelineProgress}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span>Active Stage</span>
                    <span>Est. Time Remaining: ~{estimatedTimeRemaining}s</span>
                  </div>
                </div>

                {/* Pipeline Step Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "Downloading Video...", key: "download", desc: "Downloading video file from Supabase Storage" },
                    { name: "Extracting Audio...", key: "extract_audio", desc: "Extracting 16kHz mono audio using FFmpeg" },
                    { name: "Transcribing Speech...", key: "transcribe", desc: "Converting audio to Japanese text with Groq Whisper" },
                    { name: "Generating Vietnamese Translation...", key: "translate", desc: "Translating transcript to Vietnamese with Gemini AI" },
                    { name: "Saving to Database...", key: "save_database", desc: "Saving all transcript segments to the database" },
                  ].map((step) => {
                    const statusVal = pipelineStepStatus[step.key];
                    return (
                      <Card key={step.key} className="border border-[var(--border)] bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl flex items-start gap-3">
                        <div className="mt-0.5">
                          {statusVal === "completed" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                          {statusVal === "processing" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                          {statusVal === "waiting" && <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-800" />}
                          {statusVal === "failed" && <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className={`text-xs font-bold ${statusVal === "processing" ? "text-primary" : "text-foreground"}`}>{step.name}</h4>
                          <p className="text-[10px] text-muted-foreground leading-normal">{step.desc}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Logs Terminal */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System logs</span>
                  <div className="bg-slate-950 text-slate-300 font-mono text-[11px] p-4 rounded-2xl border border-slate-800 h-36 overflow-y-auto space-y-1 scrollbar-thin">
                    {processingLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        <span className="text-emerald-500 mr-2">&gt;</span>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STATE C: Interactive Subtitle Editor Workspace */}
            {uploadStep === 4 && (
              <div className="space-y-6">
                {/* Success Banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-foreground block">AI Pipeline Completed</strong>
                    <span className="text-muted-foreground">Review and edit the generated subtitles below.</span>
                  </div>
                </div>

                {/* Main Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left: Video Player (~55%) */}
                  <div className="lg:col-span-7 flex flex-col space-y-4">
                    <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-[var(--border)] shadow-lg shadow-black/20">
                      {videoUrl ? (
                        <>
                          <video
                            ref={uploadVideoRef}
                            id="edit-video-player"
                            className="w-full h-full object-contain"
                            src={videoUrl}
                            onTimeUpdate={(e) => setUploadCurrentTime((e.target as HTMLVideoElement).currentTime)}
                            onPlay={() => setUploadIsPlaying(true)}
                            onPause={() => setUploadIsPlaying(false)}
                          />
                          {/* Subtitle overlay */}
                          {activeUploadSubtitle && (
                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-center px-4 py-2.5 rounded-xl border border-white/10 max-w-[85%] shadow-2xl pointer-events-none z-10 select-none">
                              <p className="text-white text-base font-bold leading-relaxed drop-shadow">
                                {activeUploadSubtitle.japanese}
                              </p>
                              <p className="text-emerald-300 text-xs font-semibold mt-1 leading-normal drop-shadow">
                                {activeUploadSubtitle.vietnamese}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground space-y-2">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                          <p className="text-xs">Loading workspace player...</p>
                        </div>
                      )}
                    </div>

                    {/* Simple video controls */}
                    <Card className="border border-[var(--border)] bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl p-4 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (uploadVideoRef.current) {
                              uploadIsPlaying ? uploadVideoRef.current.pause() : uploadVideoRef.current.play();
                            }
                          }}
                          className="w-10 h-10 rounded-xl border-[var(--border)] text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer shrink-0"
                        >
                          {uploadIsPlaying ? <Pause className="w-4.5 h-4.5 fill-current" /> : <Play className="w-4.5 h-4.5 fill-current" />}
                        </Button>
                        <span className="text-[10px] font-bold font-mono text-muted-foreground w-11 shrink-0">
                          {formatTimestamp(uploadCurrentTime)}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={uploadVideoRef.current?.duration || 100}
                          step={0.1}
                          value={uploadCurrentTime}
                          onChange={(e) => {
                            const t = parseFloat(e.target.value);
                            if (uploadVideoRef.current) uploadVideoRef.current.currentTime = t;
                            setUploadCurrentTime(t);
                          }}
                          className="flex-1 accent-primary h-1 rounded-lg cursor-pointer bg-slate-200 dark:bg-slate-800"
                        />
                        <span className="text-[10px] font-bold font-mono text-muted-foreground w-11 shrink-0 text-right">
                          {formatTimestamp(uploadVideoRef.current?.duration || 0)}
                        </span>
                      </div>
                    </Card>
                  </div>

                  {/* Right: Subtitle Editor (~45%) */}
                  <div className="lg:col-span-5 flex flex-col">
                    <Card className="border border-[var(--border)] bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col h-full min-h-[420px]">
                      {/* Top controls */}
                      <div className="p-4 border-b border-[var(--border)]/60 bg-white/60 dark:bg-slate-950/40 space-y-3 shrink-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Subtitle Editor
                          </span>
                        </div>

                        {/* Search + Language Switch */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search subtitles..."
                              value={subtitleSearch}
                              onChange={(e) => setSubtitleSearch(e.target.value)}
                              className="pl-8 flex h-9 w-full rounded-xl border border-[var(--border)] bg-slate-50 dark:bg-slate-950 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                            />
                          </div>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-[var(--border)] shrink-0">
                            <button
                              onClick={() => setSubtitleLanguage("japanese")}
                              className={`text-[9px] font-extrabold px-2.5 py-1.5 rounded cursor-pointer transition-all ${
                                subtitleLanguage === "japanese"
                                  ? "bg-primary text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Japanese
                            </button>
                            <button
                              onClick={() => setSubtitleLanguage("vietnamese")}
                              className={`text-[9px] font-extrabold px-2.5 py-1.5 rounded cursor-pointer transition-all ${
                                subtitleLanguage === "vietnamese"
                                  ? "bg-primary text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Vietnamese
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Subtitle list */}
                      <div ref={subtitleListRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[420px] scrollbar-thin">
                        {filteredUploadSubtitles.map((sen, index) => {
                          const isActive = activeUploadSubtitle?.id === sen.id;
                          const isEditing = editingSubtitleId === sen.id;

                          return (
                            <div
                              key={sen.id}
                              data-subtitle-id={sen.id}
                              className={`border rounded-xl transition-all duration-300 ${
                                isActive
                                  ? "bg-primary/5 dark:bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                                  : "bg-white dark:bg-slate-950 border-[var(--border)] hover:shadow-sm"
                              }`}
                            >
                              {isEditing ? (
                                /* Editing mode */
                                <div className="p-3.5 space-y-3">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-black uppercase text-muted-foreground">Start Time (s)</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={editDraft.startTime}
                                        onChange={(e) => setEditDraft(d => ({ ...d, startTime: parseFloat(e.target.value) || 0 }))}
                                        className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--input)] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-black uppercase text-muted-foreground">End Time (s)</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={editDraft.endTime}
                                        onChange={(e) => setEditDraft(d => ({ ...d, endTime: parseFloat(e.target.value) || 0 }))}
                                        className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--input)] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-primary/80">Japanese</label>
                                    <input
                                      type="text"
                                      value={editDraft.japanese}
                                      onChange={(e) => setEditDraft(d => ({ ...d, japanese: e.target.value }))}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--input)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-emerald-600/80">Vietnamese</label>
                                    <input
                                      type="text"
                                      value={editDraft.vietnamese}
                                      onChange={(e) => setEditDraft(d => ({ ...d, vietnamese: e.target.value }))}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--input)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2 pt-1">
                                    <Button size="sm" variant="outline" onClick={cancelEditing} className="h-7 text-[10px] font-bold rounded-lg px-2.5 cursor-pointer">
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={saveEditing} className="h-7 text-[10px] font-bold rounded-lg px-2.5 bg-primary text-white hover:bg-primary/95 cursor-pointer">
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* Display mode */
                                <div
                                  className="p-3 cursor-pointer"
                                  onClick={() => seekVideoTo(sen.startTime)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <span className="text-[10px] font-mono font-bold text-primary/70">
                                        {formatTimestamp(sen.startTime)}
                                      </span>
                                      <p className="text-xs font-semibold text-foreground truncate">
                                        {subtitleLanguage === "japanese" ? sen.japanese : sen.vietnamese}
                                      </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); startEditing(sen); }}
                                        className="w-7 h-7 rounded-lg hover:bg-primary/10 text-primary cursor-pointer"
                                        title="Edit"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSentence(sen.id); }}
                                        className="w-7 h-7 rounded-lg hover:bg-destructive/10 text-destructive/80 cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); handleSplitSentence(index); }}
                                        className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-muted-foreground cursor-pointer"
                                        title="Split"
                                      >
                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                      </Button>
                                      {index < transcriptSentences.length - 1 && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={(e) => { e.stopPropagation(); handleMergeWithNext(index); }}
                                          className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-muted-foreground cursor-pointer"
                                          title="Merge with next"
                                        >
                                          <Layers className="w-3.5 h-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="border-t border-[var(--border)] pt-4 mt-4 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
            {uploadStep === 4 ? (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Badge className="bg-primary/10 text-primary border-primary/20">{jlptLevel}</Badge>
                </span>
                <span className="flex items-center gap-1">
                  Sentences: <strong className="text-foreground">{transcriptSentences.length}</strong>
                </span>
              </div>
            ) : (
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Info className="w-4 h-4 text-primary" />
                Fill out fields on the right, drop video on the left, then click Start AI Processing.
              </div>
            )}

            <div className="flex gap-2">
              {uploadStep === 4 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsUploadOpen(false)}
                    className="rounded-xl border-[var(--border)] text-xs font-bold cursor-pointer"
                  >
                    Discard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadStep(3);
                      setPipelineProgress(0);
                      setEstimatedTimeRemaining(120);
                      setPipelineStepStatus({
                        download: "processing",
                        extract_audio: "waiting",
                        transcribe: "waiting",
                        translate: "waiting",
                        save_database: "waiting",
                      });
                      setProcessingLogs([
                        `[${new Date().toLocaleTimeString()}] Regenerating AI processing...`,
                      ]);
                      pollProcessingStatus(uploadedVideoId!);
                    }}
                    className="rounded-xl border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Regenerate AI
                  </Button>
                  <Button
                    onClick={() => handleFinishWizard("completed")}
                    className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-5 shadow-lg shadow-primary/10 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="rounded-xl border-[var(--border)] cursor-pointer">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!videoToDelete} onOpenChange={(o) => !o && setVideoToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-950 border border-[var(--border)] text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delete Shadowing Lesson?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal">
              Are you sure you want to permanently delete this lesson? This action cannot be undone. All segments and student completion data associated with this lesson will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVideoToDelete(null)} className="rounded-xl border-[var(--border)] cursor-pointer">Cancel</Button>
            <Button onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl cursor-pointer">Delete Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
