import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  Send, Sparkles, Trash2, Settings, BookOpen,
  GraduationCap, Target, Copy, CheckCheck,
  ChevronRight, ThumbsUp, MessageSquare, Plus, X,
  Pin, Search, Clock, PanelLeftClose,
  PanelLeftOpen, Languages, Keyboard, CheckCircle2, XCircle,
  Bookmark, BookmarkCheck, MoreHorizontal, Edit3, Trash,
  Loader2, MessageCircle, BookText, Layers, AlertTriangle,
  ChevronDown, Volume2
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type MessageRole = "user" | "ai";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  liked?: boolean;
  bookmarked?: boolean;
  quizData?: QuizData;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  isManuallyRenamed: boolean;
}

interface QuizData {
  type: "grammar" | "vocab" | "kanji";
  level: string;
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userAnswer?: number;
  answered?: boolean;
}

interface AISenseiSettings {
  language: "vietnamese" | "english" | "japanese" | "auto";
  jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1";
  responseStyle: "short" | "detailed" | "examples" | "quiz";
  furigana: boolean;
  romaji: boolean;
  voice: boolean;
  voiceSpeed: "slow" | "normal" | "fast";
  memoryWeakPoints: boolean;
  memoryRecentLessons: boolean;
  memoryPreferredLang: boolean;
  safetyWarning: boolean;
  aiSuggestions: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS: AISenseiSettings = {
  language: "vietnamese",
  jlptLevel: "N3",
  responseStyle: "detailed",
  furigana: true,
  romaji: true,
  voice: false,
  voiceSpeed: "normal",
  memoryWeakPoints: true,
  memoryRecentLessons: true,
  memoryPreferredLang: true,
  safetyWarning: true,
  aiSuggestions: true,
};

// ═══════════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY_SESSIONS = "midori_ai_sessions";
const STORAGE_KEY_SETTINGS = "midori_ai_settings";
const STORAGE_KEY_USER = "midori_ai_user";

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    return raw ? JSON.parse(raw) as ChatSession[] : [];
  } catch { return []; }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
}

function loadSettings(): AISenseiSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

function saveSettings(settings: AISenseiSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

// ═══════════════════════════════════════════════════════════════════
// AI RESPONSE ENGINE
// ═══════════════════════════════════════════════════════════════════

const GRAMMAR_DB: Record<string, { level: string; meaning: string; formation: string; examples: { ja: string; en: string; romaji: string }[]; related: string[]; notes: string }> = {
  "ながらも": { level: "N3", meaning: "Even though ~ / Despite ~", formation: "Verb (masu-stem) + ながらも", examples: [{ ja: "忙しながらも、合格した。", en: "Even though I was busy, I passed.", romaji: "Isogashikunagaramo, goukaku shita." }, { ja: "学生でありながら、先生のように教えている。", en: "Although he's a student, he teaches like a teacher.", romaji: "Gakusei denagaranagara, sensei no you ni oshie teiru." }], related: ["〜のに", "〜リエイト", "〜ものの"], notes: "More formal than のに. Emphasizes contrast between two facts." },
  "〜 الرغم": { level: "N3", meaning: "Despite ~ / In spite of ~", formation: "Noun + ardless / Verb/I-adjective 普通形 + ardless", examples: [{ ja: "雨にも関わらず、試合は行われた。", en: "Despite the rain, the match was held.", romaji: "Ame no monokakawarazu, shiai wa okonawareta." }], related: ["〜ながらも", "〜のに"], notes: "Formal. Can be shortened to 무리에도." },
  "〜そばから": { level: "N3", meaning: "As soon as ~", formation: "Verb (dictionary form) + そばから", examples: [{ ja: "覚えるそばから忘れてしまう。", en: "I forget as soon as I memorize.", romaji: "Oboeru sobakara, wasurete shimau." }], related: ["〜うちに", "〜か〜ないかのうちに"], notes: "Implies rapid repetition of two conflicting actions." },
  "〜だらけ": { level: "N2", meaning: "Full of ~ / Covered in ~", formation: "Noun + だらけ", examples: [{ ja: "エラーだらけのコードだ。", en: "The code is full of errors.", romaji: "Eraa-darake no koodo da." }], related: ["〜ずくめ", "〜まみれ"], notes: "Almost always used with negative/undesirable things." },
  "〜つつも": { level: "N2", meaning: "While ~ / Although ~", formation: "Verb ます-stem + つつも", examples: [{ ja: "考えつつも、結論が出ない。", en: "While thinking, I can't reach a conclusion.", romaji: "Kangae tsutsunimo, ketsuron ga denai." }], related: ["〜ながらも", "〜のに"], notes: "Written/formal equivalent of ながら." },
};

const VOCAB_DB: Record<string, { level: string; reading: string; meaning: string; partOfSpeech: string; example: { ja: string; en: string } }> = {
  "結構": { level: "N3", reading: "けっこう", meaning: "quite, fairly, pretty good", partOfSpeech: "adverb/adjective", example: { ja: "結構難しい問題だ。", en: "It's quite a difficult problem." } },
  "是非": { level: "N3", reading: "ぜひ", meaning: "by all means, definitely", partOfSpeech: "adverb", example: { ja: "是非食べたい。", en: "I definitely want to eat it." } },
  "曖昧": { level: "N2", reading: "あいまい", meaning: "vague, ambiguous", partOfSpeech: "na-adjective", example: { ja: "彼の返事は曖昧だった。", en: "His answer was vague." } },
  "傾向": { level: "N2", reading: "けいこう", meaning: "tendency, trend", partOfSpeech: "noun", example: { ja: "増加傾向がある。", en: "There is an increasing tendency." } },
  "深刻": { level: "N2", reading: "しんこく", meaning: "serious, grave", partOfSpeech: "na-adjective", example: { ja: "問題は深刻だ。", en: "The problem is serious." } },
};

const KANJI_DB: Record<string, { level: string; onyomi: string[]; kunyomi: string[]; meaning: string; words: { kanji: string; reading: string; meaning: string }[] }> = {
  "館": { level: "N4", onyomi: ["カン"], kunyomi: ["たか"], meaning: "building, hall", words: [{ kanji: "図書館", reading: "としょかん", meaning: "library" }, { kanji: "映画館", reading: "えいがかん", meaning: "movie theater" }] },
  "挙": { level: "N1", onyomi: ["キョ"], kunyomi: ["あ"], meaning: "raise, hold", words: [{ kanji: "挙動", reading: "きょどう", meaning: "behavior" }] },
  "冊": { level: "N4", onyomi: ["サツ", "サク"], kunyomi: [], meaning: "counter for books", words: [{ kanji: "一冊", reading: "いっさっ", meaning: "one book" }] },
};

const STUDENT_CONTEXT = {
  level: "N3",
  // Demo name placeholder. This component is a local rule-based engine
  // (no LLM backend yet) and never connects to a real user identity here.
  // The chat UI uses auth context for display when available, otherwise
  // "Student" is used.
  name: "Student",
};

function autoTitle(userMessage: string): string {
  const m = userMessage.toLowerCase().trim();

  // Grammar patterns
  const grammarMatch = m.match(/explain\s+(〜?[\u3040-\u309F\u30A0-\u30FF\w]+)|〜?([\u3040-\u309F\u30A0-\u30FF\w]+)\s+(grammar|explain)/i);
  if (grammarMatch) {
    const pattern = grammarMatch[1] || grammarMatch[2] || "";
    if (pattern) return `${pattern.replace(/^〜/, "")} Grammar`;
  }

  // Quiz
  if (m.includes("quiz") || m.includes("test")) {
    const levelMatch = m.match(/n([1-5])/i);
    const topic = m.includes("vocab") || m.includes("vocabulary") ? "Vocabulary"
      : m.includes("kanji") ? "Kanji" : "Grammar";
    const level = levelMatch ? `N${levelMatch[1]}` : STUDENT_CONTEXT.level;
    return `${level} ${topic} Quiz`;
  }

  // Roleplay
  if (m.includes("roleplay") || m.includes("practice")) {
    const scenarios = [
      ["restaurant", "Restaurant Ordering"],
      ["travel", "Train Station"],
      ["interview", "Job Interview"],
      ["anime", "Anime Talk"],
      ["classroom", "Classroom Japanese"],
      ["self-intro", "Self Introduction"],
      ["phone", "Phone Call"],
      ["shopping", "Shopping"],
    ];
    for (const [key, label] of scenarios) {
      if (m.includes(key)) return `${label} Practice`;
    }
    return "Roleplay Conversation";
  }

  // Kanji
  if (m.includes("kanji") || m.includes("漢字")) {
    return "Kanji Study";
  }

  // Vocabulary
  if (m.includes("vocab") || m.includes("word") || m.includes("語彙")) {
    return "Vocabulary";
  }

  // Pronunciation
  if (m.includes("pronoun") || m.includes("voice") || m.includes("speak") || m.includes("pronunciation")) {
    return "Pronunciation Practice";
  }

  // Compare
  if (m.includes("compare") || m.includes("difference") || m.includes("vs")) {
    return "Grammar Comparison";
  }

  // JLPT
  if (m.match(/jlpt\s*n([1-5])/i)) {
    const lvl = m.match(/jlpt\s*n([1-5])/i)?.[1] || "3";
    return `JLPT N${lvl} Prep`;
  }

  // Default: truncate first message
  const words = userMessage.trim().split(/\s+/).slice(0, 4).join(" ");
  return words.length > 35 ? words.slice(0, 35) + "..." : words;
}

function generateAIResponse(prompt: string, settings: AISenseiSettings): string {
  const p = prompt.toLowerCase().trim();

  // Slash commands
  if (p.startsWith("/quiz")) return generateQuizResponse(p, settings.jlptLevel);
  if (p.startsWith("/grammar")) return generateGrammarResponse(p.replace("/grammar", "").trim());
  if (p.startsWith("/translate")) return generateTranslateResponse(p.replace("/translate", "").trim());
  if (p.startsWith("/kanji")) return generateKanjiResponse(p.replace("/kanji", "").trim());
  if (p.startsWith("/roleplay")) return generateRoleplayIntro();
  if (p.startsWith("/summary")) return generateSummaryResponse();
  if (p.startsWith("/flashcard")) return generateFlashcardResponse();

  // Grammar DB lookup
  for (const [pattern, data] of Object.entries(GRAMMAR_DB)) {
    if (p.includes(pattern.replace("〜", "")) || p.includes(pattern)) {
      return formatGrammarExplanation(pattern, data, settings);
    }
  }

  // Intent detection
  if (p.includes("quiz") || p.includes("practice") || p.includes("test")) return generateQuizResponse(p, settings.jlptLevel);
  if (p.includes("kanji") || p.includes("漢字")) return generateKanjiResponse(p);
  if (p.includes("vocabulary") || p.includes("word") || p.includes("語彙")) return generateVocabListResponse(settings.jlptLevel);
  if (p.includes("jlpt") || p.match(/n([1-5])/i)) return generateJLPTResponse(p, settings.jlptLevel);
  if (p.includes("pronoun") || p.includes("voice") || p.includes("speak")) return generatePronunciationResponse();
  if (p.includes("compare") || p.includes("difference") || p.includes("vs")) return generateComparisonResponse();

  return generateDefaultResponse(settings);
}

function formatGrammarExplanation(pattern: string, data: typeof GRAMMAR_DB[string], settings: AISenseiSettings): string {
  const exs = data.examples.map(e => {
    let line = `**${e.ja}**\n_${e.en}_`;
    if (settings.romaji) line += `\n_${e.romaji}_`;
    return line;
  }).join("\n\n");

  return `## ${pattern}

**Level:** JLPT ${data.level} | **Meaning:** ${data.meaning}

**Formation:** ${data.formation}

### Examples

${exs}

### Key Points

${data.notes}

### Related Patterns

${data.related.map(r => `• \`${r}\``).join("  ")}

> Practice: Try making your own sentence with ${pattern}!`;
}

function generateQuizResponse(prompt: string, level: string): string {
  const lvl = prompt.match(/n([1-5])/i)?.[1] || level.replace("N", "");
  const questions = [
    { q: `Which is the correct meaning of **ながらも**?`, opts: ["While doing ~", "Even though ~", "Because of ~", "In order to ~"], a: 1, e: "しながらも expresses contrast — 'even though' or 'despite'." },
    { q: `Fill in the blank: 忙しく___、合格した。`, opts: ["ても", "ながらも", "ので", "から"], a: 1, e: "Verb masu-stem + しながらも = 'even though busy'." },
    { q: `What JLPT level is **〜だらけ**?`, opts: ["N5", "N4", "N3", "N2"], a: 3, e: "〜だらけ (full of ~) is an N2 grammar pattern." },
    { q: `Which sentence correctly uses **〜そばから**?`, opts: ["食べるそばから、走った。", "覚えるそばから、忘れる。", "行くそばから、戻った。", "見るそばから、書いた。"], a: 1, e: "〜そばから = 'as soon as ~'. Eat → forget as soon as you memorize!" },
    { q: `Complete: 狭い___、很漂亮だ。`, opts: ["なのに", "무리에도", "ので", "ために"], a: 1, e: "무리에도 = 'despite' — even though small, it's beautiful!" },
  ];

  const quizText = questions.map((q, i) =>
    `**Q${i + 1}:** ${q.q}\n${q.opts.map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join("\n")}`
  ).join("\n\n---\n\n");

  return `## Quiz — JLPT N${lvl}

Level: JLPT N${lvl} | 5 questions

---

${quizText}

**Reply with your answers** (e.g., "1-B, 2-B, 3-D, 4-B, 5-B") and I'll grade them!`;
}

function generateGrammarResponse(text: string): string {
  if (!text) return `## Grammar Explainer\n\nTell me which grammar pattern you'd like to learn!\n\n**Examples:** ながらも, 무리에도, そばから, だらけ\n\nJust type a pattern name and I'll explain it with examples!`;
  for (const [pattern, data] of Object.entries(GRAMMAR_DB)) {
    if (pattern.includes(text) || text.includes(pattern.replace("〜", ""))) {
      return formatGrammarExplanation(pattern, data, DEFAULT_SETTINGS);
    }
  }
  return `## Grammar: ${text}\n\nI don't have detailed data for "${text}" yet. Try common N3 patterns:\n\n• ながらも\n• 무리에도\n• そばから\n• だらけ`;
}

function generateTranslateResponse(text: string): string {
  if (!text) return `## Translation Tool\n\nUsage: \`/translate [Japanese or English text]\`\n\nI'll translate between Japanese, English, and Vietnamese!`;
  return `## Translation\n\n**Japanese:** ${text}\n\n**English:** [Translation with real AI]\n\n**Vietnamese:** [Dich sang tieng Viet]\n\n**Romaji:** [Romaji reading here]`;
}

function generateKanjiResponse(prompt: string): string {
  const char = prompt.replace(/[\/\-\s]*(kanji|漢字)/gi, "").trim();
  if (!char) {
    return `## Kanji Study\n\nUsage: \`/kanji [character]\`\n\nTry: 館, 挙, 冊`;
  }
  for (const [kanji, data] of Object.entries(KANJI_DB)) {
    if (kanji === char) {
      const words = data.words.map(w => `• **${w.kanji}** (${w.reading}) — ${w.meaning}`).join("\n");
      return `## ${kanji} — ${data.meaning}\n\n**JLPT Level:** ${data.level}\n**On'yomi:** ${data.onyomi.join(", ") || "—"}\n**Kun'yomi:** ${data.kunyomi.join(", ") || "—"}\n\n### Words\n\n${words}`;
    }
  }
  return `## Kanji: ${char}\n\nI don't have data for this kanji yet. Try: 館, 挙, 冊`;
}

function generateRoleplayIntro(): string {
  return `## Roleplay Mode

Choose a scenario to practice real Japanese conversations!

• **Restaurant** — Ordering food
• **Travel** — Train station directions
• **Job Interview** — Professional Japanese
• **Anime Talk** — Chat about anime
• **Classroom** — Teacher-student Japanese

**To start:** \`/roleplay restaurant\`

I'll play the native speaker and you practice!`;
}

function generateSummaryResponse(): string {
  return `## Chat Summary

**Study Level:** ${STUDENT_CONTEXT.level}

### AI Recommendations

• Review **〜そばから** grammar
• Practice **N3 vocabulary** daily
• Try **roleplay** to apply grammar in context`;
}

function generateFlashcardResponse(): string {
  return `## Flashcard Generation

Based on our conversation, here are study cards:

**Card 1:** ${Object.keys(GRAMMAR_DB)[0]} — "Even though ~" / "Despite ~"

**Card 2:** ${Object.keys(GRAMMAR_DB)[0]} example sentence

Want me to add these to your flashcard deck?`;
}

function generatePronunciationResponse(): string {
  return `## Pronunciation Trainer

**Level:** ${STUDENT_CONTEXT.level}

### Practice Sentences

**Beginner:**
• おはようございます (Good morning)
• ありがとうございます (Thank you)

**Intermediate:**
• 今日はいい天気ですね (It's nice weather today)

### How to practice:
1. Click the mic button
2. Speak the Japanese sentence
3. Get instant feedback

> Focus on pitch accent — the same syllable can have different tones that change meaning!`;
}

function generateComparisonResponse(): string {
  return `## Grammar Comparison

### ながらも vs のに

| | ながらも | のに |
|---|---|---|
| **Level** | N3 | N3 |
| **Formality** | Formal | Casual |
| **Usage** | Written/spoken | Spoken |
| **Nuance** | Strong contrast | Mild surprise |

**Example:**
• 忙しく**しながらも**、成功した。(formal)
• 忙しく**のに**、成功した。(casual)

Which patterns would you like to compare?`;
}

function generateJLPTResponse(p: string, level: string): string {
  const lvl = p.match(/n([1-5])/i)?.[1] || level.replace("N", "");
  return `## JLPT N${lvl} Study Guide

**Your level:** ${STUDENT_CONTEXT.level}

### Top Grammar for N${lvl}:

${Object.entries(GRAMMAR_DB).filter(([, d]) => d.level === `N${lvl}`).map(([g]) => `• \`${g}\``).join("\n") || "• ながらも\n• 무리에도"}

### Study Tips:

• Review weak grammar daily
• Practice with native content
• Take weekly quizzes

Try: \`/quiz\` to test yourself!`;
}

function generateVocabListResponse(level: string): string {
  const lvl = level.replace("N", "");
  const words = Object.entries(VOCAB_DB).filter(([, d]) => d.level === `N${lvl}`).slice(0, 5);
  if (words.length === 0) {
    const allWords = Object.entries(VOCAB_DB).slice(0, 4);
    const list = allWords.map(([w, d]) => `### ${w} (${d.reading})\n**Meaning:** ${d.meaning}\n**Example:** ${d.example.ja}`).join("\n\n---\n\n");
    return `## Vocabulary List — ${STUDENT_CONTEXT.level}\n\n${list || "Loading..."}`;
  }
  const list = words.map(([w, d]) => `### ${w} (${d.reading})\n**Meaning:** ${d.meaning}\n**Example:** ${d.example.ja}`).join("\n\n---\n\n");
  return `## Vocabulary — N${lvl}\n\n${list}`;
}

function generateDefaultResponse(settings: AISenseiSettings): string {
  const lang = settings.language === "vietnamese" ? "Vietnamese" : settings.language === "japanese" ? "Japanese" : "English";
  return `Konnichiwa! I'm your AI Sensei!

I can help you with:

📚 **Grammar** — ${STUDENT_CONTEXT.level} patterns with examples
📖 **Vocabulary** — Kanji, readings, mnemonics
🎯 **JLPT Prep** — Quizzes and study plans
🎭 **Roleplay** — Conversation practice (\`/roleplay\`)
🎙️ **Pronunciation** — Speaking coaching

**Current Settings:** ${settings.jlptLevel} | ${lang} | ${settings.responseStyle} mode

Try: "Explain めながら", "/quiz", or "/roleplay restaurant"`;
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center text-white text-lg flex-shrink-0 shadow-lg shadow-primary/20">
        🌸
      </div>
      <div className="flex-1 max-w-[70%]">
        <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          AI Sensei is preparing suggestions...
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.18, ease: "easeInOut" }}
              className="w-2.5 h-2.5 rounded-full bg-gradient-hero"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// AI Mascot Empty State
function AIMascot() {
  const prompts = [
    "Explain めながら with examples",
    "/quiz N3 grammar",
    "Compare めながら and のに",
    "/roleplay restaurant",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-8 text-center space-y-6">
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-sakura/20 flex items-center justify-center text-4xl shadow-xl shadow-primary/15 border border-primary/20">
          🌸
        </div>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center text-white text-xs shadow-lg"
        >
          ✨
        </motion.div>
      </motion.div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-display font-black gradient-text">AI Sensei</h2>
        <p className="text-sm text-secondary-col leading-relaxed max-w-xs">
          Your personal Japanese tutor. Ask me about grammar, vocabulary, JLPT prep, or start a roleplay!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
        {prompts.map((prompt, i) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="px-3 py-2.5 rounded-xl glass-card text-[11px] font-medium text-secondary-col hover:text-primary hover:border-primary/30 transition-all border border-glass-border text-left"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground/60 italic mt-2">
        No recommendations available.
      </div>
    </div>
  );
}

// Message Bubble
function MessageBubble({
  msg,
  onLike,
  onBookmark,
  onCopy,
  onTranslate,
}: {
  msg: Message;
  onLike: (id: string, liked: boolean) => void;
  onBookmark: (id: string, bookmarked: boolean) => void;
  onCopy: (content: string) => void;
  onTranslate: () => void;
}) {
  const isAI = msg.role === "ai";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (text: string) => {
    return text.split("\n\n").map((para, pi) => {
      if (para.startsWith("## ")) {
        return (
          <div key={pi} className="mt-1 first:mt-0">
            <div className="font-display font-black text-base text-primary-col mb-1.5">
              {para.replace("## ", "")}
            </div>
          </div>
        );
      }
      if (para.startsWith("> ")) {
        return (
          <div key={pi} className="my-2 px-3 py-2 rounded-xl bg-primary/8 border-l-2 border-primary/40 text-xs text-secondary-col italic">
            {para.replace("> ", "")}
          </div>
        );
      }
      if (para.startsWith("**") && para.match(/^\*\*/)) {
        return (
          <div key={pi} className="my-1.5 space-y-0.5">
            {para.split("\n").map((line, li) => (
              <p key={li} className="text-sm leading-relaxed text-secondary-col">{line}</p>
            ))}
          </div>
        );
      }
      if (para.match(/^\d+\./) || para.match(/^[•\-\*]\s/)) {
        const items = para.split("\n").filter(l => l.trim());
        return (
          <ul key={pi} className="list-disc pl-5 my-2 space-y-1">
            {items.map((item, ii) => (
              <li key={ii} className="text-sm text-secondary-col leading-relaxed">
                {item.replace(/^[•\-\*]\s*/, "").replace(/^\d+\.\s*/, "")}
              </li>
            ))}
          </ul>
        );
      }
      if (para.startsWith("---")) {
        return <div key={pi} className="my-2 border-t border-glass-border" />;
      }
      return (
        <p key={pi} className="text-sm leading-relaxed text-secondary-col my-1.5 first:mt-0 last:mb-0">
          {para}
        </p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 ${isAI ? "" : "flex-row-reverse"}`}
    >
      {isAI ? (
        <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center text-white text-lg flex-shrink-0 shadow-lg shadow-primary/20">
          🌸
        </div>
      ) : (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
          {displayUserName[0]}
        </div>
      )}

      <div className={`flex-1 max-w-[78%] ${isAI ? "" : "items-end flex flex-col"}`}>
        <div
          className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed shadow-lg ${
            isAI
              ? "bg-white/70 dark:bg-slate-800/80 text-foreground glass-card border border-glass-border"
              : "bg-gradient-hero text-white"
          }`}
        >
          {renderContent(msg.content)}
        </div>

        <div className={`flex items-center gap-1 mt-1.5 ${isAI ? "" : "flex-row-reverse"}`}>
          {isAI && (
            <>
              <button
                onClick={() => onLike(msg.id, !msg.liked)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all ${
                  msg.liked ? "text-primary bg-primary/10" : "text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground"
                }`}
                title="Like"
              >
                {msg.liked ? <ThumbsUp className="w-3 h-3 fill-current" /> : <ThumbsUp className="w-3 h-3" />}
              </button>
              <button
                onClick={() => onBookmark(msg.id, !msg.bookmarked)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all ${
                  msg.bookmarked ? "text-yellow-500 bg-yellow-50" : "text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground"
                }`}
                title="Bookmark"
              >
                {msg.bookmarked ? <BookmarkCheck className="w-3 h-3 fill-current" /> : <Bookmark className="w-3 h-3" />}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground transition-all"
                title="Copy"
              >
                {copied ? <CheckCheck className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={onTranslate}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground transition-all"
                title="Translate"
              >
                <Languages className="w-3 h-3" />
              </button>
            </>
          )}
          <span className="text-[10px] text-muted-foreground/40 ml-1">
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Session List Item
function SessionItem({
  session,
  isActive,
  onLoad,
  onDelete,
  onRename,
  onPin,
  renameState,
}: {
  session: ChatSession;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onPin: () => void;
  renameState: { id: string | null; value: string };
}) {
  const [showMenu, setShowMenu] = useState(false);

  const isRenaming = renameState.id === session.id;
  const [renameValue, setRenameValue] = useState(session.title);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== session.title) {
      onRename(trimmed);
    }
    setShowMenu(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") { setShowMenu(false); setRenameValue(session.title); }
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "vừa xong";
    if (mins < 60) return `${mins}m trước`;
    if (hours < 24) return `${hours}h trước`;
    if (days === 1) return "Hôm qua";
    return `${days} ngày trước`;
  };

  return (
    <div className="relative">
      <button
        onClick={onLoad}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-all group ${
          isActive
            ? "bg-primary/10 text-primary font-semibold border border-primary/20"
            : "hover:bg-muted text-muted-foreground"
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {session.pinned && <Pin className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleRenameSubmit}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-transparent text-xs font-semibold outline-none border-b border-primary/40"
              />
            ) : (
              <div className="truncate font-medium flex-1">{session.title}</div>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground/50 mt-0.5 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo(session.updatedAt)}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-muted transition"
        >
          <MoreHorizontal className="w-3 h-3" />
        </button>
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-1 top-full mt-1 z-30 w-44 glass-modal rounded-xl shadow-xl border border-glass-border overflow-hidden"
          >
            <button
              onClick={() => {
                setRenameValue(session.title);
                onRename(""); // trigger rename mode
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-muted transition text-muted-foreground"
            >
              <Edit3 className="w-3.5 h-3.5" /> Rename
            </button>
            <button
              onClick={() => { onPin(); setShowMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-muted transition text-muted-foreground"
            >
              <Pin className={`w-3.5 h-3.5 ${session.pinned ? "text-yellow-500 fill-yellow-500" : ""}`} />
              {session.pinned ? "Unpin" : "Pin to top"}
            </button>
            <div className="border-t border-glass-border" />
            <button
              onClick={() => { onDelete(); setShowMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-red-50 transition text-red-400"
            >
              <Trash className="w-3.5 h-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Settings Modal
function SettingsModal({
  settings,
  onSave,
  onClose,
}: {
  settings: AISenseiSettings;
  onSave: (s: AISenseiSettings) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<AISenseiSettings>(settings);
  const [saved, setSaved] = useState(false);

  const toggle = <K extends keyof AISenseiSettings>(key: K, val: AISenseiSettings[K]) => {
    setLocal(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSave(local);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setLocal(DEFAULT_SETTINGS);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-muted-col uppercase tracking-wider">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );

  const ToggleRow = ({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-semibold text-primary-col">{label}</div>
        {sub && <div className="text-xs text-muted-col mt-0.5">{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-primary" : "bg-muted-foreground/20"}`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow"
        />
      </button>
    </div>
  );

  const SelectRow = ({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) => (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm font-semibold text-primary-col">{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-1.5 rounded-xl glass-surface text-xs font-semibold text-primary-col border border-glass-border outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 12 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center text-white text-base shadow">🌸</div>
            <div>
              <h3 className="font-display font-bold text-primary-col text-base">AI Sensei Settings</h3>
              <p className="text-xs text-muted-col">Customize your learning experience</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Language */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-col uppercase tracking-wider">Language</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <div className="text-sm font-semibold text-primary-col">Interface Language</div>
                <select
                  value={local.language}
                  onChange={e => setLocal(prev => ({ ...prev, language: e.target.value as AISenseiSettings["language"] }))}
                  className="px-3 py-1.5 rounded-xl glass-surface text-xs font-semibold text-primary-col border border-glass-border outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="vietnamese">Tiếng Việt</option>
                  <option value="english">English</option>
                  <option value="japanese">日本語</option>
                  <option value="auto">Auto detect</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-glass-border" />

          {/* Level */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-col uppercase tracking-wider">Level</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <div className="text-sm font-semibold text-primary-col">JLPT Level</div>
                <select
                  value={local.jlptLevel}
                  onChange={e => setLocal(prev => ({ ...prev, jlptLevel: e.target.value as AISenseiSettings["jlptLevel"] }))}
                  className="px-3 py-1.5 rounded-xl glass-surface text-xs font-semibold text-primary-col border border-glass-border outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-glass-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-xs font-bold text-secondary-col hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {saved ? (
              <><CheckCheck className="w-4 h-4" /> Saved!</>
            ) : (
              <>Save Settings</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Quiz View
function QuizView({ quiz, onAnswer, onClose }: {
  quiz: QuizData;
  onAnswer: (qId: string, idx: number) => void;
  onClose: () => void;
}) {
  const answeredCount = quiz.questions.filter(q => q.answered).length;
  const correctCount = quiz.questions.filter(q => q.userAnswer === q.correctIndex).length;
  const score = quiz.questions.length > 0 ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
  const done = answeredCount === quiz.questions.length;

  return (
    <div className="space-y-3 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-black text-sm text-primary-col">Grammar Quiz</h3>
          <p className="text-[10px] text-muted-col">{quiz.level} · {quiz.questions.length} questions</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-hero"
          animate={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl p-3 text-center ${score >= 80 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}
        >
          <div className="text-2xl font-black font-display text-primary-col">{score}%</div>
          <div className="text-xs font-semibold text-muted-col">{correctCount}/{quiz.questions.length} correct · {score >= 80 ? "Excellent!" : "Keep practicing!"}</div>
        </motion.div>
      )}

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
        {quiz.questions.map((q, qi) => {
          const answered = !!q.answered;
          const isCorrect = answered && q.userAnswer === q.correctIndex;
          return (
            <div key={q.id} className={`rounded-xl p-3 border text-xs ${
              answered
                ? isCorrect ? "border-green-300 bg-green-50/40" : "border-red-300 bg-red-50/40"
                : "border-glass-border glass-card"
            }`}>
              <div className="flex items-start gap-1.5 mb-2">
                <span className="text-[9px] font-bold text-muted-foreground mt-0.5">Q{qi + 1}</span>
                <p className="text-xs font-semibold text-primary-col flex-1">{q.question}</p>
                {answered && (
                  isCorrect
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
              </div>
              <div className="space-y-1">
                {q.options.map((opt, oi) => {
                  const selected = q.userAnswer === oi;
                  const correct = q.correctIndex === oi;
                  let cls = "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600";
                  if (answered) {
                    if (correct) cls = "bg-green-50 border-green-300 text-green-700 font-semibold";
                    else if (selected) cls = "bg-red-50 border-red-300 text-red-700";
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => !answered && onAnswer(q.id, oi)}
                      disabled={answered}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${cls}`}
                    >
                      <span className="font-bold mr-1">{String.fromCharCode(65 + oi)}.</span> {opt}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-white/60 dark:bg-slate-700/60 border border-glass-border text-[10px] text-muted-col">
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Toast Notification
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold glass-modal shadow-xl border border-glass-border"
        >
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function AISenseiPage() {
  const isLoadingSuggestions = false;
  const suggestionError: string | null = null;
  // Demo mode: this page runs a local rule-based engine. We still read
  // the auth user for display purposes (avatar, greeting) but never call
  // a real LLM backend from here.
  const { user } = useAuth();
  const displayUserName = user?.name?.trim() || user?.email?.split("@")[0] || "Student";

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AISenseiSettings>(DEFAULT_SETTINGS);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [translationMsg, setTranslationMsg] = useState<{ msgId: string; content: string } | null>(null);
  const [renameState, setRenameState] = useState<{ id: string | null; value: string }>({ id: null, value: "" });

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const settingsRef = useRef(settings);
  const shouldAutoScrollRef = useRef(false);

  // Reset window scroll on mount (handles browser scroll restoration after navigation)
  useEffect(() => {
    shouldAutoScrollRef.current = false;
    const timer1 = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
    });
    const timer2 = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
    }, 100);
    return () => {
      cancelAnimationFrame(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Load from storage
  useEffect(() => {
    setSessions(loadSessions());
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
    settingsRef.current = loadedSettings;
  }, []);

  // Welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "ai",
        content: `Konnichiwa! I'm your AI Sensei 🌸

I can help you with:

📚 **Grammar** — ${STUDENT_CONTEXT.level} patterns with examples
📖 **Vocabulary** — Kanji, readings, mnemonics
🎯 **JLPT Prep** — Quizzes and study plans
🎭 **Roleplay** — Conversation practice (\`/roleplay\`)
🎙️ **Pronunciation** — Speaking coaching

What would you like to learn today?`,
        timestamp: new Date(),
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll: only fires when user has sent a message
  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  const saveSessionsToStorage = useCallback((updated: ChatSession[]) => {
    setSessions(updated);
    saveSessions(updated);
  }, []);

  const handleSend = useCallback((text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed) return;

    shouldAutoScrollRef.current = true;

    const userMsg: Message = {
      id: genId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(m => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    // Auto-naming: rename "New Chat" after first user message
    if (activeSessionId) {
      setSessions(prev => {
        const session = prev.find(s => s.id === activeSessionId);
        if (session && session.title === "New Chat" && !session.isManuallyRenamed) {
          const newTitle = autoTitle(trimmed);
          const updated = prev.map(s =>
            s.id === activeSessionId
              ? { ...s, title: newTitle, messages: [...s.messages, userMsg], updatedAt: Date.now() }
              : s
          );
          saveSessions(updated);
          return updated;
        }
        const updated = prev.map(s =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, userMsg], updatedAt: Date.now() }
            : s
        );
        saveSessions(updated);
        return updated;
      });
    }

    setTimeout(() => {
      const response = generateAIResponse(trimmed, settingsRef.current);

      // Parse quiz from response
      let parsedQuiz: QuizData | null = null;
      if (response.includes("**Q1:**")) {
        const questions: QuizQuestion[] = [];
        const blocks = response.split("**Q");
        for (let i = 1; i < blocks.length; i++) {
          const lines = ("**Q" + blocks[i]).split("\n");
          const qLine = lines[0]?.replace(/\*\*/g, "").replace(/^\d+:/, "").trim();
          const options: string[] = [];
          for (const line of lines) {
            const m = line.match(/^([A-D])\.\s*(.+)/);
            if (m) options.push(m[2].trim());
          }
          if (qLine && options.length >= 2) {
            questions.push({
              id: genId(),
              question: qLine,
              options,
              correctIndex: 1,
              explanation: "Review the grammar pattern for the correct answer.",
            });
          }
        }
        if (questions.length > 0) {
          parsedQuiz = { type: "grammar", level: `JLPT ${settingsRef.current.jlptLevel}`, questions };
        }
      }

      const aiMsg: Message = {
        id: genId(),
        role: "ai",
        content: response,
        timestamp: new Date(),
        quizData: parsedQuiz ?? undefined,
      };

      setMessages(m => [...m, aiMsg]);
      setIsTyping(false);
      if (parsedQuiz) setQuizData(parsedQuiz);

      // Save to session
      if (activeSessionId) {
        setSessions(prev => {
          const updated = prev.map(s =>
            s.id === activeSessionId
              ? { ...s, messages: [...(s.messages.length === 1 && s.messages[0].id === "welcome" ? [] : s.messages), userMsg, aiMsg], updatedAt: Date.now() }
              : s
          );
          saveSessions(updated);
          return updated;
        });
      }
    }, 600 + Math.random() * 800);
  }, [input, activeSessionId]);

  const handleNewChat = () => {
    const session: ChatSession = {
      id: genId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      isManuallyRenamed: false,
    };
    const updated = [session, ...sessions];
    saveSessionsToStorage(updated);
    setActiveSessionId(session.id);
    setMessages([{
      id: "welcome",
      role: "ai",
      content: `Konnichiwa! I'm your AI Sensei 🌸

Ready to help you with **grammar**, **vocabulary**, **JLPT prep**, **roleplay**, and more!

Try: "Explain めながら", \`/quiz\`, or \`/roleplay\`.`,
      timestamp: new Date(),
    }]);
    setQuizData(null);
    setRenameState({ id: null, value: "" });
  };

  const handleLoadSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages.length > 0 ? session.messages : [{
      id: "welcome",
      role: "ai",
      content: "Welcome back! Let's continue your learning journey.",
      timestamp: new Date(),
    }]);
    setQuizData(null);
    setRenameState({ id: null, value: "" });
  };

  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter(s => s.id !== id);
    saveSessionsToStorage(remaining);
    if (activeSessionId === id) {
      if (remaining.length > 0) {
        handleLoadSession(remaining[0]);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameSession = (newTitle: string) => {
    if (!activeSessionId) return;
    const updated = sessions.map(s =>
      s.id === activeSessionId ? { ...s, title: newTitle, isManuallyRenamed: true, updatedAt: Date.now() } : s
    );
    saveSessionsToStorage(updated);
    setRenameState({ id: null, value: "" });
    showToast("Chat renamed!");
  };

  const handlePinSession = () => {
    if (!activeSessionId) return;
    const updated = sessions.map(s =>
      s.id === activeSessionId ? { ...s, pinned: !s.pinned, updatedAt: Date.now() } : s
    );
    // Sort: pinned first
    updated.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
    saveSessionsToStorage(updated);
  };

  const handleLike = (id: string, liked: boolean) => {
    setMessages(m => m.map(msg => msg.id === id ? { ...msg, liked } : msg));
  };

  const handleBookmark = (id: string, bookmarked: boolean) => {
    setMessages(m => m.map(msg => msg.id === id ? { ...msg, bookmarked } : msg));
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleQuizAnswer = (qId: string, idx: number) => {
    if (!quizData) return;
    setQuizData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map(q =>
          q.id === qId ? { ...q, userAnswer: idx, answered: true } : q
        ),
      };
    });
  };

  const handleSaveSettings = (newSettings: AISenseiSettings) => {
    setSettings(newSettings);
    settingsRef.current = newSettings;
    saveSettings(newSettings);
    showToast("AI Sensei settings saved!");
  };

  // Sort sessions: pinned first, then by updatedAt
  const sortedSessions = useCallback(() => {
    return [...sessions].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [sessions]);

  const filteredSessions = sortedSessions().filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedPrompts = settings.aiSuggestions ? [
    "Explain めながら with examples",
    "/quiz N3 grammar",
    "Compare めながら and のに",
    "/roleplay restaurant",
  ] : [];

  return (
    <>
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            settings={settings}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      <Toast message={toastMsg} visible={toastVisible} />

      <div className="h-[calc(100vh-7rem)] flex gap-0 rounded-2xl overflow-hidden">

        {/* ── Chat History Sidebar ── */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 268, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden flex-shrink-0"
            >
              <div className="w-[268px] h-full flex flex-col glass-card border-r border-glass-border rounded-l-2xl">

                {/* Header */}
                <div className="p-4 border-b border-glass-border space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 flex-shrink-0">
                      🌸
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="text-sm font-display font-bold text-primary-col truncate">AI Sensei</div>
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-sm">
                          Demo
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-col flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Local demo · {settings.jlptLevel}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-hero text-white text-xs font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Chat
                  </button>
                </div>

                {/* Search */}
                <div className="px-3 py-2 border-b border-glass-border">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
                    <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {filteredSessions.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={activeSessionId === session.id}
                      onLoad={() => handleLoadSession(session)}
                      onDelete={() => handleDeleteSession(session.id)}
                      onRename={(newTitle) => {
                        if (!newTitle) {
                          // Trigger rename mode
                          setRenameState({ id: session.id, value: session.title });
                        } else {
                          const updated = sessions.map(s =>
                            s.id === session.id
                              ? { ...s, title: newTitle, isManuallyRenamed: true, updatedAt: Date.now() }
                              : s
                          );
                          saveSessionsToStorage(updated);
                          showToast("Chat renamed!");
                        }
                      }}
                      onPin={() => {
                        const updated = sessions.map(s =>
                          s.id === session.id ? { ...s, pinned: !s.pinned, updatedAt: Date.now() } : s
                        );
                        updated.sort((a, b) => {
                          if (a.pinned && !b.pinned) return -1;
                          if (!a.pinned && b.pinned) return 1;
                          return b.updatedAt - a.updatedAt;
                        });
                        saveSessionsToStorage(updated);
                        showToast(updated.find(s => s.id === session.id)?.pinned ? "Chat pinned!" : "Chat unpinned!");
                      }}
                      renameState={renameState}
                    />
                  ))}

                  {filteredSessions.length === 0 && (
                    <div className="text-center py-10 px-4">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/25" />
                      <p className="text-xs text-muted-foreground">
                        {searchQuery ? "No chats found" : "No chats yet"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-glass-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {displayUserName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{displayUserName}</div>
                    </div>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="p-1.5 rounded-xl hover:bg-muted transition"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Chat Area ── */}
        <div className="flex-1 flex flex-col min-w-0 rounded-r-2xl overflow-hidden">

          {/* Top Bar */}
          <div className="px-4 py-3 border-b border-glass-border glass-card flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(v => !v)}
              className="p-2 rounded-xl hover:bg-muted transition"
            >
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-display font-bold text-primary-col">AI Sensei</div>
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-sm">
                  Demo
                </span>
              </div>
              <div className="text-[10px] text-muted-col flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Local demo · {settings.jlptLevel} · {settings.language === "vietnamese" ? "Tiếng Việt" : settings.language === "japanese" ? "日本語" : "English"}
              </div>
            </div>
            <button onClick={handleNewChat} className="p-2 rounded-xl hover:bg-muted transition" title="New chat">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {messages.length === 0 && <AIMascot />}

              {messages.map(msg => (
                <div key={msg.id}>
                  <MessageBubble
                    msg={msg}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onCopy={handleCopy}
                    onTranslate={() => setTranslationMsg(
                      translationMsg?.msgId === msg.id ? null : { msgId: msg.id, content: msg.content }
                    )}
                  />
                  {translationMsg?.msgId === msg.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 ml-12 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700"
                    >
                      🌐 English: {msg.content.substring(0, 300)}
                    </motion.div>
                  )}
                </div>
              ))}

              {isTyping && <TypingIndicator />}

              {quizData && messages.length > 0 && (
                <div className="glass-card rounded-2xl p-4">
                  <QuizView quiz={quizData} onAnswer={handleQuizAnswer} onClose={() => setQuizData(null)} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested Prompts */}
            {isLoadingSuggestions ? (
              <div className="px-4 pb-4 text-center">
                <p className="text-[11px] text-muted-foreground animate-pulse">AI Sensei is preparing suggestions...</p>
              </div>
            ) : suggestionError ? (
              <div className="px-4 pb-4 text-center">
                <p className="text-[11px] text-red-500 font-medium">Unable to generate suggestions.</p>
              </div>
            ) : messages.length <= 2 && !input && !isTyping && suggestedPrompts.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-col font-bold">Quick prompts</div>
                  <div className="flex-1 h-px bg-glass-border" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedPrompts.map((prompt, i) => (
                    <motion.button
                      key={prompt}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSend(prompt)}
                      className="px-3 py-1.5 rounded-full glass-surface text-[11px] font-medium text-secondary-col hover:text-primary hover:border-primary/30 transition-all border border-glass-border"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-glass-border glass-card">
            <div className="relative flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Ask AI Sensei... try "/quiz" or "/grammar"`}
                  rows={1}
                  className="w-full resize-none rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-glass-border px-4 py-3 pr-20 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/50 transition-all"
                />

                {/* Send Button */}
                <div className="absolute right-2 bottom-2">
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="p-2 rounded-xl bg-gradient-hero text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground/40 text-center mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Sensei · JLPT {settings.jlptLevel} · / for slash commands
              {settings.safetyWarning && (
                <span className="ml-2 text-muted-foreground/30">· AI may make mistakes</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
