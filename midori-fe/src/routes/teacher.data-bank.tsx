import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Shield, Shuffle, CheckCircle2, AlertTriangle,
  BookOpen, GraduationCap, Headphones, Mic, FileText,
  ClipboardList, ArrowLeft, Send, Plus, Filter, Eye,
  ArrowUpRight, Users
} from "lucide-react";
import { Card, LevelBadge, PageHeader } from "@/components/page-ui";
import { cn } from "@/lib/utils";
import {
  DATA_BANK_ITEMS, DATA_BANK_TYPES, DATA_BANK_LEVELS,
  type DataBankItem, type DataBankType
} from "@/data/teacher-data-bank";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function typeIcon(type: DataBankType) {
  switch (type) {
    case "Vocabulary": return <BookOpen className="w-3.5 h-3.5" />;
    case "Grammar":    return <GraduationCap className="w-3.5 h-3.5" />;
    case "Listening":  return <Headphones className="w-3.5 h-3.5" />;
    case "Shadowing":  return <Mic className="w-3.5 h-3.5" />;
    case "Question":   return <ClipboardList className="w-3.5 h-3.5" />;
    case "Exam":       return <FileText className="w-3.5 h-3.5" />;
  }
}

function statusBadge(status: DataBankItem["status"]) {
  const cfg: Record<string, { cls: string; label: string }> = {
    "Approved":      { cls: "bg-[var(--status-active)]/15 text-[var(--status-active)]",   label: "Approved" },
    "Pending Review":{ cls: "bg-[var(--status-pending)]/15 text-[var(--status-pending)]", label: "Pending Review" },
    "Rejected":      { cls: "bg-[var(--jp-red)]/15 text-[var(--jp-red)]",               label: "Rejected" },
  };
  const c = cfg[status];
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", c.cls)}>{c.label}</span>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export const Route = createFileRoute("/teacher/data-bank")({ component: TeacherDataBankPage });

type StatusFilter = "All" | "Approved" | "Pending Review" | "Rejected";

function TeacherDataBankPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const bankStats = useMemo(() => ({
    approved: DATA_BANK_ITEMS.filter((i) => i.status === "Approved").length,
    vocab: DATA_BANK_ITEMS.filter((i) => i.type === "Vocabulary").length,
    grammar: DATA_BANK_ITEMS.filter((i) => i.type === "Grammar").length,
    listening: DATA_BANK_ITEMS.filter((i) => i.type === "Listening").length,
    pending: DATA_BANK_ITEMS.filter((i) => i.status === "Pending Review").length,
  }), []);

  const filtered = useMemo(() => {
    return DATA_BANK_ITEMS.filter((item) => {
      if (search && !item.title.toLowerCase().includes(search.toLowerCase()) &&
          !item.topic.toLowerCase().includes(search.toLowerCase()) &&
          !item.description.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (levelFilter !== "All" && item.level !== levelFilter) return false;
      if (typeFilter !== "All" && item.type !== typeFilter) return false;
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      return true;
    });
  }, [search, levelFilter, typeFilter, statusFilter]);

  const hasActiveFilter = search || levelFilter !== "All" || typeFilter !== "All" || statusFilter !== "All";

  return (
    <div className="space-y-5">
      {/* ── A. Header ──────────────────────────────────────────────────── */}
      <PageHeader
        title="Data Bank"
        subtitle="Browse and reuse approved content from Admin Data Bank."
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-col">
              Teacher can only <strong>take</strong> or <strong>random</strong> approved content.
              Admin manages the full Data Bank.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="#"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
            >
              <Send className="w-3 h-3" />
              Submit Content for Review
            </Link>
            <button
              onClick={() => {
                const lvl = document.querySelector<HTMLSelectElement>('[data-random-level]')?.value ?? "N5";
                const typ = document.querySelector<HTMLSelectElement>('[data-random-type]')?.value ?? "Vocabulary";
                const num = parseInt(document.querySelector<HTMLInputElement>('[data-random-num]')?.value ?? "3", 10);
                const section = document.getElementById("random-content-section");
                section?.scrollIntoView({ behavior: "smooth" });
                setTimeout(() => {
                  const msg = document.getElementById("random-success-msg");
                  if (num > 0 && lvl && typ) {
                    msg?.classList.remove("hidden");
                    msg!.textContent = `Random selection prepared. ${num} × ${typ} (${lvl}). Duplicate items should be skipped when added to a lesson.`;
                  }
                }, 400);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold bg-[var(--primary)] text-white hover:opacity-90 shadow-sm transition"
            >
              <Shuffle className="w-3 h-3" />
              Random Content
            </button>
          </div>
        </div>
      </Card>

      {/* ── B. Permission Notice ───────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--jp-red)]/5 border border-[var(--jp-red)]/15">
        <div className="w-8 h-8 rounded-lg bg-[var(--jp-red)]/10 text-[var(--jp-red)] flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-foreground">Teacher Access — Data Bank</h3>
          <p className="text-[11px] text-muted-col mt-0.5">
            Data Bank is managed by Admin. Teachers can browse, take, random, or submit content for review,
            but cannot directly modify the approved bank.
          </p>
        </div>
      </div>

      {/* ── C. Overview Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { label: "Approved Items",  value: bankStats.approved,  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          { label: "Vocabulary Items",value: bankStats.vocab,     icon: <BookOpen className="w-3.5 h-3.5" /> },
          { label: "Grammar Structures", value: bankStats.grammar, icon: <GraduationCap className="w-3.5 h-3.5" /> },
          { label: "Listening Activities", value: bankStats.listening, icon: <Headphones className="w-3.5 h-3.5" /> },
          { label: "Pending Submissions", value: bankStats.pending, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary grid place-items-center">{stat.icon}</div>
              <div className="font-display font-black text-sm leading-tight">{stat.value}</div>
              <div className="text-[9px] text-muted-col uppercase tracking-wider font-bold leading-tight">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── D. Search / Filter ─────────────────────────────────────────── */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Filter className="w-3.5 h-3.5 text-primary" />
          Search & Filter
        </div>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-col" />
            <input
              type="text"
              placeholder="Search by keyword, topic, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-col focus:outline-none focus:border-primary/50 transition"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Level */}
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Level</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
              >
                <option value="All">All</option>
                {DATA_BANK_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {/* Type */}
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Type / Skill</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
              >
                <option value="All">All</option>
                {DATA_BANK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
              >
                <option value="All">All</option>
                <option value="Approved">Approved</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* ── E. Content List ────────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-sm flex items-center gap-2 text-foreground">
            <BookOpen className="w-4 h-4 text-primary" />
            Content Library
          </h2>
          <span className="text-[10px] text-muted-col font-semibold">{filtered.length} item(s)</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-col">No content matches your filters.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition"
              >
                {/* Icon + Title */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    {typeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-col mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-md bg-muted/80 text-muted-col text-[9px] font-bold">{item.topic}</span>
                  <LevelBadge level={item.level} />
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold">{item.type}</span>
                  {statusBadge(item.status)}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-[10px] text-muted-col flex-shrink-0">
                  <span className="flex items-center gap-1">
                    {item.createdBy === "Admin" ? <Shield className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                    {item.createdBy}
                  </span>
                  <span>Used {item.usageCount}x</span>
                  <span>{item.lastUpdated}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-col transition" title="Preview">
                    <Eye className="w-3 h-3" />
                  </button>
                  {item.status === "Approved" && (
                    <button className="p-1.5 rounded-lg bg-[var(--status-active)]/10 text-[var(--status-active)] hover:bg-[var(--status-active)]/20 transition" title="Take to Lesson">
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                  {item.status === "Approved" && (
                    <button className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition" title="Random similar">
                      <Shuffle className="w-3 h-3" />
                    </button>
                  )}
                  {item.status === "Pending Review" && item.createdBy === "Teacher" && (
                    <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-[var(--status-pending)]/10 text-[var(--status-pending)]">
                      Awaiting Admin review
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* ── F. Random Content ──────────────────────────────────────────── */}
      <Card className="p-4 space-y-3" id="random-content-section">
        <h2 className="font-display font-bold text-sm flex items-center gap-2 text-foreground">
          <Shuffle className="w-4 h-4 text-primary" />
          Random Content
        </h2>
        <p className="text-[10px] text-muted-col">
          Let the system pick random approved content matching your criteria.
          Duplicate items will be skipped automatically when added to a lesson.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-[10px] text-muted-col font-semibold block mb-1">Level *</label>
            <select
              data-random-level
              defaultValue="N5"
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
            >
              {DATA_BANK_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-col font-semibold block mb-1">Type / Skill *</label>
            <select
              data-random-type
              defaultValue="Vocabulary"
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
            >
              {DATA_BANK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-col font-semibold block mb-1">Number of items *</label>
            <input
              data-random-num
              type="number"
              min={1}
              defaultValue={3}
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const lvlEl = document.querySelector<HTMLSelectElement>('[data-random-level]');
              const typEl = document.querySelector<HTMLSelectElement>('[data-random-type]');
              const numEl = document.querySelector<HTMLInputElement>('[data-random-num]');
              const lvl = lvlEl?.value;
              const typ = typEl?.value;
              const num = parseInt(numEl?.value ?? "0", 10);
              const msg = document.getElementById("random-success-msg");
              if (!lvl || !typ || num <= 0) {
                msg?.classList.remove("hidden");
                msg!.className = "text-[10px] text-[var(--jp-red)] font-bold";
                msg!.textContent = "Please select level, type, and a number greater than 0.";
                return;
              }
              msg?.classList.remove("hidden");
              msg!.className = "text-[10px] text-[var(--status-active)] font-bold";
              msg!.textContent = `Random selection prepared. ${num} × ${typ} (${lvl}). Duplicate items should be skipped when added to a lesson.`;
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[10px] font-semibold bg-[var(--primary)] text-white hover:opacity-90 shadow-sm transition"
          >
            <Shuffle className="w-3 h-3" />
            Random Content
          </button>
          <span id="random-success-msg" className="hidden text-[10px]" />
        </div>

        {/* ── G. Duplicate Rule ─────────────────────────────────────────── */}
        <div className="mt-3 p-3 rounded-xl bg-muted/20 border border-border/30">
          <h4 className="text-[10px] font-bold text-foreground flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3 h-3 text-primary" />
            Duplicate Rule
          </h4>
          <ul className="space-y-1.5">
            <li className="text-[10px] text-muted-col flex items-start gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[8px] font-bold mt-px">1</span>
              If selected content already exists in the current lesson, it should be skipped.
            </li>
            <li className="text-[10px] text-muted-col flex items-start gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[8px] font-bold mt-px">2</span>
              Example: Added <strong>17/20</strong> items. <strong>3 items were skipped</strong> because they already existed.
            </li>
          </ul>
        </div>
      </Card>

      {/* ── H. Submit to Data Bank ─────────────────────────────────────── */}
      <Card className="p-4 space-y-3">
        <h2 className="font-display font-bold text-sm flex items-center gap-2 text-foreground">
          <Send className="w-4 h-4 text-primary" />
          Submit Content for Review
        </h2>
        <p className="text-[10px] text-muted-col">
          Teacher-created content must be submitted for Admin review before it enters the approved bank.
        </p>
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
          <h4 className="text-[10px] font-bold text-foreground mb-2">Status Flow</h4>
          <div className="flex items-center gap-2 flex-wrap">
            {["Draft", "Pending Review", "Approved", "Rejected"].map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold",
                  s === "Draft"          ? "bg-muted/80 text-muted-col" :
                  s === "Pending Review" ? "bg-[var(--status-pending)]/15 text-[var(--status-pending)]" :
                  s === "Approved"       ? "bg-[var(--status-active)]/15 text-[var(--status-active)]" :
                                           "bg-[var(--jp-red)]/15 text-[var(--jp-red)]"
                )}>{s}</span>
                {i < 3 && <span className="text-muted-col text-[10px]">→</span>}
              </span>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-muted-col italic">
          Teacher cannot directly publish content into the approved bank. Submission form will be added in a future phase.
        </p>
      </Card>

      {/* ── I. Rules / Info ────────────────────────────────────────────── */}
      <Card className="p-4 space-y-3">
        <h2 className="font-display font-bold text-sm flex items-center gap-2 text-foreground">
          <Shield className="w-4 h-4 text-primary" />
          Data Bank Rules
        </h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {[
            "Admin manages the Data Bank.",
            "Teacher can take or random approved content.",
            "Teacher can submit content for Admin review.",
            "Student cannot access Data Bank directly.",
            "Data Bank content should match class level when used in a class.",
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-px text-[9px] font-bold">
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
