import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Activity, TrendingUp, Users, BookOpen, ClipboardCheck,
  GraduationCap, Headphones, Mic, BarChart3, Download, Calendar,
  FileSpreadsheet, FileJson, FileText, X, CheckCircle, ChevronDown,
  TrendingDown, Database, Filter
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid
} from "recharts";

const analyticsData = [
  { week: "W1", vocabulary: 820, grammar: 640, listening: 420, shadowing: 280 },
  { week: "W2", vocabulary: 940, grammar: 720, listening: 480, shadowing: 320 },
  { week: "W3", vocabulary: 880, grammar: 680, listening: 510, shadowing: 360 },
  { week: "W4", vocabulary: 1020, grammar: 780, listening: 590, shadowing: 410 },
];

const jlptBreakdown = [
  { level: "N5", students: 3240, completion: 78 },
  { level: "N4", students: 2680, completion: 65 },
  { level: "N3", students: 1840, completion: 58 },
  { level: "N2", students: 820, completion: 42 },
  { level: "N1", students: 280, completion: 25 },
];

// ─── Export Modal ──────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "All time", value: "all" },
];

const DATA_TYPES = [
  { id: "overview", label: "Overview Stats", desc: "Pages/session, bounce rate, return rate", checked: true },
  { id: "engagement", label: "Content Engagement", desc: "Vocabulary, grammar, listening, shadowing", checked: true },
  { id: "jlpt", label: "JLPT Distribution", desc: "Level breakdown and completion rates", checked: true },
  { id: "users", label: "User Activity", desc: "Active users, new signups, retention", checked: false },
  { id: "exams", label: "Exam Performance", desc: "Scores, pass rates, attempts", checked: false },
];

const FORMAT_OPTIONS = [
  { id: "csv", label: "CSV", icon: FileSpreadsheet, color: "text-[var(--status-active)]", desc: "Spreadsheet compatible" },
  { id: "json", label: "JSON", icon: FileJson, color: "text-[var(--status-pending)]", desc: "Developer friendly" },
  { id: "pdf", label: "PDF Report", icon: FileText, color: "text-[var(--status-rejected)]", desc: "Formatted report", disabled: true },
];

function ExportModal({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState("csv");
  const [dateRange, setDateRange] = useState("30d");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(DATA_TYPES.filter(d => d.checked).map(d => d.id));
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const toggleType = (id: string) => {
    setSelectedTypes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedTypes.length === 0) return;
    setDownloading(true);
    await new Promise(r => setTimeout(r, 1500));
    setDownloading(false);
    setDone(true);
    await new Promise(r => setTimeout(r, 1200));
    onClose();
  };

  const selectedDate = DATE_RANGES.find(d => d.value === dateRange);
  const selectedFormat = FORMAT_OPTIONS.find(f => f.id === format);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 overlay-dark" onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-lg glass-modal rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center">
              <Download className="w-4 h-4 text-[var(--status-active)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-col text-base">Export Analytics Data</h3>
              <p className="text-[10px] text-muted-col">Download your platform statistics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-auto">

          {/* Format */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2.5">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => !opt.disabled && setFormat(opt.id)}
                    disabled={opt.disabled}
                    className={`relative p-3 rounded-xl border text-left transition ${
                      format === opt.id
                        ? "bg-primary/10 border-primary/30"
                        : opt.disabled
                        ? "glass-surface border-glass-border opacity-40 cursor-not-allowed"
                        : "glass-surface border-glass-border hover:border-primary/20"
                    }`}
                  >
                    {format === opt.id && (
                      <CheckCircle className="absolute top-2 right-2 w-3.5 h-3.5 text-primary" />
                    )}
                    <Icon className={`w-5 h-5 mb-2 ${opt.disabled ? "text-muted-col" : opt.color}`} />
                    <p className={`text-xs font-bold ${opt.disabled ? "text-muted-col" : "text-primary-col"}`}>{opt.label}</p>
                    <p className="text-[10px] text-muted-col mt-0.5">{opt.desc}</p>
                    {opt.disabled && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] text-muted-col glass-surface px-1.5 py-0.5 rounded">Soon</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2.5">
              Date Range
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DATE_RANGES.map(range => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                    dateRange === range.value
                      ? "bg-primary/12 text-primary border-primary/30"
                      : "glass-surface text-secondary-col"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-col mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Exporting data for: <span className="text-secondary-col">{selectedDate?.label}</span>
            </p>
          </div>

          {/* Data Types */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2.5">
              Data to Include
            </label>
            <div className="space-y-2">
              {DATA_TYPES.map(dt => (
                <button
                  key={dt.id}
                  onClick={() => toggleType(dt.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                    selectedTypes.includes(dt.id)
                      ? "bg-primary/8 border-primary/20"
                      : "glass-surface border-glass-border hover:border-primary/15"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition ${
                    selectedTypes.includes(dt.id)
                      ? "bg-primary border-primary"
                      : "border-[var(--border)]"
                  }`}>
                    {selectedTypes.includes(dt.id) && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${selectedTypes.includes(dt.id) ? "text-primary-col" : "text-secondary-col"}`}>{dt.label}</p>
                    <p className="text-[10px] text-muted-col">{dt.desc}</p>
                  </div>
                  {dt.id === "overview" && <span className="text-[9px] bg-[var(--status-active)]/12 text-[var(--status-active)] px-1.5 py-0.5 rounded font-bold">Active</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Preview info */}
          <div className="p-3 rounded-xl glass-surface">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-3.5 h-3.5 text-secondary-col" />
              <span className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">Export Summary</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-lg font-black text-primary-col">{selectedTypes.length}</p>
                <p className="text-[10px] text-muted-col">datasets</p>
              </div>
              <div className="text-center border-x border-[var(--border)]">
                <p className="text-lg font-black text-primary-col">{format.toUpperCase()}</p>
                <p className="text-[10px] text-muted-col">format</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-primary-col">~{Math.round(selectedTypes.length * 0.3)} MB</p>
                <p className="text-[10px] text-muted-col">estimated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedTypes.length === 0 || downloading || done}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed ${
              done
                ? "bg-[var(--status-active)]/12 text-[var(--status-active)] border-[var(--status-active)]/20"
                : "bg-[var(--status-active)]/12 text-[var(--status-active)] border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20"
            }`}
          >
            {done ? (
              <><CheckCircle className="w-4 h-4" /> Downloaded!</>
            ) : downloading ? (
              <><motion.div className="w-4 h-4 border-2 border-[var(--status-active)]/30 border-t-[var(--status-active)] rounded-full animate-spin" /> Preparing...</>
            ) : (
              <><Download className="w-4 h-4" /> Export {selectedFormat?.label}</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export const Route = createFileRoute("/admin/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Analytics</h1>
          <p className="text-sm text-secondary-col mt-0.5">Engagement, retention and content performance</p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card text-secondary-col text-sm font-semibold hover:border-primary/30 hover:text-primary transition"
        >
          <Download className="w-4 h-4" /> Export Data
        </button>
      </div>

      {/* Engagement by content type */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-sm text-primary-col flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Content Engagement by Type
          </h2>
          <div className="flex gap-3 text-[10px] text-secondary-col">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[oklch(0.62_0.18_270)]" /> Vocabulary</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.15_230)]" /> Grammar</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.18_340)]" /> Listening</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[oklch(0.6_0.22_25)]" /> Shadowing</span>
          </div>
        </div>
        <div className="h-[260px] min-h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#F3F4F6", backdropFilter: "blur(12px)" }} />
              <Bar dataKey="vocabulary" fill="oklch(0.62 0.18 270)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="grammar" fill="oklch(0.72 0.15 230)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="listening" fill="oklch(0.72 0.18 340)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="shadowing" fill="oklch(0.6 0.22 25)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* JLPT breakdown */}
      <div className="card-base p-5">
        <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          JLPT Level Distribution & Completion
        </h2>
        <div className="space-y-3">
          {jlptBreakdown.map(item => (
            <div key={item.level} className="flex items-center gap-4">
              <div className="w-10 text-center">
                <span className={`text-sm font-black ${
                  item.level === "N5" ? "text-[oklch(0.62_0.18_270)]" :
                  item.level === "N4" ? "text-[oklch(0.72_0.15_230)]" :
                  item.level === "N3" ? "text-[var(--status-pending)]" :
                  item.level === "N2" ? "text-[oklch(0.6_0.22_25)]" : "text-[var(--status-rejected)]"
                }`}>{item.level}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-secondary-col">{item.students.toLocaleString()} students</span>
                  <span className="text-primary-col font-bold">{item.completion}%</span>
                </div>
                <div className="h-2 glass-surface rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.completion}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${
                      item.level === "N5" ? "bg-[oklch(0.62_0.18_270)]" :
                      item.level === "N4" ? "bg-[oklch(0.72_0.15_230)]" :
                      item.level === "N3" ? "bg-[var(--status-pending)]" :
                      item.level === "N2" ? "bg-[oklch(0.6_0.22_25)]" : "bg-[var(--status-rejected)]"
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Pages/Session", value: "8.4", icon: BookOpen, color: "text-primary" },
          { label: "Completion Rate", value: "72%", icon: Activity, color: "text-[var(--status-active)]" },
          { label: "Bounce Rate", value: "28%", icon: TrendingUp, color: "text-[var(--status-pending)]" },
          { label: "Return Rate", value: "84%", icon: Users, color: "text-[var(--status-teacher)]" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-base p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg glass-surface flex items-center justify-center">
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{stat.label}</span>
              </div>
              <div className="font-display font-black text-xl text-primary-col">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
