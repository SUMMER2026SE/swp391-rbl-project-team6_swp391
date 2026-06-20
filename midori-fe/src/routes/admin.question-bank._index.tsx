import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/question-bank/_index")({
  component: QuestionBankIndexPage,
});

const levels = ["N5", "N4", "N3", "N2", "N1"];

const colors = {
  bg: "bg-[oklch(0.62_0.18_270)]/10",
  text: "text-[oklch(0.62_0.18_270)]",
  border: "border-[oklch(0.62_0.18_270)]/20",
  hover: "hover:bg-[oklch(0.62_0.18_270)]/20",
};

function QuestionBankIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black text-primary-col">Question Bank</h1>
        <p className="text-sm text-secondary-col mt-1">Select a JLPT level to manage questions</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {levels.map((level, index) => (
          <motion.div
            key={level}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          >
            <Link
              to="/admin/question-bank/$level"
              params={{ level: level.toLowerCase() }}
              className="group block"
            >
              <div className={`
                card-base h-32 flex items-center justify-center
                border ${colors.border}
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5 hover:scale-105
                ${colors.hover}
              `}>
                <div className={`text-5xl font-black ${colors.text}`}>
                  {level}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
