import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload, Plus, Search, Mic, Play, Pause, Edit3, Trash2, Eye,
  Clock, CheckCircle, X, Bot, GripVertical,
  PlusCircle, Save, FileText, Tag, Layers, ChevronDown, XCircle
} from "lucide-react";

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type ExerciseStatus = "draft" | "published" | "pending";

interface Sentence {
  id: number;
  number: number;
  japanese: string;
  romaji: string;
  meaning: string;
  timestamp: string;
}

interface ShadowingExercise {
  id: number;
  title: string;
  level: JLPTLevel;
  topic: string;
  status: ExerciseStatus;
  audio: boolean;
  sentences: Sentence[];
  duration: string;
  completions: number;
  accuracy: number;
  aiAnalysis: boolean;
  date: string;
}

const DROPDOWN_TOPICS = [
  { label: "Daily Life", color: "text-blue-500" },
  { label: "Business", color: "text-indigo-500" },
  { label: "Restaurant", color: "text-orange-500" },
  { label: "Interview", color: "text-purple-500" },
  { label: "Travel", color: "text-teal-500" },
  { label: "School", color: "text-green-500" },
  { label: "Shopping", color: "text-pink-500" },
  { label: "Health", color: "text-red-500" },
  { label: "Phone Call", color: "text-slate-500" },
  { label: "Custom", color: "text-amber-500" },
];

const initialExercises: ShadowingExercise[] = [
  {
    id: 1, title: "Japanese Greeting — Morning", level: "N5", topic: "Daily Life",
    status: "published", audio: true, aiAnalysis: true,
    sentences: [
      { id: 1, number: 1, japanese: "おはようございます、田中さん。", romaji: "Ohayōgozaimasu, Tanaka-san.", meaning: "Good morning, Tanaka-san.", timestamp: "0:00" },
      { id: 2, number: 2, japanese: "おはよう！今日はどうですか？", romaji: "Ohayō! Kyō wa dō desu ka?", meaning: "Good morning! How are you today?", timestamp: "0:12" },
      { id: 3, number: 3, japanese: "今日はとてもいい天気ですね。", romaji: "Kyō wa totemo ii tenki desu ne.", meaning: "It's a very nice weather today.", timestamp: "0:22" },
      { id: 4, number: 4, japanese: "ええ、でも午後は雨が降るそうです。", romaji: "Ee, demo gogo wa ame ga furu sō desu.", meaning: "Yes, but it seems it will rain in the afternoon.", timestamp: "0:32" },
      { id: 5, number: 5, japanese: "それは残念ですね。", romaji: "Sore wa zannen desu ne.", meaning: "That's too bad.", timestamp: "0:45" },
    ],
    duration: "2:30", completions: 3204, accuracy: 88, date: "1 week ago"
  },
  {
    id: 2, title: "Business Introduction", level: "N3", topic: "Business",
    status: "published", audio: true, aiAnalysis: true,
    sentences: [
      { id: 1, number: 1, japanese: "はじめまして、田中太郎と申します。", romaji: "Hajimemashite, Tanaka Tarō to moshimasu.", meaning: "Nice to meet you, my name is Tanaka Tarō.", timestamp: "0:00" },
      { id: 2, number: 2, japanese: "ABC株式会社の営業部に所属しております。", romaji: "ABC kabushikigaisha no eigyōbu ni shozo-chō itashimasu.", meaning: "I belong to the sales department at ABC Corporation.", timestamp: "0:15" },
      { id: 3, number: 3, japanese: "どうぞよろしくお願いいたします。", romaji: "Dōzo yoroshiku onegaishimasu.", meaning: "Nice to meet you, please treat me well.", timestamp: "0:30" },
    ],
    duration: "4:15", completions: 1890, accuracy: 72, date: "2 weeks ago"
  },
  {
    id: 3, title: "Restaurant Ordering", level: "N4", topic: "Restaurant",
    status: "pending", audio: true, aiAnalysis: false,
    sentences: [
      { id: 1, number: 1, japanese: "いらっしゃいませ。", romaji: "Irasshaimase.", meaning: "Welcome!", timestamp: "0:00" },
      { id: 2, number: 2, japanese: "メニューをください。", romaji: "Menyū o kudasai.", meaning: "Please give me the menu.", timestamp: "0:05" },
      { id: 3, number: 3, japanese: "ご注文はお決まりですか。", romaji: "Go-chūmon wa okimari desu ka?", meaning: "Have you decided what you'd like to order?", timestamp: "0:10" },
    ],
    duration: "3:00", completions: 0, accuracy: 0, date: "4 days ago"
  },
  {
    id: 4, title: "Travel Conversation", level: "N2", topic: "Travel",
    status: "published", audio: true, aiAnalysis: true,
    sentences: [
      { id: 1, number: 1, japanese: "すみません、駅はどこですか。", romaji: "Sumimasen, eki wa doko desu ka?", meaning: "Excuse me, where is the station?", timestamp: "0:00" },
      { id: 2, number: 2, japanese: "この道をまっすぐ行ってください。", romaji: "Kono michi o massugu itte kudasai.", meaning: "Please go straight along this road.", timestamp: "0:10" },
    ],
    duration: "5:30", completions: 1200, accuracy: 65, date: "3 weeks ago"
  },
  {
    id: 5, title: "Phone Call Manners", level: "N3", topic: "Phone Call",
    status: "draft", audio: false, aiAnalysis: false,
    sentences: [
      { id: 1, number: 1, japanese: "はい、ABC株式会社です。", romaji: "Hai, ABC kabushikigaisha desu.", meaning: "Hello, ABC Corporation.", timestamp: "0:00" },
      { id: 2, number: 2, japanese: "田中さんをお願いします。", romaji: "Tanaka-san o onegaishimasu.", meaning: "I'd like to speak with Tanaka-san.", timestamp: "0:08" },
    ],
    duration: "3:45", completions: 0, accuracy: 0, date: "Just now"
  },
  {
    id: 6, title: "School Life", level: "N5", topic: "School",
    status: "published", audio: true, aiAnalysis: true,
    sentences: [
      { id: 1, number: 1, japanese: "今日は何時間目ですか。", romaji: "Kyō wa nan-jikanme desu ka?", meaning: "What period is it today?", timestamp: "0:00" },
      { id: 2, number: 2, japanese: "今日は体育の時間です。", romaji: "Kyō wa taiiku no jikan desu.", meaning: "Today is PE class.", timestamp: "0:08" },
    ],
    duration: "2:00", completions: 2100, accuracy: 91, date: "1 week ago"
  },
];

const levelColors: Record<JLPTLevel, string> = {
  N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30",
  N4: "bg-green-50 text-green-500 dark:bg-green-950/30",
  N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  N1: "bg-red-50 text-red-500 dark:bg-red-950/30",
};

const topicColorMap: Record<string, string> = {
  "Daily Life": "bg-blue-50 text-blue-500 dark:bg-blue-950/30",
  "Business": "bg-indigo-50 text-indigo-500 dark:bg-indigo-950/30",
  "Restaurant": "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  "Interview": "bg-purple-50 text-purple-500 dark:bg-purple-950/30",
  "Travel": "bg-teal-50 text-teal-500 dark:bg-teal-950/30",
  "School": "bg-green-50 text-green-500 dark:bg-green-950/30",
  "Shopping": "bg-pink-50 text-pink-500 dark:bg-pink-950/30",
  "Health": "bg-red-50 text-red-500 dark:bg-red-950/30",
  "Phone Call": "bg-slate-50 text-slate-500 dark:bg-slate-800",
  "Custom": "bg-amber-50 text-amber-500 dark:bg-amber-950/30",
};

export const Route = createFileRoute("/teacher/shadowing")({ component: ShadowingPage });

// ─────────────────────────────────────────────────────────────────────────
// TRANSCRIPT EDITOR — shared component
// ─────────────────────────────────────────────────────────────────────────
interface TranscriptEditorProps {
  sentences: Sentence[];
  onChange: (sentences: Sentence[]) => void;
  compact?: boolean;
}

function TranscriptEditor({ sentences, onChange, compact }: TranscriptEditorProps) {
  const updateSentence = (id: number, field: keyof Sentence, value: string) => {
    onChange(sentences.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSentence = (id: number) => {
    const remaining = sentences.filter(s => s.id !== id);
    onChange(remaining.map((s, i) => ({ ...s, number: i + 1 })));
  };

  const addSentence = () => {
    const next = sentences.length + 1;
    onChange([...sentences, { id: Date.now(), number: next, japanese: "", romaji: "", meaning: "", timestamp: "0:00" }]);
  };

  return (
    <div className="space-y-2">
      {sentences.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No sentences yet. Add your first sentence below.</p>
      )}
      {sentences.map((s, i) => (
        <div key={s.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground opacity-40 flex-shrink-0 cursor-grab" />
            <div className={`w-7 h-7 rounded-full bg-gradient-hero text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
              {s.number}
            </div>
            <input value={s.timestamp} onChange={e => updateSentence(s.id, "timestamp", e.target.value)}
              placeholder="0:00" className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none flex-shrink-0" />
            <input value={s.japanese} onChange={e => updateSentence(s.id, "japanese", e.target.value)}
              placeholder="Japanese sentence..."
              className="flex-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none" />
            <button onClick={() => deleteSentence(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2 pl-7">
            <input value={s.romaji} onChange={e => updateSentence(s.id, "romaji", e.target.value)}
              placeholder="Romaji / Reading..."
              className="flex-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-muted-foreground outline-none" />
            <input value={s.meaning} onChange={e => updateSentence(s.id, "meaning", e.target.value)}
              placeholder="Meaning / Translation..."
              className="flex-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-muted-foreground outline-none" />
          </div>
        </div>
      ))}
      <button onClick={addSentence}
        className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-xs font-bold text-muted-foreground hover:border-primary/40 hover:text-primary transition flex items-center justify-center gap-1">
        <PlusCircle className="w-3.5 h-3.5" /> Add Sentence
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// NEW / EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────
interface ExerciseModalProps {
  mode: "new" | "edit";
  initial?: ShadowingExercise;
  onClose: () => void;
  onSave: (exercise: ShadowingExercise) => void;
}

const DEFAULT_TOPICS = ["Daily Life", "Business", "Restaurant", "Interview", "Travel", "School", "Shopping", "Health", "Phone Call", "Custom"];

function ExerciseModal({ mode, initial, onClose, onSave }: ExerciseModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [level, setLevel] = useState<JLPTLevel>(initial?.level ?? "N5");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [customTopic, setCustomTopic] = useState("");
  const [audio, setAudio] = useState(initial?.audio ?? false);
  const [status, setStatus] = useState<ExerciseStatus>(initial?.status ?? "draft");
  const [sentences, setSentences] = useState<Sentence[]>(initial?.sentences ?? []);
  const [duration, setDuration] = useState(initial?.duration ?? "0:00");

  const effectiveTopic = topic === "Custom" ? customTopic.trim() : topic;
  const topicOptions = [...DEFAULT_TOPICS];

  const handleSave = () => {
    if (!title.trim() || (!effectiveTopic && topic !== "Custom")) return;
    const exercise: ShadowingExercise = {
      id: initial?.id ?? Date.now(),
      title: title.trim(),
      level,
      topic: effectiveTopic,
      status,
      audio,
      sentences,
      duration,
      completions: initial?.completions ?? 0,
      accuracy: initial?.accuracy ?? 0,
      aiAnalysis: sentences.length > 0,
      date: initial?.date ?? "Just now",
    };
    onSave(exercise);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">
              {mode === "new" ? "New Shadowing Exercise" : "Edit Exercise"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "new" ? "Create a new shadowing exercise for students" : `Editing: ${initial?.title}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Exercise Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Exercise Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Morning Greetings"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          {/* JLPT Level + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">JLPT Level</label>
              <div className="flex gap-1 flex-wrap">
                {(["N5", "N4", "N3", "N2", "N1"] as JLPTLevel[]).map(l => (
                  <button key={l} onClick={() => setLevel(l)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${level === l ? "bg-gradient-hero text-white shadow" : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Duration</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3:00"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Topic / Category <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-1 flex-wrap">
              {topicOptions.map(t => (
                <button key={t} onClick={() => { setTopic(t); if (t !== "Custom") setCustomTopic(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${topic === t ? "bg-gradient-hero text-white shadow" : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10"}`}>
                  {t}
                </button>
              ))}
            </div>
            {topic === "Custom" && (
              <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="Enter custom topic name..."
                className="mt-2 w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-amber-300 dark:border-amber-600 text-sm outline-none focus:ring-2 focus:ring-amber-400/40" />
            )}
          </div>

          {/* Audio Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Audio Upload</label>
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${audio ? "border-green-400 bg-green-50/50 dark:bg-green-950/20" : "border-slate-200 dark:border-slate-600 hover:border-primary/40"}`}
              onClick={() => setAudio(v => !v)}>
              <Upload className={`w-6 h-6 mx-auto mb-1.5 ${audio ? "text-green-500" : "text-muted-foreground"}`} />
              <p className={`text-sm font-semibold ${audio ? "text-green-600" : "text-muted-foreground"}`}>
                {audio ? "Audio file attached" : "Click to attach audio file"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">MP3, WAV, M4A — max 50MB</p>
            </div>
          </div>

          {/* Transcript / Sentence List */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-pink-500" />
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Transcript — Sentence List</label>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700">
              <TranscriptEditor sentences={sentences} onChange={setSentences} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
            <div className="flex gap-2">
              {(["draft", "published"] as ExerciseStatus[]).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                    status === s
                      ? s === "published" ? "bg-green-500 text-white shadow" : "bg-gradient-hero text-white shadow"
                      : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-primary/10"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">
            Cancel
          </button>
          <button onClick={handleSave}
            disabled={!title.trim() || (!effectiveTopic && topic !== "Custom")}
            className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <Save className="w-4 h-4 inline mr-1" /> {mode === "new" ? "Create Exercise" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────
interface DetailModalProps {
  exercise: ShadowingExercise;
  onClose: () => void;
  onEdit: (ex: ShadowingExercise) => void;
  onDelete: (id: number) => void;
}

function DetailModal({ exercise, onClose, onEdit, onDelete }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${topicColorMap[exercise.topic] ?? topicColorMap["Custom"]}`}>{exercise.topic}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${levelColors[exercise.level]}`}>{exercise.level}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${exercise.status === "published" ? "bg-green-50 text-green-600" : exercise.status === "pending" ? "bg-yellow-50 text-yellow-600" : "bg-slate-100 text-slate-500"}`}>{exercise.status}</span>
            </div>
            <h2 className="font-display font-bold text-lg">{exercise.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* Audio player */}
        <div className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 p-5 mb-4 text-white">
          <div className="flex items-center gap-4">
            <button className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
              <Play className="w-6 h-6 ml-0.5" />
            </button>
            <div className="flex-1">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-[25%]" />
              </div>
            </div>
            <span className="text-sm font-semibold">{exercise.duration}</span>
          </div>
        </div>

        {/* Sentences timeline */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Sentence Timeline ({exercise.sentences.length})
            </div>
            {exercise.aiAnalysis && (
              <div className="flex items-center gap-1 text-xs text-purple-500 font-semibold">
                <Bot className="w-3.5 h-3.5" /> AI Analysis
              </div>
            )}
          </div>
          <div className="space-y-2">
            {exercise.sentences.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <div className="w-7 h-7 rounded-full bg-gradient-hero text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {s.number}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.japanese}</div>
                  {s.romaji && <div className="text-[10px] text-muted-foreground italic">{s.romaji}</div>}
                  {s.meaning && <div className="text-[10px] text-muted-foreground">{s.meaning}</div>}
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{s.timestamp}</span>
              </div>
            ))}
            {exercise.sentences.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No sentences in this exercise yet.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { onEdit(exercise); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-500 text-sm font-bold hover:bg-blue-100 transition flex items-center justify-center gap-1">
            <Edit3 className="w-4 h-4" /> Edit Exercise
          </button>
          <button onClick={() => { onDelete(exercise.id); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-400 text-sm font-bold hover:bg-red-100 transition flex items-center justify-center gap-1">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold">
            Publish
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────
function ShadowingPage() {
  const [exercises, setExercises] = useState<ShadowingExercise[]>(initialExercises);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [topicFilter, setTopicFilter] = useState<string>("All Topics");
  const [topicOpen, setTopicOpen] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [detailExercise, setDetailExercise] = useState<ShadowingExercise | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ShadowingExercise | null>(null);

  const filtered = exercises.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "All" || e.level === levelFilter;
    const matchTopic = topicFilter === "All Topics" || e.topic === topicFilter;
    return matchSearch && matchLevel && matchTopic;
  });

  const handleSaveNew = (ex: ShadowingExercise) => {
    setExercises(prev => [ex, ...prev]);
  };

  const handleSaveEdit = (ex: ShadowingExercise) => {
    setExercises(prev => prev.map(e => e.id === ex.id ? ex : e));
  };

  const handleDelete = (id: number) => {
    setExercises(prev => prev.filter(e => e.id !== id));
    setDetailExercise(null);
  };

  return (
    <div className="space-y-5">
      {/* New / Edit Modal */}
      {showNewModal && (
        <ExerciseModal mode="new" onClose={() => setShowNewModal(false)} onSave={ex => { handleSaveNew(ex); setShowNewModal(false); }} />
      )}
      {editTarget && (
        <ExerciseModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSave={ex => { handleSaveEdit(ex); setEditTarget(null); }} />
      )}

      {/* Detail Modal */}
      {detailExercise && (
        <DetailModal
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
          onEdit={ex => setEditTarget(ex)}
          onDelete={handleDelete}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black">Shadowing Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload native sentences, manage transcripts, and review AI pronunciation analysis</p>
        </div>
        <button onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> New Exercise
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Exercises", value: exercises.length.toString(), icon: Mic, color: "bg-pink-50 text-pink-500" },
          { label: "AI Analysis", value: exercises.filter(e => e.aiAnalysis).length.toString(), icon: Bot, color: "bg-purple-50 text-purple-500" },
          { label: "Total Plays", value: exercises.reduce((a, e) => a + e.completions, 0).toLocaleString(), icon: Play, color: "bg-orange-50 text-orange-500" },
          { label: "Avg. Accuracy", value: exercises.filter(e => e.accuracy > 0).length > 0
              ? `${Math.round(exercises.filter(e => e.accuracy > 0).reduce((a, e) => a + e.accuracy, 0) / exercises.filter(e => e.accuracy > 0).length)}%` : "—", icon: CheckCircle, color: "bg-green-50 text-green-500" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-black text-xl">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shadowing exercises..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {["All", "N5", "N4", "N3", "N2", "N1"].map(l => (
            <button key={l} onClick={() => setLevelFilter(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${levelFilter === l ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Topic filter — collapsible dropdown */}
      <div className="relative">
        <button
          onClick={() => setTopicOpen(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:border-primary/40 transition shadow-sm"
        >
          <Tag className="w-4 h-4 text-pink-400" />
          <span className={topicFilter !== "All Topics" ? "text-primary font-bold" : "text-muted-foreground"}>
            {topicFilter}
          </span>
          {topicFilter !== "All Topics" && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gradient-hero text-white text-[10px] font-bold">
              {exercises.filter(e => e.topic === topicFilter).length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground ml-1 transition-transform duration-200 ${topicOpen ? "rotate-180" : ""}`} />
        </button>

        {topicOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setTopicOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute top-full left-0 mt-2 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 min-w-[200px]"
            >
              <button
                onClick={() => { setTopicFilter("All Topics"); setTopicOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  topicFilter === "All Topics"
                    ? "bg-gradient-hero text-white shadow"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <Layers className="w-4 h-4" />
                All Topics
                <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{exercises.length}</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
              {DROPDOWN_TOPICS.map(t => {
                const count = exercises.filter(e => e.topic === t.label).length;
                return (
                  <button
                    key={t.label}
                    onClick={() => { setTopicFilter(t.label); setTopicOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                      topicFilter === t.label
                        ? "bg-gradient-hero text-white shadow"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${topicFilter === t.label ? "bg-white" : t.color.replace("text-", "bg-")}`} />
                    {t.label}
                    {count > 0 && (
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${topicFilter === t.label ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </div>

      {/* Exercise cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <Mic className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm font-semibold text-muted-foreground">No exercises found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting filters or create a new exercise</p>
          </div>
        ) : (
          filtered.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition group"
            >
              {/* Top bar */}
              <div className={`h-2 ${ex.level === "N5" ? "bg-blue-400" : ex.level === "N4" ? "bg-green-400" : ex.level === "N3" ? "bg-yellow-400" : ex.level === "N2" ? "bg-orange-400" : "bg-red-400"}`} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPlayingId(playingId === ex.id ? null : ex.id)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow ${
                        playingId === ex.id ? "bg-gradient-hero text-white" : "bg-pink-50 dark:bg-pink-950/30 text-pink-500 hover:bg-pink-100"
                      }`}
                    >
                      {playingId === ex.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div>
                      <div className="font-semibold text-base">{ex.title}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${topicColorMap[ex.topic] ?? topicColorMap["Custom"]}`}>{ex.topic}</span>
                        <span>{ex.sentences.length} sentences</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{ex.duration}</span>
                        <span>·</span>
                        <span>{ex.level}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ex.status === "published" ? "bg-green-50 text-green-600" :
                    ex.status === "pending" ? "bg-yellow-50 text-yellow-600" : "bg-slate-100 text-slate-500"
                  }`}>{ex.status}</span>
                </div>

                {/* Transcript preview */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mb-3 text-xs text-muted-foreground font-mono leading-relaxed">
                  {ex.sentences.slice(0, 3).map((s, i) => (
                    <div key={s.id} className="mb-1">{s.number}. {s.japanese}</div>
                  ))}
                  {ex.sentences.length > 3 && <div className="opacity-40">... and {ex.sentences.length - 3} more</div>}
                  {ex.sentences.length === 0 && <div className="opacity-40 italic">No sentences yet</div>}
                </div>

                {/* AI Analysis */}
                {ex.aiAnalysis && (
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <Bot className="w-4 h-4 text-purple-500" />
                    <span className="text-purple-500 font-semibold">AI Pronunciation Analysis</span>
                    {ex.accuracy > 0 && <span className="ml-auto text-green-500 font-bold">{ex.accuracy}% accuracy</span>}
                  </div>
                )}

                {/* Waveform */}
                <div className="flex items-center gap-0.5 h-6 mb-3">
                  {Array.from({ length: 30 }).map((_, wi) => (
                    <div key={wi}
                      className={`flex-1 rounded-full ${playingId === ex.id ? "bg-gradient-hero" : "bg-slate-200 dark:bg-slate-600"}`}
                      style={{ height: `${20 + Math.sin(wi * 0.8) * 40 + Math.random() * 20}%`, minHeight: "2px" }}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {ex.completions > 0 && <span>{ex.completions.toLocaleString()} plays</span>}
                    <span>{ex.date}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditTarget(ex)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(ex.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDetailExercise(ex)} className="p-1.5 rounded-lg hover:bg-muted transition"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
