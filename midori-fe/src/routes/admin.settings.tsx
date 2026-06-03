import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Globe, Database, Bot,
  Key, ChevronRight, X, Eye, EyeOff, CheckCircle,
  Copy, RefreshCw, Loader2, ExternalLink,
  AlertTriangle
} from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

type SecurityView = "password" | "api" | "export" | null;

function Toggle({ on, onToggle, label, sublabel }: {
  on: boolean; onToggle: () => void; label: string; sublabel: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-primary-col">{label}</div>
        <div className="text-xs text-muted-col mt-0.5">{sublabel}</div>
      </div>
      <button
        onClick={onToggle}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      >
        <div className={`absolute inset-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-[var(--border)]"}`} />
        <motion.div
          animate={{ x: on ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
        />
      </button>
    </div>
  );
}

function SettingsCard({ title, icon: Icon, iconColor, children, delay = 0 }: {
  title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-base p-5"
    >
      <h3 className="font-display font-bold text-sm text-primary-col flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        {title}
      </h3>
      <div className="divide-y divide-[var(--border)]">
        {children}
      </div>
    </motion.div>
  );
}

function ModalShell({
  title, icon: Icon, iconColor, onClose, children
}: {
  title: string; icon: React.ElementType; iconColor: string;
  onClose: () => void; children: React.ReactNode;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden"
        initial={{ scale: 0.93, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-primary-col text-base">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/60 dark:bg-white/10 text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const strength = newPw.length === 0 ? 0
    : newPw.length < 6 ? 1
    : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && newPw.length >= 8 ? 3
    : 2;

  const strengthLabels = ["", "Weak", "Medium", "Strong"];
  const strengthColors = ["", "bg-[var(--status-rejected)]", "bg-[var(--status-pending)]", "bg-[var(--status-active)]"];
  const strengthTextColors = ["", "text-[var(--status-rejected)]", "text-[var(--status-pending)]", "text-[var(--status-active)]"];

  const match = confirmPw.length > 0 && newPw === confirmPw;
  const mismatch = confirmPw.length > 0 && newPw !== confirmPw;

  const handleSave = async () => {
    setErrorMsg(null);
    if (!current) { setErrorMsg("Current password is required."); return; }
    if (strength < 2) {
      setErrorMsg("New password is too weak. Use 8+ chars with uppercase and number.");
      return;
    }
    if (!match) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword: current, newPassword: newPw });
      setDone(true);
      setCurrent(""); setNewPw(""); setConfirmPw("");
      setTimeout(onClose, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to change password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isValid = strength >= 2 && match && current.length > 0;

  return (
    <ModalShell title="Change Admin Password" icon={Key} iconColor="bg-[var(--status-pending)]/15 text-[var(--status-pending)]" onClose={onClose}>
      <div className="p-6 space-y-5">
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
          </motion.div>
        )}
        <div>
          <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-3 pr-11 rounded-xl bg-white/60 dark:bg-white/5 border border-[var(--border)] text-primary-col placeholder:text-muted-col outline-none focus:ring-2 focus:ring-[var(--status-pending)]/40 transition"
            />
            <button onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-col hover:text-primary-col transition">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-3 pr-11 rounded-xl bg-white/60 dark:bg-white/5 border border-[var(--border)] text-primary-col placeholder:text-muted-col outline-none focus:ring-2 focus:ring-[var(--status-pending)]/40 transition"
            />
            <button onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-col hover:text-primary-col transition">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPw.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1,2,3].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : "bg-[var(--border)]"}`} />
                ))}
              </div>
              <p className={`text-[10px] font-semibold ${strengthTextColors[strength]}`}>{strengthLabels[strength]}</p>
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {["8+ chars", "Uppercase", "Number"].map(req => (
              <span key={req} className="text-[9px] px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/5 text-muted-col font-semibold">{req}</span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Re-enter new password"
              className={`w-full px-4 py-3 pr-11 rounded-xl bg-white/60 dark:bg-white/5 border text-primary-col placeholder:text-muted-col outline-none transition ${
                mismatch ? "border-red-400/40" : match ? "border-green-400/40" : "border-[var(--border)]"
              }`}
            />
            <button onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-col hover:text-primary-col transition">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {match && <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passwords match</p>}
          {mismatch && <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
        <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 text-secondary-col text-sm font-bold hover:bg-white/80 dark:hover:bg-white/20 transition disabled:opacity-40">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid || loading || done}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed ${
            done
              ? "bg-green-500/15 text-green-500 border-green-500/25"
              : "bg-[var(--status-pending)]/15 text-[var(--status-pending)] border-[var(--status-pending)]/25 hover:bg-[var(--status-pending)]/25"
          }`}
        >
          {done
            ? <><CheckCircle className="w-4 h-4" /> Changed!</>
            : loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Key className="w-4 h-4" /> Update Password</>}
        </button>
      </div>
    </ModalShell>
  );
}

function APIAccessModal({ onClose }: { onClose: () => void }) {
  const [keyVisible, setKeyVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated, setRegenerated] = useState(false);

  const apiKey = "sk_live_midori_a8f3k2j9d7m4n1p6q8r0t5w2y7z3";

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setRegenerating(false);
    setRegenerated(true);
    setTimeout(() => setRegenerated(false), 2000);
  };

  const permissions = [
    { name: "Read Users", desc: "View user profiles and data", enabled: true },
    { name: "Write Users", desc: "Create and update users", enabled: false },
    { name: "Read Content", desc: "Access vocabulary and grammar", enabled: true },
    { name: "Write Content", desc: "Modify platform content", enabled: false },
    { name: "Analytics", desc: "Access analytics endpoints", enabled: true },
  ];

  return (
    <ModalShell title="API Access" icon={Shield} iconColor="bg-[var(--status-active)]/15 text-[var(--status-active)]" onClose={onClose}>
      <div className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Your API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={keyVisible ? "text" : "password"}
                value={apiKey}
                readOnly
                className="w-full px-4 py-3 pr-11 rounded-xl bg-white/60 dark:bg-white/5 border border-[var(--border)] text-primary-col font-mono outline-none"
              />
              <button onClick={() => setKeyVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-col hover:text-primary-col transition">
                {keyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-3 rounded-xl bg-white/60 dark:bg-white/10 border border-[var(--border)] text-secondary-col hover:text-primary-col transition flex items-center gap-2 text-sm font-semibold"
            >
              {copied ? <><CheckCircle className="w-4 h-4 text-green-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
          </div>
          <p className="text-[10px] text-[var(--status-pending)] mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            Keep this key secret. Do not share it in public repositories.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--status-rejected)]/8 border border-[var(--status-rejected)]/15">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary-col">Regenerate API Key</p>
              <p className="text-xs text-muted-col mt-0.5">This will invalidate your current key immediately. Update your integrations.</p>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-xs font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {regenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerating...</> : regenerated ? <><CheckCircle className="w-3.5 h-3.5" /> Done!</> : <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">API Permissions</label>
          <div className="space-y-2">
            {permissions.map(perm => (
              <div key={perm.name} className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-white/5">
                <div>
                  <p className="text-sm font-semibold text-primary-col">{perm.name}</p>
                  <p className="text-[10px] text-muted-col">{perm.desc}</p>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition ${perm.enabled ? "bg-[var(--status-active)]" : "bg-[var(--border)]"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${perm.enabled ? "right-0.5" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <a href="#" className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition">
          <ExternalLink className="w-3.5 h-3.5" />
          View API Documentation
        </a>
      </div>

      <div className="px-6 py-4 border-t border-[var(--border)]">
        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-white/60 dark:bg-white/10 text-secondary-col text-sm font-bold hover:bg-white/80 dark:hover:bg-white/20 transition">
          Close
        </button>
      </div>
    </ModalShell>
  );
}

function DataExportModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("json");

  const datasets = [
    { label: "Users & Profiles", size: "2.4 MB", icon: Shield },
    { label: "Vocabulary Progress", size: "1.8 MB", icon: Database },
    { label: "Grammar Entries", size: "0.6 MB", icon: Database },
    { label: "Exam Scores", size: "3.2 MB", icon: Shield },
    { label: "Listening History", size: "0.9 MB", icon: Database },
    { label: "Shadowing Sessions", size: "1.1 MB", icon: Database },
  ];

  const handleExport = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setDone(true);
    await new Promise(r => setTimeout(r, 1200));
    onClose();
  };

  const totalSize = datasets.reduce((acc, d) => acc + parseFloat(d.size), 0).toFixed(1);

  return (
    <ModalShell title="Data Export" icon={Database} iconColor="bg-primary/15 text-primary" onClose={onClose}>
      <div className="p-6 space-y-5">
        <div className="p-3 rounded-xl bg-primary/8 border border-primary/20">
          <p className="text-xs text-secondary-col leading-relaxed">
            Export all platform data as a compressed archive. Includes users, content progress, exam results, and session logs.
          </p>
        </div>

        <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-white/5">
          <p className="text-3xl font-black text-primary-col font-display">{totalSize} MB</p>
          <p className="text-xs text-muted-col mt-1">Total export size</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Included Datasets</label>
          <div className="space-y-2">
            {datasets.map(d => {
              const Icon = d.icon;
              return (
                <div key={d.label} className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-white/5">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-muted-col" />
                    <span className="text-sm text-primary-col">{d.label}</span>
                  </div>
                  <span className="text-xs text-muted-col font-mono">{d.size}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">Export Format</label>
          <div className="flex gap-2">
            {[
              { id: "json", label: "JSON Archive", desc: "Compressed JSON" },
              { id: "csv", label: "CSV Bundle", desc: "Multiple CSVs" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFormat(f.id)}
                className={`flex-1 p-3 rounded-xl border transition text-left ${
                  selectedFormat === f.id
                    ? "bg-primary/12 text-primary border-primary/25"
                    : "bg-white/60 dark:bg-white/5 text-secondary-col border-[var(--border)]"
                }`}
              >
                <p className="text-sm font-semibold text-primary-col">{f.label}</p>
                <p className="text-[10px] text-muted-col">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 text-secondary-col text-sm font-bold hover:bg-white/80 dark:hover:bg-white/20 transition">
          Cancel
        </button>
        <button
          onClick={handleExport}
          disabled={loading || done}
          className="flex-1 py-2.5 rounded-xl bg-primary/15 text-primary text-sm font-bold border border-primary/25 hover:bg-primary/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {done ? <><CheckCircle className="w-4 h-4" /> Downloaded!</> : loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</> : <><Database className="w-4 h-4" /> Export Data</>}
        </button>
      </div>
    </ModalShell>
  );
}

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [userReg, setUserReg] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [xpLimit, setXpLimit] = useState(500);
  const [defaultLevel, setDefaultLevel] = useState("N4");
  const [securityView, setSecurityView] = useState<SecurityView>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-black text-primary-col">System Settings</h1>
        <p className="text-sm text-secondary-col mt-0.5">Configure platform, AI, and notification settings</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <SettingsCard title="Platform" icon={Globe} iconColor="bg-primary/15 text-primary" delay={0}>
          <Toggle on={userReg} onToggle={() => setUserReg(v => !v)} label="User Registration" sublabel="Allow new users to sign up" />
          <Toggle on={darkMode} onToggle={() => setDarkMode(v => !v)} label="Dark Mode Default" sublabel="Set dark mode as default theme" />
          <Toggle on={emailNotif} onToggle={() => setEmailNotif(v => !v)} label="Email Notifications" sublabel="Send system email notifications" />
        </SettingsCard>

        <SettingsCard title="AI Learning" icon={Bot} iconColor="bg-[var(--status-teacher)]/15 text-[var(--status-teacher)]" delay={0.05}>
          <Toggle on={aiEnabled} onToggle={() => setAiEnabled(v => !v)} label="AI Shadowing Enabled" sublabel="Enable AI-powered pronunciation coaching" />
          <Toggle on={strictMode} onToggle={() => setStrictMode(v => !v)} label="Strict Content Filter" sublabel="Enable strict content filtering for AI" />
          <div className="py-3">
            <div className="text-sm font-semibold text-primary-col mb-1">Daily XP Limit</div>
            <div className="text-xs text-muted-col mb-2">Maximum XP a user can earn per day</div>
            <input
              type="number"
              value={xpLimit}
              onChange={e => setXpLimit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-[var(--border)] text-primary-col outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="py-3">
            <div className="text-sm font-semibold text-primary-col mb-2">Default JLPT Level</div>
            <select
              value={defaultLevel}
              onChange={e => setDefaultLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-[var(--border)] text-primary-col outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
            >
              <option>N5</option><option selected>N4</option><option>N3</option><option>N2</option><option>N1</option>
            </select>
          </div>
        </SettingsCard>

        <SettingsCard title="Security & Access" icon={Shield} iconColor="bg-[var(--status-active)]/15 text-[var(--status-active)]" delay={0.1}>
          <div className="py-3">
            <button
              onClick={() => setSecurityView("password")}
              className="w-full flex items-center justify-between hover:bg-white/50 dark:hover:bg-white/5 -mx-5 px-5 py-3 rounded-xl transition"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-primary-col">
                <Key className="w-4 h-4 text-secondary-col" /> Change Admin Password
              </span>
              <ChevronRight className="w-4 h-4 text-muted-col" />
            </button>
          </div>
          <div className="py-3">
            <button
              onClick={() => setSecurityView("api")}
              className="w-full flex items-center justify-between hover:bg-white/50 dark:hover:bg-white/5 -mx-5 px-5 py-3 rounded-xl transition"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-primary-col">
                <Shield className="w-4 h-4 text-secondary-col" /> API Access
              </span>
              <ChevronRight className="w-4 h-4 text-muted-col" />
            </button>
          </div>
          <div className="py-3">
            <button
              onClick={() => setSecurityView("export")}
              className="w-full flex items-center justify-between hover:bg-white/50 dark:hover:bg-white/5 -mx-5 px-5 py-3 rounded-xl transition"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-primary-col">
                <Database className="w-4 h-4 text-secondary-col" /> Data Export
              </span>
              <ChevronRight className="w-4 h-4 text-muted-col" />
            </button>
          </div>
        </SettingsCard>
      </div>

      <AnimatePresence>
        {securityView === "password" && <ChangePasswordModal onClose={() => setSecurityView(null)} />}
        {securityView === "api" && <APIAccessModal onClose={() => setSecurityView(null)} />}
        {securityView === "export" && <DataExportModal onClose={() => setSecurityView(null)} />}
      </AnimatePresence>
    </div>
  );
}
