import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, GraduationCap, Eye, CheckCircle2, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, BookOpen, X, ArrowRight,
  Clock, Target
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";

// ─── Data ──────────────────────────────────────────────────────────────────────

interface GrammarItem {
  id: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  title: string;
  meaning: string;
  structureCount: number;
  lastStudied?: string;
}

const GRAMMAR_DATA: GrammarItem[] = [
  { id: "g1", level: "N5", title: "〜です / だ", meaning: "to be (copula)", structureCount: 6, lastStudied: "2 days ago" },
  { id: "g2", level: "N5", title: "〜があります / います", meaning: "there is / exists", structureCount: 4, lastStudied: "5 days ago" },
  { id: "g3", level: "N5", title: "〜ます / 〜ません", meaning: "polite affirmative / negative", structureCount: 5, lastStudied: "1 week ago" },
  { id: "g4", level: "N4", title: "〜なければなりません", meaning: "must do / have to", structureCount: 4, lastStudied: "3 days ago" },
  { id: "g5", level: "N4", title: "〜たことがあります", meaning: "have experience of doing", structureCount: 4, lastStudied: "Just now" },
  { id: "g6", level: "N4", title: "〜たいです", meaning: "want to do", structureCount: 3 },
  { id: "g7", level: "N3", title: "〜わけではない", meaning: "it doesn't mean that / not necessarily", structureCount: 5 },
  { id: "g8", level: "N3", title: "〜ばかりでなく", meaning: "not only ... but also", structureCount: 4 },
  { id: "g9", level: "N3", title: "〜そうだ (appearance)", meaning: "it seems / it looks like", structureCount: 5 },
  { id: "g10", level: "N2", title: "〜にもかかわらず", meaning: "in spite of / despite", structureCount: 4 },
  { id: "g11", level: "N2", title: "〜かわり (に)", meaning: "instead of / in place of", structureCount: 4 },
  { id: "g12", level: "N1", title: "〜を余儀なくされる", meaning: "be forced to / have no choice but to", structureCount: 3 },
  { id: "g13", level: "N1", title: "〜つつある", meaning: "in the process of (gradual change)", structureCount: 3 },
];

const LEVEL_FILTERS = ["All", "N5", "N4", "N3", "N2", "N1"] as const;
const PAGE_SIZE = 8;

const levelColors: Record<string, string> = {
  N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30",
  N4: "bg-green-50 text-green-500 dark:bg-green-950/30",
  N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  N1: "bg-red-50 text-red-500 dark:bg-red-950/30",
};

const levelGradients: Record<string, string> = {
  N5: "from-blue-400 to-cyan-400",
  N4: "from-green-400 to-emerald-400",
  N3: "from-yellow-400 to-orange-400",
  N2: "from-orange-400 to-red-400",
  N1: "from-red-400 to-pink-400",
};

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  current, total, onPage,
}: { current: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const pageNums = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{Math.min((current - 1) * PAGE_SIZE + 1, total)}</span>
        {" – "}
        <span className="font-semibold text-foreground">{Math.min(current * PAGE_SIZE, total)}</span>
        {" of "}
        <span className="font-semibold text-foreground">{total}</span>
        {" grammar patterns"}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNums.map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
              p === current
                ? "bg-gradient-hero text-white shadow"
                : "border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(current + 1)}
          disabled={current === pages}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/grammar/_index")({ component: GrammarListPage });

function GrammarListPage() {
  const [levelFilter, setLevelFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [completed, setCompleted] = useState<Set<string>>(new Set(["g1"]));
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set(["g3"]));

  const filtered = useMemo(() => {
    return GRAMMAR_DATA.filter(g => {
      const matchLevel = levelFilter === "All" || g.level === levelFilter;
      if (!matchLevel) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.meaning.toLowerCase().includes(q) ||
        g.level.toLowerCase().includes(q)
      );
    });
  }, [levelFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleLevelFilter = (level: string) => {
    setLevelFilter(level);
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const toggleBookmark = (id: string) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalCompleted = [...completed].length;
  const totalBookmarked = bookmarked.size;
  const totalGrammar = filtered.length;
  const completedCount = filtered.filter(g => completed.has(g.id)).length;
  const progressPct = totalGrammar > 0 ? Math.round((completedCount / totalGrammar) * 100) : 0;

  return (
    <div>
      <SakuraBg count={14} />
      <div className="relative z-10 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-display font-black">Grammar Lessons</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Master JLPT grammar patterns from N5 to N1 with clear examples and explanations.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {[
              { label: "Total", value: GRAMMAR_DATA.length, color: "text-blue-500", icon: <BookOpen className="w-4 h-4" /> },
              { label: "Completed", value: totalCompleted, color: "text-green-500", icon: <CheckCircle2 className="w-4 h-4" /> },
              { label: "Bookmarked", value: totalBookmarked, color: "text-yellow-500", icon: <BookmarkCheck className="w-4 h-4" /> },
            ].map(stat => (
              <div key={stat.label} className="text-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 backdrop-blur-sm border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1 mt-0.5">
                  {stat.icon} {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 px-6">
          <div className="flex-1 max-w-80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search grammar patterns..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {LEVEL_FILTERS.map(l => (
              <button
                key={l}
                onClick={() => handleLevelFilter(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  levelFilter === l ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_80px_1.5fr_120px_110px_120px_80px] gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              <div>Pattern</div>
              <div>Level</div>
              <div>Meaning</div>
              <div className="text-center">Progress</div>
              <div className="text-center">Completed</div>
              <div className="text-center">Last Studied</div>
              <div className="text-center">View</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {paginated.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  No grammar patterns found.
                </div>
              ) : (
                paginated.map((g, i) => {
                  const isComp = completed.has(g.id);
                  const isBook = bookmarked.has(g.id);
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="grid grid-cols-[2fr_80px_1.5fr_120px_110px_120px_80px] gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition cursor-pointer items-center"
                    >
                      {/* Title */}
                      <Link
                        to="/student/grammar/$grammarId"
                        params={{ grammarId: g.id }}
                        className="flex items-center gap-3 min-w-0 hover:opacity-80 transition"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${levelGradients[g.level]}`}>
                          <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-display font-black text-sm text-slate-800 dark:text-white truncate">{g.title}</div>
                          <div className="text-[10px] text-muted-foreground">{g.level} JLPT</div>
                        </div>
                      </Link>

                      {/* Level */}
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${levelColors[g.level]}`}>
                          {g.level}
                        </span>
                      </div>

                      {/* Meaning */}
                      <div className="text-sm text-muted-foreground truncate pr-2">{g.meaning}</div>

                      {/* Progress */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: isComp ? "100%" : "0%" }}
                            className={`h-full rounded-full transition-all ${isComp ? "bg-green-400" : "bg-gradient-to-r from-blue-400 to-pink-400"}`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground w-7 text-right">
                          {isComp ? "100%" : "0%"}
                        </span>
                      </div>

                      {/* Completed Status */}
                      <div className="text-center">
                        {isComp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-muted-foreground text-[10px] font-bold">
                            <Clock className="w-3 h-3" /> No
                          </span>
                        )}
                      </div>

                      {/* Last Studied */}
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground">
                          {g.lastStudied ?? "—"}
                        </span>
                      </div>

                      {/* View Action */}
                      <div className="text-center flex justify-center gap-1">
                        <Link
                          to="/student/grammar/$grammarId"
                          params={{ grammarId: g.id }}
                          title="View structures"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(g.id); }}
                          title={isBook ? "Remove bookmark" : "Bookmark"}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                            isBook
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500"
                              : "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-slate-300 hover:text-yellow-500"
                          }`}
                        >
                          {isBook
                            ? <BookmarkCheck className="w-3.5 h-3.5 fill-yellow-400" />
                            : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 pb-5">
                <Pagination current={safePage} total={filtered.length} onPage={handlePageChange} />
              </div>
            )}
          </div>

          {/* Overall Progress Summary */}
          <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Progress</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {completedCount} / {totalGrammar} patterns mastered
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-blue-400 to-pink-400 rounded-full"
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">0%</span>
              <span className="text-[10px] font-bold text-primary">{progressPct}%</span>
              <span className="text-[10px] text-muted-foreground">100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
