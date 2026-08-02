import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingHero() {
  const handleScrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="hero" className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Left Side: Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            Learn Japanese Smarter with MIDORI
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.1] tracking-tight text-slate-900 dark:text-white mb-6">
            Japanese learning platform <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Comprehensive
            </span>
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-lg">
            Study vocabulary, grammar, reading comprehension, listening comprehension, practice with AI Sensei, and track personal learning progress in a single system.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white font-bold text-lg transition-all shadow-xl shadow-pink-500/25 flex items-center gap-2"
            >
              Sign Up Free <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={handleScrollToFeatures}
              className="px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              Explore Features
            </button>
          </div>
        </motion.div>

        {/* Right Side: Visuals/Screenshots */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative lg:h-[600px] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-pink-500/20 to-transparent blur-3xl rounded-full" />
          
          {/* Main Dashboard Mockup */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="h-8 bg-slate-100 dark:bg-slate-800 flex items-center px-4 gap-1.5 border-b border-slate-200 dark:border-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            {/* Real Feature Mockup */}
            <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-900 flex flex-col p-6 gap-4 relative overflow-hidden">
               {/* Background pattern */}
               <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
               
               <div className="flex gap-4 relative z-10">
                 <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">New Vocabulary</span>
                    <span className="text-4xl font-black text-primary font-japanese">先生</span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2">Teacher (Sensei)</span>
                 </div>
                 <div className="w-24 bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center text-white">
                    <span className="text-3xl font-black mb-1">10</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100 text-center">Today's<br/>Words</span>
                 </div>
               </div>

               <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-sm p-4 relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold">N5</div>
                    <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[65%]" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">65%</span>
                 </div>
                 
                 <div className="space-y-3">
                   <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                     <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-xl">🎌</div>
                     <div className="flex-1">
                       <h4 className="text-sm font-bold text-slate-800 dark:text-white">Grammar Lesson 1</h4>
                       <p className="text-[10px] text-slate-500">12/15 patterns</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 opacity-60">
                     <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-xl">🎧</div>
                     <div className="flex-1">
                       <h4 className="text-sm font-bold text-slate-800 dark:text-white">Minna Listening</h4>
                       <p className="text-[10px] text-slate-500">Not started</p>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Floating UI Elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 top-20 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-100 dark:border-white/5 hidden md:block"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-xs">AI</div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">AI Sensei</p>
                <p className="text-[10px] text-muted-foreground">Ready to support you!</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-12 bottom-32 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-100 dark:border-white/5 hidden md:block"
          >
            <div className="text-xs text-muted-foreground mb-1">Daily Streak</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-amber-500">12</span>
              <span className="text-sm font-bold pb-1 text-slate-700 dark:text-slate-300">Days 🔥</span>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
