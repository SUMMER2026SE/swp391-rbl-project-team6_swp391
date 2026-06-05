import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { shadowingTopics, type ShadowingTopic, type ShadowingConversation } from "@/lib/mock-data";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Square, Volume2, CheckCircle2, Sparkles, BookOpen,
  ChevronRight, ArrowLeft, RotateCcw, Lock, Search, X, ChevronDown,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";

interface SentenceResult {
  passed: boolean;
  pron: number;
  flu: number;
  into: number;
  conf: number;
}

type ConvStatus = "not_started" | "in_progress" | "completed";

function getLevelBadge(level: string) {
  const c: Record<string, string> = {
    N5: "bg-primary/15 text-primary",
    N4: "bg-sky-blue/20 text-sky-blue",
    N3: "bg-accent text-accent-foreground",
    N2: "bg-jp-red/15 text-jp-red",
    N1: "bg-foreground text-background",
  };
  return c[level] ?? "bg-muted";
}

function getConvStatusBadge(status: ConvStatus): { label: string; cls: string } {
  if (status === "completed") return { label: "Completed", cls: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" };
  if (status === "in_progress") return { label: "In Progress", cls: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300" };
  return { label: "Not Started", cls: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" };
}

export const Route = createFileRoute("/student/shadowing")({ component: ShadowingPage });

function ShadowingPage() {
  const [selectedTopic, setSelectedTopic] = useState<ShadowingTopic | null>(null);
  const [selectedConv, setSelectedConv] = useState<ShadowingConversation | null>(null);
  const [idx, setIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<SentenceResult | null>(null);
  const [convProgress, setConvProgress] = useState<Record<string, Set<string>>>({});
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const convKey = selectedTopic && selectedConv ? `${selectedTopic.id}::${selectedConv.id}` : null;
  const passedIds = convKey ? (convProgress[convKey] ?? new Set()) : new Set();
  const unlocked = passedIds.size;

  const sentences = selectedConv?.sentences ?? [];
  const currentSentence = sentences[idx];

  const getConvStatus = (topicId: string, conv: ShadowingConversation): ConvStatus => {
    const key = `${topicId}::${conv.id}`;
    const p = convProgress[key];
    if (!p || p.size === 0) return "not_started";
    if (p.size === conv.sentences.length) return "completed";
    return "in_progress";
  };

  const stopRecording = () => {
    setRecording(false);
    const pron = 50 + Math.floor(Math.random() * 50);
    const passed = pron >= 80;
    setResult({ passed, pron, flu: 60 + Math.floor(Math.random() * 35), into: 55 + Math.floor(Math.random() * 40), conf: 50 + Math.floor(Math.random() * 45) });
    if (passed && convKey) {
      setConvProgress(prev => {
        const next = new Set(prev[convKey] ?? []);
        next.add(sentences[idx].id);
        return { ...prev, [convKey]: next };
      });
    }
  };

  const handleNext = () => {
    if (!result?.passed) return;
    if (idx < sentences.length - 1) {
      setIdx(i => i + 1);
      setResult(null);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setRecording(false);
  };

  const handleSelectTopic = (topic: ShadowingTopic) => {
    setSelectedTopic(topic);
    setSelectedConv(null);
    setIdx(0);
    setResult(null);
    setRecording(false);
  };

  const handleSelectConversation = (conv: ShadowingConversation) => {
    setSelectedConv(conv);
    setIdx(0);
    setResult(null);
    setRecording(false);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setSelectedConv(null);
    setResult(null);
    setIdx(0);
  };

  const handleBackToConversations = () => {
    setSelectedConv(null);
    setIdx(0);
    setResult(null);
    setRecording(false);
  };

  const isPracticing = selectedTopic !== null && selectedConv !== null;

  // Flatten all conversations from all topics, filtered by search + level
  const filteredConvs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return shadowingTopics.flatMap(topic =>
      topic.conversations.map(conv => ({ topic, conv }))
    ).filter(({ topic, conv }) => {
      const matchLevel = !levelFilter || topic.level === levelFilter;
      const matchSearch = !q ||
        conv.title.toLowerCase().includes(q) ||
        topic.description.toLowerCase().includes(q) ||
        topic.level.toLowerCase().includes(q);
      return matchLevel && matchSearch;
    });
  }, [search, levelFilter]);

  const handleSelectFromList = (topic: ShadowingTopic, conv: ShadowingConversation) => {
    setSelectedTopic(topic);
    setSelectedConv(conv);
    setIdx(0);
    setResult(null);
    setRecording(false);
  };

  const ALL_LEVELS = ["N5", "N4", "N3", "N2", "N1"];
  const LEVEL_COLORS: Record<string, string> = {
    N5: "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25",
    N4: "bg-sky-blue/20 text-sky-blue border-sky-blue/30 hover:bg-sky-blue/30",
    N3: "bg-accent/20 text-accent border-accent/30 hover:bg-accent/30",
    N2: "bg-jp-red/15 text-jp-red border-jp-red/30 hover:bg-jp-red/25",
    N1: "bg-foreground/15 text-foreground border-foreground/30 hover:bg-foreground/25",
  };

  return (
    <div>
      <SakuraBg count={12} />
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* Page Header */}
          <PageHeader
            title="AI Shadowing 🎤"
            subtitle="Practice Japanese pronunciation with AI feedback"
          />

          {/* ── PRACTICE AREA — shown when a conversation is selected ─────── */}
          {isPracticing && selectedTopic && selectedConv && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Breadcrumb / back navigation */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleBackToConversations}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:shadow transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">{selectedTopic.emoji}</span>
                  <div>
                    <h2 className="font-bold text-sm text-foreground leading-tight">{selectedConv.title}</h2>
                    <p className="text-[10px] text-muted-foreground">{selectedTopic.label} · {selectedTopic.level}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getLevelBadge(selectedTopic.level)}`}>
                  {selectedTopic.level}
                </span>
              </div>

              {/* Lesson Info bar */}
              <div className="mb-4 p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-hero grid place-items-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground text-sm">{selectedConv.title}</div>
                    <div className="text-xs text-muted-foreground">{selectedTopic.description}</div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right hidden sm:block">
                    <div className="font-semibold text-foreground">{unlocked} / {sentences.length}</div>
                    <div>cleared</div>
                  </div>
                </div>
              </div>

              {/* Main practice grid */}
              <div className="grid lg:grid-cols-3 gap-5">
                {/* Left / Main column */}
                <div className="lg:col-span-2 rounded-2xl bg-card border border-border/50 overflow-hidden">
                  {/* Sentence area */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      Sentence {idx + 1} of {sentences.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Progress: {unlocked} / {sentences.length} cleared
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <div className="rounded-2xl bg-gradient-sakura p-5 sm:p-6 mt-1">
                      <div className="text-3xl sm:text-4xl font-display font-extrabold leading-tight text-foreground">
                        {currentSentence.jp}
                      </div>
                      <div className="text-muted-foreground mt-2 text-sm">
                        {currentSentence.romaji}
                      </div>
                      <div className="text-sm mt-1 text-muted-foreground/80">
                        "{currentSentence.en}"
                      </div>
                      <button className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/20 text-sm font-semibold text-foreground hover:bg-white/90 dark:hover:bg-white/30 transition">
                        <Volume2 className="w-4 h-4" /> Play native audio
                      </button>
                    </div>

                    {/* Record button */}
                    <div className="mt-6 flex flex-col items-center">
                      <motion.button
                        onClick={() => {
                          if (recording) stopRecording();
                          else { setRecording(true); setResult(null); }
                        }}
                        animate={recording ? { scale: [1, 1.08, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className={`w-24 h-24 rounded-full grid place-items-center text-white transition-all ${
                          recording ? "bg-jp-red shadow-lg shadow-jp-red/40 dark:shadow-jp-red/60" : "bg-gradient-hero shadow-xl shadow-primary/30 dark:shadow-primary/50"
                        }`}
                      >
                        {recording
                          ? <Square className="w-8 h-8" />
                          : <Mic className="w-10 h-10" />
                        }
                      </motion.button>
                      <div className="text-xs text-muted-foreground mt-2">
                        {recording ? "Recording… tap to stop" : "Tap to record"}
                      </div>
                    </div>

                    {/* Prev / Next buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <button
                        disabled={idx === 0}
                        onClick={() => { setIdx(i => i - 1); setResult(null); }}
                        className="px-4 py-3 rounded-xl bg-card border border-border/50 font-semibold text-sm text-muted-foreground hover:shadow transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        disabled={!result?.passed}
                        onClick={handleNext}
                        className="px-4 py-3 rounded-xl bg-gradient-hero text-white font-semibold text-sm shadow hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {!result?.passed && <Lock className="w-4 h-4" />}
                        Next sentence
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right / Feedback column */}
                <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/50">
                    <h2 className="font-display font-bold text-base text-foreground">AI Feedback</h2>
                  </div>

                  <div className="p-5">
                    {!result ? (
                      <div className="text-sm text-muted-foreground py-10 text-center">
                        Record the sentence to see your pronunciation analysis.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Score */}
                        <div className={`p-3 rounded-xl text-center font-display font-extrabold text-3xl ${
                          result.passed ? "bg-primary/15 text-primary" : "bg-jp-red/15 text-jp-red"
                        }`}>
                          {result.pron}
                          <span className="text-base text-muted-foreground">/100</span>
                          <div className="text-xs font-normal mt-1">
                            {result.passed ? "Passed ✓" : "Try again — aim for 80+"}
                          </div>
                        </div>

                        {/* Sub-scores */}
                        {([
                          ["Pronunciation", result.pron],
                          ["Fluency", result.flu],
                          ["Intonation", result.into],
                          ["Confidence", result.conf],
                        ] as [string, number][]).map(([k, v]) => (
                          <div key={k}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-foreground">{k}</span>
                              <span className="font-semibold">{v}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-hero" style={{ width: `${v}%` }} />
                            </div>
                          </div>
                        ))}

                        {/* Error hint */}
                        {!result.passed && (
                          <div className="p-3 rounded-xl bg-primary/10 text-xs flex gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>AI: Your pitch dropped on the final syllable. Try keeping a slight rising tone on です.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progress dots */}
                    <div className="mt-5 pt-4 border-t border-border/50">
                      <div className="text-xs text-muted-foreground mb-2">Progress</div>
                      <div className="flex gap-1.5">
                        {sentences.map((_, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-2 rounded-full transition-all ${
                              passedIds.has(sentences[i].id)
                                ? "bg-gradient-hero"
                                : i === idx
                                  ? "bg-primary/40"
                                  : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      {unlocked === sentences.length && (
                        <div className="mt-2 text-xs text-primary font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />All sentences cleared!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ALL CONVERSATIONS LIST ───────────────────────────────────── */}
          {!isPracticing && (
            <motion.div
              key="all-convs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Search bar + All Topics dropdown */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search lessons, descriptions..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* N5–N1 filter chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {ALL_LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        levelFilter === lvl
                          ? LEVEL_COLORS[lvl]
                          : "bg-card text-muted-foreground border-border/50 hover:bg-muted/50"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                {/* All Topics dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-semibold text-foreground hover:bg-muted/50 transition"
                  >
                    {selectedTopic ? (
                      <>
                        <span>{selectedTopic.emoji}</span>
                        <span>{selectedTopic.label}</span>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedTopic(null); }}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>All Topics <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} /></>
                    )}
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-card/80 dark:bg-slate-900/90 backdrop-blur-sm border border-border/50 shadow-xl z-20 overflow-hidden py-1"
                      >
                        <button
                          onClick={() => { setSelectedTopic(null); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/60 dark:hover:bg-white/10 hover:text-foreground transition"
                        >
                          All Topics
                        </button>
                        {shadowingTopics.map(topic => (
                          <button
                            key={topic.id}
                            onClick={() => { setSelectedTopic(topic); setDropdownOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/60 dark:hover:bg-white/10 hover:text-foreground transition ${selectedTopic?.id === topic.id ? "bg-muted/60 dark:bg-white/5 text-foreground font-semibold" : "text-muted-foreground"}`}
                          >
                            <span>{topic.emoji}</span>
                            <span>{topic.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Results count */}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {filteredConvs.length} lesson{filteredConvs.length !== 1 ? "s" : ""} found
                </span>
                {(search || levelFilter || selectedTopic) && (
                  <button
                    onClick={() => { setSearch(""); setLevelFilter(null); setSelectedTopic(null); }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>

              {/* Conversation list */}
              {filteredConvs.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No lessons found</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedTopic
                    ? filteredConvs.filter(({ topic }) => topic.id === selectedTopic.id)
                    : filteredConvs
                  ).map(({ topic, conv }, i) => {
                    const status = getConvStatus(topic.id, conv);
                    const { label: statusLabel, cls: statusCls } = getConvStatusBadge(status);
                    const progress = convProgress[`${topic.id}::${conv.id}`];
                    const passed = progress?.size ?? 0;
                    const pct = conv.sentences.length > 0 ? (passed / conv.sentences.length) * 100 : 0;

                    return (
                      <motion.div
                        key={`${topic.id}::${conv.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      >
                        <button
                          onClick={() => handleSelectFromList(topic, conv)}
                          className="w-full text-left rounded-2xl p-4 border bg-card hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                              status === "completed"
                                ? "bg-gradient-to-br from-green-400 to-emerald-500"
                                : status === "in_progress"
                                  ? "bg-gradient-to-br from-amber-400 to-orange-400"
                                  : "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
                            }`}>
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-bold text-sm text-foreground">{conv.title}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getLevelBadge(topic.level)}`}>
                                  {topic.level}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls}`}>
                                  {statusLabel}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                                  {topic.emoji} {topic.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span>{conv.sentences.length} sentences</span>
                                {status === "in_progress" && (
                                  <span className="text-amber-500 font-semibold">{passed}/{conv.sentences.length}</span>
                                )}
                              </div>
                              {/* Mini progress bar */}
                              {status !== "not_started" && (
                                <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${status === "completed" ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-hero"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
