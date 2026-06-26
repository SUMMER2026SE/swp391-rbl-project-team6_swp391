import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/logo";

type FooterLink = {
  label: string;
  href: string;
};

const learningLinks: FooterLink[] = [
  { label: "Vocabulary", href: "/student/vocabulary" },
  { label: "Grammar", href: "/student/grammar" },
  { label: "Flashcards", href: "/student/flashcards" },
  { label: "Listening", href: "/student/listening" },
  { label: "Progress", href: "/student/progress" },
];

const platformLinks: FooterLink[] = [
  { label: "Dashboard", href: "/student" },
  { label: "Exams", href: "/student/exams" },
  { label: "Profile", href: "/student/profile" },
];

function FooterLinkList({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="min-w-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              to={link.href}
              className="text-slate-600 dark:text-slate-400 transition-colors duration-200 hover:text-indigo-600 dark:hover:text-indigo-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 dark:border-white/10 dark:bg-[#080c1a]">
      <div className="mx-auto max-w-6xl px-6 py-7 lg:px-8">
        <div className="grid grid-cols-3 gap-8 lg:grid-cols-[1.4fr_0.75fr_0.75fr] lg:gap-10">
          <div className="min-w-0 pl-2 lg:pl-0">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <Logo size={32} />
              <div className="space-y-0.5">
                <div className="font-display text-base font-extrabold tracking-[0.14em] text-slate-800 dark:text-white">
                  MIDORI
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-white/40">
                  Japanese Learning
                </div>
              </div>
            </Link>
            <p className="mt-3 max-w-[230px] text-sm leading-[1.65] text-slate-600 dark:text-slate-400">
              Learn Japanese smarter with focused vocabulary, grammar, flashcards, and listening
              practice.
            </p>
          </div>

          <FooterLinkList title="Learning" links={learningLinks} />
          <FooterLinkList title="Platform" links={platformLinks} />
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 lg:px-8">
          <p className="text-xs text-slate-400 dark:text-white/30">
            © 2026 MIDORI. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-white/30">
            Built for Japanese learning platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
