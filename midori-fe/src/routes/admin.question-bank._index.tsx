import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

const levels: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

const levelColors: Record<JLPTLevel, { bg: string; text: string; border: string }> = {
  N5: { bg: "from-blue-500/10 to-blue-600/5", text: "text-blue-600", border: "border-blue-500/20" },
  N4: { bg: "from-green-500/10 to-green-600/5", text: "text-green-600", border: "border-green-500/20" },
  N3: { bg: "from-purple-500/10 to-purple-600/5", text: "text-purple-600", border: "border-purple-500/20" },
  N2: { bg: "from-orange-500/10 to-orange-600/5", text: "text-orange-600", border: "border-orange-500/20" },
  N1: { bg: "from-red-500/10 to-red-600/5", text: "text-red-600", border: "border-red-500/20" },
};

// ─── Routes ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/question-bank/_index")({
  component: QuestionBankIndexPage,
});

function QuestionBankIndexPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black">Question Bank</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Select a JLPT level to manage questions</p>
      </div>

      {/* Level Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {levels.map((level, index) => (
          <motion.div
            key={level}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to="/admin/question-bank/$level"
              params={{ level: level.toLowerCase() }}
              className={`block p-6 rounded-xl bg-gradient-to-br ${levelColors[level].bg} border ${levelColors[level].border} hover:scale-105 transition-transform group`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-4xl font-black ${levelColors[level].text} mb-2`}>
                    {level}
                  </div>
                  <div className="text-xs text-muted-foreground">Question Bank</div>
                </div>
                <ChevronRight className={`w-6 h-6 ${levelColors[level].text} group-hover:translate-x-1 transition-transform`} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
