import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Edit, Save, Shield, Clock,
  CheckCircle, Mail, Calendar, MapPin,
  Eye, EyeOff, Key, AlertTriangle
} from "lucide-react";

const adminProfile = {
  name: "Midori Admin",
  email: "admin@midori.app",
  bio: "Platform administrator managing Midori's Japanese learning ecosystem. Overseeing content moderation, teacher approvals, analytics, and system operations.",
  location: "Kyoto, Japan",
  avatar: "A",
  joinDate: "January 2023",
  permissions: [
    { label: "User Management", granted: true },
    { label: "Teacher Approval", granted: true },
    { label: "Content Moderation", granted: true },
    { label: "System Settings", granted: true },
    { label: "Analytics Access", granted: true },
    { label: "API Key Management", granted: true },
  ],
};

function ProfileCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-base p-5"
    >
      {children}
    </motion.div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
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
  );
}

export const Route = createFileRoute("/admin/profile")({ component: AdminProfilePage });

function AdminProfilePage() {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(adminProfile.name);
  const [editBio, setEditBio] = useState(adminProfile.bio);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
      >
        <div className="h-32 relative" style={{ background: "linear-gradient(135deg, oklch(0.62 0.18 270 / 0.15) 0%, oklch(0.72 0.15 230 / 0.10) 50%, oklch(0.55 0.18 340 / 0.08) 100%)" }}>
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, oklch(0.62 0.18 270 / 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 50%, oklch(0.72 0.15 230 / 0.2) 0%, transparent 50%)" }} />
          <div className="absolute top-4 right-6 flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg glass-surface text-secondary-col text-xs font-semibold backdrop-blur-sm hover:bg-[var(--accent)] transition">
                  Cancel
                </button>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-xl bg-gradient-hero text-white text-xs font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition flex items-center gap-1">
                  <Save className="w-3 h-3" /> Save Changes
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg glass-surface text-secondary-col text-xs font-semibold backdrop-blur-sm hover:bg-[var(--accent)] transition flex items-center gap-1">
                <Edit className="w-3 h-3" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-5 -mt-12 relative">
          <div className="card-base p-5">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl glass-modal flex items-center justify-center text-primary-col text-4xl font-black shadow-xl border border-glass-border">
                  {adminProfile.avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full glass-surface text-secondary-col text-[10px] font-black shadow-lg border border-glass-border flex items-center gap-0.5">
                  <Shield className="w-3 h-3" /> Admin
                </div>
              </div>
              <div className="flex-1 w-full text-center sm:text-left">
                {editing ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="text-2xl font-display font-black bg-transparent border-b-2 border-primary outline-none w-full text-center sm:text-left mb-1 text-primary-col"
                  />
                ) : (
                  <h1 className="text-2xl font-display font-black text-primary-col">{adminProfile.name}</h1>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full glass-surface text-secondary-col text-xs font-bold border border-glass-border">
                    <Shield className="w-3 h-3" /> Administrator
                  </span>
                  <span className="text-xs text-muted-col flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {adminProfile.location}
                  </span>
                  <span className="text-xs text-muted-col flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {adminProfile.joinDate}
                  </span>
                </div>
                {editing ? (
                  <textarea
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    rows={2}
                    className="mt-2 w-full max-w-lg text-sm bg-transparent border border-glass-border rounded-xl p-3 outline-none focus:border-primary/50 resize-none text-center sm:text-left text-secondary-col"
                  />
                ) : (
                  <p className="text-sm text-secondary-col mt-1.5 max-w-lg leading-relaxed">{adminProfile.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left: Account Info + Permissions + Recent Activity */}
        <div className="space-y-5">
          <ProfileCard delay={0.05}>
            <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary" /> Account Information
            </h3>
            <div className="space-y-3">
              {[
                { icon: Mail, label: "Email", value: adminProfile.email },
                { icon: Shield, label: "Role", value: "Administrator" },
                { icon: MapPin, label: "Location", value: adminProfile.location },
                { icon: Calendar, label: "Member Since", value: adminProfile.joinDate },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl glass-surface">
                  <Icon className="w-4 h-4 text-secondary-col flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{label}</div>
                    <div className="text-sm font-medium text-primary-col truncate">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </ProfileCard>

          <ProfileCard delay={0.1}>
            <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[var(--status-pending)]" /> Permissions
            </h3>
            <div className="space-y-2">
              {adminProfile.permissions.map(perm => (
                <div key={perm.label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm text-secondary-col">{perm.label}</span>
                  {perm.granted ? (
                    <CheckCircle className="w-4 h-4 text-[var(--status-active)]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-[var(--border)]" />
                  )}
                </div>
              ))}
            </div>
          </ProfileCard>

          <ProfileCard delay={0.15}>
            <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[var(--status-active)]" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                { action: "Updated system settings", time: "2 hours ago" },
                { action: "Approved 3 new teachers", time: "5 hours ago" },
                { action: "Reviewed flagged content", time: "1 day ago" },
                { action: "Generated weekly report", time: "2 days ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--status-active)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-primary-col truncate">{item.action}</div>
                    <div className="text-[10px] text-muted-col">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </ProfileCard>
        </div>

        {/* Right: Security */}
        <div className="space-y-5">
          <ProfileCard delay={0.2}>
            <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-primary" /> Security
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-col uppercase tracking-wider block mb-2">Change Password</label>
                <div className="relative mb-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Current password"
                    className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl input-glass outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-col hover:text-primary-col transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative mb-2">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl input-glass outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-col hover:text-primary-col transition"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative mb-3">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl input-glass outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-col hover:text-primary-col transition"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button className="w-full py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition">
                  Update Password
                </button>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-pending)]/8 border border-[var(--status-pending)]/15">
                <AlertTriangle className="w-4 h-4 text-[var(--status-pending)] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--status-pending)] leading-relaxed">
                  Password should be at least 8 characters with uppercase, lowercase, and a number.
                </p>
              </div>
            </div>
          </ProfileCard>
        </div>
      </div>
    </div>
  );
}
