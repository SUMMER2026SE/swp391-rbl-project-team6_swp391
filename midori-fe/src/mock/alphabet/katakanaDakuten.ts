// Katakana Dakuten - Voiced sounds (濁音)
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

export const katakanaDakuten: KatakanaCharacter[] = [
  // G row (ガ行) - voiced from K
  { id: "kd-ga", character: "ガ", romaji: "ga", pronunciation: "/ga/", meaning: "ga (voiced ka)", exampleWord: "ガス", exampleMeaning: "gas", audioUrl: null, strokeOrder: 1 },
  { id: "kd-gi", character: "ギ", romaji: "gi", pronunciation: "/gi/", meaning: "gi (voiced ki)", exampleWord: "ギルド", exampleMeaning: "guild", audioUrl: null, strokeOrder: 2 },
  { id: "kd-gu", character: "グ", romaji: "gu", pronunciation: "/gɯ/", meaning: "gu (voiced ku)", exampleWord: "グレード", exampleMeaning: "grade", audioUrl: null, strokeOrder: 3 },
  { id: "kd-ge", character: "ゲ", romaji: "ge", pronunciation: "/ge/", meaning: "ge (voiced ke)", exampleWord: "ゲート", exampleMeaning: "gate", audioUrl: null, strokeOrder: 4 },
  { id: "kd-go", character: "ゴ", romaji: "go", pronunciation: "/go/", meaning: "go (voiced ko)", exampleWord: "ゴール", exampleMeaning: "goal", audioUrl: null, strokeOrder: 5 },
  
  // Z row (ザ行) - voiced from S
  { id: "kd-za", character: "ザ", romaji: "za", pronunciation: "/za/", meaning: "za (voiced sa)", exampleWord: "ザイン", exampleMeaning: "design", audioUrl: null, strokeOrder: 6 },
  { id: "kd-ji", character: "ジ", romaji: "ji", pronunciation: "/dʑi/", meaning: "ji (voiced shi)", exampleWord: "ジャーナリスト", exampleMeaning: "journalist", audioUrl: null, strokeOrder: 7 },
  { id: "kd-zu", character: "ズ", romaji: "zu", pronunciation: "/zɯ/", meaning: "zu (voiced su)", exampleWord: "ブルー", exampleMeaning: "blue", audioUrl: null, strokeOrder: 8 },
  { id: "kd-ze", character: "ゼ", romaji: "ze", pronunciation: "/ze/", meaning: "ze (voiced se)", exampleWord: "ゼロ", exampleMeaning: "zero", audioUrl: null, strokeOrder: 9 },
  { id: "kd-zo", character: "ゾ", romaji: "zo", pronunciation: "/zo/", meaning: "zo (voiced so)", exampleWord: "ゾーン", exampleMeaning: "zone", audioUrl: null, strokeOrder: 10 },
  
  // D row (ダ行) - voiced from T
  { id: "kd-da", character: "ダ", romaji: "da", pronunciation: "/da/", meaning: "da (voiced ta)", exampleWord: "ダンス", exampleMeaning: "dance", audioUrl: null, strokeOrder: 11 },
  { id: "kd-di", character: "ヂ", romaji: "di", pronunciation: "/di/", meaning: "di (voiced chi)", exampleWord: "ヂャラ", exampleMeaning: "diva", audioUrl: null, strokeOrder: 12 },
  { id: "kd-du", character: "ヅ", romaji: "du", pronunciation: "/dɯ/", meaning: "du (voiced tsu)", exampleWord: "ヅル", exampleMeaning: "Dru", audioUrl: null, strokeOrder: 13 },
  { id: "kd-de", character: "デ", romaji: "de", pronunciation: "/de/", meaning: "de (voiced te)", exampleWord: "データ", exampleMeaning: "data", audioUrl: null, strokeOrder: 14 },
  { id: "kd-do", character: "ド", romaji: "do", pronunciation: "/do/", meaning: "do (voiced to)", exampleWord: "ドア", exampleMeaning: "door", audioUrl: null, strokeOrder: 15 },
  
  // B row (バ行) - voiced from H
  { id: "kd-ba", character: "バ", romaji: "ba", pronunciation: "/ba/", meaning: "ba (voiced ha)", exampleWord: "ビジネス", exampleMeaning: "business", audioUrl: null, strokeOrder: 16 },
  { id: "kd-bi", character: "ビ", romaji: "bi", pronunciation: "/bi/", meaning: "bi (voiced hi)", exampleWord: "ビル", exampleMeaning: "building", audioUrl: null, strokeOrder: 17 },
  { id: "kd-bu", character: "ブ", romaji: "bu", pronunciation: "/bɯ/", meaning: "bu (voiced fu)", exampleWord: "ブルー", exampleMeaning: "blue", audioUrl: null, strokeOrder: 18 },
  { id: "kd-be", character: "ベ", romaji: "be", pronunciation: "/be/", meaning: "be (voiced he)", exampleWord: "ベッド", exampleMeaning: "bed", audioUrl: null, strokeOrder: 19 },
  { id: "kd-bo", character: "ボ", romaji: "bo", pronunciation: "/bo/", meaning: "bo (voiced ho)", exampleWord: "ボディ", exampleMeaning: "body", audioUrl: null, strokeOrder: 20 },
  
  // P row (パ行) - semi-voiced from H
  { id: "kd-pa", character: "パ", romaji: "pa", pronunciation: "/pa/", meaning: "pa (semi-voiced ha)", exampleWord: "パーティ", exampleMeaning: "party", audioUrl: null, strokeOrder: 21 },
  { id: "kd-pi", character: "ピ", romaji: "pi", pronunciation: "/pi/", meaning: "pi (semi-voiced hi)", exampleWord: "ピンク", exampleMeaning: "pink", audioUrl: null, strokeOrder: 22 },
  { id: "kd-pu", character: "プ", romaji: "pu", pronunciation: "/pɯ/", meaning: "pu (semi-voiced fu)", exampleWord: "プール", exampleMeaning: "pool", audioUrl: null, strokeOrder: 23 },
  { id: "kd-pe", character: "ペ", romaji: "pe", pronunciation: "/pe/", meaning: "pe (semi-voiced he)", exampleWord: "ペン", exampleMeaning: "pen", audioUrl: null, strokeOrder: 24 },
  { id: "kd-po", character: "ポ", romaji: "po", pronunciation: "/po/", meaning: "po (semi-voiced ho)", exampleWord: "ポスト", exampleMeaning: "post", audioUrl: null, strokeOrder: 25 },
];

export const katakanaDakutenLesson = {
  id: "katakana-dakuten",
  title: "Katakana Dakuten",
  subtitle: "Voiced Sounds (濁音)",
  description: "Learn Katakana with dakuten marks - voiced sounds used in many loanwords.",
  totalCharacters: 25,
  difficulty: 2,
  estimatedTime: 30,
  characters: katakanaDakuten,
  color: "from-indigo-400 to-blue-500",
};

export default katakanaDakuten;
