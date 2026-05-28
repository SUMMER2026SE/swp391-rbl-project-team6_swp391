import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, GraduationCap, Eye, CheckCircle2, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, BookOpen, X, ArrowLeft,
  Clock, Volume2, Target
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";

// ─── Data ──────────────────────────────────────────────────────────────────────

interface GrammarItem {
  id: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  title: string;
  meaning: string;
  formation: string;
  explanation: string;
  examples: { japanese: string; romaji: string; translation: string }[];
  notes: string;
  lastStudied?: string;
}

const GRAMMAR_DATA: GrammarItem[] = [
  {
    id: "g1", level: "N5", title: "〜です / だ", meaning: "to be (copula)",
    formation: "Noun + です / だ",
    explanation: "Cấu trúc cơ bản nhất trong tiếng Nhật, dùng để nói về sự tồn tại hoặc đẳng thức. 〜です dùng khi nói lịch sự, だ dùng trong văn nói thông thường.",
    examples: [
      { japanese: "私は学生です。", romaji: "Watashi wa gakusei desu.", translation: "I am a student." },
      { japanese: "これは本です。", romaji: "Kore wa hon desu.", translation: "This is a book." },
      { japanese: "今日は晴れだ。", romaji: "Kyou wa hare da.", translation: "Today is sunny." },
    ],
    notes: "Phủ định: Noun + ではありません / じゃない\nLịch sự: Noun + です",
    lastStudied: "2 days ago",
  },
  {
    id: "g2", level: "N5", title: "〜があります / います", meaning: "there is / exists",
    formation: "Place + に + Noun + が あります / います",
    explanation: "Dùng để diễn đạt sự tồn tại của sự vật (あります) hoặc sinh vật có sự sống (います) tại một địa điểm nào đó.",
    examples: [
      { japanese: "机の上に本があります。", romaji: "Tsukue no ue ni hon ga arimasu.", translation: "There is a book on the desk." },
      { japanese: "部屋に猫がいます。", romaji: "Heya ni neko ga imasu.", translation: "There is a cat in the room." },
      { japanese: "箱の中に何がありますか。", romaji: "Hako no naka ni nani ga arimasu ka.", translation: "What is inside the box?" },
    ],
    notes: "があります → vật vô tri\nいます → vật có sinh khí (người, động vật)",
    lastStudied: "5 days ago",
  },
  {
    id: "g3", level: "N5", title: "〜ます / 〜ません", meaning: "polite affirmative / negative",
    formation: "Verb (stem) + ます / ません",
    explanation: "Cấu trúc thể lịch sự của động từ tiếng Nhật. Dùng trong giao tiếp formal, với người lạ, trong công việc và các tình huống trang trọng.",
    examples: [
      { japanese: "朝ごはんを食べます。", romaji: "Asagohan o tabemasu.", translation: "I eat breakfast." },
      { japanese: "日本語を話しません。", romaji: "Nihongo o hanashimasen.", translation: "I don't speak Japanese." },
      { japanese: "明日来ます。", romaji: "Ashita kimasu.", translation: "I will come tomorrow." },
    ],
    notes: "Thể lịch sự dùng trong giao tiếp formal\nQuá khứ: 〜ました / 〜ませんでした",
    lastStudied: "1 week ago",
  },
  {
    id: "g4", level: "N4", title: "〜なければなりません", meaning: "must do / have to",
    formation: "Verb (dictionary) + なければなりません",
    explanation: "Diễn đạt sự bắt buộc phải làm gì đó, tương đương với 'must' hoặc 'have to' trong tiếng Anh.",
    examples: [
      { japanese: "毎日勉強する必要があります。", romaji: "Mainichi benkyou suru hitsuyou ga arimasu.", translation: "I need to study every day." },
      { japanese: "このボタンを押星期六anha。", romaji: "Kono botan o osanakereba narimasen.", translation: "You must press this button." },
      { japanese: "明日提出しなければならない。", romaji: "Ashita teishutsu shinakereba naranai.", translation: "I have to submit it tomorrow." },
    ],
    notes: "Viết tắt: 〜なきゃ / 〜なくちゃ\nPhủ định: 〜なくてもいい (không cần phải)",
    lastStudied: "3 days ago",
  },
  {
    id: "g5", level: "N4", title: "〜たことがあります", meaning: "have experience of doing",
    formation: "Verb (た-form) + ことがあります",
    explanation: "Dùng để diễn đạt trải nghiệm đã từng làm gì đó. Chỉ dùng cho những trải nghiệm trong quá khứ.",
    examples: [
      { japanese: "日本へ行ったことがあります。", romaji: "Nihon e itta koto ga arimasu.", translation: "I have been to Japan." },
      { japanese: "刺身を食べたことがありますか。", romaji: "Sashimi o tabeta koto ga arimasu ka.", translation: "Have you ever eaten sashimi?" },
      { japanese: "富士山に登ったことがあります。", romaji: "Fujisan ni nobotta koto ga arimasu.", translation: "I have climbed Mt. Fuji." },
    ],
    notes: "Phủ định: 〜たことがありません\nHỏi: 〜たことがありますか",
    lastStudied: "Just now",
  },
  {
    id: "g6", level: "N4", title: "〜たいです", meaning: "want to do",
    formation: "Verb (stem) + たいです",
    explanation: "Diễn đạt mong muốn, ước muốn cá nhân. Thường dùng cho chủ ngữ số 1 để nói về mong muốn của bản thân.",
    examples: [
      { japanese: "日本に行きたいです。", romaji: "Nihon ni ikitai desu.", translation: "I want to go to Japan." },
      { japanese: "何が食べたいですか。", romaji: "Nani ga tabetai desu ka.", translation: "What do you want to eat?" },
      { japanese: "日本語を話したくないです。", romaji: "Nihongo o hanashitakunai desu.", translation: "I don't want to speak Japanese." },
    ],
    notes: "Phủ định: 〜たくないです\nNgười khác: 〜たがっています",
  },
  {
    id: "g7", level: "N3", title: "〜わけではない", meaning: "it doesn't mean that / not necessarily",
    formation: "Verb/I-adjective (普通形) + わけではない\nNoun + な + わけではない",
    explanation: "Dùng để phủ nhận một suy luận hoặc kết luận rút ra từ thông tin nào đó. Mang nghĩa 'điều đó không có nghĩa là...' hoặc 'không nhất thiết là...'",
    examples: [
      { japanese: "嫌いなわけではない。", romaji: "Kirai na wake de wa nai.", translation: "It's not that I dislike it." },
      { japanese: "賢いわけではないが、足は速い。", romaji: "Kashikoi wake de wa nai ga, ashi wa hayai.", translation: "Not necessarily smart, but fast." },
      { japanese: "行くわけではないが、準備はしている。", romaji: "Iku wake de wa nai ga, junbi wa shite iru.", translation: "Not necessarily going, but preparing." },
    ],
    notes: "Khác với 〜わけではありません (lịch sự hơn)\nCó thể dùng 〜とも限らない (không nhất thiết, có ngoại lệ)",
  },
  {
    id: "g8", level: "N3", title: "〜ばかりでなく", meaning: "not only ... but also",
    formation: "N / Verb (普通形) + ばかりでなく",
    explanation: "Dùng để nhấn mạnh rằng không chỉ có điều này mà còn có những điều khác nữa. Mang sắc thái nhấn mạnh và mở rộng phạm vi.",
    examples: [
      { japanese: "英語ばかりでなく、日本語も話せます。", romaji: "Eigo bakari de naku, nihongo mo hanasemasu.", translation: "I can speak not only English but also Japanese." },
      { japanese: "彼は歌手ばかりでなく、俳優でもある。", romaji: "Kare wa kashu bakari de naku, haiyuu demo aru.", translation: "He is not only a singer but also an actor." },
      { japanese: "勉強ばかりでなく、運動も大切です。", romaji: "Benkyou bakari de naku, undou mo juuyou desu.", translation: "Not only studying but exercise is also important." },
    ],
    notes: "Tương đương: 〜ばかりか / 〜ばかりじゃなく\nNhấn mạnh hơn: 〜にとどまらず",
  },
  {
    id: "g9", level: "N3", title: "〜そうだ (appearance)", meaning: "it seems / it looks like",
    formation: "Verb (stem) / I-adjective + そうだ\nNoun + そうだ",
    explanation: "Diễn đạt sự suy luận dựa trên những gì quan sát được — nhìn, nghe, cảm nhận. Mang nghĩa 'có vẻ như...' hoặc 'dường như...'",
    examples: [
      { japanese: "雨が降りそうだ。", romaji: "Ame ga furi-sou da.", translation: "It looks like it will rain." },
      { japanese: "彼是不是很忙呢？", romaji: "Kare wa isogashii sou desu.", translation: "He seems to be busy." },
      { japanese: "おいしそうな料理ですね。", romaji: "Oishii-sou na ryouri desu ne.", translation: "That looks like delicious food." },
    ],
    notes: "〜そうではない = doesn't seem to\n〜そうだった = seemed to\nKhác với 〜ようだ (dựa trên bằng chứng cụ thể)",
  },
  {
    id: "g10", level: "N2", title: "〜にもかかわらず", meaning: "in spite of / despite",
    formation: "Noun + にもかかわらず\nVerb/I-adjective (普通形) + にもかかわらず",
    explanation: "Diễn đạt nghĩa 'mặc dù... nhưng...', nhấn mạnh sự đối lập giữa kỳ vọng và thực tế. Trang trọng hơn のに.",
    examples: [
      { japanese: "雨にもかかわらず出かけた。", romaji: "Ame ni mo kakawarazu dekaketa.", translation: "I went out despite the rain." },
      { japanese: "忙しいにもかかわらず、手伝ってくれた。", romaji: "Isogashii ni mo kakawarazu, tetsudatte kureta.", translation: "He helped despite being busy." },
      { japanese: "狭いにもかかわらず、居心地がいい。", romaji: "Semai ni mo kakawarazu, igokochi ga ii.", translation: "Despite being small, it's comfortable." },
    ],
    notes: "Trang trọng hơn: 〜のに\nTương đương: 〜ものの / 〜にも反して",
  },
  {
    id: "g11", level: "N2", title: "〜かわり (に)", meaning: "instead of / in place of",
    formation: "Noun + のかわりに\nVerb (dictionary) + かわりに",
    explanation: "Diễn đạt sự thay thế — làm điều này thay vì điều kia, hoặc thay mặt ai đó.",
    examples: [
      { japanese: "友達のかわりに試験を受けた。", romaji: "Tomodachi no kawari ni shiken o uketa.", translation: "I took the exam in place of my friend." },
      { japanese: "出張するかわりに、在宅勤務した。", romaji: "Shucchou suru kawari ni, zaitaku kinmu shita.", translation: "Instead of going on a business trip, I worked from home." },
      { japanese: "先生がいないかわりに、助手に聞いた。", romaji: "Sensei ga inai kawari ni, joshu ni kiita.", translation: "Since the teacher wasn't there, I asked the assistant." },
    ],
    notes: "〜にかえて = thay thế hoàn toàn\n〜のかわりに = thay mặt / thay vì",
  },
  {
    id: "g12", level: "N1", title: "〜を余儀なくされる", meaning: "be forced to / have no choice but to",
    formation: "Noun + を余儀なくされる",
    explanation: "Diễn đạt hoàn cảnh bắt buộc phải làm gì đó do ngoại cảnh, thường là những tình huống khó khăn, bất khả kháng.",
    examples: [
      { japanese: "辞職を余儀なくされた。", romaji: "Jishoku o yogi naku sareta.", translation: "Was forced to resign." },
      { japanese: "計画変更を余儀なくされた。", romaji: "Keikaku henkou o yogi naku sareta.", translation: "Was forced to change the plan." },
      { japanese: "移転を余儀なくされた。", romaji: "Itten o yogi naku sareta.", translation: "Had no choice but to relocate." },
    ],
    notes: "Chủ động: 〜余儀なくする\nĐây là cấu trúc bị động: Bị bắt buộc\nThường dùng trong văn viết, tin tức",
  },
  {
    id: "g13", level: "N1", title: "〜つつある", meaning: "in the process of (gradual change)",
    formation: "Verb (stem) + つつある",
    explanation: "Diễn đạt một sự thay đổi đang diễn ra dần dần, từng bước. Mang sắc thái trang trọng, thường dùng trong văn viết và tin tức.",
    examples: [
      { japanese: "状況は改善されつつある。", romaji: "Joukyou wa kaizen sare-tsutsuku aru.", translation: "The situation is gradually improving." },
      { japanese: "社会は変わりつつある。", romaji: "Shakai wa kawari-tsutsuku aru.", translation: "Society is changing." },
      { japanese: "人気が高まりつつある。", romaji: "Ninki ga takamari-tsutsuku aru.", translation: "Popularity is increasing." },
    ],
    notes: "Tương đương: 〜ている (nhưng trang trọng hơn)\nDùng trong văn viết, báo chí, tin tức\nKhông dùng cho sự thay đổi nhanh chóng",
  },
];

const LEVEL_FILTERS = ["All", "N5", "N4", "N3", "N2", "N1"] as const;
const PAGE_SIZE = 8;

const levelColors: Record<string, string> = {
  N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30",
  N4: "bg-green-50 text-green-500 dark:bg-green-950/30",
  N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  N1: "bg-red-50 text-red-500 dark:bg-red-950/30",
};

const levelGradients: Record<string, string> = {
  N5: "from-blue-400 to-cyan-400",
  N4: "from-green-400 to-emerald-400",
  N3: "from-yellow-400 to-orange-400",
  N2: "from-orange-400 to-red-400",
  N1: "from-red-400 to-pink-400",
};

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  current, total, onPage,
}: { current: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const pageNums = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{Math.min((current - 1) * PAGE_SIZE + 1, total)}</span>
        {" – "}
        <span className="font-semibold text-foreground">{Math.min(current * PAGE_SIZE, total)}</span>
        {" of "}
        <span className="font-semibold text-foreground">{total}</span>
        {" grammar patterns"}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNums.map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
              p === current
                ? "bg-gradient-hero text-white shadow"
                : "border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(current + 1)}
          disabled={current === pages}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Grammar Detail Modal ──────────────────────────────────────────────────────

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

function ExampleCard({
  ex, index,
}: {
  ex: { japanese: string; romaji: string; translation: string };
  index: number;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed"
          style={{ fontFamily: "var(--font-japanese, serif)" }}
        >
          {ex.japanese}
        </div>
        <div className="text-xs text-sky-500 dark:text-sky-400 italic mt-0.5">{ex.romaji}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{ex.translation}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); speakJapanese(ex.japanese); }}
        title="Play pronunciation"
        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition self-start flex-shrink-0"
      >
        <Volume2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function GrammarDetailModal({
  item,
  isCompleted,
  isBookmarked,
  onClose,
  onToggleComplete,
  onToggleBookmark,
}: {
  item: GrammarItem;
  isCompleted: boolean;
  isBookmarked: boolean;
  onClose: () => void;
  onToggleComplete: () => void;
  onToggleBookmark: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`bg-gradient-to-br ${levelGradients[item.level]} px-6 py-5 sticky top-0 z-10`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <span className="px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-sm text-white text-xs font-black">
                JLPT {item.level}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isBookmarked && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 backdrop-blur-sm text-white text-xs font-bold">
                  <BookmarkCheck className="w-3.5 h-3.5 fill-yellow-300" />
                  Bookmarked
                </div>
              )}
              {isCompleted && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-sm text-white text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-green-300" />
                  Mastered
                </div>
              )}
            </div>
          </div>

          <h2 className="font-display font-black text-2xl text-white leading-tight">{item.title}</h2>
          <p className="text-white/90 text-sm font-medium mt-1">{item.meaning}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onToggleComplete}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isCompleted
                  ? "bg-green-500 text-white shadow-lg shadow-green-300/30"
                  : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isCompleted ? "fill-white" : ""}`} />
              {isCompleted ? "Completed" : "Mark Complete"}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onToggleBookmark}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isBookmarked
                  ? "bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-300/30"
                  : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              }`}
            >
              {isBookmarked
                ? <BookmarkCheck className="w-4 h-4 fill-slate-900" />
                : <Bookmark className="w-4 h-4" />}
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </motion.button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Formation */}
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
            <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1.5">Formation / Structure</div>
            <div className="font-display font-black text-purple-700 dark:text-purple-300 text-base">{item.formation}</div>
          </div>

          {/* Explanation */}
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Usage / Explanation</div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.explanation}</p>
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5">Notes</div>
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300 whitespace-pre-line">{item.notes}</p>
            </div>
          )}

          {/* Examples */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <h3 className="font-display font-bold text-sm">Example Sentences</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {item.examples.length} examples
              </span>
            </div>
            <div className="space-y-2">
              {item.examples.map((ex, i) => (
                <ExampleCard key={i} ex={ex} index={i} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/grammar")({ component: GrammarPage });

function GrammarPage() {
  const [levelFilter, setLevelFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarItem | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set(["g1"]));
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set(["g3"]));

  const filtered = useMemo(() => {
    return GRAMMAR_DATA.filter(g => {
      const matchLevel = levelFilter === "All" || g.level === levelFilter;
      if (!matchLevel) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.meaning.toLowerCase().includes(q) ||
        g.level.toLowerCase().includes(q)
      );
    });
  }, [levelFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleLevelFilter = (level: string) => {
    setLevelFilter(level);
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    setSelectedGrammar(null);
  };

  const toggleComplete = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBookmark = (id: string) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalCompleted = [...completed].length;
  const totalBookmarked = bookmarked.size;
  const totalGrammar = filtered.length;
  const completedCount = filtered.filter(g => completed.has(g.id)).length;
  const progressPct = totalGrammar > 0 ? Math.round((completedCount / totalGrammar) * 100) : 0;

  return (
    <div>
      <SakuraBg count={14} />
      <div className="relative z-10 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-display font-black">Grammar Lessons</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Master JLPT grammar patterns from N5 to N1 with clear examples and explanations.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {[
              { label: "Total", value: GRAMMAR_DATA.length, color: "text-blue-500", icon: <BookOpen className="w-4 h-4" /> },
              { label: "Completed", value: totalCompleted, color: "text-green-500", icon: <CheckCircle2 className="w-4 h-4" /> },
              { label: "Bookmarked", value: totalBookmarked, color: "text-yellow-500", icon: <BookmarkCheck className="w-4 h-4" /> },
            ].map(stat => (
              <div key={stat.label} className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 backdrop-blur-sm border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1 mt-0.5">
                  {stat.icon} {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Row — exact Teacher Grammar Management layout */}
        <div className="flex items-center gap-3 px-6">
          <div className="flex-1 max-w-80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search grammar patterns..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {LEVEL_FILTERS.map(l => (
              <button
                key={l}
                onClick={() => handleLevelFilter(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  levelFilter === l ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Table — full width, exact Teacher Grammar Management structure */}
        <div className="px-6 pb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="overflow-x-auto min-w-[700px]">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_80px_1.5fr_120px_110px_120px_80px] gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              <div>Pattern</div>
              <div>Level</div>
              <div>Meaning</div>
              <div className="text-center">Progress</div>
              <div className="text-center">Completed</div>
              <div className="text-center">Last Studied</div>
              <div className="text-center">View</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {paginated.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  No grammar patterns found.
                </div>
              ) : (
                paginated.map((g, i) => {
                  const isComp = completed.has(g.id);
                  const isBook = bookmarked.has(g.id);
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="grid grid-cols-[2fr_80px_1.5fr_120px_110px_120px_80px] gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition cursor-pointer items-center"
                      onClick={() => setSelectedGrammar(g)}
                    >
                      {/* Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${levelGradients[g.level]}`}>
                          <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-display font-black text-sm text-slate-800 dark:text-white truncate">{g.title}</div>
                          <div className="text-[10px] text-muted-foreground">{g.level} JLPT</div>
                        </div>
                      </div>

                      {/* Level */}
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${levelColors[g.level]}`}>
                          {g.level}
                        </span>
                      </div>

                      {/* Meaning */}
                      <div className="text-sm text-muted-foreground truncate pr-2">{g.meaning}</div>

                      {/* Progress */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: isComp ? "100%" : "0%" }}
                            className={`h-full rounded-full transition-all ${isComp ? "bg-green-400" : "bg-gradient-to-r from-blue-400 to-pink-400"}`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground w-7 text-right">
                          {isComp ? "100%" : "0%"}
                        </span>
                      </div>

                      {/* Completed Status */}
                      <div className="text-center">
                        {isComp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-muted-foreground text-[10px] font-bold">
                            <Clock className="w-3 h-3" /> No
                          </span>
                        )}
                      </div>

                      {/* Last Studied */}
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground">
                          {g.lastStudied ?? "—"}
                        </span>
                      </div>

                      {/* View Action */}
                      <div className="text-center flex justify-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedGrammar(g)}
                          title="View detail"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleComplete(g.id)}
                          title={isComp ? "Mark incomplete" : "Mark complete"}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                            isComp
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                              : "hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-300 hover:text-green-500"
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isComp ? "fill-green-400" : ""}`} />
                        </button>
                        <button
                          onClick={() => toggleBookmark(g.id)}
                          title={isBook ? "Remove bookmark" : "Bookmark"}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                            isBook
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500"
                              : "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-slate-300 hover:text-yellow-500"
                          }`}
                        >
                          {isBook
                            ? <BookmarkCheck className="w-3.5 h-3.5 fill-yellow-400" />
                            : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 pb-5">
                <Pagination current={safePage} total={filtered.length} onPage={handlePageChange} />
              </div>
            )}
          </div>
        </div>

        {/* Overall Progress Summary */}
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Progress</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {completedCount} / {totalGrammar} patterns mastered
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-blue-400 to-pink-400 rounded-full"
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">0%</span>
              <span className="text-[10px] font-bold text-primary">{progressPct}%</span>
              <span className="text-[10px] text-muted-foreground">100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedGrammar && (
          <GrammarDetailModal
            item={selectedGrammar}
            isCompleted={completed.has(selectedGrammar.id)}
            isBookmarked={bookmarked.has(selectedGrammar.id)}
            onClose={() => setSelectedGrammar(null)}
            onToggleComplete={() => toggleComplete(selectedGrammar.id)}
            onToggleBookmark={() => toggleBookmark(selectedGrammar.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
