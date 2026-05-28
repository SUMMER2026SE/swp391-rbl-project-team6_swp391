import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookMarked, Search, Filter, CheckCircle, XCircle, Eye, AlertTriangle,
  BookOpen, GraduationCap, Headphones, Mic, Clock, Flag, ChevronRight, X,
  BarChart3, Star, Users
} from "lucide-react";

const INITIAL_GRAMMAR = [
  { id: 1, title: "〜ながらも", teacher: "Sakura Hayashi", level: "N2", reports: 3, status: "under_review", views: 890, date: "2 days ago", reason: "Inaccurate explanation" },
  { id: 2, title: "〜そばから", teacher: "Kenji Yamamoto", level: "N2", reports: 5, status: "pending", views: 420, date: "4 days ago", reason: "Duplicate content" },
  { id: 3, title: "〜uance", teacher: "Park Joon-ho", level: "N1", reports: 1, status: "pending", views: 120, date: "1 day ago", reason: "Spelling error" },
  { id: 4, title: "Verb conjugation basics", teacher: "Taro Yamamoto", level: "N5", reports: 0, status: "approved", views: 3420, date: "2 weeks ago", reason: "" },
];

const INITIAL_VOCAB = [
  { id: 5, title: "N3 Business Kanji Set", teacher: "Yumi Kobayashi", level: "N3", reports: 2, status: "pending", views: 180, date: "3 days ago", reason: "Duplicate entry" },
  { id: 6, title: "Keigo vocabulary", teacher: "Shinji Abe", level: "N2", reports: 0, status: "approved", views: 890, date: "1 week ago", reason: "" },
];

export const Route = createFileRoute("/admin/grammar")({ component: GrammarModerationPage });

function GrammarModerationPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<{ id: number; title: string; teacher: string; level: string; reports: number; status: string; views: number; date: string; reason: string } | null>(null);
  const [typeFilter, setTypeFilter] = useState("grammar");
  const [grammarData, setGrammarData] = useState(INITIAL_GRAMMAR);
  const [vocabData, setVocabData] = useState(INITIAL_VOCAB);

  const allContent = typeFilter === "grammar" ? grammarData : vocabData;

  const filtered = allContent.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleApprove = (id: number) => {
    if (typeFilter === "grammar") {
      setGrammarData(prev => prev.map(c => c.id === id ? { ...c, status: "approved" } : c));
    } else {
      setVocabData(prev => prev.map(c => c.id === id ? { ...c, status: "approved" } : c));
    }
    if (statusFilter === "pending") {
      if (selected?.id === id) setSelected(null);
    }
  };

  const handleReject = (id: number) => {
    if (typeFilter === "grammar") {
      setGrammarData(prev => prev.map(c => c.id === id ? { ...c, status: "rejected" } : c));
    } else {
      setVocabData(prev => prev.map(c => c.id === id ? { ...c, status: "rejected" } : c));
    }
    if (statusFilter === "pending") {
      if (selected?.id === id) setSelected(null);
    }
  };

  const contentTypes = [
    { id: "grammar", label: "Grammar", icon: GraduationCap, count: grammarData.filter(c => c.status !== "approved").length },
    { id: "vocabulary", label: "Vocabulary", icon: BookOpen, count: vocabData.filter(c => c.status !== "approved").length },
    { id: "listening", label: "Listening", icon: Headphones, count: 2 },
    { id: "shadowing", label: "Shadowing", icon: Mic, count: 1 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-slate-900 dark:text-white">Content Moderation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review reported content across all categories</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold">
          <AlertTriangle className="w-3 h-3" />
          {allContent.filter(c => c.reports > 0).length} items with reports
        </div>
      </div>

      {/* Content type tabs */}
      <div className="flex gap-2">
        {contentTypes.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTypeFilter(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              typeFilter === t.id ? "bg-gradient-hero text-white shadow" : "bg-slate-900 dark:bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-800"
            }`}>
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${typeFilter === t.id ? "bg-white/20 text-white" : "bg-red-500/10 text-red-400"}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search content..." className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 text-sm text-white outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-slate-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold outline-none text-slate-400">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`bg-slate-900 dark:bg-slate-800/80 rounded-2xl p-5 border transition cursor-pointer ${
              item.reports > 0 ? "border-red-500/30 hover:border-red-500/60" : "border-slate-700/50 hover:border-slate-600"
            }`}
            onClick={() => setSelected(item)}
          >
            <div className="flex items-start gap-4">
              {item.reports > 0 && (
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center flex-shrink-0">
                  <Flag className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{item.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">{item.level}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                    item.status === "approved" ? "bg-green-500/20 text-green-400" :
                    item.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                    item.status === "under_review" ? "bg-orange-500/20 text-orange-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>{item.status.replace("_", " ")}</span>
                </div>
                <div className="text-xs text-slate-500 mb-1">by {item.teacher} · {item.views.toLocaleString()} views · {item.date}</div>
                {item.reports > 0 && (
                  <div className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {item.reports} reports: {item.reason}
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleApprove(item.id)} className="p-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition"><CheckCircle className="w-4 h-4" /></button>
                <button onClick={() => handleReject(item.id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"><XCircle className="w-4 h-4" /></button>
                <button onClick={() => setSelected(item)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 transition"><Eye className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
