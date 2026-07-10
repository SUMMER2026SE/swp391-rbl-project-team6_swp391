import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Headphones, Mic, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/content-library/$level/")({
  component: ContentLibraryLevelPage,
});

const skillCards = [
  {
    id: "vocabulary",
    label: "Vocabulary",
    icon: BookOpen,
    color: "text-sakura",
    bg: "bg-sakura/30",
    border: "border-sakura/20",
    hoverBg: "hover:bg-sakura/10",
  },
  {
    id: "grammar",
    label: "Grammar",
    icon: GraduationCap,
    color: "text-lavender",
    bg: "bg-lavender/15",
    border: "border-lavender/20",
    hoverBg: "hover:bg-lavender/10",
  },
  {
    id: "listening",
    label: "Listening",
    icon: Headphones,
    color: "text-sky-blue",
    bg: "bg-sky-blue/15",
    border: "border-sky-blue/20",
    hoverBg: "hover:bg-sky-blue/10",
  },
  {
    id: "reading",
    label: "Reading",
    icon: BookOpen,
    color: "text-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/20",
    hoverBg: "hover:bg-emerald-500/10",
  },
  {
    id: "shadowing",
    label: "Shadowing",
    icon: Mic,
    color: "text-jp-red",
    bg: "bg-jp-red/15",
    border: "border-jp-red/20",
    hoverBg: "hover:bg-jp-red/10",
  },
];

function ContentLibraryLevelPage() {
  const { level } = Route.useParams();
  const levelStr = level ?? "";
  const upperLevel = levelStr.toUpperCase();

  return (
    <div className="space-y-5">
      {/* Back Button */}
      <Link
        to="/admin/content-library"
        className="inline-flex items-center gap-2 text-sm text-muted-col hover:text-primary-col transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Content Library
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Content Library</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Manage JLPT learning materials and resources
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl text-sm font-bold border border-[var(--border)] bg-[var(--accent)] text-secondary-col">
          {upperLevel} Level
        </span>
      </div>

      {/* Skill Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {skillCards.map((skill, i) => (
          <Link
            key={skill.id}
            to="/admin/content-library/$level/$skill"
            params={{ level: levelStr, skill: skill.id }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card p-5 flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${skill.hoverBg}`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${skill.bg} border ${skill.border} group-hover:scale-110 transition-transform`}
              >
                <skill.icon className={`w-6 h-6 ${skill.color}`} />
              </div>
              <div className="text-center">
                <span className={`font-semibold text-sm ${skill.color}`}>{skill.label}</span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
