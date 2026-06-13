import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Volume2, Bookmark, BookmarkCheck,
  CheckCircle2, X, Play, ArrowRight, ArrowLeft,
  GraduationCap, AlertCircle, CheckCircle, Loader2
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import {
  studentGrammarApi,
  type GrammarResponse,
} from "@/lib/api/studentGrammar";
import { studentProgressApi } from "@/lib/api/studentProgress";

const levelColors: Record<string, string> = {
  N5: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  N4: "bg-green-500/20 text-green-400 border-green-400/30",
  N3: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  N2: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  N1: "bg-red-500/20 text-red-400 border-red-400/30",
};

type StructureStatus = "not_learned" | "learned";

function speakJapanese(text: string) {
  if (!text?.trim()) return;
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

// ─── Loading Screen ─────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
      <p className="text-white/60 text-sm font-medium">Loading grammar...</p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/grammar/$grammarId/$structureId")({
  component: StructureStudyPage,
});

function StructureStudyPage() {
  const { grammarId } = Route.useParams();
  const navigate = useNavigate();

  // ── API Query ─────────────────────────────────────────────────────────────
  const { data: grammar, isLoading, isError, error } = useQuery({
    queryKey: ["student-grammar", grammarId],
    queryFn: () => studentGrammarApi.getGrammarById(grammarId),
    enabled: !!grammarId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Progress Query ───────────────────────────────────────────────────────
  const { data: progressList = [], refetch: refetchProgress } = useQuery({
    queryKey: ["grammar-progress", grammarId],
    queryFn: () => studentProgressApi.getProgress({ contentType: "GRAMMAR" }),
    enabled: !!grammarId,
    staleTime: 30 * 1000,
  });

  // Load progress into state after grammar loads
  useEffect(() => {
    if (!grammar) return;
    const newStatuses: Record<string, "learned" | "not_learned"> = {};
    const newBookmarked = new Set<string>();
    progressList.forEach(p => {
      if (p.contentType === "GRAMMAR" && p.contentId === grammar.id) {
        newStatuses[grammar.id] = p.learned ? "learned" : "not_learned";
        if (p.favorite) newBookmarked.add(p.contentId);
      }
    });
    setStructureStatuses(prev => {
      const next = { ...prev };
      Object.entries(newStatuses).forEach(([id, status]) => {
        next[id] = status;
      });
      return next;
    });
    setBookmarked(prev => {
      const next = new Set(prev);
      newBookmarked.forEach(id => next.add(id));
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressList, grammar?.id]);

  const [revealed, setRevealed] = useState(false);
  const [structureStatuses, setStructureStatuses] = useState<Record<string, StructureStatus>>({});
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  const errorMessage =
    error instanceof Error ? error.message : "Failed to load grammar. Please try again.";

  // Build structure items from backend grammar

  // Single "structure" page — treat grammar as the only item
  const allStructures = grammar ? [{
    id: grammar.id,
    title: grammar.title,
    formation: grammar.structure ?? grammar.pattern ?? "—",
    usage: grammar.usage ?? "",
    whenToUse: "—",
    whenNotToUse: "—",
    commonMistakes: "—",
    examples: grammar.examples.map(ex => ({ japanese: ex, furigana: "—", translation: "—" })),
    notes: "—",
  }] : [];

  const structureId = Route.useParams().structureId;
  const currentIndex = allStructures.findIndex(s => s.id === structureId) >= 0
    ? allStructures.findIndex(s => s.id === structureId)
    : 0;
  const structure = allStructures[currentIndex];
  const prevStructure = currentIndex > 0 ? allStructures[currentIndex - 1] : null;
  const nextStructure = currentIndex < allStructures.length - 1 ? allStructures[currentIndex + 1] : null;

  const goNext = () => {
    if (nextStructure) {
      navigate({
        to: "/student/grammar/$grammarId/$structureId",
        params: { grammarId, structureId: nextStructure.id },
      });
    }
  };

  const goPrev = () => {
    if (prevStructure) {
      navigate({
        to: "/student/grammar/$grammarId/$structureId",
        params: { grammarId, structureId: prevStructure.id },
      });
    }
  };

  const status = structureStatuses[grammar?.id ?? ""] ?? "not_learned";
  const isBook = bookmarked.has(grammar?.id ?? "");
  const learnedCount = Object.values(structureStatuses).filter(s => s === "learned").length;
  const notLearnedCount = allStructures.length - learnedCount;

  const toggleLearned = async () => {
    if (!grammar) return;
    const currentStatus = structureStatuses[grammar.id] ?? "not_learned";
    const isCurrentlyLearned = currentStatus === "learned";
    // Optimistic update
    setStructureStatuses(prev => ({
      ...prev,
      [grammar.id]: isCurrentlyLearned ? "not_learned" : "learned",
    }));
    try {
      if (isCurrentlyLearned) {
        await studentProgressApi.unmarkAsLearned("GRAMMAR", grammar.id);
      } else {
        await studentProgressApi.markAsLearned("GRAMMAR", grammar.id);
      }
      await refetchProgress();
    } catch {
      // Revert on error
      setStructureStatuses(prev => ({
        ...prev,
        [grammar.id]: currentStatus,
      }));
    }
  };

  const toggleBookmark = async () => {
    if (!grammar) return;
    const isCurrentlyBookmarked = bookmarked.has(grammar.id);
    // Optimistic update
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(grammar.id)) next.delete(grammar.id);
      else next.add(grammar.id);
      return next;
    });
    try {
      await studentProgressApi.toggleFavorite("GRAMMAR", grammar.id);
      await refetchProgress();
    } catch {
      // Revert on error
      setBookmarked(prev => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) next.add(grammar.id);
        else next.delete(grammar.id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex flex-col">
        <SakuraBg count={18} />
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  if (isError || !grammar || !structure) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={18} />
        <div className="relative z-10 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white/60 text-sm mb-2">{errorMessage}</p>
          <Link
            to="/student/grammar/$grammarId"
            params={{ grammarId: grammarId ?? "" }}
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <SakuraBg count={18} />

      {/* ── Header ── */}
      <div className="relative z-10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          {/* Back */}
          <Link
            to="/student/grammar/$grammarId"
            params={{ grammarId: grammar.id }}
            className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/30 transition"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>

          {/* Title */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColors[grammar.level]}`}>
                JLPT {grammar.level}
              </span>
              <span className="font-display font-black text-white text-base leading-tight text-center">
                {grammar.title}
              </span>
            </div>
          </div>

          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center transition-all ${
              isBook
                ? "bg-yellow-400/20 border-yellow-400/30 text-yellow-300"
                : "bg-white/20 border-white/20 text-white/70 hover:bg-white/30 hover:text-white"
            }`}
          >
            {isBook
              ? <BookmarkCheck className="w-5 h-5 fill-yellow-400" />
              : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        {/* Progress stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-white/80 font-semibold">
          <span className="flex items-center gap-1">
            <span className="font-black text-white text-sm">{currentIndex + 1} / {allStructures.length}</span>
          </span>
          <div className="w-px h-4 bg-white/20" />
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white/40" />
            {notLearnedCount} Not learned
          </span>
          <div className="w-px h-4 bg-white/20" />
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            {learnedCount} Learned
          </span>
        </div>
      </div>

      {/* ── Progress Dots ── */}
      <div className="relative z-10 px-4 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {allStructures.map((s, i) => {
            const isCurrent = s.id === structure.id;
            const isLearned = structureStatuses[s.id] === "learned";
            return (
              <Link
                key={s.id}
                to="/student/grammar/$grammarId/$structureId"
                params={{ grammarId: grammar.id, structureId: s.id }}
                className={`flex-shrink-0 w-7 h-7 rounded-xl text-[10px] font-black transition-all flex items-center justify-center ${
                  isCurrent
                    ? "bg-gradient-hero text-white shadow-lg shadow-primary/40 scale-110"
                    : isLearned
                    ? "bg-green-500/30 text-green-300 border border-green-400/30"
                    : "bg-white/15 text-white/70 border border-white/20 hover:bg-white/25"
                }`}
              >
                {i + 1}
              </Link>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-white/15 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-pink-400"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / allStructures.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Main Card ── */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-4 gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={structure.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {/* Big Card */}
            <div
              onClick={() => !revealed && setRevealed(true)}
              className="flex-1 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden cursor-pointer select-none flex flex-col min-h-0"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 px-5 py-2.5 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColors[grammar.level]}`}>
                  JLPT {grammar.level}
                </span>
                <div className="flex items-center gap-2">
                  {status === "learned" && (
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 fill-green-400" />
                      Mastered
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isBook ? "bg-yellow-400/30 text-yellow-300" : "hover:bg-white/10 text-white/60"
                    }`}
                  >
                    {isBook ? <BookmarkCheck className="w-4 h-4 fill-yellow-400" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); speakJapanese(grammar.title); }}
                    title="Play pronunciation"
                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                  >
                    <Volume2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* card body */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
                {/* Structure title */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-3"
                >
                  <div className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">
                    {structure.title}
                  </div>
                  <div
                    className="font-display font-black text-white leading-none"
                    style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)", fontFamily: "var(--font-japanese, serif)" }}
                  >
                    {grammar.title}
                  </div>
                  <div className="text-white/60 text-sm font-medium mt-1">{grammar.meaning}</div>
                </motion.div>

                {/* Formation */}
                <div className="px-4 py-2.5 rounded-2xl bg-purple-500/15 border border-purple-400/20 mb-6">
                  <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-0.5">Formation</div>
                  <div className="font-display font-black text-white text-base">{structure.formation}</div>
                </div>

                {/* Tap to reveal / Full content */}
                <AnimatePresence mode="wait">
                  {!revealed ? (
                    <motion.div
                      key="tap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
                        <Play className="w-6 h-6 text-white/70 ml-0.5" />
                      </div>
                      <button
                        onClick={() => setRevealed(true)}
                        className="px-5 py-2 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-bold hover:bg-white/25 transition"
                      >
                        Tap to reveal
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="revealed"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-full space-y-3 text-left"
                    >
                      {/* Usage */}
                      {structure.usage && structure.usage !== "—" && (
                        <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15">
                          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Usage</div>
                          <div className="text-white/90 text-sm leading-relaxed">{structure.usage}</div>
                        </div>
                      )}

                      {/* When to use / Not to use */}
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div className="px-4 py-3 rounded-2xl bg-green-500/10 border border-green-400/20">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            <div className="text-[10px] font-bold text-green-300 uppercase tracking-widest">When to Use</div>
                          </div>
                          <div className="text-white/80 text-xs leading-relaxed">{structure.whenToUse}</div>
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-400/20">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <X className="w-3.5 h-3.5 text-red-400" />
                            <div className="text-[10px] font-bold text-red-300 uppercase tracking-widest">When NOT to Use</div>
                          </div>
                          <div className="text-white/80 text-xs leading-relaxed">{structure.whenNotToUse}</div>
                        </div>
                      </div>

                      {/* Common Mistakes */}
                      {structure.commonMistakes && structure.commonMistakes !== "—" && (
                        <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-400/20">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Common Mistakes</div>
                          </div>
                          <div className="text-white/80 text-xs leading-relaxed">{structure.commonMistakes}</div>
                        </div>
                      )}

                      {/* Examples */}
                      {structure.examples.length > 0 && (
                        <div className="px-4 py-3 rounded-2xl bg-purple-500/10 border border-purple-400/20">
                          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-2">Examples</div>
                          <div className="space-y-2">
                            {structure.examples.map((ex, i) => (
                              <div key={i} className="flex gap-2">
                                <div className="w-5 h-5 rounded-md bg-purple-400/20 text-purple-300 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </div>
                                <div>
                                  <div
                                    className="text-white font-semibold text-sm leading-relaxed"
                                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                                  >
                                    {ex.japanese}
                                  </div>
                                  <div className="text-white/40 text-[10px] italic mt-0.5">{ex.furigana}</div>
                                  <div className="text-white/70 text-xs mt-0.5">{ex.translation}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {structure.notes && structure.notes !== "—" && (
                        <div className="px-4 py-3 rounded-2xl bg-sky-500/10 border border-sky-400/20">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                            <div className="text-[10px] font-bold text-sky-300 uppercase tracking-widest">Notes</div>
                          </div>
                          <div className="text-white/80 text-xs leading-relaxed whitespace-pre-line">{structure.notes}</div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tap hint */}
              {revealed && (
                <div className="px-5 pb-4 text-center">
                  <button
                    onClick={() => setRevealed(false)}
                    className="text-white/30 text-xs font-medium hover:text-white/50 transition"
                  >
                    Tap to hide
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Bottom Controls ── */}
        <div className="space-y-2.5">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={!prevStructure}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-sm hover:bg-white/25 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={goNext}
              disabled={!nextStructure}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-hero text-white font-bold text-sm shadow-lg shadow-primary/40 hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Learning Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLearned}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                status === "not_learned"
                  ? "bg-white/15 border-white/20 text-white/70 hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300"
                  : "bg-green-500/20 border-green-400/30 text-green-300"
              }`}
            >
              <X className="w-4 h-4" />
              Not Learned
            </button>
            <button
              onClick={toggleLearned}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                status === "learned"
                  ? "bg-green-500/20 border-green-400/30 text-green-300"
                  : "bg-white/15 border-white/20 text-white/70 hover:bg-green-500/20 hover:border-green-400/30 hover:text-green-300"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${status === "learned" ? "fill-green-400" : ""}`} />
              Learned
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
