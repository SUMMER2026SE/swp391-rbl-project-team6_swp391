import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { listeningExercises } from "@/lib/mock-data";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Play, Pause, RotateCcw, Sparkles, CheckCircle2, XCircle,
  Headphones, ListChecks, PenLine, Check, ChevronRight, ChevronLeft,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";

type Tab = "select" | "practice";
type JLPTLevel = "All" | "N5" | "N4" | "N3" | "N2" | "N1";

const JLPT_LEVELS: JLPTLevel[] = ["All", "N5", "N4", "N3", "N2", "N1"];

const ITEMS_PER_PAGE = 5;

function getLevelBadge(level: string) {
  const c: Record<string, string> = {
    N5: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
    N4: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300",
    N3: "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300",
    N2: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300",
    N1: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300",
  };
  return c[level] ?? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300";
}

function getLevelBoxStyle(level: string, isSelected: boolean) {
  if (isSelected) return "bg-gradient-hero text-white shadow-md";
  const styles: Record<string, string> = {
    N5: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200",
    N4: "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200",
    N3: "bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-200",
    N2: "bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-200",
    N1: "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200",
  };
  return styles[level] ?? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
}

export const Route = createFileRoute("/student/listening")({ component: Listening });

function Listening() {
  const [activeTab, setActiveTab] = useState<Tab>("select");
  const [selectedEx, setSelectedEx] = useState<typeof listeningExercises[0] | null>(
    listeningExercises.length > 0 ? listeningExercises[0] : null
  );
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(false);

  const [levelFilter, setLevelFilter] = useState<JLPTLevel>("All");
  const [page, setPage] = useState(1);

  const isLoading = false;
  const error: string | null = null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
        <p className="text-muted-foreground text-sm">Loading listening exercises...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-red-500 mb-3 text-2xl">⚠️</div>
        <p className="text-red-500 font-medium text-sm">Unable to load listening data. Please try again later.</p>
      </div>
    );
  }

  const correct = answer.replace(/\s/g, "") === (selectedEx?.transcript ?? "").replace(/\s/g, "");

  const filteredExercises = useMemo(() => {
    if (levelFilter === "All") return listeningExercises;
    return listeningExercises.filter(ex => ex.level === levelFilter);
  }, [levelFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedExercises = filteredExercises.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSelectLevel = (level: JLPTLevel) => {
    setLevelFilter(level);
    setPage(1);
  };

  const handleSelectExercise = (ex: typeof listeningExercises[0]) => {
    setSelectedEx(ex);
    setAnswer("");
    setChecked(false);
    setActiveTab("practice");
  };

  const handleRetry = () => {
    setAnswer("");
    setChecked(false);
    setPlaying(false);
  };

  const statsTotal = filteredExercises.length;
  const statsPracticed = 3;
  const statsAvg = "82%";

  return (
    <div>
      <SakuraBg count={14} />
      <div className="relative z-10 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* Page Header */}
          <PageHeader
            title="Listening Dictation"
            subtitle="Choose a listening exercise, practice listening, and check your answer."
            action={
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-sm">
                Demo
              </span>
            }
          />

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/55 dark:bg-white/[0.04] backdrop-blur-md border border-white/70 dark:border-white/10 w-fit shadow-sm">
            <TabButton
              active={activeTab === "select"}
              onClick={() => setActiveTab("select")}
              icon={<ListChecks className="w-4 h-4" />}
              label="Select exercise"
            />
            <TabButton
              active={activeTab === "practice"}
              onClick={() => setActiveTab("practice")}
              icon={<PenLine className="w-4 h-4" />}
              label="Practice listening"
            />
          </div>

          {/* TAB CONTENT */}
          {activeTab === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Total exercises", value: statsTotal, icon: ListChecks, color: "text-blue-500", gradient: "from-blue-50/90 to-white/80 dark:from-blue-950/30 dark:to-slate-900/70", iconBg: "bg-blue-500/10 text-blue-500" },
                  { label: "Practiced", value: statsPracticed, icon: CheckCircle2, color: "text-emerald-500", gradient: "from-emerald-50/90 to-white/80 dark:from-emerald-950/30 dark:to-slate-900/70", iconBg: "bg-emerald-500/10 text-emerald-500" },
                  { label: "Avg score", value: statsAvg, icon: Sparkles, color: "text-violet-500", gradient: "from-violet-50/90 to-pink-50/60 dark:from-violet-950/30 dark:to-slate-900/70", iconBg: "bg-violet-500/10 text-violet-500" },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br ${stat.gradient} dark:bg-gradient-to-br border border-white/70 dark:border-white/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`font-display font-black text-lg leading-none ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* JLPT Level Filter */}
              <div className="flex gap-2 flex-wrap mb-5">
                {JLPT_LEVELS.map(level => {
                  const isActive = levelFilter === level;
                  return (
                    <button
                      key={level}
                      onClick={() => handleSelectLevel(level)}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md shadow-primary/15 ring-1 ring-white/60 dark:ring-white/10"
                          : "bg-white/60 dark:bg-white/[0.04] border border-white/70 dark:border-white/10 shadow-sm text-muted-foreground hover:bg-white/90 dark:hover:bg-white/[0.08] hover:text-foreground hover:-translate-y-0.5 hover:shadow-sm"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>

              {/* Exercise List */}
              <div className="rounded-[2rem] bg-white/40 dark:bg-white/[0.03] border border-white/60 dark:border-white/10 backdrop-blur-xl shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-1">
                  <p className="text-sm font-semibold text-foreground/70">Choose a listening exercise</p>
                </div>
                <div className="p-3 sm:p-4 space-y-2">
                {paginatedExercises.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50">
                    <Headphones className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">No listening exercises available.</p>
                    <p className="text-xs text-muted-foreground mt-1">Listening exercises will appear here.</p>
                  </div>
                ) : (
                  paginatedExercises.map((ex, i) => {
                    const isSelected = selectedEx?.id === ex.id;
                    return (
                      <motion.div
                        key={ex.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <button
                          onClick={() => handleSelectExercise(ex)}
                          className={`w-full text-left rounded-2xl p-3 sm:p-4 transition-all duration-200 border ${
                            isSelected
                              ? "bg-gradient-to-r from-blue-50/95 via-white/90 to-pink-50/90 dark:from-blue-950/35 dark:via-slate-900/80 dark:to-pink-950/30 border-primary/25 dark:border-primary/30 shadow-lg shadow-primary/10 ring-1 ring-primary/15 dark:ring-primary/20"
                              : "bg-white/85 dark:bg-slate-800/85 backdrop-blur-sm border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-white/98 dark:hover:bg-slate-800/98 dark:hover:border-white/15 hover:border-primary/25 dark:hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Level badge */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${isSelected ? "bg-gradient-hero text-white shadow-md shadow-primary/25" : `${getLevelBoxStyle(ex.level, false)} shadow-sm ring-1 ring-white/60 dark:ring-white/10`}`}>
                              <span className="font-display font-black text-sm">{ex.level}</span>
                              <span className="text-[7px] font-semibold opacity-60">JLPT</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-display font-bold text-base text-foreground dark:text-white truncate pr-2">
                                  {ex.title}
                                </h3>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-[10px] font-bold flex-shrink-0">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/[0.07] dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 font-medium">
                                  <Headphones className="w-3 h-3" />
                                  {ex.duration}
                                </span>
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/[0.07] dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 font-medium">
                                  <ListChecks className="w-3 h-3" />
                                  Dictation
                                </span>
                                {ex.transcript && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/[0.07] dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-medium">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Transcript
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition ${
                              isSelected ? "bg-primary text-white shadow-sm" : "bg-slate-100/80 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-400 text-muted-foreground"
                            }`}>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Selected indicator bar */}
                          {isSelected && (
                            <motion.div
                              layoutId="selectedBar"
                              className="h-1 mt-3 rounded-full bg-gradient-hero"
                            />
                          )}
                        </button>
                      </motion.div>
                    );
                  })
                )}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-5 pb-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        p === safePage
                          ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md"
                          : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "practice" && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {selectedEx === null ? (
                /* No exercise selected */
                <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 via-pink-500/10 to-purple-500/10 dark:from-blue-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border border-white/50 dark:border-slate-700/50 p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/80 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Headphones className="w-10 h-10 text-primary opacity-60" />
                  </div>
                  <h3 className="font-display font-black text-xl text-slate-800 dark:text-white mb-2">
                    Please select a listening exercise first.
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Go to the <strong>"Select exercise"</strong> tab to choose a listening exercise that matches your level.
                  </p>
                  <button
                    onClick={() => setActiveTab("select")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition"
                  >
                    <ListChecks className="w-4 h-4" /> Select exercise
                  </button>
                </div>
              ) : (
                /* Practice mode */
                <div className="space-y-4">
                  {/* Audio Player Card */}
                  <div className="relative rounded-2xl overflow-hidden p-6 shadow-xl shadow-indigo-500/[0.07] dark:shadow-black/15">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-500 to-pink-400 dark:from-indigo-800/85 dark:via-violet-800/80 dark:to-pink-700/75" />
                    {/* Decorative overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(255,255,255,0.22),transparent_35%),radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.09),transparent_30%),radial-gradient(ellipse_at_50%_100%,rgba(139,92,246,0.15),transparent_40%)]" />
                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-4 text-white">
                      {/* Play button */}
                      <button
                        onClick={() => setPlaying(p => !p)}
                        className="w-16 h-16 rounded-full bg-white text-indigo-600 grid place-items-center shadow-xl shadow-black/10 flex-shrink-0 hover:scale-105 active:scale-95 transition-transform"
                      >
                        {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                      </button>

                      {/* Track info + waveform */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-sm`}>
                            {selectedEx.level}
                          </span>
                          <span className="text-xs text-white/70">Dictation</span>
                        </div>
                        <div className="font-display font-bold text-xl leading-tight mb-3">{selectedEx.title}</div>

                        <div className="flex items-end gap-0.5 h-8 mb-1">
                          {Array.from({ length: 40 }).map((_, wi) => {
                            const raw = 20 + Math.abs(Math.sin(wi * 0.75)) * 46 + Math.abs(Math.cos(wi * 0.38)) * 20;
                            const height = Math.min(90, Math.max(20, raw));
                            return (
                              <div
                                key={wi}
                                className={`flex-1 rounded-full transition-all ${playing ? "bg-white" : "bg-white/60"}`}
                                style={{ height: `${height}%`, minHeight: "3px" }}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-white/75">
                          <span>0:00</span>
                          <span>{selectedEx.duration}</span>
                        </div>
                      </div>

                      {/* Replay */}
                      <button
                        onClick={() => { setPlaying(false); setTimeout(() => setPlaying(true), 100); }}
                        className="p-3 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm transition flex-shrink-0"
                        title="Replay"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Transcription Card */}
                  <div className="rounded-2xl border border-border/60 bg-card/80 dark:bg-slate-800/90 shadow-sm overflow-hidden backdrop-blur-sm">
                    {/* Card Header */}
                    <div className="px-5 py-3 border-b border-border/60 dark:border-slate-700">
                      <h3 className="font-display font-bold text-sm text-foreground">Transcription</h3>
                      <p className="text-[10px] text-muted-foreground">Listen and type the sentence in Japanese</p>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Textarea */}
                      <div>
                        <textarea
                          value={answer}
                          onChange={e => { setAnswer(e.target.value); setChecked(false); }}
                          rows={4}
                          placeholder="日本語でタイプしてください..."
                          className="w-full p-4 rounded-2xl bg-card/70 dark:bg-slate-700/50 border border-border/60 dark:border-slate-600/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 text-lg font-display text-foreground dark:text-white resize-none placeholder:text-muted-foreground/70 transition-colors"
                        />
                      </div>

                      {/* Result feedback — no answer reveal */}
                      {checked && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-2xl border ${
                            correct
                              ? "bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
                              : "bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                          }`}
                        >
                          <div className={`flex items-center gap-2 font-bold text-sm ${
                            correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {correct ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            {correct ? "Correct! Well done!" : "Not quite right — Try again!"}
                          </div>

                          {!correct && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-muted/50 dark:bg-slate-800/60 p-3 rounded-xl">
                              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-primary">AI Tip: </span>
                                Pay attention to particles like を, は, が. Try listening sentence by sentence.
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleRetry}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/[0.05] border border-border/60 dark:border-white/10 text-foreground dark:text-slate-200 font-semibold text-sm hover:bg-white dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <RotateCcw className="w-4 h-4" /> Retry
                        </button>
                        <button
                          onClick={() => setChecked(true)}
                          disabled={!answer.trim()}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-pink-500 text-white font-bold text-sm shadow-md hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Check className="w-4 h-4" /> Check answer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Back to select hint */}
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>Want to switch exercises?</span>
                    <button
                      onClick={() => setActiveTab("select")}
                      className="text-primary font-semibold hover:underline underline-offset-4 transition-all"
                    >
                      Back to exercises
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-md shadow-pink-500/15"
          : "text-muted-foreground hover:text-foreground hover:bg-white/70 dark:hover:bg-white/10"
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
