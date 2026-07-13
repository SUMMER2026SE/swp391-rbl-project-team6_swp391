import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { 
  Video, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  Mic, 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  EyeOff,
  Layout,
  Clock, 
  X, 
  Play, 
  Pause, 
  Upload, 
  Volume2, 
  Info,
  ArrowLeft,
  Loader2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { adminShadowingApi } from "@/lib/api/shadowing";
import { cn } from "@/lib/utils";

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface ShadowingLesson {
  id: string;
  title: string;
  topic: string;
  duration: string;
  createdAt: string;
  thumbnail: string;
  status: "completed" | "processing" | "failed";
  level: string; // "N5", "N4", "N3", etc.
  isAiGenerated: boolean;
  videoUrl?: string;
  transcript?: TranscriptSegment[];
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  jpText: string;
  romaji?: string;
  vnText: string;
}

interface AdminShadowingManagementProps {
  defaultLevel?: string;
  onBack?: () => void;
}

// Helper to format duration from seconds to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Map backend status step name to frontend state
function mapStepStatus(status?: string): "pending" | "processing" | "completed" | "failed" {
  if (!status) return "pending";
  if (status === "COMPLETED") return "completed";
  if (status === "STARTED") return "processing";
  if (status === "FAILED") return "failed";
  return "pending";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// 1. Statistic Card
export function StatisticCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  iconBg 
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="glass-card p-5 flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className="text-2xl font-black text-primary-col">{value}</div>
      </div>
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
    </div>
  );
}

// 2. Search & Filters Bar
export function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedTopic,
  setSelectedTopic,
  selectedStatus,
  setSelectedStatus,
  selectedSort,
  setSelectedSort
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedTopic: string;
  setSelectedTopic: (v: string) => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  selectedSort: string;
  setSelectedSort: (v: string) => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card/20 p-4 rounded-2xl border border-[var(--border)]">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search Lesson..."
          className="pl-9 bg-background/50 border-[var(--border)] rounded-xl h-10 w-full text-sm placeholder:text-muted-foreground/60"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Topic Filter */}
        <div className="w-full sm:w-[160px]">
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm cursor-pointer">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-[var(--border)] rounded-xl">
              <SelectItem value="all">All Topics</SelectItem>
              <SelectItem value="Social & Business">Social & Business</SelectItem>
              <SelectItem value="Daily Life">Daily Life</SelectItem>
              <SelectItem value="Travel">Travel</SelectItem>
              <SelectItem value="Academic">Academic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-[140px]">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm cursor-pointer">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-[var(--border)] rounded-xl">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Filter */}
        <div className="w-full sm:w-[160px]">
          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm cursor-pointer">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-[var(--border)] rounded-xl">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="duration-asc">Duration (Short to Long)</SelectItem>
              <SelectItem value="duration-desc">Duration (Long to Short)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// 3. Shadowing Card
export function ShadowingCard({
  lesson,
  onPreview,
  onDelete
}: {
  lesson: ShadowingLesson;
  onPreview: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="glass-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Left: Thumbnail (16:9) */}
      <div className="relative w-full md:w-44 aspect-video rounded-2xl overflow-hidden bg-muted border border-[var(--border)] shrink-0 shadow-inner">
        <img 
          src={lesson.thumbnail} 
          alt={lesson.title} 
          className="w-full h-full object-cover select-none"
        />
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/65 backdrop-blur-[2px] text-[10px] font-bold text-white flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {lesson.duration}
        </div>
      </div>

      {/* Center: Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {lesson.isAiGenerated && (
            <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-2 py-0.5 rounded-full font-black select-none hover:bg-primary/15 transition-colors">
              AI Generated
            </Badge>
          )}
          <Badge 
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-black border-0 select-none",
              lesson.status === "completed" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15",
              lesson.status === "processing" && "bg-amber-500/10 text-amber-500 hover:bg-amber-500/15",
              lesson.status === "failed" && "bg-rose-500/10 text-rose-500 hover:bg-rose-500/15"
            )}
          >
            {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
          </Badge>
        </div>
        <h3 className="font-bold text-base text-primary-col truncate md:pr-4" title={lesson.title}>
          {lesson.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Topic: <strong className="font-semibold text-secondary-col">{lesson.topic}</strong></span>
          <span className="hidden sm:inline opacity-40">•</span>
          <span>Created: {lesson.createdAt}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-2 shrink-0 self-end md:self-auto w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-[var(--border)]">
        <Button 
          variant="outline" 
          size="sm"
          className="rounded-xl h-9 px-4 font-bold border-[var(--border)] bg-background/40 hover:bg-accent text-secondary-col cursor-pointer transition flex items-center gap-1.5"
          onClick={onPreview}
          disabled={lesson.status !== "completed"}
        >
          <Eye className="w-4 h-4" />
          Preview
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="rounded-xl h-9 w-9 p-0 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground hover:border-0 cursor-pointer transition flex items-center justify-center"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// 4. Empty State
export function EmptyState({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto mt-8">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/60 mb-2">
        <Mic className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-primary-col">No Shadowing Lessons Yet</h3>
      <p className="text-sm text-secondary-col max-w-sm">
        Upload your first video to generate an AI Shadowing lesson.
      </p>
      <Button 
        onClick={onUploadClick}
        className="bg-gradient-to-r from-primary to-sakura text-white hover:opacity-95 rounded-xl px-5 h-10 border-0 flex items-center gap-2 cursor-pointer font-bold shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Upload Video
      </Button>
    </div>
  );
}

// ─── Video Uploader Component ────────────────────────────────────────────────
interface VideoUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  lessonTitle: string;
  setLessonTitle: (v: string) => void;
  lessonTopic: string;
  setLessonTopic: (v: string) => void;
  lessonDescription: string;
  setLessonDescription: (v: string) => void;
  isProcessing: boolean;
  currentLevel: string;
}

export function VideoUploader({
  onFileSelect,
  selectedFile,
  lessonTitle,
  setLessonTitle,
  lessonTopic,
  setLessonTopic,
  lessonDescription,
  setLessonDescription,
  isProcessing,
  currentLevel
}: VideoUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedExts = ["mp4", "mov", "avi"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    
    if (!allowedExts.includes(ext)) {
      toast.error("Invalid file type. Only MP4, MOV, and AVI videos are supported.");
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size allowed is 500MB.");
      return;
    }

    onFileSelect(file);
    if (!lessonTitle) {
      setLessonTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left: Drag Drop Area */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-secondary-col">Upload Source Video</Label>
        
        {!selectedFile ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed border-[var(--border)] rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] transition-all bg-card/10 hover:bg-card/20",
              isDragActive && "border-primary bg-primary/5 scale-[1.01]"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="video/mp4,video/quicktime,video/x-msvideo"
              disabled={isProcessing}
              onChange={handleChange}
            />
            <Upload className="w-10 h-10 text-muted-foreground/60 mb-3" />
            <h4 className="text-sm font-bold text-primary-col mb-1">Drag & Drop Video Here</h4>
            <p className="text-xs text-muted-foreground mb-4">or click to browse files</p>
            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-[var(--border)]">
              MP4 • MOV • AVI • Max 500MB
            </Badge>
          </div>
        ) : (
          <div className="border border-[var(--border)] bg-card/20 rounded-2xl p-5 min-h-[260px] flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-sm font-bold text-primary-col truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Size: {formatBytes(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                    Ready to upload
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="outline"
                onClick={() => onFileSelect(null)}
                disabled={isProcessing}
                className="rounded-xl h-9 text-xs border-[var(--border)] font-bold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition"
              >
                Remove File
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Metadata Form */}
      <div className="space-y-4">
        <Label className="text-sm font-bold text-secondary-col flex items-center gap-1.5">
          <Info className="w-4 h-4 text-primary" />
          Lesson Metadata
        </Label>
        
        <div className="glass-card p-5 space-y-4 border border-[var(--border)]">
          {/* Lesson Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-bold text-muted-foreground">Lesson Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Intro Greeting Dialogue"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              disabled={isProcessing}
              className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm focus:ring-0"
            />
          </div>

          {/* Topic & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">JLPT Level *</Label>
              <Input
                value={`${currentLevel} Level`}
                disabled
                className="bg-muted/30 border-[var(--border)] rounded-xl h-10 text-sm font-bold select-none cursor-not-allowed opacity-80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Topic *</Label>
              <Select value={lessonTopic} onValueChange={setLessonTopic} disabled={isProcessing}>
                <SelectTrigger className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-[var(--border)] rounded-xl">
                  <SelectItem value="Daily Conversation">Daily Conversation</SelectItem>
                  <SelectItem value="Social & Business">Social & Business</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs font-bold text-muted-foreground">Description</Label>
            <textarea
              id="desc"
              placeholder="Brief lesson guidelines or notes..."
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
              disabled={isProcessing}
              className="w-full min-h-[90px] bg-background/50 border border-[var(--border)] rounded-xl p-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Processing Progress Component ───────────────────────────────────────────
interface ProcessingProgressProps {
  status: "pending" | "processing" | "completed" | "failed";
  progressPercent: number;
  steps: {
    id: string;
    label: string;
    status: "pending" | "processing" | "completed" | "failed";
  }[];
}

export function ProcessingProgress({ status, progressPercent, steps }: ProcessingProgressProps) {
  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>Overall Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden border border-[var(--border)] p-[1px]">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-primary to-sakura transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stepper Pipeline (Horizontal) */}
      <div className="flex flex-row items-start justify-between gap-1 overflow-x-auto pb-4 pt-2 min-w-full scrollbar-thin">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            {/* Step Element */}
            <div className="flex flex-col items-center text-center space-y-2 min-w-[70px] flex-1">
              {/* Step Circle */}
              <div className="relative flex items-center justify-center">
                {step.status === "completed" && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                {step.status === "processing" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary text-primary flex items-center justify-center animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="w-8 h-8 rounded-full bg-muted border border-muted-foreground/35 flex items-center justify-center" />
                )}
                {step.status === "failed" && (
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center animate-bounce">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Step Label */}
              <div className="space-y-0.5">
                <div className={cn(
                  "text-[10px] font-black leading-tight max-w-[80px]",
                  step.status === "completed" && "text-emerald-500",
                  step.status === "processing" && "text-primary",
                  step.status === "failed" && "text-rose-500",
                  step.status === "pending" && "text-muted-foreground"
                )}>
                  {step.label}
                </div>
                <div className="text-[9px] text-muted-foreground/80 font-medium">
                  {step.status === "completed" && "Completed"}
                  {step.status === "processing" && "Processing"}
                  {step.status === "pending" && "Pending"}
                  {step.status === "failed" && "Failed"}
                </div>
              </div>
            </div>

            {/* Dashed Connector Line */}
            {idx < steps.length - 1 && (
              <div className="hidden sm:block flex-1 h-[2px] border-t-2 border-dashed border-[var(--border)] mt-4 self-start min-w-[20px]" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Transcript Table Component ──────────────────────────────────────────────
interface TranscriptTableProps {
  segments: TranscriptSegment[];
}

export function TranscriptTable({ segments }: TranscriptTableProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-bold text-secondary-col flex items-center gap-1.5">
        <Volume2 className="w-4 h-4 text-primary" />
        AI Generated Transcript
      </Label>
      
      <div className="glass-card overflow-hidden border border-[var(--border)] rounded-2xl">
        <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-[var(--border)]">
                <th className="p-3 text-xs font-bold text-muted-foreground w-[120px] uppercase">Time</th>
                <th className="p-3 text-xs font-bold text-muted-foreground uppercase">Transcript</th>
              </tr>
            </thead>
            <tbody>
              {segments.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-xs text-muted-foreground">
                    No transcript segments found.
                  </td>
                </tr>
              ) : (
                segments.map((seg, idx) => (
                  <tr 
                    key={seg.id} 
                    className={cn(
                      "border-b border-[var(--border)] last:border-0 hover:bg-muted/10 transition-colors",
                      idx % 2 === 1 && "bg-muted/5"
                    )}
                  >
                    <td className="p-3 text-xs font-mono font-bold text-primary select-none align-top">
                      {formatDuration(seg.startTime)}
                    </td>
                    <td className="p-3 space-y-1 align-top">
                      <div className="text-sm font-bold text-primary-col leading-relaxed">
                        {seg.jpText}
                      </div>
                      <div className="text-xs text-secondary-col leading-relaxed pl-2 border-l-2 border-primary/20">
                        {seg.vnText}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Lesson Actions Component ────────────────────────────────────────────────
interface LessonActionsProps {
  status: "pending" | "processing" | "completed" | "failed";
  onPreview: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function LessonActions({ status, onPreview, onSave, onCancel }: LessonActionsProps) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-6">
      {/* Left Area: Cancel always visible */}
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="rounded-xl h-10 px-5 border-[var(--border)] font-bold text-sm text-secondary-col bg-background/50 hover:bg-accent transition cursor-pointer"
      >
        Cancel
      </Button>

      {/* Right Area: Preview & Save */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPreview}
          disabled={status !== "completed"}
          className="rounded-xl h-10 px-5 border-[var(--border)] font-bold text-sm text-secondary-col bg-background/50 hover:bg-accent transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4" />
          Preview Lesson
        </Button>
        
        <Button
          type="button"
          onClick={onSave}
          disabled={status !== "completed"}
          className="rounded-xl h-10 px-6 border-0 font-bold text-sm text-white bg-gradient-to-r from-primary to-sakura hover:opacity-95 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Lesson
        </Button>
      </div>
    </div>
  );
}

// ─── Main CreateShadowingLessonPage Sub-view ────────────────────────────────
interface CreateShadowingLessonPageProps {
  currentLevel: string;
  onBack: () => void;
  onSave: (videoId: string) => void;
  onPreview: (lesson: ShadowingLesson) => void;
}

export function CreateShadowingLessonPage({
  currentLevel,
  onBack,
  onSave,
  onPreview
}: CreateShadowingLessonPageProps) {
  // Form values
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonLevel, setLessonLevel] = useState(currentLevel);
  const [lessonDifficulty, setLessonDifficulty] = useState("MEDIUM");

  // Processing States
  const [pipelineStatus, setPipelineStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending");
  const [progressPercent, setProgressPercent] = useState(0);
  const [newLessonData, setNewLessonData] = useState<ShadowingLesson | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Pagination & Tabs for transcript table
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"jp" | "vn">("jp");
  const itemsPerPage = 5;

  const [steps, setSteps] = useState([
    { id: "upload", label: "Upload Video", status: "pending" as const },
    { id: "audio", label: "Extract Audio", status: "pending" as const },
    { id: "speech", label: "Speech Recognition", status: "pending" as const },
    { id: "jp", label: "Generate Japanese Transcript", status: "pending" as const },
    { id: "vn", label: "Translate to Vietnamese", status: "pending" as const },
    { id: "split", label: "Split Sentences", status: "pending" as const },
    { id: "db", label: "Save Database", status: "pending" as const },
    { id: "ready", label: "Ready", status: "pending" as const }
  ]);

  // Poll status from the backend using real API client
  useEffect(() => {
    if (!videoId || pipelineStatus !== "processing") return;

    const interval = setInterval(async () => {
      try {
        const fresh = await adminShadowingApi.getProcessingStatus(videoId);
        
        // Map logs to checklist steps
        const logMap = new Map<string, string>();
        if (fresh.logs) {
          fresh.logs.forEach(log => {
            logMap.set(log.step, log.status);
          });
        }

        const updatedSteps = [
          { 
            id: "upload", 
            label: "Upload Video", 
            status: "completed" as const 
          },
          { 
            id: "audio", 
            label: "Extract Audio", 
            status: mapStepStatus(logMap.get("EXTRACT_AUDIO")) 
          },
          { 
            id: "speech", 
            label: "Speech Recognition", 
            status: mapStepStatus(logMap.get("TRANSCRIBE")) 
          },
          { 
            id: "jp", 
            label: "Generate Japanese Transcript", 
            status: mapStepStatus(logMap.get("TRANSCRIBE")) 
          },
          { 
            id: "vn", 
            label: "Translate to Vietnamese", 
            status: mapStepStatus(logMap.get("TRANSLATE")) 
          },
          { 
            id: "split", 
            label: "Split Sentences", 
            status: mapStepStatus(logMap.get("TRANSLATE") === "COMPLETED" ? (logMap.get("SAVE_DATABASE") || "STARTED") : "PENDING") 
          },
          { 
            id: "db", 
            label: "Save Database", 
            status: mapStepStatus(logMap.get("SAVE_DATABASE")) 
          },
          { 
            id: "ready", 
            label: "Ready", 
            status: fresh.status === "COMPLETED" ? ("completed" as const) : ("pending" as const)
          }
        ];

        setSteps(updatedSteps);

        // Calculate progress percentage
        const completedCount = updatedSteps.filter(s => s.status === "completed").length;
        
        let percent = 0;
        if (completedCount <= 1) percent = 12.5;
        else if (completedCount === 2) percent = 25;
        else if (completedCount === 3) percent = 37.5;
        else if (completedCount === 4) percent = 50;
        else if (completedCount === 5) percent = 62.5;
        else if (completedCount === 6) percent = 75;
        else if (completedCount === 7) percent = 87.5;
        else if (completedCount === 8) percent = 100;

        setProgressPercent(percent);

        if (fresh.status === "COMPLETED") {
          clearInterval(interval);
          setPipelineStatus("completed");
          toast.success("AI Shadowing lesson created successfully!");
          fetchTranscript(videoId);
        } else if (fresh.status === "FAILED") {
          clearInterval(interval);
          setPipelineStatus("failed");
          toast.error("AI pipeline processing failed: " + (fresh.errorMessage || "Unknown error"));
        }
      } catch (err: any) {
        console.error("Error fetching status from backend: ", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [videoId, pipelineStatus]);

  // Fetch the real transcript segments after completed
  const fetchTranscript = async (id: string) => {
    try {
      const res = await fetch(`/api/student/shadowing/videos/${id}/transcript`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load transcript: ${res.status}`);
      }

      const json = await res.json();
      if (json.data && json.data.segments) {
        const segments: TranscriptSegment[] = json.data.segments.map((s: any) => ({
          id: s.id.toString(),
          startTime: s.startTime,
          endTime: s.endTime,
          jpText: s.jpText || "",
          romaji: s.romaji || "",
          vnText: s.vnText || ""
        }));
        
        setNewLessonData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: "completed" as const,
            transcript: segments
          };
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not fetch transcript segments.");
    }
  };

  const handleGenerateTranscript = async () => {
    if (!selectedFile) return;

    setPipelineStatus("processing");
    setProgressPercent(12.5);
    setSteps([
      { id: "upload", label: "Upload Video", status: "completed" as const },
      { id: "audio", label: "Extract Audio", status: "processing" as const },
      { id: "speech", label: "Speech Recognition", status: "pending" as const },
      { id: "jp", label: "Generate Japanese Transcript", status: "pending" as const },
      { id: "vn", label: "Translate to Vietnamese", status: "pending" as const },
      { id: "split", label: "Split Sentences", status: "pending" as const },
      { id: "db", label: "Save Database", status: "pending" as const },
      { id: "ready", label: "Ready", status: "pending" as const }
    ]);

    const toastId = toast.loading("Uploading video and starting AI pipeline...");
    try {
      const formData = new FormData();
      formData.append("title", lessonTitle.trim());
      formData.append("description", lessonDescription.trim() || `Shadowing lesson for ${lessonLevel}`);
      formData.append("video", selectedFile);

      // 1. Upload Video via real backend service client
      const uploadedVideo = await adminShadowingApi.uploadVideo(formData);
      
      // 2. Update level, topic, and difficulty via real backend update API
      await adminShadowingApi.updateVideo(uploadedVideo.id, {
        jlptLevel: lessonLevel,
        topic: lessonTopic,
        difficulty: lessonDifficulty,
        description: lessonDescription
      });

      toast.success("Video uploaded successfully. AI processing started!", { id: toastId });
      
      setVideoId(uploadedVideo.id);
      
      setNewLessonData({
        id: uploadedVideo.id,
        title: lessonTitle.trim(),
        topic: lessonTopic,
        duration: "00:00",
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        thumbnail: lessonTopic === "Social & Business" 
          ? "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&q=80"
          : lessonTopic === "Travel"
          ? "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&q=80"
          : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
        status: "processing",
        level: lessonLevel,
        isAiGenerated: true,
        videoUrl: uploadedVideo.videoUrl || undefined,
        transcript: []
      });
    } catch (err: any) {
      setPipelineStatus("failed");
      toast.error(err.message || "Failed to start AI processing", { id: toastId });
    }
  };

  const handleSave = async () => {
    if (!newLessonData) return;

    const toastId = toast.loading("Publishing lesson to students...");
    try {
      await adminShadowingApi.updateVideo(videoId!, {
        status: "COMPLETED",
        title: newLessonData.title,
        topic: newLessonData.topic,
        jlptLevel: newLessonData.level,
      });
      toast.success("Lesson published!", { id: toastId });
      onSave(videoId!);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish lesson", { id: toastId });
    }
  };

  const handlePreview = () => {
    if (newLessonData) {
      onPreview(newLessonData);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedExts = ["mp4", "mov", "avi", "webm"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    
    if (!allowedExts.includes(ext)) {
      toast.error("Invalid file type. Only MP4, MOV, WebM, and AVI videos are supported.");
      return;
    }

    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size allowed is 2GB.");
      return;
    }

    setSelectedFile(file);
    if (!lessonTitle) {
      setLessonTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  // Pagination math
  const totalItems = newLessonData?.transcript?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSegments = newLessonData?.transcript?.slice(startIndex, endIndex) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col flex items-center gap-2">
            <span className="text-primary font-bold">✨</span> Create Shadowing Lesson
          </h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Upload a video, configure lesson information and generate AI subtitles automatically.
          </p>
        </div>
      <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="rounded-xl h-10 px-5 border-[var(--border)] font-bold text-sm text-secondary-col bg-background/50 hover:bg-accent transition cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!selectedFile || !lessonTitle.trim()}
          className="rounded-xl h-10 px-6 border-0 font-bold text-sm text-white bg-gradient-to-r from-primary to-sakura hover:opacity-95 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pipelineStatus === "processing" ? "Publish & Processing..." : "Create Lesson"}
        </Button>
      </div>
      </div>

      {/* 1. Lesson Information Section */}
      <div className="glass-card p-6 space-y-4 border border-[var(--border)]">
        <h3 className="text-base font-bold text-primary-col flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
            1
          </span>
          Lesson Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lesson Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-bold text-muted-foreground">Lesson Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Daily Conversation at Cafe"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              disabled={pipelineStatus !== "pending"}
              className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm focus:ring-0"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs font-bold text-muted-foreground">Description (Optional)</Label>
            <Input
              id="desc"
              placeholder="Enter a short description about this lesson..."
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
              disabled={pipelineStatus !== "pending"}
              className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm focus:ring-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* JLPT Level */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">JLPT Level *</Label>
            <Select 
              value={lessonLevel} 
              onValueChange={setLessonLevel} 
              disabled={pipelineStatus !== "pending"}
            >
              <SelectTrigger className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-[var(--border)] rounded-xl">
                <SelectItem value="N5">N5</SelectItem>
                <SelectItem value="N4">N4</SelectItem>
                <SelectItem value="N3">N3</SelectItem>
                <SelectItem value="N2">N2</SelectItem>
                <SelectItem value="N1">N1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <Label htmlFor="topic" className="text-xs font-bold text-muted-foreground">Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g. Daily Conversation, Travel"
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              disabled={pipelineStatus !== "pending"}
              className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm focus:ring-0"
            />
          </div>

          {/* Estimated Difficulty */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">Estimated Difficulty *</Label>
            <Select 
              value={lessonDifficulty} 
              onValueChange={setLessonDifficulty} 
              disabled={pipelineStatus !== "pending"}
            >
              <SelectTrigger className="bg-background/50 border-[var(--border)] rounded-xl h-10 text-sm cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-[var(--border)] rounded-xl">
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2 & 3. 2-Column Section: Video Upload & AI Processing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Column 1: Video Upload */}
        <div className="glass-card p-6 border border-[var(--border)] flex flex-col justify-between space-y-4">
          <h3 className="text-base font-bold text-primary-col flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
              2
            </span>
            Video Upload
          </h3>
          
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed border-[var(--border)] rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all bg-card/10 hover:bg-card/20",
                isDragActive && "border-primary bg-primary/5 scale-[1.01]"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                disabled={pipelineStatus !== "pending"}
                onChange={handleChange}
              />
              <Upload className="w-10 h-10 text-muted-foreground/60 mb-3" />
              <h4 className="text-sm font-bold text-primary-col mb-1">Drag & Drop your video here</h4>
              <p className="text-xs text-muted-foreground mb-4">or <span className="text-primary font-semibold">browse your computer</span></p>
              <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-[var(--border)]">
                MP4 • MOV • WebM • AVI • Max 2GB • Max duration: 60 min
              </Badge>
            </div>
          ) : (
            <div className="border border-[var(--border)] bg-card/20 rounded-2xl p-5 min-h-[220px] flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Video className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-sm font-bold text-primary-col truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Size: {formatBytes(selectedFile.size)}</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                      Ready to upload
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border)] gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedFile(null)}
                  disabled={pipelineStatus !== "pending"}
                  className="rounded-xl h-9 text-xs border-[var(--border)] font-bold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition"
                >
                  Delete
                </Button>
                <Button
                  type="button"
                  disabled={pipelineStatus !== "pending" || !selectedFile || !lessonTitle.trim()}
                  onClick={handleGenerateTranscript}
                  className="bg-gradient-to-r from-primary to-sakura text-white hover:opacity-95 border-0 rounded-xl font-bold h-9 px-4 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {pipelineStatus === "processing" ? "Processing..." : "Generate Transcript"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Column 2: AI Processing */}
        <div className="glass-card p-6 border border-[var(--border)] flex flex-col justify-between space-y-4">
          <h3 className="text-base font-bold text-primary-col flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
              3
            </span>
            AI Processing
          </h3>

          {pipelineStatus === "pending" ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 min-h-[220px]">
              <RefreshCw className="w-8 h-8 opacity-30 mb-2 animate-pulse" />
              <span className="text-xs">AI pipeline will start after video upload.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <ProcessingProgress
                status={pipelineStatus}
                progressPercent={progressPercent}
                steps={steps}
              />
              {pipelineStatus === "completed" && (
                <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 mt-2">
                  <div className="text-left space-y-1">
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      AI processing completed successfully!
                    </span>
                    <p className="text-[10px] text-muted-foreground pl-5">
                      Total: {totalItems} sentences • {newLessonData?.duration || "00:00"} duration
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Generated Transcripts Section */}
      {pipelineStatus === "completed" && (
        <div className="glass-card p-6 border border-[var(--border)] mt-6 space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-3 gap-2">
            <h3 className="text-base font-bold text-primary-col flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                4
              </span>
              Generated Transcripts
            </h3>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground">
                Total: {totalItems} sentences
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="bg-primary/10 hover:bg-primary/15 text-primary border-primary/20 rounded-xl h-9 px-4 font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-xl h-9 px-4 font-bold flex items-center gap-1.5 transition cursor-pointer text-xs shadow-sm"
              >
                Save
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)] gap-4">
            <button
              onClick={() => { setActiveTab("jp"); setCurrentPage(1); }}
              className={cn(
                "pb-2 text-xs font-bold transition-all relative cursor-pointer",
                activeTab === "jp"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-primary-col"
              )}
            >
              Japanese Transcript
            </button>
            <button
              onClick={() => { setActiveTab("vn"); setCurrentPage(1); }}
              className={cn(
                "pb-2 text-xs font-bold transition-all relative cursor-pointer",
                activeTab === "vn"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-primary-col"
              )}
            >
              Vietnamese Translation
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-[var(--border)] rounded-2xl bg-card/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-[var(--border)]">
                  <th className="p-3 text-[10px] font-black text-muted-foreground uppercase w-[60px]">#</th>
                  <th className="p-3 text-[10px] font-black text-muted-foreground uppercase w-[100px]">Start Time</th>
                  <th className="p-3 text-[10px] font-black text-muted-foreground uppercase w-[100px]">End Time</th>
                  <th className="p-3 text-[10px] font-black text-muted-foreground uppercase">
                    {activeTab === "jp" ? "Japanese (Original)" : "Vietnamese (Translation)"}
                  </th>
                  <th className="p-3 text-[10px] font-black text-muted-foreground uppercase w-[120px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSegments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                      No transcript segments found.
                    </td>
                  </tr>
                ) : (
                  paginatedSegments.map((seg, idx) => {
                    const originalIndex = startIndex + idx + 1;
                    return (
                      <tr 
                        key={seg.id} 
                        className="border-b border-[var(--border)] last:border-0 hover:bg-muted/5 transition-colors"
                      >
                        <td className="p-3 text-xs font-mono font-bold text-muted-foreground">
                          {originalIndex}
                        </td>
                        <td className="p-3 text-xs font-mono font-bold text-primary">
                          {formatDuration(seg.startTime)}
                        </td>
                        <td className="p-3 text-xs font-mono font-bold text-primary">
                          {formatDuration(seg.endTime)}
                        </td>
                        <td className="p-3 py-4 space-y-1 align-middle">
                          {activeTab === "jp" ? (
                            <>
                              <div className="text-sm font-bold text-primary-col leading-relaxed">
                                {seg.jpText}
                              </div>
                              {seg.romaji && (
                                <div className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                                  {seg.romaji}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm font-medium text-secondary-col leading-relaxed">
                              {seg.vnText}
                            </div>
                          )}
                        </td>
                        <td className="p-3 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Play Row Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePreview}
                              className="rounded-xl h-8 w-8 p-0 border-[var(--border)] hover:bg-accent text-secondary-col cursor-pointer transition flex items-center justify-center"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </Button>
                            {/* View Row Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePreview}
                              className="rounded-xl h-8 w-8 p-0 border-[var(--border)] hover:bg-accent text-secondary-col cursor-pointer transition flex items-center justify-center"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-4">
              <div className="text-xs text-muted-foreground font-semibold">
                Showing {startIndex + 1} to {endIndex} of {totalItems} sentences
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="rounded-xl h-8 w-8 p-0 cursor-pointer disabled:opacity-40"
                >
                  &lt;
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (currentPage > 3 && totalPages > 5) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum + (4 - i) > totalPages) {
                      pageNum = totalPages - 4 + i;
                    }
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "rounded-xl h-8 w-8 p-0 font-bold text-xs cursor-pointer",
                        currentPage === pageNum && "bg-primary text-white"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="text-xs text-muted-foreground px-1">...</span>
                )}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className={cn(
                      "rounded-xl h-8 w-8 p-0 font-bold text-xs cursor-pointer",
                      currentPage === totalPages && "bg-primary text-white"
                    )}
                  >
                    {totalPages}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="rounded-xl h-8 w-8 p-0 cursor-pointer disabled:opacity-40"
                >
                  &gt;
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main PreviewShadowingLessonPage Sub-view ───────────────────────────────
interface PreviewShadowingLessonPageProps {
  lesson: ShadowingLesson;
  onBack: () => void;
}

export function PreviewShadowingLessonPage({
  lesson,
  onBack
}: PreviewShadowingLessonPageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [langFilter, setLangFilter] = useState<"jp" | "vi" | "both">("both");
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [transcriptEnabled, setTranscriptEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeSentenceRef = useRef<HTMLDivElement | null>(null);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (videoRef.current && (videoRef.current as any).webkitDisplayingFullscreen)
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Re-build text track cues dynamically for native fullscreen mode
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !lesson.transcript || lesson.transcript.length === 0) return;

    let track = Array.from(video.textTracks).find(t => t.label === "midori-subs");
    if (!track) {
      track = video.addTextTrack("subtitles", "midori-subs", "vi");
    }

    // Native subtitles showing only when enabled AND video is in fullscreen.
    // When windowed, our custom React subtitle overlay is used instead to avoid double subs.
    track.mode = (subtitlesEnabled && isFullscreen) ? "showing" : "disabled";

    if (track.cues) {
      const cuesArray = Array.from(track.cues);
      cuesArray.forEach(cue => {
        track!.removeCue(cue);
      });
    }

    if (subtitlesEnabled) {
      const CueClass = window.VTTCue || window.TextTrackCue;
      if (CueClass) {
        lesson.transcript.forEach(s => {
          let text = "";
          if (langFilter === "jp") text = s.jpText;
          else if (langFilter === "vi") text = s.vnText;
          else text = `${s.jpText}\n${s.vnText}`;

          try {
            const cue = new CueClass(s.startTime, s.endTime, text);
            track!.addCue(cue);
          } catch (e) {
            console.error("Error creating cue:", e);
          }
        });
      }
    }
  }, [lesson.transcript, subtitlesEnabled, langFilter, isFullscreen]);

  // Auto-scroll logic
  useEffect(() => {
    if (activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [currentTime]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleSentenceClick = (s: TranscriptSegment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = s.startTime;
      setCurrentTime(s.startTime);
    }
  };

  const activeSubtitle = lesson.transcript?.find(
    s => currentTime >= s.startTime && currentTime < s.endTime
  );

  const getCurrentSentenceIndex = () => {
    if (!lesson.transcript || lesson.transcript.length === 0) return -1;
    const idx = lesson.transcript.findIndex(
      s => currentTime >= s.startTime && currentTime < s.endTime
    );
    if (idx !== -1) return idx;
    for (let i = lesson.transcript.length - 1; i >= 0; i--) {
      if (currentTime >= lesson.transcript[i].startTime) {
        return i;
      }
    }
    return 0;
  };

  const currentIndex = getCurrentSentenceIndex();
  const currentSentence = currentIndex !== -1 && lesson.transcript 
    ? lesson.transcript[currentIndex] 
    : null;

  const handlePrevSentence = () => {
    if (!lesson.transcript || currentIndex <= 0) return;
    const prevSeg = lesson.transcript[currentIndex - 1];
    if (videoRef.current) {
      videoRef.current.currentTime = prevSeg.startTime;
      setCurrentTime(prevSeg.startTime);
    }
  };

  const handleNextSentence = () => {
    if (!lesson.transcript || currentIndex === -1 || currentIndex >= lesson.transcript.length - 1) return;
    const nextSeg = lesson.transcript[currentIndex + 1];
    if (videoRef.current) {
      videoRef.current.currentTime = nextSeg.startTime;
      setCurrentTime(nextSeg.startTime);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] gap-4">
        <div className="flex items-start gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-10 h-10 p-0 rounded-xl hover:bg-card/30 shrink-0 flex items-center justify-center text-muted-foreground hover:text-primary-col"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-black text-primary-col">{lesson.title}</h1>
            <p className="text-xs md:text-sm text-secondary-col mt-0.5">{lesson.level} • {lesson.topic}</p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          {/* Toggle Subtitles Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
            className={cn(
              "rounded-xl h-9 px-3 font-bold border-[var(--border)] transition flex items-center gap-1.5 text-xs cursor-pointer",
              subtitlesEnabled 
                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15" 
                : "bg-background/40 hover:bg-accent text-secondary-col"
            )}
          >
            {subtitlesEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {subtitlesEnabled ? "Hide Subtitles" : "Show Subtitles"}
          </Button>



          {/* Toggle Transcript Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTranscriptEnabled(!transcriptEnabled)}
            className={cn(
              "rounded-xl h-9 px-3 font-bold border-[var(--border)] transition flex items-center gap-1.5 text-xs cursor-pointer",
              transcriptEnabled 
                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15" 
                : "bg-background/40 hover:bg-accent text-secondary-col"
            )}
          >
            <Layout className="w-4 h-4" />
            {transcriptEnabled ? "Hide Transcript" : "Show Transcript"}
          </Button>

          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full font-black select-none text-xs">
            Completed
          </Badge>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "grid gap-6 mt-6 items-start",
        transcriptEnabled ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 max-w-4xl mx-auto"
      )}>
        {/* Left Column: Video Player with YouTube Subtitles */}
        <div className={cn(
          "relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 border border-[var(--border)] shadow-lg flex items-center justify-center",
          transcriptEnabled ? "lg:col-span-8" : "w-full"
        )}>
          {lesson.videoUrl ? (
            <video
              ref={videoRef}
              src={lesson.videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              controls
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-4">
              <Video className="w-12 h-12 opacity-35 mb-2" />
              <span>No video source available</span>
            </div>
          )}

          {/* Subtitle Overlay (YouTube Style - Hidden when subtitles are turned off or in fullscreen to avoid duplicate) */}
          {subtitlesEnabled && !isFullscreen && activeSubtitle && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[85%] bg-black/75 px-4 py-2 rounded-lg text-white text-center text-sm md:text-base font-bold shadow-md select-none pointer-events-none z-10 transition-all duration-150">
              {(langFilter === "jp" || langFilter === "both") && (
                <div className="leading-relaxed">{activeSubtitle.jpText}</div>
              )}
              {(langFilter === "vi" || langFilter === "both") && activeSubtitle.vnText && (
                <div className={cn(
                  "text-xs md:text-sm text-gray-300 font-semibold",
                  langFilter === "both" && "mt-1"
                )}>
                  {activeSubtitle.vnText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Transcript Panel */}
        {transcriptEnabled && (
          <div className="flex flex-col border border-[var(--border)] rounded-2xl bg-card/20 overflow-hidden h-[400px] w-full lg:col-span-4">
            {/* Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-muted/40 gap-2 shrink-0">
              <span className="text-sm font-bold text-secondary-col flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-primary" />
                Transcript
              </span>

              {/* Language Filter Tabs */}
              <div className="flex items-center bg-background/50 border border-[var(--border)] rounded-xl p-0.5">
                <button
                  onClick={() => setLangFilter("jp")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    langFilter === "jp"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-primary-col"
                  )}
                >
                  日本語
                </button>
                <button
                  onClick={() => setLangFilter("vi")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    langFilter === "vi"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-primary-col"
                  )}
                >
                  Tiếng Việt
                </button>
                <button
                  onClick={() => setLangFilter("both")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    langFilter === "both"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-primary-col"
                  )}
                >
                  Cả hai
                </button>
              </div>
            </div>

            {/* Transcript List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {lesson.transcript && lesson.transcript.length > 0 ? (
                lesson.transcript.map((s) => {
                  const isActive = currentTime >= s.startTime && currentTime < s.endTime;
                  return (
                    <div
                      key={s.id}
                      ref={isActive ? activeSentenceRef : null}
                      onClick={() => handleSentenceClick(s)}
                      className={cn(
                        "p-3 rounded-xl border border-transparent transition-all duration-200 cursor-pointer text-left",
                        isActive
                          ? "bg-primary/10 border-primary/20 shadow-sm shadow-primary/5 translate-x-1"
                          : "hover:bg-muted/30 border-transparent"
                      )}
                    >
                      {/* Japanese */}
                      {(langFilter === "jp" || langFilter === "both") && (
                        <div className="text-sm font-bold text-primary-col mb-0.5 leading-relaxed">
                          {s.jpText}
                        </div>
                      )}
                      {/* Vietnamese */}
                      {(langFilter === "vi" || langFilter === "both") && (
                        <div className="text-xs text-secondary-col leading-relaxed">
                          {s.vnText}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground text-center p-4">
                  No transcript sentences generated for this lesson.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* NOW PLAYING Section */}
      <div className="glass-card p-6 border border-[var(--border)] mt-6 text-center space-y-4">
        <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          NOW PLAYING
        </div>
        
        <div className="min-h-[90px] flex flex-col justify-center space-y-2 px-4 max-w-2xl mx-auto">
          {currentSentence ? (
            <>
              <div className="text-xl md:text-2xl font-black text-primary-col leading-relaxed">
                {currentSentence.jpText}
              </div>
              <div className="text-sm md:text-base text-secondary-col font-medium leading-relaxed">
                {currentSentence.vnText}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              No segment playing. Play video to start.
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevSentence}
            disabled={!lesson.transcript || currentIndex <= 0}
            className="rounded-xl h-9 px-4 font-bold border-[var(--border)] bg-background/40 hover:bg-accent text-secondary-col cursor-pointer transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ◀ Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextSentence}
            disabled={!lesson.transcript || currentIndex === -1 || currentIndex >= lesson.transcript.length - 1}
            className="rounded-xl h-9 px-4 font-bold border-[var(--border)] bg-background/40 hover:bg-accent text-secondary-col cursor-pointer transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next ▶
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminShadowingManagement({ defaultLevel = "N5", onBack }: AdminShadowingManagementProps) {
  const currentLevel = defaultLevel.toUpperCase();

  // Navigation View State: "list" or "create" or "preview"
  const [view, setView] = useState<"list" | "create" | "preview">("list");
  const [previousView, setPreviousView] = useState<"list" | "create">("list");

  // Local State representing real DB items
  const [lessons, setLessons] = useState<ShadowingLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");

  // Dialog States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Focus Lesson States
  const [selectedLesson, setSelectedLesson] = useState<ShadowingLesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<ShadowingLesson | null>(null);

  // Fetch real data on mount & level change
  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const data = await adminShadowingApi.getAllVideos();
      setLessons(data.map(v => {
        let mappedStatus: "completed" | "processing" | "failed" = "processing";
        if (v.status === "COMPLETED") mappedStatus = "completed";
        if (v.status === "FAILED") mappedStatus = "failed";

        return {
          id: v.id,
          title: v.title,
          topic: v.topic || "Daily Conversation",
          duration: v.duration ? formatDuration(v.duration) : "00:00",
          createdAt: v.createdAt ? new Date(v.createdAt).toISOString().replace("T", " ").substring(0, 16) : "N/A",
          thumbnail: v.thumbnailUrl || (v.topic === "Social & Business" 
            ? "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&q=80"
            : v.topic === "Travel"
            ? "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&q=80"
            : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80"),
          status: mappedStatus,
          level: v.jlptLevel || "N5",
          isAiGenerated: true,
          videoUrl: v.videoUrl || undefined
        };
      }));
    } catch (err: any) {
      toast.error("Failed to load shadowing lessons: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [view]);

  // Statistics calculation for the current selected level
  const levelLessons = lessons.filter(l => l.level === currentLevel);
  const totalCount = levelLessons.length;
  const completedCount = levelLessons.filter(l => l.status === "completed").length;
  const processingCount = levelLessons.filter(l => l.status === "processing").length;
  const failedCount = levelLessons.filter(l => l.status === "failed").length;

  // Filtered & Sorted Lessons list
  const filteredLessons = levelLessons
    .filter(lesson => {
      const matchSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTopic = selectedTopic === "all" || lesson.topic === selectedTopic;
      const matchStatus = selectedStatus === "all" || lesson.status === selectedStatus;
      return matchSearch && matchTopic && matchStatus;
    })
    .sort((a, b) => {
      if (selectedSort === "newest") {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (selectedSort === "oldest") {
        return a.createdAt.localeCompare(b.createdAt);
      }
      if (selectedSort === "duration-asc") {
        return a.duration.localeCompare(b.duration);
      }
      if (selectedSort === "duration-desc") {
        return b.duration.localeCompare(a.duration);
      }
      return 0;
    });

  // Action: Add simulated lesson to database list
  const handleSaveNewLesson = (videoId: string) => {
    setView("list");
  };

  // Action: Delete Lesson (Real API request)
  const handleDeleteConfirm = async () => {
    if (!lessonToDelete) return;
    try {
      await adminShadowingApi.deleteVideo(lessonToDelete.id);
      setLessons(prev => prev.filter(l => l.id !== lessonToDelete.id));
      setIsDeleteOpen(false);
      setLessonToDelete(null);
      toast.success("Lesson deleted successfully.");
    } catch (err: any) {
      toast.error("Failed to delete lesson: " + err.message);
    }
  };

  const handlePreviewOpen = async (lesson: ShadowingLesson) => {
    setPreviousView(view === "preview" ? previousView : (view as "list" | "create"));
    setSelectedLesson({ ...lesson, transcript: [] });
    setView("preview");

    try {
      if (lesson.transcript && lesson.transcript.length > 0) {
        setSelectedLesson(prev => prev ? { ...prev, transcript: lesson.transcript } : null);
        return;
      }

      const res = await fetch(`/api/student/shadowing/videos/${lesson.id}/transcript`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("midori_access_token") ?? ""}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load transcript: ${res.status}`);
      }

      const json = await res.json();
      if (json.data && json.data.segments) {
        const segments: TranscriptSegment[] = json.data.segments.map((s: any) => ({
          id: s.id.toString(),
          startTime: s.startTime,
          endTime: s.endTime,
          jpText: s.jpText || "",
          vnText: s.vnText || ""
        }));
        setSelectedLesson(prev => prev ? { ...prev, transcript: segments } : null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not fetch transcript segments.");
    }
  };

  // Render Sub-view
  if (view === "create") {
    return (
      <CreateShadowingLessonPage
        currentLevel={currentLevel}
        onBack={() => setView("list")}
        onSave={handleSaveNewLesson}
        onPreview={handlePreviewOpen}
      />
    );
  }

  if (view === "preview") {
    return (
      <PreviewShadowingLessonPage
        lesson={selectedLesson!}
        onBack={() => setView(previousView)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-10 h-10 p-0 rounded-xl hover:bg-card/30 shrink-0 flex items-center justify-center text-muted-foreground hover:text-primary-col border border-[var(--border)] bg-background/40"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-primary-col">Shadowing Management</h1>
            <p className="text-sm text-secondary-col mt-1">
              Manage AI-generated Shadowing lessons created from uploaded videos.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setView("create")}
          className="bg-gradient-to-r from-primary to-sakura text-white hover:opacity-95 rounded-xl px-5 h-10 border-0 flex items-center gap-2 cursor-pointer font-bold shadow-sm w-fit self-end md:self-auto shrink-0 transition"
        >
          <Plus className="w-4 h-4" />
          Upload Video
        </Button>
      </div>

      {/* 2. Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard 
          title="Total Lessons" 
          value={totalCount} 
          icon={Video} 
          iconColor="text-sky-blue" 
          iconBg="bg-sky-blue/15" 
        />
        <StatisticCard 
          title="Completed" 
          value={completedCount} 
          icon={CheckCircle2} 
          iconColor="text-emerald-500" 
          iconBg="bg-emerald-500/10" 
        />
        <StatisticCard 
          title="Processing" 
          value={processingCount} 
          icon={RefreshCw} 
          iconColor="text-amber-500" 
          iconBg="bg-amber-500/10" 
        />
        <StatisticCard 
          title="Failed" 
          value={failedCount} 
          icon={AlertTriangle} 
          iconColor="text-rose-500" 
          iconBg="bg-rose-500/10" 
        />
      </div>

      {/* 3. Filter Bar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
      />

      {/* 4. Lesson List */}
      {isLoading ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm font-semibold text-secondary-col">Loading lessons...</span>
        </div>
      ) : filteredLessons.length === 0 ? (
        <EmptyState onUploadClick={() => setView("create")} />
      ) : (
        <div className="space-y-4">
          {filteredLessons.map(lesson => (
            <ShadowingCard
              key={lesson.id}
              lesson={lesson}
              onPreview={() => handlePreviewOpen(lesson)}
              onDelete={() => {
                setLessonToDelete(lesson);
                setIsDeleteOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-popover border-[var(--border)] rounded-2xl max-w-sm w-[95%] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Lesson?
            </DialogTitle>
            <DialogDescription className="text-sm text-secondary-col mt-2">
              Are you sure you want to delete <strong className="text-primary-col">"{lessonToDelete?.title}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border-[var(--border)] font-bold text-sm cursor-pointer h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              className="bg-rose-500 text-white hover:bg-rose-600 border-0 rounded-xl font-bold text-sm cursor-pointer h-10"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
