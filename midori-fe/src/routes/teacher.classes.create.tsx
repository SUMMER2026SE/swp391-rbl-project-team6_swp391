import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, BookOpen, Users, CalendarDays, Hash, ScrollText, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MOCK_CLASSES, type TeacherClass } from "@/data/teacher-classes";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
type Level = typeof LEVELS[number];
type Status = "Draft" | "Active";

export const Route = createFileRoute("/teacher/classes/create")({
  component: TeacherCreateClassPage,
});

function TeacherCreateClassPage() {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Level | "">("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [status, setStatus] = useState<Status>("Draft");
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Class name is required.";
    if (!level) e.level = "Please select a level for this class.";
    const duplicate = MOCK_CLASSES.find(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
        && c.level === level
        && c.status === "Active"
    );
    if (name.trim() && level && duplicate) {
      e.name = "An active class with this name and level already exists.";
    }
    return e;
  }, [name, level]);

  const isValid = name.trim() !== "" && level !== "" && Object.keys(errors).length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitted(true);
  };

  // Success state
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            to="/teacher/classes"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Classes
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card text-card-foreground border border-border/50 rounded-2xl p-8 shadow-sm text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-lg text-foreground mb-1">Class Created</h2>
          <p className="text-sm text-muted-foreground mb-5">
            <span className="font-semibold text-foreground">{name}</span> ({level}) has been created as <span className="font-semibold">{status}</span>.
          </p>
          <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
            You can now invite students by Gmail. Students must accept the invitation before they can join and see lessons.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to={`/teacher/classes/${name.toLowerCase().replace(/\s+/g, "-")}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition"
            >
              View Class
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/teacher/classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
            >
              Back to My Classes
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/teacher/classes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Classes
        </Link>
        <h1 className="text-2xl font-display font-black text-foreground">Create Class</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create a new class and assign its required level.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Class Name */}
        <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
              <BookOpen className="w-4 h-4 text-primary/60" />
              Class Name
              <span className="text-[var(--jp-red)]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. N5 Beginner A"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl bg-white/95 border text-sm outline-none transition-all",
                "bg-white/95 border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200",
                "focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm",
                errors.name && "border-[var(--jp-red)] focus:ring-[var(--jp-red)]/30"
              )}
            />
            <AnimatePresence mode="wait">
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-[var(--jp-red)] mt-1.5 font-medium"
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Level (Required) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
              <ScrollText className="w-4 h-4 text-primary/60" />
              JLPT Level
              <span className="text-[var(--jp-red)]">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Class level is required and will be used to filter lessons, homework, exams and Data Bank content.
            </p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevel(lv)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                    level === lv
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                      : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                  )}
                >
                  {lv}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {errors.level && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-[var(--jp-red)] mt-2 font-medium"
                >
                  {errors.level}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
              <ScrollText className="w-4 h-4 text-primary/60" />
              Description
              <span className="text-[10px] text-muted-col font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of this class…"
              className="w-full px-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm resize-none"
            />
          </div>
        </div>

        {/* Schedule + Dates */}
        <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Schedule */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
                <CalendarDays className="w-4 h-4 text-primary/60" />
                Schedule
                <span className="text-[10px] text-muted-col font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Mon / Wed / Fri"
                className="w-full px-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
              />
            </div>

            {/* Max Students */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
                <Users className="w-4 h-4 text-primary/60" />
                Max Students
                <span className="text-[10px] text-muted-col font-normal">(optional)</span>
              </label>
              <input
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                min={1}
                placeholder="e.g. 30"
                className="w-full px-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
                <CalendarDays className="w-4 h-4 text-primary/60" />
                Start Date
                <span className="text-[10px] text-muted-col font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
                <CalendarDays className="w-4 h-4 text-primary/60" />
                End Date
                <span className="text-[10px] text-muted-col font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
              />
            </div>
          </div>

          {/* Status toggle */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Initial Status</label>
            <div className="flex gap-2">
              {(["Draft", "Active"] as Status[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                    status === s
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                      : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/teacher/classes"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!isValid}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Class
          </button>
        </div>
      </form>
    </div>
  );
}
