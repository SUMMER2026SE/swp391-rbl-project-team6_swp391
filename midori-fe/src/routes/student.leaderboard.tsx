import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Medal, Crown, Flame, TrendingUp, TrendingDown,
  ChevronUp, ChevronDown, Target, BookOpen, Headphones,
  GraduationCap, Mic, Sparkles, Clock, Calendar, Globe,
  ChevronLeft, ChevronRight as ChevronRightIcon,
} from "lucide-react";

// ─── Mock Leaderboard Data ────────────────────────────────────────────────────

const leaderboardData = [
  { rank: 1, name: "Sakura Hayashi", avatar: "佐", xp: 18420, streak: 89, level: 18, jlpt: "N1", country: "JP", badges: 24, change: 0 },
  { rank: 2, name: "Kenji Yamamoto", avatar: "健", xp: 17250, streak: 72, level: 17, jlpt: "N2", country: "JP", badges: 21, change: 1 },
  { rank: 3, name: "Mei Lin Chen", avatar: "梅", xp: 16580, streak: 65, level: 16, jlpt: "N2", country: "CN", badges: 19, change: -1 },
  { rank: 4, name: "Park Joon-ho", avatar: "朴", xp: 14890, streak: 54, level: 15, jlpt: "N2", country: "KR", badges: 17, change: 2 },
  { rank: 5, name: "Yuki Tanaka", avatar: "Y", xp: 9840, streak: 32, level: 12, jlpt: "N3", country: "JP", badges: 12, change: -1 },
  { rank: 6, name: "Alex Kim", avatar: "A", xp: 8750, streak: 28, level: 11, jlpt: "N3", country: "US", badges: 10, change: 1 },
  { rank: 7, name: "Sofia Martinez", avatar: "So", xp: 7620, streak: 22, level: 10, jlpt: "N4", country: "ES", badges: 9, change: -2 },
  { rank: 8, name: "Ravi Sharma", avatar: "R", xp: 6540, streak: 18, level: 9, jlpt: "N4", country: "IN", badges: 8, change: 0 },
  { rank: 9, name: "Anna Kowalski", avatar: "An", xp: 5820, streak: 15, level: 8, jlpt: "N4", country: "PL", badges: 7, change: 3 },
  { rank: 10, name: "Lucas Weber", avatar: "L", xp: 4950, streak: 12, level: 7, jlpt: "N5", country: "DE", badges: 6, change: -1 },
  { rank: 11, name: "Emma Johnson", avatar: "E", xp: 4100, streak: 10, level: 6, jlpt: "N5", country: "GB", badges: 5, change: 0 },
  { rank: 12, name: "Tom Nguyen", avatar: "T", xp: 3250, streak: 8, level: 5, jlpt: "N5", country: "VN", badges: 4, change: 2 },
  { rank: 13, name: "Isabella Costa", avatar: "Is", xp: 2680, streak: 6, level: 4, jlpt: "N5", country: "BR", badges: 3, change: -1 },
  { rank: 14, name: "Hans Mueller", avatar: "H", xp: 1920, streak: 4, level: 3, jlpt: "N5", country: "AT", badges: 2, change: 0 },
  { rank: 15, name: "Nina Petrov", avatar: "N", xp: 1200, streak: 3, level: 2, jlpt: "N5", country: "RU", badges: 1, change: 1 },
];

const currentUser = leaderboardData.find(p => p.name === "Yuki Tanaka")!;
const currentUserRank = 5;
const nextRank = leaderboardData[currentUserRank]; // rank 6

// ─── Sub-components ───────────────────────────────────────────────────────────

function PodiumCard({ rank, data }: { rank: number; data: typeof leaderboardData[0] }) {
  const medals = [
    {
      icon: Crown,
      bg: "from-blue-400 via-cyan-300 to-cyan-400",
      glow: "shadow-cyan-400/50",
      glowBg: "bg-cyan-400/15",
      ring: "ring-cyan-300/40",
      label: "text-cyan-400",
    },
    {
      icon: Medal,
      bg: "from-slate-300 via-slate-400 to-slate-500",
      glow: "shadow-slate-300/30",
      glowBg: "bg-slate-300/10",
      ring: "ring-slate-400/25",
      label: "text-slate-400",
    },
    {
      icon: Medal,
      bg: "from-violet-400 via-pink-400 to-pink-500",
      glow: "shadow-pink-400/45",
      glowBg: "bg-pink-400/12",
      ring: "ring-pink-400/30",
      label: "text-pink-400",
    },
  ];
  const m = medals[rank - 1];
  const Icon = m.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.04, y: -4 }}
      transition={{ delay: rank * 0.08, type: "spring", stiffness: 200, damping: 20 }}
      className="flex flex-col items-center"
    >
      {/* Rank crown/medal badge */}
      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${m.bg} flex items-center justify-center shadow-lg mb-1.5 ring-2 ${m.ring}`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Avatar with glow */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${m.bg} flex items-center justify-center text-white font-black text-2xl shadow-2xl ${m.glow} ring-4 ${m.ring} ring-offset-2 dark:ring-offset-slate-900`}
      >
        {data.avatar}
        {rank === 1 && (
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl bg-amber-300/30 blur-md"
          />
        )}
      </motion.div>

      {/* Name */}
      <p className={`font-bold text-xs mt-2 text-center leading-tight max-w-24 ${m.label}`}>
        {data.name.split(" ")[0]}
      </p>

      {/* XP + Streak */}
      <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70 text-[10px] font-bold text-slate-500 dark:text-slate-300">
        <span>{data.xp.toLocaleString()} XP</span>
        <span className="text-orange-500 dark:text-orange-300">🔥 {data.streak}d</span>
      </div>
    </motion.div>
  );
}

function RankChangeIndicator({ change }: { change: number }) {
  if (change === 0) return null;
  if (change > 0) {
    return (
      <div className="flex items-center gap-0.5 text-green-500">
        <ChevronUp className="w-3 h-3" />
        <span className="text-[10px] font-bold">{change}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 text-red-400">
      <ChevronDown className="w-3 h-3" />
      <span className="text-[10px] font-bold">{Math.abs(change)}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [filter, setFilter] = useState<"weekly" | "monthly" | "alltime">("weekly");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [rankPage, setRankPage] = useState(1);
  const RANKS_PER_PAGE = 5;

  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);
  const totalRankPages = Math.max(1, Math.ceil(rest.length / RANKS_PER_PAGE));
  const pagedRanks = rest.slice((rankPage - 1) * RANKS_PER_PAGE, rankPage * RANKS_PER_PAGE);
  const xpToNextRank = nextRank.xp - currentUser.xp;

  const filterLabels: Record<string, string> = {
    weekly: "This Week",
    monthly: "This Month",
    alltime: "All Time",
  };

  return (
    <div className="space-y-4">

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["weekly", "monthly", "alltime"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f
                ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow"
                : "glass text-slate-500 dark:text-slate-300 hover:text-foreground dark:hover:text-white"
            }`}
          >
            {f === "weekly" && <Clock className="w-3.5 h-3.5" />}
            {f === "monthly" && <Calendar className="w-3.5 h-3.5" />}
            {f === "alltime" && <Trophy className="w-3.5 h-3.5" />}
            {filterLabels[f]}
          </button>
        ))}
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="ml-auto glass px-3 py-2 rounded-xl text-xs font-semibold outline-none cursor-pointer text-slate-600 dark:text-slate-300 bg-transparent appearance-none"
          style={{ WebkitAppearance: "none" }}
        >
          <option value="all">All Levels</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </select>
      </div>

      {/* ─── Top 3 Podium ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 overflow-hidden relative"
      >
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-gradient-to-br from-blue-500/10 via-pink-500/8 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-gradient-to-tr from-pink-500/8 to-cyan-400/4 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="text-center mb-4">
            <div className="font-display font-black text-base flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Top 3
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-[11px] text-muted-foreground">{filterLabels[filter]}</div>
          </div>

          {/* Podium row */}
          <div className="flex items-end justify-center gap-3 sm:gap-6">
            {/* #2 */}
            <PodiumCard rank={2} data={top3[1]} />
            {/* #1 — taller */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col items-center"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 via-cyan-300 to-cyan-400 flex items-center justify-center shadow-lg mb-1.5 ring-2 ring-cyan-300/40 shadow-cyan-400/50">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <motion.div
                whileHover={{ scale: 1.1, y: -6 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 via-cyan-300 to-cyan-400 flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-cyan-400/50 ring-4 ring-cyan-300/40 ring-offset-2 dark:ring-offset-slate-900"
              >
                {top3[0].avatar}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-2xl bg-cyan-300/30 blur-md"
                />
              </motion.div>
              <p className="font-bold text-sm text-foreground mt-2">{top3[0].name.split(" ")[0]}</p>
              <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                <span>{top3[0].xp.toLocaleString()} XP</span>
                <span className="text-orange-500 dark:text-orange-300">🔥 {top3[0].streak}d</span>
              </div>
            </motion.div>
            {/* #3 */}
            <PodiumCard rank={3} data={top3[2]} />
          </div>
        </div>
      </motion.div>

      {/* ─── Your Rank ─── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] opacity-70 uppercase tracking-widest">Your Rank</div>
                <div className="font-display font-black text-3xl">#{currentUserRank}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black">
                {currentUser.avatar}
              </div>
            </div>
          </div>
          <div className="glass border-t-0 rounded-b-2xl p-3 border border-t-0">
            <div className="flex gap-3">
              {[
                { label: "XP", value: currentUser.xp.toLocaleString() },
                { label: "Streak", value: `${currentUser.streak}d` },
                { label: "Level", value: currentUser.level.toString() },
              ].map(s => (
                <div key={s.label} className="flex-1 text-center">
                  <div className="font-black text-sm text-foreground">{s.value}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* XP to next rank */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-4"
        >
          <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            XP to Rank #{currentUserRank + 1}
          </h4>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1.5">Keep going!</div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(80, (currentUser.xp / (currentUser.xp + xpToNextRank)) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-pink-500"
                />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {xpToNextRank.toLocaleString()} XP needed
              </div>
            </div>
            <div className="font-black text-2xl gradient-text leading-none">
              {xpToNextRank.toLocaleString()}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Full Rankings Table ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border/40 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Learner</div>
          <div className="col-span-2 text-right">XP</div>
          <div className="col-span-2 text-center">Streak</div>
          <div className="col-span-2 text-center">Change</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/30">
          {pagedRanks.map((player, idx) => {
            const actualRank = (rankPage - 1) * RANKS_PER_PAGE + idx + 4;
            const isCurrentUser = player.name === "Yuki Tanaka";
            return (
              <motion.div
                key={player.rank}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center transition-colors ${
                  isCurrentUser
                    ? "bg-blue-500/10 dark:bg-blue-500/15 border-l-4 border-l-blue-500"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center gap-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                    actualRank <= 10
                      ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}>
                    {actualRank}
                  </div>
                  <RankChangeIndicator change={player.change} />
                </div>

                {/* Learner */}
                <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400/40 via-cyan-400/30 to-indigo-400/40 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {player.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className={`font-semibold text-xs truncate ${isCurrentUser ? "text-blue-500" : "text-foreground"}`}>
                      {player.name}
                      {isCurrentUser && <span className="ml-1 text-[10px] font-bold">(You)</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{player.country}</div>
                  </div>
                </div>

                {/* XP */}
                <div className="col-span-2 text-right">
                  <span className="font-black text-xs text-foreground">{player.xp.toLocaleString()}</span>
                </div>

                {/* Streak */}
                <div className="col-span-2 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500 dark:text-orange-300" />
                  <span className="font-bold text-xs text-orange-500 dark:text-orange-300">{player.streak}d</span>
                </div>

                {/* Change */}
                <div className="col-span-2 flex justify-center">
                  <RankChangeIndicator change={player.change} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {totalRankPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-border/40">
            <button
              onClick={() => setRankPage(p => Math.max(1, p - 1))}
              disabled={rankPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center glass text-slate-500 dark:text-slate-300 hover:text-foreground dark:hover:text-white transition disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalRankPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setRankPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  p === rankPage
                    ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow"
                    : "glass text-slate-500 dark:text-slate-300 hover:text-foreground dark:hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setRankPage(p => Math.min(totalRankPages, p + 1))}
              disabled={rankPage === totalRankPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center glass text-slate-500 dark:text-slate-300 hover:text-foreground dark:hover:text-white transition disabled:opacity-30"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        </div>
      </motion.div>

    </div>
  );
}
