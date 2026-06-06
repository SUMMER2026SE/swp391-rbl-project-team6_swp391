import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryBtn, GoogleBtn } from "@/components/auth-shell";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth, rolePath } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const u = await login(email, password);

      if (u.role === "teacher" && u.status === "pending") {
        nav({ to: "/teacher-pending" });
      } else {
        nav({ to: rolePath(u.role) });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErr(err.message);
      } else {
        setErr("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setGoogleLoading(true);
    try {
      const u = await loginWithGoogle(credential);

      if (u.role === "teacher" && u.status === "pending") {
        nav({ to: "/teacher-pending" });
      } else {
        nav({ to: rolePath(u.role) });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErr(err.message);
      } else {
        setErr("Unable to sign in. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErr("Google sign-in failed. Please try again.");
  };

  return (
    <AuthShell
      title="Welcome back 🌸"
      subtitle="Sign in to continue your Japanese journey."
      footer={<>Don't have an account? <Link to="/register" className="text-primary font-semibold">Sign up free</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Email address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Field
          label="Password"
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          endAdornment={
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-muted-foreground font-medium">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-primary font-semibold hover:underline underline-offset-2">
            Forgot password?
          </Link>
        </div>
        {err && (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {err}
          </div>
        )}
        <PrimaryBtn type="submit" disabled={loading || googleLoading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </PrimaryBtn>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <GoogleBtn onSuccess={handleGoogleSuccess} onError={handleGoogleError} disabled={loading || googleLoading} />
      </form>
    </AuthShell>
  );
}
