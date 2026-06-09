import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryBtn, GoogleBtn } from "@/components/auth-shell";
import { useState, useRef } from "react";
import { Eye, EyeOff, Upload, X, FileText, Image as ImageIcon, File, Check } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import type { RegisterRequest } from "@/lib/api/types";

export const Route = createFileRoute("/register")({ component: RegisterPage });

type Role = "STUDENT" | "TEACHER";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

type PasswordChecks = {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
};

type CertificateFile = {
  file: File;
  name: string;
  issuer: string;
  size: string;
};

type VerificationState = {
  email: string;
  message: string;
  role: Role;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

function getPasswordChecks(pw: string): PasswordChecks {
  return {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function buildVerifyOtpState(role: Role, email: string): VerificationState {
  return {
    email,
    role,
    message:
      role === "TEACHER"
        ? "Teacher account created. Please verify your email. You'll go to the pending approval page after sign-in if your account is still under review."
        : "Account created. Please verify your email.",
  };
}

function createRegisterPayload(form: RegisterForm, selectedRole: Role): RegisterRequest {
  return {
    email: form.email,
    password: form.password,
    confirmPassword: form.confirm,
    role: selectedRole,
  };
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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

  const passwordChecks = getPasswordChecks(form.password);
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

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`Invalid file type: ${file.name}. Only PDF, JPG, PNG allowed.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File too large: ${file.name}. Maximum 5MB per file.`);
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
    setCertificates((prev) => prev.map((cert, i) => (i === index ? { ...cert, name } : cert)));
    if (name.trim()) {
      setCertificateErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const updateCertificateIssuer = (index: number, issuer: string) => {
    setCertificates((prev) => prev.map((cert, i) => (i === index ? { ...cert, issuer } : cert)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    const errors: FieldErrors = {};

    if (!form.name.trim()) {
      errors.name = "Full name is required.";
    }
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address.";
    }

    const checks = getPasswordChecks(form.password);
    if (!checks.length) {
      errors.password = "Password must be at least 8 characters.";
    } else if (!checks.uppercase) {
      errors.password = "Password must include at least one uppercase letter.";
    } else if (!checks.number) {
      errors.password = "Password must include at least one number.";
    } else if (!checks.special) {
      errors.password = "Password must include at least one special character (e.g. @ # $ %).";
    }

    if (form.confirm && form.password !== form.confirm) {
      errors.confirm = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (certificates.length > 0) {
      const certErrors: Record<number, string> = {};
      let hasErrors = false;
      certificates.forEach((cert, index) => {
        if (!cert.name.trim()) {
          certErrors[index] = "Please enter a certificate name.";
          hasErrors = true;
        }
      });
      if (hasErrors) {
        setCertificateErrors(certErrors);
        setErr("Please fill in all certificate names.");
        return;
      }
    }

    setLoading(true);
    try {
      await authApi.register(createRegisterPayload(form, selectedRole));

      nav({
        to: "/verify-otp",
        state: buildVerifyOtpState(selectedRole, form.email),
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = err.message.toLowerCase();
        if (
          msg.includes("email") &&
          (msg.includes("exist") || msg.includes("already") || msg.includes("taken"))
        ) {
          setErr("This email is already registered.");
        } else if (msg.includes("password")) {
          setErr(
            "Password must be at least 8 characters and include uppercase letter, number, and special character.",
          );
        } else {
          setErr(err.message || "Registration failed. Please try again.");
        }
      } else {
        setErr("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setErr("");
    setGoogleLoading(true);
    try {
      const u = await loginWithGoogle(credential, selectedRole);
      nav({ to: getDashboardPath(u) });
    } catch (err) {
      if (err instanceof ApiError) {
        setErr(err.message);
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
          onChange={(e) => {
            update("name", e.target.value);
            setFieldErrors((f) => ({ ...f, name: undefined }));
          }}
          placeholder="Enter your full name"
          autoComplete="name"
        />
        {fieldErrors.name && (
          <p className="-mt-2 text-xs text-destructive font-medium pl-1">{fieldErrors.name}</p>
        )}

        <Field
          label="Email address"
          type="email"
          required
          value={form.email}
          onChange={(e) => {
            update("email", e.target.value);
            setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          placeholder="you@example.com"
          autoComplete="email"
        />
        {fieldErrors.email && (
          <p className="-mt-2 text-xs text-destructive font-medium pl-1">{fieldErrors.email}</p>
        )}

        <Field
          label="Password"
          type={showPassword ? "text" : "password"}
          required
          value={form.password}
          onChange={(e) => {
            update("password", e.target.value);
            setFieldErrors((f) => ({ ...f, password: undefined }));
          }}
          placeholder="Min. 8 characters"
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
        {form.password && (
          <div className="space-y-0.5 px-1">
            {[
              { key: "length", label: "At least 8 characters" },
              { key: "uppercase", label: "One uppercase letter (e.g. A, B, C)" },
              { key: "number", label: "One number (e.g. 1, 2, 3)" },
              { key: "special", label: "One special character (e.g. @ # $ %)" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  (passwordChecks as Record<string, boolean>)[key]
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              >
                <Check className="w-3 h-3 shrink-0" />
                {label}
              </div>
            ))}
          </div>
        )}
        {fieldErrors.password && (
          <p className="text-xs text-destructive font-medium pl-1">{fieldErrors.password}</p>
        )}

        <Field
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          required
          value={form.confirm}
          onChange={(e) => {
            update("confirm", e.target.value);
            setFieldErrors((f) => ({ ...f, confirm: undefined }));
          }}
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
        {fieldErrors.confirm && (
          <p className="text-xs text-destructive font-medium pl-1">{fieldErrors.confirm}</p>
        )}

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
              {fileError && <p className="mt-1.5 text-xs text-destructive">{fileError}</p>}

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
                          <span className="text-sm truncate font-medium">
                            {cert.name || cert.file.name}
                          </span>
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

        <PrimaryBtn type="submit" disabled={loading || googleLoading}>
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

        <GoogleBtn
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          disabled={loading || googleLoading}
        />

        <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
          Admin accounts are created internally — not via signup.
        </p>
      </form>
    </AuthShell>
  );
}
