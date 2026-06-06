import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, BookOpen, Layers, Eye, Star, Tag, X,
  ChevronLeft, ChevronRight, Shuffle, CheckCircle, Volume2,
  FlipHorizontal, Zap, BrainCircuit, BookMarked, ArrowLeft, Sparkles, BookText, RotateCcw
} from "lucide-react";
import { flashcardSetsData, type FlashcardSet, type Flashcard } from "../data/flashcards";

const STORAGE_KEY = "midori_flashcard_sets";

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
const PROGRESS_KEY = "midori_flashcard_progress";
const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];

function loadSets(): FlashcardSet[] {
  if (typeof window === "undefined") return flashcardSetsData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as FlashcardSet[];
  } catch {}
  return flashcardSetsData;
}

type Progress = Record<string, string[]>;

function loadProgress(): Progress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {}
  return {};
}

function saveProgress(p: Progress) {
  if (typeof window !== "undefined") localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export const Route = createFileRoute("/student/flashcards")({ component: StudentFlashcardsPage });

type StudyMode = "flashcard" | "quiz" | "random";

type QuizResult = {
  cardId: string;
  word: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

function levelBadge(l: string) {
  const map: Record<string, string> = {
    N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200",
    N4: "bg-green-50 text-green-500 dark:bg-green-950/30 dark:text-green-300 border-green-200",
    N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-300 border-yellow-200",
    N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-300 border-orange-200",
    N1: "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-300 border-red-200",
  };
  return map[l] ?? "bg-slate-50 text-slate-500 border-slate-200";
}

// ─── Quiz Option ─────────────────────────────────────────────────────────────
function QuizOption({ text, selected, correct, wrong, onClick }: {
  text: string; selected: boolean; correct: boolean; wrong: boolean; onClick: () => void;
}) {
  let cls = "bg-white dark:bg-indigo-950/50 border-slate-200 dark:border-indigo-400/20";
  if (correct) cls = "bg-green-50 dark:bg-green-500/20 border-green-400 text-green-700 dark:text-green-300";
  else if (wrong) cls = "bg-red-50 dark:bg-red-500/20 border-red-400 text-red-700 dark:text-red-300";
  else if (selected) cls = "bg-primary/10 dark:bg-indigo-500/20 border-primary/50";

  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-semibold ${cls}`}>
      {text}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────
function StudentFlashcardsPage() {
  const [sets, setSets] = useState<FlashcardSet[]>(loadSets);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [studySet, setStudySet] = useState<FlashcardSet | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>("flashcard");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [isFlashcardComplete, setIsFlashcardComplete] = useState(false);
  const [isRandomComplete, setIsRandomComplete] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [quizOptions, setQuizOptions] = useState<{ text: string; correct: boolean; wrong: boolean; selected: boolean }[]>([]);
  const [reviewCardIds, setReviewCardIds] = useState<string[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);

  useEffect(() => { saveProgress(progress); }, [progress]);

  // Generate quiz options when moving to a new card in quiz mode
  useEffect(() => {
    if (studyMode === "quiz" && studySet) {
      const card = studySet.cards[currentIdx];
      if (card) {
        setQuizOptions(getQuizOptions(card, studySet.cards));
      }
    }
  }, [currentIdx, studyMode, studySet]);

  const learnedCount = (setId: string) => progress[setId]?.length ?? 0;

  const filtered = sets.filter(s => {
    const mLvl = levelFilter === "All" || s.level === levelFilter;
    const mSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return mLvl && mSearch;
  });

  const startStudy = (s: FlashcardSet, mode: StudyMode = "flashcard") => {
    setStudySet(s);
    setStudyMode(mode);
    setCurrentIdx(0);
    setFlipped(false);
    setQuizAnswer(null);
    setQuizDone(false);
    setIsFlashcardComplete(false);
    setQuizResults([]);
    setIsQuizComplete(false);
    setQuizOptions([]);
    setIsRandomComplete(false);
    setReviewCardIds([]);
    setIsReviewMode(false);
    setReviewCards([]);
  };

  const markLearned = (cardId: string) => {
    if (!studySet) return;
    const prev = progress[studySet.id] ?? [];
    if (!prev.includes(cardId)) {
      const next = { ...progress, [studySet.id]: [...prev, cardId] };
      setProgress(next);
    }
  };

  const unmarkLearned = (cardId: string) => {
    if (!studySet) return;
    const prev = progress[studySet.id] ?? [];
    const next = { ...progress, [studySet.id]: prev.filter(id => id !== cardId) };
    setProgress(next);
  };

  const isLearned = (cardId: string) => progress[studySet?.id ?? ""]?.includes(cardId) ?? false;

  const isReviewCard = (cardId: string) => reviewCardIds.includes(cardId);

  const toggleReviewCard = (cardId: string) => {
    setReviewCardIds(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const shuffleCards = () => {
    if (!studySet) return;
    const shuffled = [...studySet.cards].sort(() => Math.random() - 0.5);
    setStudySet({ ...studySet, cards: shuffled });
    setCurrentIdx(0);
    setFlipped(false);
    setQuizAnswer(null);
    setQuizDone(false);
    setIsFlashcardComplete(false);
    setQuizResults([]);
    setIsQuizComplete(false);
    setQuizOptions([]);
    setIsRandomComplete(false);
  };

  const goNext = () => {
    if (!studySet) return;
    const activeCards = isReviewMode ? reviewCards : studySet.cards;
    if (studyMode === "flashcard" && currentIdx === activeCards.length - 1) {
      setIsFlashcardComplete(true);
      return;
    }
    if (studyMode === "quiz" && currentIdx === studySet.cards.length - 1) {
      setIsQuizComplete(true);
      return;
    }
    if (studyMode === "random" && currentIdx === studySet.cards.length - 1) {
      setIsRandomComplete(true);
      return;
    }
    setCurrentIdx(i => Math.min(i + 1, activeCards.length - 1));
    setFlipped(false);
    setQuizAnswer(null);
    setQuizDone(false);
  };

  const goPrev = () => {
    setCurrentIdx(i => Math.max(i - 1, 0));
    setFlipped(false);
    setQuizAnswer(null);
    setQuizDone(false);
    if (studyMode === "quiz" && currentIdx > 0) {
      const prevCard = studySet!.cards[currentIdx - 1];
      const existing = quizResults.find(r => r.cardId === prevCard?.id);
      setQuizAnswer(existing?.userAnswer ?? null);
    }
  };

  // Quiz: pick 3 wrong options from other cards
  const getQuizOptions = (card: Flashcard, all: Flashcard[]) => {
    const correct = { text: card.meaning, correct: true, wrong: false, selected: false };
    const others = all.filter(c => c.id !== card.id);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = shuffled.map(c => ({ text: c.meaning, correct: false, wrong: false, selected: false }));
    const combined = [correct, ...options].sort(() => Math.random() - 0.5);
    return combined;
  };

  // ── STUDY VIEW ────────────────────────────────────────────────────────
  if (studySet) {
    const activeCards = isReviewMode ? reviewCards : studySet.cards;
    const currentCard = activeCards[currentIdx]!;
    const total = studySet.cards.length;
    const learned = learnedCount(studySet.id);
    const remaining = total - learned;
    const progressPct = total > 0 ? Math.round((learned / total) * 100) : 0;
    const needReviewCount = studySet.cards.filter(c => !isLearned(c.id) || reviewCardIds.includes(c.id)).length;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => { setStudySet(null); setStudyMode("flashcard"); }}
            className="w-10 h-10 rounded-xl bg-white dark:bg-indigo-950/60 border border-slate-200 dark:border-indigo-400/20 flex items-center justify-center hover:border-primary/40 transition shadow-sm dark:shadow-none">
            <ArrowLeft className="w-4 h-4 text-foreground dark:text-indigo-200/80" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-black text-foreground dark:text-white/95">{studySet.title}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${levelBadge(studySet.level)}`}>{studySet.level}</span>
            </div>
            <p className="text-sm text-muted-foreground dark:text-slate-300">{total} cards · {learned} learned · {remaining} remaining</p>
          </div>
          <button onClick={shuffleCards}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-indigo-950/60 border border-slate-200 dark:border-indigo-400/20 text-sm font-semibold text-foreground dark:text-indigo-200/80 hover:border-primary/40 hover:shadow-md transition-all duration-200 dark:shadow-none">
            <Shuffle className="w-4 h-4" /> Shuffle
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-white dark:bg-indigo-950/50 rounded-2xl border border-slate-100 dark:border-indigo-400/20 backdrop-blur-sm p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground dark:text-indigo-100">Study progress</span>
            <span className="text-sm font-black text-primary">{progressPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-hero"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-green-500 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> {learned} mastered
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-indigo-200/80 font-semibold">
              <Layers className="w-3.5 h-3.5" /> {remaining} remaining
            </div>
          </div>
        </div>

        {/* Study mode tabs */}
        <div className="flex gap-2 bg-white/80 dark:bg-indigo-950/50 backdrop-blur-sm rounded-xl p-1 border border-slate-200/60 dark:border-indigo-400/20 w-fit shadow-sm">
          {[
            { id: "flashcard" as StudyMode, icon: FlipHorizontal, label: "Flashcard" },
            { id: "quiz" as StudyMode, icon: BrainCircuit, label: "Quiz" },
            { id: "random" as StudyMode, icon: Zap, label: "Random" },
          ].map(mode => (
            <button key={mode.id}
              onClick={() => { setStudyMode(mode.id); setCurrentIdx(0); setFlipped(false); setQuizAnswer(null); setQuizDone(false); setIsFlashcardComplete(false); setQuizResults([]); setIsQuizComplete(false); setQuizOptions([]); setIsRandomComplete(false); setReviewCardIds([]); setIsReviewMode(false); setReviewCards([]); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                studyMode === mode.id ? "bg-gradient-hero text-white shadow" : "text-muted-foreground dark:text-indigo-300 hover:text-foreground dark:hover:bg-indigo-400/15"
              }`}>
              <mode.icon className="w-4 h-4" /> {mode.label}
            </button>
          ))}
        </div>

        {/* Flashcard completion screen */}
        {studyMode === "flashcard" && isFlashcardComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center shadow-2xl mb-2">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-display font-black text-foreground dark:text-white">Study session complete</h2>
              <p className="text-sm text-muted-foreground dark:text-indigo-200/80 mt-1">Great job! You've finished this flashcard set.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              <div className="bg-white dark:bg-indigo-950/50 rounded-2xl border border-slate-100 dark:border-indigo-400/20 backdrop-blur-sm p-4 text-center shadow-sm">
                <div className="font-display font-black text-2xl text-foreground dark:text-white">{total}</div>
                <div className="text-[11px] text-muted-foreground dark:text-indigo-200/80 font-semibold mt-0.5">Total cards</div>
              </div>
              <div className="bg-white dark:bg-indigo-950/50 rounded-2xl border border-slate-100 dark:border-indigo-400/20 backdrop-blur-sm p-4 text-center shadow-sm">
                <div className="font-display font-black text-2xl text-green-500">{learned}</div>
                <div className="text-[11px] text-muted-foreground dark:text-indigo-200/80 font-semibold mt-0.5">Mastered</div>
              </div>
              <div className="bg-white dark:bg-indigo-950/50 rounded-2xl border border-slate-100 dark:border-indigo-400/20 backdrop-blur-sm p-4 text-center shadow-sm">
                <div className="font-display font-black text-2xl text-yellow-500">{needReviewCount}</div>
                <div className="text-[11px] text-muted-foreground dark:text-indigo-200/80 font-semibold mt-0.5">Need review</div>
              </div>
            </div>

            {/* Review need-to-practice */}
            {needReviewCount > 0 && (
              <button
                onClick={() => {
                  const cardsToReview = studySet!.cards.filter(c => !isLearned(c.id) || reviewCardIds.includes(c.id));
                  setReviewCards(cardsToReview);
                  setCurrentIdx(0);
                  setFlipped(false);
                  setIsFlashcardComplete(false);
                  setIsReviewMode(true);
                }}
                className="w-full max-w-md flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-sm font-bold transition shadow-sm"
              >
                <Star className="w-4 h-4 fill-yellow-500" /> Review need-to-practice
              </button>
            )}

            {/* Progress */}
            <div className="bg-white dark:bg-indigo-950/50 rounded-2xl border border-slate-100 dark:border-indigo-400/20 backdrop-blur-sm p-4 w-full max-w-md shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground dark:text-white">Completion</span>
                <span className="text-sm font-black text-primary">{progressPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-hero"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full max-w-md">
              <button
                onClick={() => { setCurrentIdx(0); setFlipped(false); setIsFlashcardComplete(false); setIsReviewMode(false); setReviewCards([]); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-indigo-950/60 border border-slate-200 dark:border-indigo-400/20 text-sm font-bold text-foreground dark:text-indigo-200/80 hover:border-primary/40 transition shadow-sm dark:shadow-none"
              >
                <RotateCcw className="w-4 h-4" /> Review again
              </button>
              <button
                onClick={() => { setStudySet(null); setStudyMode("flashcard"); setIsFlashcardComplete(false); setIsReviewMode(false); setReviewCards([]); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-hero text-white text-sm font-bold hover:opacity-90 transition shadow-sm"
              >
                <BookOpen className="w-4 h-4" /> Back to sets
              </button>
            </div>
          </motion.div>
        )}

        {/* Random completion screen */}
        {studyMode === "random" && isRandomComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center shadow-2xl mb-2">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-display font-black text-foreground dark:text-white">Random session complete</h2>
              <p className="text-sm text-muted-foreground dark:text-indigo-200/80 mt-1">You've reviewed all cards in random order.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              <div className="bg-white dark:bg-indigo-950/50 rounded-2xl border border-slate-100 dark:border-indigo-400/20 p-4 text-center shadow-sm">
                <div className="font-display font-black text-2xl text-foreground dark:text-white">{total}</div>
                <div className="text-[11px] text-muted-foreground dark:text-indigo-200/80 font-semibold mt-0.5">Total cards</div>
              </div>
              <div className="bg-white dark:bg-indigo-950/50 rounded-2xl border border-slate-100 dark:border-indigo-400/20 p-4 text-center shadow-sm">
                <div className="font-display font-black text-2xl text-green-500">{learned}</div>
                <div className="text-[11px] text-muted-foreground dark:text-indigo-200/80 font-semibold mt-0.5">Mastered</div>
              </div>
              <div className="bg-white dark:bg-indigo-950/50 rounded-2xl border border-slate-100 dark:border-indigo-400/20 p-4 text-center shadow-sm">
                <div className="font-display font-black text-2xl text-muted-foreground dark:text-indigo-200/80">{total - learned}</div>
                <div className="text-[11px] text-muted-foreground dark:text-indigo-200/80 font-semibold mt-0.5">Remaining</div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white dark:bg-indigo-950/50 rounded-2xl border border-slate-100 dark:border-indigo-400/20 backdrop-blur-sm p-4 w-full max-w-md shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground dark:text-white">Completion</span>
                <span className="text-sm font-black text-primary">{progressPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-hero"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full max-w-md">
              <button
                onClick={() => { setCurrentIdx(0); setFlipped(false); setIsRandomComplete(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-indigo-950/60 border border-slate-200 dark:border-indigo-400/20 text-sm font-bold text-foreground dark:text-indigo-200/80 hover:border-primary/40 transition shadow-sm dark:shadow-none"
              >
                <RotateCcw className="w-4 h-4" /> Restart random
              </button>
              <button
                onClick={() => { setStudySet(null); setStudyMode("flashcard"); setIsRandomComplete(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-hero text-white text-sm font-bold hover:opacity-90 transition shadow-sm"
              >
                <BookOpen className="w-4 h-4" /> Back to sets
              </button>
            </div>
          </motion.div>
        )}

        {/* Card area */}
        {total === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-semibold text-muted-foreground">This flashcard set has no cards yet.</p>
        </div>
        ) : studyMode === "flashcard" || studyMode === "random" ? (
          !isFlashcardComplete && !isRandomComplete && (
          <div className="flex flex-col items-center gap-6">
            {/* Flashcard */}
            <div className="w-full max-w-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCard.id + currentIdx}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 60 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onClick={() => setFlipped(f => !f)}
                  className="cursor-pointer"
                >
                  <AnimatePresence mode="wait">
                    {flipped ? (
                      <motion.div
                        key="back"
                        initial={{ rotateY: -90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -90, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="rounded-3xl bg-gradient-hero p-8 text-white shadow-xl min-h-[280px] flex flex-col justify-between relative overflow-visible"
                      >
                        <div>
                          <div className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-4">Meaning</div>
                          <div className="font-display font-black text-3xl sm:text-4xl text-white leading-tight mb-3 break-words">{currentCard.meaning}</div>
                          {currentCard.furigana && (
                            <div className="text-xl text-white/70 font-medium">{currentCard.furigana}</div>
                          )}
                          {currentCard.romaji && (
                            <div className="text-sm text-white/50 italic mt-1">{currentCard.romaji}</div>
                          )}
                          {currentCard.example && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                              <div className="text-[10px] font-bold uppercase opacity-60 mb-1">Example</div>
                              <div className="text-sm text-white/80 italic">"{currentCard.example}"</div>
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleReviewCard(currentCard.id); }}
                            title="Mark for review"
                            className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition ${
                              isReviewCard(currentCard.id)
                                ? "bg-yellow-400 text-yellow-900 shadow"
                                : "bg-white/15 text-white/50 hover:text-yellow-300 hover:bg-yellow-500/15"
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isReviewCard(currentCard.id) ? "fill-yellow-400" : ""}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 border border-white/30">{currentCard.level}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/30">{currentCard.topic}</span>
                    </div>
                          <span className="text-[10px] text-white/70">← flip to see word</span>
                  </div>
                </motion.div>
                    ) : (
                <motion.div
                        key="front"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 90, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-indigo-950 dark:to-indigo-900 border-2 border-primary/30 dark:border-cyan-400/25 dark:shadow-2xl dark:shadow-indigo-500/20 p-8 min-h-[280px] flex flex-col justify-between relative">
                        {/* Glow accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
                        <div>
                          <div className="text-[10px] font-bold uppercase text-muted-foreground dark:text-slate-300/70 tracking-widest mb-4">Word</div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="font-display font-black text-4xl sm:text-5xl text-foreground dark:text-white leading-tight flex-1 break-words">{currentCard.word}</div>
                            <button
                              onClick={(e) => { e.stopPropagation(); speakJapanese(currentCard.furigana || currentCard.word); }}
                              title="Play pronunciation"
                              className="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-50 dark:bg-cyan-400/20 hover:bg-sky-100 dark:hover:bg-cyan-400/30 text-sky-500 dark:text-cyan-300 flex items-center justify-center transition shadow-sm dark:shadow-none"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleReviewCard(currentCard.id); }}
                            title="Mark for review"
                            className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition ${
                              isReviewCard(currentCard.id)
                                ? "bg-yellow-400 text-yellow-900 shadow"
                                : "bg-white/8 dark:bg-indigo-500/20 dark:text-indigo-300/80 dark:hover:text-yellow-400 dark:hover:bg-indigo-400/25"
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isReviewCard(currentCard.id) ? "fill-yellow-400" : "fill-none"}`} />
                          </button>
                          {currentCard.furigana && (
                            <div className="text-2xl text-sky-500 dark:text-cyan-300 font-medium">{currentCard.furigana}</div>
                          )}
                          {currentCard.romaji && (
                            <div className="text-sm text-muted-foreground dark:text-slate-300/80 italic mt-1">{currentCard.romaji}</div>
                        )}
                      </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(currentCard.level)}`}>{currentCard.level}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-violet-500/15 text-purple-500 dark:text-violet-300 border border-purple-100 dark:border-violet-400/20">{currentCard.topic}</span>
                      </div>
                          <span className="text-[10px] text-muted-foreground dark:text-slate-300/70">click to flip →</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
        </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-4 w-full max-w-lg">
              <button onClick={goPrev} disabled={currentIdx === 0}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-indigo-950/60 border border-slate-200 dark:border-indigo-400/20 flex items-center justify-center text-muted-foreground dark:text-indigo-300/70 hover:text-foreground dark:hover:text-white hover:border-primary/40 dark:hover:border-indigo-400/40 transition shadow dark:shadow-none disabled:opacity-25 dark:disabled:opacity-20">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 flex items-center justify-center gap-3">
          <button
                  onClick={() => {
                    const alreadyLearned = isLearned(currentCard.id);
                    if (!alreadyLearned) markLearned(currentCard.id);
                    setFlipped(false);
                    const activeCards = isReviewMode ? reviewCards : studySet.cards;
                    if (currentIdx === activeCards.length - 1) {
                      if (studyMode === "random") {
                        setIsRandomComplete(true);
                      } else {
                        setIsFlashcardComplete(true);
                      }
                    } else {
                      setCurrentIdx(i => i + 1);
                    }
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                    isLearned(currentCard.id)
                      ? "bg-green-500 text-white shadow-lg"
                      : "bg-white dark:bg-indigo-950/60 border border-slate-200 dark:border-indigo-400/20 text-muted-foreground dark:text-indigo-200/80 hover:text-green-400 dark:hover:text-green-400 hover:border-green-400/40 dark:hover:border-green-400/40 shadow dark:shadow-none"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isLearned(currentCard.id) ? "Mastered" : "Mark as mastered"}
                </button>
              </div>

              <button onClick={goNext}
                className="w-12 h-12 rounded-2xl bg-gradient-hero text-white flex items-center justify-center hover:opacity-90 transition shadow-lg dark:shadow-indigo-500/20">
                <ChevronRight className="w-5 h-5" />
          </button>
            </div>

            {/* Counter */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-300 font-semibold">
              <span className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/80 flex items-center justify-center font-black">{currentIdx + 1}</span>
              <span>/</span>
              <span>{isReviewMode ? reviewCards.length : total}</span>
              {isReviewMode && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold">review</span>
              )}
            </div>
          </div>
        )) : (
          /* QUIZ MODE */
          <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
            {!isQuizComplete ? (
              <>
                <div className="w-full">
                  {/* Quiz word */}
                  <div className="bg-white dark:bg-indigo-950/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-indigo-400/20 p-6 text-center shadow-sm mb-4">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground dark:text-indigo-200/70 tracking-widest mb-2">Word meaning</div>
                    <div className="flex items-center gap-3 justify-center mb-1">
                      <div className="font-display font-black text-4xl text-foreground dark:text-white">{currentCard.word}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); speakJapanese(currentCard.furigana || currentCard.word); }}
                        title="Play pronunciation"
                        className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-cyan-500/15 hover:bg-sky-100 dark:hover:bg-cyan-500/25 text-sky-500 dark:text-cyan-300 flex items-center justify-center transition shadow-sm flex-shrink-0 dark:shadow-none"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    {currentCard.furigana && <div className="text-lg text-sky-500 dark:text-cyan-300 font-medium">{currentCard.furigana}</div>}
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {quizOptions.map((opt) => {
                      let cls = "bg-white dark:bg-indigo-950/50 border-slate-200 dark:border-indigo-400/20";
                      if (quizAnswer !== null) {
                        if (opt.correct) cls = "bg-green-50 dark:bg-green-950/30 border-green-400 text-green-700 dark:text-green-300";
                        else if (opt.text === quizAnswer && !opt.correct) cls = "bg-red-50 dark:bg-red-950/30 border-red-400 text-red-700 dark:text-red-300";
                      }
                      return (
                        <button key={opt.text} onClick={() => {
                          if (quizAnswer === null) {
                            setQuizAnswer(opt.text);
                            setQuizResults(prev => {
                              const existing = prev.findIndex(r => r.cardId === currentCard.id);
                              const result: QuizResult = {
                                cardId: currentCard.id,
                                word: currentCard.word,
                                userAnswer: opt.text,
                                correctAnswer: currentCard.meaning,
                                isCorrect: opt.correct,
                              };
                              if (existing >= 0) {
                                const updated = [...prev];
                                updated[existing] = result;
                                return updated;
                              }
                              return [...prev, result];
                            });
                          }
                        }}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-semibold ${cls}`}
                          disabled={quizAnswer !== null}>
                          {opt.text}
                          {quizAnswer !== null && opt.correct && (
                            <CheckCircle className="w-4 h-4 inline ml-2 text-green-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback - fixed height to prevent nav from jumping */}
                  <div className="min-h-[72px] mt-4">
                    {quizAnswer !== null && (() => {
                      const currentResult = quizResults.find(r => r.cardId === currentCard.id);
                      return (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-2xl text-center font-bold text-sm ${
                            currentResult?.isCorrect
                              ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-300 border border-green-300"
                              : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 border border-red-300"
                          }`}>
                          {currentResult?.isCorrect ? "✓ Correct!" : "✗ Incorrect. Correct answer: " + currentCard.meaning}
                        </motion.div>
                      );
                    })()}
                  </div>
                </div>

                {/* Quiz nav - OUTSIDE card content, always visible */}
                <div className="flex items-center gap-4 w-full">
                  <button onClick={goPrev} disabled={currentIdx === 0}
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-indigo-950/60 border border-slate-200 dark:border-indigo-400/20 flex items-center justify-center hover:border-primary/40 transition shadow dark:shadow-none disabled:opacity-25 dark:disabled:opacity-20">
                    <ChevronLeft className="w-5 h-5 text-muted-foreground dark:text-indigo-300/70" />
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground dark:text-indigo-200/80 font-semibold">
                    <span>{currentIdx + 1} / {total}</span>
                  </div>
                  <button onClick={goNext}
                    className="w-12 h-12 rounded-2xl bg-gradient-hero text-white flex items-center justify-center hover:opacity-90 transition shadow-lg dark:shadow-indigo-500/20">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <div className="flex flex-col items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center shadow-2xl">
                    <BrainCircuit className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-display font-black text-foreground dark:text-white">Quiz complete</h2>
                    <p className="text-sm text-muted-foreground dark:text-indigo-200/80 mt-1">You finished all questions!</p>
                  </div>
                </div>

                {/* Score cards */}
                <div className="grid grid-cols-3 gap-3 w-full mt-2">
                  <div className="bg-white dark:bg-indigo-950/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-indigo-400/20 p-4 text-center shadow-sm">
                    <div className="font-display font-black text-2xl text-foreground dark:text-white">{total}</div>
                    <div className="text-[11px] text-muted-foreground dark:text-indigo-200/80 font-semibold mt-0.5">Total</div>
                  </div>
                  <div className="bg-white dark:bg-indigo-950/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-indigo-400/20 p-4 text-center shadow-sm">
                    <div className="font-display font-black text-2xl text-green-500">{quizResults.filter(r => r.isCorrect).length}</div>
                    <div className="text-[11px] text-muted-foreground dark:text-indigo-200/80 font-semibold mt-0.5">Correct</div>
                  </div>
                  <div className="bg-white dark:bg-indigo-950/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-indigo-400/20 p-4 text-center shadow-sm">
                    <div className="font-display font-black text-2xl text-red-500">{quizResults.filter(r => !r.isCorrect).length}</div>
                    <div className="text-[11px] text-muted-foreground dark:text-indigo-200/80 font-semibold mt-0.5">Incorrect</div>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="bg-white dark:bg-indigo-950/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-indigo-400/20 p-4 w-full shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-foreground dark:text-white">Accuracy</span>
                    <span className="text-sm font-black text-primary">
                      {total > 0 ? Math.round((quizResults.filter(r => r.isCorrect).length / total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${total > 0 ? (quizResults.filter(r => r.isCorrect).length / total) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-hero"
                    />
                  </div>
                </div>

                {/* Review list */}
                {quizResults.length > 0 && (
                  <div className="w-full space-y-2 max-h-72 overflow-y-auto pr-1">
                    {quizResults.map((r) => (
                      <div key={r.cardId}
                        className={`rounded-xl p-3 border ${
                          r.isCorrect
                            ? "bg-green-50 dark:bg-green-500/15 border-green-200 dark:border-green-500/30"
                            : "bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {r.isCorrect ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <div>
                              <div className="font-bold text-sm text-foreground dark:text-white">{r.word}</div>
                              <div className="text-xs text-muted-foreground dark:text-indigo-200/80">
                                {r.isCorrect ? (
                                  <span>Your answer: <span className="font-semibold">{r.userAnswer}</span></span>
                                ) : (
                                  <span>Your answer: <span className="font-semibold text-red-500 line-through">{r.userAnswer}</span> · Correct: <span className="font-semibold text-green-500">{r.correctAnswer}</span></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={() => { setCurrentIdx(0); setQuizAnswer(null); setQuizResults([]); setIsQuizComplete(false); setQuizOptions([]); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-hero text-white text-sm font-bold hover:opacity-90 transition shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" /> Try again
                  </button>
                  <button
                    onClick={() => { setStudySet(null); setStudyMode("flashcard"); setQuizResults([]); setIsQuizComplete(false); setQuizOptions([]); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-indigo-950/60 border border-slate-200 dark:border-indigo-400/20 text-sm font-bold text-foreground dark:text-indigo-200/80 hover:border-primary/40 transition shadow-sm dark:shadow-none"
                  >
                    <BookOpen className="w-4 h-4" /> Back to sets
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── SET LIST VIEW ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
        <div>
        <h1 className="text-2xl font-display font-black text-foreground">Flashcards</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Learn vocabulary with flashcards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total sets", value: sets.length, icon: Layers, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Total cards", value: sets.reduce((s, x) => s + x.cards.length, 0), icon: BookOpen, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Learned", value: Object.values(progress).flat().length, icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Levels", value: "N5–N1", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30", noNum: true },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label}
              className={`rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default ${stat.bg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className={`font-display font-black text-xl leading-none ${stat.color}`}>
                    {stat.noNum ? stat.value : stat.value.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Learning suggestion */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-cyan-50/80 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 backdrop-blur-sm p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-display font-black text-foreground mb-1">Learning tip</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start with the <span className="font-bold text-emerald-600 dark:text-emerald-400">Greetings &amp; Expressions</span> set to master basic greetings first, then expand to Numbers &amp; Counting to build a solid foundation for your Japanese learning journey!
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 min-w-0 max-w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search flashcard sets..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 backdrop-blur-sm text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-slate-800 placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-1 bg-white/70 dark:bg-slate-800/70 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm shadow-sm">
          {JLPT_LEVELS.map(lvl => (
            <button key={lvl} onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 ${levelFilter === lvl ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:text-foreground hover:bg-slate-100/70 dark:hover:bg-slate-700/70"}`}>
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Set grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-semibold text-muted-foreground">No flashcard sets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s, i) => {
            const learned = learnedCount(s.id);
            const pct = s.cards.length > 0 ? Math.round((learned / s.cards.length) * 100) : 0;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-200 overflow-hidden group">
                <div className="flex">
                  {/* Left accent bar */}
                  <div className="w-1.5 bg-gradient-hero flex-shrink-0" />
                  <div className="flex-1 p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0 shadow-sm">
                        <BookText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-display font-black text-sm text-foreground leading-tight truncate">{s.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(s.level)}`}>{s.level}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{s.cards.length} cards</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-500 text-[10px] font-semibold">{s.topic}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    {s.cards.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground font-semibold">Progress</span>
                          <span className="font-bold text-primary">{pct}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            className="h-full rounded-full bg-gradient-hero" />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-medium">{learned}/{s.cards.length} learned</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => startStudy(s, "flashcard")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-hero hover:opacity-90 text-white text-xs font-bold transition-all shadow group-hover:shadow-md">
                        <FlipHorizontal className="w-3.5 h-3.5" /> Study now
                      </button>
                      <button onClick={() => startStudy(s, "quiz")}
                        className="px-3.5 py-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 text-primary/70 dark:text-primary/60 hover:text-primary text-xs font-bold transition-all border border-primary/10 hover:border-primary/20"
                        title="Quiz">
                        <BrainCircuit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => startStudy(s, "random")}
                        className="px-3.5 py-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 text-primary/70 dark:text-primary/60 hover:text-primary text-xs font-bold transition-all border border-primary/10 hover:border-primary/20"
                        title="Random">
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
