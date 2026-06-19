// Katakana Basic - Complete 46 characters
export interface KatakanaCharacter {
  id: string;
  character: string;
  romaji: string;
  pronunciation: string;
  meaning: string;
  exampleWord: string;
  exampleMeaning: string;
  audioUrl: null;
  strokeOrder: number;
}

export const katakanaBasic: KatakanaCharacter[] = [
  // Vowels (ア行)
  { id: "ka-a", character: "ア", romaji: "a", pronunciation: "/a/", meaning: "vowel a", exampleWord: "アメリカ", exampleMeaning: "America", audioUrl: null, strokeOrder: 1 },
  { id: "ka-i", character: "イ", romaji: "i", pronunciation: "/i/", meaning: "vowel i", exampleWord: "イギリス", exampleMeaning: "England", audioUrl: null, strokeOrder: 2 },
  { id: "ka-u", character: "ウ", romaji: "u", pronunciation: "/ɯ/", meaning: "vowel u", exampleWord: "宇宙", exampleMeaning: "universe", audioUrl: null, strokeOrder: 3 },
  { id: "ka-e", character: "エ", romaji: "e", pronunciation: "/e/", meaning: "vowel e", exampleWord: "エレベーター", exampleMeaning: "elevator", audioUrl: null, strokeOrder: 4 },
  { id: "ka-o", character: "オ", romaji: "o", pronunciation: "/o/", meaning: "vowel o", exampleWord: "オレンジ", exampleMeaning: "orange", audioUrl: null, strokeOrder: 5 },
  
  // K row (カ行)
  { id: "ka-ka", character: "カ", romaji: "ka", pronunciation: "/ka/", meaning: "ka", exampleWord: "カード", exampleMeaning: "card", audioUrl: null, strokeOrder: 6 },
  { id: "ka-ki", character: "キ", romaji: "ki", pronunciation: "/ki/", meaning: "ki", exampleWord: "キス", exampleMeaning: "kiss", audioUrl: null, strokeOrder: 7 },
  { id: "ka-ku", character: "ク", romaji: "ku", pronunciation: "/kɯ/", meaning: "ku", exampleWord: "クラス", exampleMeaning: "class", audioUrl: null, strokeOrder: 8 },
  { id: "ka-ke", character: "ケ", romaji: "ke", pronunciation: "/ke/", meaning: "ke", exampleWord: "ゲーム", exampleMeaning: "game", audioUrl: null, strokeOrder: 9 },
  { id: "ka-ko", character: "コ", romaji: "ko", pronunciation: "/ko/", meaning: "ko", exampleWord: "コーヒー", exampleMeaning: "coffee", audioUrl: null, strokeOrder: 10 },
  
  // S row (サ行)
  { id: "ka-sa", character: "サ", romaji: "sa", pronunciation: "/sa/", meaning: "sa", exampleWord: "サービス", exampleMeaning: "service", audioUrl: null, strokeOrder: 11 },
  { id: "ka-shi", character: "シ", romaji: "shi", pronunciation: "/ɕi/", meaning: "shi", exampleWord: "シャツ", exampleMeaning: "shirt", audioUrl: null, strokeOrder: 12 },
  { id: "ka-su", character: "ス", romaji: "su", pronunciation: "/sɯ/", meaning: "su", exampleWord: "スター", exampleMeaning: "star", audioUrl: null, strokeOrder: 13 },
  { id: "ka-se", character: "セ", romaji: "se", pronunciation: "/se/", meaning: "se", exampleWord: "セーター", exampleMeaning: "sweater", audioUrl: null, strokeOrder: 14 },
  { id: "ka-so", character: "ソ", romaji: "so", pronunciation: "/so/", meaning: "so", exampleWord: "ソファ", exampleMeaning: "sofa", audioUrl: null, strokeOrder: 15 },
  
  // T row (タ行)
  { id: "ka-ta", character: "タ", romaji: "ta", pronunciation: "/ta/", meaning: "ta", exampleWord: "テーブル", exampleMeaning: "table", audioUrl: null, strokeOrder: 16 },
  { id: "ka-chi", character: "チ", romaji: "chi", pronunciation: "/tɕi/", meaning: "chi", exampleWord: "チーム", exampleMeaning: "team", audioUrl: null, strokeOrder: 17 },
  { id: "ka-tsu", character: "ツ", romaji: "tsu", pronunciation: "/tsɯ/", meaning: "tsu", exampleWord: "ツインテール", exampleMeaning: "twin tails", audioUrl: null, strokeOrder: 18 },
  { id: "ka-te", character: "テ", romaji: "te", pronunciation: "/te/", meaning: "te", exampleWord: "テレビ", exampleMeaning: "television", audioUrl: null, strokeOrder: 19 },
  { id: "ka-to", character: "ト", romaji: "to", pronunciation: "/to/", meaning: "to", exampleWord: "トピック", exampleMeaning: "topic", audioUrl: null, strokeOrder: 20 },
  
  // N row (ナ行)
  { id: "ka-na", character: "ナ", romaji: "na", pronunciation: "/na/", meaning: "na", exampleWord: "ナビ", exampleMeaning: "navigation", audioUrl: null, strokeOrder: 21 },
  { id: "ka-ni", character: "ニ", romaji: "ni", pronunciation: "/ni/", meaning: "ni", exampleWord: "ニーズ", exampleMeaning: "needs", audioUrl: null, strokeOrder: 22 },
  { id: "ka-nu", character: "ヌ", romaji: "nu", pronunciation: "/nɯ/", meaning: "nu", exampleWord: "ヌードル", exampleMeaning: "noodle", audioUrl: null, strokeOrder: 23 },
  { id: "ka-ne", character: "ネ", romaji: "ne", pronunciation: "/ne/", meaning: "ne", exampleWord: "ネック", exampleMeaning: "neck", audioUrl: null, strokeOrder: 24 },
  { id: "ka-no", character: "ノ", romaji: "no", pronunciation: "/no/", meaning: "no", exampleWord: "ノート", exampleMeaning: "notebook", audioUrl: null, strokeOrder: 25 },
  
  // H row (ハ行)
  { id: "ka-ha", character: "ハ", romaji: "ha", pronunciation: "/ha/", meaning: "ha", exampleWord: "バッグ", exampleMeaning: "bag", audioUrl: null, strokeOrder: 26 },
  { id: "ka-hi", character: "ヒ", romaji: "hi", pronunciation: "/çi/", meaning: "hi", exampleWord: "ビデオ", exampleMeaning: "video", audioUrl: null, strokeOrder: 27 },
  { id: "ka-fu", character: "フ", romaji: "fu", pronunciation: "/ɸɯ/", meaning: "fu", exampleWord: "ファミリー", exampleMeaning: "family", audioUrl: null, strokeOrder: 28 },
  { id: "ka-he", character: "ヘ", romaji: "he", pronunciation: "/he/", meaning: "he", exampleWord: "ヘア", exampleMeaning: "hair", audioUrl: null, strokeOrder: 29 },
  { id: "ka-ho", character: "ホ", romaji: "ho", pronunciation: "/ho/", meaning: "ho", exampleWord: "ホテル", exampleMeaning: "hotel", audioUrl: null, strokeOrder: 30 },
  
  // M row (マ行)
  { id: "ka-ma", character: "マ", romaji: "ma", pronunciation: "/ma/", meaning: "ma", exampleWord: "マスター", exampleMeaning: "master", audioUrl: null, strokeOrder: 31 },
  { id: "ka-mi", character: "ミ", romaji: "mi", pronunciation: "/mi/", meaning: "mi", exampleWord: "メール", exampleMeaning: "email", audioUrl: null, strokeOrder: 32 },
  { id: "ka-mu", character: "ム", romaji: "mu", pronunciation: "/mɯ/", meaning: "mu", exampleWord: "マンション", exampleMeaning: "mansion/condo", audioUrl: null, strokeOrder: 33 },
  { id: "ka-me", character: "メ", romaji: "me", pronunciation: "/me/", meaning: "me", exampleWord: "メニュー", exampleMeaning: "menu", audioUrl: null, strokeOrder: 34 },
  { id: "ka-mo", character: "モ", romaji: "mo", pronunciation: "/mo/", meaning: "mo", exampleWord: "モデル", exampleMeaning: "model", audioUrl: null, strokeOrder: 35 },
  
  // Y row (ヤ行)
  { id: "ka-ya", character: "ヤ", romaji: "ya", pronunciation: "/ja/", meaning: "ya", exampleWord: "ヤング", exampleMeaning: "young", audioUrl: null, strokeOrder: 36 },
  { id: "ka-yu", character: "ユ", romaji: "yu", pronunciation: "/jɯ/", meaning: "yu", exampleWord: "ユーモア", exampleMeaning: "humor", audioUrl: null, strokeOrder: 37 },
  { id: "ka-yo", character: "ヨ", romaji: "yo", pronunciation: "/jo/", meaning: "yo", exampleWord: "ヨーロッパ", exampleMeaning: "Europe", audioUrl: null, strokeOrder: 38 },
  
  // R row (ラ行)
  { id: "ka-ra", character: "ラ", romaji: "ra", pronunciation: "/ɾa/", meaning: "ra", exampleWord: "ラーメン", exampleMeaning: "ramen", audioUrl: null, strokeOrder: 39 },
  { id: "ka-ri", character: "リ", romaji: "ri", pronunciation: "/ɾi/", meaning: "ri", exampleWord: "リクエスト", exampleMeaning: "request", audioUrl: null, strokeOrder: 40 },
  { id: "ka-ru", character: "ル", romaji: "ru", pronunciation: "/ɾɯ/", meaning: "ru", exampleWord: "ルール", exampleMeaning: "rule", audioUrl: null, strokeOrder: 41 },
  { id: "ka-re", character: "レ", romaji: "re", pronunciation: "/ɾe/", meaning: "re", exampleWord: "レポート", exampleMeaning: "report", audioUrl: null, strokeOrder: 42 },
  { id: "ka-ro", character: "ロ", romaji: "ro", pronunciation: "/ɾo/", meaning: "ro", exampleWord: "ロッカー", exampleMeaning: "locker", audioUrl: null, strokeOrder: 43 },
  
  // W row (ワ行)
  { id: "ka-wa", character: "ワ", romaji: "wa", pronunciation: "/wa/", meaning: "wa", exampleWord: "ワイン", exampleMeaning: "wine", audioUrl: null, strokeOrder: 44 },
  { id: "ka-wo", character: "ヲ", romaji: "wo", pronunciation: "/o/", meaning: "wo (archaic)", exampleWord: "ヲタク", exampleMeaning: "otaku", audioUrl: null, strokeOrder: 45 },
  
  // N (ン)
  { id: "ka-n", character: "ン", romaji: "n", pronunciation: "/n/", meaning: "n (consonant)", exampleWord: "インターネット", exampleMeaning: "internet", audioUrl: null, strokeOrder: 46 },
];

export const katakanaBasicLesson = {
  id: "katakana-basic",
  title: "Katakana Basic",
  subtitle: "Basic 46 Characters",
  description: "Master the fundamental Katakana syllabary - essential for reading foreign words and loanwords in Japanese.",
  totalCharacters: 46,
  difficulty: 1,
  estimatedTime: 45,
  characters: katakanaBasic,
  color: "from-blue-400 to-cyan-500",
};

export default katakanaBasic;
