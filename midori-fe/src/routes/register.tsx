import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryBtn } from "@/components/auth-shell";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/register")({ component: RegisterPage });

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: keyof RegisterForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (form.password !== form.confirm) {
      setErr("Passwords don't match.");
      return;
    }
    if (form.password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password);
      nav({ to: "/verify-otp", state: { email: form.email } });
    } catch (err) {
      if (err instanceof ApiError) {
        setErr(err.message);
      } else {
        setErr("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account 🌸"
      subtitle="Join thousands of students learning Japanese."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/50 dark:bg-white/5 rounded-2xl">
          <div className="px-3 py-3 rounded-xl text-sm font-semibold capitalize text-center bg-gradient-hero text-white shadow-lg shadow-primary/30">
            🎓 Student
          </div>
          <div className="px-3 py-3 rounded-xl text-sm font-semibold capitalize text-center text-muted-foreground hover:bg-white/60 transition cursor-not-allowed opacity-50">
            🧑‍🏫 Teacher
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground -mt-1">
          Teacher registration coming soon.{" "}
          <Link to="/register" className="text-primary hover:underline">
            Contact us
          </Link>{" "}
          for teacher onboarding.
        </p>

        <Field
          label="Email address"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Field
          label="Password"
          type={showPassword ? "text" : "password"}
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
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
        <Field
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          required
          value={form.confirm}
          onChange={(e) => update("confirm", e.target.value)}
          placeholder="Repeat your password"
          autoComplete="new-password"
          endAdornment={
            <button
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              onClick={() => setShowConfirm((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        {err && (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {err}
          </div>
        )}

        <PrimaryBtn type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                />
              </svg>
              Creating account…
            </span>
          ) : (
            "Create account"
          )}
        </PrimaryBtn>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            or
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="text-xs text-muted-foreground hover:text-primary transition"
          >
            Sign in with Google — coming soon
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
          Admin accounts are created internally — not via signup.
        </p>
      </form>
    </AuthShell>
  );
}
