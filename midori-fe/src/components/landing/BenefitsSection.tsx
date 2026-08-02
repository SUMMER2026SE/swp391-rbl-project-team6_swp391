import { Layers, Target, Bot, Activity, Smartphone, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  {
    title: "Systematic Learning",
    description: "Content organized by level and individual Japanese language skills.",
    icon: Layers,
    color: "text-blue-500",
    bgClass: "bg-blue-50 dark:bg-blue-500/10"
  },
  {
    title: "Comprehensive Practice",
    description: "Support for vocabulary, grammar, reading, listening, and quizzes.",
    icon: Target,
    color: "text-emerald-500",
    bgClass: "bg-emerald-50 dark:bg-emerald-500/10"
  },
  {
    title: "AI Assistance",
    description: "AI Sensei helps explain lessons and supports practicing.",
    icon: Bot,
    color: "text-pink-500",
    bgClass: "bg-pink-50 dark:bg-pink-500/10"
  },
  {
    title: "Clear Progress Tracking",
    description: "Results and learning progress are summarized on the dashboard.",
    icon: Activity,
    color: "text-amber-500",
    bgClass: "bg-amber-50 dark:bg-amber-500/10"
  },
  {
    title: "Learn Anytime, Anywhere",
    description: "Interface optimized for computers, tablets, and phones.",
    icon: Smartphone,
    color: "text-purple-500",
    bgClass: "bg-purple-50 dark:bg-purple-500/10"
  },
  {
    title: "Teacher-Student Connection",
    description: "Teachers can assign tasks, manage classes, and track learning results.",
    icon: Users,
    color: "text-indigo-500",
    bgClass: "bg-indigo-50 dark:bg-indigo-500/10"
  }
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-24 bg-slate-50/50 dark:bg-slate-900/20 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
            Benefits
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-800 dark:text-white mt-4">
            Why choose MIDORI?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200/50 dark:border-white/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", benefit.bgClass)}>
                <benefit.icon className={cn("w-7 h-7", benefit.color)} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
