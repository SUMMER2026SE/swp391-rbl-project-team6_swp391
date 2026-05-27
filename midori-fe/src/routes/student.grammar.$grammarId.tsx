import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, CheckCircle2, Bookmark, BookmarkCheck,
  ChevronLeft, BookOpen, ArrowRight, Clock, List, Target,
  BookMarked, AlertCircle
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";

// ─── Grammar Data ───────────────────────────────────────────────────────────────

interface GrammarItem {
  id: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  title: string;
  meaning: string;
}

const GRAMMAR_DATA: GrammarItem[] = [
  { id: "g1", level: "N5", title: "〜です / だ", meaning: "to be (copula)" },
  { id: "g2", level: "N5", title: "〜があります / います", meaning: "there is / exists" },
  { id: "g3", level: "N5", title: "〜ます / 〜ません", meaning: "polite affirmative / negative" },
  { id: "g4", level: "N4", title: "〜なければなりません", meaning: "must do / have to" },
  { id: "g5", level: "N4", title: "〜たことがあります", meaning: "have experience of doing" },
  { id: "g6", level: "N4", title: "〜たいです", meaning: "want to do" },
  { id: "g7", level: "N3", title: "〜わけではない", meaning: "it doesn't mean that / not necessarily" },
  { id: "g8", level: "N3", title: "〜ばかりでなく", meaning: "not only ... but also" },
  { id: "g9", level: "N3", title: "〜そうだ (appearance)", meaning: "it seems / it looks like" },
  { id: "g10", level: "N2", title: "〜にもかかわらず", meaning: "in spite of / despite" },
  { id: "g11", level: "N2", title: "〜かわり (に)", meaning: "instead of / in place of" },
  { id: "g12", level: "N1", title: "〜を余儀なくされる", meaning: "be forced to / have no choice but to" },
  { id: "g13", level: "N1", title: "〜つつある", meaning: "in the process of (gradual change)" },
];

// ─── Structure Data ────────────────────────────────────────────────────────────

interface StructureItem {
  id: string;
  grammarId: string;
  title: string;
  description: string;
  formation: string;
  usage: string;
  whenToUse: string;
  whenNotToUse: string;
  commonMistakes: string;
  examples: { japanese: string; furigana: string; translation: string }[];
  notes: string;
  conversation?: { speaker: string; japanese: string; translation: string }[];
}

const STRUCTURE_DATA: StructureItem[] = [
  // g1: 〜です / だ
  {
    id: "s1-g1", grammarId: "g1", title: "Cấu trúc cơ bản", description: "Cấu trúc đẳng thức / khẳng định danh từ",
    formation: "Noun + です / だ",
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
    id: "s2-g1", grammarId: "g1", title: "Cách dùng lịch sự", description: "Dùng です để nói lịch sự với người lạ hoặc trong công việc",
    formation: "Noun + です",
    usage: "です là thể lịch sự của だ. Dùng khi nói chuyện với người lạ, trong công việc, hoặc khi cần thể hiện sự lịch sự.",
    whenToUse: "Khi nói chuyện với người lạ, sếp, giáo viên, trong môi trường công sở.",
    whenNotToUse: "Không dùng です khi nói chuyện thân mật với bạn bè cùng trang lứa.",
    commonMistakes: "Dùng です quá nhiều khi nói chuyện thân mật → nghe giả tạo.",
    examples: [
      { japanese: "先生、学生です。", furigana: "せん・せい、がく・せい　です", translation: "Thưa thầy/cô, con là sinh viên." },
      { japanese: "こちらは日本語学科の田中先生です。", furigana: "こちら　は　に・ほん・ご　がっ・か　の　た・なか　せん・せい　です", translation: "Đây là Giáo sư Tanaka, khoa Ngôn ngữ Nhật." },
    ],
    notes: "Luôn dùng です khi nói với người lớn tuổi hơn hoặc trong môi trường formal.",
    conversation: [
      { speaker: "A", japanese: "お名前は。", translation: "Tên bạn là gì?" },
      { speaker: "B", japanese: "山田です。どうぞよろしく。", translation: "Yamada đây. Rất vui được gặp." },
    ],
  },
  {
    id: "s3-g1", grammarId: "g1", title: "Phủ định", description: "Cấu trúc phủ định của đẳng thức danh từ",
    formation: "Noun + ではありません / じゃない",
    usage: "Dùng để phủ định một danh từ. ではありません là thể lịch sự, じゃない là thể thông thường.",
    whenToUse: "Khi muốn nói 'không phải là...' hoặc phủ định một sự thật.",
    whenNotToUse: "Không dùng sau tính từ. Với tính từ dùng くない / ではない.",
    commonMistakes: "Quên ではありません và nói sai thành ではありません (thiếu は).",
    examples: [
      { japanese: "私は日本人ではありません。", furigana: "わ・た・し　は　に・ほん・じん　ではありません", translation: "Tôi không phải người Nhật." },
      { japanese: "これは猫じゃない。", furigana: "これ　は　ね・こ　じゃない", translation: "Đây không phải mèo." },
    ],
    notes: "ではありません = ではありません\nじゃない = じゃない (thân mật hơn)",
  },
  {
    id: "s4-g1", grammarId: "g1", title: "Quá khứ", description: "Thể quá khứ của đẳng thức danh từ",
    formation: "Noun + でした / だった",
    usage: "Dùng để nói về sự thật hoặc trạng thái trong quá khứ. でした là lịch sự, だった là thông thường.",
    whenToUse: "Khi kể về trạng thái hoặc sự thật trong quá khứ.",
    whenNotToUse: "Dùng ました cho động từ, không dùng cho danh từ.",
    commonMistakes: "Dùng ました sau danh từ → sai. Phải dùng でした.",
    examples: [
      { japanese: "子供の頃、私は学生でした。", furigana: "こ・ども　の　ころ、わ・た・し　は　がく・せい　でした", translation: "Khi còn nhỏ, tôi là sinh viên." },
      { japanese: "前は先生だった。", furigana: "まえ　は　せん・せい　だった", translation: "Trước đây là giáo viên." },
    ],
    notes: "Quá khứ phủ định: ではありませんでした / じゃなかった",
    conversation: [
      { speaker: "A", japanese: "前はデザインをしていました。", translation: "Trước đây tôi làm thiết kế." },
      { speaker: "B", japanese: "へえ、じゃあ学生じゃなかったんですね。", translation: "Ồ, vậy không phải sinh viên à." },
    ],
  },
  {
    id: "s5-g1", grammarId: "g1", title: "Hỏi đáp", description: "Cấu trúc hỏi và trả lời về danh từ",
    formation: "Noun + ですか？",
    usage: "Dùng để hỏi về một danh từ hoặc xác nhận thông tin. Thêm か ở cuối câu khẳng định để tạo câu hỏi.",
    whenToUse: "Khi muốn hỏi hoặc xác nhận danh tính, thông tin.",
    whenNotToUse: "Không dùng cho hỏi về sở thích (dùng 〜が好きですか).",
    commonMistakes: "Hỏi bằng ますか thay vì です cho danh từ.",
    examples: [
      { japanese: "あなたは先生ですか。", furigana: "あなた　は　せん・せい　ですか", translation: "Bạn là giáo viên à?" },
      { japanese: "はい、そうです。 / いいえ、違います。", furigana: "はい、そうです。 / いいえ、ちが・います", translation: "Vâng đúng rồi. / Không, không phải." },
    ],
    notes: "Trả lời: はい、そうです (Đúng vậy) / いいえ、違います (Không phải)",
    conversation: [
      { speaker: "A", japanese: "すみません、これはあなたの傘ですか。", translation: "Xin lỗi, đây là ô của bạn à?" },
      { speaker: "B", japanese: "はい、そうです。ありがとうございます。", translation: "Vâng đúng rồi. Cảm ơn bạn." },
    ],
  },
  {
    id: "s6-g1", grammarId: "g1", title: "Ví dụ giao tiếp", description: "Các mẫu câu giao tiếp thực tế dùng cấu trúc です/だ",
    formation: "Noun + です / だ",
    usage: "Áp dụng vào các tình huống giao tiếp hàng ngày: giới thiệu bản thân, hỏi thông tin, xác nhận.",
    whenToUse: "Trong mọi tình huống giao tiếp cần nói về danh từ.",
    whenNotToUse: "Không dùng cho động từ hoặc tính từ.",
    commonMistakes: "Quên thay đổi だ ↔ です theo ngữ cảnh.",
    examples: [
      { japanese: "はじめまして、田中です。", furigana: "はじめ・まして、た・なか　です", translation: "Rất vui được gặp, tôi là Tanaka." },
      { japanese: "サイズはMです。", furigana: "サイズ　は　エム　です", translation: "Size là M." },
      { japanese: "今日は火曜日だ。", furigana: "きょう　は　か・よう・び　だ", translation: "Hôm nay là thứ Ba." },
    ],
    notes: "Luôn chọn đúng thể lịch sự hay thông thường tùy ngữ cảnh.",
    conversation: [
      { speaker: "A", japanese: "お职业は。", translation: "Nghề nghiệp của bạn là gì?" },
      { speaker: "B", japanese: "私は医者です。あなたも医者ですか。", translation: "Tôi là bác sĩ. Bạn cũng là bác sĩ à?" },
    ],
  },

  // g2: 〜があります / います
  {
    id: "s1-g2", grammarId: "g2", title: "Tồn tại vật vô tri", description: "Diễn đạt sự tồn tại của vật vô tri",
    formation: "Place + に + Noun + が あります",
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
    id: "s2-g2", grammarId: "g2", title: "Tồn tại sinh vật", description: "Diễn đạt sự tồn tại của người và động vật",
    formation: "Place + に + Noun + が います",
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
  {
    id: "s3-g2", grammarId: "g2", title: "Chủ ngữ mới", description: "Giới thiệu chủ ngữ mới vào cuộc trò chuyện",
    formation: "Noun + は + Place + に あります / います",
    usage: "Khi giới thiệu một vật/người mới, đặt ở đầu câu. Dùng は để đánh dấu chủ ngữ mới.",
    whenToUse: "Khi muốn hỏi hoặc chỉ định vị trí của ai/cái gì.",
    whenNotToUse: "Khi nói về vị trí của một vật đã biết trong câu dài hơn.",
    commonMistakes: "Quên thay đổi が → は khi đã biết chủ ngữ.",
    examples: [
      { japanese: "鍵はどこにありますか。", furigana: "か・ぎ　は　どこ　に　あり・ます　か", translation: "Chìa khóa ở đâu?" },
      { japanese: "田中さんは今事務室にいます。", furigana: "た・なか　さん　は　いま　じ・む・しつ　に　い・ます", translation: "Anh Tanaka đang ở trong phòng làm việc." },
    ],
    notes: "Vật đã biết: は\nVật mới giới thiệu: が",
    conversation: [
      { speaker: "A", japanese: "すみません、トイレはどこですか。", translation: "Xin lỗi, nhà vệ sinh ở đâu?" },
      { speaker: "B", japanese: "あそこにあります。", translation: "Ở đằng kia." },
    ],
  },
  {
    id: "s4-g2", grammarId: "g2", title: "Quá khứ", description: "Diễn đạt sự tồn tại trong quá khứ",
    formation: "Place + に + Noun + が ありました / いました",
    usage: "Dùng  있었습니다 / いました để nói về sự tồn tại trong quá khứ.",
    whenToUse: "Khi kể về nơi có gì/ai đã từng ở trong quá khứ.",
    whenNotToUse: "Dùng ではありませんでした cho phủ định.",
    commonMistakes: "Dùng あります quá khứ thành ありした → sai.",
    examples: [
      { japanese: "以前、ここに大きい木がありました。", furigana: "い・ぜん、ここ　に　おお・き・い　き　が　あり・ました", translation: "Trước đây, có một cây lớn ở đây." },
      { japanese: "子供の頃、犬がいました。", furigana: "こ・ども　の　ころ、い・ぬ　が　い・ました", translation: "Khi còn nhỏ, có một con chó." },
    ],
    notes: "Phủ định quá khứ: ありませんでした / いませんでした",
  },
];

const LEVEL_FILTERS = ["All", "N5", "N4", "N3", "N2", "N1"] as const;

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

const structureTypeColors: Record<string, string> = {
  "Cấu trúc cơ bản": "bg-purple-50 text-purple-600 dark:bg-purple-950/30",
  "Phủ định": "bg-red-50 text-red-500 dark:bg-red-950/30",
  "Quá khứ": "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  "Hỏi đáp": "bg-sky-50 text-sky-600 dark:bg-sky-950/30",
  default: "bg-slate-50 text-slate-600 dark:bg-slate-800",
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/grammar/$grammarId")({ component: StructureListPage });

function StructureListPage() {
  const { grammarId } = Route.useParams();
  const grammar = GRAMMAR_DATA.find(g => g.id === grammarId);
  const structures = STRUCTURE_DATA.filter(s => s.grammarId === grammarId);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

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

  if (!grammar) {
    return (
      <div>
        <SakuraBg count={10} />
        <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Grammar not found.</p>
            <Link
              to="/student/grammar"
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Grammar List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = structures.filter(s => completed.has(s.id)).length;
  const progressPct = structures.length > 0 ? Math.round((completedCount / structures.length) * 100) : 0;

  return (
    <div>
      <SakuraBg count={12} />
      <div className="relative z-10 space-y-6">
        {/* Breadcrumb + Header */}
        <div className="px-6 pt-6 space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/student/grammar"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
            >
              <GraduationCap className="w-4 h-4" />
              Grammar
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${levelColors[grammar.level]}`}>
              {grammar.level}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-foreground">{grammar.title}</span>
          </div>

          {/* Grammar Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${levelGradients[grammar.level]} flex-shrink-0`}>
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-black">{grammar.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{grammar.meaning}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${levelColors[grammar.level]}`}>
                    JLPT {grammar.level}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <List className="w-3.5 h-3.5" />
                    {structures.length} structures
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-xl font-black text-blue-500">{structures.length}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5" /> Total
                </div>
              </div>
              <div className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-xl font-black text-green-500">{completedCount}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </div>
              </div>
              <div className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-xl font-black text-yellow-500">{progressPct}%</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <Target className="w-3.5 h-3.5" /> Progress
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Learning Progress</span>
              <span className="font-semibold text-foreground">{completedCount} / {structures.length} structures completed</span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-blue-400 to-pink-400 rounded-full transition-all"
              />
            </div>
          </div>
        </div>

        {/* Structure List */}
        <div className="px-6 pb-8">
          {structures.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <BookMarked className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="font-display font-black text-lg text-slate-700 dark:text-slate-200 mb-1.5">
                No structures yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Structures for this grammar pattern are being prepared.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {structures.map((structure, i) => {
                const isComp = completed.has(structure.id);
                const isBook = bookmarked.has(structure.id);
                return (
                  <motion.div
                    key={structure.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden hover:border-primary/20 transition"
                  >
                    <div className="flex items-center gap-4 p-5">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isComp
                          ? "bg-green-50 dark:bg-green-950/30"
                          : "bg-slate-50 dark:bg-slate-700/50"
                      }`}>
                        {isComp ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-black text-base text-slate-800 dark:text-white">
                            {structure.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${structureTypeColors[structure.title] ?? structureTypeColors.default}`}>
                            {structure.title}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {structure.description}
                        </p>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-500 dark:bg-purple-950/30`}>
                            {structure.formation}
                          </span>
                          {structure.examples.length > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {structure.examples.length} examples
                            </span>
                          )}
                          {structure.conversation && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {structure.conversation.length} conversations
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleComplete(structure.id)}
                          title={isComp ? "Mark incomplete" : "Mark complete"}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                            isComp
                              ? "bg-green-50 dark:bg-green-950/30 text-green-500"
                              : "bg-slate-50 dark:bg-slate-700/50 text-slate-300 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30"
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${isComp ? "fill-green-400" : ""}`} />
                        </button>

                        <button
                          onClick={() => toggleBookmark(structure.id)}
                          title={isBook ? "Remove bookmark" : "Bookmark"}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                            isBook
                              ? "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-500"
                              : "bg-slate-50 dark:bg-slate-700/50 text-slate-300 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                          }`}
                        >
                          {isBook
                            ? <BookmarkCheck className="w-4 h-4 fill-yellow-400" />
                            : <Bookmark className="w-4 h-4" />}
                        </button>

                        <Link
                          to="/student/grammar/$grammarId/$structureId"
                          params={{ grammarId, structureId: structure.id }}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-hero text-white hover:opacity-90 transition shadow"
                          title="View detail"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
