import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";

export function LandingFooter() {
  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="border-t border-slate-200/70 bg-slate-50 dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-2 min-w-0">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <Logo size={40} />
              <div className="space-y-0.5">
                <div className="font-display text-lg font-extrabold tracking-[0.14em] text-slate-800 dark:text-white">
                  MIDORI
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-semibold">
                  Japanese Learning Platform
                </div>
              </div>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Comprehensive Japanese learning platform helping you improve vocabulary, grammar, reading comprehension, listening comprehension, and practice with AI Sensei.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800 dark:text-white mb-4">
              Product
            </h3>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => handleScrollTo("features")} className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Features</button></li>
              <li><button onClick={() => handleScrollTo("guide")} className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Guide</button></li>
              <li><Link to="/login?redirect=/student" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">For Students</Link></li>
              <li><Link to="/login?redirect=/teacher" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">For Teachers</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800 dark:text-white mb-4">
              Support
            </h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">FAQs</a></li>
              <li><button onClick={() => handleScrollTo("consultation")} className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Contact</button></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Terms of Use</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200/70 dark:border-white/5 bg-slate-100 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8 text-center sm:text-left">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} MIDORI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
