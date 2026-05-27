import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryBtn, GoogleBtn } from "@/components/auth-shell";
import { useState } from "react";
import { useAuth, rolePath, type Role } from "@/lib/auth";

export const Route = createFileRoute("/register")({ component: RegisterPage });

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState<RegisterForm>({ name: "", email: "", password: "", confirm: "" });
  const [role, setRole] = useState<Role>("student");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [certificate, setCertificate] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const update = (key: keyof RegisterForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (form.password !== form.confirm) { setErr("Passwords don't match."); return; }
    if (form.password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const extra = role === "teacher" ? { experience, bio } : undefined;
      const u = await register(form.name, form.email, form.password, role, extra);
      if (role === "teacher") {
        nav({ to: "/teacher-pending" });
      } else {
        nav({ to: rolePath(u.role) });
      }
    } catch {
      setErr("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const u = await loginWithGoogle();
      nav({ to: rolePath(u.role) });
    } catch {
      setErr("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCertificate(e.target.files[0]);
  };

  return (
    <AuthShell title="Create your account 🌸" subtitle="Join thousands of students learning Japanese."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-semibold">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {/* Role selector — Student / Teacher only */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/50 dark:bg-white/5 rounded-2xl">
          {(["student", "teacher"] as Role[]).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-3 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
                role === r
                  ? "bg-gradient-hero text-white shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:bg-white/60"
              }`}
            >
              {r === "student" ? "🎓 Student" : "🧑‍🏫 Teacher"}
            </button>
          ))}
        </div>

        <Field
          label="Full name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Yuki Tanaka"
          autoComplete="name"
        />
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
          type="password"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
        />
        <Field
          label="Confirm password"
          type="password"
          required
          value={form.confirm}
          onChange={(e) => update("confirm", e.target.value)}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />

        {/* Teacher extra fields */}
        {role === "teacher" && (
          <div className="space-y-4 p-4 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/40">
            <p className="text-xs font-bold text-foreground/70 uppercase tracking-widest mb-1">Teacher application</p>

            <label className="block">
              <span className="text-xs font-semibold text-foreground/80">Teaching Experience</span>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 3 years teaching at Tokyo Language School, JLPT N1 certified…"
                rows={3}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-foreground/80">Bio / About Me</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about your background and teaching style…"
                rows={3}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-foreground/80">Certificate Upload</span>
              <div className="mt-1.5 relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertChange}
                  className="hidden"
                  id="cert-upload"
                />
                <label
                  htmlFor="cert-upload"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary/40 bg-white/40 text-sm font-medium text-primary cursor-pointer hover:bg-white/60 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {certificate ? certificate.name : "Upload certificate (PDF, JPG, PNG)"}
                </label>
              </div>
            </label>
          </div>
        )}

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
              Creating account…
            </span>
          ) : role === "teacher" ? (
            "Submit teacher application"
          ) : (
            "Create account"
          )}
        </PrimaryBtn>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <GoogleBtn onClick={handleGoogle} disabled={loading || googleLoading} />

        <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
          Admin accounts are created internally — not via signup.
        </p>
      </form>
    </AuthShell>
  );
}
