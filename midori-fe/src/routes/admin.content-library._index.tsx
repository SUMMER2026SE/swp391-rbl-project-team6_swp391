import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Headphones, Mic } from "lucide-react";

export const Route = createFileRoute("/admin/content-library/_index")({
  component: ContentLibraryIndexPage,
});

const levels = [
  {
    id: "N5",
    name: "Beginner",
    desc: "Basic vocabulary & grammar",
    gradient: "from-sakura/40 to-lavender/50",
    iconBg: "bg-sakura/30",
    iconText: "text-sakura",
    badgeBg: "bg-sakura/25",
    badgeText: "text-sakura",
  },
  {
    id: "N4",
    name: "Elementary",
    desc: "Everyday expressions",
    gradient: "from-sky-blue/20 to-primary/30",
    iconBg: "bg-sky-blue/15",
    iconText: "text-sky-blue",
    badgeBg: "bg-sky-blue/15",
    badgeText: "text-sky-blue",
  },
  {
    id: "N3",
    name: "Intermediate",
    desc: "Complex structures",
    gradient: "from-lavender/40 to-sky-blue/50",
    iconBg: "bg-lavender/30",
    iconText: "text-lavender",
    badgeBg: "bg-lavender/25",
    badgeText: "text-lavender",
  },
  {
    id: "N2",
    name: "Upper-Int",
    desc: "Advanced expressions",
    gradient: "from-primary/20 to-lavender/30",
    iconBg: "bg-primary/15",
    iconText: "text-primary",
    badgeBg: "bg-primary/15",
    badgeText: "text-primary",
  },
  {
    id: "N1",
    name: "Advanced",
    desc: "Native-level mastery",
    gradient: "from-jp-red/20 to-orange-500/30",
    iconBg: "bg-jp-red/15",
    iconText: "text-jp-red",
    badgeBg: "bg-jp-red/15",
    badgeText: "text-jp-red",
  },
];

function ContentLibraryIndexPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black text-primary-col">Content Library</h1>
        <p className="text-sm text-secondary-col mt-1">Select a JLPT level to manage content</p>
      </div>

      {/* Level Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {levels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
            className="h-full"
          >
            <Link
              to="/admin/content-library/$level"
              params={{ level: level.id.toLowerCase() }}
              className="group block h-full"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--card)] to-[var(--card)] border border-[var(--border)] p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.02] hover:border-primary/30 h-full flex flex-col justify-between">
                {/* Gradient Accent */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${level.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    {/* Level Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${level.iconBg} flex items-center justify-center group-hover:bg-white/30 transition-colors`}
                      >
                        <BookOpen
                          className={`w-6 h-6 ${level.iconText} group-hover:text-white transition-colors`}
                        />
                      </div>
                      <div
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${level.badgeBg} ${level.badgeText} group-hover:bg-white/30 group-hover:text-white transition-all`}
                      >
                        JLPT
                      </div>
                    </div>

                    {/* Level Number */}
                    <div className="mb-2">
                      <span
                        className={`text-4xl font-black ${level.iconText} group-hover:text-white transition-colors`}
                      >
                        {level.id}
                      </span>
                    </div>

                    {/* Level Name */}
                    <div className="mb-1">
                      <span className="text-sm font-bold text-primary-col group-hover:text-white transition-colors">
                        {level.name}
                      </span>
                    </div>

                    {/* Description */}
                    <div>
                      <span className="text-xs text-muted-col group-hover:text-white/80 transition-colors">
                        {level.desc}
                      </span>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="mt-4 flex items-center gap-1">
                    <span className="text-xs font-medium text-primary-col/50 group-hover:text-white/70 transition-colors">
                      View
                    </span>
                    <svg
                      className="w-4 h-4 text-primary-col/50 group-hover:text-white/70 group-hover:translate-x-1 transition-all"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Decorative Circle */}
                <div
                  className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full ${level.iconBg} group-hover:bg-white/10 transition-colors`}
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Skill Categories */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-primary-col mb-4">Content Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="card-base p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-sakura/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-sakura" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-col">Vocabulary</p>
              <p className="text-xs text-muted-col">Words & kanji</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.3 }}
            className="card-base p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-lavender/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-lavender" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-col">Grammar</p>
              <p className="text-xs text-muted-col">Grammar patterns</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="card-base p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-blue/15 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-sky-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-col">Listening</p>
              <p className="text-xs text-muted-col">Audio exercises</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.3 }}
            className="card-base p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-jp-red/15 flex items-center justify-center">
              <Mic className="w-5 h-5 text-jp-red" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-col">Shadowing</p>
              <p className="text-xs text-muted-col">Speaking practice</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
