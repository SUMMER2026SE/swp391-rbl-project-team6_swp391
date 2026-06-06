import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, PrimaryBtn } from "@/components/auth-shell";
import { useEffect, useRef, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/verify-otp")({
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const { email = "" } = Route.useSearch();

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const setAt = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.join("");
    if (token.length < 6) return;
    setErr("");
    setLoading(true);
    try {
      await authApi.verifyEmail({ token });
      nav({ to: "/login" });
    } catch (err) {
      if (err instanceof ApiError) {
        setErr(err.message);
      } else {
        setErr("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErr("No email found. Please register again.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resendVerification({ email });
      setSeconds(60);
      setCode(["", "", "", "", "", ""]);
    } catch (err) {
      if (err instanceof ApiError) {
        setErr(err.message);
      } else {
        setErr("Failed to resend. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const allFilled = code.every((c) => c);

  return (
    <AuthShell title="Verify your email" subtitle="Enter the 6-digit code we just sent.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-between gap-2">
          {code.map((c, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={c}
              onChange={(e) => setAt(i, e.target.value)}
              maxLength={1}
              inputMode="numeric"
              className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 outline-none focus:ring-2 focus:ring-primary/50"
            />
          ))}
        </div>
        {err && (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {err}
          </div>
        )}
        <div className="text-center text-xs text-muted-foreground">
          {seconds > 0 ? (
            <>
              Resend code in{" "}
              <span className="font-semibold text-foreground">
                0:{seconds.toString().padStart(2, "0")}
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-primary font-semibold hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>
        <PrimaryBtn type="submit" disabled={!allFilled || loading}>
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
              Verifying…
            </span>
          ) : (
            "Verify code"
          )}
        </PrimaryBtn>
      </form>
    </AuthShell>
  );
}
