import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, Eye, Edit, Trash2, Plus, AlertTriangle, Loader2,
  ZoomIn, Filter, X, BookOpen, ScrollText, Video, EyeOff
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid
} from "recharts";

type KanjiLevel = "N5" | "N4" | "N3" | "N2" | "N1";

// Mock kanji data
const mockKanjiLessons = [
  // N5 Kanji
  { id: "kan-001", kanji: "日", meaning: "Day, Sun", onyomi: "ニチ、ジツ", kunyomi: "ひ、か", strokes: 4, level: "N5", wordsCount: 45, audioUrl: null, imageUrl: null },
  { id: "kan-002", kanji: "月", meaning: "Month, Moon", onyomi: "ゲツ、ガツ", kunyomi: "つき", strokes: 4, level: "N5", wordsCount: 38, audioUrl: null, imageUrl: null },
  { id: "kan-003", kanji: "火", meaning: "Fire", onyomi: "カ", kunyomi: "ひ", strokes: 4, level: "N5", wordsCount: 32, audioUrl: null, imageUrl: null },
  { id: "kan-004", kanji: "水", meaning: "Water", onyomi: "スイ", kunyomi: "みず", strokes: 4, level: "N5", wordsCount: 35, audioUrl: null, imageUrl: null },
  { id: "kan-005", kanji: "木", meaning: "Tree, Wood", onyomi: "ボク、モク", kunyomi: "き、こ", strokes: 4, level: "N5", wordsCount: 42, audioUrl: null, imageUrl: null },
  { id: "kan-006", kanji: "金", meaning: "Gold, Money", onyomi: "キン、コン", kunyomi: "かね", strokes: 8, level: "N5", wordsCount: 48, audioUrl: null, imageUrl: null },
  { id: "kan-007", kanji: "土", meaning: "Earth, Soil", onyomi: "ド、ト", kunyomi: "つち", strokes: 3, level: "N5", wordsCount: 28, audioUrl: null, imageUrl: null },
  { id: "kan-008", kanji: "人", meaning: "Person", onyomi: "ジン、ニン", kunyomi: "ひと", strokes: 2, level: "N5", wordsCount: 52, audioUrl: null, imageUrl: null },
  { id: "kan-009", kanji: "口", meaning: "Mouth", onyomi: "コウ、ク", kunyomi: "くち", strokes: 3, level: "N5", wordsCount: 36, audioUrl: null, imageUrl: null },
  { id: "kan-010", kanji: "山", meaning: "Mountain", onyomi: "サン", kunyomi: "やま", strokes: 3, level: "N5", wordsCount: 30, audioUrl: null, imageUrl: null },
  // N4 Kanji
  { id: "kan-011", kanji: "川", meaning: "River", onyomi: "セン", kunyomi: "かわ", strokes: 3, level: "N4", wordsCount: 25, audioUrl: null, imageUrl: null },
  { id: "kan-012", kanji: "田", meaning: "Rice field", onyomi: "デン", kunyomi: "た", strokes: 5, level: "N4", wordsCount: 28, audioUrl: null, imageUrl: null },
  { id: "kan-013", kanji: "男", meaning: "Man, Male", onyomi: "ダン、ナン", kunyomi: "おとこ", strokes: 7, level: "N4", wordsCount: 35, audioUrl: null, imageUrl: null },
  { id: "kan-014", kanji: "女", meaning: "Woman, Female", onyomi: "ジョ、ニョ", kunyomi: "おんな", strokes: 3, level: "N4", wordsCount: 32, audioUrl: null, imageUrl: null },
  { id: "kan-015", kanji: "大", meaning: "Big, Large", onyomi: "ダイ、タイ", kunyomi: "おお-", strokes: 3, level: "N4", wordsCount: 55, audioUrl: null, imageUrl: null },
  // N3 Kanji
  { id: "kan-016", kanji: "言", meaning: "Say, Word", onyomi: "ゲン、ゴン", kunyomi: "い.う", strokes: 7, level: "N3", wordsCount: 42, audioUrl: null, imageUrl: null },
  { id: "kan-017", kanji: "語", meaning: "Language, Word", onyomi: "ゴ", kunyomi: "かた.る", strokes: 14, level: "N3", wordsCount: 48, audioUrl: null, imageUrl: null },
  { id: "kan-018", kanji: "学", meaning: "Study, Learning", onyomi: "ガク", kunyomi: "まな.ぶ", strokes: 8, level: "N3", wordsCount: 52, audioUrl: null, imageUrl: null },
  // N2 Kanji
  { id: "kan-019", kanji: "会", meaning: "Meeting, Society", onyomi: "カイ、エ", kunyomi: "あ.う", strokes: 6, level: "N2", wordsCount: 45, audioUrl: null, imageUrl: null },
  { id: "kan-020", kanji: "社", meaning: "Company, Shrine", onyomi: "シャ", kunyomi: "やしろ", strokes: 7, level: "N2", wordsCount: 38, audioUrl: null, imageUrl: null },
  // N1 Kanji
  { id: "kan-021", kanji: "権", meaning: "Authority, Right", onyomi: "ケン、カン", kunyomi: "권", strokes: 15, level: "N1", wordsCount: 42, audioUrl: null, imageUrl: null },
  { id: "kan-022", kanji: "権", meaning: "Authority, Right", onyomi: "ケン、カン", kunyomi: "권", strokes: 15, level: "N1", wordsCount: 42, audioUrl: null, imageUrl: null },
];

const kanjiByLevel = {
  N5: mockKanjiLessons.filter(k => k.level === "N5"),
  N4: mockKanjiLessons.filter(k => k.level === "N4"),
  N3: mockKanjiLessons.filter(k => k.level === "N3"),
  N2: mockKanjiLessons.filter(k => k.level === "N2"),
  N1: mockKanjiLessons.filter(k => k.level === "N1"),
};

const kanjiStats = {
  N5: { total: 80, learned: 45, inProgress: 20 },
  N4: { total: 166, learned: 82, inProgress: 45 },
  N3: { total: 367, learned: 120, inProgress: 80 },
  N2: { total: 367, learned: 95, inProgress: 120 },
  N1: { total: 367, learned: 45, inProgress: 100 },
};

const progressData = [
  { week: "W1", N5: 12, N4: 8, N3: 5, N2: 3, N1: 1 },
  { week: "W2", N5: 18, N4: 14, N3: 10, N2: 6, N1: 3 },
  { week: "W3", N5: 25, N4: 22, N3: 15, N2: 10, N1: 5 },
  { week: "W4", N5: 32, N4: 28, N3: 20, N2: 14, N1: 8 },
  { week: "W5", N5: 38, N4: 35, N3: 25, N2: 18, N1: 12 },
  { week: "W6", N5: 45, N4: 42, N3: 30, N2: 22, N1: 15 },
];

function JLPTBadge({ level }: { level: KanjiLevel }) {
  const colors: Record<KanjiLevel, string> = {
    N5: "bg-[oklch(0.62_0.18_270)]/12 text-[oklch(0.62_0.18_270)] border-[oklch(0.62_0.18_270)]/20",
    N4: "bg-[oklch(0.72_0.15_230)]/12 text-[oklch(0.72_0.15_230)] border-[oklch(0.72_0.15_230)]/20",
    N3: "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border-[var(--status-pending)]/20",
    N2: "bg-[oklch(0.6_0.22_25)]/12 text-[oklch(0.6_0.22_25)] border-[oklch(0.6_0.22_25)]/20",
    N1: "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border-[var(--status-rejected)]/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[level]}`}>
      {level}
    </span>
  );
}

export const Route = createFileRoute("/admin/kanji-library")({ component: KanjiLibraryPage });

function KanjiLibraryPage() {
  const [kanji, setKanji] = useState<typeof mockKanjiLessons>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<KanjiLevel | "">("");
  const [selectedKanji, setSelectedKanji] = useState<typeof mockKanjiLessons[0] | null>(null);

  const fetchKanji = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 500));
      setKanji(mockKanjiLessons);
    } catch (err: any) {
      setError(err.message || "Failed to load kanji");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKanji(); }, [fetchKanji]);

  const filteredKanji = kanji.filter(k => {
    const matchesSearch = !search ||
      k.kanji.includes(search) ||
      k.meaning.toLowerCase().includes(search.toLowerCase()) ||
      k.onyomi.includes(search) ||
      k.kunyomi.includes(search);
    const matchesLevel = !levelFilter || k.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const totalKanji = kanji.length;
  const totalWords = kanji.reduce((sum, k) => sum + k.wordsCount, 0);

  const clearFilters = () => {
    setSearch("");
    setLevelFilter("");
  };

  const hasFilters = search || levelFilter;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Kanji Library</h1>
          <p className="text-sm text-secondary-col mt-0.5">Manage kanji content across all JLPT levels</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition">
          <Plus className="w-4 h-4" /> Add Kanji
        </button>
      </div>

      {/* Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["N5", "N4", "N3", "N2", "N1"] as KanjiLevel[]).map(level => {
          const stats = kanjiStats[level];
          const completionRate = Math.round((stats.learned / stats.total) * 100);
          const colors: Record<KanjiLevel, string> = {
            N5: "oklch(0.62 0.18 270)",
            N4: "oklch(0.72 0.15 230)",
            N3: "oklch(0.72 0.18 340)",
            N2: "oklch(0.6 0.22 25)",
            N1: "oklch(0.6 0.2 25)",
          };
          return (
            <div key={level} className="card-base p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-lg font-black`} style={{ color: colors[level] }}>{level}</span>
                <span className="text-xs text-muted-col">{stats.total} kanji</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary-col">Learned</span>
                <span className="font-bold text-primary-col">{stats.learned}</span>
              </div>
              <div className="h-2 glass-surface rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completionRate}%`, backgroundColor: colors[level] }} />
              </div>
              <p className="text-[10px] text-muted-col mt-1 text-right">{completionRate}% completion</p>
            </div>
          );
        })}
      </div>

      {/* Progress Chart */}
      <div className="card-base p-5">
        <h3 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary" />
          Kanji Learning Progress Over Time
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="n5Fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.18 270)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.62 0.18 270)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="n4Fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.15 230)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.72 0.15 230)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#F3F4F6", backdropFilter: "blur(12px)" }} />
              <Area type="monotone" dataKey="N5" stroke="oklch(0.62 0.18 270)" fill="url(#n5Fill)" strokeWidth={2} name="N5" />
              <Area type="monotone" dataKey="N4" stroke="oklch(0.72 0.15 230)" fill="url(#n4Fill)" strokeWidth={2} name="N4" />
              <Area type="monotone" dataKey="N3" stroke="oklch(0.72 0.18 340)" strokeWidth={2} name="N3" />
              <Area type="monotone" dataKey="N2" stroke="oklch(0.6 0.22 25)" strokeWidth={2} name="N2" />
              <Area type="monotone" dataKey="N1" stroke="oklch(0.6 0.2 25)" strokeWidth={2} name="N1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap mt-3">
          {[
            { name: "N5", color: "oklch(0.62 0.18 270)" },
            { name: "N4", color: "oklch(0.72 0.15 230)" },
            { name: "N3", color: "oklch(0.72 0.18 340)" },
            { name: "N2", color: "oklch(0.6 0.22 25)" },
            { name: "N1", color: "oklch(0.6 0.2 25)" },
          ].map(item => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-col">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-col" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by kanji, meaning, or reading..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl search-input text-sm"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as KanjiLevel | "")}
          className="px-3 py-2.5 rounded-xl search-input text-sm min-w-[120px]"
        >
          <option value="">All Levels</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-secondary-col text-sm hover:bg-accent transition"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Kanji Grid */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto min-w-[900px]">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
            <div className="col-span-1">Kanji</div>
            <div className="col-span-2">Meaning</div>
            <div className="col-span-2">Onyomi</div>
            <div className="col-span-2">Kunyomi</div>
            <div className="col-span-1">Strokes</div>
            <div className="col-span-1">Level</div>
            <div className="col-span-1">Words</div>
            <div className="col-span-2">Actions</div>
          </div>

          {loading && (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-col">Loading kanji...</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-16 flex flex-col items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-[var(--status-rejected)]/50" />
              <p className="text-sm font-bold text-[var(--status-rejected)]">{error}</p>
              <button onClick={fetchKanji} className="px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredKanji.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3">
              <ScrollText className="w-10 h-10 text-muted-col/40" />
              <p className="text-sm font-bold text-secondary-col">No kanji found</p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredKanji.map((k, i) => (
            <motion.div
              key={k.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
            >
              <div className="col-span-1">
                <div
                  className="w-12 h-12 rounded-xl bg-primary/12 flex items-center justify-center text-2xl font-black text-primary cursor-pointer hover:bg-primary/20 transition"
                  onClick={() => setSelectedKanji(k)}
                >
                  {k.kanji}
                </div>
              </div>

              <div className="col-span-2">
                <span className="text-sm font-semibold text-primary-col">{k.meaning}</span>
              </div>

              <div className="col-span-2">
                <span className="text-xs text-secondary-col font-mono">{k.onyomi}</span>
              </div>

              <div className="col-span-2">
                <span className="text-xs text-secondary-col font-mono">{k.kunyomi}</span>
              </div>

              <div className="col-span-1">
                <span className="text-sm text-primary-col">{k.strokes}</span>
              </div>

              <div className="col-span-1">
                <JLPTBadge level={k.level as KanjiLevel} />
              </div>

              <div className="col-span-1">
                <span className="text-sm text-primary-col">{k.wordsCount}</span>
              </div>

              <div className="col-span-2 flex items-center gap-1">
                <button
                  onClick={() => setSelectedKanji(k)}
                  className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl text-secondary-col/60 hover:text-secondary-col hover:bg-accent transition" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl text-[var(--status-rejected)]/60 hover:text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/10 transition" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Kanji Detail Modal */}
      {selectedKanji && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedKanji(null)} />
          <motion.div
            className="relative z-10 w-full max-w-lg glass-modal rounded-2xl border border-glass-border shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b separator">
              <div className="flex items-center gap-3">
                <JLPTBadge level={selectedKanji.level as KanjiLevel} />
                <span className="text-xs text-muted-col">{selectedKanji.strokes} strokes</span>
              </div>
              <button
                onClick={() => setSelectedKanji(null)}
                className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {/* Kanji Display */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-32 h-32 rounded-2xl bg-primary/12 flex items-center justify-center text-7xl font-black text-primary border-4 border-primary/20">
                  {selectedKanji.kanji}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl glass-surface">
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Meaning</p>
                  <p className="text-lg font-semibold text-primary-col">{selectedKanji.meaning}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl glass-surface">
                    <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Onyomi (Chinese)</p>
                    <p className="text-base font-mono text-primary-col">{selectedKanji.onyomi}</p>
                  </div>
                  <div className="p-4 rounded-xl glass-surface">
                    <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Kunyomi (Japanese)</p>
                    <p className="text-base font-mono text-primary-col">{selectedKanji.kunyomi}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl glass-surface">
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Words Count</p>
                  <p className="text-base font-semibold text-primary-col">{selectedKanji.wordsCount} words</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t separator flex gap-3">
              <button
                onClick={() => setSelectedKanji(null)}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition"
              >
                Close
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition">
                Edit Kanji
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
