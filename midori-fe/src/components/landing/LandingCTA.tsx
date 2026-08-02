import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function LandingCTA() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 dark:text-white mb-6">
          Ready to start your Japanese learning journey?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
          Explore lessons, practice with AI Sensei, and track your progress on MIDORI.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            Sign Up Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
