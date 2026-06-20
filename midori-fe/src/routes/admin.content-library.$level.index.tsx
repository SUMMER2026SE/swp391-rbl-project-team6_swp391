import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, FileText, Headphones, Mic } from "lucide-react";

export const Route = createFileRoute("/admin/content-library/$level/")({
  component: ContentLibraryLevelPage,
});

const skillCards = [
  {
    id: "vocabulary",
    label: "Vocabulary",
    icon: BookOpen,
    color: "text-[oklch(0.62_0.18_270)]",
    bg: "bg-[oklch(0.62_0.18_270)]/10",
    border: "border-[oklch(0.62_0.18_270)]/20",
    hoverBg: "hover:bg-[oklch(0.62_0.18_270)]/15",
    path: "/vocabulary",
  },
  {
    id: "grammar",
    label: "Grammar",
    icon: GraduationCap,
    color: "text-[oklch(0.72_0.15_230)]",
    bg: "bg-[oklch(0.72_0.15_230)]/10",
    border: "border-[oklch(0.72_0.15_230)]/20",
    hoverBg: "hover:bg-[oklch(0.72_0.15_230)]/15",
    path: "/grammar",
  },
  {
    id: "reading",
    label: "Reading",
    icon: FileText,
    color: "text-[var(--status-pending)]",
    bg: "bg-[var(--status-pending)]/10",
    border: "border-[var(--status-pending)]/20",
    hoverBg: "hover:bg-[var(--status-pending)]/15",
    path: "/reading",
  },
  {
    id: "listening",
    label: "Listening",
    icon: Headphones,
    color: "text-[oklch(0.72_0.18_340)]",
    bg: "bg-[oklch(0.72_0.18_340)]/10",
    border: "border-[oklch(0.72_0.18_340)]/20",
    hoverBg: "hover:bg-[oklch(0.72_0.18_340)]/15",
    path: "/listening",
  },
  {
    id: "shadowing",
    label: "Shadowing",
    icon: Mic,
    color: "text-[var(--status-active)]",
    bg: "bg-[var(--status-active)]/10",
    border: "border-[var(--status-active)]/20",
    hoverBg: "hover:bg-[var(--status-active)]/15",
    path: "/shadowing",
  },
];

function ContentLibraryLevelPage() {
  const { level } = Route.useParams();
  const upperLevel = level.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">
            Content Library
          </h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Manage JLPT learning materials and resources
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl text-sm font-bold border bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)] border-[oklch(0.62_0.18_270)]/20">
          {upperLevel} Level
        </span>
      </div>

      {/* Skill Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {skillCards.map((skill, i) => (
          <Link
            key={skill.id}
            to="/admin/content-library/$level/$skill"
            params={{ level, skill: skill.id }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card-base p-5 flex flex-col items-center justify-center gap-3 cursor-pointer group border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${skill.bg} ${skill.border} ${skill.hoverBg}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${skill.bg} border ${skill.border}`}>
                <skill.icon className={`w-5.5 h-5.5 ${skill.color}`} />
              </div>
              <div className="text-center">
                <span className={`font-semibold text-sm ${skill.color}`}>
                  {skill.label}
                </span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
