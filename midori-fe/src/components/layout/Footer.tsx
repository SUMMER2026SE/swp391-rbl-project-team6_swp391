import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/logo";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const quickLinks: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "Vocabulary", href: "/student/vocabulary" },
  { label: "Lessons", href: "/student/grammar" },
  { label: "Practice", href: "/student/flashcards" },
  { label: "About", href: "#features" },
];

const learningLinks: FooterLink[] = [
  { label: "JLPT N5", href: "/student/jlpt" },
  { label: "Flashcards", href: "/student/flashcards" },
  { label: "Listening", href: "/student/listening" },
  { label: "Grammar", href: "/student/grammar" },
  { label: "Progress", href: "/student/progress" },
];

const supportLinks: FooterLink[] = [
  { label: "Help Center", href: "#" },
  { label: "Contact", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

function FooterLinkList({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/85">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            {link.external ? (
              <a
                href={link.href}
                className="inline-flex transition-colors duration-200 hover:text-primary"
              >
                {link.label}
              </a>
            ) : (
              <Link
                to={link.href}
                className="inline-flex transition-colors duration-200 hover:text-primary"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-white/10 bg-linear-to-b from-[#0d1326] via-[#0b1020] to-[#080d18] text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/5 to-transparent" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 sm:px-8 md:grid-cols-2 md:gap-x-10 md:gap-y-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:items-start">
        <div className="min-w-0 max-w-[320px]">
          <Link to="/" className="inline-flex items-center gap-3.5">
            <Logo size={46} />
            <div className="space-y-1">
              <div className="font-display text-xl font-extrabold tracking-[0.16em] text-white">
                MIDORI
              </div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
                Japanese Learning
              </div>
            </div>
          </Link>

          <p className="mt-5 max-w-[320px] text-sm leading-6 text-white/65">
            Learn Japanese smarter with vocabulary, lessons, and practice tools.
          </p>
        </div>

        <FooterLinkList title="Quick Links" links={quickLinks} />
        <FooterLinkList title="Learning" links={learningLinks} />
        <FooterLinkList title="Support" links={supportLinks} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 py-5 text-center text-sm text-white/55 sm:px-8 md:flex-row md:justify-between md:text-left">
          <p>© 2026 MIDORI. All rights reserved.</p>
          <p>Built for Japanese learning platform.</p>
        </div>
      </div>
    </footer>
  );
}
