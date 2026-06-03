import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryBtn, GoogleBtn } from "@/components/auth-shell";
import { useState, useRef } from "react";
import { Eye, EyeOff, Upload, X, FileText, Image as ImageIcon, File, Check } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { useAuth, rolePath } from "@/lib/auth";

export const Route = createFileRoute("/register")({ component: RegisterPage });

type Role = "STUDENT" | "TEACHER";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

type PasswordRule = {
  label: string;
  test: (pw: string) => boolean;
};

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least 1 uppercase letter (A-Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least 1 lowercase letter (a-z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "At least 1 number (0-9)", test: (pw) => /\d/.test(pw) },
  {
    label: "At least 1 special character (!@#$%^&*?._-)",
    test: (pw) => /[@$!%*?&.#_\-]/.test(pw),
  },
];

function getPasswordErrors(password: string, confirm: string): string[] {
  const errors: string[] = [];
  if (password.length > 0 && password.length < 8)
    errors.push("Password must be at least 8 characters.");
  if (password.length > 0 && !/[A-Z]/.test(password))
    errors.push("Password must include an uppercase letter.");
  if (password.length > 0 && !/[a-z]/.test(password))
    errors.push("Password must include a lowercase letter.");
  if (password.length > 0 && !/\d/.test(password))
    errors.push("Password must include a number.");
  if (password.length > 0 && !/[@$!%*?&.#_\-]/.test(password))
    errors.push("Password must include a special character.");
  if (confirm.length > 0 && password !== confirm)
    errors.push("Passwords do not match.");
  return errors;
}

function isPasswordStrong(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

type CertificateFile = {
  file: File;
  name: string;
  issuer: string;
  size: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-blue-500" />;
  if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-gray-500" />;
}

function RegisterPage() {
  const nav = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>("STUDENT");
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [teachingExperience, setTeachingExperience] = useState("");
  const [bio, setBio] = useState("");
  const [certificates, setCertificates] = useState<CertificateFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [certificateErrors, setCertificateErrors] = useState<Record<number, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loginWithGoogle } = useAuth();

  const update = (key: keyof RegisterForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const subtitle =
    selectedRole === "STUDENT"
      ? "Join thousands of students learning Japanese."
      : "Create your teacher account and share Japanese with students.";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const validFiles: CertificateFile[] = [];
    let hasError = false;

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`Invalid file type: ${file.name}. Only PDF, JPG, PNG allowed.`);
        hasError = true;
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File too large: ${file.name}. Maximum 5MB per file.`);
        hasError = true;
        continue;
      }
      validFiles.push({
        file,
        name: "",
        issuer: "",
        size: formatFileSize(file.size),
      });
    }

    if (validFiles.length > 0) {
      setCertificates((prev) => [...prev, ...validFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeCertificate = (index: number) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
    setCertificateErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const updateCertificateName = (index: number, name: string) => {
    setCertificates((prev) =>
      prev.map((cert, i) => (i === index ? { ...cert, name } : cert))
    );
    if (name.trim()) {
      setCertificateErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const updateCertificateIssuer = (index: number, issuer: string) => {
    setCertificates((prev) =>
      prev.map((cert, i) => (i === index ? { ...cert, issuer } : cert))
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!form.name.trim()) {
      setErr("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      setErr("Email is required.");
      return;
    }

    const passwordErrors = getPasswordErrors(form.password, form.confirm);
    if (passwordErrors.length > 0) {
      setErr(passwordErrors[0]);
      return;
    }

    if (certificates.length > 0) {
      const errors: Record<number, string> = {};
      let hasErrors = false;
      certificates.forEach((cert, index) => {
        if (!cert.name.trim()) {
          errors[index] = "Please enter a certificate name.";
          hasErrors = true;
        }
      });
      if (hasErrors) {
        setCertificateErrors(errors);
        setErr("Please fill in all certificate names.");
        return;
      }
    }

    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        role: selectedRole,
      });

      const message =
        selectedRole === "TEACHER"
          ? "Teacher account created. Please verify your email."
          : "Account created. Please verify your email.";
      nav({ to: "/verify-otp", state: { email: form.email, message } });
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

  const handleGoogleSuccess = async (credential: string) => {
    setGoogleLoading(true);
    try {
      const u = await loginWithGoogle(credential, selectedRole);
      nav({ to: rolePath(u.role) });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message.toLowerCase().includes("pending admin approval")) {
          setErr("Your teacher account is pending admin approval. Please wait for admin review.");
        } else {
          setErr(err.message);
        }
      } else {
        setErr("Google sign-in failed. Please try again.");
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
      title="Create your account 🌸"
      subtitle={subtitle}
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
          <button
            type="button"
            onClick={() => setSelectedRole("STUDENT")}
            className={`px-3 py-3 rounded-xl text-sm font-semibold capitalize text-center transition-all ${
              selectedRole === "STUDENT"
                ? "bg-gradient-hero text-white shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:bg-white/60"
            }`}
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("TEACHER")}
            className={`px-3 py-3 rounded-xl text-sm font-semibold capitalize text-center transition-all ${
              selectedRole === "TEACHER"
                ? "bg-gradient-hero text-white shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:bg-white/60"
            }`}
          >
            🧑‍🏫 Teacher
          </button>
        </div>

        {selectedRole === "TEACHER" && (
          <p className="text-xs text-center text-muted-foreground -mt-1">
            Your teacher profile can be completed after email verification.
          </p>
        )}

        <Field
          label="Full name"
          type="text"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Enter your full name"
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
          type={showPassword ? "text" : "password"}
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="Min. 8 characters with uppercase, number, special"
          autoComplete="new-password"
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

        {form.password.length > 0 && (
          <div className="space-y-1.5 px-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Password requirements
            </p>
            <div className="grid grid-cols-1 gap-1">
              {PASSWORD_RULES.map((rule, i) => {
                const passed = rule.test(form.password);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        passed
                          ? "bg-green-500 text-white"
                          : "bg-white/40 dark:bg-white/10 text-muted-foreground"
                      }`}
                    >
                      {passed ? (
                        <Check className="w-2.5 h-2.5 font-bold" />
                      ) : (
                        <span className="text-[10px] font-bold leading-none">&#x2022;</span>
                      )}
                    </div>
                    <span
                      className={`text-xs transition-colors ${
                        passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                      }`}
                    >
                      {rule.label}
                    </span>
                  </div>
                );
              })}
              {form.confirm.length > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      form.password === form.confirm
                        ? "bg-green-500 text-white"
                        : "bg-white/40 dark:bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {form.password === form.confirm ? (
                      <Check className="w-2.5 h-2.5 font-bold" />
                    ) : (
                      <span className="text-[10px] font-bold leading-none">&#x2022;</span>
                    )}
                  </div>
                  <span
                    className={`text-xs transition-colors ${
                      form.password === form.confirm
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    Passwords match
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

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
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {selectedRole === "TEACHER" && (
          <div className="rounded-2xl border border-border bg-white/30 dark:bg-white/5 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Teacher Application</h3>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Teaching Experience
              </label>
              <textarea
                value={teachingExperience}
                onChange={(e) => setTeachingExperience(e.target.value)}
                placeholder="e.g. 3 years teaching at Tokyo Language School, JLPT N1 certified..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-input text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Bio / About Me
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about your background and teaching style..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-input text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Certificate Upload
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="certificate-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload certificates PDF / JPG / PNG (max 5MB)
              </button>
              {fileError && (
                <p className="mt-1.5 text-xs text-destructive">{fileError}</p>
              )}

              {certificates.length > 0 && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    Certificate Details ({certificates.length})
                  </p>
                  {certificates.map((cert, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-border space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(cert.file.type)}
                          <span className="text-sm truncate font-medium">{cert.name || cert.file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({cert.size})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertificate(index)}
                          className="p-1 hover:bg-destructive/10 rounded transition-colors shrink-0"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => updateCertificateName(index, e.target.value)}
                        placeholder="Certificate name (e.g. JLPT N1, Japanese Teaching Certificate...)"
                        className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-black/30 border border-input text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      {certificateErrors[index] && (
                        <p className="text-xs text-destructive">{certificateErrors[index]}</p>
                      )}
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => updateCertificateIssuer(index, e.target.value)}
                        placeholder="Issuer / Organization (optional) (e.g. Japan Foundation...)"
                        className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-black/30 border border-input text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {err && (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {err}
          </div>
        )}

        <PrimaryBtn type="submit" disabled={loading || !isPasswordStrong(form.password) || !form.confirm}>
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

        <GoogleBtn onSuccess={handleGoogleSuccess} onError={handleGoogleError} disabled={loading || googleLoading} />

        <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
          Admin accounts are created internally — not via signup.
        </p>
      </form>
    </AuthShell>
  );
}
