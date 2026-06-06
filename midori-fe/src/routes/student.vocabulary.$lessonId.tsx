import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Volume2, Bookmark, BookmarkCheck,
  CheckCircle2, X, Play, ArrowRight, ArrowLeft,
  BookOpen, GraduationCap
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";

// ─── Word Status ───────────────────────────────────────────────────────────────
type WordStatus = "not_learned" | "learned";

// ─── Data ──────────────────────────────────────────────────────────────────────

interface Word {
  word: string;
  furigana: string;
  romaji: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  exampleRomaji?: string;
}

interface Lesson {
  id: string;
  title: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  topic: string;
  totalWords: number;
  words: Word[];
}

const LESSONS: Lesson[] = [
  {
    id: "n5-1", title: "Daily Greetings", level: "N5", topic: "Daily Life",
    totalWords: 12,
    words: [
      { word: "おはよう", furigana: "おはよう", romaji: "ohayou", meaning: "Good morning", example: "おはようございます。", exampleMeaning: "Good morning (polite)", exampleRomaji: "Ohayou gozaimasu" },
      { word: "こんにちは", furigana: "こんにちは", romaji: "konnichiwa", meaning: "Hello / Good afternoon", example: "こんにちは、先生。", exampleMeaning: "Hello, teacher.", exampleRomaji: "Konnichiwa, sensei" },
      { word: "こんばんは", furigana: "こんばんは", romaji: "konbanwa", meaning: "Good evening", example: "こんばんは。", exampleMeaning: "Good evening.", exampleRomaji: "Konbanwa" },
      { word: "さようなら", furigana: "さようなら", romaji: "sayounara", meaning: "Goodbye", example: "さようなら、またね。", exampleMeaning: "Goodbye, see you again.", exampleRomaji: "Sayounara, mata ne" },
      { word: "おやすみ", furigana: "おやすみ", romaji: "oyasumi", meaning: "Good night", example: "おやすみなさい。", exampleMeaning: "Good night (polite).", exampleRomaji: "Oyasuminasai" },
      { word: "ありがとう", furigana: "ありがとう", romaji: "arigatou", meaning: "Thank you", example: "ありがとうございます！", exampleMeaning: "Thank you very much!", exampleRomaji: "Arigatou gozaimasu" },
      { word: "すみません", furigana: "すみません", romaji: "sumimasen", meaning: "Excuse me / Sorry", example: "すみません、駅はどこですか。", exampleMeaning: "Excuse me, where is the station?", exampleRomaji: "Sumimasen, eki wa doko desu ka" },
      { word: "はい", furigana: "はい", romaji: "hai", meaning: "Yes", example: "はい、わかりました。", exampleMeaning: "Yes, I understand.", exampleRomaji: "Hai, wakarimashita" },
      { word: "いいえ", furigana: "いいえ", romaji: "iie", meaning: "No", example: "いいえ、違います。", exampleMeaning: "No, that's wrong.", exampleRomaji: "Iie, chigaimasu" },
      { word: "お願いします", furigana: "おねがいします", romaji: "onegaishimasu", meaning: "Please", example: "これ、お願いします。", exampleMeaning: "This one, please.", exampleRomaji: "Kore, onegaishimasu" },
      { word: "いただきます", furigana: "いただきます", romaji: "itadakimasu", meaning: "Let's eat (before meal)", example: "いただきます！", exampleMeaning: "Let's eat!", exampleRomaji: "Itadakimasu" },
      { word: "ごちそうさま", furigana: "ごちそうさま", romaji: "gochisousama", meaning: "Thank you for the meal (after)", example: "ごちそうさまでした！", exampleMeaning: "Thank you for the meal!", exampleRomaji: "Gochisousama deshita" },
    ],
  },
  {
    id: "n5-2", title: "Family Members", level: "N5", topic: "Family",
    totalWords: 10,
    words: [
      { word: "家族", furigana: "かぞく", romaji: "kazoku", meaning: "family", example: "家族は何人ですか。", exampleMeaning: "How many people are in your family?", exampleRomaji: "Kazoku wa nan-nin desu ka" },
      { word: "父", furigana: "ちち", romaji: "chichi", meaning: "father (my)", example: "父は医者です。", exampleMeaning: "My father is a doctor.", exampleRomaji: "Chichi wa isha desu" },
      { word: "母", furigana: "はは", romaji: "haha", meaning: "mother (my)", example: "母は先生です。", exampleMeaning: "My mother is a teacher.", exampleRomaji: "Haha wa sensei desu" },
      { word: "兄弟", furigana: "きょうだい", romaji: "kyoudai", meaning: "brothers / siblings", example: "兄弟は二人います。", exampleMeaning: "I have two siblings.", exampleRomaji: "Kyoudai wa futari imasu" },
      { word: "姉", furigana: "あね", romaji: "ane", meaning: "older sister (my)", example: "姉は大学生です。", exampleMeaning: "My older sister is a university student.", exampleRomaji: "Ane wa daigakusei desu" },
      { word: "祖父", furigana: "そふ", romaji: "sofu", meaning: "grandfather (my)", example: "祖父は元気です。", exampleMeaning: "My grandfather is healthy.", exampleRomaji: "Sofu wa genki desu" },
      { word: "祖母", furigana: "そぼ", romaji: "sobo", meaning: "grandmother (my)", example: "祖母は料理が上手です。", exampleMeaning: "My grandmother cooks well.", exampleRomaji: "Sobo wa ryouri ga jouzu desu" },
      { word: "子供", furigana: "こども", romaji: "kodomo", meaning: "child / children", example: "子供が三人います。", exampleMeaning: "I have three children.", exampleRomaji: "Kodomo ga san-nin imasu" },
      { word: "主人", furigana: "しゅじん", romaji: "shujin", meaning: "husband (my)", example: "主人は会社で働いています。", exampleMeaning: "My husband works at a company.", exampleRomaji: "Shujin wa kaisha de hataraite imasu" },
      { word: "妻", furigana: "つま", romaji: "tsuma", meaning: "wife (my)", example: "妻は看護師です。", exampleMeaning: "My wife is a nurse.", exampleRomaji: "Tsuma wa kango shi desu" },
    ],
  },
];

const levelColors: Record<string, string> = {
  N5: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  N4: "bg-green-500/20 text-green-400 border-green-400/30",
  N3: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  N2: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  N1: "bg-red-500/20 text-red-400 border-red-400/30",
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/vocabulary/$lessonId")({ component: VocabStudyPage });

function VocabStudyPage() {
  const { lessonId } = Route.useParams();
  const lesson = LESSONS.find(l => l.id === lessonId) ?? LESSONS[0];

  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [wordStatuses, setWordStatuses] = useState<Record<number, WordStatus>>({});
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={18} />
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <BookOpen className="w-12 h-12 text-white/50 animate-pulse" />
          <p className="text-white font-bold text-base">Loading vocabulary...</p>
          <p className="text-white/60 text-sm">Please wait while information is being prepared.</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center">
        <SakuraBg count={18} />
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <GraduationCap className="w-12 h-12 text-white/50 mb-2" />
          <p className="text-white font-bold text-lg">Lesson not found.</p>
          <p className="text-white/60 text-sm">Unable to load data. Please try again later.</p>
          <Link to="/student/vocabulary" className="mt-3 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-bold hover:bg-white/30 transition">
            ← Back to Vocabulary
          </Link>
        </div>
      </div>
    );
  }

  const word = lesson.words[current];
  const status = wordStatuses[current] ?? "not_learned";
  const isBook = bookmarked.has(current);

  const learnedCount = Object.values(wordStatuses).filter(s => s === "learned").length;
  const notLearnedCount = lesson.words.length - learnedCount;

  const goNext = () => {
    if (current < lesson.words.length - 1) {
      setCurrent(c => c + 1);
      setRevealed(false);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
      setRevealed(false);
    }
  };

  const goTo = (i: number) => {
    setCurrent(i);
    setRevealed(false);
  };

  const toggleLearned = () => {
    setWordStatuses(prev => ({
      ...prev,
      [current]: prev[current] === "learned" ? "not_learned" : "learned",
    }));
  };

  const toggleBookmark = () => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(current)) next.delete(current);
      else next.add(current);
      return next;
    });
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <SakuraBg count={18} />

      {/* ── Header ── */}
      <div className="relative z-10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          {/* Back */}
          <Link
            to="/student/vocabulary"
            className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/30 transition"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>

          {/* Title */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColors[lesson.level]}`}>
                JLPT {lesson.level}
              </span>
              <span className="font-display font-black text-white text-base leading-tight text-center">
                {lesson.title}
              </span>
            </div>
          </div>

          {/* Audio */}
          <button className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/30 transition">
            <Volume2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-white/80 font-semibold">
          <span className="flex items-center gap-1">
            <span className="font-black text-white text-sm">{current + 1} / {lesson.words.length}</span>
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
          {lesson.words.map((_, i) => {
            const isCurrent = i === current;
            const isLearned = wordStatuses[i] === "learned";
            return (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`flex-shrink-0 w-7 h-7 rounded-xl text-[10px] font-black transition-all flex items-center justify-center ${isCurrent
                  ? "bg-gradient-hero text-white shadow-lg shadow-primary/40 scale-110"
                  : isLearned
                    ? "bg-green-500/30 text-green-300 border border-green-400/30"
                    : "bg-white/15 text-white/70 border border-white/20 hover:bg-white/25"
                  }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-white/15 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-pink-400"
            initial={{ width: 0 }}
            animate={{ width: `${((current + 1) / lesson.words.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Main Card ── */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-4 gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
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
              {/* Card header strip */}
              <div className="bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 px-5 py-2.5 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm ${levelColors[lesson.level]}`}>
                  JLPT {lesson.level}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isBook ? "bg-yellow-400/30 text-yellow-300" : "hover:bg-white/10 text-white/60"
                      }`}
                  >
                    {isBook
                      ? <BookmarkCheck className="w-4 h-4 fill-yellow-400" />
                      : <Bookmark className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                  >
                    <Volume2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
                {/* Word */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="font-display font-black text-white leading-none mb-3"
                  style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", fontFamily: "var(--font-japanese, serif)" }}
                >
                  {word.word}
                </motion.div>

                {/* Furigana */}
                <div className="text-white/60 text-base font-medium mb-1">
                  {word.furigana}
                </div>

                {/* Romaji */}
                <div className="text-white/40 text-sm font-medium italic mb-6">
                  {word.romaji}
                </div>

                {/* Tap to reveal / Meaning */}
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
                      key="meaning"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="w-full space-y-4"
                    >
                      {/* Meaning */}
                      <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Meaning</div>
                        <div className="text-white font-bold text-lg leading-tight">{word.meaning}</div>
                      </div>

                      {/* Example */}
                      {word.example && (
                        <div className="px-4 py-3 rounded-2xl bg-purple-500/15 backdrop-blur-sm border border-purple-400/20">
                          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-1">Example</div>
                          <div
                            className="text-white font-bold text-base leading-tight mb-1"
                            style={{ fontFamily: "var(--font-japanese, serif)" }}
                          >
                            {word.example}
                          </div>
                          {word.exampleRomaji && (
                            <div className="text-white/40 text-xs italic mb-1">{word.exampleRomaji}</div>
                          )}
                          <div className="text-white/70 text-sm">{word.exampleMeaning}</div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tap to reveal hint when revealed */}
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
              disabled={current === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-sm hover:bg-white/25 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={goNext}
              disabled={current === lesson.words.length - 1}
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
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all border ${status === "not_learned"
                ? "bg-white/15 border-white/20 text-white/70 hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300"
                : "bg-green-500/20 border-green-400/30 text-green-300"
                }`}
            >
              <X className="w-4 h-4" />
              Not Learned
            </button>
            <button
              onClick={toggleLearned}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all border ${status === "learned"
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
