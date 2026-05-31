import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Edit3, BookOpen, GraduationCap, Award, Upload, Clock,
  FileCheck, Eye, Calendar, MapPin, Globe, Mail, Edit, Save, X,
  ChevronRight, Users, TrendingUp, CheckCircle, Camera, Trash2,
  Image as ImageIcon, FileImage, Plus, Loader2, AlertCircle, CheckCheck,
  Phone, Cake
} from "lucide-react";
import { profileApi, type ProfileResponse } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

interface Certificate {
  id: string;
  name: string;
  year: string;
  description?: string;
  imageUrl?: string;
}

const teacherProfile = {
  name: "Taro Yamamoto",
  email: "taro.sensei@midori.jp",
  bio: "Native Japanese teacher with 8 years of experience teaching JLPT preparation courses. Specialized in N2-N1 level grammar and business Japanese communication. Passionate about creating engaging lessons that make learning Japanese accessible and fun.",
  location: "Tokyo, Japan",
  avatar: "T",
  level: 15,
  joinDate: "January 2023",
  website: "taro-sensei.jp",
  experience: "8 years",
  students: 1240,
  lessons: 87,
};

const defaultCerts: Certificate[] = [
  { id: "1", name: "JLPT N1 Certified", year: "2015" },
  { id: "2", name: "Japanese Teaching (Fukuoka)", year: "2017" },
  { id: "3", name: "Business Japanese Prof.", year: "2019" },
];

export const Route = createFileRoute("/teacher/profile")({ component: TeacherProfilePage });

// --- Sub-components ---

function RemoveImageConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-xs w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-display font-black text-center mb-2">Remove Image?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          The certificate image will be removed. You can upload a new one anytime.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
          >
            Remove
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EditCertModal({
  cert,
  onSave,
  onCancel,
}: {
  cert: Certificate;
  onSave: (updated: Certificate) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(cert.name);
  const [year, setYear] = useState(cert.year);
  const [description, setDescription] = useState(cert.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(cert.imageUrl);
  const [showRemoveImg, setShowRemoveImg] = useState(false);
  const [showImgMenu, setShowImgMenu] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({ ...cert, name, year, description: description || undefined, imageUrl });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-display font-black">Edit Certificate</h3>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Image Upload Section */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
              Certificate Image
            </label>
            <div className="relative">
              <div className="w-full h-36 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                {imageUrl ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={imageUrl}
                      alt="Certificate"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => setShowImgMenu(!showImgMenu)}
                        className="px-3 py-1.5 rounded-lg bg-white text-xs font-semibold text-slate-700 shadow"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer p-4 w-full h-full justify-center hover:bg-slate-100 dark:hover:bg-slate-600/30 transition">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
                      Upload JPG, PNG or WEBP
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Image action menu */}
              <AnimatePresence>
                {showImgMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-2 right-2 bg-white dark:bg-slate-700 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden z-10"
                  >
                    <label className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer transition whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      Change Image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => { setImageUrl(undefined); setShowImgMenu(false); setShowRemoveImg(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Image
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                Certificate Name *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
                placeholder="e.g. JLPT N1 Certified"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                Year *
              </label>
              <input
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
                placeholder="e.g. 2023"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
                placeholder="Brief description of this certificate..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !year.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Remove Image Confirm */}
      <AnimatePresence>
        {showRemoveImg && (
          <RemoveImageConfirmDialog
            onConfirm={() => setShowRemoveImg(false)}
            onCancel={() => setShowRemoveImg(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AddCertModal({
  onAdd,
  onCancel,
}: {
  onAdd: (cert: Omit<Certificate, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !year.trim()) return;
    onAdd({ name: name.trim(), year: year.trim(), description: description.trim() || undefined, imageUrl });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-display font-black">Add Certificate</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Image Upload */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
            Certificate Image
          </label>
          <div className="relative">
            <div className="w-full h-36 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
              {imageUrl ? (
                <div className="relative w-full h-full group">
                  <img src={imageUrl} alt="Certificate" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="px-3 py-1.5 rounded-lg bg-white text-xs font-semibold text-slate-700 shadow cursor-pointer">
                      Change Image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer p-4 w-full h-full justify-center hover:bg-slate-100 dark:hover:bg-slate-600/30 transition">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
                    Upload JPG, PNG or WEBP
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
              Certificate Name *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
              placeholder="e.g. JLPT N1 Certified"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
              Year *
            </label>
            <input
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
              placeholder="e.g. 2023"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              placeholder="Brief description of this certificate..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !year.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Certificate
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Certificate Card ---
function CertCard({
  cert,
  onEdit,
  onRemove,
}: {
  cert: Certificate;
  onEdit: (cert: Certificate) => void;
  onRemove: (id: string) => void;
}) {
  const [showImgMenu, setShowImgMenu] = useState(false);
  const [showRemoveImg, setShowRemoveImg] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onEdit({ ...cert, imageUrl: reader.result as string });
        setShowImgMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onEdit({ ...cert, imageUrl: undefined });
    setShowRemoveImg(false);
  };

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 group hover:bg-muted/50 transition">
        {/* Image area */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 relative">
            {cert.imageUrl ? (
              <img
                src={cert.imageUrl}
                alt={cert.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-slate-400 font-medium text-center px-1 leading-tight">
                  No image
                </span>
              </div>
            )}

            {/* Hover overlay with image actions */}
            <div
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              onClick={() => setShowImgMenu(!showImgMenu)}
            >
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Image action menu */}
          <AnimatePresence>
            {showImgMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-1 right-1 bg-white dark:bg-slate-700 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden z-20"
              >
                <label className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer transition whitespace-nowrap">
                  <Upload className="w-3 h-3 text-primary" />
                  Upload
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {cert.imageUrl && (
                  <button
                    onClick={() => { setShowImgMenu(false); setShowRemoveImg(true); }}
                    className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition whitespace-nowrap"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
            {cert.name}
          </div>
          <div className="text-[10px] text-amber-500 font-semibold mt-0.5">{cert.year}</div>
          {cert.description && (
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
              {cert.description}
            </p>
          )}
        </div>

        {/* Edit & Delete actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onEdit(cert)}
            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-primary/5 hover:border-primary/30 transition"
          >
            <Edit3 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          </button>
          <button
            onClick={() => onRemove(cert.id)}
            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/20 transition"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>

      {/* Remove Image Confirm */}
      <AnimatePresence>
        {showRemoveImg && (
          <RemoveImageConfirmDialog
            onConfirm={handleRemoveImage}
            onCancel={() => setShowRemoveImg(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// --- Main Page ---
function TeacherProfilePage() {
  // Profile data from backend
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const { updateCurrentUser } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>(defaultCerts);
  const [showAddCert, setShowAddCert] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [showRemoveCertConfirm, setShowRemoveCertConfirm] = useState<string | null>(null);

  const hasCustomAvatar = avatarPreview !== null;

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

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setShowAvatarMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setShowRemoveConfirm(false);
    setShowAvatarMenu(false);
  };

  const handleAddCert = (cert: Omit<Certificate, "id">) => {
    const newCert: Certificate = {
      ...cert,
      id: Date.now().toString(),
    };
    setCertificates(prev => [...prev, newCert]);
    setShowAddCert(false);
  };

  const handleEditCert = (updated: Certificate) => {
    setCertificates(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditingCert(null);
  };

  const handleRemoveCert = (id: string) => {
    setCertificates(prev => prev.filter(c => c.id !== id));
    setShowRemoveCertConfirm(null);
  };

  const avatarLetter = (editName || profile?.displayName || "?").charAt(0).toUpperCase();

  // Loading state
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

  // Error state
  if (loadError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 font-medium">{loadError}</p>
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
        className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700"
      >
        {/* Banner */}
        <div className="h-28 sm:h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIj48cGF0aCBkPSJNMzAgMzBjLTEuNjY3IDAtMyAxLjMzMy0zIDNzMS4zMzMgMyAzIDMgMy0xLjMzMyAzLTMtMS4zMzMtMy0zLTMtMy4zMzMgMy0zIDNzMS4zMzMtMyAzLTN6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
          <div className="absolute top-4 right-6 flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditName(profile?.displayName || "");
                    setEditBio(profile?.bio || "");
                    setEditLocation(profile?.location || "");
                    setEditPhone(profile?.phone || "");
                    setEditDateOfBirth(profile?.dateOfBirth || "");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-semibold backdrop-blur-sm hover:bg-white/30 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg bg-white text-purple-600 text-xs font-bold backdrop-blur-sm shadow hover:bg-white/90 transition"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-semibold backdrop-blur-sm hover:bg-white/30 transition flex items-center gap-1"
              >
                <Edit className="w-3 h-3" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Avatar + Info */}
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                {avatarPreview ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-24 h-24 rounded-2xl shadow-xl border-4 border-white dark:border-slate-800 overflow-hidden"
                  >
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-24 h-24 rounded-2xl bg-gradient-hero flex items-center justify-center text-white text-4xl font-black shadow-xl border-4 border-white dark:border-slate-800"
                  >
                    {avatarLetter}
                  </motion.div>
                )}

                {/* Level badge */}
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-hero text-white text-[10px] font-black shadow-lg border-2 border-white dark:border-slate-800 z-10">
                  Teacher
                </div>

                {/* Avatar Action Button */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
                  <div className="relative">
                    <button
                      onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                      className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 shadow-md border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    </button>

                    {/* Avatar Dropdown Menu */}
                    <AnimatePresence>
                      {showAvatarMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                        >
                          <label className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-primary/5 cursor-pointer transition">
                            <Upload className="w-4 h-4 text-primary" />
                            <span>Upload Avatar</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </label>
                          {hasCustomAvatar && (
                            <button
                              onClick={() => { setShowRemoveConfirm(true); setShowAvatarMenu(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove Avatar
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 w-full text-center sm:text-left">
                {editing ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="text-2xl font-display font-black bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-primary/40 w-full text-center sm:text-left mb-1"
                  />
                ) : (
                  <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">
                    {profile?.displayName || "—"}
                  </h2>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  {profile?.location && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3 h-3" /> {profile.location}
                    </span>
                  )}
                  {profile?.phone && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Phone className="w-3 h-3" /> {profile.phone}
                    </span>
                  )}
                  {profile?.dateOfBirth && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Cake className="w-3 h-3" /> {new Date(profile.dateOfBirth).toLocaleDateString()}
                    </span>
                  )}
                  {profile?.createdAt && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" /> Joined {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {editing ? (
                  <textarea
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    rows={2}
                    className="mt-2 w-full max-w-lg text-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40 resize-none text-center sm:text-left"
                    placeholder="Tell us about yourself..."
                  />
                ) : profile?.bio ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-lg leading-relaxed">
                    {profile.bio}
                  </p>
                ) : null}
                {editing && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Location</label>
                      <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-xs outline-none focus:ring-2 focus:ring-primary/40 w-36" placeholder="Location" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Phone</label>
                      <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-xs outline-none focus:ring-2 focus:ring-primary/40 w-36" placeholder="+84..." />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Date of Birth</label>
                      <input type="date" value={editDateOfBirth} onChange={e => setEditDateOfBirth(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-xs outline-none focus:ring-2 focus:ring-primary/40 w-36" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 pb-6 grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-muted/40">
            <div className="font-display font-black text-xl text-primary">—</div>
            <div className="text-[10px] text-muted-foreground">Students taught</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/40">
            <div className="font-display font-black text-xl text-purple-500">—</div>
            <div className="text-[10px] text-muted-foreground">Lessons created</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/40">
            <div className="font-display font-black text-xl text-green-500">—</div>
            <div className="text-[10px] text-muted-foreground">Experience</div>
          </div>
        </div>
      </motion.div>

      {/* Certificates */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
      >
        <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" /> Certificates
        </h3>
        <div className="space-y-2.5">
          {certificates.map(cert => (
            <CertCard
              key={cert.id}
              cert={cert}
              onEdit={setEditingCert}
              onRemove={id => setShowRemoveCertConfirm(id)}
            />
          ))}
          {certificates.length === 0 && (
            <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
              <Award className="w-8 h-8 opacity-40" />
              <span className="text-sm">No certificates yet</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddCert(true)}
          className="w-full mt-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Certificate
        </button>
      </motion.div>

      {/* Remove Avatar Confirm Dialog */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRemoveConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-display font-black text-center mb-2">Remove Avatar?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                Your profile will return to the default avatar. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveAvatar}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Certificate Confirm Dialog */}
      <AnimatePresence>
        {showRemoveCertConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRemoveCertConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-display font-black text-center mb-2">Remove Certificate?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                This certificate will be permanently removed from your profile.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveCertConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveCert(showRemoveCertConfirm!)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Certificate Modal */}
      <AnimatePresence>
        {showAddCert && (
          <AddCertModal
            onAdd={handleAddCert}
            onCancel={() => setShowAddCert(false)}
          />
        )}
      </AnimatePresence>

      {/* Edit Certificate Modal */}
      <AnimatePresence>
        {editingCert && (
          <EditCertModal
            cert={editingCert}
            onSave={handleEditCert}
            onCancel={() => setEditingCert(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
