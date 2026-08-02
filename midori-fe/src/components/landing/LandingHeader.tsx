import { Link, useRouter } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { useAuth, getDashboardPath, isStudentActive } from "@/lib/auth";
import { useState } from "react";

export function LandingHeader() {
  const { user, loaded, refreshCurrentUser } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleCheckClass = async () => {
    setChecking(true);
    try {
      const updatedUser = await refreshCurrentUser();
      if (updatedUser && isStudentActive(updatedUser)) {
        router.navigate({ to: getDashboardPath(updatedUser) });
      } else {
        alert("You have not been added to any class yet. Please contact your teacher or try again later.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <Logo size={36} />
          <div className="hidden sm:block">
            <span className="font-display font-extrabold text-lg tracking-[0.12em] text-foreground group-hover:text-primary transition-colors">
              MIDORI
            </span>
            <span className="block text-[10px] text-muted-foreground font-semibold -mt-1 tracking-wider uppercase">
              Japanese Learning
            </span>
          </div>
        </Link>

        {/* Middle: Nav Links (Hidden on small screens) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
          <button onClick={() => handleScrollTo("hero")} className="hover:text-primary transition-colors">Home</button>
          <button onClick={() => handleScrollTo("features")} className="hover:text-primary transition-colors">Features</button>
          <button onClick={() => handleScrollTo("guide")} className="hover:text-primary transition-colors">Guide</button>
          <button onClick={() => handleScrollTo("benefits")} className="hover:text-primary transition-colors">Benefits</button>
          <button onClick={() => handleScrollTo("consultation")} className="hover:text-primary transition-colors">Contact</button>
        </nav>

        {/* Right: Auth Buttons */}
        <div className="flex items-center gap-3">
          {!loaded ?
            <div className="w-24 h-9 bg-muted rounded-xl animate-pulse" />
          : user ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-sm font-semibold text-foreground">
                Welcome, {user.name}
              </span>
              {user.role === 'student' && !isStudentActive(user) ? (
                <button
                  onClick={handleCheckClass}
                  disabled={checking}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap disabled:opacity-70 disabled:pointer-events-none"
                >
                  {checking ? "Checking..." : "Check Class Status"}
                </button>
              ) : (
                <Link
                  to={getDashboardPath(user)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
