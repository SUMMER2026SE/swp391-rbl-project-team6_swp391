import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, BookOpen, Layers, Eye, Star, Tag, X,
  ChevronLeft, ChevronRight, Shuffle, CheckCircle, Volume2,
  FlipHorizontal, Zap, BrainCircuit, BookMarked, ArrowLeft, Sparkles, BookText
} from "lucide-react";
import { flashcardSetsData, type FlashcardSet, type Flashcard } from "../data/flashcards";

const STORAGE_KEY = "midori_flashcard_sets";
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
  let cls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
  if (correct) cls = "bg-green-50 dark:bg-green-950/30 border-green-400 text-green-700 dark:text-green-300";
  else if (wrong) cls = "bg-red-50 dark:bg-red-950/30 border-red-400 text-red-700 dark:text-red-300";
  else if (selected) cls = "bg-primary/10 border-primary/50";

  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${cls}`}>
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
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => { saveProgress(progress); }, [progress]);

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

  const shuffleCards = () => {
    if (!studySet) return;
    const shuffled = [...studySet.cards].sort(() => Math.random() - 0.5);
    setStudySet({ ...studySet, cards: shuffled });
    setCurrentIdx(0);
    setFlipped(false);
    setQuizAnswer(null);
    setQuizDone(false);
  };

  const goNext = () => {
    if (!studySet) return;
    setCurrentIdx(i => Math.min(i + 1, studySet.cards.length - 1));
    setFlipped(false);
    setQuizAnswer(null);
    setQuizDone(false);
  };

  const goPrev = () => {
    setCurrentIdx(i => Math.max(i - 1, 0));
    setFlipped(false);
    setQuizAnswer(null);
    setQuizDone(false);
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
    const currentCard = studySet.cards[currentIdx]!;
    const total = studySet.cards.length;
    const learned = learnedCount(studySet.id);
    const remaining = total - learned;
    const progressPct = total > 0 ? Math.round((learned / total) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => { setStudySet(null); setStudyMode("flashcard"); }}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-primary/40 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-black text-foreground">{studySet.title}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${levelBadge(studySet.level)}`}>{studySet.level}</span>
            </div>
            <p className="text-sm text-muted-foreground">{total} thẻ · {learned} đã học · {remaining} còn lại</p>
          </div>
          <button onClick={shuffleCards}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:border-primary/40 transition shadow-sm">
            <Shuffle className="w-4 h-4" /> Xáo trộn
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground">Tiến độ học</span>
            <span className="text-sm font-black text-primary">{progressPct}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-hero"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-green-500 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> {learned} đã thuộc
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
              <Layers className="w-3.5 h-3.5" /> {remaining} còn lại
            </div>
          </div>
        </div>

        {/* Study mode tabs */}
        <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-100 dark:border-slate-700 w-fit shadow-sm">
          {[
            { id: "flashcard" as StudyMode, icon: FlipHorizontal, label: "Flashcard" },
            { id: "quiz" as StudyMode, icon: BrainCircuit, label: "Quiz" },
            { id: "random" as StudyMode, icon: Zap, label: "Ngẫu nhiên" },
          ].map(mode => (
            <button key={mode.id}
              onClick={() => { setStudyMode(mode.id); setCurrentIdx(0); setFlipped(false); setQuizAnswer(null); setQuizDone(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                studyMode === mode.id ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:text-foreground"
              }`}>
              <mode.icon className="w-4 h-4" /> {mode.label}
            </button>
          ))}
        </div>

        {/* Card area */}
        {total === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">Bộ flashcard này chưa có thẻ nào.</p>
        </div>
        ) : studyMode === "flashcard" || studyMode === "random" ? (
          <div className="flex flex-col items-center gap-6">
            {/* Flashcard */}
            <div className="w-full max-w-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCard.id + currentIdx}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.3 }}
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
                        transition={{ duration: 0.4 }}
                        className="rounded-3xl bg-gradient-hero p-8 text-white shadow-2xl min-h-[280px] flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-4">Nghĩa</div>
                          <div className="font-display font-black text-4xl leading-tight mb-3">{currentCard.meaning}</div>
                          {currentCard.furigana && (
                            <div className="text-xl text-white/70 font-medium">{currentCard.furigana}</div>
                          )}
                          {currentCard.romaji && (
                            <div className="text-sm text-white/50 italic mt-1">{currentCard.romaji}</div>
                          )}
                          {currentCard.example && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                              <div className="text-[10px] font-bold uppercase opacity-60 mb-1">Ví dụ</div>
                              <div className="text-sm text-white/80 italic">"{currentCard.example}"</div>
                      </div>
                        )}
                      </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 border border-white/30">{currentCard.level}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/30">{currentCard.topic}</span>
                    </div>
                          <span className="text-[10px] opacity-50">← flip to see word</span>
                  </div>
                </motion.div>
                    ) : (
                <motion.div
                        key="front"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 90, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="rounded-3xl bg-white dark:bg-slate-800 border-2 border-primary/20 p-8 shadow-2xl min-h-[280px] flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4">Từ</div>
                          <div className="font-display font-black text-5xl text-foreground leading-tight mb-2">{currentCard.word}</div>
                          {currentCard.furigana && (
                            <div className="text-2xl text-sky-500 font-medium">{currentCard.furigana}</div>
                          )}
                          {currentCard.romaji && (
                            <div className="text-sm text-muted-foreground italic mt-1">{currentCard.romaji}</div>
                        )}
                      </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(currentCard.level)}`}>{currentCard.level}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-500 border border-purple-100 dark:border-purple-900">{currentCard.topic}</span>
                      </div>
                          <span className="text-[10px] text-muted-foreground opacity-60">click to flip →</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
        </div>

            {/* Controls */}
            <div className="flex items-center gap-4 w-full max-w-lg">
              <button onClick={goPrev} disabled={currentIdx === 0}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition shadow disabled:opacity-30">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 flex items-center justify-center gap-3">
          <button
                  onClick={() => isLearned(currentCard.id) ? unmarkLearned(currentCard.id) : markLearned(currentCard.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                    isLearned(currentCard.id)
                      ? "bg-green-500 text-white shadow-lg"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-muted-foreground hover:text-green-500 hover:border-green-400 shadow"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isLearned(currentCard.id) ? "Đã thuộc" : "Đánh dấu thuộc"}
                </button>
              </div>

              <button onClick={goNext} disabled={currentIdx === total - 1}
                className="w-12 h-12 rounded-2xl bg-gradient-hero text-white flex items-center justify-center hover:opacity-90 transition shadow-lg disabled:opacity-40">
                <ChevronRight className="w-5 h-5" />
          </button>
            </div>

            {/* Counter */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">{currentIdx + 1}</span>
              <span>/</span>
              <span>{total}</span>
            </div>
          </div>
        ) : (
          /* QUIZ MODE */
          <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id + currentIdx}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {/* Quiz word */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 text-center shadow-sm mb-4">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">Nghĩa của từ</div>
                  <div className="font-display font-black text-4xl text-foreground">{currentCard.word}</div>
                  {currentCard.furigana && <div className="text-lg text-sky-500 font-medium mt-1">{currentCard.furigana}</div>}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {getQuizOptions(currentCard, studySet.cards).map((opt, i) => {
                    let cls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
                    if (quizAnswer !== null) {
                      if (opt.correct) cls = "bg-green-50 dark:bg-green-950/30 border-green-400 text-green-700 dark:text-green-300";
                      else if (i === quizAnswer && !opt.correct) cls = "bg-red-50 dark:bg-red-950/30 border-red-400 text-red-700 dark:text-red-300";
                    }
                    return (
                      <button key={i} onClick={() => { if (quizAnswer === null) setQuizAnswer(i); }}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${cls}`}
                        disabled={quizAnswer !== null}>
                        {opt.text}
                        {quizAnswer !== null && opt.correct && (
                          <CheckCircle className="w-4 h-4 inline ml-2 text-green-500" />
                        )}
            </button>
                    );
                  })}
        </div>

                {quizAnswer !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-2xl text-center font-bold text-sm ${
                      getQuizOptions(currentCard, studySet.cards)[quizAnswer].correct
                        ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-300 border border-green-300"
                        : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 border border-red-300"
                    }`}>
                    {getQuizOptions(currentCard, studySet.cards)[quizAnswer].correct ? "✓ Chính xác!" : "✗ Sai rồi! Đáp án đúng: " + currentCard.meaning}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Quiz nav */}
            <div className="flex items-center gap-4 w-full">
              <button onClick={goPrev} disabled={currentIdx === 0}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-primary/40 transition disabled:opacity-30 shadow">
                <ChevronLeft className="w-5 h-5" />
            </button>
              <div className="flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground font-semibold">
                <span>{currentIdx + 1} / {total}</span>
              </div>
              <button onClick={goNext} disabled={currentIdx === total - 1}
                className="w-12 h-12 rounded-2xl bg-gradient-hero text-white flex items-center justify-center hover:opacity-90 transition shadow-lg disabled:opacity-40">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
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
        <p className="text-sm text-muted-foreground mt-0.5">Học từ vựng bằng flashcard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tổng bộ thẻ", value: sets.length, icon: Layers, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Tổng thẻ", value: sets.reduce((s, x) => s + x.cards.length, 0), icon: BookOpen, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Đã học", value: Object.values(progress).flat().length, icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Cấp độ", value: "N5–N1", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30", noNum: true },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label}
              className={`rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 shadow-sm ${stat.bg}`}>
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
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-display font-black text-foreground mb-1">Gợi ý học tập</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hãy bắt đầu với bộ <span className="font-bold text-emerald-600 dark:text-emerald-400">Greetings & Expressions</span> để nắm vững những lời chào cơ bản trước, sau đó mở rộng sang Numbers & Counting để xây dựng nền tảng vững chắc cho hành trình học tiếng Nhật của bạn!
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-64 max-w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm bộ flashcard..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground" />
      </div>
        </div>
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {JLPT_LEVELS.map(lvl => (
            <button key={lvl} onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${levelFilter === lvl ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Set grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">Không tìm thấy bộ nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s, i) => {
            const learned = learnedCount(s.id);
            const pct = s.cards.length > 0 ? Math.round((learned / s.cards.length) * 100) : 0;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden group">
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
                          <span>{s.cards.length} thẻ</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-500 text-[10px] font-semibold">{s.topic}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    {s.cards.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground font-semibold">Tiến độ</span>
                          <span className="font-bold text-primary">{pct}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            className="h-full rounded-full bg-gradient-hero" />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-medium">{learned}/{s.cards.length} đã học</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => startStudy(s, "flashcard")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-hero hover:opacity-90 text-white text-xs font-bold transition-all shadow group-hover:shadow-md">
                        <FlipHorizontal className="w-3.5 h-3.5" /> Học ngay
                      </button>
                      <button onClick={() => startStudy(s, "quiz")}
                        className="px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-500 text-xs font-bold transition-all"
                        title="Quiz">
                        <BrainCircuit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => startStudy(s, "random")}
                        className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500 text-xs font-bold transition-all"
                        title="Ngẫu nhiên">
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
