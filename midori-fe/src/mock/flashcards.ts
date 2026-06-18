// ─── Flashcard Mock Data ───────────────────────────────────────────────────────

import { Flashcard } from "../types/content-library";

export const mockFlashcards: Flashcard[] = [
  // N5 Grammar Flashcards - Lesson 01
  {
    id: "fc-001",
    front: "～は～です",
    back: "A là B (mệnh đề khẳng định)\nVí dụ: 私は学生です。 (Tôi là sinh viên)",
    jlptLevel: "N5",
    lessonId: "lesson-01",
    tags: ["grammar", "basic", "copula"],
    exampleSentence: {
      sentence: "私は学生です。",
      meaning: "Tôi là sinh viên.",
    },
    difficulty: "easy",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "fc-002",
    front: "～は～ではありません",
    back: "A không phải là B (phủ định)\nVí dụ: 私は先生ではありません。 (Tôi không phải là giáo viên)",
    jlptLevel: "N5",
    lessonId: "lesson-01",
    tags: ["grammar", "basic", "copula", "negative"],
    exampleSentence: {
      sentence: "私は先生ではありません。",
      meaning: "Tôi không phải là giáo viên.",
    },
    difficulty: "easy",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "fc-003",
    front: "～は～ですか？",
    back: "A có phải là B không? (câu hỏi)\nVí dụ: あなたは学生ですか？ (Bạn có phải là sinh viên không?)",
    jlptLevel: "N5",
    lessonId: "lesson-01",
    tags: ["grammar", "basic", "question"],
    exampleSentence: {
      sentence: "あなたは学生ですか？",
      meaning: "Bạn có phải là sinh viên không?",
    },
    difficulty: "easy",
    createdAt: "2024-01-16",
    updatedAt: "2024-01-16",
  },
  {
    id: "fc-004",
    front: "～があります／います",
    back: "Có A (vật/người ở đâu đó)\n～があります = có vật thể\n～います = có sinh vật sống",
    jlptLevel: "N5",
    lessonId: "lesson-02",
    tags: ["grammar", "basic", "existence"],
    exampleSentence: {
      sentence: "部屋に猫がいます。",
      meaning: "Có con mèo trong phòng.",
    },
    difficulty: "easy",
    createdAt: "2024-01-17",
    updatedAt: "2024-01-17",
  },
  // N5 Vocabulary Flashcards - Lesson 01
  {
    id: "fc-005",
    front: "日本（にほん）",
    back: "Nhật Bản",
    jlptLevel: "N5",
    lessonId: "lesson-01",
    tags: ["vocabulary", "country", "basic"],
    exampleSentence: {
      sentence: "私は日本に行きたいです。",
      meaning: "Tôi muốn đi Nhật Bản.",
    },
    difficulty: "easy",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10",
  },
  {
    id: "fc-006",
    front: "食べる（たべる）",
    back: "ăn (động từ)",
    jlptLevel: "N5",
    lessonId: "lesson-02",
    tags: ["vocabulary", "verb", "basic"],
    exampleSentence: {
      sentence: "朝ごはんを食べました。",
      meaning: "Tôi đã ăn sáng.",
    },
    difficulty: "easy",
    createdAt: "2024-01-12",
    updatedAt: "2024-01-12",
  },
  {
    id: "fc-007",
    front: "大きい（おおきい）",
    back: "to, lớn (tính từ -i)",
    jlptLevel: "N5",
    lessonId: "lesson-02",
    tags: ["vocabulary", "adjective", "basic"],
    exampleSentence: {
      sentence: "この家は大きいです。",
      meaning: "Ngôi nhà này lớn.",
    },
    difficulty: "easy",
    createdAt: "2024-01-14",
    updatedAt: "2024-01-14",
  },
  // N4 Flashcards - Lesson 03
  {
    id: "fc-008",
    front: "～ために",
    back: "Vì để... / Nhằm mục đích\n用法: Động từ (dictionary form/rau) + ために + mục đích",
    jlptLevel: "N4",
    lessonId: "lesson-03",
    tags: ["grammar", "purpose", "ために"],
    exampleSentence: {
      sentence: "健康のために運動する。",
      meaning: "Tập thể dục vì sức khỏe.",
    },
    difficulty: "medium",
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: "fc-009",
    front: "経験（けいけん）",
    back: "kinh nghiệm",
    jlptLevel: "N4",
    lessonId: "lesson-03",
    tags: ["vocabulary", "noun", "intermediate"],
    exampleSentence: {
      sentence: "彼は经验丰富です。",
      meaning: "Anh ấy có nhiều kinh nghiệm.",
    },
    difficulty: "medium",
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: "fc-010",
    front: "～なければならない",
    back: "Phải làm gì (bắt buộc)\n= ～なければらない = なきゃ",
    jlptLevel: "N4",
    lessonId: "lesson-03",
    tags: ["grammar", "obligation", "necessity"],
    exampleSentence: {
      sentence: "明日提出しなければならない。",
      meaning: "Ngày mai phải nộp.",
    },
    difficulty: "medium",
    createdAt: "2024-02-03",
    updatedAt: "2024-02-03",
  },
  // N3 Flashcards - Lesson 04
  {
    id: "fc-011",
    front: "～に関して",
    back: "Liên quan đến... / Về...\nThường dùng trong văn viết và hội thoại formal",
    jlptLevel: "N3",
    lessonId: "lesson-04",
    tags: ["grammar", "topic", "formal"],
    exampleSentence: {
      sentence: "環境問題に関して議論した。",
      meaning: "Đã thảo luận về vấn đề môi trường.",
    },
    difficulty: "medium",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-01",
  },
  {
    id: "fc-012",
    front: "深刻（しんこく）",
    back: "nghiêm trọng (tính từ na)",
    jlptLevel: "N3",
    lessonId: "lesson-04",
    tags: ["vocabulary", "adjective", "intermediate-high"],
    exampleSentence: {
      sentence: "環境問題は深刻です。",
      meaning: "Vấn đề môi trường rất nghiêm trọng.",
    },
    difficulty: "medium",
    createdAt: "2024-03-02",
    updatedAt: "2024-03-02",
  },
  // N2 Flashcards - Lesson 05
  {
    id: "fc-013",
    front: "～にもかかわらず",
    back: "Mặc dù... / Dù... (có sự đối lập)\nTương đương: ～のに",
    jlptLevel: "N2",
    lessonId: "lesson-05",
    tags: ["grammar", "contrast", "formal"],
    exampleSentence: {
      sentence: "雨にもかかわらず、試合は続けた。",
      meaning: "Mặc dù trời mưa, trận đấu vẫn tiếp tục.",
    },
    difficulty: "hard",
    createdAt: "2024-04-02",
    updatedAt: "2024-04-02",
  },
  {
    id: "fc-014",
    front: "普及（ふきゅう）",
    back: "phổ biến, lan rộng\n～が普及する = được phổ biến",
    jlptLevel: "N2",
    lessonId: "lesson-05",
    tags: ["vocabulary", "noun", "advanced"],
    exampleSentence: {
      sentence: "インターネットの普及率は高い。",
      meaning: "Tỷ lệ phổ biến của internet rất cao.",
    },
    difficulty: "hard",
    createdAt: "2024-04-01",
    updatedAt: "2024-04-01",
  },
  // N1 Flashcards - Lesson 06
  {
    id: "fc-015",
    front: "～に違いない",
    back: "Chắc chắn là... / Không còn nghi ngờ gì\nDiễn đạt sự chắc chắn cao độ",
    jlptLevel: "N1",
    lessonId: "lesson-06",
    tags: ["grammar", "certainty", "formal"],
    exampleSentence: {
      sentence: "彼が犯人犯に違いない。",
      meaning: "Chắc chắn anh ta là thủ phạm.",
    },
    difficulty: "hard",
    createdAt: "2024-05-01",
    updatedAt: "2024-05-01",
  },
  {
    id: "fc-016",
    front: "変革（へんかく）",
    back: "cải cách, chuyển đổi\n～を起こす = tiến hành cải cách",
    jlptLevel: "N1",
    lessonId: "lesson-06",
    tags: ["vocabulary", "noun", "formal"],
    exampleSentence: {
      sentence: "社会変革の必要性が叫ばれている。",
      meaning: "Nhu cầu cải cách xã hội đang được nhấn mạnh.",
    },
    difficulty: "hard",
    createdAt: "2024-05-02",
    updatedAt: "2024-05-02",
  },
  // Reading Support Flashcards - Lesson 07
  {
    id: "fc-017",
    front: "しかし",
    back: "Tuy nhiên, nhưng mà\nDùng để nêu ý kiến trái ngược với câu trước",
    jlptLevel: "N5",
    lessonId: "lesson-07",
    tags: ["grammar", "conjunction", "contrast", "reading-support"],
    difficulty: "easy",
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    id: "fc-018",
    front: "また",
    back: "Ngoài ra, hơn nữa / lại nữa\nDùng để thêm thông tin hoặc nói lại hành động",
    jlptLevel: "N5",
    lessonId: "lesson-07",
    tags: ["grammar", "conjunction", "addition", "reading-support"],
    difficulty: "easy",
    createdAt: "2024-01-21",
    updatedAt: "2024-01-21",
  },
  {
    id: "fc-019",
    front: "したがって",
    back: "Do đó, vì vậy\nDùng để diễn đạt kết luận hoặc kết quả logic",
    jlptLevel: "N2",
    lessonId: "lesson-08",
    tags: ["grammar", "conjunction", "formal", "reading-support"],
    difficulty: "hard",
    createdAt: "2024-04-10",
    updatedAt: "2024-04-10",
  },
  {
    id: "fc-020",
    front: "すなわち",
    back: "Tức là, nghĩa là\nDùng để giải thích hoặc làm rõ ý",
    jlptLevel: "N1",
    lessonId: "lesson-08",
    tags: ["grammar", "conjunction", "formal", "reading-support"],
    difficulty: "hard",
    createdAt: "2024-05-15",
    updatedAt: "2024-05-15",
  },
];

export const getFlashcardsByLevel = (level: Flashcard["jlptLevel"]) => {
  return mockFlashcards.filter(item => item.jlptLevel === level);
};

export const getFlashcardsById = (id: string) => {
  return mockFlashcards.find(item => item.id === id);
};

export const getFlashcardsByTags = (tags: string[]) => {
  return mockFlashcards.filter(item =>
    tags.some(tag => item.tags.includes(tag))
  );
};

export const searchFlashcards = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return mockFlashcards.filter(
    item =>
      item.front.toLowerCase().includes(lowerQuery) ||
      item.back.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getFlashcardsByDifficulty = (difficulty: Flashcard["difficulty"]) => {
  return mockFlashcards.filter(item => item.difficulty === difficulty);
};
