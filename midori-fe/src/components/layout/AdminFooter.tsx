import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/logo";

type FooterLink = {
  label: string;
  href: string;
};

const managementLinks: FooterLink[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Teachers", href: "/admin/teachers" },
  { label: "Classes", href: "/admin/class-management" },
  { label: "Question Bank", href: "/admin/question-bank" },
];

const systemLinks: FooterLink[] = [
  { label: "JLPT Exam", href: "/admin/jlpt-exam" },
  { label: "Content Library", href: "/admin/content-library" },
  { label: "Notifications", href: "/admin/notification" },
  { label: "Profile", href: "/admin/profile" },
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

export function AdminFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 dark:border-white/10 dark:bg-[#080c1a]">
      <div className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <div className="grid grid-cols-3 gap-8 lg:grid-cols-[1.4fr_0.75fr_0.75fr] lg:gap-10">
          <div className="min-w-0 pl-2 lg:pl-0">
            <Link to="/admin" className="inline-flex items-center gap-2.5">
              <Logo size={32} />
              <div className="space-y-0.5">
                <div className="font-display text-base font-extrabold tracking-[0.14em] text-slate-800 dark:text-white">
                  MIDORI
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-white/40">
                  Admin System
                </div>
              </div>
            </Link>
            <p className="mt-3 max-w-[230px] text-sm leading-[1.65] text-slate-600 dark:text-slate-400">
              Administrative console for managing teachers, classes, content, and the Midori
              Japanese learning platform.
            </p>
          </div>

          <FooterLinkList title="Management" links={managementLinks} />
          <FooterLinkList title="System" links={systemLinks} />
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
          <p className="text-xs text-slate-400 dark:text-white/30">
            © 2026 MIDORI Admin. All rights reserved. v1.0
          </p>
          <p className="text-xs text-slate-400 dark:text-white/30">
            Midori Japanese Learning Platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
