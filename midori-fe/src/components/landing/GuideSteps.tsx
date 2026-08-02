import { UserPlus, LayoutList, BookOpenCheck, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    num: "01",
    title: "Create Account",
    description: "Register an account with your email and verify basic details.",
    icon: UserPlus,
    color: "from-blue-500 to-cyan-500",
    bgClass: "bg-blue-50 dark:bg-blue-900/20"
  },
  {
    num: "02",
    title: "Choose Content",
    description: "Select levels, skills, or lessons that match your learning goals.",
    icon: LayoutList,
    color: "from-emerald-500 to-teal-500",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/20"
  },
  {
    num: "03",
    title: "Study & Practice",
    description: "Learn vocabulary, grammar, reading comprehension, listening comprehension, and practice with AI Sensei.",
    icon: BookOpenCheck,
    color: "from-purple-500 to-pink-500",
    bgClass: "bg-purple-50 dark:bg-purple-900/20"
  },
  {
    num: "04",
    title: "Track Progress",
    description: "View scores, learning streaks, and progress for each skill.",
    icon: LineChart,
    color: "from-amber-500 to-orange-500",
    bgClass: "bg-amber-50 dark:bg-amber-900/20"
  }
];

export function GuideSteps() {
  return (
    <section id="guide" className="py-24 bg-white dark:bg-slate-950 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
            Guide
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-800 dark:text-white mt-4">
            Get started with MIDORI in just 4 steps
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative group">
              {/* Connection line between steps (hidden on small screens) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-[2px] bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700 z-0" />
              )}
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={cn(
                  "w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl transition-transform duration-300 group-hover:-translate-y-2 border border-white/50 dark:border-white/10",
                  step.bgClass
                )}>
                  <step.icon className={cn("w-10 h-10 text-transparent bg-clip-text bg-gradient-to-br", step.color)} style={{ stroke: "url(#" + step.color.split(" ")[0].substring(5) + ")" }} />
                  {/* SVG Gradient definition trick for Lucide icons if needed, or just use solid colors. Let's fallback to text color if gradient stroke doesn't work out of box */}
                  <step.icon className="w-10 h-10 absolute opacity-80" stroke="currentColor" />
                </div>
                
                <div className="text-4xl font-black text-slate-100 dark:text-slate-800/50 mb-2 font-display">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
