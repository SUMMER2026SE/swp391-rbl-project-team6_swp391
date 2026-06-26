import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  Users,
  BookOpen,
  Mic2,
  Headphones,
  PenTool,
  Star,
  ChevronRight,
  Play,
  Award,
  Globe,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookText,
  Volume2,
} from "lucide-react";

export const Route = createFileRoute("/student/intro")({
  component: StudentIntroPage,
});

function StudentIntroPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinClass = () => {
    setIsJoining(true);
    nav({ to: "/student/classes" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <span className="font-display font-extrabold text-xl tracking-[0.1em] text-primary">
                  MIDORI
                </span>
                <span className="text-xs text-muted-foreground block -mt-1">Japanese Learning</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/student/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Profile
              </Link>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || "S"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Welcome to Midori, {user?.name?.split(" ")[0] || "Student"}!
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Begin Your{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Japanese Journey
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of learners mastering Japanese through our comprehensive program
              designed by certified teachers from Japan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleJoinClass}
                disabled={isJoining}
                className="group relative px-8 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-70"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isJoining ? "Loading..." : "Join a Class"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <Link
                to="/student/profile"
                className="px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl font-semibold text-foreground hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Reviews Section */}
      <section className="py-20 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Our Teachers Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from certified Japanese teachers about our comprehensive curriculum and teaching
              methodology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                "Midori's curriculum follows the JF Standard for Japanese education, ensuring
                students develop practical communication skills from day one. The structured
                progression from Hiragana to advanced grammar is excellent."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold">
                  KY
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Yuki Kobayashi</h4>
                  <p className="text-sm text-muted-foreground">
                    JLPT N1 Certified • 12 years experience
                  </p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                "The shadowing exercises with native speakers are incredibly effective. Students
                develop natural pronunciation and intonation. The AI-powered feedback system helps
                them improve faster than traditional methods."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                  TS
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Takeshi Suzuki</h4>
                  <p className="text-sm text-muted-foreground">
                    Native Speaker • Speech Therapy Background
                  </p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                "Vocabulary retention techniques used here are based on cognitive science research.
                The spaced repetition system combined with contextual learning ensures long-term
                retention. My students love the flashcard system."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                  MH
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Mei Hayashi</h4>
                  <p className="text-sm text-muted-foreground">
                    PhD in Linguistics • Curriculum Designer
                  </p>
                </div>
              </div>
            </div>

            {/* Review 4 */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                "The listening exercises cover real-world Japanese conversations, not textbook
                Japanese. From train announcements to casual conversations, students build practical
                comprehension skills that prepare them for Japan."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                  HT
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Haruto Tanaka</h4>
                  <p className="text-sm text-muted-foreground">Business Japanese Specialist</p>
                </div>
              </div>
            </div>

            {/* Review 5 */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                "Reading practice with authentic Japanese texts, from simple tweets to newspaper
                articles, helps students understand different writing styles. The difficulty
                progression is perfectly calibrated."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                  AY
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Akiko Yamamoto</h4>
                  <p className="text-sm text-muted-foreground">
                    Literature Professor • N1 Examiner
                  </p>
                </div>
              </div>
            </div>

            {/* Review 6 */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                "Kanji mastery is systematic here. Students learn components, patterns, and remember
                characters through stories. The writing practice with AI feedback accelerates the
                learning curve significantly."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold">
                  RS
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Rei Sato</h4>
                  <p className="text-sm text-muted-foreground">
                    Calligraphy Instructor • Kanji Expert
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What You'll Learn
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive curriculum covers all aspects of Japanese language mastery.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookText,
                title: "Hiragana & Katakana",
                description:
                  "Master the two Japanese syllabaries with interactive exercises and mnemonics.",
                color: "from-pink-500 to-rose-500",
              },
              {
                icon: Volume2,
                title: "Listening Comprehension",
                description:
                  "Train your ear with native speakers, from basic phrases to natural conversations.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Mic2,
                title: "Shadowing Practice",
                description: "Improve pronunciation and intonation by mimicking native speakers.",
                color: "from-purple-500 to-fuchsia-500",
              },
              {
                icon: BookOpen,
                title: "Reading Skills",
                description:
                  "Progress from simple texts to authentic Japanese literature and articles.",
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: PenTool,
                title: "Writing & Kanji",
                description:
                  "Learn to write Kanji characters with stroke order guidance and practice.",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: GraduationCap,
                title: "Grammar & Vocabulary",
                description:
                  "Build a solid foundation with structured lessons and spaced repetition.",
                color: "from-indigo-500 to-violet-500",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br p-3 mb-4 shadow-lg",
                    feature.color,
                  )}
                >
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Award className="w-16 h-16 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join a class today and begin your path to Japanese fluency with guidance from certified
            teachers.
          </p>
          <button
            onClick={handleJoinClass}
            disabled={isJoining}
            className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-primary rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 disabled:opacity-70"
          >
            {isJoining ? "Loading..." : "Join a Class Now"}
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2024 Midori Japanese Learning. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
