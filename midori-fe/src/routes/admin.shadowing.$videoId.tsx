import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, Fragment } from "react";
import { adminShadowingApi } from "@/lib/api/shadowing";
import {
  ArrowLeft,
  Video,
  Layers,
  Languages,
  Play,
  Pause,
  Clock,
  Settings,
  Trash2,
  Plus,
  RefreshCw,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Eye,
  Settings2,
  Save,
  Volume2,
  Edit3,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  type ShadowingVideo,
  type SentenceItem,
  type VideoStatus,
  type JLPTLevel,
  type DifficultyLevel
} from "@/types/shadowing";

export const Route = createFileRoute("/admin/shadowing/$videoId")({
  component: AdminVideoDetailPage,
});

function AdminVideoDetailPage() {
  const { videoId } = Route.useParams();
  const navigate = useNavigate();
  
  // Data states
  const [video, setVideo] = useState<ShadowingVideo | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [subtitleMode, setSubtitleMode] = useState<"japanese" | "vietnamese" | "both" | "off">("both");
  
  // Editor Panel states
  const [viewLanguage, setViewLanguage] = useState<"japanese" | "vietnamese" | "both">("both");
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals & Save states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load video & subtitles on mount
  useEffect(() => {
    let active = true;
    async function fetchVideoData() {
      try {
        const vidData = await adminShadowingApi.getVideo(videoId);
        let sentences: SentenceItem[] = [];
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
              sentences = json.data.segments.map((s: any) => ({
                id: s.id.toString(),
                startTime: s.startTime,
                endTime: s.endTime,
                japanese: s.jpText || "",
                vietnamese: s.vnText || ""
              }));
            }
          }
        } catch (e) {
          console.error("Failed to load sentences for detail page:", e);
        }

        if (!active) return;
        
        let status = (vidData.status || "processing").toLowerCase() as VideoStatus;
        if (status === "ready" || status === "completed" || status === "published" || status === "draft") {
          status = "completed";
        } else if (status === "pending" || status === "processing") {
          status = "processing";
        } else {
          status = "failed";
        }

        const mapped: ShadowingVideo = {
          id: vidData.id,
          title: vidData.title,
          description: vidData.description ?? "",
          jlptLevel: (vidData.jlptLevel || "N5") as JLPTLevel,
          lesson: vidData.lesson || "Lesson 1",
          difficulty: (vidData.difficulty || "Beginner") as DifficultyLevel,
          duration: vidData.duration ? `${Math.floor(vidData.duration / 60)}:${String(vidData.duration % 60).padStart(2, "0")}` : "0:00",
          thumbnail: vidData.thumbnailUrl ?? "",
          status: status,
          storagePath: vidData.storagePath ?? "",
          videoUrl: vidData.videoUrl ?? "",
          createdDate: vidData.createdAt ? new Date(vidData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          updatedDate: new Date().toLocaleDateString(),
          tags: [],
          sentences: sentences,
          statistics: {
            totalStudents: 0,
            completedCount: 0,
            averageScore: 0,
            averageCompletionTime: "0:00"
          }
        };

        setVideo(mapped);
      } catch (err) {
        console.error("Failed to fetch video detail page:", err);
      }
    }
    fetchVideoData();
    return () => {
      active = false;
    };
  }, [videoId]);

  // Video playback listeners
  const onTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  // Find active sentence based on currentTime
  const activeSentence = video?.sentences.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  // Auto-scroll active card into view
  useEffect(() => {
    if (autoScroll && activeSentence) {
      const element = document.getElementById(`sentence-${activeSentence.id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeSentence?.id, autoScroll]);

  if (!video) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-destructive">Video Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested shadowing lesson may have been deleted or the link is invalid.</p>
        <Link to="/admin/shadowing">
          <Button className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl mt-4">
            Return to Shadowing List
          </Button>
        </Link>
      </div>
    );
  }

  // Update actions
  const handleUpdateSentenceField = (id: string, field: keyof SentenceItem, val: any) => {
    setVideo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sentences: prev.sentences.map(s => s.id === id ? { ...s, [field]: val } : s)
      };
    });
  };

  const handleUpdateStartTime = (id: string, val: number) => {
    handleUpdateSentenceField(id, "startTime", val);
  };

  const handleUpdateEndTime = (id: string, val: number) => {
    handleUpdateSentenceField(id, "endTime", val);
  };

  const handleUpdateJapanese = (id: string, val: string) => {
    handleUpdateSentenceField(id, "japanese", val);
  };

  const handleUpdateVietnamese = (id: string, val: string) => {
    handleUpdateSentenceField(id, "vietnamese", val);
  };

  const handleAddSentence = () => {
    setVideo(prev => {
      if (!prev) return null;
      const newId = Math.random().toString(36).substr(2, 9);
      const last = prev.sentences[prev.sentences.length - 1];
      const start = last ? last.endTime + 0.5 : 0;
      return {
        ...prev,
        sentences: [
          ...prev.sentences,
          { id: newId, startTime: start, endTime: start + 4, japanese: "日本語の文", vietnamese: "Phụ đề dịch mới" }
        ]
      };
    });
  };

  const handleDeleteSentence = (id: string) => {
    setVideo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sentences: prev.sentences.filter(s => s.id !== id)
      };
    });
  };

  const handleMergeWithNext = (index: number) => {
    if (index >= video.sentences.length - 1) return;
    const current = video.sentences[index];
    const next = video.sentences[index + 1];
    const merged = {
      ...current,
      endTime: next.endTime,
      japanese: `${current.japanese} ${next.japanese}`,
      vietnamese: `${current.vietnamese} ${next.vietnamese}`
    };
    setVideo(prev => {
      if (!prev) return null;
      const copy = [...prev.sentences];
      copy.splice(index, 2, merged);
      return { ...prev, sentences: copy };
    });
  };

  const handleSplitSentence = (index: number) => {
    const current = video.sentences[index];
    const midTime = Math.round(((current.startTime + current.endTime) / 2) * 10) / 10;
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
    setVideo(prev => {
      if (!prev) return null;
      const copy = [...prev.sentences];
      copy.splice(index, 1, first, second);
      return { ...prev, sentences: copy };
    });
  };

  const handleSaveWorkspace = async (publishStatus: VideoStatus) => {
    setIsSaving(true);
    try {
      const payload = {
        title: video.title,
        description: video.description,
        jlptLevel: video.jlptLevel,
        difficulty: video.difficulty,
        lesson: video.lesson,
        status: publishStatus,
        sentences: video.sentences.map(s => ({
          startTime: s.startTime,
          endTime: s.endTime,
          jpText: s.japanese,
          vnText: s.vietnamese
        }))
      };
      await adminShadowingApi.updateVideo(video.id, payload);
      setVideo(prev => prev ? { ...prev, status: publishStatus } : null);
    } catch (err) {
      console.error("Failed to save workspace modifications:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await adminShadowingApi.deleteVideo(video.id);
      setIsDeleteOpen(false);
      navigate({ to: "/admin/shadowing" });
    } catch (err) {
      console.error("Failed to delete video:", err);
    }
  };

  // Filter subtitles based on search query
  const filteredSentences = video.sentences.filter(s =>
    s.japanese.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.vietnamese.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl border border-white/10 dark:border-slate-800/40 p-4 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <Link to="/admin/shadowing" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Shadowing Library
          </Link>
          <h2 className="text-lg font-black text-foreground max-w-xl truncate mt-1">
            {video.title}
          </h2>
        </div>
        <Badge variant={video.status === "completed" ? "secondary" : video.status === "processing" ? "default" : "destructive"} className="font-bold text-xs uppercase px-2.5 py-1 rounded-lg">
          {video.status}
        </Badge>
      </div>

      {/* 2. SPLIT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN (60%): Large responsive video player & controls */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-black shadow-lg shadow-black/20 group">
            <video
              ref={videoRef}
              id="preview-video"
              className="w-full h-full object-contain"
              src={video.videoUrl}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onClick={handlePlayPause}
            />

            {/* Subtitle Overlay directly on video - no frame */}
            {subtitleMode !== "off" && activeSentence && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center max-w-[90%] pointer-events-none z-10 select-none">
                {(subtitleMode === "japanese" || subtitleMode === "both") && (
                  <p className="text-white text-xl sm:text-2xl font-bold font-sans leading-relaxed drop-shadow-lg">
                    {activeSentence.japanese}
                  </p>
                )}
                {(subtitleMode === "vietnamese" || subtitleMode === "both") && (
                  <p className="text-emerald-300 text-sm sm:text-base font-medium mt-1 leading-normal drop-shadow-lg">
                    {activeSentence.vietnamese}
                  </p>
                )}
              </div>
            )}

            {/* Overlay badge */}
            <div className="absolute top-4 left-4 pointer-events-none">
              <Badge className="bg-black/75 text-white border border-white/10 flex items-center gap-1.5 text-[10px]">
                <Languages className="w-3.5 h-3.5 text-primary" />
                Active Overlay
              </Badge>
            </div>
          </div>

          {/* Timeline and Controls Card */}
          <Card className="border border-[var(--border)] bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl p-5 rounded-2xl shadow-sm">
            <div className="space-y-4">
              {/* Timeline Seek bar */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono text-muted-foreground w-11 shrink-0">
                  {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="flex-1 accent-primary h-1 rounded-lg cursor-pointer bg-slate-200 dark:bg-slate-800"
                />
                <span className="text-[10px] font-bold font-mono text-muted-foreground w-11 shrink-0 text-right">
                  {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
                </span>
              </div>

              {/* Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handlePlayPause}
                    className="w-10 h-10 rounded-xl border-[var(--border)] text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4.5 h-4.5 fill-current" /> : <Play className="w-4.5 h-4.5 fill-current" />}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  {/* Playback speed */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Speed</span>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                      className="text-xs font-bold rounded-lg border border-[var(--border)] bg-slate-50 dark:bg-slate-900 px-2 py-1 h-8 focus:outline-none cursor-pointer"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                    </select>
                  </div>

                  {/* Subtitle toggle */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Subtitles</span>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-[var(--border)]">
                      {[
                        { mode: "both", label: "All" },
                        { mode: "japanese", label: "JP" },
                        { mode: "vietnamese", label: "VN" },
                        { mode: "off", label: "Off" }
                      ].map((opt) => (
                        <button
                          key={opt.mode}
                          onClick={() => setSubtitleMode(opt.mode as never)}
                          className={`text-[9px] font-extrabold px-2 py-1 rounded cursor-pointer transition-all ${
                            subtitleMode === opt.mode
                              ? "bg-primary text-white shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN (40%): Transcript Editor */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <Card className="border border-[var(--border)] bg-white/40 dark:bg-slate-900/35 backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col justify-between h-full min-h-[500px]">
            {/* Top controls header */}
            <div className="p-5 border-b border-[var(--border)]/60 bg-white/60 dark:bg-slate-950/40 space-y-4 shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Subtitle Editor
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSentence}
                  className="rounded-xl text-[11px] font-bold h-8 border-primary/30 text-primary hover:bg-primary/5 px-2.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Segment
                </Button>
              </div>

              {/* Language Radio Selector */}
              <div className="flex flex-col gap-1.5 border-t border-b border-[var(--border)]/40 py-2.5">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Language selector</span>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-foreground/80">
                  {[
                    { value: "japanese", label: "Japanese" },
                    { value: "vietnamese", label: "Vietnamese" },
                    { value: "both", label: "Both" }
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="viewLanguage"
                        value={opt.value}
                        checked={viewLanguage === opt.value}
                        onChange={() => setViewLanguage(opt.value as any)}
                        className="accent-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className={viewLanguage === opt.value ? "text-primary" : ""}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Search & Auto-Scroll */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search subtitles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 flex h-9 w-full rounded-xl border border-[var(--border)] bg-slate-50 dark:bg-slate-950 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>

                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`h-9 px-3 rounded-xl border text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                    autoScroll
                      ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                      : "border-[var(--border)] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  AutoScroll
                </button>
              </div>
            </div>

            {/* Subtitle segment list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[440px] scrollbar-thin">
              {filteredSentences.map((sen, index) => {
                const isActive = activeSentence?.id === sen.id;
                return (
                  <div
                    key={sen.id}
                    id={`sentence-${sen.id}`}
                    onClick={(e) => {
                      // Only seek if clicking outside input boxes or buttons
                      if (
                        (e.target as HTMLElement).tagName !== "INPUT" &&
                        (e.target as HTMLElement).tagName !== "BUTTON" &&
                        !(e.target as HTMLElement).closest("button")
                      ) {
                        handleSeek(sen.startTime);
                      }
                    }}
                    className={`border p-4 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-1 cursor-pointer ${
                      isActive
                        ? "bg-primary/5 dark:bg-primary/10 border-primary/45 ring-1 ring-primary/20"
                        : "bg-white dark:bg-slate-950 border-[var(--border)]"
                    }`}
                  >
                    {/* Timing inputs */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-[var(--border)]/50">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-slate-50 dark:bg-slate-900 border border-[var(--border)] rounded-lg px-2.5 py-1">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <input
                          type="number"
                          step="0.1"
                          value={sen.startTime}
                          onChange={(e) => handleUpdateStartTime(sen.id, parseFloat(e.target.value) || 0)}
                          className="w-12 bg-transparent text-center font-mono focus:outline-none text-foreground"
                        />
                        <span>s -</span>
                        <input
                          type="number"
                          step="0.1"
                          value={sen.endTime}
                          onChange={(e) => handleUpdateEndTime(sen.id, parseFloat(e.target.value) || 0)}
                          className="w-12 bg-transparent text-center font-mono focus:outline-none text-foreground"
                        />
                        <span>s</span>
                      </div>

                      {/* Side tools */}
                      <span className="text-[10px] font-mono font-bold text-muted-foreground/60">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Subtitle Text inputs (Inline editing) */}
                    <div className="space-y-2">
                      {(viewLanguage === "japanese" || viewLanguage === "both") && (
                        <div className="relative">
                          <span className="absolute left-2 top-2.5 text-[8px] font-black text-primary/80 uppercase tracking-wider w-4 text-center">JP</span>
                          <input
                            type="text"
                            value={sen.japanese}
                            onChange={(e) => handleUpdateJapanese(sen.id, e.target.value)}
                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          />
                        </div>
                      )}
                      {(viewLanguage === "vietnamese" || viewLanguage === "both") && (
                        <div className="relative">
                          <span className="absolute left-2 top-2.5 text-[8px] font-black text-emerald-600/80 uppercase tracking-wider w-4 text-center">VN</span>
                          <input
                            type="text"
                            value={sen.vietnamese}
                            onChange={(e) => handleUpdateVietnamese(sen.id, e.target.value)}
                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions panel */}
                    <div className="flex items-center justify-between gap-2 border-t border-[var(--border)]/40 pt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSeek(sen.startTime)}
                          className="w-8 h-8 rounded-lg hover:bg-primary/10 text-primary cursor-pointer"
                          title="Seek & Play"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const input = document.querySelector(`#sentence-${sen.id} input[type="text"]`) as HTMLInputElement;
                            if (input) input.focus();
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Focus Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteSentence(sen.id)}
                          className="w-8 h-8 rounded-lg hover:bg-destructive/10 text-destructive/80 hover:text-destructive cursor-pointer"
                          title="Delete Segment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {index < video.sentences.length - 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleMergeWithNext(index)}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Merge with next segment"
                          >
                            <Layers className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSplitSentence(index)}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Split segment"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

      </div>

      {/* 3. PERSISTENT ACTION BAR */}
      <div className="sticky bottom-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-[var(--border)] py-4 px-6 rounded-2xl shadow-xl mt-6 flex justify-between items-center transition-all">
        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            Duration: <strong className="text-foreground">{video.duration}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Badge className="bg-primary/10 text-primary border-primary/20">{video.jlptLevel}</Badge>
          </span>
          <span>Sentences: <strong className="text-foreground">{video.sentences.length}</strong></span>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => handleSaveWorkspace("completed")}
            className="rounded-xl text-xs font-bold h-9 border-[var(--border)] text-foreground hover:bg-slate-100 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Save Draft
          </Button>
          <Button
            disabled={isSaving}
            onClick={() => handleSaveWorkspace("published")}
            className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs h-9 px-5 shadow-lg shadow-primary/10 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-1" />
            )}
            Publish Lesson
          </Button>
        </div>
      </div>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-950 border border-[var(--border)] text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delete Shadowing Lesson?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal">
              Are you sure you want to permanently delete this lesson? This action cannot be undone. All segments and student completion data associated with this lesson will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl border-[var(--border)] cursor-pointer">Cancel</Button>
            <Button onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl cursor-pointer">Delete Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
