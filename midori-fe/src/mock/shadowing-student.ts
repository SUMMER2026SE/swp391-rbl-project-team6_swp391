// ─── Student Shadowing Mock Data ─────────────────────────────────────────────────

export type JLPTLevel = "N5" | "N4" | "N3";

export interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
  example?: string;
  exampleMeaning?: string;
}

export interface GrammarPoint {
  grammar: string;
  meaning: string;
  usage: string;
  example: string;
  exampleTranslation: string;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  vocabulary: VocabularyItem[];
  grammar?: GrammarPoint;
}

export interface ShadowingSentence {
  id: string;
  text: string;
  translation: string;
  vocabulary: VocabularyItem[];
  grammar?: GrammarPoint;
  pitchAccent?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  titleVn: string;
  thumbnail: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  transcriptAvailable: boolean;
  script: TranscriptSegment[];
  sentences: ShadowingSentence[];
}

export interface ShadowingTopic {
  id: string;
  title: string;
  titleVn: string;
  thumbnail: string;
  jlptLevel: JLPTLevel;
  description: string;
  videoCount: number;
  totalDuration: string;
  videos: VideoItem[];
}

// ─── N5 Topics ─────────────────────────────────────────────────────────────────

const selfIntroductionVideos: VideoItem[] = [
  {
    id: "n5-intro-1",
    title: "自己紹介します",
    titleVn: "Tự giới thiệu",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop",
    duration: "2:30",
    difficulty: "Beginner",
    transcriptAvailable: true,
    script: [
      {
        id: "s1",
        startTime: 0,
        endTime: 5,
        text: "はじめまして。",
        translation: "Rất hân hạnh được gặp bạn.",
        vocabulary: [
          { word: "始めまして", reading: "はじめまして", meaning: "Rất hân hạnh (được gặp)", partOfSpeech: "expression", example: "はじめまして、田中です", exampleMeaning: "Rất hân hạnh, tôi là Tanaka" },
        ],
        grammar: { grammar: "はじめまして", meaning: "Công thức chào hỏi lần đầu", usage: "Dùng khi gặp ai đó lần đầu", example: "はじめまして", exampleTranslation: "Rất hân hạnh được gặp bạn" }
      },
      {
        id: "s2",
        startTime: 5,
        endTime: 12,
        text: "田中太郎です。",
        translation: "Tôi là Tanaka Taro.",
        vocabulary: [
          { word: "田中", reading: "たなか", meaning: "Tanaka (họ)", partOfSpeech: "noun" },
          { word: "太郎", reading: "たろう", meaning: "Taro (tên)", partOfSpeech: "noun" },
          { word: "です", reading: "です", meaning: "là (động từ thân thiện)", partOfSpeech: "copula" },
        ],
        grammar: { grammar: "Nです", meaning: "Tôi là N", usage: "Công thức giới thiệu bản thân", example: "私は学生です", exampleTranslation: "Tôi là học sinh" }
      },
      {
        id: "s3",
        startTime: 12,
        endTime: 20,
        text: "日本から来ました。",
        translation: "Tôi đến từ Nhật Bản.",
        vocabulary: [
          { word: "日本", reading: "にほん", meaning: "Nhật Bản", partOfSpeech: "noun" },
          { word: "から", reading: "から", meaning: "từ", partOfSpeech: "particle" },
          { word: "来ました", reading: "きました", meaning: "đã đến", partOfSpeech: "verb" },
        ],
        grammar: { grammar: "Nから来ました", meaning: "Tôi đến từ N", usage: "Nói về nơi xuất thân", example: "ベトナムから来ました", exampleTranslation: "Tôi đến từ Việt Nam" }
      },
      {
        id: "s4",
        startTime: 20,
        endTime: 28,
        text: "どうぞよろしくお願いします。",
        translation: "Rất mong được hợp tác với bạn.",
        vocabulary: [
          { word: "どうぞ", reading: "どうぞ", meaning: "Xin mời, nhờ bạn", partOfSpeech: "expression" },
          { word: "宜しく", reading: "よろしく", meaning: "Hãy chiếu cố", partOfSpeech: "expression" },
          { word: "お願いします", reading: "おねがいします", meaning: "Xin nhờ, làm ơn", partOfSpeech: "expression" },
        ],
      },
    ],
    sentences: [
      { id: "sen-1", text: "はじめまして。", translation: "Rất hân hạnh được gặp bạn.", vocabulary: [{ word: "始めまして", reading: "はじめまして", meaning: "Rất hân hạnh", partOfSpeech: "expression" }] },
      { id: "sen-2", text: "田中太郎です。", translation: "Tôi là Tanaka Taro.", vocabulary: [{ word: "田中", reading: "たなか", meaning: "Tanaka", partOfSpeech: "noun" }, { word: "太郎", reading: "たろう", meaning: "Taro", partOfSpeech: "noun" }] },
      { id: "sen-3", text: "日本から来ました。", translation: "Tôi đến từ Nhật Bản.", vocabulary: [{ word: "日本", reading: "にほん", meaning: "Nhật Bản", partOfSpeech: "noun" }, { word: "から", reading: "から", meaning: "từ", partOfSpeech: "particle" }] },
      { id: "sen-4", text: "どうぞよろしくお願いします。", translation: "Rất mong được hợp tác với bạn.", vocabulary: [{ word: "どうぞ", reading: "どうぞ", meaning: "Xin mời", partOfSpeech: "expression" }, { word: "宜しく", reading: "よろしく", meaning: "Chiếu cố", partOfSpeech: "expression" }] },
    ]
  },
  {
    id: "n5-intro-2",
    title: "趣味を話しましょう",
    titleVn: "Nói về sở thích",
    thumbnail: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=225&fit=crop",
    duration: "3:15",
    difficulty: "Beginner",
    transcriptAvailable: true,
    script: [
      {
        id: "s1",
        startTime: 0,
        endTime: 8,
        text: "趣味は何ですか？",
        translation: "Sở thích của bạn là gì?",
        vocabulary: [
          { word: "趣味", reading: "しゅみ", meaning: "Sở thích", partOfSpeech: "noun" },
          { word: "何", reading: "なに", meaning: "Gì, cái gì", partOfSpeech: "pronoun" },
        ],
        grammar: { grammar: "Nは 何ですか", meaning: "N là gì?", usage: "Hỏi về chủ đề", example: "趣味はなんですか？", exampleTranslation: "Sở thích của bạn là gì?" }
      },
      {
        id: "s2",
        startTime: 8,
        endTime: 15,
        text: "私は映画鑑賞が好きです。",
        translation: "Tôi thích xem phim.",
        vocabulary: [
          { word: "私", reading: "わたし", meaning: "Tôi", partOfSpeech: "pronoun" },
          { word: "映画鑑賞", reading: "えいがかんしょう", meaning: "Xem phim", partOfSpeech: "noun" },
          { word: "好き", reading: "すき", meaning: "Thích", partOfSpeech: "adjective" },
        ],
        grammar: { grammar: "N1は N2が 好きです", meaning: "Tôi thích N2", usage: "Diễn tả sở thích", example: "私は読書が好きです", exampleTranslation: "Tôi thích đọc sách" }
      },
      {
        id: "s3",
        startTime: 15,
        endTime: 22,
        text: "よく日本映画を見ますか？",
        translation: "Bạn có hay xem phim Nhật không?",
        vocabulary: [
          { word: "よく", reading: "よく", meaning: "Thường xuyên", partOfSpeech: "adverb" },
          { word: "日本映画", reading: "にほんえいが", meaning: "Phim Nhật", partOfSpeech: "noun" },
          { word: "見ます", reading: "みます", meaning: "Xem (trang trọng)", partOfSpeech: "verb" },
        ],
      },
    ],
    sentences: [
      { id: "sen-1", text: "趣味は何ですか？", translation: "Sở thích của bạn là gì?", vocabulary: [{ word: "趣味", reading: "しゅみ", meaning: "Sở thích", partOfSpeech: "noun" }] },
      { id: "sen-2", text: "私は映画鑑賞が好きです。", translation: "Tôi thích xem phim.", vocabulary: [{ word: "好き", reading: "すき", meaning: "Thích", partOfSpeech: "adjective" }] },
      { id: "sen-3", text: "よく日本映画を見ますか？", translation: "Bạn có hay xem phim Nhật không?", vocabulary: [{ word: "よく", reading: "よく", meaning: "Thường xuyên", partOfSpeech: "adverb" }] },
    ]
  }
];

const schoolLifeVideos: VideoItem[] = [
  {
    id: "n5-school-1",
    title: "学校的日常",
    titleVn: "Đời thường ở trường",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop",
    duration: "3:00",
    difficulty: "Beginner",
    transcriptAvailable: true,
    script: [
      {
        id: "s1",
        startTime: 0,
        endTime: 6,
        text: "今日は何時間目ですか？",
        translation: "Hôm nay là tiết mấy?",
        vocabulary: [
          { word: "今日", reading: "きょう", meaning: "Hôm nay", partOfSpeech: "noun" },
          { word: "時間目", reading: "じかんめ", meaning: "Tiết (thứ tự)", partOfSpeech: "suffix" },
        ],
      },
      {
        id: "s2",
        startTime: 6,
        endTime: 12,
        text: "今日は数学の時間です。",
        translation: "Hôm nay là tiết toán.",
        vocabulary: [
          { word: "数学", reading: "すうがく", meaning: "Toán học", partOfSpeech: "noun" },
          { word: "時間", reading: "じかん", meaning: "Thời gian / Tiết học", partOfSpeech: "noun" },
        ],
      },
      {
        id: "s3",
        startTime: 12,
        endTime: 18,
        text: "先生の話は難しいですね。",
        translation: "Lời giảng của thầy khó hiểu nhỉ.",
        vocabulary: [
          { word: "先生", reading: "せんせい", meaning: "Thầy/Cô giáo", partOfSpeech: "noun" },
          { word: "話", reading: "はなし", meaning: "Lời nói, câu chuyện", partOfSpeech: "noun" },
          { word: "難しい", reading: "むずかしい", meaning: "Khó", partOfSpeech: "adjective" },
        ],
      },
    ],
    sentences: [
      { id: "sen-1", text: "今日は何時間目ですか？", translation: "Hôm nay là tiết mấy?", vocabulary: [{ word: "時間目", reading: "じかんめ", meaning: "Tiết", partOfSpeech: "suffix" }] },
      { id: "sen-2", text: "今日は数学の時間です。", translation: "Hôm nay là tiết toán.", vocabulary: [{ word: "数学", reading: "すうがく", meaning: "Toán học", partOfSpeech: "noun" }] },
      { id: "sen-3", text: "先生の話は難しいですね。", translation: "Lời giảng của thầy khó hiểu nhỉ.", vocabulary: [{ word: "難しい", reading: "むずかしい", meaning: "Khó", partOfSpeech: "adjective" }] },
    ]
  }
];

const shoppingVideos: VideoItem[] = [
  {
    id: "n5-shop-1",
    title: "コンビニで買い物",
    titleVn: "Mua sắm ở cửa hàng tiện lợi",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop",
    duration: "4:00",
    difficulty: "Beginner",
    transcriptAvailable: true,
    script: [
      {
        id: "s1",
        startTime: 0,
        endTime: 5,
        text: "いらっしゃいませ。",
        translation: "Xin mừng quý khách.",
        vocabulary: [
          { word: "いらっしゃいませ", reading: "いらっしゃいませ", meaning: "Xin mừng quý khách", partOfSpeech: "expression" },
        ],
      },
      {
        id: "s2",
        startTime: 5,
        endTime: 10,
        text: "お会計お願いします。",
        translation: "Làm ơn tính tiền.",
        vocabulary: [
          { word: "お会計", reading: "おかいけい", meaning: "Thanh toán", partOfSpeech: "noun" },
          { word: "お願いします", reading: "おねがいします", meaning: "Làm ơn", partOfSpeech: "expression" },
        ],
      },
      {
        id: "s3",
        startTime: 10,
        endTime: 16,
        text: "合計450円です。",
        translation: "Tổng cộng là 450 yên.",
        vocabulary: [
          { word: "合計", reading: "ごうけい", meaning: "Tổng cộng", partOfSpeech: "noun" },
          { word: "円", reading: "えん", meaning: "Yên (đơn vị tiền)", partOfSpeech: "noun" },
        ],
      },
    ],
    sentences: [
      { id: "sen-1", text: "いらっしゃいませ。", translation: "Xin mừng quý khách.", vocabulary: [{ word: "いらっしゃいませ", reading: "いらっしゃいませ", meaning: "Xin mừng quý khách", partOfSpeech: "expression" }] },
      { id: "sen-2", text: "お会計お願いします。", translation: "Làm ơn tính tiền.", vocabulary: [{ word: "お会計", reading: "おかいけい", meaning: "Thanh toán", partOfSpeech: "noun" }] },
      { id: "sen-3", text: "合計450�습니다。", translation: "Tổng cộng là 450 yên.", vocabulary: [{ word: "合計", reading: "ごうけい", meaning: "Tổng cộng", partOfSpeech: "noun" }] },
    ]
  }
];

// ─── N4 Topics ─────────────────────────────────────────────────────────────────

const restaurantVideos: VideoItem[] = [
  {
    id: "n4-rest-1",
    title: "レストランで注文",
    titleVn: "Đặt món ở nhà hàng",
    thumbnail: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=225&fit=crop",
    duration: "5:00",
    difficulty: "Intermediate",
    transcriptAvailable: true,
    script: [
      {
        id: "s1",
        startTime: 0,
        endTime: 6,
        text: "すみません、メニューをください。",
        translation: "Xin lỗi, cho tôi xem thực đơn.",
        vocabulary: [
          { word: "すみません", reading: "すみません", meaning: "Xin lỗi", partOfSpeech: "expression" },
          { word: "メニュー", reading: "メニュー", meaning: "Thực đơn", partOfSpeech: "noun" },
          { word: "ください", reading: "ください", meaning: "Cho tôi xin", partOfSpeech: "verb" },
        ],
        grammar: { grammar: "Nを ください", meaning: "Cho tôi xin N", usage: "Yêu cầu nhận vật gì đó", example: "水をください", exampleTranslation: "Cho tôi xin nước" }
      },
      {
        id: "s2",
        startTime: 6,
        endTime: 14,
        text: "ご注文はお決まりですか？",
        translation: "Bạn đã quyết định được món chưa?",
        vocabulary: [
          { word: "ご注文", reading: "ごちゅうもん", meaning: "Đặt món", partOfSpeech: "noun" },
          { word: "お決まり", reading: "おきまり", meaning: "Quyết định xong", partOfSpeech: "noun" },
        ],
        grammar: { grammar: "お+V ですか？", meaning: "Hỏi về hành động đã hoàn thành", usage: "Hỏi khách đã chọn món chưa", example: "お식은りましたか？", exampleTranslation: "Bạn đã ăn xong chưa?" }
      },
      {
        id: "s3",
        startTime: 14,
        endTime: 22,
        text: "すみません、まだ決めていません。",
        translation: "Xin lỗi, tôi vẫn chưa quyết định được.",
        vocabulary: [
          { word: "まだ", reading: "まだ", meaning: "Vẫn còn, chưa", partOfSpeech: "adverb" },
          { word: "決めて", reading: "きめて", meaning: "Quyết định", partOfSpeech: "verb" },
          { word: "います", reading: "います", meaning: "Đang, vẫn", partOfSpeech: "auxiliary" },
        ],
        grammar: { grammar: "Vて + います", meaning: "Đang thực hiện / Kết quả kéo dài", usage: "Diễn tả trạng thái", example: "食べています", exampleTranslation: "Đang ăn" }
      },
      {
        id: "s4",
        startTime: 22,
        endTime: 28,
        text: "では、申し訳ありませんが、少々お待ちください。",
        translation: "Vậy xin lỗi bạn, hãy đợi một chút nhé.",
        vocabulary: [
          { word: "申し訳", reading: "もうしわけ", meaning: "Xin lỗi (trang trọng)", partOfSpeech: "noun" },
          { word: "少々", reading: "しょうしょう", meaning: "Một chút", partOfSpeech: "adverb" },
          { word: "お待ち", reading: "おまち", meaning: "Chờ đợi", partOfSpeech: "noun" },
        ],
      },
    ],
    sentences: [
      { id: "sen-1", text: "すみません、メニューをください。", translation: "Xin lỗi, cho tôi xem thực đơn.", vocabulary: [{ word: "ください", reading: "ください", meaning: "Cho tôi xin", partOfSpeech: "verb" }] },
      { id: "sen-2", text: "ご注文はお決まりですか？", translation: "Bạn đã quyết định được món chưa?", vocabulary: [{ word: "ご注文", reading: "ごちゅうもん", meaning: "Đặt món", partOfSpeech: "noun" }] },
      { id: "sen-3", text: "すみません、まだ決めていません。", translation: "Xin lỗi, tôi vẫn chưa quyết định được.", vocabulary: [{ word: "まだ", reading: "まだ", meaning: "Vẫn còn", partOfSpeech: "adverb" }] },
      { id: "sen-4", text: "では、申し訳ありませんが、少々お待ちください。", translation: "Vậy xin lỗi bạn, hãy đợi một chút nhé.", vocabulary: [{ word: "少々", reading: "しょうしょう", meaning: "Một chút", partOfSpeech: "adverb" }] },
    ]
  }
];

const travelVideos: VideoItem[] = [
  {
    id: "n4-travel-1",
    title: "電車での行き方",
    titleVn: "Hỏi đường bằng tàu điện",
    thumbnail: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=225&fit=crop",
    duration: "4:30",
    difficulty: "Intermediate",
    transcriptAvailable: true,
    script: [
      {
        id: "s1",
        startTime: 0,
        endTime: 7,
        text: "すみません、東京駅はどこですか？",
        translation: "Xin lỗi, ga Tokyo ở đâu vậy?",
        vocabulary: [
          { word: "東京駅", reading: "とうきょうえき", meaning: "Ga Tokyo", partOfSpeech: "noun" },
          { word: "どこ", reading: "どこ", meaning: "Ở đâu", partOfSpeech: "pronoun" },
        ],
        grammar: { grammar: "N はどこですか？", meaning: "N ở đâu?", usage: "Hỏi vị trí", example: "トイレはどこですか？", exampleTranslation: "Nhà vệ sinh ở đâu?" }
      },
      {
        id: "s2",
        startTime: 7,
        endTime: 14,
        text: "この道をまっすぐ行ってください。",
        translation: "Hãy đi thẳng con đường này.",
        vocabulary: [
          { word: "この", reading: "この", meaning: "Cái này", partOfSpeech: "pronoun" },
          { word: "道", reading: "みち", meaning: "Đường", partOfSpeech: "noun" },
          { word: "まっすぐ", reading: "まっすぐ", meaning: "Thẳng", partOfSpeech: "adverb" },
        ],
        grammar: { grammar: "Vて + ください", meaning: "Hãy làm V", usage: "Yêu cầu, xin nhờ", example: "座ってください", exampleTranslation: "Hãy ngồi xuống" }
      },
      {
        id: "s3",
        startTime: 14,
        endTime: 22,
        text: "二つ目の角を右に曲がると、神社があります。",
        translation: "Rẽ phải ở góc thứ hai, sẽ có đền thờ.",
        vocabulary: [
          { word: "二つ目", reading: "ふたつめ", meaning: "Thứ hai", partOfSpeech: "noun" },
          { word: "角", reading: "かど", meaning: "Góc", partOfSpeech: "noun" },
          { word: "曲がる", reading: "まがる", meaning: "Rẽ", partOfSpeech: "verb" },
        ],
        grammar: { grammar: "Vると、...", meaning: "Nếu V thì...", usage: "Điều kiện tự nhiên", example: "春になると、咲きます", exampleTranslation: "Khi mùa xuân đến, hoa nở" }
      },
    ],
    sentences: [
      { id: "sen-1", text: "すみません、東京駅はどこですか？", translation: "Xin lỗi, ga Tokyo ở đâu vậy?", vocabulary: [{ word: "どこ", reading: "どこ", meaning: "Ở đâu", partOfSpeech: "pronoun" }] },
      { id: "sen-2", text: "この道をまっすぐ行ってください。", translation: "Hãy đi thẳng con đường này.", vocabulary: [{ word: "まっすぐ", reading: "まっすぐ", meaning: "Thẳng", partOfSpeech: "adverb" }] },
      { id: "sen-3", text: "二つ目の角を右に曲がると、神社があります。", translation: "Rẽ phải ở góc thứ hai, sẽ có đền thờ.", vocabulary: [{ word: "曲がる", reading: "まがる", meaning: "Rẽ", partOfSpeech: "verb" }] },
    ]
  }
];

// ─── N3 Topics ─────────────────────────────────────────────────────────────────

const businessVideos: VideoItem[] = [
  {
    id: "n3-biz-1",
    title: "電話で約束",
    titleVn: "Hẹn gặp qua điện thoại",
    thumbnail: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=225&fit=crop",
    duration: "5:30",
    difficulty: "Advanced",
    transcriptAvailable: true,
    script: [
      {
        id: "s1",
        startTime: 0,
        endTime: 6,
        text: "はい、田中商事の山本ですが。",
        translation: "Dạ, Yamamoto của công ty Tanaka Trading đây.",
        vocabulary: [
          { word: "商事", reading: "しょうじ", meaning: "Thương mại", partOfSpeech: "noun" },
          { word: "ですが", reading: "ですが", meaning: "Nhưng mà (nói chuyện)", partOfSpeech: "particle" },
        ],
        grammar: { grammar: "N1 の N2 ですが", meaning: "Tôi là N2 thuộc N1", usage: "Tự giới thiệu khi gọi điện", example: "ABC大学の田中ですが", exampleTranslation: "Tôi là Tanaka của trường đại học ABC" }
      },
      {
        id: "s2",
        startTime: 6,
        endTime: 14,
        text: "恐れ入りますが、企画部の佐藤さんはいらっしますか？",
        translation: "Xin lỗi打扰, anh/chị Sato ở bộ phận kế hoạch có ở không?",
        vocabulary: [
          { word: "恐れ入ります", reading: "おそれいます", meaning: "Xin lỗi打扰 (trang trọng)", partOfSpeech: "expression" },
          { word: "企画部", reading: "きかくぶ", meaning: "Bộ phận kế hoạch", partOfSpeech: "noun" },
          { word: "いらっしゃい", reading: "いらっしゃい", meaning: "Có mặt, ở đây", partOfSpeech: "verb" },
        ],
        grammar: { grammar: "恐れ入りますが", meaning: "Xin lỗi打扰", usage: "Cách nói lịch sự khi xin lỗi", example: "恐れ入りますが、窓を開けてもいいですか？", exampleTranslation: "Xin lỗi打扰, tôi có thể mở cửa sổ không?" }
      },
      {
        id: "s3",
        startTime: 14,
        endTime: 22,
        text: "ただいま席を外しておりますので、折り返しご連絡いたします。",
        translation: "Anh/chị ấy hiện không có mặt, tôi sẽ chuyển mách để anh/chị gọi lại.",
        vocabulary: [
          { word: "ただいま", reading: "ただいま", meaning: "Hiện tại, ngay bây giờ", partOfSpeech: "adverb" },
          { word: "席をを外す", reading: "せきをはずす", meaning: "Không có mặt, đi vắng", partOfSpeech: "expression" },
          { word: "折り返し", reading: "おりかえし", meaning: "Gọi lại", partOfSpeech: "noun" },
        ],
      },
      {
        id: "s4",
        startTime: 22,
        endTime: 30,
        text: "はい、结构です。ご都合のよいときでどうぞ。",
        translation: "Vâng, được ạ. Anh/chị cứ gọi lại khi thuận tiện ạ.",
        vocabulary: [
          { word: "結構です", reading: "結構です", meaning: "Được ạ, không cần", partOfSpeech: "expression" },
          { word: "ご都合", reading: "ごつごう", meaning: "Thuận tiện, thời gian", partOfSpeech: "noun" },
        ],
        grammar: { grammar: "ご+Vの ときで", meaning: "Khi nào thuận tiện thì...", usage: "Để người khác quyết định thời gian", example: "ご都合のよいときに連絡してください", exampleTranslation: "Hãy liên lạc khi bạn thuận tiện" }
      },
    ],
    sentences: [
      { id: "sen-1", text: "はい、田中商事の山本ですが。", translation: "Dạ, Yamamoto của công ty Tanaka Trading đây.", vocabulary: [{ word: "商事", reading: "しょうじ", meaning: "Thương mại", partOfSpeech: "noun" }] },
      { id: "sen-2", text: "恐れ入りますが、企画部の佐藤さんはいらっしますか？", translation: "Xin lỗi打扰, anh/chị Sato ở bộ phận kế hoạch có ở không?", vocabulary: [{ word: "恐れ入ります", reading: "おそれいます", meaning: "Xin lỗi打扰", partOfSpeech: "expression" }] },
      { id: "sen-3", text: "ただいま席を外しておりますので、折り返しご連絡いたします。", translation: "Anh/chị ấy hiện không có mặt, tôi sẽ chuyển mách để anh/chị gọi lại.", vocabulary: [{ word: "折り返し", reading: "おりかえし", meaning: "Gọi lại", partOfSpeech: "noun" }] },
      { id: "sen-4", text: "はい、結構です。ご都合のよいときでどうぞ。", translation: "Vâng, được ạ. Anh/chị cứ gọi lại khi thuận tiện ạ.", vocabulary: [{ word: "結構です", reading: "結構です", meaning: "Được ạ", partOfSpeech: "expression" }] },
    ]
  }
];

// ─── All Topics ─────────────────────────────────────────────────────────────────

export const shadowingTopics: ShadowingTopic[] = [
  {
    id: "topic-self-intro",
    title: "Self Introduction",
    titleVn: "Tự giới thiệu",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop",
    jlptLevel: "N5",
    description: "Learn how to introduce yourself in Japanese",
    videoCount: 2,
    totalDuration: "5:45",
    videos: selfIntroductionVideos,
  },
  {
    id: "topic-school-life",
    title: "School Life",
    titleVn: "Đời sống học đường",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop",
    jlptLevel: "N5",
    description: "Daily conversations at school",
    videoCount: 1,
    totalDuration: "3:00",
    videos: schoolLifeVideos,
  },
  {
    id: "topic-shopping",
    title: "Shopping",
    titleVn: "Mua sắm",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop",
    jlptLevel: "N5",
    description: "Shopping at convenience stores",
    videoCount: 1,
    totalDuration: "4:00",
    videos: shoppingVideos,
  },
  {
    id: "topic-restaurant",
    title: "Restaurant",
    titleVn: "Nhà hàng",
    thumbnail: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=225&fit=crop",
    jlptLevel: "N4",
    description: "Ordering food at restaurants",
    videoCount: 1,
    totalDuration: "5:00",
    videos: restaurantVideos,
  },
  {
    id: "topic-travel",
    title: "Travel",
    titleVn: "Du lịch",
    thumbnail: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=225&fit=crop",
    jlptLevel: "N4",
    description: "Asking for directions and traveling",
    videoCount: 1,
    totalDuration: "4:30",
    videos: travelVideos,
  },
  {
    id: "topic-business",
    title: "Business",
    titleVn: "Kinh doanh",
    thumbnail: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=225&fit=crop",
    jlptLevel: "N3",
    description: "Business phone calls and meetings",
    videoCount: 1,
    totalDuration: "5:30",
    videos: businessVideos,
  },
];

// ─── Helper Functions ───────────────────────────────────────────────────────────

export const getTopicsByLevel = (level: JLPTLevel): ShadowingTopic[] => {
  return shadowingTopics.filter(topic => topic.jlptLevel === level);
};

export const getTopicById = (id: string): ShadowingTopic | undefined => {
  return shadowingTopics.find(topic => topic.id === id);
};

export const getVideoById = (videoId: string): VideoItem | undefined => {
  for (const topic of shadowingTopics) {
    const video = topic.videos.find(v => v.id === videoId);
    if (video) return video;
  }
  return undefined;
};

export const getTopicForVideo = (videoId: string): ShadowingTopic | undefined => {
  return shadowingTopics.find(topic => 
    topic.videos.some(v => v.id === videoId)
  );
};

// ─── Mock AI Feedback Generator ────────────────────────────────────────────────

export interface WordResult {
  word: string;
  correct: boolean;
}

export interface AIFeedback {
  pronunciation: number;
  pitchAccent: number;
  fluency: number;
  speed: number;
  overallScore: number;
  feedback: string;
  tips: string[];
  wordResults: WordResult[];
  spokenText: string;
}

export const generateMockAIFeedback = (sentence: string): AIFeedback => {
  // Generate random scores between 70-98
  const pronunciation = Math.floor(Math.random() * 28) + 70;
  const pitchAccent = Math.floor(Math.random() * 28) + 70;
  const fluency = Math.floor(Math.random() * 28) + 70;
  const speed = Math.floor(Math.random() * 28) + 70;
  const overallScore = Math.floor((pronunciation + pitchAccent + fluency + speed) / 4);

  const tipsPool = [
    "Good pronunciation! Try to lengthen vowel sounds.",
    "Pay attention to pitch accent on this word.",
    "Try to speak at a more natural pace.",
    "Good flow! Practice the linking between words.",
    "Work on pronouncing the final mora more clearly.",
    "Nice effort! Review the grammar pattern.",
    "Focus on the particle pronunciation.",
    "Great intonation! Keep practicing.",
  ];

  const feedback = overallScore >= 85 
    ? "Xuất sắc! Phát âm của bạn rất tự nhiên."
    : overallScore >= 75
    ? "Tốt lắm! Hãy tiếp tục luyện tập để cải thiện."
    : "Cố gắng lên! Chú ý đến các từ được đánh dấu đỏ.";

  // Generate word-level results: split sentence into words/tokens and randomly mark correct/incorrect
  const words = sentence.split(/(?<=[ぁ-ん々ー])|(?=[ぁ-ん々ー])|(?<=[ァ-ヶ])|(?=[ァ-ヶ])|(?<=[一-龯])|(?=[一-龯])|\s+/).filter(w => w.trim().length > 0);
  const errorChance = overallScore >= 85 ? 0.1 : overallScore >= 75 ? 0.25 : 0.4;
  const wordResults: WordResult[] = words.map(word => ({
    word,
    correct: Math.random() > errorChance,
  }));

  // Build spoken text representation (simulate what user said)
  const spokenText = sentence;

  return {
    pronunciation,
    pitchAccent,
    fluency,
    speed,
    overallScore,
    feedback,
    tips: tipsPool.slice(0, 2),
    wordResults,
    spokenText,
  };
};
