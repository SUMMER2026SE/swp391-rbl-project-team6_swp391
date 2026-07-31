import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryBtn } from "@/components/auth-shell";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError, isApiError } from "@/lib/api/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const token =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("token") ?? "")
      : "";

  const s = strength(password);
  const labels = ["Too weak", "Weak", "Okay", "Strong", "Excellent"];
  const colors = ["bg-destructive", "bg-jp-red", "bg-yellow-500", "bg-sky-blue", "bg-primary"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password !== confirm) {
      setErr("Passwords don't match.");
      return;
    }
    if (s < 2) {
      setErr("Password is too weak.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      nav({ to: "/reset-success" });
    } catch (err) {
      if (isApiError(err)) {
        setErr(err.message);
      } else {
        setErr("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create new password" subtitle="Make it strong — at least 8 characters.">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Field
          label="New password"
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          endAdornment={
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < s ? colors[s - 1] : "bg-muted"}`}
            />
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {password ? labels[Math.max(0, s - 1)] : "Enter a password"}
        </div>
        <Field
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          endAdornment={
            <button
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              onClick={() => setShowConfirm((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        {confirm && confirm !== password && (
          <div className="text-xs text-destructive">Passwords don't match</div>
        )}
        {err && (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {err}
          </div>
        )}
        <PrimaryBtn type="submit" disabled={!password || password !== confirm || s < 2 || loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
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
              Resetting password…
            </span>
          ) : (
            "Reset password"
          )}
        </PrimaryBtn>
      </form>
    </AuthShell>
  );
}
