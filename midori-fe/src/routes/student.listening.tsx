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
            subtitle="Chọn bài nghe, luyện nghe và kiểm tra bản dịch."
          />

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 w-fit">
            <TabButton
              active={activeTab === "select"}
              onClick={() => setActiveTab("select")}
              icon={<ListChecks className="w-4 h-4" />}
              label="Chọn bài"
            />
            <TabButton
              active={activeTab === "practice"}
              onClick={() => setActiveTab("practice")}
              icon={<PenLine className="w-4 h-4" />}
              label="Luyện nghe"
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
                  { label: "Tổng bài", value: statsTotal, icon: ListChecks, color: "text-blue-500" },
                  { label: "Đã luyện", value: statsPracticed, icon: CheckCircle2, color: "text-green-500" },
                  { label: "Điểm TB", value: statsAvg, icon: Sparkles, color: "text-purple-500" },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl bg-current/10 flex items-center justify-center ${stat.color}`}>
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
                      className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                        isActive
                          ? "bg-gradient-to-r from-blue-400 to-pink-400 text-white shadow-md"
                          : "bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>

              {/* Exercise List */}
              <div className="space-y-3">
                {paginatedExercises.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50">
                    <Headphones className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">Chưa có bài nghe nào</p>
                    <p className="text-xs text-muted-foreground mt-1">Các bài nghe sẽ xuất hiện ở đây.</p>
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
                          className={`w-full text-left rounded-2xl p-4 transition-all border ${
                            isSelected
                              ? "bg-white dark:bg-slate-800 border-primary/40 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                              : "bg-white/80 dark:bg-slate-800/80 border-white/50 dark:border-slate-700/50 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Level badge */}
                            <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${isSelected ? "bg-gradient-hero text-white shadow-md" : "bg-slate-100 dark:bg-slate-700"}`}>
                              <span className={`font-display font-black text-base ${isSelected ? "text-white" : ""}`}>{ex.level}</span>
                              <span className={`text-[8px] font-semibold ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>JLPT</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-display font-bold text-base text-slate-800 dark:text-white truncate">
                                  {ex.title}
                                </h3>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0">
                                    Đang chọn
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Headphones className="w-3 h-3" />
                                  {ex.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ListChecks className="w-3 h-3" />
                                  Dictation
                                </span>
                                {ex.transcript && (
                                  <span className="flex items-center gap-1 text-green-500">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Có transcript
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition ${
                              isSelected ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-700 text-muted-foreground"
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
                    Vui lòng chọn bài nghe trước khi luyện tập.
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Chuyển sang tab <strong>"Chọn bài"</strong> để chọn một bài nghe phù hợp với trình độ của bạn.
                  </p>
                  <button
                    onClick={() => setActiveTab("select")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition"
                  >
                    <ListChecks className="w-4 h-4" /> Chọn bài nghe
                  </button>
                </div>
              ) : (
                /* Practice mode */
                <div className="space-y-4">
                  {/* Audio Player Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-white shadow-xl shadow-purple-200/20 dark:shadow-none">
                    <div className="flex items-center gap-4">
                      {/* Play button */}
                      <button
                        onClick={() => setPlaying(p => !p)}
                        className="w-16 h-16 rounded-full bg-white text-primary grid place-items-center shadow-xl flex-shrink-0 hover:scale-105 transition-transform"
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

                        {/* Simulated waveform */}
                        <div className="flex items-end gap-0.5 h-8 mb-1">
                          {Array.from({ length: 40 }).map((_, wi) => (
                            <div
                              key={wi}
                              className={`flex-1 rounded-full transition-all ${playing ? "bg-white" : "bg-white/40"}`}
                              style={{
                                height: `${20 + Math.sin(wi * 0.4) * 25 + Math.random() * 15}%`,
                                minHeight: "3px",
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-white/60">
                          <span>{playing ? "0:42" : "0:00"}</span>
                          <span>{selectedEx.duration}</span>
                        </div>
                      </div>

                      {/* Replay */}
                      <button
                        onClick={() => { setPlaying(false); setTimeout(() => setPlaying(true), 100); }}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition flex-shrink-0"
                        title="Phát lại"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Transcription Card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                    {/* Card Header */}
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                      <h3 className="font-display font-bold text-sm">Transcription</h3>
                      <p className="text-[10px] text-muted-foreground">Nghe và gõ lại câu bằng tiếng Nhật</p>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Textarea */}
                      <div>
                        <textarea
                          value={answer}
                          onChange={e => { setAnswer(e.target.value); setChecked(false); }}
                          rows={4}
                          placeholder="日本語でタイプしてください..."
                          className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-primary/40 text-lg font-display text-slate-800 dark:text-white resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>

                      {/* Result feedback — no answer reveal */}
                      {checked && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-2xl border ${
                            correct
                              ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                              : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                          }`}
                        >
                          <div className={`flex items-center gap-2 font-bold text-sm ${
                            correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {correct ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            {correct ? "Chính xác! Tuyệt vời!" : "Chưa đúng — Hãy thử lại!"}
                          </div>

                          {!correct && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl">
                              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-primary">AI Gợi ý: </span>
                                Hãy chú ý đến các particle như を, は, が. Thử nghe lại từ từ từng câu một.
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleRetry}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                        >
                          <RotateCcw className="w-4 h-4" /> Retry
                        </button>
                        <button
                          onClick={() => setChecked(true)}
                          disabled={!answer.trim()}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-hero text-white font-bold text-sm shadow hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Check className="w-4 h-4" /> Check answer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Back to select hint */}
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>Muốn đổi bài?</span>
                    <button
                      onClick={() => setActiveTab("select")}
                      className="text-primary font-semibold hover:underline"
                    >
                      Quay lại Chọn bài
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
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? "bg-gradient-hero text-white shadow-md"
          : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-700/50"
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-xl bg-gradient-hero -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
