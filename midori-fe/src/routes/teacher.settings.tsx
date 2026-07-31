import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Bell,
  Palette,
  Shield,
  Camera,
  Save,
  Check,
  Moon,
  Sun,
  Globe,
  Mail,
  MapPin,
  Link2,
  Clock,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  X,
  Languages,
  Monitor,
  Loader2,
} from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError, isApiError } from "@/lib/api/client";

type SettingsTab = "account" | "notifications" | "appearance" | "security";

const tabs = [
  { id: "account" as const, label: "Account", icon: User },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "appearance" as const, label: "Appearance", icon: Palette },
  { id: "security" as const, label: "Security", icon: Shield },
];

const LANGUAGES = [
  { value: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { value: "en", label: "English", native: "English" },
  { value: "ja", label: "Japanese", native: "日本語" },
];

function applyTheme(theme: "light" | "dark" | "system") {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

export const Route = createFileRoute("/teacher/settings")({
  component: TeacherSettingsPage,
});

function LanguageDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = LANGUAGES.find((l) => l.value === value) ?? LANGUAGES[1];

  useEffect(() => {
    const handler = () => setOpen(false);
    if (open) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
      >
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{selected.native}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">({selected.label})</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => {
                  onChange(lang.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-primary/5 transition ${
                  value === lang.value
                    ? "bg-primary/5 text-primary font-semibold"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-hero flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">
                  {lang.native[0]}
                </div>
                <div className="text-left">
                  <div>{lang.native}</div>
                  <div className="text-[10px] text-muted-foreground">{lang.label}</div>
                </div>
                {value === lang.value && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeSelector({
  value,
  onChange,
}: {
  value: "light" | "dark" | "system";
  onChange: (v: "light" | "dark" | "system") => void;
}) {
  const options: {
    id: "light" | "dark" | "system";
    label: string;
    icon: typeof Sun;
    desc: string;
  }[] = [
    { id: "light", label: "Light", icon: Sun, desc: "Always light" },
    { id: "dark", label: "Dark", icon: Moon, desc: "Always dark" },
    { id: "system", label: "System", icon: Monitor, desc: "Follow OS" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
              active
                ? "border-primary bg-primary/5"
                : "border-slate-200 dark:border-slate-700 hover:border-primary/40 bg-white dark:bg-slate-800"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                active
                  ? "bg-primary/15 text-primary"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span
              className={`text-xs font-bold ${active ? "text-primary" : "text-slate-600 dark:text-slate-300"}`}
            >
              {opt.label}
            </span>
            <span className="text-[9px] text-muted-foreground hidden sm:block">{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${checked ? "bg-gradient-hero" : "bg-slate-200 dark:bg-slate-600"}`}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5"
      />
    </button>
  );
}

function NotifRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 transition">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`glass rounded-2xl p-5 ${className}`}>{children}</div>;
}

function TeacherSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  // Account state
  const [name, setName] = useState("Taro Yamamoto");
  const [email, setEmail] = useState("taro.sensei@midori.jp");
  const [bio, setBio] = useState(
    "Native Japanese teacher with 8 years of experience teaching JLPT preparation courses.",
  );
  const [location, setLocation] = useState("Tokyo, Japan");
  const [website, setWebsite] = useState("taro-sensei.jp");
  const [timezone, setTimezone] = useState("Asia/Tokyo (UTC+9)");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Notification state
  const [notifCompletions, setNotifCompletions] = useState(true);
  const [notifQuestions, setNotifQuestions] = useState(false);
  const [notifAnnouncements, setNotifAnnouncements] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);

  // Appearance state
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("en");

  // Security state
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [twoFactor, setTwoFactor] = useState(false);

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Tab navigation */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="glass rounded-2xl p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-hero text-white shadow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ── ACCOUNT ── */}
          {activeTab === "account" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <SectionCard>
                <h2 className="font-display font-bold text-lg mb-5">Account Information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-5 mb-5">
                  <div className="relative group">
                    {avatarPreview ? (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center text-white text-3xl font-black shadow-lg border-4 border-white dark:border-slate-700">
                        T
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <Camera className="w-6 h-6 text-white" />
                    </label>
                  </div>
                  <div>
                    <div className="font-semibold">{name}</div>
                    <div className="text-sm text-muted-foreground">{email}</div>
                    <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold cursor-pointer transition">
                      <Camera className="w-3.5 h-3.5" /> Change Photo
                    </label>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Website
                    </label>
                    <div className="relative">
                      <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>

                <div className="mt-4">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Timezone
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option>Asia/Tokyo (UTC+9)</option>
                      <option>Asia/Ho_Chi_Minh (UTC+7)</option>
                      <option>Asia/Seoul (UTC+9)</option>
                      <option>UTC</option>
                      <option>America/New_York (UTC-5)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="mt-5 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition"
                >
                  {saved ? (
                    <>
                      <Check className="w-4 h-4" /> Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </SectionCard>
            </motion.div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <SectionCard>
                <h2 className="font-display font-bold text-lg mb-5">Notification Preferences</h2>
                <div className="space-y-3">
                  <NotifRow
                    label="New content completions"
                    desc="When students complete assigned content"
                    checked={notifCompletions}
                    onChange={setNotifCompletions}
                  />
                  <NotifRow
                    label="Student questions"
                    desc="Questions from students about your content"
                    checked={notifQuestions}
                    onChange={setNotifQuestions}
                  />
                  <NotifRow
                    label="Platform announcements"
                    desc="Important updates from the Midori team"
                    checked={notifAnnouncements}
                    onChange={setNotifAnnouncements}
                  />
                  <NotifRow
                    label="Security alerts"
                    desc="Login attempts and security notifications"
                    checked={notifSecurity}
                    onChange={setNotifSecurity}
                  />
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ── APPEARANCE ── */}
          {activeTab === "appearance" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SectionCard>
                <h2 className="font-display font-bold text-lg mb-5">Appearance Settings</h2>
                <div className="space-y-5">
                  {/* Theme */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                      Theme
                    </label>
                    <ThemeSelector value={theme} onChange={setThemeState} />
                  </div>

                  {/* Language */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Interface Language
                    </label>
                    <LanguageDropdown value={language} onChange={setLanguage} />
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <SectionCard>
                <h2 className="font-display font-bold text-lg mb-5">Security Settings</h2>
                {pwSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 text-xs font-bold"
                  >
                    <Check className="w-4 h-4" /> Password updated successfully!
                  </motion.div>
                )}
                {pwError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 text-xs font-bold"
                  >
                    <AlertCircle className="w-4 h-4" /> {pwError}
                  </motion.div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={pwCurrent}
                        onChange={(e) => setPwCurrent(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={pwNew}
                          onChange={(e) => setPwNew(e.target.value)}
                          placeholder="New password"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((v) => !v)}
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Confirm
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={pwConfirm}
                          onChange={(e) => setPwConfirm(e.target.value)}
                          placeholder="Confirm password"
                          className={`w-full px-3 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-800 border text-sm outline-none focus:ring-2 focus:ring-primary/40 ${
                            pwConfirm && pwNew !== pwConfirm
                              ? "border-red-400 dark:border-red-500/50"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {pwConfirm && pwNew !== pwConfirm && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setPwError(null);
                      if (!pwCurrent) {
                        setPwError("Current password is required.");
                        return;
                      }
                      if (pwNew === pwCurrent) {
                        setPwError("New password must be different from current password.");
                        return;
                      }
                      if (pwNew.length < 8) {
                        setPwError("Min. 8 characters.");
                        return;
                      }
                      if (!/[A-Z]/.test(pwNew)) {
                        setPwError("Add at least one uppercase letter.");
                        return;
                      }
                      if (!/[0-9]/.test(pwNew)) {
                        setPwError("Add at least one number.");
                        return;
                      }
                      if (!/[^A-Za-z0-9]/.test(pwNew)) {
                        setPwError("Add at least one special character.");
                        return;
                      }
                      if (pwNew !== pwConfirm) {
                        setPwError("Passwords do not match.");
                        return;
                      }
                      setPwLoading(true);
                      try {
                        await authApi.changePassword({
                          currentPassword: pwCurrent,
                          newPassword: pwNew,
                        });
                        setPwSuccess(true);
                        setPwCurrent("");
                        setPwNew("");
                        setPwConfirm("");
                        setTimeout(() => setPwSuccess(false), 4000);
                      } catch (err) {
                        if (isApiError(err)) {
                          setPwError(err.message);
                        } else {
                          setPwError("Failed to change password.");
                        }
                      } finally {
                        setPwLoading(false);
                      }
                    }}
                    disabled={pwLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {pwLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Updating…
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" /> Update Password
                      </>
                    )}
                  </button>
                </div>
              </SectionCard>

              <SectionCard>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Two-Factor Authentication</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <Toggle checked={twoFactor} onChange={setTwoFactor} />
                </div>
                {twoFactor && (
                  <div className="mt-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-semibold">
                      <Check className="w-4 h-4" /> 2FA is enabled
                    </div>
                  </div>
                )}
              </SectionCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
