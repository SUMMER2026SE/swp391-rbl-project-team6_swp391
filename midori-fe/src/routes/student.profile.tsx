import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Award, Settings, Shield, Lock, Loader2, AlertCircle, CheckCheck,
  Eye, EyeOff,
  Moon, Globe, ChevronDown, Target, Save, Edit,
  CheckCircle, Star, MapPin, Calendar, Sparkles,
  Upload, Trash2, Camera, Sun, Phone, Cake,
} from "lucide-react";
import { useTheme, useAuth } from "@/lib/auth";
import { profileApi, type ProfileResponse } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { uploadAvatar } from "@/lib/avatar";

export const Route = createFileRoute("/student/profile")({
  component: ProfilePage,
});

const inputBase = "w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-400/40 transition-colors duration-200 bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400";

function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "achievements" | "settings">("overview");
  const [settingsSection, setSettingsSection] = useState<"account" | "appearance" | "security">("account");

  const { theme, toggleTheme } = useTheme();
  const { user, updateCurrentUser } = useAuth();

  // Profile data from backend
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Settings
  const [language, setLanguage] = useState("en");

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Static mock data for gamification elements (not available in backend profile)
  const mockStats = {
    studyHours: 0,
    wordsLearned: 0,
    grammarCompleted: 0,
    listeningAccuracy: 0,
  };
  const mockAchievements = [
    { id: 1, name: "First Steps", progress: 100, earned: true },
    { id: 2, name: "Vocab Voyager", progress: 100, earned: true },
    { id: 3, name: "Grammar Guardian", progress: 89, earned: true },
    { id: 4, name: "Night Scholar", progress: 100, earned: true },
    { id: 5, name: "100-Day Streak", progress: 32, earned: false },
    { id: 6, name: "N1 Ninja", progress: 0, earned: false },
  ];

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

  const getStrength = (pw: string) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-red-500", pct: 25 };
    if (score <= 3) return { label: "Medium", color: "bg-amber-400", pct: 60 };
    return { label: "Strong", color: "bg-green-400", pct: 100 };
  };

  const validationRules = [
    { label: "At least 8 characters", met: newPw.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(newPw) },
    { label: "One number", met: /[0-9]/.test(newPw) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(newPw) },
  ];

  const displayName = editing ? editName : (profile?.displayName || "");
  const displayBio = editing ? editBio : (profile?.bio || "");
  const displayLocation = editing ? editLocation : (profile?.location || "");
  const displayPhone = editing ? editPhone : (profile?.phone || "");
  const displayDateOfBirth = editing ? editDateOfBirth : (profile?.dateOfBirth || "");

  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : "?";

  const languages = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
          <p className="text-sm text-slate-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 font-medium">{loadError}</p>
          <button onClick={fetchProfile} className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:opacity-90 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* ─── Profile Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 transition-colors duration-300"
      >

        {/* Banner */}
        <div className="h-24 sm:h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />
          <div className="absolute top-0 left-1/4 w-40 h-40 bg-indigo-400/25 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-pink-400/20 rounded-full blur-3xl" />

          <div className="absolute top-3 right-3 flex gap-2">
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setEditName(profile?.displayName || ""); setEditBio(profile?.bio || ""); setEditLocation(profile?.location || ""); setEditPhone(profile?.phone || ""); setEditDateOfBirth(profile?.dateOfBirth || ""); }}
                  className="px-2.5 py-1 rounded-lg bg-white/20 text-white/80 text-xs font-semibold backdrop-blur-sm hover:bg-white/30 transition">
                  Cancel
                </button>
                <button onClick={handleSave}
                  className="px-2.5 py-1 rounded-lg bg-white text-purple-600 text-xs font-bold backdrop-blur-sm shadow hover:bg-white/90 transition flex items-center gap-1">
                  <Save className="w-3 h-3" /> Save
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-semibold backdrop-blur-sm hover:bg-white/30 transition flex items-center gap-1">
                <Edit className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Avatar + Info */}
        <div className="px-5 pb-5 -mt-12 relative">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/60 dark:border-white/10 transition-colors duration-300">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-3">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {avatarPreview ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="w-20 h-20 rounded-xl shadow-lg border-4 border-white dark:border-white/20 overflow-hidden">
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }}
                    className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-black shadow-lg border-4 border-white dark:border-white/20 relative">
                    {avatarLetter}
                    <motion.div animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ repeat: Infinity, duration: 2.5 }}
                      className="absolute inset-0 rounded-xl bg-white/20" />
                  </motion.div>
                )}
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-white/20 z-10" />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-20">
                  <div className="relative">
                    <button onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                      className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                      {avatarLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-slate-600 dark:text-slate-300" />
                      ) : (
                        <Camera className="w-3 h-3 text-slate-600 dark:text-slate-300" />
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

              {/* Info */}
              <div className="flex-1 w-full text-center sm:text-left">
                {saveSuccess && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50/80 dark:bg-green-500/15 border border-green-200/80 dark:border-green-500/30 text-green-600 dark:text-green-400 text-xs font-bold">
                    <CheckCheck className="w-3.5 h-3.5" /> Profile saved!
                  </motion.div>
                )}
                {saveError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50/80 dark:bg-red-500/15 border border-red-200/80 dark:border-red-500/30 text-red-500 dark:text-red-400 text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> {saveError}
                  </motion.div>
                )}

                {editing ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="text-xl font-black bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-indigo-400/50 w-full text-center sm:text-left mb-1.5" />
                ) : (
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{displayName || "—"}</h2>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-0.5">
                  {displayLocation && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <MapPin className="w-3 h-3" /> {displayLocation}
                    </span>
                  )}
                  {profile?.createdAt && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <Calendar className="w-3 h-3" /> Joined {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {editing ? (
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={2}
                    className="mt-2 w-full text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/50 resize-none text-center sm:text-left" placeholder="Tell us about yourself..." />
                ) : displayBio ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-md leading-relaxed line-clamp-2">
                    {displayBio}
                  </p>
                ) : editing ? null : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-md italic">
                    No bio yet.{" "}
                    <button onClick={() => setEditing(true)} className="text-indigo-500 hover:underline">Add one</button>
                  </p>
                )}

                {editing && (
                  <div className="mt-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1 block">Location</label>
                    <input value={editLocation} onChange={e => setEditLocation(e.target.value)}
                      className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400/50 w-full sm:max-w-[200px]" placeholder="e.g. Tokyo, Japan" />
                  </div>
                )}

                {/* Phone */}
                {displayPhone && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> {displayPhone}
                  </p>
                )}
                {editing && (
                  <div className="mt-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1 block">Phone</label>
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                      className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400/50 w-full sm:max-w-[200px]" placeholder="+84..." />
                  </div>
                )}

                {/* Date of Birth */}
                {displayDateOfBirth && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <Cake className="w-3 h-3" /> {new Date(displayDateOfBirth).toLocaleDateString()}
                  </p>
                )}
                {editing && (
                  <div className="mt-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1 block">Date of Birth</label>
                    <input type="date" value={editDateOfBirth} onChange={e => setEditDateOfBirth(e.target.value)}
                      className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400/50 w-full sm:max-w-[200px]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats placeholder */}
        <div className="px-5 pb-5 grid grid-cols-3 gap-2 -mt-0.5">
          <div className="text-center p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100/80 dark:border-white/5 transition-colors duration-300">
            <div className="font-black text-lg text-indigo-500 dark:text-indigo-400">0</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Total XP</div>
            <div className="mt-1.5 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-0 rounded-full bg-gradient-to-r from-indigo-400 to-pink-400" />
            </div>
          </div>
          <div className="text-center p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100/80 dark:border-white/5 transition-colors duration-300">
            <div className="font-black text-lg text-orange-500">0d</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Day Streak</div>
            <div className="flex justify-center gap-0.5 mt-1.5">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              ))}
            </div>
          </div>
          <div className="text-center p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100/80 dark:border-white/5 transition-colors duration-300">
            <div className="font-black text-lg text-pink-500">—</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">JLPT Target</div>
            <div className="flex justify-center gap-1 mt-1.5">
              {["N5","N4","N3","N2","N1"].map((l, i) => (
                <div key={l} className="w-4 h-1.5 rounded-sm bg-slate-200 dark:bg-slate-700" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Tabs ─── */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl px-1.5 pt-1.5 border border-white/60 dark:border-white/10 transition-colors duration-300">
        <div className="flex gap-0 border-b border-slate-200/80 dark:border-white/10">
          {([
            { id: "overview" as const, label: "Overview", icon: Sparkles },
            { id: "achievements" as const, label: "Achievements", icon: Award },
            { id: "settings" as const, label: "Settings", icon: Settings },
          ]).map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-xl transition-all duration-200 group ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200"
                }`}>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-t-xl shadow-md shadow-indigo-500/20 ring-1 ring-white/20" />
                )}
                {activeTab !== tab.id && (
                  <div className="absolute inset-0 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-100/80 dark:bg-white/5" />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab"
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-indigo-400 rounded-full shadow-sm shadow-pink-400/50"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Study Hours", value: mockStats.studyHours, color: "text-orange-500" },
              { label: "Words", value: mockStats.wordsLearned.toLocaleString(), color: "text-blue-500" },
              { label: "Grammar", value: mockStats.grammarCompleted, color: "text-green-500" },
              { label: "Accuracy", value: `${mockStats.listeningAccuracy}%`, color: "text-purple-500" },
            ].map(s => (
              <div key={s.label}
                className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-white/60 dark:border-white/10 rounded-xl p-2.5 text-center transition-colors duration-300">
                <div className={`font-black text-base ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ACHIEVEMENTS ─── */}
      {activeTab === "achievements" && (
        <div className="grid grid-cols-3 gap-2">
          {mockAchievements.map((ach, i) => (
            <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl p-3 transition-all duration-200 hover:scale-[1.02] ${
                ach.earned
                  ? "bg-gradient-to-br from-indigo-50/90 to-pink-50/90 dark:from-indigo-500/15 dark:to-pink-500/15 border border-indigo-100/80 dark:border-indigo-500/20 shadow-sm shadow-indigo-500/10 hover:shadow-md hover:shadow-indigo-500/15"
                  : "bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-white/60 dark:border-white/10 hover:border-white/20 dark:hover:border-white/15"
              }`}>
              <div className="flex items-start justify-between mb-2">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                  ach.earned
                    ? "bg-gradient-to-br from-indigo-500 to-pink-500 shadow-sm shadow-indigo-500/30"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}>
                  {ach.earned
                    ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                    : <Star className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  }
                </div>
                <span className={`text-[10px] font-bold ${ach.earned ? "text-indigo-500 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {Math.round(ach.progress)}%
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight mb-1.5">{ach.name}</p>
              <div className="h-1 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${ach.progress}%` }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.6 }}
                  className={`h-full rounded-full ${ach.earned ? "bg-gradient-to-r from-indigo-400 to-pink-400" : "bg-slate-300 dark:bg-slate-600"}`} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── SETTINGS ─── */}
      {activeTab === "settings" && (
        <div className="space-y-2">

          {/* Sub-nav: Account · Appearance · Security */}
          <div className="flex gap-1.5 flex-wrap">
            {([
              { id: "account" as const, label: "Account", icon: User },
              { id: "appearance" as const, label: "Appearance", icon: Settings },
              { id: "security" as const, label: "Security", icon: Shield },
            ]).map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => setSettingsSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    settingsSection === s.id
                      ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20"
                      : "bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-white/60 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5"
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* ── Account ── */}
          {settingsSection === "account" && profile && (
            <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-white/60 dark:border-white/10 rounded-xl p-4 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-white">Profile Info</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Full Name</label>
                  <input type="text" value={editName}
                    onChange={e => { setEditName(e.target.value); if (!editing) setEditing(true); }}
                    className={inputBase} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Email</label>
                  <input type="text" value={profile.email || ""} className={inputBase} readOnly />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Location</label>
                  <input type="text" value={editLocation}
                    onChange={e => { setEditLocation(e.target.value); if (!editing) setEditing(true); }}
                    className={inputBase} placeholder="e.g. Tokyo, Japan" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Bio</label>
                  <textarea rows={2} value={editBio}
                    onChange={e => { setEditBio(e.target.value); if (!editing) setEditing(true); }}
                    className={`${inputBase} resize-none leading-relaxed`} placeholder="Tell us about yourself..." />
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Max 2–3 sentences about your Japanese learning goals.</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Phone</label>
                  <input type="tel" value={editPhone}
                    onChange={e => { setEditPhone(e.target.value); if (!editing) setEditing(true); }}
                    className={inputBase} placeholder="+84..." />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Date of Birth</label>
                  <input type="date" value={editDateOfBirth}
                    onChange={e => { setEditDateOfBirth(e.target.value); if (!editing) setEditing(true); }}
                    className={inputBase} />
                </div>
              </div>
              {editing && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setEditing(false); setEditName(profile.displayName || ""); setEditBio(profile.bio || ""); setEditLocation(profile.location || ""); setEditPhone(profile.phone || ""); setEditDateOfBirth(profile.dateOfBirth || ""); }}
                    className="flex-1 py-2 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    Cancel
                  </button>
                  <button onClick={handleSave}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition flex items-center justify-center gap-1.5">
                    <Save className="w-3 h-3" /> Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Appearance ── */}
          {settingsSection === "appearance" && (
            <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-white/60 dark:border-white/10 rounded-xl p-4 transition-colors duration-300">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    {theme === "dark"
                      ? <Moon className="w-4 h-4 text-indigo-400" />
                      : <Sun className="w-4 h-4 text-amber-500" />
                    }
                    <span className="text-xs font-bold text-slate-700 dark:text-white">Theme</span>
                  </div>
                  <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-lg p-1 flex gap-1">
                    {([
                      { id: "light" as const, label: "☀ Light" },
                      { id: "dark" as const, label: "🌙 Dark" },
                    ]).map(t => (
                      <button key={t.id} onClick={() => {
                        if ((t.id === "light" && theme !== "light") || (t.id === "dark" && theme !== "dark")) toggleTheme();
                      }}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
                          theme === t.id
                            ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20"
                            : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/5"
                        }`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Globe className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-white">Language</span>
                  </div>
                  <div className="relative">
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      className={`${inputBase} appearance-none pr-7 cursor-pointer text-xs`}>
                      {languages.map(l => (
                        <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {settingsSection === "security" && (
            <div>
              <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-white/60 dark:border-white/10 rounded-xl p-4 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-2.5">
                  <Lock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-white">Change Password</span>
                </div>
                {pwSuccess && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50/80 dark:bg-green-500/15 border border-green-200/80 dark:border-green-500/30 text-green-600 dark:text-green-400 text-xs font-bold">
                    <CheckCheck className="w-3.5 h-3.5" /> Password updated successfully!
                  </motion.div>
                )}
                {pwError && (
                  <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50/80 dark:bg-red-500/15 border border-red-200/80 dark:border-red-500/30 text-red-500 dark:text-red-400 text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> {pwError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Current</label>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputBase} pr-9`} />
                      <button onClick={() => setShowPw(v => !v)} type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition">
                        {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">New</label>
                    <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
                      placeholder="Min. 8 characters" className={inputBase} />
                    {newPw && (
                      <div className="mt-1 space-y-1">
                        {validationRules.map(rule => (
                          <div key={rule.label} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${rule.met ? "bg-green-100 dark:bg-green-500/20" : "bg-slate-100 dark:bg-slate-800"}`}>
                              {rule.met ? <CheckCircle className="w-2 h-2 text-green-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            </div>
                            <span className={`text-[10px] font-medium ${rule.met ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-slate-500"}`}>{rule.label}</span>
                          </div>
                        ))}
                        {getStrength(newPw) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div animate={{ width: `${getStrength(newPw)!.pct}%` }}
                                className={`h-full rounded-full ${getStrength(newPw)!.color}`} />
                            </div>
                            <span className={`text-[10px] font-black ${getStrength(newPw)!.label === "Weak" ? "text-red-500" : getStrength(newPw)!.label === "Medium" ? "text-amber-500" : "text-green-500"}`}>
                              {getStrength(newPw)!.label}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Confirm</label>
                    <input type={showPw ? "text" : "password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Repeat password"
                      className={`${inputBase} ${confirmPw && newPw !== confirmPw ? "border-red-400 dark:border-red-500/50 focus:ring-red-400/50" : ""}`} />
                    {confirmPw && newPw !== confirmPw && <p className="text-[10px] text-red-500 font-bold mt-0.5">Passwords don't match</p>}
                  </div>
                  <button onClick={async () => {
                    setPwError(null);
                    if (!currentPw) { setPwError("Current password is required."); return; }
                    if (newPw.length < 8) { setPwError("Min. 8 characters."); return; }
                    if (!/[A-Z]/.test(newPw)) { setPwError("Add at least one uppercase letter."); return; }
                    if (!/[0-9]/.test(newPw)) { setPwError("Add at least one number."); return; }
                    if (!/[^A-Za-z0-9]/.test(newPw)) { setPwError("Add at least one special character."); return; }
                    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
                    setPwLoading(true);
                    try {
                      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
                      setPwSuccess(true);
                      setCurrentPw(""); setNewPw(""); setConfirmPw("");
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
                  }} disabled={pwLoading}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5 mt-1">
                    {pwLoading
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Updating…</>
                      : <><Lock className="w-3 h-3" /> Update Password</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Avatar Remove Confirm ─── */}
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
