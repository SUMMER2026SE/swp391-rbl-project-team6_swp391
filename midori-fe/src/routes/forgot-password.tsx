import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryBtn } from "@/components/auth-shell";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErr(err.message);
      } else {
        setErr("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email and we'll send a reset link.">
      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@midori.jp"
          />
          {err && (
            <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {err}
            </div>
          )}
          <PrimaryBtn type="submit" disabled={loading}>
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
                Sending…
              </span>
            ) : (
              "Send reset link"
            )}
          </PrimaryBtn>
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary justify-center"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </Link>
        </form>
      ) : (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 grid place-items-center mx-auto mb-3">
            <MailCheck className="w-6 h-6 text-primary" />
          </div>
          <div className="font-display font-bold text-lg">Check your email!</div>
          <div className="text-sm text-muted-foreground mt-1">
            If that account exists, a reset link was sent to{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary justify-center mt-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
