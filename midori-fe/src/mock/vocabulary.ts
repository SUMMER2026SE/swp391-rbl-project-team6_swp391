// ─── Vocabulary Mock Data ─────────────────────────────────────────────────────

import { VocabularyItem } from "../types/content-library";

export const mockVocabulary: VocabularyItem[] = [
  // N5 Level
  {
    id: "vocab-001",
    word: "日本",
    hiragana: "にほん",
    meaning: "Nhật Bản",
    exampleSentence: {
      sentence: "私は日本に行きたいです。",
      meaning: "Tôi muốn đi Nhật Bản.",
    },
    lessonId: "lesson-01",
    jlptLevel: "N5",
    tags: ["country", "basic"],
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10",
  },
  {
    id: "vocab-002",
    word: "人",
    hiragana: "ひと",
    meaning: "người",
    exampleSentence: {
      sentence: "あの人は誰ですか？",
      meaning: "Người đó là ai?",
    },
    lessonId: "lesson-01",
    jlptLevel: "N5",
    tags: ["basic", "noun"],
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10",
  },
  {
    id: "vocab-003",
    word: "水",
    hiragana: "みず",
    meaning: "nước",
    exampleSentence: {
      sentence: "水を飲みたいです。",
      meaning: "Tôi muốn uống nước.",
    },
    lessonId: "lesson-02",
    jlptLevel: "N5",
    tags: ["basic", "noun"],
    createdAt: "2024-01-11",
    updatedAt: "2024-01-11",
  },
  {
    id: "vocab-004",
    word: "食べる",
    hiragana: "たべる",
    meaning: "ăn",
    exampleSentence: {
      sentence: "朝ごはんを食べました。",
      meaning: "Tôi đã ăn sáng.",
    },
    lessonId: "lesson-03",
    jlptLevel: "N5",
    tags: ["verb", "basic"],
    createdAt: "2024-01-12",
    updatedAt: "2024-01-12",
  },
  {
    id: "vocab-005",
    word: "行く",
    hiragana: "いく",
    meaning: "đi",
    exampleSentence: {
      sentence: "学校に行きます。",
      meaning: "Tôi đi học.",
    },
    lessonId: "lesson-04",
    jlptLevel: "N5",
    tags: ["verb", "motion", "basic"],
    createdAt: "2024-01-13",
    updatedAt: "2024-01-13",
  },
  {
    id: "vocab-006",
    word: "大きい",
    hiragana: "おおきい",
    meaning: "to, lớn",
    exampleSentence: {
      sentence: "この家は大きいです。",
      meaning: "Ngôi nhà này lớn.",
    },
    lessonId: "lesson-05",
    jlptLevel: "N5",
    tags: ["adjective", "i-adjective"],
    createdAt: "2024-01-14",
    updatedAt: "2024-01-14",
  },
  {
    id: "vocab-007",
    word: "新しい",
    hiragana: "あたらしい",
    meaning: "mới",
    exampleSentence: {
      sentence: "新しい車を買いました。",
      meaning: "Tôi đã mua một chiếc xe mới.",
    },
    lessonId: "lesson-06",
    jlptLevel: "N5",
    tags: ["adjective", "i-adjective"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  // N4 Level
  {
    id: "vocab-008",
    word: "経験",
    hiragana: "けいけん",
    meaning: "kinh nghiệm",
    exampleSentence: {
      sentence: "彼は经验丰富です。",
      meaning: "Anh ấy có nhiều kinh nghiệm.",
    },
    lessonId: "lesson-n4-01",
    jlptLevel: "N4",
    tags: ["noun", "intermediate"],
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: "vocab-009",
    word: "影響",
    hiragana: "えいきょう",
    meaning: "ảnh hưởng",
    exampleSentence: {
      sentence: "環境に影響を与えない。",
      meaning: "Không ảnh hưởng đến môi trường.",
    },
    lessonId: "lesson-n4-02",
    jlptLevel: "N4",
    tags: ["noun", "intermediate"],
    createdAt: "2024-02-02",
    updatedAt: "2024-02-02",
  },
  {
    id: "vocab-010",
    word: "関係",
    hiragana: "かんけい",
    meaning: "quan hệ, liên quan",
    exampleSentence: {
      sentence: "環境問題と密接な関係がある。",
      meaning: "Có mối quan hệ mật thiết với vấn đề môi trường.",
    },
    lessonId: "lesson-n4-03",
    jlptLevel: "N4",
    tags: ["noun", "intermediate"],
    createdAt: "2024-02-03",
    updatedAt: "2024-02-03",
  },
  // N3 Level
  {
    id: "vocab-011",
    word: "傾向",
    hiragana: "けいこう",
    meaning: "xu hướng",
    exampleSentence: {
      sentence: "若者の読書離れ傾向にある。",
      meaning: "Có xu hướng giới trẻ xa rời việc đọc sách.",
    },
    lessonId: "lesson-n3-01",
    jlptLevel: "N3",
    tags: ["noun", "intermediate-high"],
    createdAt: "2024-03-01",
    updatedAt: "2024-03-01",
  },
  {
    id: "vocab-012",
    word: "深刻",
    hiragana: "しんこく",
    meaning: "nghiêm trọng",
    exampleSentence: {
      sentence: "環境問題は深刻です。",
      meaning: "Vấn đề môi trường rất nghiêm trọng.",
    },
    lessonId: "lesson-n3-02",
    jlptLevel: "N3",
    tags: ["na-adjective", "intermediate-high"],
    createdAt: "2024-03-02",
    updatedAt: "2024-03-02",
  },
  // N2 Level
  {
    id: "vocab-013",
    word: "普及",
    hiragana: "ふきゅう",
    meaning: "phổ biến, lan rộng",
    exampleSentence: {
      sentence: "インターネットの普及率は高い。",
      meaning: "Tỷ lệ phổ biến của internet rất cao.",
    },
    lessonId: "lesson-n2-01",
    jlptLevel: "N2",
    tags: ["noun", "suru-verb", "advanced"],
    createdAt: "2024-04-01",
    updatedAt: "2024-04-01",
  },
  {
    id: "vocab-014",
    word: "不可欠",
    hiragana: "ふかけつ",
    meaning: "không thể thiếu",
    exampleSentence: {
      sentence: "水は人間にとって不可欠です。",
      meaning: "Nước là không thể thiếu đối với con người.",
    },
    lessonId: "lesson-n2-02",
    jlptLevel: "N2",
    tags: ["na-adjective", "advanced"],
    createdAt: "2024-04-02",
    updatedAt: "2024-04-02",
  },
  // N1 Level
  {
    id: "vocab-015",
    word: "多角的",
    hiragana: "たかくてき",
    meaning: "đa góc cạnh, đa chiều",
    exampleSentence: {
      sentence: "多角的に分析する必要がある。",
      meaning: "Cần phân tích từ nhiều góc độ.",
    },
    lessonId: "lesson-n1-01",
    jlptLevel: "N1",
    tags: ["na-adjective", "business"],
    createdAt: "2024-05-01",
    updatedAt: "2024-05-01",
  },
  {
    id: "vocab-016",
    word: "変革",
    hiragana: "へんかく",
    meaning: "cải cách, chuyển đổi",
    exampleSentence: {
      sentence: "社会変革の必要性が叫ばれている。",
      meaning: "Nhu cầu cải cách xã hội đang được nhấn mạnh.",
    },
    lessonId: "lesson-n1-02",
    jlptLevel: "N1",
    tags: ["noun", "formal"],
    createdAt: "2024-05-02",
    updatedAt: "2024-05-02",
  },
];

export const getVocabularyByLevel = (level: VocabularyItem["jlptLevel"]) => {
  return mockVocabulary.filter(item => item.jlptLevel === level);
};

export const getVocabularyByLesson = (lessonId: string) => {
  return mockVocabulary.filter(item => item.lessonId === lessonId);
};

export const getVocabularyById = (id: string) => {
  return mockVocabulary.find(item => item.id === id);
};

export const searchVocabulary = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return mockVocabulary.filter(
    item =>
      item.word.toLowerCase().includes(lowerQuery) ||
      item.hiragana.toLowerCase().includes(lowerQuery) ||
      item.meaning.toLowerCase().includes(lowerQuery)
  );
};

export const getVocabularyByTags = (tags: string[]) => {
  return mockVocabulary.filter(item =>
    tags.some(tag => item.tags.includes(tag))
  );
};
