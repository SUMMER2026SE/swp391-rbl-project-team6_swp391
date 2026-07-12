import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  Clock,
  BookOpen,
  FileText,
  X,
  CheckCircle,
  Eye,
  Mic,
  Languages,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { studentShadowingApi } from "@/lib/api/shadowing";
import { Loader2 } from "lucide-react";
import { getTopicVn } from "../student.shadowing";

export interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech?: string;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  vocabulary: VocabularyItem[];
}

type TranscriptMode = "japanese" | "vietnamese" | "both";

export const Route = createFileRoute("/student/shadowing/video/$videoId")({
  component: VideoLearningPage,
});

function VideoLearningPage() {
  const params = Route.useParams();
  const videoId = params.videoId;
  const navigate = useNavigate();

  const [rawVideo, setRawVideo] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVideoAndTranscript = async () => {
      setIsLoading(true);
      try {
        const v = await studentShadowingApi.getVideo(videoId);
        const t = await studentShadowingApi.getTranscript(videoId);
        setRawVideo(v);
        setTranscript(t);
      } catch (err) {
        console.error("Error loading video details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadVideoAndTranscript();
  }, [videoId]);

  const video = useMemo(() => {
    if (!rawVideo) return null;
    const segments: TranscriptSegment[] = (transcript?.segments ?? []).map((s: any, idx: number) => ({
      id: s.id || idx.toString(),
      startTime: s.startTime,
      endTime: s.endTime,
      text: s.jpText,
      translation: s.vnText || "",
      vocabulary: []
    }));

    return {
      id: rawVideo.id,
      title: rawVideo.title,
      description: rawVideo.description || "",
      videoUrl: rawVideo.videoUrl,
      thumbnail: rawVideo.thumbnailUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop",
      duration: rawVideo.duration ? `${Math.floor(rawVideo.duration / 60)}:${(rawVideo.duration % 60).toString().padStart(2, "0")}` : "0:00",
      jlptLevel: rawVideo.jlptLevel || "N5",
      topic: rawVideo.topic || "General",
      titleVn: rawVideo.topic || "General",
      script: segments
    };
  }, [rawVideo, transcript]);

  const topic = useMemo(() => {
    if (!rawVideo) return null;
    return {
      id: (rawVideo.topic || "General").toLowerCase().replace(/\s+/g, "-"),
      title: rawVideo.topic || "General",
      titleVn: getTopicVn(rawVideo.topic || "General"),
      jlptLevel: rawVideo.jlptLevel || "N5"
    };
  }, [rawVideo]);

  // UI States
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcriptMode, setTranscriptMode] = useState<TranscriptMode>("both");
  const [showWordPopup, setShowWordPopup] = useState(false);
  const [showSentencePopup, setShowSentencePopup] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<TranscriptSegment | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Close loader early if loading is done
  if (isLoading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Handle word click
  const handleWordClick = useCallback((word: VocabularyItem, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setSelectedWord(word);
    setShowWordPopup(true);
    setShowSentencePopup(false);
  }, []);

  // Handle sentence click
  const handleSegmentClick = useCallback((segment: TranscriptSegment, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 200),
      y: Math.max(rect.top - 10, 100),
    });
    setSelectedSegment(segment);
    setShowSentencePopup(true);
    setShowWordPopup(false);
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowWordPopup(false);
        setShowSentencePopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Start shadowing practice
  const handleStartShadowing = () => {
    navigate({ to: "/student/shadowing/practice/$videoId", params: { videoId } });
  };

  if (!video || !topic) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={14} />
        <div className="relative z-10 text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Video not found</h3>
          <p className="text-sm text-white/60 mb-4">The video you're looking for doesn't exist.</p>
          <Link
            to="/student/shadowing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Shadowing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <SakuraBg count={14} />
      <div className="relative z-10 flex-1">
        {/* Header */}
        <div className="pt-4">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                to="/student/shadowing/topic/$topicId"
                params={{ topicId: topic.id }}
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    JLPT {topic.jlptLevel}
                  </span>
                  <h1 className="font-display font-bold text-lg text-slate-800 dark:text-white">
                    {video.title}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">{video.titleVn}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto">
          <div className="flex min-h-[calc(100vh-140px)]">
            {/* LEFT COLUMN - Video */}
            <div className="lg:w-1/2 lg:border-r border-slate-200 dark:border-white/10">
              <div className="sticky top-[140px] h-[calc(100vh-140px)] overflow-y-auto p-6 lg:p-8">
                {/* Video Player */}
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-slate-800" />
                      ) : (
                        <Play className="w-6 h-6 text-slate-800 ml-1" />
                      )}
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div className="h-full bg-primary w-1/3" />
                  </div>
                </div>

                {/* Shadowing Button */}
                <div className="mt-6">
                  <button
                    onClick={handleStartShadowing}
                    className="w-full py-4 rounded-2xl bg-gradient-hero text-white font-bold text-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                  >
                    <Mic className="w-5 h-5" />
                    Bắt đầu Shadowing
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Transcript */}
            <div className="lg:w-1/2">
              <div className="sticky top-[140px] h-[calc(100vh-140px)] overflow-y-auto p-6 lg:p-8">
                {/* Transcript Mode Toggle */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 w-full">
                    <Languages className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-1">
                      <button
                        onClick={() => setTranscriptMode("japanese")}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                          transcriptMode === "japanese"
                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                            : "text-muted-foreground hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        🇯🇵 Tiếng Nhật
                      </button>
                      <button
                        onClick={() => setTranscriptMode("vietnamese")}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                          transcriptMode === "vietnamese"
                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                            : "text-muted-foreground hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        🇻🇳 Tiếng Việt
                      </button>
                      <button
                        onClick={() => setTranscriptMode("both")}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                          transcriptMode === "both"
                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                            : "text-muted-foreground hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        ⚡ Cả Hai
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                <div className="space-y-2.5">
                  {video.script.map((segment, index) => (
                    <motion.div
                      key={segment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <button
                        onClick={(e) => handleSegmentClick(segment, e)}
                        className="w-full text-left rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all cursor-pointer overflow-hidden border border-transparent hover:border-primary/20"
                      >
                        {/* Card Header */}
                        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 border-b border-slate-200/60 dark:border-white/5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{segment.startTime}s</span>
                        </div>

                        {/* Card Body */}
                        <div className="px-3 py-2.5 space-y-1.5">
                          {(transcriptMode === "japanese" || transcriptMode === "both") && (
                            <p
                              className="text-base font-semibold text-slate-800 dark:text-white leading-relaxed"
                              style={{ fontFamily: "var(--font-japanese, serif)" }}
                            >
                              {segment.text
                                .split(/([^\s。、！？「」『』（）〔〕【】]+)/g)
                                .map((part, i) => {
                                  const vocab = segment.vocabulary.find((v) => v.word === part);
                                  if (vocab) {
                                    return (
                                      <span
                                        key={i}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleWordClick(vocab, e);
                                        }}
                                        className="inline-block px-0.5 py-0.5 -mx-0.5 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition cursor-pointer underline decoration-dotted underline-offset-2"
                                      >
                                        {part}
                                      </span>
                                    );
                                  }
                                  return part;
                                })}
                            </p>
                          )}
                          {transcriptMode === "vietnamese" && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 italic">{segment.translation}</p>
                          )}
                          {transcriptMode === "both" && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 italic mt-0.5">{segment.translation}</p>
                          )}
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Word Popup */}
      <AnimatePresence>
        {showWordPopup && selectedWord && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50"
            style={{
              left: popupPosition.x,
              top: popupPosition.y,
              transform: "translate(-50%, -100%)",
            }}
            ref={popupRef}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/20 p-4 w-72">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4
                    className="text-lg font-bold text-slate-800 dark:text-white"
                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                  >
                    {selectedWord.word}
                  </h4>
                  <p className="text-sm text-muted-foreground">[{selectedWord.reading}]</p>
                </div>
                <button
                  onClick={() => setShowWordPopup(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium">
                  {selectedWord.partOfSpeech}
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedWord.meaning}</p>
                {selectedWord.example && (
                  <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs">
                    <p
                      className="text-slate-600 dark:text-slate-400"
                      style={{ fontFamily: "var(--font-japanese, serif)" }}
                    >
                      {selectedWord.example}
                    </p>
                    <p className="text-muted-foreground mt-1">{selectedWord.exampleMeaning}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-white/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sentence Popup */}
      <AnimatePresence>
        {showSentencePopup && selectedSegment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50"
            style={{
              left: popupPosition.x,
              top: popupPosition.y,
              transform: "translate(-50%, -100%)",
              maxWidth: "400px",
            }}
            ref={popupRef}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/20 p-4 w-96">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {video.script.findIndex((s) => s.id === selectedSegment.id) + 1}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-white">Chi tiết câu</h4>
                </div>
                <button
                  onClick={() => setShowSentencePopup(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Original Sentence */}
              <div
                className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-3"
                style={{ fontFamily: "var(--font-japanese, serif)" }}
              >
                <p className="text-lg text-slate-800 dark:text-white">{selectedSegment.text}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedSegment.translation}</p>
              </div>

              {/* Grammar */}
              {selectedSegment.grammar && (
                <div className="mb-3">
                  <h5 className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    Ngữ pháp
                  </h5>
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {selectedSegment.grammar.grammar}
                    </p>
                    <p className="text-xs text-purple-500 dark:text-purple-500 mt-1">
                      {selectedSegment.grammar.meaning}
                    </p>
                  </div>
                </div>
              )}

              {/* Vocabulary */}
              <div>
                <h5 className="text-xs font-bold text-muted-foreground uppercase mb-1">
                  Từ vựng ({selectedSegment.vocabulary.length})
                </h5>
                <div className="space-y-1">
                  {selectedSegment.vocabulary.map((vocab, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <div>
                        <span
                          className="text-sm font-medium text-slate-800 dark:text-white"
                          style={{ fontFamily: "var(--font-japanese, serif)" }}
                        >
                          {vocab.word}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          [{vocab.reading}]
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {vocab.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-white/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
