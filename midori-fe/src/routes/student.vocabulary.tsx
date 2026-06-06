import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Star, Clock, ChevronRight, CheckCircle, X,
  Volume2, VolumeX, Play, ChevronLeft, Trophy,
  Bookmark, BookmarkCheck, ArrowRight, Zap, ChevronDown, Tag
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";

// ─── Word Status ───────────────────────────────────────────────────────────────
type WordStatus = "new" | "learning" | "mastered";

const VOCAB_LESSONS = [
  {
    id: "n5-1", title: "Daily Greetings", level: "N5", topic: "Daily Life",
    description: "Essential greetings for everyday conversations — morning, afternoon, and evening.",
    thumbnail: "🌅", estimatedMinutes: 8, totalWords: 12, completedWords: 12, progress: 100,
    words: [
      { word: "おはよう", furigana: "おはよう", romaji: "ohayou", meaning: "Good morning", example: "おはようございます。", exampleMeaning: "Good morning (polite)." },
      { word: "こんにちは", furigana: "こんにちは", romaji: "konnichiwa", meaning: "Hello / Good afternoon", example: "こんにちは、先生。", exampleMeaning: "Hello, teacher." },
      { word: "こんばんは", furigana: "こんばんは", romaji: "konbanwa", meaning: "Good evening", example: "こんばんは。", exampleMeaning: "Good evening." },
      { word: "さようなら", furigana: "さようなら", romaji: "sayounara", meaning: "Goodbye", example: "さようなら、またね。", exampleMeaning: "Goodbye, see you again." },
      { word: "おやすみ", furigana: "おやすみ", romaji: "oyasumi", meaning: "Good night", example: "おやすみなさい。", exampleMeaning: "Good night (polite)." },
      { word: "ありがとう", furigana: "ありがとう", romaji: "arigatou", meaning: "Thank you", example: "ありがとうございます！", exampleMeaning: "Thank you very much!" },
      { word: "すみません", furigana: "すみません", romaji: "sumimasen", meaning: "Excuse me / Sorry", example: "すみません、駅はどこですか。", exampleMeaning: "Excuse me, where is the station?" },
      { word: "はい", furigana: "はい", romaji: "hai", meaning: "Yes", example: "はい、わかりました。", exampleMeaning: "Yes, I understand." },
      { word: "いいえ", furigana: "いいえ", romaji: "iie", meaning: "No", example: "いいえ、違います。", exampleMeaning: "No, that's wrong." },
      { word: "お願いします", furigana: "おねがいします", romaji: "onegaishimasu", meaning: "Please", example: "これ、お願いします。", exampleMeaning: "This one, please." },
      { word: "いただきます", furigana: "いただきます", romaji: "itadakimasu", meaning: "Let's eat (before meal)", example: "いただきます！", exampleMeaning: "Let's eat!" },
      { word: "ごちそうさま", furigana: "ごちそうさま", romaji: "gochisousama", meaning: "Thank you for the meal (after)", example: "ごちそうさまでした！", exampleMeaning: "Thank you for the meal!" },
    ],
  },
  {
    id: "n5-2", title: "Family Members", level: "N5", topic: "Family",
    description: "Vocabulary for describing your family and relatives in Japanese.",
    thumbnail: "👨‍👩‍👧‍👦", estimatedMinutes: 6, totalWords: 10, completedWords: 0, progress: 0,
    words: [
      { word: "家族", furigana: "かぞく", romaji: "kazoku", meaning: "family", example: "家族は何人ですか。", exampleMeaning: "How many people are in your family?" },
      { word: "父", furigana: "ちち", romaji: "chichi", meaning: "father (my)", example: "父は医者です。", exampleMeaning: "My father is a doctor." },
      { word: "母", furigana: "はは", romaji: "haha", meaning: "mother (my)", example: "母は先生です。", exampleMeaning: "My mother is a teacher." },
      { word: "兄弟", furigana: "きょうだい", romaji: "kyoudai", meaning: "brothers / siblings", example: "兄弟は二人います。", exampleMeaning: "I have two siblings." },
      { word: "姉", furigana: "あね", romaji: "ane", meaning: "older sister (my)", example: "姉は大学生です。", exampleMeaning: "My older sister is a university student." },
      { word: "祖父", furigana: "そふ", romaji: "sofu", meaning: "grandfather (my)", example: "祖父は元気です。", exampleMeaning: "My grandfather is healthy." },
      { word: "祖母", furigana: "そぼ", romaji: "sobo", meaning: "grandmother (my)", example: "祖母は料理が上手です。", exampleMeaning: "My grandmother cooks well." },
      { word: "子供", furigana: "こども", romaji: "kodomo", meaning: "child / children", example: "子供が三人います。", exampleMeaning: "I have three children." },
      { word: "主人", furigana: "しゅじん", romaji: "shujin", meaning: "husband (my)", example: "主人は会社で働いています。", exampleMeaning: "My husband works at a company." },
      { word: "妻", furigana: "つま", romaji: "tsuma", meaning: "wife (my)", example: "妻は看護師です。", exampleMeaning: "My wife is a nurse." },
    ],
  },
  {
    id: "n5-3", title: "School Vocabulary", level: "N5", topic: "School",
    description: "Essential words for talking about school life, classes, and studying.",
    thumbnail: "🏫", estimatedMinutes: 10, totalWords: 14, completedWords: 3, progress: 21,
    words: [
      { word: "学校", furigana: "がっこう", romaji: "gakkou", meaning: "school", example: "学校は八時半に始まります。", exampleMeaning: "School starts at 8:30." },
      { word: "先生", furigana: "せんせい", romaji: "sensei", meaning: "teacher", example: "日本語のせんせいです。", exampleMeaning: "I am a Japanese teacher." },
      { word: "学生", furigana: "がくせい", romaji: "gakusei", meaning: "student", example: "私は大学の学生です。", exampleMeaning: "I am a university student." },
      { word: "授業", furigana: "じゅぎょう", romaji: "jugyou", meaning: "class / lesson", example: "授業は九時に始まります。", exampleMeaning: "The class starts at 9." },
      { word: "試験", furigana: "しけん", romaji: "shiken", meaning: "exam / test", example: "試験は来週です。", exampleMeaning: "The exam is next week." },
      { word: "本", furigana: "ほん", romaji: "hon", meaning: "book", example: "本を読みます。", exampleMeaning: "I read books." },
      { word: "図書館", furigana: "としょかん", romaji: "toshokan", meaning: "library", example: "図書館で本を借りました。", exampleMeaning: "I borrowed books at the library." },
      { word: "教室", furigana: "きょうしつ", romaji: "kyoushitsu", meaning: "classroom", example: "教室はどこですか。", exampleMeaning: "Where is the classroom?" },
      { word: "友達", furigana: "ともだち", romaji: "tomodachi", meaning: "friend", example: "友達と映画を見ました。", exampleMeaning: "I watched a movie with my friend." },
      { word: "勉強", furigana: "べんきょう", romaji: "benkyou", meaning: "study", example: "毎日勉強します。", exampleMeaning: "I study every day." },
      { word: "質問", furigana: "しつもん", romaji: "shitsumon", meaning: "question", example: "質問があります。", exampleMeaning: "I have a question." },
      { word: "答え", furigana: "こたえ", romaji: "kotae", meaning: "answer", example: "答え合わせをしましょう。", exampleMeaning: "Let's check the answers together." },
      { word: "鉛筆", furigana: "えんぴつ", romaji: "enpitsu", meaning: "pencil", example: "鉛筆で描いてください。", exampleMeaning: "Please draw with a pencil." },
      { word: "ペン", furigana: "ペン", romaji: "pen", meaning: "pen", example: "このペンで書いてください。", exampleMeaning: "Please write with this pen." },
    ],
  },
  {
    id: "n5-4", title: "Food & Eating", level: "N5", topic: "Food",
    description: "Vocabulary for food, drinks, restaurants, and eating in Japan.",
    thumbnail: "🍜", estimatedMinutes: 9, totalWords: 13, completedWords: 0, progress: 0,
    words: [
      { word: "食べる", furigana: "たべる", romaji: "taberu", meaning: "to eat", example: "朝ごはんを食べます。", exampleMeaning: "I eat breakfast." },
      { word: "飲む", furigana: "のむ", romaji: "nomu", meaning: "to drink", example: "水を飲みます。", exampleMeaning: "I drink water." },
      { word: "朝ごはん", furigana: "あさごはん", romaji: "asa gohan", meaning: "breakfast", example: "朝ごはんは何を食べましたか。", exampleMeaning: "What did you eat for breakfast?" },
      { word: "昼ごはん", furigana: "ひるごはん", romaji: "hiru gohan", meaning: "lunch", example: "昼ごはんは何にしますか。", exampleMeaning: "What will you have for lunch?" },
      { word: "晚ごはん", furigana: "ばんごはん", romaji: "ban gohan", meaning: "dinner", example: "晚ごはん一緒にいかがですか。", exampleMeaning: "Would you like to have dinner together?" },
      { word: "水", furigana: "みず", romaji: "mizu", meaning: "water", example: "お水をください。", exampleMeaning: "Water, please." },
      { word: "お茶", furigana: "おちゃ", romaji: "ocha", meaning: "tea / green tea", example: "お茶をどうぞ。", exampleMeaning: "Please have some tea." },
      { word: "コーヒー", furigana: "コーヒー", romaji: "koohii", meaning: "coffee", example: "コーヒーが好きです。", exampleMeaning: "I like coffee." },
      { word: "肉", furigana: "にく", romaji: "niku", meaning: "meat", example: "牛肉を食べます。", exampleMeaning: "I eat beef." },
      { word: "魚", furigana: "さかな", romaji: "sakana", meaning: "fish", example: "新鮮な魚が好きです。", exampleMeaning: "I like fresh fish." },
      { word: "野菜", furigana: "やさい", romaji: "yasai", meaning: "vegetables", example: "野菜を多吃しています。", exampleMeaning: "I eat a lot of vegetables." },
      { word: "店", furigana: "みせ", romaji: "mise", meaning: "shop / store", example: "あの店に入ってください。", exampleMeaning: "Please enter that shop." },
      { word: "おいしい", furigana: "おいしい", romaji: "oishii", meaning: "delicious / tasty", example: "このラーメンはおいしいです。", exampleMeaning: "This ramen is delicious." },
    ],
  },
  {
    id: "n5-5", title: "Shopping & Money", level: "N5", topic: "Shopping",
    description: "Essential phrases and vocabulary for shopping in Japan.",
    thumbnail: "🛍️", estimatedMinutes: 7, totalWords: 11, completedWords: 0, progress: 0,
    words: [
      { word: "買う", furigana: "かう", romaji: "kau", meaning: "to buy", example: "新しい靴を買いたいです。", exampleMeaning: "I want to buy new shoes." },
      { word: "高い", furigana: "たかい", romaji: "takai", meaning: "expensive", example: "この家は高いですね。", exampleMeaning: "This house is expensive, isn't it?" },
      { word: "安い", furigana: "やすい", romaji: "yasui", meaning: "cheap / inexpensive", example: "ここは食べ物が安いです。", exampleMeaning: "Food is cheap here." },
      { word: "いくら", furigana: "いくら", romaji: "ikura", meaning: "how much", example: "これはいくらですか。", exampleMeaning: "How much is this?" },
      { word: "円", furigana: "えん", romaji: "en", meaning: "yen (Japanese currency)", example: "三千円です。", exampleMeaning: "It is 3,000 yen." },
      { word: "カード", furigana: "カード", romaji: "kaado", meaning: "card (credit/debit)", example: "カードで払えますか。", exampleMeaning: "Can I pay by card?" },
      { word: "現金", furigana: "げんきん", romaji: "genkin", meaning: "cash", example: "現金でお支払いください。", exampleMeaning: "Please pay in cash." },
      { word: "袋", furigana: "ふくろ", romaji: "fukuro", meaning: "bag / plastic bag", example: "袋はいりますか。", exampleMeaning: "Do you need a bag?" },
      { word: "小さい", furigana: "ちいさい", romaji: "chiisai", meaning: "small / little", example: "小さいサイズをください。", exampleMeaning: "Please give me a small size." },
      { word: "大きい", furigana: "おおきい", romaji: "ookii", meaning: "big / large", example: "大きいサイズがありますか。", exampleMeaning: "Do you have a larger size?" },
      { word: "新しい", furigana: "あたらしい", romaji: "atarashii", meaning: "new", example: "新しい靴が欲しいです。", exampleMeaning: "I want new shoes." },
    ],
  },
  {
    id: "n5-6", title: "Travel Essentials", level: "N5", topic: "Travel",
    description: "Must-know vocabulary for getting around Japan as a traveler.",
    thumbnail: "✈️", estimatedMinutes: 8, totalWords: 12, completedWords: 0, progress: 0,
    words: [
      { word: "電車", furigana: "でんしゃ", romaji: "densha", meaning: "train", example: "電車で行きます。", exampleMeaning: "I'll go by train." },
      { word: "駅", furigana: "えき", romaji: "eki", meaning: "station", example: "駅はどこですか。", exampleMeaning: "Where is the station?" },
      { word: "バス", furigana: "バス", romaji: "basu", meaning: "bus", example: "バスで30分かかかります。", exampleMeaning: "It takes 30 minutes by bus." },
      { word: "空港", furigana: "くうこう", romaji: "kuukou", meaning: "airport", example: "空港までタクシーで行きました。", exampleMeaning: "I went to the airport by taxi." },
      { word: "ホテル", furigana: "ホテル", romaji: "hoteru", meaning: "hotel", example: "ホテルを予約しました。", exampleMeaning: "I made a hotel reservation." },
      { word: "道", furigana: "みち", romaji: "michi", meaning: "road / way", example: "道を曲がってください。", exampleMeaning: "Please turn the corner." },
      { word: "左", furigana: "ひだり", romaji: "hidari", meaning: "left", example: "左に曲がってください。", exampleMeaning: "Please turn left." },
      { word: "右", furigana: "みぎ", romaji: "migi", meaning: "right", example: "右に曲がってください。", exampleMeaning: "Please turn right." },
      { word: "まっすぐ", furigana: "まっすぐ", romaji: "massugu", meaning: "straight", example: "まっすぐ行ってください。", exampleMeaning: "Please go straight." },
      { word: "旅行", furigana: "りょこう", romaji: "ryokou", meaning: "travel / trip", example: "旅行が好きです。", exampleMeaning: "I like traveling." },
      { word: "写真", furigana: "しゃしん", romaji: "shashin", meaning: "photograph", example: "写真を撮ってもいいですか。", exampleMeaning: "May I take a photo?" },
      { word: "地図", furigana: "ちず", romaji: "chizu", meaning: "map", example: "地図を見せてください。", exampleMeaning: "Please show me the map." },
    ],
  },
  {
    id: "n4-1", title: "Daily Life Conversations", level: "N4", topic: "Daily Life",
    description: "Intermediate vocabulary for everyday conversations and routines.",
    thumbnail: "📅", estimatedMinutes: 10, totalWords: 15, completedWords: 0, progress: 0,
    words: [
      { word: "約束", furigana: "やくそく", romaji: "yakusoku", meaning: "promise / appointment", example: "約束を忘れました。", exampleMeaning: "I forgot our appointment." },
      { word: "連絡", furigana: "れんらく", romaji: "renraku", meaning: "contact / communication", example: "連絡をください。", exampleMeaning: "Please contact me." },
      { word: "準備", furigana: "じゅんび", romaji: "junbi", meaning: "preparation", example: "準備ができています。", exampleMeaning: "I'm ready." },
      { word: "経験", furigana: "けいけん", romaji: "keiken", meaning: "experience", example: "一年間の経験があります。", exampleMeaning: "I have one year of experience." },
      { word: "気分", furigana: "きぶん", romaji: "kibun", meaning: "feeling / mood", example: "気分が悪いです。", exampleMeaning: "I don't feel well." },
      { word: "場合", furigana: "ばあい", romaji: "baai", meaning: "case / situation", example: "病気の場合は休みます。", exampleMeaning: "I rest in case of illness." },
      { word: "方法", furigana: "ほうほう", romaji: "houhou", meaning: "method / way", example: "この方法は簡単です。", exampleMeaning: "This method is simple." },
      { word: "興味", furigana: "きょうみ", romaji: "kyoumi", meaning: "interest", example: "日本文化に興味があります。", exampleMeaning: "I am interested in Japanese culture." },
      { word: "理由", furigana: "りゆう", romaji: "riyuu", meaning: "reason", example: "理由は分かりません。", exampleMeaning: "I don't know the reason." },
      { word: "説明", furigana: "せつめい", romaji: "setsumei", meaning: "explanation", example: "説明してください。", exampleMeaning: "Please explain." },
      { word: "関係", furigana: "かんけい", romaji: "kankei", meaning: "relationship", example: "日本と関係があります。", exampleMeaning: "It is related to Japan." },
      { word: "結果", furigana: "けっか", romaji: "kekka", meaning: "result", example: "結果はどうでしたか。", exampleMeaning: "What was the result?" },
      { word: "社会", furigana: "しゃかい", romaji: "shakai", meaning: "society", example: "社会に必要です。", exampleMeaning: "It is needed in society." },
      { word: "美容院", furigana: "びよういん", romaji: "biyouin", meaning: "beauty salon", example: "美容院に行きます。", exampleMeaning: "I'll go to the beauty salon." },
      { word: "食堂", furigana: "しょくどう", romaji: "shokudou", meaning: "cafeteria / dining hall", example: "食堂で食事をします。", exampleMeaning: "I eat at the cafeteria." },
    ],
  },
  {
    id: "n4-2", title: "Nature & Environment", level: "N4", topic: "Nature",
    description: "Vocabulary for describing the natural world and environmental topics.",
    thumbnail: "🌿", estimatedMinutes: 8, totalWords: 12, completedWords: 0, progress: 0,
    words: [
      { word: "環境", furigana: "かんきょう", romaji: "kankyou", meaning: "environment", example: "環境を守ることが大切です。", exampleMeaning: "Protecting the environment is important." },
      { word: "努力", furigana: "どりょく", romaji: "doryoku", meaning: "effort", example: "努力は報われます。", exampleMeaning: "Your efforts will be rewarded." },
      { word: "自然", furigana: "しぜん", romaji: "shizen", meaning: "nature", example: "自然に還りました。", exampleMeaning: "I returned to nature." },
      { word: "空", furigana: "そら", romaji: "sora", meaning: "sky", example: "空が綺麗ですね。", exampleMeaning: "The sky is beautiful, isn't it?" },
      { word: "海", furigana: "うみ", romaji: "umi", meaning: "sea / ocean", example: "海で泳ぎたいです。", exampleMeaning: "I want to swim in the sea." },
      { word: "山", furigana: "やま", romaji: "yama", meaning: "mountain", example: "山に登りました。", exampleMeaning: "I climbed the mountain." },
      { word: "川", furigana: "かわ", romaji: "kawa", meaning: "river", example: "川のそばに猫がいます。", exampleMeaning: "There is a cat by the river." },
      { word: "花", furigana: "はな", romaji: "hana", meaning: "flower / cherry blossom", example: "花が咲いています。", exampleMeaning: "The flowers are blooming." },
      { word: "天気", furigana: "てんき", romaji: "tenki", meaning: "weather", example: "今日の天気が良いですね。", exampleMeaning: "Today's weather is nice." },
      { word: "雨", furigana: "あめ", romaji: "ame", meaning: "rain", example: "雨が降っています。", exampleMeaning: "It is raining." },
      { word: "雪", furigana: "ゆき", romaji: "yuki", meaning: "snow", example: "北海道に雪が降りました。", exampleMeaning: "It snowed in Hokkaido." },
      { word: "温度", furigana: "おんど", romaji: "ondo", meaning: "temperature", example: "今日の温度は25度です。", exampleMeaning: "Today's temperature is 25 degrees." },
    ],
  },
  {
    id: "n3-1", title: "Society & Values", level: "N3", topic: "Business",
    description: "Intermediate vocabulary for discussing social issues, values, and abstract concepts.",
    thumbnail: "🏛️", estimatedMinutes: 12, totalWords: 16, completedWords: 0, progress: 0,
    words: [
      { word: "成長", furigana: "せいちょう", romaji: "seichou", meaning: "growth", example: "子供の成長は早いです。", exampleMeaning: "Children grow up quickly." },
      { word: "価値観", furigana: "かちかん", romaji: "kachikan", meaning: "sense of values", example: "価値観の違いがあります。", exampleMeaning: "There are differences in values." },
      { word: "理解", furigana: "りかい", romaji: "rikai", meaning: "understanding", example: "理解するのが難しい。", exampleMeaning: "It is difficult to understand." },
      { word: "影響", furigana: "えいきょう", romaji: "eikyou", meaning: "influence / effect", example: "環境に影響を与えます。", exampleMeaning: "It affects the environment." },
      { word: "重要", furigana: "じゅうよう", romaji: "juuyou", meaning: "important", example: "これは重要です。", exampleMeaning: "This is important." },
      { word: "実現", furigana: "じつげん", romaji: "jitsugen", meaning: "realization / achievement", example: "夢を実現したい。", exampleMeaning: "I want to achieve my dream." },
      { word: "判断", furigana: "はんだん", romaji: "handan", meaning: "judgment / decision", example: "自分で判断してください。", exampleMeaning: "Please judge for yourself." },
      { word: "機会", furigana: "きかい", romaji: "kikai", meaning: "opportunity", example: "いい機会です。", exampleMeaning: "It is a good opportunity." },
      { word: "効果", furigana: "こうか", romaji: "kouka", meaning: "effect / result", example: "効果が出ない。", exampleMeaning: "There is no effect." },
      { word: "意識", furigana: "いしき", romaji: "ishiki", meaning: "consciousness / awareness", example: "環境意識を高めたい。", exampleMeaning: "I want to raise environmental awareness." },
      { word: "平均", furigana: "へいきん", romaji: "heikin", meaning: "average", example: "平均点は70点です。", exampleMeaning: "The average score is 70 points." },
      { word: "比較", furigana: "ひかく", romaji: "hikaku", meaning: "comparison", example: "比較してみましょう。", exampleMeaning: "Let's make a comparison." },
      { word: "具体的", furigana: "ぐたいてき", romaji: "gutaiteki", meaning: "specific / concrete", example: "具体的に説明してください。", exampleMeaning: "Please explain specifically." },
      { word: "提案", furigana: "ていあん", romaji: "teian", meaning: "proposal / suggestion", example: "新しい提案があります。", exampleMeaning: "I have a new proposal." },
    ],
  },
  {
    id: "n2-1", title: "Business Communication", level: "N2", topic: "Business Japanese",
    description: "Advanced business Japanese vocabulary for professional settings.",
    thumbnail: "📊", estimatedMinutes: 15, totalWords: 16, completedWords: 0, progress: 0,
    words: [
      { word: "貢献", furigana: "こうけん", romaji: "kouken", meaning: "contribution", example: "社会に貢献したい。", exampleMeaning: "I want to contribute to society." },
      { word: "不可欠", furigana: "ふかけつ", romaji: "fukaketsu", meaning: "indispensable / essential", example: "水は生活に不可欠です。", exampleMeaning: "Water is essential for life." },
      { word: "側面", furigana: "そくめん", romaji: "sokumen", meaning: "aspect / side", example: "複数の側面から分析する。", exampleMeaning: "Analyze from multiple aspects." },
      { word: "視野", furigana: "しや", romaji: "shiya", meaning: "field of view / perspective", example: "視野を広げる。", exampleMeaning: "Broaden your perspective." },
      { word: "転換", furigana: "てんかん", romaji: "tenkan", meaning: "conversion / transformation", example: "考えを転換する。", exampleMeaning: "Change your thinking." },
      { word: "対立", furigana: "たいりつ", romaji: "tairitsu", meaning: "confrontation / opposition", example: "意見が対立している。", exampleMeaning: "Opinions are opposing each other." },
      { word: "調和", furigana: "ちょうわ", romaji: "chouwa", meaning: "harmony", example: "調和を保つ。", exampleMeaning: "Maintain harmony." },
      { word: "逼迫", furigana: "ひっぱく", romaji: "hippaku", meaning: "tightening / strain", example: "時間が逼迫している。", exampleMeaning: "Time is running short." },
      { word: "動向", furigana: "どうこう", romaji: "doukou", meaning: "trend / movement", example: "市場の動向を観察する。", exampleMeaning: "Observe market trends." },
      { word: "配慮", furigana: "はいりょ", romaji: "hairyo", meaning: "consideration / thoughtfulness", example: "環境に配慮する。", exampleMeaning: "Be considerate of the environment." },
      { word: "前提", furigana: "ぜんてい", romaji: "zentei", meaning: "premise / prerequisite", example: "それが前提です。", exampleMeaning: "That is the premise." },
      { word: "提起", furigana: "ていき", romaji: "teiki", meaning: "raise / pose (an issue)", example: "問題を提起する。", exampleMeaning: "Raise an issue." },
    ],
  },
  {
    id: "n1-1", title: "Advanced Abstract Concepts", level: "N1", topic: "Business Japanese",
    description: "Master-level vocabulary for discussing abstract and philosophical concepts.",
    thumbnail: "🎓", estimatedMinutes: 18, totalWords: 15, completedWords: 0, progress: 0,
    words: [
      { word: "規範", furigana: "きはん", romaji: "kihan", meaning: "norm / standard", example: "社会規範を守る。", exampleMeaning: "Observe social norms." },
      { word: "志向", furigana: "しこう", romaji: "shikou", meaning: "orientation / tendency", example: "効率志向の生活。", exampleMeaning: "Efficiency-oriented lifestyle." },
      { word: "俯瞰", furigana: "ふかん", romaji: "fukan", meaning: "bird's-eye view", example: "全体を俯瞰する。", exampleMeaning: "Take a bird's-eye view of the whole." },
      { word: "帰結", furigana: "きけつ", romaji: "kiketsu", meaning: "conclusion / result", example: "自然に帰結する。", exampleMeaning: "Naturally leads to a conclusion." },
      { word: "枢要", furigana: "すうよう", romaji: "suuyou", meaning: "essential / crucial", example: "これは極めて枢要な問題だ。", exampleMeaning: "This is an extremely crucial issue." },
      { word: "揺るぎ", furigana: "ゆらぎ", romaji: "yuragi", meaning: "fluctuation / wavering", example: "揺るぎない信念。", exampleMeaning: "Unshakable belief." },
      { word: "渦中", furigana: "かちゅう", romaji: "kachuu", meaning: "midst (of turmoil)", example: "議論の渦中にある。", exampleMeaning: "In the midst of debate." },
      { word: "機運", furigana: "きうん", romaji: "kiun", meaning: "opportune moment", example: "改革の機運が高まっている。", exampleMeaning: "Momentum for reform is building." },
      { word: "懐疑", furigana: "かいぎ", romaji: "kaigi", meaning: "doubt / skepticism", example: "懐疑の目で見つめる。", exampleMeaning: "Look with skeptical eyes." },
      { word: "穿つ", furigana: "うがつ", romaji: "ugatsu", meaning: "to pierce / to penetrate", example: "本質穿つ分析。", exampleMeaning: "An analysis that pierces the essence." },
      { word: "蹉跌", furigana: "さてつ", romaji: "satetsu", meaning: "mistake / setback", example: "蹉跌を繰り返さない。", exampleMeaning: "Don't repeat mistakes." },
    ],
  },
];

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

const FILTER_TABS = ["Tất cả", "Đã thuộc", "Chưa thuộc", "Yêu thích"] as const;

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

function getLevelGradient(level: string): string {
  const g: Record<string, string> = {
    N5: "from-blue-300 via-sky-400 to-cyan-400",
    N4: "from-violet-300 via-purple-400 to-fuchsia-400",
    N3: "from-pink-300 via-rose-400 to-red-300",
    N2: "from-amber-300 via-orange-400 to-yellow-300",
    N1: "from-red-300 via-pink-400 to-fuchsia-400",
  };
  return g[level] ?? "from-blue-400 to-purple-400";
}

function getLevelGradientDark(level: string): string {
  const g: Record<string, string> = {
    N5: "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80",
    N4: "dark:from-violet-700/90 dark:via-purple-500/75 dark:to-fuchsia-600/80",
    N3: "dark:from-pink-700/90 dark:via-rose-500/75 dark:to-red-600/80",
    N2: "dark:from-amber-700/90 dark:via-orange-500/75 dark:to-yellow-600/80",
    N1: "dark:from-red-700/90 dark:via-pink-500/75 dark:to-fuchsia-600/80",
  };
  return g[level] ?? "dark:from-blue-600/90 dark:via-cyan-500/75 dark:to-violet-600/80";
}

function getLevelBadge(level: string): string {
  const c: Record<string, string> = {
    N5: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
    N4: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300",
    N3: "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300",
    N2: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300",
    N1: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300",
  };
  return c[level] ?? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300";
}

function getTopicColor(topic: string): string {
  const c: Record<string, string> = {
    Family: "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-800",
    School: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Food: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    Travel: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    Shopping: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    Work: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    "Daily Life": "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800",
    "Business Japanese": "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    Nature: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  };
  return c[topic] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";
}

function getTopicIcon(topic: string): string {
  const icons: Record<string, string> = {
    "All Topics": "🌐",
    "Daily Life": "🌅",
    Family: "👨‍👩‍👧‍👦",
    School: "🏫",
    Food: "🍜",
    Shopping: "🛍️",
    Travel: "✈️",
    Nature: "🌿",
    Business: "💼",
    "Business Japanese": "📊",
  };
  return icons[topic] ?? "📚";
}

interface TopicsDropdownProps {
  topics: string[];
  selected: string;
  onSelect: (topic: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function TopicsDropdown({ topics, selected, onSelect, isOpen, onToggle }: TopicsDropdownProps) {
  const handleSelect = (topic: string) => {
    onSelect(topic);
    onToggle();
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-sm ${
          isOpen || selected !== "All Topics"
            ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md"
            : "bg-white/70 dark:bg-white/[0.06] backdrop-blur-sm border border-white/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/80 hover:text-foreground dark:hover:bg-white/[0.10] dark:hover:border-white/15"
        }`}
      >
        <span className="text-base">{getTopicIcon(selected)}</span>
        <span>{selected}</span>
        {selected !== "All Topics" && (
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
            1
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 sm:w-72 z-50"
          >
            <div className="bg-white/95 dark:bg-indigo-950/90 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-indigo-400/20 shadow-xl shadow-black/10 p-2">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground dark:text-indigo-200/70">
                  <Tag className="w-3.5 h-3.5" />
                  Topics
                </div>
                <span className="text-[10px] text-muted-foreground dark:text-indigo-200/60">{topics.length - 1} topics</span>
              </div>

              {/* Topic Pills */}
              <div className="space-y-1">
                {topics.map(topic => {
                  const isSelected = topic === selected;
                  const isAll = topic === "All Topics";

                  return (
                    <button
                      key={topic}
                      onClick={() => handleSelect(topic)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.07] text-slate-700 dark:text-indigo-200/80"
                      }`}
                    >
                      <span className="text-base">{getTopicIcon(topic)}</span>
                      <span className="flex-1 text-left">{topic}</span>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 px-3 pb-1">
                <p className="text-[10px] text-muted-foreground text-center">
                  Tap to filter · Tap again or outside to close
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/student/vocabulary")({ component: VocabularyPage });

function VocabularyPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>("N5");
  const [selectedTopic, setSelectedTopic] = useState<string>("All Topics");
  const [search, setSearch] = useState("");
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<typeof FILTER_TABS[number]>("Tất cả");
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const WORDS_PER_PAGE = 10;

  // Word status: "new" | "learning" | "mastered"
  const [wordStatuses, setWordStatuses] = useState<Record<string, WordStatus>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const levelLessons = useMemo(
    () => VOCAB_LESSONS.filter(l => l.level === selectedLevel),
    [selectedLevel]
  );

  const filteredLessons = useMemo(() => {
    return levelLessons.filter(l => {
      if (selectedTopic !== "All Topics" && l.topic !== selectedTopic) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.title.toLowerCase().includes(q) ||
          l.words.some(w => w.word.includes(q) || w.meaning.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [levelLessons, selectedTopic, search]);

  const topicsInLevel = useMemo(() => {
    const topics = new Set(levelLessons.map(l => l.topic));
    return ["All Topics", ...Array.from(topics)];
  }, [levelLessons]);

  const totalWordsAll = VOCAB_LESSONS.reduce((sum, l) => sum + l.words.length, 0);
  const totalLearned = Object.values(wordStatuses).filter(s => s === "mastered").length;
  const totalLearning = Object.values(wordStatuses).filter(s => s === "learning").length;
  const totalFavorites = favorites.size;

  const activeLessonData = useMemo(
    () => VOCAB_LESSONS.find(l => l.id === activeLesson),
    [activeLesson]
  );

  const getWordStatus = (wordKey: string): WordStatus => wordStatuses[wordKey] ?? "new";
  const getWordStatusDot = (wordKey: string): string => {
    const s = getWordStatus(wordKey);
    if (s === "mastered") return "bg-green-400";
    if (s === "learning") return "bg-amber-400";
    return "bg-slate-300";
  };

  const setWordStatus = (wordKey: string, status: WordStatus) => {
    setWordStatuses(prev => {
      const next = { ...prev };
      if (prev[wordKey] === status) {
        delete next[wordKey];
      } else {
        next[wordKey] = status;
      }
      return next;
    });
  };

  const toggleFavoriteWord = (wordKey: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(wordKey)) next.delete(wordKey);
      else next.add(wordKey);
      return next;
    });
  };

  // ── Lesson Detail View ────────────────────────────────────────────────
  if (activeLesson && activeLessonData) {
    const words = activeLessonData.words;
    const lessonProgress = words.filter(w => wordStatuses[`${activeLesson}-${w.word}`] === "mastered").length;
    const progressPct = words.length > 0 ? Math.round((lessonProgress / words.length) * 100) : 0;

    const filteredWords = words.filter(w => {
      const key = `${activeLesson}-${w.word}`;
      const status = getWordStatus(key);
      const isFav = favorites.has(key);
      if (filterTab === "Đã thuộc") return status === "mastered";
      if (filterTab === "Chưa thuộc") return status === "new";
      if (filterTab === "Yêu thích") return isFav;
      return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredWords.length / WORDS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedWords = filteredWords.slice((safePage - 1) * WORDS_PER_PAGE, safePage * WORDS_PER_PAGE);

    return (
      <div className="dark:bg-gradient-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950">
        <SakuraBg count={14} />
        <div className="relative z-10">
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Lesson Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveLesson(null); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card/70 dark:bg-white/[0.06] backdrop-blur-sm border border-border/50 dark:border-white/10 text-xs font-semibold hover:bg-card dark:hover:bg-white/[0.09] transition shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-bold text-base dark:text-white">{activeLessonData.title}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${getLevelBadge(activeLessonData.level)}`}>
                {activeLessonData.level}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTopicColor(activeLessonData.topic)}`}>
                {activeLessonData.topic}
              </span>
              {completedLessons.has(activeLesson) && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-800 text-[10px] font-bold">
                  <CheckCircle className="w-3 h-3" /> Done
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Meta Bar */}
        <div className="flex items-center gap-3 flex-wrap px-4 py-3 rounded-2xl bg-card/60 dark:bg-indigo-950/40 backdrop-blur-sm border border-border/50 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-24 h-2 rounded-full bg-white/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-pink-400 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-muted-foreground dark:text-indigo-200/80">{progressPct}%</span>
          </div>
          <div className="w-px h-4 bg-border dark:bg-white/10" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-indigo-200/70">
            <BookOpen className="w-3 h-3" />
            <span>{words.length} words</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>~{activeLessonData.estimatedMinutes} min</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            <span>{lessonProgress} mastered</span>
          </div>
          <div className="w-px h-4 bg-border dark:bg-white/10" />
          <div className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
            <Zap className="w-3 h-3" />
            <span>{words.filter(w => wordStatuses[`${activeLesson}-${w.word}`] === "learning").length} learning</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setFilterTab(tab); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    filterTab === tab
                      ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-sm"
                      : "bg-card/60 dark:bg-white/[0.045] backdrop-blur-sm border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/[0.07] dark:hover:border-white/15"
                  }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Vocabulary Cards */}
        {paginatedWords.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50 dark:text-indigo-300/40 mb-2" />
            <p className="text-sm text-muted-foreground dark:text-slate-300">No words in this category</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedWords.map((word, i) => {
              const wordKey = `${activeLesson}-${word.word}`;
              const status = getWordStatus(wordKey);
              const isFav = favorites.has(wordKey);

              return (
                <motion.div
                  key={wordKey}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group bg-card/80 dark:bg-[#0f1430] dark:border-indigo-400/20 dark:hover:border-cyan-300/40 dark:hover:shadow-xl dark:hover:shadow-indigo-500/10 rounded-2xl border border-border/50 px-4 py-3 hover:shadow-md hover:border-blue-200/60 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 self-start mt-1 mr-3 ${getWordStatusDot(wordKey)}`} />

                    {/* Japanese + Furigana */}
                    <div className="flex-shrink-0 w-36 mr-3">
                      <div className="font-display text-xl font-black text-foreground dark:text-white leading-tight">{word.word}</div>
                      <div className="text-xs text-primary/80 dark:text-cyan-400 font-medium leading-tight">{word.furigana}</div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px self-stretch shrink-0 rounded-full bg-gradient-to-b from-transparent via-indigo-400/40 to-transparent dark:bg-gradient-to-b dark:from-transparent dark:via-indigo-400/50 dark:to-transparent mr-4" />

                    {/* Meaning */}
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="text-sm font-semibold text-foreground dark:text-slate-100 leading-snug">
                        {word.meaning}
                      </div>
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => setWordStatus(wordKey, "mastered")}
                        title="Đã thuộc"
                        className={`p-1.5 rounded-lg transition-all ${
                          status === "mastered"
                            ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
                            : "text-muted-foreground dark:text-indigo-300/60 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-500"
                        }`}
                      >
                        <CheckCircle className={`w-4 h-4 ${status === "mastered" ? "fill-green-400" : ""}`} />
                      </button>
                      <button
                        onClick={() => setWordStatus(wordKey, "new")}
                        title="Chưa thuộc"
                        className={`p-1.5 rounded-lg transition-all ${
                          status === "new"
                            ? "bg-muted text-muted-foreground dark:bg-indigo-500/20 dark:text-indigo-300"
                            : "text-muted-foreground dark:text-indigo-300/60 hover:bg-muted/50 dark:hover:bg-indigo-500/15 hover:text-foreground"
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleFavoriteWord(wordKey)}
                        className="p-1.5 rounded-lg transition-all text-muted-foreground dark:text-indigo-300/60 hover:bg-amber-50 dark:hover:bg-amber-900/20 group/icon"
                      >
                        {isFav ? (
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <Star className="w-4 h-4 dark:group-hover/icon:text-amber-400 transition-colors" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); speakJapanese(word.furigana || word.word); }}
                        title="Play pronunciation"
                        className="p-1.5 rounded-lg text-muted-foreground dark:text-indigo-300/60 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded — Example Sentence */}
                  <div className="mt-2 pt-2 border-t border-border/60 dark:border-indigo-400/15">
                    <div className="text-xs text-muted-foreground dark:text-slate-300/80 italic pl-3" style={{ fontFamily: "var(--font-japanese, serif)" }}>
                      {word.example}
                    </div>
                    <div className="text-xs text-muted-foreground/80 dark:text-indigo-200/70 pl-3 mt-0.5">
                      {word.exampleMeaning}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {/* Complete Lesson Button */}
            {paginatedWords.length > 0 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setCompletedLessons(prev => { const n = new Set(prev); n.add(activeLesson ?? ""); return n; })}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-400 to-pink-400 text-white text-sm font-bold shadow-lg shadow-purple-200/30 hover:opacity-90 transition"
                >
                  <Trophy className="w-4 h-4" /> Complete Lesson
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-card/70 dark:bg-white/[0.06] border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      page === currentPage
                        ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md"
                        : "bg-card/70 dark:bg-white/[0.06] border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/[0.09]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-card/70 dark:bg-white/[0.06] border border-border/50 dark:border-white/10 text-muted-foreground dark:text-indigo-200/70 hover:text-foreground dark:hover:bg-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
  }

  // ── Browse Lessons View ───────────────────────────────────────────────
  return (
    <div className="dark:bg-gradient-to-br dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 min-h-screen">
      <SakuraBg count={14} />
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-black">Vocabulary Lessons</h1>
              <p className="text-sm text-muted-foreground dark:text-slate-300 mt-0.5">
                Learn Japanese vocabulary through structured lessons.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {[
                { label: "Mastered", value: totalLearned, color: "text-green-500" },
                { label: "Learning", value: totalLearning, color: "text-amber-500" },
                { label: "Total", value: totalWordsAll, color: "text-blue-500" },
              ].map(stat => (
                <div key={stat.label} className="text-center px-3 py-2 rounded-xl bg-card/70 dark:bg-indigo-950/50 backdrop-blur-sm border border-border/50 dark:border-indigo-400/20 shadow-sm">
                  <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* JLPT Level Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {JLPT_LEVELS.map(level => {
              const lvlLessons = VOCAB_LESSONS.filter(l => l.level === level);
              const lvlTotal = lvlLessons.reduce((s, l) => s + l.words.length, 0);
              const lvlLearned = lvlLessons.reduce((s, l) =>
                s + l.words.filter(w => wordStatuses[`${l.id}-${w.word}`] === "mastered").length, 0);
              const pct = lvlTotal > 0 ? Math.round((lvlLearned / lvlTotal) * 100) : 0;
              const isSelected = level === selectedLevel;
              return (
                <button
                  key={level}
                  onClick={() => { setSelectedLevel(level); setSelectedTopic("All Topics"); }}
                  className={`relative flex-shrink-0 flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-lg shadow-blue-200/40 dark:shadow-none"
                      : "bg-card/70 dark:bg-white/[0.045] backdrop-blur-sm border border-border/50 dark:border-white/10 hover:shadow-md dark:hover:bg-white/[0.08] dark:hover:border-indigo-300/20"
                  }`}
                >
                  <span className="font-display font-black text-base">{level}</span>
                  <div className={`w-14 h-1 rounded-full overflow-hidden ${isSelected ? "bg-white/30" : "bg-slate-100 dark:bg-slate-700"}`}>
                    <div className={`h-full rounded-full transition-all ${isSelected ? "bg-white" : "bg-pink-300"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted-foreground dark:text-indigo-300/70"}`}>{pct}%</span>
                </button>
              );
            })}
          </div>

          {/* Search + Topics dropdown */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vocabulary…"
                className="w-full px-4 py-2.5 rounded-2xl bg-card/70 dark:bg-white/[0.055] backdrop-blur-sm border border-border/50 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 dark:focus:ring-cyan-300/30 dark:focus:border-cyan-300/30 shadow-sm dark:placeholder:text-slate-400 dark:text-slate-200 dark:focus:bg-white/[0.07]"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Topics Dropdown */}
            <TopicsDropdown
              topics={topicsInLevel}
              selected={selectedTopic}
              onSelect={setSelectedTopic}
              isOpen={topicsOpen}
              onToggle={() => setTopicsOpen(v => !v)}
            />
          </div>

          {/* Lessons Grid */}
          {filteredLessons.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 dark:text-indigo-300/40 mb-3" />
              <p className="text-muted-foreground dark:text-slate-300 font-medium">No lessons found</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLessons.map((lesson, i) => {
                const lessonLearned = lesson.words.filter(w => wordStatuses[`${lesson.id}-${w.word}`] === "mastered").length;
                const lessonLearning = lesson.words.filter(w => wordStatuses[`${lesson.id}-${w.word}`] === "learning").length;
                const lessonPct = lesson.words.length > 0 ? Math.round((lessonLearned / lesson.words.length) * 100) : 0;
                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <button
                      onClick={() => { setActiveLesson(lesson.id); setFilterTab("Tất cả"); setCurrentPage(1); }}
                      className="w-full text-left rounded-2xl bg-card/80 dark:bg-white/[0.035] backdrop-blur-sm border border-border/50 dark:border-white/10 hover:shadow-xl hover:border-blue-300/50 dark:hover:border-cyan-300/25 hover:-translate-y-1 transition-all duration-200 overflow-hidden group"
                    >
                      {/* Clean Header */}
                      <div className={`relative px-4 pt-4 pb-3 bg-gradient-to-br ${getLevelGradient(lesson.level)} ${getLevelGradientDark(lesson.level)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/30 text-white backdrop-blur-sm dark:bg-slate-900/60 dark:text-white dark:border dark:border-white/20">{lesson.level}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white/80 backdrop-blur-sm border border-white/20 dark:bg-slate-900/50 dark:text-white/80 dark:border-white/15">{lesson.topic}</span>
                          </div>
                          {completedLessons.has(lesson.id) && (
                            <span className="w-6 h-6 rounded-full bg-green-100/70 dark:bg-green-900/50 backdrop-blur-sm flex items-center justify-center">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-300" />
                            </span>
                          )}
                        </div>
                        <h4 className="font-display font-black text-base leading-tight text-white mt-2 group-hover:text-white/90 transition">{lesson.title}</h4>
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 dark:group-hover:bg-white/20 transition">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2 dark:bg-white/[0.025]">
                        <p className="text-xs text-muted-foreground dark:text-slate-300/85 line-clamp-2 leading-relaxed">{lesson.description}</p>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground dark:text-indigo-200/70">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {lesson.words.length} words</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{lesson.estimatedMinutes}m</span>
                          {lessonLearned > 0 && <span className="flex items-center gap-1 text-green-500"><CheckCircle className="w-3 h-3" /> {lessonLearned}</span>}
                          {lessonLearning > 0 && <span className="flex items-center gap-1 text-amber-500"><Zap className="w-3 h-3" /> {lessonLearning}</span>}
                        </div>

                        {/* Progress */}
                        <div className="h-1.5 rounded-full bg-white/10 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-pink-400 transition-all"
                            style={{ width: `${lessonPct}%` }}
                          />
                        </div>
                      </div>
                    </button>
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
