import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft, ClipboardCheck, CheckCircle2, AlertCircle, TrendingUp
} from "lucide-react";
import { PageHeader, Card, LevelBadge } from "@/components/page-ui";
import { MOCK_CLASSES } from "@/data/teacher-classes";

const SECTION_OPTIONS = ["Vocabulary", "Grammar", "Listening", "Mixed"] as const;
type Section = typeof SECTION_OPTIONS[number];

export const Route = createFileRoute("/teacher/exams/create")({
  component: CreateExamPage,
});

function CreateExamPage() {
  const [classId, setClassId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [duration, setDuration] = useState(45);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [status, setStatus] = useState<"Draft" | "Scheduled" | "Open">("Draft");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialClassId = params.get("classId");
    if (initialClassId) {
      const exists = MOCK_CLASSES.some(c => c.id === initialClassId);
      if (exists) {
        setClassId(initialClassId);
      }
    }
  }, []);

  const selectedClass = MOCK_CLASSES.find(c => c.id === classId);
  const lessonsForClass = selectedClass?.lessonList ?? [];

  const toggleSection = (section: Section) => {
    setSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!classId) errs.classId = "Please select a class.";
    if (!lessonId) errs.lessonId = "Please select a lesson.";
    if (!title.trim()) errs.title = "Exam title is required.";
    if (sections.length === 0) errs.sections = "Select at least one section.";
    if (duration <= 0) errs.duration = "Duration must be greater than 0.";
    if (attemptLimit <= 0) errs.attemptLimit = "Attempt limit must be greater than 0.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  };

  const selectedLesson = lessonsForClass.find(l => l.id === lessonId);

  if (submitted) {
    return (
      <div className="space-y-5">
        <PageHeader title="Create Exam" subtitle="Create an exam for a class." />
        <Card className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Exam draft created locally</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedClass
                ? `Exam draft created locally for ${selectedClass.name}. Backend integration will save it later.`
                : "Backend integration will save it later."}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {selectedClass && (
              <Link
                to={`/teacher/classes/${selectedClass.id}/exams`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Class Exams
              </Link>
            )}
            <Link
              to="/teacher/exams"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
            >
              Back to Exams
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setClassId(""); setLessonId(""); setTitle("");
                setDescription(""); setSections([]); setDuration(45);
                setAttemptLimit(1); setStartDate(""); setStartTime("08:00");
                setStatus("Draft");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40 transition"
            >
              Create Another
            </button>
          </div>
        </Card>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 text-center">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            This is a UI mock. Data will be saved when backend integration is available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Create Exam" subtitle="Create an exam for a class." />

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          This is a UI mock. Data will be saved when backend integration is available.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="p-6 space-y-5">
          <h2 className="font-display font-bold text-sm flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            Exam Information
          </h2>

          {/* Select Class */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Class <span className="text-[var(--jp-red)]">*</span>
            </label>
            <select
              value={classId}
              onChange={e => { setClassId(e.target.value); setLessonId(""); }}
              className="w-full px-3 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
            >
              <option value="">Select a class...</option>
              {MOCK_CLASSES.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — {cls.level}
                </option>
              ))}
            </select>
            {errors.classId && <p className="text-[10px] text-[var(--jp-red)] mt-1">{errors.classId}</p>}
          </div>

          {/* Level auto-display */}
          {selectedClass && (
            <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Level</label>
                  <LevelBadge level={selectedClass.level} />
                </div>
                <div className="w-px h-8 bg-blue-200 dark:bg-blue-700/50" />
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Class</label>
                  <p className="text-sm font-semibold text-foreground">{selectedClass.name}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-col mt-2">Level is automatically set based on the selected class. This exam will follow {selectedClass.level} curriculum.</p>
            </div>
          )}

          {/* Select Lesson */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Related Lesson <span className="text-[var(--jp-red)]">*</span>
            </label>
            <select
              value={lessonId}
              onChange={e => setLessonId(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-3 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a lesson...</option>
              {lessonsForClass.map(lesson => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
            {errors.lessonId && <p className="text-[10px] text-[var(--jp-red)] mt-1">{errors.lessonId}</p>}
            {selectedClass && lessonsForClass.length === 0 && (
              <p className="text-[10px] text-muted-col mt-1">This class has no lessons yet. Please create a lesson first.</p>
            )}
          </div>

          {/* Exam Title */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Exam Title <span className="text-[var(--jp-red)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. N5 Mini Test — Lesson 3"
              className="w-full px-3 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
            />
            {errors.title && <p className="text-[10px] text-[var(--jp-red)] mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the exam..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm resize-none"
            />
          </div>

          {/* Sections */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Sections <span className="text-[var(--jp-red)]">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SECTION_OPTIONS.map(section => (
                <button
                  key={section}
                  type="button"
                  onClick={() => toggleSection(section)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    sections.includes(section)
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40"
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
            {errors.sections && <p className="text-[10px] text-[var(--jp-red)] mt-1">{errors.sections}</p>}
          </div>

          {/* Duration + Attempt Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Duration (min) <span className="text-[var(--jp-red)]">*</span>
              </label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-3 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
              />
              {errors.duration && <p className="text-[10px] text-[var(--jp-red)] mt-1">{errors.duration}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Attempts <span className="text-[var(--jp-red)]">*</span>
              </label>
              <input
                type="number"
                value={attemptLimit}
                onChange={e => setAttemptLimit(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-3 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
              />
              {errors.attemptLimit && <p className="text-[10px] text-[var(--jp-red)] mt-1">{errors.attemptLimit}</p>}
            </div>
          </div>

          {/* Start Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
            <div className="flex gap-2">
              {(["Draft", "Scheduled", "Open"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    status === s
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Preview Summary */}
        {classId && title && (
          <Card className="p-5 border-blue-200/50 dark:border-blue-800/30">
            <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Preview Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">Class</p>
                <p className="font-bold">{selectedClass?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">Level</p>
                <LevelBadge level={selectedClass?.level ?? ""} />
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">Lesson</p>
                <p className="font-bold">{selectedLesson?.title ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">Sections</p>
                <div className="flex flex-wrap gap-1">
                  {sections.length > 0 ? sections.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">{s}</span>
                  )) : <span className="text-muted-col">No sections selected</span>}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">Duration</p>
                <p className="font-bold">{duration} min</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">Attempts</p>
                <p className="font-bold">{attemptLimit}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">Start</p>
                <p className="font-bold">{startDate ? `${startDate} ${startTime}` : "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">Status</p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  status === "Open" ? "bg-green-50 text-green-600" :
                  status === "Scheduled" ? "bg-blue-50 text-blue-600" :
                  "bg-yellow-50 text-yellow-600"
                }`}>
                  {status}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {classId ? (
              <Link
                to={`/teacher/classes/${classId}/exams`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Class Exams
              </Link>
            ) : (
              <Link
                to="/teacher/exams"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Exams
              </Link>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
          >
            <ClipboardCheck className="w-4 h-4" />
            {status === "Open" ? "Publish Exam" : status === "Scheduled" ? "Schedule Exam" : "Save as Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
