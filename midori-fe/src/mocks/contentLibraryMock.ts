// Content Library Mock Data
// This module provides mock data for the Admin Content Library management

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type ContentSkill = "vocabulary" | "grammar" | "reading" | "listening" | "shadowing";

export interface VocabularyItem {
  id: string;
  word: string;
  kanji: string;
  meaningVietnamese: string;
  meaningJapanese: string;
  exampleSentence: string;
  audioUrl?: string;
}

export interface GrammarItem {
  id: string;
  grammarPoint: string;
  meaningVietnamese: string;
  meaningJapanese: string;
  explanation: string;
  exampleSentence: string;
  notes?: string;
}

export interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ReadingItem {
  id: string;
  title: string;
  passage: string;
  translationVietnamese: string;
  questions: ReadingQuestion[];
}

export interface ListeningQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface ListeningItem {
  id: string;
  title: string;
  audioUrl: string;
  transcriptJapanese: string;
  translationVietnamese: string;
  questions: ListeningQuestion[];
}

export interface ShadowingSegment {
  id: string;
  startTime: number;
  endTime: number;
  japaneseText: string;
  vietnameseTranslation: string;
}

export interface ShadowingItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  transcriptJapanese: string;
  translationVietnamese: string;
  segments: ShadowingSegment[];
}

export interface Lesson {
  id: string;
  lessonNumber: number;
  title: string;
  description?: string;
}

export interface VocabularyLesson extends Lesson {
  items: VocabularyItem[];
}

export interface GrammarLesson extends Lesson {
  items: GrammarItem[];
}

export interface ReadingLesson extends Lesson {
  items: ReadingItem[];
}

export interface ListeningLesson extends Lesson {
  items: ListeningItem[];
}

export interface SkillContent {
  vocabulary: VocabularyLesson[];
  grammar: GrammarLesson[];
  reading: ReadingLesson[];
  listening: ListeningLesson[];
  shadowing: ShadowingItem[];
}

export interface LevelContent {
  level: JLPTLevel;
  skills: SkillContent;
}

export interface ContentStats {
  total: number;
  vocabulary: number;
  grammar: number;
  reading: number;
  listening: number;
  shadowing: number;
}

// ─── N5 Mock Data ───────────────────────────────────────────────────────────────

const vocabularyLessonsN5: VocabularyLesson[] = [
  {
    id: "vocab-n5-01",
    lessonNumber: 1,
    title: "Bài 1 - Giới từ cơ bản",
    description: "Học các giới từ cơ bản trong tiếng Nhật",
    items: [
      { id: "v-n5-01-01", word: "たべる", kanji: "食べる", meaningVietnamese: "Ăn", meaningJapanese: "食べます (tabemasu)", exampleSentence: "朝ごはんを食べます。", audioUrl: "/audio/taberu.mp3" },
      { id: "v-n5-01-02", word: "のむ", kanji: "飲む", meaningVietnamese: "Uống", meaningJapanese: "飲みます (nomimasu)", exampleSentence: "水を飲みます。", audioUrl: "/audio/nomu.mp3" },
      { id: "v-n5-01-03", word: "いく", kanji: "行く", meaningVietnamese: "Đi", meaningJapanese: "行きます (ikimasu)", exampleSentence: "学校へ行きます。", audioUrl: "/audio/iku.mp3" },
      { id: "v-n5-01-04", word: "くる", kanji: "来る", meaningVietnamese: "Đến", meaningJapanese: "来ます (kimasu)", exampleSentence: "友達が来ます。", audioUrl: "/audio/kuru.mp3" },
      { id: "v-n5-01-05", word: "みる", kanji: "見る", meaningVietnamese: "Xem", meaningJapanese: "見ます (mimasu)", exampleSentence: "映画を見ます。", audioUrl: "/audio/miru.mp3" },
    ]
  },
  {
    id: "vocab-n5-02",
    lessonNumber: 2,
    title: "Bài 2 - Động từ thường gặp",
    description: "Các động từ thường dùng trong giao tiếp hàng ngày",
    items: [
      { id: "v-n5-02-01", word: "きく", kanji: "聞く", meaningVietnamese: "Nghe/Hỏi", meaningJapanese: "聞きます (kikimasu)", exampleSentence: "音楽を聞きます。", audioUrl: "/audio/kiku.mp3" },
      { id: "v-n5-02-02", word: "よむ", kanji: "読む", meaningVietnamese: "Đọc", meaningJapanese: "読みます (yomimasu)", exampleSentence: "本を読みます。", audioUrl: "/audio/yomu.mp3" },
      { id: "v-n5-02-03", word: "かく", kanji: "書く", meaningVietnamese: "Viết", meaningJapanese: "書きます (kakimasu)", exampleSentence: "手紙を書きます。", audioUrl: "/audio/kaku.mp3" },
      { id: "v-n5-02-04", word: "はなす", kanji: "話す", meaningVietnamese: "Nói", meaningJapanese: "話します (hanashimasu)", exampleSentence: "日本語を話します。", audioUrl: "/audio/hanasu.mp3" },
    ]
  },
  {
    id: "vocab-n5-03",
    lessonNumber: 3,
    title: "Bài 3 - Danh từ cơ bản",
    description: "Các danh từ thường gặp trong cuộc sống hàng ngày",
    items: [
      { id: "v-n5-03-01", word: "がっこう", kanji: "学校", meaningVietnamese: "Trường học", meaningJapanese: "がっこう (gakkou)", exampleSentence: "学校へ行きます。", audioUrl: "/audio/gakkou.mp3" },
      { id: "v-n5-03-02", word: "ひと", kanji: "人", meaningVietnamese: "Người", meaningJapanese: "ひと (hito)", exampleSentence: "人は多いです。", audioUrl: "/audio/hito.mp3" },
      { id: "v-n5-03-03", word: "みず", kanji: "水", meaningVietnamese: "Nước", meaningJapanese: "みず (mizu)", exampleSentence: "水をください。", audioUrl: "/audio/mizu.mp3" },
    ]
  },
];

const grammarLessonsN5: GrammarLesson[] = [
  {
    id: "gram-n5-01",
    lessonNumber: 1,
    title: "Bài 1 - Cấu trúc V động từ",
    items: [
      { id: "g-n5-01-01", grammarPoint: "ます形", meaningVietnamese: "Thì hiện tại/tương lai, lịch sự", meaningJapanese: "Động từ cách lịch sự", explanation: "Đây là cách nói lịch sự trong tiếng Nhật. Được dùng trong giao tiếp hàng ngày.", exampleSentence: "私は朝ご飯を食べます。", notes: "Động từ cách ます được tạo bằng cách bỏ ます từ động từ thể ます và thêm ます" },
      { id: "g-n5-01-02", grammarPoint: "ません", meaningVietnamese: "Phủ định thì hiện tại/tương lai", meaningJapanese: "Phủ định cách lịch sự", explanation: "Dùng để phủ định một hành động trong tương lai hoặc hiện tại.", exampleSentence: "私は今日学校へ行きません。", notes: "Đổi ます → ません" },
      { id: "g-n5-01-03", grammarPoint: "ました", meaningVietnamese: "Thì quá khứ", meaningJapanese: "Quá khứ cách lịch sự", explanation: "Dùng để diễn tả một hành động đã xảy ra trong quá khứ.", exampleSentence: "昨日、映画を見ました。", notes: "Đổi ます → ました" },
    ]
  },
  {
    id: "gram-n5-02",
    lessonNumber: 2,
    title: "Bài 2 - Danh từ + です",
    items: [
      { id: "g-n5-02-01", grammarPoint: "〜です", meaningVietnamese: "Là...", meaningJapanese: "Câu khẳng định", explanation: "Dùng để khẳng định một sự vật hoặc đặc điểm.", exampleSentence: "私は学生です。", notes: "です dùng sau danh từ để tạo thành câu" },
      { id: "g-n5-02-02", grammarPoint: "〜ではありません", meaningVietnamese: "Không phải là...", meaningJapanese: "Câu phủ định", explanation: "Dùng để phủ định một sự vật hoặc đặc điểm.", exampleSentence: "私は先生ではありません。", notes: "ではありません = ではない + す" },
    ]
  },
  {
    id: "gram-n5-03",
    lessonNumber: 3,
    title: "Bài 3 - Câu hỏi",
    items: [
      { id: "g-n5-03-01", grammarPoint: "〜か", meaningVietnamese: "Câu hỏi Yes/No", meaningJapanese: "Trợ từ nghi vấn", explanation: "Thêm か vào cuối câu để biến câu khẳng định thành câu hỏi.", exampleSentence: "あなたは学生ですか。", notes: "Trả lời: はい、そうです。/ いいえ、違います。" },
    ]
  },
];

const readingLessonsN5: ReadingLesson[] = [
  {
    id: "read-n5-01",
    lessonNumber: 1,
    title: "Bài 1 - Giới thiệu bản thân",
    items: [
      {
        id: "read-n5-01-01",
        title: "Giới thiệu bản thân",
        passage: "私の名前は田中です。にほんごのがくせい です。がっこう で べんきょうします。らいしゅう、ともだちとちらほらをみにいきます。",
        translationVietnamese: "Tên tôi là Tanaka. Tôi là sinh viên tiếng Nhật. Tôi học ở trường. Tuần sau, tôi sẽ đi xem hoa anh đào với bạn.",
        questions: [
          { id: "rq-n5-01-01", question: "作者は誰ですか？", options: ["田中さん", "山本さん", "鈴木さん", "伊藤さん"], correctAnswer: 0, explanation: "私の名前は田中です。→ Tên tôi là Tanaka." },
          { id: "rq-n5-01-02", question: "作者は学生ですか？", options: ["はい、学生です", "いいえ、先生です", "いいえ、働きます", "わかりません"], correctAnswer: 0, explanation: "にほんごのがくせい です。→ Tôi là sinh viên tiếng Nhật." },
          { id: "rq-n5-01-03", question: "作者は何を見ますか？", options: ["映画", "花", "桜", "山"], correctAnswer: 2, explanation: "ちらほらをみにいきます。→ Sẽ đi xem hoa anh đào." },
        ]
      },
    ]
  },
  {
    id: "read-n5-02",
    lessonNumber: 2,
    title: "Bài 2 - Một ngày của tôi",
    items: [
      {
        id: "read-n5-02-01",
        title: "Một ngày của tôi",
        passage: "まいあさ、6じにおきます。7じに朝ごはんをたべます。8じにがっこうへいきます。がっこうではにほんごをべんきょうします。",
        translationVietnamese: "Mỗi sáng tôi dậy lúc 6 giờ. 7 giờ ăn sáng. 8 giờ đi học. Ở trường tôi học tiếng Nhật.",
        questions: [
          { id: "rq-n5-02-01", question: "作者はいつおきますか？", options: ["5時", "6時", "7時", "8時"], correctAnswer: 1, explanation: "まいあさ、6じにおきます。→ Mỗi sáng dậy lúc 6 giờ." },
          { id: "rq-n5-02-02", question: "作者はどこでべんきょうしますか？", options: ["いえ", "がっこう", "えいが", "ぎんこう"], correctAnswer: 1, explanation: "がっこうではにほんごをべんきょうします。→ Ở trường học tiếng Nhật." },
        ]
      },
    ]
  },
];

const listeningLessonsN5: ListeningLesson[] = [
  {
    id: "list-n5-01",
    lessonNumber: 1,
    title: "Bài 1 - Ở nhà hàng",
    items: [
      {
        id: "list-n5-01-01",
        title: "Ở nhà hàng",
        audioUrl: "/audio/restoran.mp3",
        transcriptJapanese: "店員：いらっしゃいませ。田中：すみません、コーヒーをください。店員：はい、わかりました。田中：これください。",
        translationVietnamese: "Nhân viên: Chào mừng quý khách. Tanaka: Xin lỗi, cho tôi một ly cà phê. Nhân viên: Vâng, tôi hiểu rồi. Tanaka: Cho tôi cái này.",
        questions: [
          { id: "lq-n5-01-01", question: "田中さんは何を注文しましたか？", options: ["お茶", "コーヒー", "みず", "ジュース"], correctAnswer: 1 },
        ]
      },
    ]
  },
  {
    id: "list-n5-02",
    lessonNumber: 2,
    title: "Bài 2 - Hỏi đường",
    items: [
      {
        id: "list-n5-02-01",
        title: "Hỏi đường",
        audioUrl: "/audio/ask_direction.mp3",
        transcriptJapanese: "A：すみません、ぎんこうはどこですか。B：あそこです。A：ありがとうございます。B：どういたしまして。",
        translationVietnamese: "A: Xin lỗi, ngân hàng ở đâu? B: Ở đằng kia. A: Cảm ơn. B: Không có gì.",
        questions: [
          { id: "lq-n5-02-01", question: "ぎんこうはどこですか？", options: ["ここ", "そこ", "あそこ", "どこ"], correctAnswer: 2 },
        ]
      },
    ]
  },
];

const shadowingItemsN5: ShadowingItem[] = [
  {
    id: "shadow-n5-01",
    title: "Giới thiệu bản thân - 自我介绍",
    videoUrl: "https://www.youtube.com/watch?v=example1",
    thumbnailUrl: "/thumbnails/intro.jpg",
    transcriptJapanese: "はじめまして。田中です。にほんから来ました。にほんごをべんきょうしています。よろしくおねがいします。",
    translationVietnamese: "Rất vui được gặp bạn. Tôi là Tanaka. Tôi đến từ Nhật Bản. Tôi đang học tiếng Nhật. Rất hân hạnh được làm quen.",
    segments: [
      { id: "seg-n5-01-01", startTime: 0, endTime: 5, japaneseText: "はじめまして。", vietnameseTranslation: "Rất vui được gặp bạn." },
      { id: "seg-n5-01-02", startTime: 5, endTime: 10, japaneseText: "田中です。", vietnameseTranslation: "Tôi là Tanaka." },
      { id: "seg-n5-01-03", startTime: 10, endTime: 16, japaneseText: "にほんから来ました。", vietnameseTranslation: "Tôi đến từ Nhật Bản." },
      { id: "seg-n5-01-04", startTime: 16, endTime: 22, japaneseText: "にほんごをべんきょうしています。", vietnameseTranslation: "Tôi đang học tiếng Nhật." },
      { id: "seg-n5-01-05", startTime: 22, endTime: 28, japaneseText: "よろしくおねがいします。", vietnameseTranslation: "Rất hân hạnh được làm quen." },
    ]
  },
  {
    id: "shadow-n5-02",
    title: "Hỏi thông tin - 询问信息",
    videoUrl: "https://www.youtube.com/watch?v=example2",
    thumbnailUrl: "/thumbnails/question.jpg",
    transcriptJapanese: "すみません、駅はどこですか。あそこです。ありがとうございます。",
    translationVietnamese: "Xin lỗi, ga tàu ở đâu? Ở đằng kia. Cảm ơn.",
    segments: [
      { id: "seg-n5-02-01", startTime: 0, endTime: 5, japaneseText: "すみません、駅はどこですか。", vietnameseTranslation: "Xin lỗi, ga tàu ở đâu?" },
      { id: "seg-n5-02-02", startTime: 5, endTime: 9, japaneseText: "あそこです。", vietnameseTranslation: "Ở đằng kia." },
      { id: "seg-n5-02-03", startTime: 9, endTime: 14, japaneseText: "ありがとうございます。", vietnameseTranslation: "Cảm ơn." },
    ]
  },
  {
    id: "shadow-n5-03",
    title: "Mua hàng - 购物",
    videoUrl: "https://www.youtube.com/watch?v=example3",
    thumbnailUrl: "/thumbnails/shopping.jpg",
    transcriptJapanese: "これはいくらですか。500えんです。じゃ、これをください。",
    translationVietnamese: "Cái này bao nhiêu tiền? 500 yên. Vậy cho tôi cái này.",
    segments: [
      { id: "seg-n5-03-01", startTime: 0, endTime: 5, japaneseText: "これはいくらですか。", vietnameseTranslation: "Cái này bao nhiêu tiền?" },
      { id: "seg-n5-03-02", startTime: 5, endTime: 9, japaneseText: "500えんです。", vietnameseTranslation: "500 yên." },
      { id: "seg-n5-03-03", startTime: 9, endTime: 14, japaneseText: "じゃ、これをください。", vietnameseTranslation: "Vậy cho tôi cái này." },
    ]
  },
];

// ─── N4 Mock Data ───────────────────────────────────────────────────────────────

const vocabularyLessonsN4: VocabularyLesson[] = [
  { id: "vocab-n4-01", lessonNumber: 1, title: "Bài 1 - Từ vựng về công việc", items: [
    { id: "v-n4-01-01", word: "しごと", kanji: "仕事", meaningVietnamese: "Công việc", meaningJapanese: "しごと (shigoto)", exampleSentence: "今日は仕事がありません。", audioUrl: "/audio/shigoto.mp3" },
    { id: "v-n4-01-02", word: "かいもの", kanji: "買い物", meaningVietnamese: "Mua sắm", meaningJapanese: "かいもの (kaimono)", exampleSentence: "週末に買い物に行きます。", audioUrl: "/audio/kaimono.mp3" },
  ]},
  { id: "vocab-n4-02", lessonNumber: 2, title: "Bài 2 - Từ vựng về thời gian", items: [
    { id: "v-n4-02-01", word: "きのう", kanji: "昨日", meaningVietnamese: "Ngày hôm qua", meaningJapanese: "きのう (kinou)", exampleSentence: "きのう映画を見ました。", audioUrl: "/audio/kinou.mp3" },
  ]},
  { id: "vocab-n4-03", lessonNumber: 3, title: "Bài 3 - Từ vựng về địa điểm", items: [
    { id: "v-n4-03-01", word: "びょういん", kanji: "病院", meaningVietnamese: "Bệnh viện", meaningJapanese: "びょういん (byouin)", exampleSentence: "びょういんへ行きました。", audioUrl: "/audio/byouin.mp3" },
  ]},
];

const grammarLessonsN4: GrammarLesson[] = [
  { id: "gram-n4-01", lessonNumber: 1, title: "Bài 1 - Thì quá khứ", items: [
    { id: "g-n4-01-01", grammarPoint: "〜ました", meaningVietnamese: "Đã làm gì", meaningJapanese: "Quá khứ cách lịch sự", explanation: "Dùng để diễn tả hành động đã xảy ra trong quá khứ.", exampleSentence: "昨日、日本食を食べました。", notes: "Đổi ます → ました" },
  ]},
  { id: "gram-n4-02", lessonNumber: 2, title: "Bài 2 - たいです", items: [
    { id: "g-n4-02-01", grammarPoint: "〜たいです", meaningVietnamese: "Muốn làm gì", meaningJapanese: "Nguyện vọng", explanation: "Dùng để diễn tả mong muốn, nguyện vọng của bản thân.", exampleSentence: "日本へ行きたいです。", notes: "Đổi ます → たいです" },
  ]},
  { id: "gram-n4-03", lessonNumber: 3, title: "Bài 3 - つもりです", items: [
    { id: "g-n4-03-01", grammarPoint: "〜つもりです", meaningVietnamese: "Dự định làm gì", meaningJapanese: "Kế hoạch", explanation: "Dùng để diễn tả kế hoạch, dự định trong tương lai.", exampleSentence: "来週、旅行に行くつもりです。", notes: "Động từ thể ます + つもりです" },
  ]},
];

const readingLessonsN4: ReadingLesson[] = [
  { id: "read-n4-01", lessonNumber: 1, title: "Bài 1 - Thư từ", items: [
    { id: "read-n4-01-01", title: "Thư từ", passage: "太郎さんへ きのうの手紙をどうもありがとう。らいしゅうのミーティングのことですが、3じからです。まっている地点に行きます。", translationVietnamese: "Cảm ơn thư hôm qua của bạn. Về cuộc họp tuần sau, bắt đầu từ 3 giờ. Tôi sẽ đến địa điểm đã hẹn.", questions: [
      { id: "rq-n4-01-01", question: "ミーティングはいつからですか？", options: ["2時", "3時", "4時", "5時"], correctAnswer: 1 },
    ]},
  ]},
  { id: "read-n4-02", lessonNumber: 2, title: "Bài 2 - Email", items: [
    { id: "read-n4-02-01", title: "Email", passage: "田中さんへ らいしゅうのの日曜日にPartyがあります。6じからです。あなたも来ますか。", translationVietnamese: "Tuần sau chủ nhật có tiệc. Bắt đầu từ 6 giờ. Bạn cũng đến chứ?", questions: [] },
  ]},
];

const listeningLessonsN4: ListeningLesson[] = [
  { id: "list-n4-01", lessonNumber: 1, title: "Bài 1 - Kế hoạch cuối tuần", items: [
    { id: "list-n4-01-01", title: "Kế hoạch cuối tuần", audioUrl: "/audio/weekend.mp3", transcriptJapanese: "今度の週末、何をしますか。びょういんへ行きます。でも、午前中はともだちとコーヒーを飲みます。", translationVietnamese: "Cuối tuần này làm gì? Tôi đi bệnh viện. Nhưng buổi sáng tôi uống cà phê với bạn.", questions: [
      { id: "lq-n4-01-01", question: "周末做什么？", options: ["去医院", "去学校", "去公司", "留在家"], correctAnswer: 0 },
    ]},
  ]},
  { id: "list-n4-02", lessonNumber: 2, title: "Bài 2 - Weather", items: [
    { id: "list-n4-02-01", title: "Weather", audioUrl: "/audio/weather.mp3", transcriptJapanese: "今日の天気はどうですか。今日は晴れです。明日も晴れです。", translationVietnamese: "Hôm nay thời tiết thế nào? Hôm nay trời nắng. Ngày mai cũng nắng.", questions: [] },
  ]},
];

const shadowingItemsN4: ShadowingItem[] = [
  {
    id: "shadow-n4-01",
    title: "Kế hoạch ngày nghỉ - 休息日的计划",
    videoUrl: "https://www.youtube.com/watch?v=example4",
    thumbnailUrl: "/thumbnails/plan.jpg",
    transcriptJapanese: "今度の休み、何をするつもりですか。旅行に行くつもりです。どこへ行きますか。北海道へ行くつもりです。",
    translationVietnamese: "Kỳ nghỉ tới có kế hoạch gì? Tôi định đi du lịch. Đi đâu? Tôi định đi Hokkaido.",
    segments: [
      { id: "seg-n4-01-01", startTime: 0, endTime: 6, japaneseText: "今度の休み、何をするつもりですか。", vietnameseTranslation: "Kỳ nghỉ tới có kế hoạch gì?" },
      { id: "seg-n4-01-02", startTime: 6, endTime: 11, japaneseText: "旅行に行くつもりです。", vietnameseTranslation: "Tôi định đi du lịch." },
      { id: "seg-n4-01-03", startTime: 11, endTime: 15, japaneseText: "どこへ行きますか。", vietnameseTranslation: "Đi đâu?" },
      { id: "seg-n4-01-04", startTime: 15, endTime: 21, japaneseText: "北海道へ行くつもりです。", vietnameseTranslation: "Tôi định đi Hokkaido." },
    ]
  },
];

// ─── N3 Mock Data ───────────────────────────────────────────────────────────────

const vocabularyLessonsN3: VocabularyLesson[] = [
  { id: "vocab-n3-01", lessonNumber: 1, title: "Bài 1 - Từ vựng N3", items: [
    { id: "v-n3-01-01", word: "経験", kanji: "経験", meaningVietnamese: "Kinh nghiệm", meaningJapanese: "けいけん (keiken)", exampleSentence: "日本での経験を生かしたい。", audioUrl: "/audio/keiken.mp3" },
  ]},
];

const grammarLessonsN3: GrammarLesson[] = [
  { id: "gram-n3-01", lessonNumber: 1, title: "Bài 1 - ために", items: [
    { id: "g-n3-01-01", grammarPoint: "〜ために", meaningVietnamese: "Để làm gì, nhằm mục đích", meaningJapanese: "Mục đích", explanation: "Dùng để diễn tả mục đích, ý đồ.", exampleSentence: "合格するために、毎日勉強しています。", notes: "Danh từ + のために / Động từ thể ます - ます + ために" },
  ]},
];

const readingLessonsN3: ReadingLesson[] = [
  { id: "read-n3-01", lessonNumber: 1, title: "Bài 1 - Bài đọc N3", items: [
    { id: "read-n3-01-01", title: "Bài đọc N3", passage: "日本の会社では加班ることは当たり前になっています。でも、最近、働き改革が必要だという声が高まっています。", translationVietnamese: "Ở các công ty Nhật Bản, làm thêm giờ đã trở nên bình thường. Tuy nhiên, gần đây, tiếng nói yêu cầu cải cách cách làm việc đang tăng lên.", questions: [] },
  ]},
];

const listeningLessonsN3: ListeningLesson[] = [
  { id: "list-n3-01", lessonNumber: 1, title: "Bài 1 - Nghe N3", items: [
    { id: "list-n3-01-01", title: "Nghe N3", audioUrl: "/audio/n3-01.mp3", transcriptJapanese: "最近、日本の若者の間での転職が増えています。", translationVietnamese: "Gần đây, việc chuyển công việc giữa người trẻ Nhật Bản đang tăng lên.", questions: [] },
  ]},
];

const shadowingItemsN3: ShadowingItem[] = [
  {
    id: "shadow-n3-01",
    title: "ビジネス会話 - Giao tiếp kinh doanh",
    videoUrl: "https://www.youtube.com/watch?v=example5",
    thumbnailUrl: "/thumbnails/business.jpg",
    transcriptJapanese: "お忙しいところ恐れ入ります。田中商事の田中ですが。",
    translationVietnamese: "Xin lỗi đã làm phiền anh/chị đang bận. Tôi là Tanaka từ Tanaka Shōji.",
    segments: []
  },
];

// ─── N2 Mock Data ───────────────────────────────────────────────────────────────

const vocabularyLessonsN2: VocabularyLesson[] = [
  { id: "vocab-n2-01", lessonNumber: 1, title: "Bài 1 - Từ vựng N2", items: [
    { id: "v-n2-01-01", word: "改革", kanji: "改革", meaningVietnamese: "Cải cách", meaningJapanese: "かいかく (kaikaku)", exampleSentence: "教育改革が必要です。", audioUrl: "/audio/kaikaku.mp3" },
  ]},
];

const grammarLessonsN2: GrammarLesson[] = [
  { id: "gram-n2-01", lessonNumber: 1, title: "Bài 1 - ものの", items: [
    { id: "g-n2-01-01", grammarPoint: "〜ものの", meaningVietnamese: "Mặc dù...nhưng...", meaningJapanese: "Nhượng bộ", explanation: "Diễn tả nghĩa nhượng bộ, dù có điều gì đó nhưng...", exampleSentence: "聞いたものの、覚えていない。", notes: "Thể thông thường + ものの" },
  ]},
];

const readingLessonsN2: ReadingLesson[] = [
  { id: "read-n2-01", lessonNumber: 1, title: "Bài 1 - Bài đọc N2", items: [
    { id: "read-n2-01-01", title: "Bài đọc N2", passage: "現代社会において、情報技術の発展はめざましいものがある。しかし、その一方で情報の信頼性问题也越来越严重。", translationVietnamese: "Trong xã hội hiện đại, sự phát triển của công nghệ thông tin rất đáng chú ý. Tuy nhiên, mặt khác, vấn đề độ tin cậy của thông tin ngày càng nghiêm trọng.", questions: [] },
  ]},
];

const listeningLessonsN2: ListeningLesson[] = [
  { id: "list-n2-01", lessonNumber: 1, title: "Bài 1 - Nghe N2", items: [
    { id: "list-n2-01-01", title: "Nghe N2", audioUrl: "/audio/n2-01.mp3", transcriptJapanese: "最近の调查显示，年轻人对工作的价值观正在发生变化。", translationVietnamese: "Khảo sát gần đây cho thấy, giá trị về công việc của người trẻ đang thay đổi.", questions: [] },
  ]},
];

const shadowingItemsN2: ShadowingItem[] = [
  {
    id: "shadow-n2-01",
    title: "プレゼン発表 - Thuyết trình",
    videoUrl: "https://www.youtube.com/watch?v=example6",
    thumbnailUrl: "/thumbnails/presentation.jpg",
    transcriptJapanese: "本日のテーマは「高齢社会の課題と対策」についてです。",
    translationVietnamese: "Chủ đề hôm nay là về 'Những thách thức và biện pháp đối với xã hội già hóa'.",
    segments: []
  },
];

// ─── N1 Mock Data ───────────────────────────────────────────────────────────────

const vocabularyLessonsN1: VocabularyLesson[] = [
  { id: "vocab-n1-01", lessonNumber: 1, title: "Bài 1 - Từ vựng N1", items: [
    { id: "v-n1-01-01", word: "多様性", kanji: "多様性", meaningVietnamese: "Tính đa dạng", meaningJapanese: "たようせい (tayousei)", exampleSentence: "社会の多様性を尊重すべきです。", audioUrl: "/audio/tayousei.mp3" },
  ]},
];

const grammarLessonsN1: GrammarLesson[] = [
  { id: "gram-n1-01", lessonNumber: 1, title: "Bài 1 - をものともせず", items: [
    { id: "g-n1-01-01", grammarPoint: "〜をものともせず", meaningVietnamese: "Không sợ hãi, không nao núng trước", meaningJapanese: "Bất chấp", explanation: "Diễn tả ý chí không bị khuất phục bởi khó khăn, thử thách.", exampleSentence: "困難をものともせず前進する。", notes: "Danh từ + をものともせず" },
  ]},
];

const readingLessonsN1: ReadingLesson[] = [
  { id: "read-n1-01", lessonNumber: 1, title: "Bài 1 - Bài đọc N1", items: [
    { id: "read-n1-01-01", title: "Bài đọc N1", passage: "グローバル化が進む現代において、異文化間の理解と交流は重要性を増している。しかし、表面的接触の増加が必ずしも相互理解の深化につながるわけではない。", translationVietnamese: "Trong thời đại toàn cầu hóa ngày càng sâu rộng, sự hiểu biết và giao lưu giữa các nền văn hóa khác nhau đang ngày càng quan trọng. Tuy nhiên, việc tăng tiếp xúc bề mặt không nhất thiết dẫn đến sự hiểu biết sâu sắc hơn lẫn nhau.", questions: [] },
  ]},
];

const listeningLessonsN1: ListeningLesson[] = [
  { id: "list-n1-01", lessonNumber: 1, title: "Bài 1 - Nghe N1", items: [
    { id: "list-n1-01-01", title: "Nghe N1", audioUrl: "/audio/n1-01.mp3", transcriptJapanese: "现代社会においてコミュニケーションの形は大きく変わりつつある。", translationVietnamese: "Trong xã hội hiện đại, hình thức giao tiếp đang thay đổi đáng kể.", questions: [] },
  ]},
];

const shadowingItemsN1: ShadowingItem[] = [
  {
    id: "shadow-n1-01",
    title: "学術講演 - Bài giảng học thuật",
    videoUrl: "https://www.youtube.com/watch?v=example7",
    thumbnailUrl: "/thumbnails/academic.jpg",
    transcriptJapanese: "本日の演讲は、人工知能の进化が人类社会に与える影响について検討いたします。",
    translationVietnamese: "Bài giảng hôm nay sẽ xem xét ảnh hưởng của trí tuệ nhân tạo đối với xã hội loài người.",
    segments: []
  },
];

// ─── All Content Data ─────────────────────────────────────────────────────────

export const contentLibraryData: Record<JLPTLevel, LevelContent> = {
  N5: { level: "N5", skills: { vocabulary: vocabularyLessonsN5, grammar: grammarLessonsN5, reading: readingLessonsN5, listening: listeningLessonsN5, shadowing: shadowingItemsN5 } },
  N4: { level: "N4", skills: { vocabulary: vocabularyLessonsN4, grammar: grammarLessonsN4, reading: readingLessonsN4, listening: listeningLessonsN4, shadowing: shadowingItemsN4 } },
  N3: { level: "N3", skills: { vocabulary: vocabularyLessonsN3, grammar: grammarLessonsN3, reading: readingLessonsN3, listening: listeningLessonsN3, shadowing: shadowingItemsN3 } },
  N2: { level: "N2", skills: { vocabulary: vocabularyLessonsN2, grammar: grammarLessonsN2, reading: readingLessonsN2, listening: listeningLessonsN2, shadowing: shadowingItemsN2 } },
  N1: { level: "N1", skills: { vocabulary: vocabularyLessonsN1, grammar: grammarLessonsN1, reading: readingLessonsN1, listening: listeningLessonsN1, shadowing: shadowingItemsN1 } },
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

export function getContentStats(level: JLPTLevel): ContentStats {
  const content = contentLibraryData[level];
  if (!content) return { total: 0, vocabulary: 0, grammar: 0, reading: 0, listening: 0, shadowing: 0 };
  const vocabulary = content.skills.vocabulary.reduce((sum, l) => sum + l.items.length, 0);
  const grammar = content.skills.grammar.reduce((sum, l) => sum + l.items.length, 0);
  const reading = content.skills.reading.reduce((sum, l) => sum + l.items.length, 0);
  const listening = content.skills.listening.reduce((sum, l) => sum + l.items.length, 0);
  const shadowing = content.skills.shadowing.length;
  return { total: vocabulary + grammar + reading + listening + shadowing, vocabulary, grammar, reading, listening, shadowing };
}

export function getAllLevels(): JLPTLevel[] {
  return ["N5", "N4", "N3", "N2", "N1"];
}

export function getSkillLabels(): Record<ContentSkill, string> {
  return { vocabulary: "Vocabulary", grammar: "Grammar", reading: "Reading", listening: "Listening", shadowing: "Shadowing" };
}

export function getSkillIcons(): Record<ContentSkill, string> {
  return { vocabulary: "book-open", grammar: "file-text", reading: "book-marked", listening: "headphones", shadowing: "mic" };
}

// ─── Runtime Validation ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateVocabularyItem(item: unknown, path: string): string[] {
  const errors: string[] = [];
  const v = item as Record<string, unknown>;
  if (!v?.id) errors.push(`${path}: missing id`);
  if (!v?.word) errors.push(`${path}: missing word`);
  if (!v?.kanji) errors.push(`${path}: missing kanji`);
  if (!v?.meaningVietnamese) errors.push(`${path}: missing meaningVietnamese`);
  if (!v?.meaningJapanese) errors.push(`${path}: missing meaningJapanese`);
  if (!v?.exampleSentence) errors.push(`${path}: missing exampleSentence`);
  return errors;
}

function validateGrammarItem(item: unknown, path: string): string[] {
  const errors: string[] = [];
  const g = item as Record<string, unknown>;
  if (!g?.id) errors.push(`${path}: missing id`);
  if (!g?.grammarPoint) errors.push(`${path}: missing grammarPoint`);
  if (!g?.meaningVietnamese) errors.push(`${path}: missing meaningVietnamese`);
  if (!g?.meaningJapanese) errors.push(`${path}: missing meaningJapanese`);
  if (!g?.explanation) errors.push(`${path}: missing explanation`);
  if (!g?.exampleSentence) errors.push(`${path}: missing exampleSentence`);
  return errors;
}

function validateReadingItem(item: unknown, path: string): string[] {
  const errors: string[] = [];
  const r = item as Record<string, unknown>;
  if (!r?.id) errors.push(`${path}: missing id`);
  if (!r?.title) errors.push(`${path}: missing title`);
  if (!r?.passage) errors.push(`${path}: missing passage`);
  if (!r?.translationVietnamese) errors.push(`${path}: missing translationVietnamese`);
  return errors;
}

function validateListeningItem(item: unknown, path: string): string[] {
  const errors: string[] = [];
  const l = item as Record<string, unknown>;
  if (!l?.id) errors.push(`${path}: missing id`);
  if (!l?.title) errors.push(`${path}: missing title`);
  if (!l?.audioUrl) errors.push(`${path}: missing audioUrl`);
  if (!l?.transcriptJapanese) errors.push(`${path}: missing transcriptJapanese`);
  if (!l?.translationVietnamese) errors.push(`${path}: missing translationVietnamese`);
  return errors;
}

function validateShadowingSegment(seg: unknown, path: string): string[] {
  const errors: string[] = [];
  const s = seg as Record<string, unknown>;
  if (!s?.id) errors.push(`${path}: missing id`);
  if (typeof s?.startTime !== "number") errors.push(`${path}: missing startTime`);
  if (typeof s?.endTime !== "number") errors.push(`${path}: missing endTime`);
  if (!s?.japaneseText) errors.push(`${path}: missing japaneseText`);
  if (!s?.vietnameseTranslation) errors.push(`${path}: missing vietnameseTranslation`);
  return errors;
}

function validateShadowingItem(item: unknown, path: string): string[] {
  const errors: string[] = [];
  const sh = item as Record<string, unknown>;
  if (!sh?.id) errors.push(`${path}: missing id`);
  if (!sh?.title) errors.push(`${path}: missing title`);
  if (!sh?.videoUrl) errors.push(`${path}: missing videoUrl`);
  if (!sh?.thumbnailUrl) errors.push(`${path}: missing thumbnailUrl`);
  if (!sh?.transcriptJapanese) errors.push(`${path}: missing transcriptJapanese`);
  if (!sh?.translationVietnamese) errors.push(`${path}: missing translationVietnamese`);
  return errors;
}

function validateLesson(lesson: unknown, skillName: string, path: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const l = lesson as Record<string, unknown>;

  if (!l?.id) errors.push(`${path}: missing id`);
  if (typeof l?.lessonNumber !== "number") errors.push(`${path}: missing lessonNumber`);
  if (!l?.title) errors.push(`${path}: missing title`);

  const items = l?.items as unknown[];
  if (!Array.isArray(items)) {
    errors.push(`${path}: items is not an array`);
  } else if (items.length === 0) {
    warnings.push(`${path}: items is empty`);
  } else {
    if (skillName === "vocabulary") items.forEach((item, i) => errors.push(...validateVocabularyItem(item, `${path}.items[${i}]`)));
    else if (skillName === "grammar") items.forEach((item, i) => errors.push(...validateGrammarItem(item, `${path}.items[${i}]`)));
    else if (skillName === "reading") items.forEach((item, i) => errors.push(...validateReadingItem(item, `${path}.items[${i}]`)));
    else if (skillName === "listening") items.forEach((item, i) => errors.push(...validateListeningItem(item, `${path}.items[${i}]`)));
  }
  return { errors, warnings };
}

export function validateContentLibraryData(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const levels: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
  const skills: ContentSkill[] = ["vocabulary", "grammar", "reading", "listening", "shadowing"];

  for (const level of levels) {
    const content = contentLibraryData[level];
    if (!content) { errors.push(`Missing level: ${level}`); continue; }
    if (!content.skills) { errors.push(`${level}: missing skills`); continue; }

    for (const skill of skills) {
      const skillData = content.skills[skill];
      if (!Array.isArray(skillData)) { errors.push(`${level}.${skill}: is not an array`); continue; }

      if (skill === "shadowing") {
        (skillData as ShadowingItem[]).forEach((item, i) => {
          errors.push(...validateShadowingItem(item, `${level}.shadowing[${i}]`));
          if (Array.isArray(item.segments)) {
            item.segments.forEach((seg, j) => errors.push(...validateShadowingSegment(seg, `${level}.shadowing[${i}].segments[${j}]`)));
          }
        });
      } else {
        (skillData as (VocabularyLesson | GrammarLesson | ReadingLesson | ListeningLesson)[]).forEach((lesson, i) => {
          const result = validateLesson(lesson, skill, `${level}.${skill}[${i}]`);
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        });
      }
    }
  }

  if (errors.length > 0) console.error("[Content Library] Validation FAILED:", errors);
  else console.log("[Content Library] Validation PASSED");
  if (warnings.length > 0) console.warn("[Content Library] Warnings:", warnings);

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Runtime Store with CRUD ────────────────────────────────────────────────────

// Deep clone the original data for runtime mutations
let contentStore: Record<JLPTLevel, LevelContent> = JSON.parse(JSON.stringify(contentLibraryData));

// Force re-render for components that use this store
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notifyListeners() {
  listeners.forEach(listener => listener());
}

// ─── Vocabulary CRUD ───────────────────────────────────────────────────────────

export function getVocabularyLessons(level: JLPTLevel): VocabularyLesson[] {
  return contentStore[level]?.skills?.vocabulary || [];
}

export function addVocabularyLesson(level: JLPTLevel, lesson: VocabularyLesson): void {
  contentStore[level].skills.vocabulary.push(lesson);
  notifyListeners();
}

export function updateVocabularyLesson(level: JLPTLevel, lessonId: string, updates: Partial<VocabularyLesson>): void {
  const lesson = contentStore[level].skills.vocabulary.find(l => l.id === lessonId);
  if (lesson) Object.assign(lesson, updates);
  notifyListeners();
}

export function deleteVocabularyLesson(level: JLPTLevel, lessonId: string): void {
  contentStore[level].skills.vocabulary = contentStore[level].skills.vocabulary.filter(l => l.id !== lessonId);
  notifyListeners();
}

export function addVocabularyItem(level: JLPTLevel, lessonId: string, item: VocabularyItem): void {
  const lesson = contentStore[level].skills.vocabulary.find(l => l.id === lessonId);
  if (lesson) lesson.items.push(item);
  notifyListeners();
}

export function updateVocabularyItem(level: JLPTLevel, lessonId: string, itemId: string, updates: Partial<VocabularyItem>): void {
  const lesson = contentStore[level].skills.vocabulary.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) Object.assign(item, updates);
  }
  notifyListeners();
}

export function deleteVocabularyItem(level: JLPTLevel, lessonId: string, itemId: string): void {
  const lesson = contentStore[level].skills.vocabulary.find(l => l.id === lessonId);
  if (lesson) {
    lesson.items = lesson.items.filter(i => i.id !== itemId);
  }
  notifyListeners();
}

// ─── Grammar CRUD ─────────────────────────────────────────────────────────────

export function getGrammarLessons(level: JLPTLevel): GrammarLesson[] {
  return contentStore[level]?.skills?.grammar || [];
}

export function addGrammarLesson(level: JLPTLevel, lesson: GrammarLesson): void {
  contentStore[level].skills.grammar.push(lesson);
  notifyListeners();
}

export function updateGrammarLesson(level: JLPTLevel, lessonId: string, updates: Partial<GrammarLesson>): void {
  const lesson = contentStore[level].skills.grammar.find(l => l.id === lessonId);
  if (lesson) Object.assign(lesson, updates);
  notifyListeners();
}

export function deleteGrammarLesson(level: JLPTLevel, lessonId: string): void {
  contentStore[level].skills.grammar = contentStore[level].skills.grammar.filter(l => l.id !== lessonId);
  notifyListeners();
}

export function addGrammarItem(level: JLPTLevel, lessonId: string, item: GrammarItem): void {
  const lesson = contentStore[level].skills.grammar.find(l => l.id === lessonId);
  if (lesson) lesson.items.push(item);
  notifyListeners();
}

export function updateGrammarItem(level: JLPTLevel, lessonId: string, itemId: string, updates: Partial<GrammarItem>): void {
  const lesson = contentStore[level].skills.grammar.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) Object.assign(item, updates);
  }
  notifyListeners();
}

export function deleteGrammarItem(level: JLPTLevel, lessonId: string, itemId: string): void {
  const lesson = contentStore[level].skills.grammar.find(l => l.id === lessonId);
  if (lesson) {
    lesson.items = lesson.items.filter(i => i.id !== itemId);
  }
  notifyListeners();
}

// ─── Reading CRUD ─────────────────────────────────────────────────────────────

export function getReadingLessons(level: JLPTLevel): ReadingLesson[] {
  return contentStore[level]?.skills?.reading || [];
}

export function addReadingLesson(level: JLPTLevel, lesson: ReadingLesson): void {
  contentStore[level].skills.reading.push(lesson);
  notifyListeners();
}

export function updateReadingLesson(level: JLPTLevel, lessonId: string, updates: Partial<ReadingLesson>): void {
  const lesson = contentStore[level].skills.reading.find(l => l.id === lessonId);
  if (lesson) Object.assign(lesson, updates);
  notifyListeners();
}

export function deleteReadingLesson(level: JLPTLevel, lessonId: string): void {
  contentStore[level].skills.reading = contentStore[level].skills.reading.filter(l => l.id !== lessonId);
  notifyListeners();
}

export function addReadingItem(level: JLPTLevel, lessonId: string, item: ReadingItem): void {
  const lesson = contentStore[level].skills.reading.find(l => l.id === lessonId);
  if (lesson) lesson.items.push(item);
  notifyListeners();
}

export function updateReadingItem(level: JLPTLevel, lessonId: string, itemId: string, updates: Partial<ReadingItem>): void {
  const lesson = contentStore[level].skills.reading.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) Object.assign(item, updates);
  }
  notifyListeners();
}

export function deleteReadingItem(level: JLPTLevel, lessonId: string, itemId: string): void {
  const lesson = contentStore[level].skills.reading.find(l => l.id === lessonId);
  if (lesson) {
    lesson.items = lesson.items.filter(i => i.id !== itemId);
  }
  notifyListeners();
}

export function addReadingQuestion(level: JLPTLevel, lessonId: string, itemId: string, question: ReadingQuestion): void {
  const lesson = contentStore[level].skills.reading.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) item.questions.push(question);
  }
  notifyListeners();
}

export function updateReadingQuestion(level: JLPTLevel, lessonId: string, itemId: string, questionId: string, updates: Partial<ReadingQuestion>): void {
  const lesson = contentStore[level].skills.reading.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) {
      const question = item.questions.find(q => q.id === questionId);
      if (question) Object.assign(question, updates);
    }
  }
  notifyListeners();
}

export function deleteReadingQuestion(level: JLPTLevel, lessonId: string, itemId: string, questionId: string): void {
  const lesson = contentStore[level].skills.reading.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) {
      item.questions = item.questions.filter(q => q.id !== questionId);
    }
  }
  notifyListeners();
}

// ─── Listening CRUD ────────────────────────────────────────────────────────────

export function getListeningLessons(level: JLPTLevel): ListeningLesson[] {
  return contentStore[level]?.skills?.listening || [];
}

export function addListeningLesson(level: JLPTLevel, lesson: ListeningLesson): void {
  contentStore[level].skills.listening.push(lesson);
  notifyListeners();
}

export function updateListeningLesson(level: JLPTLevel, lessonId: string, updates: Partial<ListeningLesson>): void {
  const lesson = contentStore[level].skills.listening.find(l => l.id === lessonId);
  if (lesson) Object.assign(lesson, updates);
  notifyListeners();
}

export function deleteListeningLesson(level: JLPTLevel, lessonId: string): void {
  contentStore[level].skills.listening = contentStore[level].skills.listening.filter(l => l.id !== lessonId);
  notifyListeners();
}

export function addListeningItem(level: JLPTLevel, lessonId: string, item: ListeningItem): void {
  const lesson = contentStore[level].skills.listening.find(l => l.id === lessonId);
  if (lesson) lesson.items.push(item);
  notifyListeners();
}

export function updateListeningItem(level: JLPTLevel, lessonId: string, itemId: string, updates: Partial<ListeningItem>): void {
  const lesson = contentStore[level].skills.listening.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) Object.assign(item, updates);
  }
  notifyListeners();
}

export function deleteListeningItem(level: JLPTLevel, lessonId: string, itemId: string): void {
  const lesson = contentStore[level].skills.listening.find(l => l.id === lessonId);
  if (lesson) {
    lesson.items = lesson.items.filter(i => i.id !== itemId);
  }
  notifyListeners();
}

export function addListeningQuestion(level: JLPTLevel, lessonId: string, itemId: string, question: ListeningQuestion): void {
  const lesson = contentStore[level].skills.listening.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) item.questions.push(question);
  }
  notifyListeners();
}

export function updateListeningQuestion(level: JLPTLevel, lessonId: string, itemId: string, questionId: string, updates: Partial<ListeningQuestion>): void {
  const lesson = contentStore[level].skills.listening.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) {
      const question = item.questions.find(q => q.id === questionId);
      if (question) Object.assign(question, updates);
    }
  }
  notifyListeners();
}

export function deleteListeningQuestion(level: JLPTLevel, lessonId: string, itemId: string, questionId: string): void {
  const lesson = contentStore[level].skills.listening.find(l => l.id === lessonId);
  if (lesson) {
    const item = lesson.items.find(i => i.id === itemId);
    if (item) {
      item.questions = item.questions.filter(q => q.id !== questionId);
    }
  }
  notifyListeners();
}

// ─── Shadowing CRUD ───────────────────────────────────────────────────────────

export function getShadowingItems(level: JLPTLevel): ShadowingItem[] {
  return contentStore[level]?.skills?.shadowing || [];
}

export function addShadowingItem(level: JLPTLevel, item: ShadowingItem): void {
  contentStore[level].skills.shadowing.push(item);
  notifyListeners();
}

export function updateShadowingItem(level: JLPTLevel, itemId: string, updates: Partial<ShadowingItem>): void {
  const item = contentStore[level].skills.shadowing.find(i => i.id === itemId);
  if (item) Object.assign(item, updates);
  notifyListeners();
}

export function deleteShadowingItem(level: JLPTLevel, itemId: string): void {
  contentStore[level].skills.shadowing = contentStore[level].skills.shadowing.filter(i => i.id !== itemId);
  notifyListeners();
}

export function addShadowingSegment(level: JLPTLevel, itemId: string, segment: ShadowingSegment): void {
  const item = contentStore[level].skills.shadowing.find(i => i.id === itemId);
  if (item) item.segments.push(segment);
  notifyListeners();
}

export function updateShadowingSegment(level: JLPTLevel, itemId: string, segmentId: string, updates: Partial<ShadowingSegment>): void {
  const item = contentStore[level].skills.shadowing.find(i => i.id === itemId);
  if (item) {
    const segment = item.segments.find(s => s.id === segmentId);
    if (segment) Object.assign(segment, updates);
  }
  notifyListeners();
}

export function deleteShadowingSegment(level: JLPTLevel, itemId: string, segmentId: string): void {
  const item = contentStore[level].skills.shadowing.find(i => i.id === itemId);
  if (item) {
    item.segments = item.segments.filter(s => s.id !== segmentId);
  }
  notifyListeners();
}

// ─── Runtime Store Access ────────────────────────────────────────────────────

export function getContentStore(): Record<JLPTLevel, LevelContent> {
  return contentStore;
}

export function resetContentStore(): void {
  contentStore = JSON.parse(JSON.stringify(contentLibraryData));
  notifyListeners();
}

// ─── ID Generator ────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Run validation on module load
if (typeof window !== "undefined") {
  setTimeout(() => validateContentLibraryData(), 100);
}
