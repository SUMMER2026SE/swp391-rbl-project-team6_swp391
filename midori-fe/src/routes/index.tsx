import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { SakuraBg } from "@/components/sakura-bg";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import {
  Sparkles,
  Mic,
  Headphones,
  ClipboardCheck,
  GraduationCap,
  Trophy,
  ArrowRight,
  Check,
  Lock,
  Users,
  BookOpen,
} from "lucide-react";
import { rolePath, isStudentActive, useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { User } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Redirect logged-in guest students (who haven't joined a class) to intro page
    try {
      const raw = localStorage.getItem("midori_user");
      if (raw) {
        const user = JSON.parse(raw) as User;
        if (user.role === "student" && !isStudentActive(user)) {
          throw redirect({ to: "/student/intro" });
        }
      }
    } catch (e) {
      // If it's a redirect error, re-throw it
      if (e && typeof e === "object" && "to" in e) throw e;
    }
  },
  component: Landing,
});

function Landing() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { user: authUser } = useAuth();

  useEffect(() => {
    // Use auth context if available, otherwise fall back to localStorage
    if (authUser) {
      setUser(authUser);
    } else {
      try {
        const raw = localStorage.getItem("midori_user");
        if (raw) setUser(JSON.parse(raw));
      } catch {}
    }
    setLoaded(true);
  }, [authUser]);

  // Check if student is active (joined a class) - GUEST students see CTA
  const hasExplicitGuestStatus =
    user?.role === "student" &&
    user.status !== undefined &&
    user.status !== null &&
    user.status !== "ACTIVE";

  const isActiveStudent = user?.role === "student" && !hasExplicitGuestStatus;

  const logout = () => {
    setUser(null);
    localStorage.removeItem("midori_user");
    localStorage.removeItem("midori_access_token");
  };

  const navButtons = !loaded ? null : user ? (
    <>
      {isActiveStudent ? (
        <Link
          to={rolePath(user.role)}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition"
        >
          Go to Dashboard
        </Link>
      ) : (
        <Link
          to="/student/classes"
          className="px-4 py-2 rounded-xl bg-gradient-hero hover:opacity-90 text-sm font-medium transition flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Join a Class
        </Link>
      )}
      <button
        onClick={logout}
        className="px-4 py-2 text-sm font-medium hover:text-primary transition"
      >
        Logout
      </button>
    </>
  ) : (
    <>
      <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-primary transition">
        Login
      </Link>
      <Link
        to="/register"
        className="px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
      >
        Get started
      </Link>
    </>
  );

  return (
    <div className="min-h-screen">
      <SakuraBg count={22} />
      {/* Nav */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={40} />
          <span className="font-display font-extrabold text-xl tracking-[0.12em] text-foreground">
            MIDORI
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-foreground/80">
          <a href="#features">Features</a>
          <a href="#levels">JLPT Levels</a>
        </nav>
        <div className="flex items-center gap-2">{navButtons}</div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-20 grid lg:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> AI-powered Japanese learning · N5 → N1
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold font-display leading-[1.05] tracking-tight">
            Master Japanese <br />
            with <span className="gradient-text">MIDORI</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">
            Grammar lessons, listening dictation, AI shadowing and real JLPT mock exams — all guided
            by an AI that gives instant, native-level feedback.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="px-6 py-3 rounded-2xl bg-gradient-hero text-white font-semibold shadow-lg hover:shadow-xl transition flex items-center gap-2"
            >
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-2xl glass font-semibold hover:bg-white/70 transition"
            >
              I already have an account
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> No credit card
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> 5 JLPT levels
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> AI feedback
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="glass rounded-3xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Today's lesson
                </div>
                <div className="font-display font-bold text-xl">〜なければなりません</div>
              </div>
              <span className="px-2.5 py-1 text-[10px] rounded-full bg-jp-red/10 text-jp-red font-bold">
                N4
              </span>
            </div>
            <div className="rounded-2xl bg-gradient-sakura p-5 mb-4">
              <div className="text-3xl font-display font-bold">毎日勉強しなければなりません。</div>
              <div className="text-sm text-muted-foreground mt-1">
                Mainichi benkyou shinakereba narimasen.
              </div>
              <div className="text-sm mt-2">"I must study every day."</div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { l: "XP", v: "+120" },
                { l: "Streak", v: "32d" },
                { l: "Accuracy", v: "94%" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-white/60 dark:bg-white/5 p-3">
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                  <div className="font-display font-bold text-lg">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-4 -right-4 glass rounded-2xl p-4 w-44"
          >
            <div className="text-xs text-muted-foreground">AI Shadowing</div>
            <div className="font-display font-bold">96% native-like</div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[96%] bg-gradient-hero" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Guest Student CTA Section */}
      {user && !isActiveStudent && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold font-display mb-4">
                Welcome, {user.name || "Student"}!
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                You're almost ready to start your Japanese learning journey. Join a class to unlock
                all learning modules, track your progress, and get AI-powered feedback.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  Grammar lessons
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  AI Shadowing
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  Progress tracking
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  JLPT mock exams
                </div>
              </div>
              <Link
                to="/student/classes"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-hero text-white font-bold text-lg shadow-lg hover:shadow-xl transition"
              >
                <BookOpen className="w-5 h-5" />
                Join a Class
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold font-display">
            Everything you need to reach <span className="gradient-text">JLPT N1</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Four AI-powered training modes built specifically for serious Japanese learners.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: GraduationCap,
              title: "Grammar by level",
              desc: "Structured lessons from N5 to N1 with examples and quizzes.",
            },
            {
              icon: Headphones,
              title: "Listening dictation",
              desc: "AI checks your transcription, highlights mistakes, explains why.",
            },
            {
              icon: Mic,
              title: "AI shadowing",
              desc: "Pass each sentence before unlocking the next. Native-level scoring.",
            },
            {
              icon: ClipboardCheck,
              title: "JLPT Exam Room",
              desc: "Full timed mock exams with AI-generated mistake explanations.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass glass-hover rounded-3xl p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-hero grid place-items-center text-white mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Levels */}
      <section id="levels" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-extrabold font-display text-center mb-10">
          Train at every JLPT level
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {["N5", "N4", "N3", "N2", "N1"].map((l, i) => (
            <motion.div
              key={l}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl p-6 text-center glass-hover"
            >
              <div className="text-4xl font-extrabold gradient-text">{l}</div>
              <div className="text-xs text-muted-foreground mt-2">
                {["Beginner", "Elementary", "Intermediate", "Advanced", "Native-level"][i]}
              </div>
              <Trophy className="w-5 h-5 text-jp-red mx-auto mt-3 opacity-70" />
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
