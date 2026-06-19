// Reading Practice Exercises for N5 Level

export interface ReadingExercise {
  id: string;
  sentence: string;
  romaji: string;
  translation: string;
  level: "beginner" | "intermediate";
  lesson?: string;
}

export const readingExercises: ReadingExercise[] = [
  // Beginner Level - Very Simple Sentences
  { id: "r-1", sentence: "あさです。", romaji: "asa desu.", translation: "It is morning.", level: "beginner" },
  { id: "r-2", sentence: "いぬです。", romaji: "inu desu.", translation: "It is a dog.", level: "beginner" },
  { id: "r-3", sentence: "ねこです。", romaji: "neko desu.", translation: "It is a cat.", level: "beginner" },
  { id: "r-4", sentence: "くるまです。", romaji: "kuruma desu.", translation: "It is a car.", level: "beginner" },
  { id: "r-5", sentence: "くるいです。", romaji: "kurui desu.", translation: "It is delicious.", level: "beginner" },
  { id: "r-6", sentence: "さくらです。", romaji: "sakura desu.", translation: "I am Sakura. / It is cherry blossom.", level: "beginner" },
  { id: "r-7", sentence: "がっこうです。", romaji: "gakkou desu.", translation: "It is a school.", level: "beginner" },
  { id: "r-8", sentence: "システムが。", romaji: "shisutemu desu.", translation: "It is a system.", level: "beginner" },
  { id: "r-9", sentence: "ほんです。", romaji: "hon desu.", translation: "It is a book.", level: "beginner" },
  { id: "r-10", sentence: "みずです。", romaji: "mizu desu.", translation: "It is water.", level: "beginner" },
  
  // Beginner Level - With adjectives
  { id: "r-11", sentence: "あおいそら。", romaji: "aoi sora.", translation: "Blue sky.", level: "beginner" },
  { id: "r-12", sentence: "あかいばら。", romaji: "akai bara.", translation: "Red roses.", level: "beginner" },
  { id: "r-13", sentence: "おおきいね。", romaji: "ookii ne.", translation: "It's big, isn't it?", level: "beginner" },
  { id: "r-14", sentence: "ちいさいね。", romaji: "chiisai ne.", translation: "It's small, isn't it?", level: "beginner" },
  { id: "r-15", sentence: "たのしいね。", romaji: "tanoshii ne.", translation: "It's fun, isn't it?", level: "beginner" },
  { id: "r-16", sentence: "おいしいです。", romaji: "oishii desu.", translation: "It is delicious.", level: "beginner" },
  { id: "r-17", sentence: "たかいです。", romaji: "takai desu.", translation: "It is expensive.", level: "beginner" },
  { id: "r-18", sentence: "やすいですよ。", romaji: "yasui desu yo.", translation: "It is cheap!", level: "beginner" },
  
  // Beginner Level - With verbs
  { id: "r-19", sentence: "たべます。", romaji: "tabemasu.", translation: "I eat / will eat.", level: "beginner" },
  { id: "r-20", sentence: "のみます。", romaji: "nomimasu.", translation: "I drink / will drink.", level: "beginner" },
  { id: "r-21", sentence: "みます。", romaji: "mimasu.", translation: "I see / will see.", level: "beginner" },
  { id: "r-22", sentence: "ききます。", romaji: "kikimasu.", translation: "I listen / will listen.", level: "beginner" },
  { id: "r-23", sentence: "いきます。", romaji: "ikimasu.", translation: "I go / will go.", level: "beginner" },
  { id: "r-24", sentence: "かえります。", romaji: "kaerimasu.", translation: "I return / will return.", level: "beginner" },
  { id: "r-25", sentence: "なりました。", romaji: "narimashita.", translation: "It became.", level: "beginner" },
  
  // Beginner Level - Numbers and counting
  { id: "r-26", sentence: "ひとつ。", romaji: "hitotsu.", translation: "One (thing).", level: "beginner" },
  { id: "r-27", sentence: "ふたつ。", romaji: "futatsu.", translation: "Two (things).", level: "beginner" },
  { id: "r-28", sentence: "みっつ。", romaji: "mittsu.", translation: "Three (things).", level: "beginner" },
  { id: "r-29", sentence: "よっつ。", romaji: "yottsu.", translation: "Four (things).", level: "beginner" },
  { id: "r-30", sentence: "いつつ。", romaji: "itsutsu.", translation: "Five (things).", level: "beginner" },
  { id: "r-31", sentence: "むっつ。", romaji: "muttsu.", translation: "Six (things).", level: "beginner" },
  { id: "r-32", sentence: "ななつ。", romaji: "nanatsu.", translation: "Seven (things).", level: "beginner" },
  { id: "r-33", sentence: "やっつ。", romaji: "yattsu.", translation: "Eight (things).", level: "beginner" },
  { id: "r-34", sentence: "ここのつ。", romaji: "kokonotsu.", translation: "Nine (things).", level: "beginner" },
  { id: "r-35", sentence: "とお。", romaji: "tou.", translation: "Ten (things).", level: "beginner" },
  
  // Beginner Level - Daily expressions
  { id: "r-36", sentence: "おはようございます。", romaji: "ohayou gozaimasu.", translation: "Good morning.", level: "beginner" },
  { id: "r-37", sentence: "こんにちは。", romaji: "konnichiwa.", translation: "Hello. ( daytime)", level: "beginner" },
  { id: "r-38", sentence: "こんばんは。", romaji: "konbanwa.", translation: "Good evening.", level: "beginner" },
  { id: "r-39", sentence: "おやすみなさい。", romaji: "oyasuminasai.", translation: "Good night.", level: "beginner" },
  { id: "r-40", sentence: "ありがとうございます。", romaji: "arigatou gozaimasu.", translation: "Thank you very much.", level: "beginner" },
  { id: "r-41", sentence: "すみません。", romaji: "sumimasen.", translation: "Excuse me. / I'm sorry.", level: "beginner" },
  { id: "r-42", sentence: "わかります。", romaji: "wakarimasu.", translation: "I understand.", level: "beginner" },
  { id: "r-43", sentence: "おねがいします。", romaji: "onegai shimasu.", translation: "Please. (request)", level: "beginner" },
  
  // Beginner Level - Simple conversations
  { id: "r-44", sentence: "なまえは？", romaji: "namae wa?", translation: "What is your name?", level: "beginner" },
  { id: "r-45", sentence: "どこにいきますか？", romaji: "doko ni ikimasu ka?", translation: "Where are you going?", level: "beginner" },
  { id: "r-46", sentence: "なにをたべましたか？", romaji: "nani wo tabemashita ka?", translation: "What did you eat?", level: "beginner" },
  { id: "r-47", sentence: "なんじですか？", romaji: "nanji desu ka?", translation: "What time is it?", level: "beginner" },
  { id: "r-48", sentence: "いくらですか？", romaji: "ikura desu ka?", translation: "How much is it?", level: "beginner" },
  { id: "r-49", sentence: "どこですか？", romaji: "doko desu ka?", translation: "Where is it?", level: "beginner" },
  { id: "r-50", sentence: "でんわがありません。", romaji: "denwa ga arimasen.", translation: "I don't have a phone.", level: "beginner" },
  
  // Intermediate Level - Longer sentences
  { id: "r-51", sentence: "きょうは あついですね。", romaji: "kyou wa atsui desu ne.", translation: "It's hot today, isn't it?", level: "intermediate" },
  { id: "r-52", sentence: "がっこうに いきます。", romaji: "gakkou ni ikimasu.", translation: "I'm going to school.", level: "intermediate" },
  { id: "r-53", sentence: "コーヒーをのみます。", romaji: "koohii wo nomimasu.", translation: "I'll drink coffee.", level: "intermediate" },
  { id: "r-54", sentence: "ともだちとあいました。", romaji: "tomodachi to aimashita.", translation: "I met with a friend.", level: "intermediate" },
  { id: "r-55", sentence: "ともだちとあいました。", romaji: "tomodachi to aimashita.", translation: "I met with a friend.", level: "intermediate" },
  { id: "r-56", sentence: "テレビをみます。", romaji: "terebi wo mimasu.", translation: "I'll watch TV.", level: "intermediate" },
  { id: "r-57", sentence: "がっこうは大きい。", romaji: "gakkou wa ookii.", translation: "The school is big.", level: "intermediate" },
  { id: "r-58", sentence: "ほんをたべました。", romaji: "hon wo tabemashita.", translation: "I read a book.", level: "intermediate" },
  { id: "r-59", sentence: "コーヒーをください。", romaji: "koohii wo kudasai.", translation: "Coffee, please.", level: "intermediate" },
  { id: "r-60", sentence: "らいしゅういきます。", romaji: "raishuu ikimasu.", translation: "I'll go next week.", level: "intermediate" },
];

export default readingExercises;

// Get exercises by level
export function getExercisesByLevel(level: "beginner" | "intermediate"): ReadingExercise[] {
  return readingExercises.filter((e) => e.level === level);
}

// Get random exercises
export function getRandomExercises(count: number = 10): ReadingExercise[] {
  return [...readingExercises].sort(() => Math.random() - 0.5).slice(0, count);
}
