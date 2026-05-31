import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Edit, Save, Shield, Clock,
  CheckCircle, Mail, Calendar, MapPin, Phone, Cake,
  Eye, EyeOff, Key, AlertTriangle, Loader2, CheckCheck,
  Camera, Upload, Trash2
} from "lucide-react";
import { profileApi, type ProfileResponse } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { uploadAvatar } from "@/lib/avatar";

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
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const { user, updateCurrentUser } = useAuth();
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await profileApi.getMyProfile();
      setProfile(res);
      setEditName(res.displayName || "");
      setEditBio(res.bio || "");
      setEditLocation(res.location || "");
      setEditPhone(res.phone || "");
      setEditDateOfBirth(res.dateOfBirth || "");
      if (res.avatarUrl) setAvatarPreview(res.avatarUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        setLoadError(err.message);
      } else {
        setLoadError("Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    if (!editName.trim()) { setSaveError("Display name is required."); return; }
    try {
      const updated = await profileApi.updateMyProfile({
        displayName: editName.trim(),
        bio: editBio || undefined,
        location: editLocation || undefined,
        phone: editPhone || undefined,
        dateOfBirth: editDateOfBirth || undefined,
      });
      setProfile(updated);
      updateCurrentUser({ name: updated.displayName, avatar: updated.avatarUrl });
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError("Failed to save profile.");
      }
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarError(null);
    setAvatarLoading(true);
    setShowAvatarMenu(false);
    try {
      const { avatarUrl } = await uploadAvatar(user.id, file);
      const updated = await profileApi.updateMyProfile({ avatarUrl });
      setProfile(updated);
      setAvatarPreview(avatarUrl);
      updateCurrentUser({ avatar: avatarUrl });
    } catch (err: unknown) {
      setAvatarError((err as { message?: string }).message || "Upload failed. Please try again.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarError(null);
    setAvatarLoading(true);
    setShowRemoveConfirm(false);
    try {
      const updated = await profileApi.updateMyProfile({ avatarUrl: null });
      setProfile(updated);
      setAvatarPreview(null);
      updateCurrentUser({ avatar: undefined });
    } catch (err: unknown) {
      setAvatarError((err as { message?: string }).message || "Failed to remove avatar.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const avatarLetter = (editName || profile?.displayName || "?").charAt(0).toUpperCase();

  const permissions = [
    { label: "User Management", granted: true },
    { label: "Teacher Approval", granted: true },
    { label: "Content Moderation", granted: true },
    { label: "System Settings", granted: true },
    { label: "Analytics Access", granted: true },
    { label: "API Key Management", granted: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-sm text-destructive font-medium">{loadError}</p>
          <button onClick={fetchProfile} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

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
                <button onClick={() => { setEditing(false); setEditName(profile?.displayName || ""); setEditBio(profile?.bio || ""); setEditLocation(profile?.location || ""); setEditPhone(profile?.phone || ""); setEditDateOfBirth(profile?.dateOfBirth || ""); }}
                  className="px-3 py-1.5 rounded-lg glass-surface text-secondary-col text-xs font-semibold backdrop-blur-sm hover:bg-[var(--accent)] transition">
                  Cancel
                </button>
                <button onClick={handleSave}
                  className="px-3 py-1.5 rounded-xl bg-gradient-hero text-white text-xs font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition flex items-center gap-1">
                  <Save className="w-3 h-3" /> Save Changes
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="px-3 py-1.5 rounded-lg glass-surface text-secondary-col text-xs font-semibold backdrop-blur-sm hover:bg-[var(--accent)] transition flex items-center gap-1">
                <Edit className="w-3 h-3" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-5 -mt-12 relative">
          <div className="card-base p-5">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
              <div className="relative flex-shrink-0">
                {avatarPreview ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl border border-glass-border">
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl glass-modal flex items-center justify-center text-primary-col text-4xl font-black shadow-xl border border-glass-border">
                    {avatarLetter}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full glass-surface text-secondary-col text-[10px] font-black shadow-lg border border-glass-border flex items-center gap-0.5">
                  <Shield className="w-3 h-3" /> Admin
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
                  <div className="relative">
                    <button
                      onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                      disabled={avatarLoading}
                      className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 shadow-md border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 transition disabled:opacity-50"
                    >
                      {avatarLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600 dark:text-slate-300" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      )}
                    </button>
                    <AnimatePresence>
                      {showAvatarMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[180px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                        >
                          <label className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition">
                            {avatarLoading ? (
                              <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-indigo-500" />
                            ) : (
                              <Upload className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                            )}
                            <span className="font-medium">{avatarLoading ? "Uploading..." : "Change Avatar"}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={avatarLoading}
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </label>
                          {avatarPreview && (
                            <button
                              disabled={avatarLoading}
                              onClick={() => { setShowAvatarMenu(false); setShowRemoveConfirm(true); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">Remove Avatar</span>
                            </button>
                          )}
                          {avatarError && (
                            <p className="px-4 py-2 text-[10px] text-red-500 border-t border-slate-100 dark:border-slate-700">{avatarError}</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full text-center sm:text-left">
                {saveSuccess && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold">
                    <CheckCheck className="w-3.5 h-3.5" /> Profile saved!
                  </motion.div>
                )}
                {saveError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> {saveError}
                  </motion.div>
                )}
                {editing ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="text-2xl font-display font-black bg-transparent border-b-2 border-primary outline-none w-full text-center sm:text-left mb-1 text-primary-col"
                  />
                ) : (
                  <h1 className="text-2xl font-display font-black text-primary-col">{profile?.displayName || "—"}</h1>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full glass-surface text-secondary-col text-xs font-bold border border-glass-border">
                    <Shield className="w-3 h-3" /> Administrator
                  </span>
                  {profile?.location && (
                    <span className="text-xs text-muted-col flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {profile.location}
                    </span>
                  )}
                  {profile?.phone && (
                    <span className="text-xs text-muted-col flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {profile.phone}
                    </span>
                  )}
                  {profile?.dateOfBirth && (
                    <span className="text-xs text-muted-col flex items-center gap-1">
                      <Cake className="w-3 h-3" /> {new Date(profile.dateOfBirth).toLocaleDateString()}
                    </span>
                  )}
                  {profile?.createdAt && (
                    <span className="text-xs text-muted-col flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {editing ? (
                  <textarea
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    rows={2}
                    placeholder="Tell us about yourself..."
                    className="mt-2 w-full max-w-lg text-sm bg-transparent border border-glass-border rounded-xl p-3 outline-none focus:border-primary/50 resize-none text-center sm:text-left text-secondary-col"
                  />
                ) : profile?.bio ? (
                  <p className="text-sm text-secondary-col mt-1.5 max-w-lg leading-relaxed">{profile.bio}</p>
                ) : null}
                {editing && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <div>
                      <label className="text-[10px] text-muted-col block mb-1">Phone</label>
                      <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-glass-border bg-transparent text-xs text-secondary-col outline-none focus:border-primary/50 w-36" placeholder="+84..." />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-col block mb-1">Date of Birth</label>
                      <input type="date" value={editDateOfBirth} onChange={e => setEditDateOfBirth(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-glass-border bg-transparent text-xs text-secondary-col outline-none focus:border-primary/50 w-36" />
                    </div>
                  </div>
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
                { icon: Mail, label: "Email", value: profile?.email || "—" },
                { icon: Shield, label: "Role", value: "Administrator" },
                { icon: MapPin, label: "Location", value: profile?.location || "—" },
                { icon: Calendar, label: "Member Since", value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—" },
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
              {permissions.map(perm => (
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
                {pwSuccess && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-2 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold">
                    <CheckCheck className="w-3.5 h-3.5" /> Password updated successfully!
                  </motion.div>
                )}
                {pwError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-2 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> {pwError}
                  </motion.div>
                )}
                <div className="relative mb-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={pwCurrent}
                    onChange={e => setPwCurrent(e.target.value)}
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
                    value={pwNew}
                    onChange={e => setPwNew(e.target.value)}
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
                    value={pwConfirm}
                    onChange={e => setPwConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full pl-3 pr-10 py-2.5 text-sm rounded-xl input-glass outline-none focus:ring-2 focus:ring-primary/40 ${
                      pwConfirm && pwNew !== pwConfirm ? "border-red-400/40" : pwConfirm && pwNew === pwConfirm ? "border-green-400/40" : ""
                    }`}
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
                <button
                  onClick={async () => {
                    setPwError(null);
                    if (!pwCurrent) { setPwError("Current password is required."); return; }
                    if (pwNew.length < 8) { setPwError("Min. 8 characters."); return; }
                    if (!/[A-Z]/.test(pwNew)) { setPwError("Add at least one uppercase letter."); return; }
                    if (!/[0-9]/.test(pwNew)) { setPwError("Add at least one number."); return; }
                    if (!/[^A-Za-z0-9]/.test(pwNew)) { setPwError("Add at least one special character."); return; }
                    if (pwNew !== pwConfirm) { setPwError("Passwords do not match."); return; }
                    setPwLoading(true);
                    try {
                      await authApi.changePassword({ currentPassword: pwCurrent, newPassword: pwNew });
                      setPwSuccess(true);
                      setPwCurrent(""); setPwNew(""); setPwConfirm("");
                      setTimeout(() => setPwSuccess(false), 4000);
                    } catch (err) {
                      if (err instanceof ApiError) {
                        setPwError(err.message);
                      } else {
                        setPwError("Failed to change password.");
                      }
                    } finally {
                      setPwLoading(false);
                    }
                  }}
                  disabled={pwLoading}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-hero"
                >
                  {pwLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                    : <><Key className="w-4 h-4" /> Update Password</>}
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

      {/* Avatar Remove Confirm Dialog */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRemoveConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-5 shadow-2xl border border-white/60 dark:border-white/10 max-w-xs w-full mx-4"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-10 rounded-full bg-red-50/80 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white text-center mb-1.5">Remove Avatar?</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-4">
                Your profile will return to the default avatar.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Cancel
                </button>
                <button onClick={handleRemoveAvatar} disabled={avatarLoading}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-1">
                  {avatarLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Removing...</> : "Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
