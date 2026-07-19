import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/logo";

type FooterLink = {
  label: string;
  href: string;
};

const teachingLinks: FooterLink[] = [
  { label: "Dashboard", href: "/teacher" },
  { label: "My Classes", href: "/teacher/classes" },
  { label: "Homework", href: "/teacher/homework" },
  { label: "Exams", href: "/teacher/exams" },
];

const contentLinks: FooterLink[] = [
  { label: "Question Bank", href: "/teacher/question-bank" },
  { label: "JLPT Bank", href: "/teacher/jlpt-bank" },
  { label: "My Questions", href: "/teacher/my-questions" },
];

const learningLinks: FooterLink[] = [
  { label: "Vocabulary", href: "/teacher/vocabulary" },
  { label: "Grammar", href: "/teacher/grammar" },
  { label: "Listening", href: "/teacher/listening" },
];

const accountLinks: FooterLink[] = [
  { label: "Profile", href: "/teacher/profile" },
  { label: "Settings", href: "/teacher/settings" },
];

export function TeacherFooter() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/80 dark:border-white/10 dark:bg-[#080c1a]/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Brand section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/teacher" className="inline-flex items-center gap-2.5">
              <Logo size={28} />
              <div className="space-y-0.5">
                <div className="font-display text-sm font-extrabold tracking-[0.14em] text-slate-800 dark:text-white">
                  MIDORI
                </div>
                <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400 dark:text-white/40">
                  Teacher System
                </div>
              </div>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Manage classes, create content, and track student progress on the MIDORI platform.
            </p>
          </div>

          {/* Teaching */}
          <div className="lg:col-span-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-white/50 mb-2">
              Teaching
            </h3>
            <ul className="space-y-1.5">
              {teachingLinks.map((link) => (
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

          {/* Content */}
          <div className="lg:col-span-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-white/50 mb-2">
              Content
            </h3>
            <ul className="space-y-1.5">
              {contentLinks.map((link) => (
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

          {/* Learning Content */}
          <div className="lg:col-span-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-white/50 mb-2">
              Learning Content
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
        </div>
      </div>

      <div className="border-t border-slate-100/60 dark:border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <p className="text-[11px] text-slate-400 dark:text-white/30">
            © 2026 MIDORI Teacher. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-white/30">
            Japanese Learning Platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
