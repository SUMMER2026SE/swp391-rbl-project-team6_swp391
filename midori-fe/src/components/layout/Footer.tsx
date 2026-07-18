import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/logo";

type FooterLink = {
  label: string;
  href: string;
};

const quickLinks: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/student" },
  { label: "Classes", href: "/student/classes" },
];

const learningLinks: FooterLink[] = [
  { label: "Vocabulary", href: "/student/vocabulary" },
  { label: "Grammar", href: "/student/grammar" },
  { label: "Listening", href: "/student/listening" },
];

const practiceLinks: FooterLink[] = [
  { label: "AI Sensei", href: "/student/ai-sensei" },
  { label: "Progress", href: "/student/progress" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/80 dark:border-white/10 dark:bg-[#080c1a]/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top section with grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Brand section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <Logo size={28} />
              <div className="space-y-0.5">
                <div className="font-display text-sm font-extrabold tracking-[0.14em] text-slate-800 dark:text-white">
                  MIDORI
                </div>
                <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400 dark:text-white/40">
                  Japanese Learning
                </div>
              </div>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Learn Japanese with smart lessons, practice tools, and AI support.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-white/50 mb-2">
              Quick Links
            </h3>
            <ul className="space-y-1.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200 hover:text-primary dark:hover:text-primary-col"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learning */}
          <div className="lg:col-span-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-white/50 mb-2">
              Learning
            </h3>
            <ul className="space-y-1.5">
              {learningLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200 hover:text-primary dark:hover:text-primary-col"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice */}
          <div className="lg:col-span-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-white/50 mb-2">
              Practice
            </h3>
            <ul className="space-y-1.5">
              {practiceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200 hover:text-primary dark:hover:text-primary-col"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100/60 dark:border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <p className="text-[11px] text-slate-400 dark:text-white/30">
            © 2026 MIDORI. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-white/30">
            Built for Japanese learning platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
