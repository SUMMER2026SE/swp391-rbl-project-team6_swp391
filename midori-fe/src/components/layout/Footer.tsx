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
  { label: "About", href: "#features", external: true },
];

const learningLinks: FooterLink[] = [
  { label: "JLPT N5", href: "/student/jlpt" },
  { label: "Flashcards", href: "/student/flashcards" },
  { label: "Listening", href: "/student/listening" },
  { label: "Grammar", href: "/student/grammar" },
  { label: "Progress", href: "/student/progress" },
];

function FooterLinkList({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/85">
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
    <footer className="mt-16 border-t border-border/60 bg-linear-to-b from-background via-background to-primary/5">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-16">
          <div className="min-w-0 max-w-[320px]">
            <Link to="/" className="inline-flex items-center gap-3">
              <Logo size={40} />
              <div className="space-y-1">
                <div className="font-display text-lg font-extrabold tracking-[0.14em] text-foreground">
                  MIDORI
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Japanese Learning
                </div>
              </div>
            </Link>

            <p className="mt-4 max-w-[320px] text-sm leading-6 text-muted-foreground">
              Learn Japanese smarter with vocabulary, lessons, and practice tools.
            </p>
          </div>

          <FooterLinkList title="Quick Links" links={quickLinks} />
          <FooterLinkList title="Learning" links={learningLinks} />
        </div>
      </div>

      <div className="border-t border-border/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-center text-sm text-muted-foreground sm:px-8 md:flex-row md:items-center md:justify-between md:text-left lg:px-8">
          <p>© 2026 MIDORI. All rights reserved.</p>
          <p>Built for Japanese learning platform.</p>
        </div>
      </div>
    </footer>
  );
}
