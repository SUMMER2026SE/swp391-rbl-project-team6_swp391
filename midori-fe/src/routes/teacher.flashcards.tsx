import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit3, Trash2, Eye, BookOpen, Layers,
  X, Save, BookText, Tag, Star, FlipHorizontal,
  GripVertical, AlertTriangle, EyeOff, ListChecks
} from "lucide-react";
import { flashcardSetsData, type FlashcardSet, type Flashcard } from "../data/flashcards";

const STORAGE_KEY = "midori_flashcard_sets";
const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];
const VOCAB_TOPICS = ["General","Daily Life","School","Food","Shopping","Travel","Family","Business","Nature","Work","Social","Emotions","Health","Technology","Education","Culture","Sports","Art","Science","Politics","Entertainment"];
const PAGE_SIZE = 9;

function loadSets(): FlashcardSet[] {
  if (typeof window === "undefined") return flashcardSetsData;
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw) as FlashcardSet[]; } catch {}
  return flashcardSetsData;
}
function saveSets(sets: FlashcardSet[]) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export const Route = createFileRoute("/teacher/flashcards")({ component: TeacherFlashcardsPage });

// ─── Pagination ─────────────────────────────────────────────────────────────
function PaginationUI({ current, total, onPage }: { current: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{Math.min((current - 1) * PAGE_SIZE + 1, total)}</span>
        {" – "}
        <span className="font-semibold text-foreground">{Math.min(current * PAGE_SIZE, total)}</span>
        {" / "}
        <span className="font-semibold text-foreground">{total}</span>
        {" sets"}
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(current - 1)} disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 transition">‹</button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${p === current ? "bg-gradient-hero text-white shadow" : "border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-muted"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(current + 1)} disabled={current === pages}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 transition">›</button>
      </div>
    </div>
  );
}

// ─── Level badge ───────────────────────────────────────────────────────────
function levelBadge(l: string) {
  const map: Record<string, string> = {
    N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    N4: "bg-green-50 text-green-500 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-800",
    N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    N1: "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-300 border-red-200 dark:border-red-800",
  };
  return map[l] ?? "bg-slate-50 text-slate-500 border-slate-200";
}

// ─── Card Form Component (shared) ──────────────────────────────────────────
function CardForm({
  mode, onSave, onCancel,
  form, setForm,
  defaultLevel
}: {
  mode: "add" | "edit";
  onSave: () => void;
  onCancel: () => void;
  form: { word: string; furigana: string; romaji: string; meaning: string; example: string; topic: string; level: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  defaultLevel: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-hero text-white flex items-center justify-center text-[10px] font-black">
            {mode === "add" ? "+" : "✎"}
          </div>
          <span className="text-sm font-bold text-foreground">{mode === "add" ? "Add new card" : "Edit card"}</span>
        </div>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-primary/10 transition text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Word (Kanji) <span className="text-red-400">*</span></label>
            <input value={form.word} onChange={e => setForm(f => ({ ...f, word: e.target.value }))}
              placeholder="環境"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Furigana</label>
            <input value={form.furigana} onChange={e => setForm(f => ({ ...f, furigana: e.target.value }))}
              placeholder="かんきょう"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Romaji</label>
            <input value={form.romaji} onChange={e => setForm(f => ({ ...f, romaji: e.target.value }))}
              placeholder="kankyou"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Meaning <span className="text-red-400">*</span></label>
            <input value={form.meaning} onChange={e => setForm(f => ({ ...f, meaning: e.target.value }))}
              placeholder="Môi trường"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
        <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Example</label>
          <input value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
            placeholder="今日は天気が很好です。"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Topic</label>
            <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40">
              {VOCAB_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Level</label>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40">
              {["N5","N4","N3","N2","N1"].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-muted-foreground hover:bg-slate-200 transition">
            Cancel
          </button>
          <button onClick={onSave}
            disabled={!form.word.trim() || !form.meaning.trim()}
            className="flex-1 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition flex items-center justify-center gap-2">
            {mode === "add" ? <><Plus className="w-4 h-4" /> Add card</> : <><Save className="w-4 h-4" /> Update</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────
function TeacherFlashcardsPage() {
  const [sets, setSets] = useState<FlashcardSet[]>(loadSets);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [page, setPage] = useState(1);

  // ── ADD SET MODAL ──────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addLevel, setAddLevel] = useState("N5");
  const [addTopic, setAddTopic] = useState("General");

  // ── VIEW SET MODAL (read-only) ─────────────────────────────────
  const [viewing, setViewing] = useState<FlashcardSet | null>(null);

  // ── EDIT SET MODAL (full card management) ──────────────────────
  const [editSet, setEditSet] = useState<FlashcardSet | null>(null);
  // editSet working copy
  const [editCards, setEditCards] = useState<Flashcard[]>([]);
  const [editSetInfo, setEditSetInfo] = useState({ title: "", description: "", level: "N5", topic: "General" });
  // add card form
  const [showAddCard, setShowAddCard] = useState(false);
  const [addCardForm, setAddCardForm] = useState({ word: "", furigana: "", romaji: "", meaning: "", example: "", topic: "General", level: "N5" });
  // edit card form
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editCardForm, setEditCardForm] = useState({ word: "", furigana: "", romaji: "", meaning: "", example: "", topic: "General", level: "N5" });
  // delete card
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);

  // ── DELETE SET ─────────────────────────────────────────────────
  const [deleting, setDeleting] = useState<FlashcardSet | null>(null);

  useEffect(() => { saveSets(sets); }, [sets]);

  const persist = (updated: FlashcardSet[]) => { saveSets(updated); setSets(updated); };

  const totalCards = sets.reduce((s, x) => s + x.cards.length, 0);
  const allTopics = Array.from(new Set(sets.map(s => s.topic))).sort();

  const filtered = sets.filter(s => {
    const mLvl = levelFilter === "All" || s.level === levelFilter;
    const mTopic = topicFilter === "All" || s.topic === topicFilter;
    const mSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return mLvl && mTopic && mSearch;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── HANDLERS ───────────────────────────────────────────────────

  const handleAddSet = () => {
    if (!addName.trim()) return;
    const s: FlashcardSet = {
      id: "fs" + Date.now(), title: addName.trim(), description: addDesc.trim(),
      level: addLevel, topic: addTopic, cards: [],
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSets(prev => [...prev, s]);
    setAddName(""); setAddDesc(""); setAddLevel("N5"); setAddTopic("General");
    setShowAdd(false);
    // Immediately open Edit modal for the new set
    setEditSet(s);
    setEditCards([]);
    setEditSetInfo({ title: s.title, description: s.description, level: s.level, topic: s.topic });
    setShowAddCard(false);
    setEditingCard(null);
  };

  const openEditSet = (s: FlashcardSet) => {
    setEditSet(s);
    setEditCards([...s.cards]);
    setEditSetInfo({ title: s.title, description: s.description, level: s.level, topic: s.topic });
    setShowAddCard(false);
    setEditingCard(null);
  };

  const handleSaveEditSet = () => {
    if (!editSet || !editSetInfo.title.trim()) return;
    persist(sets.map(s => s.id === editSet.id
      ? { ...s, title: editSetInfo.title.trim(), description: editSetInfo.description.trim(), level: editSetInfo.level, topic: editSetInfo.topic, cards: editCards }
      : s));
    setEditSet(null);
  };

  const handleAddCard = () => {
    if (!addCardForm.word.trim() || !addCardForm.meaning.trim()) return;
    const c: Flashcard = {
      id: "fc" + Date.now(),
      word: addCardForm.word.trim(), furigana: addCardForm.furigana.trim(),
      romaji: addCardForm.romaji.trim(), meaning: addCardForm.meaning.trim(),
      example: addCardForm.example.trim(), image: "", audio: "", learned: false,
      topic: addCardForm.topic, level: addCardForm.level,
    };
    setEditCards(prev => [...prev, c]);
    setAddCardForm({ word: "", furigana: "", romaji: "", meaning: "", example: "", topic: editSetInfo.topic, level: editSetInfo.level });
    setShowAddCard(false);
  };

  const openEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setEditCardForm({ word: card.word, furigana: card.furigana, romaji: card.romaji, meaning: card.meaning, example: card.example, topic: card.topic, level: card.level });
    setShowAddCard(false);
  };

  const handleSaveEditCard = () => {
    if (!editingCard || !editCardForm.word.trim()) return;
    setEditCards(prev => prev.map(c => c.id === editingCard.id
      ? { ...c, word: editCardForm.word.trim(), furigana: editCardForm.furigana.trim(), romaji: editCardForm.romaji.trim(), meaning: editCardForm.meaning.trim(), example: editCardForm.example.trim(), topic: editCardForm.topic, level: editCardForm.level }
      : c));
    setEditingCard(null);
  };

  const handleDeleteCard = () => {
    if (!deletingCard) return;
    setEditCards(prev => prev.filter(c => c.id !== deletingCard.id));
    setDeletingCard(null);
  };

  const handleDeleteSet = () => {
    if (!deleting) return;
    persist(sets.filter(s => s.id !== deleting.id));
    setDeleting(null);
  };

  const closeEditSet = () => {
    setEditSet(null); setEditCards([]); setShowAddCard(false); setEditingCard(null);
  };

  // ════════════════════════════════════════════════════════════════════
  //  MAIN PAGE
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Flashcard Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sets.length} sets · {totalCards} cards</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition active:scale-95">
          <Plus className="w-4 h-4" /> Add flashcard set
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Flashcard sets", value: sets.length, icon: Layers, color: "text-blue-500" },
          { label: "Total cards", value: totalCards, icon: BookText, color: "text-green-500" },
          { label: "Topics", value: allTopics.length, icon: Tag, color: "text-purple-500" },
          { label: "Levels", value: "N5–N1", icon: Star, color: "text-yellow-500", noNum: true },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-display font-black text-xl leading-none ${stat.color}`}>
                    {stat.noNum ? stat.value : stat.value.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-64 max-w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search flashcard sets..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {JLPT_LEVELS.map(lvl => (
            <button key={lvl} onClick={() => { setLevelFilter(lvl); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${levelFilter === lvl ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
              {lvl}
            </button>
          ))}
        </div>
        {allTopics.length > 0 && (
          <select value={topicFilter} onChange={e => { setTopicFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none">
            <option value="All">All Topics</option>
            {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* ── Set grid ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-base text-muted-foreground">No flashcard sets found</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-primary underline text-sm">+ Create your first set</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden">
                <div className="h-1.5 bg-gradient-hero w-full" />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center">
                        {i + 1 + (page - 1) * PAGE_SIZE}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-display font-black text-sm text-foreground leading-tight truncate">{s.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(s.level)}`}>{s.level}</span>
                      </div>
                      {s.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{s.description}</p>}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><BookText className="w-3 h-3" />{s.cards.length} cards</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-500 text-[10px] font-semibold">{s.topic}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewing(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button onClick={() => openEditSet(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500 text-xs font-bold transition-all">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => setDeleting(s)}
                      className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 text-xs font-bold transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <PaginationUI current={page} total={filtered.length} onPage={setPage} />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ADD SET MODAL
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowAdd(false); setAddName(""); setAddDesc(""); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5"
              style={{ maxWidth: 480 }}>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-lg text-foreground">Create new flashcard set</h2>
                <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">Set name <span className="text-red-400">*</span></label>
                  <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g. Greetings N5"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">Description</label>
                  <textarea value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="Short description for this flashcard set..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">Level</label>
                    <select value={addLevel} onChange={e => setAddLevel(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40">
                      {["N5","N4","N3","N2","N1"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wide">Topic</label>
                    <select value={addTopic} onChange={e => setAddTopic(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40">
                      {VOCAB_TOPICS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition">Cancel</button>
                <button onClick={handleAddSet} disabled={!addName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition">
                  Create &amp; manage cards
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          DELETE SET MODAL
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleting && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleting(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl text-center border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: 420 }}>
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/20 grid place-items-center mx-auto mb-3">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="font-display font-black text-lg mb-1">Delete flashcard set?</h2>
              <p className="text-sm text-muted-foreground mb-1">
                <strong className="text-foreground">{deleting.title}</strong> will be permanently deleted.
              </p>
              <p className="text-xs text-red-400 mb-5">Includes {deleting.cards.length} cards inside.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleting(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition">Cancel</button>
                <button onClick={handleDeleteSet}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          VIEW SET MODAL — READ-ONLY
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewing && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewing(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }} transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 800, maxHeight: "90vh" }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display font-black text-lg text-foreground">{viewing.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${levelBadge(viewing.level)}`}>{viewing.level}</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-500 text-xs font-bold border border-purple-100 dark:border-purple-900">{viewing.topic}</span>
                  </div>
                  {viewing.description && <p className="text-sm text-muted-foreground">{viewing.description}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{viewing.cards.length} cards · Created {viewing.createdAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-muted-foreground font-semibold border border-slate-200 dark:border-slate-700">
                    <EyeOff className="w-3 h-3 inline mr-1" />Read-only
                  </div>
                  <button onClick={() => setViewing(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card list — read only */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
                {viewing.cards.length === 0 ? (
                  <div className="py-20 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="font-semibold text-muted-foreground">No cards yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Click Edit (✏️) to manage flashcards</p>
                  </div>
                ) : (
                  viewing.cards.map((card, i) => (
                    <motion.div key={card.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden hover:border-primary/30 transition">
                      <div className="h-1 bg-gradient-hero w-full" />
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gradient-hero text-white font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                              <span className="font-display font-black text-xl text-foreground">{card.word}</span>
                              {card.furigana && <span className="text-base text-sky-500 font-medium">{card.furigana}</span>}
                              {card.romaji && <span className="text-xs text-muted-foreground italic">{card.romaji}</span>}
                            </div>
                            <div className="text-sm font-semibold text-foreground mb-2">{card.meaning}</div>
                            {card.example && (
                              <div className="text-xs text-muted-foreground italic mb-2">"{card.example}"</div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(card.level)}`}>{card.level}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-500 border border-purple-100 dark:border-purple-900">{card.topic}</span>
                            </div>
                          </div>
                          <FlipHorizontal className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{viewing.cards.length} cards</span>
                <div className="flex gap-2">
                  <button onClick={() => { setViewing(null); openEditSet(viewing); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-500 text-sm font-bold transition-all">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setViewing(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          EDIT SET MODAL — FULL CARD MANAGEMENT
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editSet && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeEditSet}>
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }} transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
              style={{ maxWidth: 880, maxHeight: "92vh" }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-gradient-hero text-white flex items-center justify-center text-xs font-black">
                      <ListChecks className="w-3 h-3" />
                    </div>
                    <h2 className="font-display font-black text-lg text-foreground">Manage flashcards</h2>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{editSetInfo.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${levelBadge(editSetInfo.level)}`}>{editSetInfo.level}</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-500 text-[10px] font-bold border border-purple-100 dark:border-purple-900">{editSetInfo.topic}</span>
                    <span className="text-xs text-muted-foreground">{editCards.length} cards</span>
                  </div>
                </div>
                <button onClick={closeEditSet}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col gap-4">
                {/* ── Set info mini-form ── */}
                <div className="flex items-end gap-3 flex-shrink-0">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Set name</label>
                    <input value={editSetInfo.title} onChange={e => setEditSetInfo(i => ({ ...i, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Level</label>
                    <select value={editSetInfo.level} onChange={e => setEditSetInfo(i => ({ ...i, level: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40">
                      {["N5","N4","N3","N2","N1"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="w-40">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wide">Topic</label>
                    <select value={editSetInfo.topic} onChange={e => setEditSetInfo(i => ({ ...i, topic: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40">
                      {VOCAB_TOPICS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setShowAddCard(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition flex-shrink-0">
                    <Plus className="w-4 h-4" /> Add card
                  </button>
                </div>

                {/* ── Add/Edit card form ── */}
                {(showAddCard || editingCard) && (
                  <div className="flex-shrink-0">
                    <CardForm
                      mode={editingCard ? "edit" : "add"}
                      defaultLevel={editSetInfo.level}
                      onSave={editingCard ? handleSaveEditCard : handleAddCard}
                      onCancel={() => { setShowAddCard(false); setEditingCard(null); }}
                      form={editingCard ? editCardForm : addCardForm}
                      setForm={editingCard ? setEditCardForm : setAddCardForm}
                    />
                  </div>
                )}

                {/* ── Card list ── */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
                  {editCards.length === 0 && !showAddCard && !editingCard ? (
                    <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <Layers className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
                      <p className="font-semibold text-muted-foreground text-sm mb-1">No cards yet in this set</p>
                      <p className="text-xs text-muted-foreground">Click "Add card" to get started</p>
                      <button onClick={() => setShowAddCard(true)}
                        className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition">
                        <Plus className="w-4 h-4" /> Add first flashcard
                      </button>
                    </div>
                  ) : (
                    editCards.map((card, i) => (
                      <motion.div key={card.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition group">
                        <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0 cursor-grab" />
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">{card.word}</span>
                            {card.furigana && <span className="text-xs text-sky-500">{card.furigana}</span>}
                            <span className="text-xs text-muted-foreground">→</span>
                            <span className="text-xs font-semibold text-foreground">{card.meaning}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${levelBadge(card.level)}`}>{card.level}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-500 border border-purple-100 dark:border-purple-900">{card.topic}</span>
                            {card.example && (
                              <span className="text-[9px] text-muted-foreground italic truncate max-w-[120px]">"{card.example}"</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => openEditCard(card)}
                            className="w-8 h-8 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center text-blue-400 hover:text-blue-600 transition"
                            title="Edit card">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeletingCard(card)}
                            className="w-8 h-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-red-400 hover:text-red-500 transition"
                            title="Delete card">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {editCards.length > 0 ? `${editCards.length} cards` : "No cards"}
                </span>
                <div className="flex gap-2">
                  <button onClick={closeEditSet}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition">
                    Cancel
                  </button>
                  <button onClick={handleSaveEditSet}
                    className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow flex items-center gap-2 hover:opacity-90 transition">
                    <Save className="w-4 h-4" /> Save all
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          DELETE CARD CONFIRM MODAL
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deletingCard && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeletingCard(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full shadow-2xl text-center border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: 400 }}>
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/20 grid place-items-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="font-display font-black text-lg mb-1">Delete card?</h2>
              <p className="text-sm text-muted-foreground mb-1">
                Are you sure you want to delete <strong className="text-foreground">"{deletingCard.word}"</strong> ({deletingCard.meaning})?
              </p>
              <p className="text-xs text-red-400 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingCard(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition">Cancel</button>
                <button onClick={handleDeleteCard}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
