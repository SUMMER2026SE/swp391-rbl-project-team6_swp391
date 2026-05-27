import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Volume2, Bookmark, BookmarkCheck,
  CheckCircle2, X, Play, ArrowRight, ArrowLeft,
  GraduationCap, AlertCircle, CheckCircle
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";

// ─── Data ──────────────────────────────────────────────────────────────────────

interface GrammarExample {
  japanese: string;
  furigana: string;
  translation: string;
}

interface StructureItem {
  id: string;
  grammarId: string;
  title: string;
  formation: string;
  usage: string;
  whenToUse: string;
  whenNotToUse: string;
  commonMistakes: string;
  examples: GrammarExample[];
  notes: string;
  conversation?: { speaker: string; japanese: string; translation: string }[];
}

interface GrammarItem {
  id: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  title: string;
  meaning: string;
  structures: StructureItem[];
}

const GRAMMAR_DATA: GrammarItem[] = [
  {
    id: "g1", level: "N5", title: "〜です / だ", meaning: "to be (copula)",
    structures: [
      {
        id: "s1-g1", grammarId: "g1", title: "Cấu trúc cơ bản", formation: "Noun + です / だ",
        usage: "Dùng để khẳng định một danh từ, trạng thái hoặc sự tồn tại. だ dùng trong văn nói thông thường, です dùng khi nói lịch sự.",
        whenToUse: "Khi giới thiệu bản thân, xác nhận danh tính, nói về nghề nghiệp, quốc tịch, trạng thái.",
        whenNotToUse: "Không dùng だ sau tính từ (dùng い/な), không dùng khi phủ định (dùng ではありません).",
        commonMistakes: "Dùng だ sau tính từ na để khẳng định → sai. VD: 高いです (đúng) / 高いだ (sai).",
        examples: [
          { japanese: "私は学生です。", furigana: "わ・た・し　は　がく・せい　です", translation: "Tôi là sinh viên." },
          { japanese: "今日は晴れだ。", furigana: "きょう　は　は・れ　だ", translation: "Hôm nay trời nắng." },
          { japanese: "これは本です。", furigana: "これ　は　ほ・ん　です", translation: "Đây là sách." },
        ],
        notes: "〜です: thể lịch sự\n〜だ: thể thông thường (văn nói)\nPhủ định: Noun + ではありません / じゃない",
        conversation: [
          { speaker: "A", japanese: "すみません、学生ですか。", translation: "Xin lỗi, bạn là sinh viên à?" },
          { speaker: "B", japanese: "はい、学生です。", translation: "Vâng, tôi là sinh viên." },
        ],
      },
      {
        id: "s2-g1", grammarId: "g1", title: "Cách dùng lịch sự", formation: "Noun + です",
        usage: "です là thể lịch sự của だ. Dùng khi nói chuyện với người lạ, trong công việc, hoặc khi cần thể hiện sự lịch sự.",
        whenToUse: "Khi nói chuyện với người lạ, sếp, giáo viên, trong môi trường công sở.",
        whenNotToUse: "Không dùng です khi nói chuyện thân mật với bạn bè cùng trang lứa.",
        commonMistakes: "Dùng です quá nhiều khi nói chuyện thân mật → nghe giả tạo.",
        examples: [
          { japanese: "先生、学生です。", furigana: "せん・せい、がく・せい　です", translation: "Thưa thầy/cô, con là sinh viên." },
          { japanese: "こちらは田中先生です。", furigana: "こちら　は　た・なか　せん・せい　です", translation: "Đây là Giáo sư Tanaka." },
        ],
        notes: "Luôn dùng です khi nói với người lớn tuổi hơn hoặc trong môi trường formal.",
      },
      {
        id: "s3-g1", grammarId: "g1", title: "Phủ định", formation: "Noun + ではありません / じゃない",
        usage: "Dùng để phủ định một danh từ. ではありません là thể lịch sự, じゃない là thể thông thường.",
        whenToUse: "Khi muốn nói 'không phải là...' hoặc phủ định một sự thật.",
        whenNotToUse: "Không dùng sau tính từ. Với tính từ dùng くない / ではない.",
        commonMistakes: "Quên は trong ではありません → nói sai.",
        examples: [
          { japanese: "私は日本人ではありません。", furigana: "わ・た・し　は　に・ほん・じん　ではありません", translation: "Tôi không phải người Nhật." },
          { japanese: "これは猫じゃない。", furigana: "これ　は　ね・こ　じゃない", translation: "Đây không phải mèo." },
        ],
        notes: "ではありません = lịch sự\nじゃない = thân mật",
      },
      {
        id: "s4-g1", grammarId: "g1", title: "Quá khứ", formation: "Noun + でした / だった",
        usage: "Dùng để nói về sự thật hoặc trạng thái trong quá khứ.",
        whenToUse: "Khi kể về trạng thái hoặc sự thật trong quá khứ.",
        whenNotToUse: "Dùng ました cho động từ, không dùng cho danh từ.",
        commonMistakes: "Dùng ました sau danh từ → sai. Phải dùng でした.",
        examples: [
          { japanese: "子供の頃、私は学生でした。", furigana: "こ・ども　の　ころ、わ・た・し　は　がく・せい　でした", translation: "Khi còn nhỏ, tôi là sinh viên." },
          { japanese: "前は先生だった。", furigana: "まえ　は　せん・せい　だった", translation: "Trước đây là giáo viên." },
        ],
        notes: "Quá khứ phủ định: ではありませんでした / じゃなかった",
      },
    ],
  },
  {
    id: "g2", level: "N5", title: "〜があります / います", meaning: "there is / exists",
    structures: [
      {
        id: "s1-g2", grammarId: "g2", title: "Tồn tại vật vô tri", formation: "Place + に + Noun + が あります",
        usage: "Dùng あります để nói về sự tồn tại của vật vô tri (đồ vật, cây cối, tòa nhà...)",
        whenToUse: "Khi nói 'có ... ở ...' với vật vô tri.",
        whenNotToUse: "Không dùng あります cho người và động vật (dùng います).",
        commonMistakes: "Dùng います cho đồ vật → sai.",
        examples: [
          { japanese: "机の上に本があります。", furigana: "つく・え　の　うえ　に　ほ・ん　が　あり・ます", translation: "Có một cuốn sách trên bàn." },
          { japanese: "箱の中に何がありますか。", furigana: "はこ　の　なか　に　な・に　が　あり・ます　か", translation: "Có gì trong hộp?" },
        ],
        notes: "ありません = phủ định (không có)",
      },
      {
        id: "s2-g2", grammarId: "g2", title: "Tồn tại sinh vật", formation: "Place + に + Noun + が います",
        usage: "Dùng います để nói về sự tồn tại của người và động vật (có sinh khí).",
        whenToUse: "Khi nói 'có ... ở ...' với người hoặc động vật.",
        whenNotToUse: "Không dùng います cho đồ vật.",
        commonMistakes: "Dùng あります cho người → sai.",
        examples: [
          { japanese: "部屋に猫がいます。", furigana: "へ・や　に　ね・こ　が　い・ます", translation: "Có một con mèo trong phòng." },
          { japanese: "あそこに誰がいますか。", furigana: "あそこ　に　だ・れ　が　い・ます　か", translation: "Ai ở đằng kia?" },
        ],
        notes: "いません = phủ định (không có mặt)",
      },
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

type StructureStatus = "not_learned" | "learned";

export const Route = createFileRoute("/student/grammar/$grammarId/$structureId")({ component: StructureStudyPage });

function StructureStudyPage() {
  const { grammarId, structureId } = Route.useParams();
  const grammar = GRAMMAR_DATA.find(g => g.id === grammarId);
  const allStructures = grammar?.structures ?? [];
  const currentIndex = allStructures.findIndex(s => s.id === structureId);
  const structure = allStructures[currentIndex];
  const prevStructure = currentIndex > 0 ? allStructures[currentIndex - 1] : null;
  const nextStructure = currentIndex < allStructures.length - 1 ? allStructures[currentIndex + 1] : null;

  const [revealed, setRevealed] = useState(false);
  const [structureStatuses, setStructureStatuses] = useState<Record<string, StructureStatus>>({});
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  if (!grammar || !structure) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Structure not found.</p>
          <Link
            to="/student/grammar/$grammarId"
            params={{ grammarId: grammarId ?? "g1" }}
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>
    );
  }

  const status = structureStatuses[structure.id] ?? "not_learned";
  const isBook = bookmarked.has(structure.id);
  const learnedCount = Object.values(structureStatuses).filter(s => s === "learned").length;
  const notLearnedCount = allStructures.length - learnedCount;

  const toggleLearned = () => {
    setStructureStatuses(prev => ({
      ...prev,
      [structure.id]: prev[structure.id] === "learned" ? "not_learned" : "learned",
    }));
  };

  const toggleBookmark = () => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(structure.id)) next.delete(structure.id);
      else next.add(structure.id);
      return next;
    });
  };

  const goNext = () => {
    if (nextStructure) {
      window.location.href = `/student/grammar/${grammar.id}/${nextStructure.id}`;
    }
  };

  const goPrev = () => {
    if (prevStructure) {
      window.location.href = `/student/grammar/${grammar.id}/${prevStructure.id}`;
    }
  };

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
                    onClick={(e) => { e.stopPropagation(); }}
                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                  >
                    <Volume2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Card body */}
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
                      <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Usage</div>
                        <div className="text-white/90 text-sm leading-relaxed">{structure.usage}</div>
                      </div>

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
                      {structure.commonMistakes && (
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
                      {structure.notes && (
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
