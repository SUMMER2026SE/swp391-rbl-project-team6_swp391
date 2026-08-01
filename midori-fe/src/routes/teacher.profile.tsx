import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Edit3,
  BookOpen,
  GraduationCap,
  Award,
  Upload,
  Clock,
  FileCheck,
  Eye,
  Calendar,
  MapPin,
  Globe,
  Mail,
  Edit,
  Save,
  X,
  ChevronRight,
  Users,
  TrendingUp,
  CheckCircle,
  Camera,
  Trash2,
  Image as ImageIcon,
  FileImage,
  Plus,
  Loader2,
  AlertCircle,
  CheckCheck,
  Phone,
  Cake,
  FileText,
} from "lucide-react";
import { profileApi, type ProfileResponse } from "@/lib/api/profile";
import { teacherCertificatesApi, type TeacherCertificate } from "@/lib/api/teacherCertificates";
import { ApiError, isApiError } from "@/lib/api/client";
import { useAuth, isAvatar } from "@/lib/auth";
import { uploadAvatar, removeAvatar } from "@/lib/avatar";
import { uploadCertificateFile } from "@/lib/certificate";

type CertFormData = Omit<TeacherCertificate, "id" | "createdAt" | "updatedAt">;

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

export const Route = createFileRoute("/teacher/profile")({ component: TeacherProfilePage });

// --- Sub-components ---

// --- Certificate Modal components ---

function EditCertModal({
  cert,
  onSave,
  onCancel,
  teacherId,
}: {
  cert: TeacherCertificate;
  onSave: (updated: TeacherCertificate) => void;
  onCancel: () => void;
  teacherId?: string;
}) {
  const [title, setTitle] = useState(cert.title);
  const [issuer, setIssuer] = useState(cert.issuer);
  const [description, setDescription] = useState(cert.description ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(cert.imageUrl ?? null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentImageUrl = cert.imageUrl;
  const currentCertUrl = cert.certificateUrl;
  const isCurrentPdf = currentCertUrl && !currentImageUrl;
  const isPdfFile = selectedFile?.type === "application/pdf";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadError(null);
    if (file.type !== "application/pdf") {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !issuer.trim()) return;
    setUploadError(null);

    let imageUrl: string | null = currentImageUrl ?? null;
    let certificateUrl: string | null = currentCertUrl ?? null;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const result = await uploadCertificateFile(selectedFile, teacherId);
        if (result.imageUrl) imageUrl = result.imageUrl;
        if (result.certificateUrl) certificateUrl = result.certificateUrl;
      } catch (err: unknown) {
        setUploadError((err as { message?: string }).message || "Upload failed. Please try again.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSave({
      ...cert,
      title,
      issuer,
      certificateUrl,
      imageUrl,
      description: description.trim() || null,
    });
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
          onClick={(e) => e.stopPropagation()}
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

          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                Certificate Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
                placeholder="e.g. JLPT N1 Certified"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                Issuer *
              </label>
              <input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
                placeholder="e.g. Japan Foundation"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                Certificate Image/File (optional)
              </label>
              <div
                className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-3 text-center hover:border-primary/50 transition cursor-pointer"
                onClick={() => document.getElementById("edit-cert-file-input")?.click()}
              >
                <input
                  id="edit-cert-file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {filePreview ? (
                  <div className="relative">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-32 object-contain rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : selectedFile ? (
                  <div className="flex items-center justify-center gap-2 py-2">
                    {selectedFile.type === "application/pdf" ? (
                      <FileText className="w-6 h-6 text-red-400" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-primary" />
                    )}
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {selectedFile.name}
                    </span>
                  </div>
                ) : isCurrentPdf ? (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <FileText className="w-6 h-6 text-red-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Current: PDF file
                    </span>
                  </div>
                ) : currentImageUrl ? (
                  <div className="relative">
                    <img
                      src={currentImageUrl}
                      alt="Current"
                      className="w-full h-32 object-contain rounded-lg mx-auto"
                    />
                  </div>
                ) : (
                  <div className="py-2">
                    <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Click to select image or PDF (max 5MB)
                    </span>
                  </div>
                )}
              </div>
              {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
                placeholder="Brief description of this certificate..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !issuer.trim() || isUploading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

function AddCertModal({
  onAdd,
  onCancel,
  teacherId,
}: {
  onAdd: (cert: CertFormData) => void;
  onCancel: () => void;
  teacherId?: string;
}) {
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadError(null);
    if (file.type !== "application/pdf") {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !issuer.trim()) return;
    setUploadError(null);

    let imageUrl: string | null = null;
    let certificateUrl: string | null = null;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const result = await uploadCertificateFile(selectedFile, teacherId);
        if (result.imageUrl) imageUrl = result.imageUrl;
        if (result.certificateUrl) certificateUrl = result.certificateUrl;
      } catch (err: unknown) {
        setUploadError((err as { message?: string }).message || "Upload failed. Please try again.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onAdd({
      title: title.trim(),
      issuer: issuer.trim(),
      certificateUrl,
      imageUrl,
      description: description.trim() || null,
    });
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
        onClick={(e) => e.stopPropagation()}
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

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
              Certificate Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
              placeholder="e.g. JLPT N1 Certified"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
              Issuer *
            </label>
            <input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
              placeholder="e.g. Japan Foundation"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
              Certificate Image/File (optional)
            </label>
            <div
              className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-3 text-center hover:border-primary/50 transition cursor-pointer"
              onClick={() => document.getElementById("add-cert-file-input")?.click()}
            >
              <input
                id="add-cert-file-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {filePreview ? (
                <div className="relative">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-32 object-contain rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : selectedFile ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  {selectedFile.type === "application/pdf" ? (
                    <FileText className="w-6 h-6 text-red-400" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-primary" />
                  )}
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {selectedFile.name}
                  </span>
                </div>
              ) : (
                <div className="py-2">
                  <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Click to select image or PDF (max 5MB)
                  </span>
                </div>
              )}
            </div>
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              placeholder="Brief description of this certificate..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !issuer.trim() || isUploading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Add Certificate"
            )}
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
  cert: TeacherCertificate;
  onEdit: (cert: TeacherCertificate) => void;
  onRemove: (id: number | string) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 group hover:bg-muted/50 transition">
      {/* Image area */}
      <div className="relative flex-shrink-0">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 relative">
          {cert.imageUrl ? (
            <img src={cert.imageUrl} alt={cert.title} className="w-full h-full object-cover" />
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
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
          {cert.title}
        </div>
        <div className="text-[10px] text-amber-500 font-semibold mt-0.5">{cert.issuer}</div>
        {cert.description && (
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
            {cert.description}
          </p>
        )}
        {cert.certificateUrl && (
          <a
            href={cert.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline mt-1 block truncate max-w-[180px]"
          >
            View certificate
          </a>
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
  const { user, updateCurrentUser } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Certificates state
  const [certificates, setCertificates] = useState<TeacherCertificate[]>([]);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [certSuccess, setCertSuccess] = useState<string | null>(null);
  const [showAddCert, setShowAddCert] = useState(false);
  const [editingCert, setEditingCert] = useState<TeacherCertificate | null>(null);
  const [showRemoveCertConfirm, setShowRemoveCertConfirm] = useState<number | string | null>(null);

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
      if (isAvatar(res.avatarUrl)) {
        setAvatarPreview(res.avatarUrl);
      } else {
        setAvatarPreview(user?.googleAvatar ?? null);
      }
    } catch (err) {
      if (isApiError(err)) {
        setLoadError(err.message);
      } else {
        setLoadError("Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchCertificates = useCallback(async () => {
    setCertLoading(true);
    setCertError(null);
    try {
      const res = await teacherCertificatesApi.listCertificates();
      setCertificates(res);
    } catch (err) {
      if (isApiError(err)) {
        setCertError(err.message);
      } else {
        setCertError("Failed to load certificates.");
      }
    } finally {
      setCertLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setIsProfileSaving(true);
    if (!editName.trim()) {
      setSaveError("Display name is required.");
      setIsProfileSaving(false);
      return;
    }
    try {
      const updated = await profileApi.updateMyProfile({
        displayName: editName.trim(),
        bio: editBio || undefined,
        location: editLocation || undefined,
        phone: editPhone || undefined,
        dateOfBirth: editDateOfBirth || undefined,
      });
      setProfile(updated);
      updateCurrentUser({
        name: updated.displayName,
        avatar: isAvatar(updated.avatarUrl) ? updated.avatarUrl : (user?.avatar ?? null),
        googleAvatar: user?.googleAvatar ?? null,
      });
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (isApiError(err)) {
        setSaveError(err.message);
      } else {
        setSaveError("Failed to save profile.");
      }
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarError(null);
    setIsAvatarSaving(true);
    setShowAvatarMenu(false);
    try {
      const { avatarUrl } = await uploadAvatar(user.id, file);
      const updated = await profileApi.updateMyProfile({ avatarUrl });
      setProfile(updated);
      setAvatarPreview(avatarUrl);
      updateCurrentUser({ avatar: avatarUrl, googleAvatar: user.googleAvatar ?? null });
    } catch (err: unknown) {
      setAvatarError((err as { message?: string }).message || "Upload failed. Please try again.");
    } finally {
      setIsAvatarSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarError(null);
    setIsAvatarSaving(true);
    setShowRemoveConfirm(false);
    try {
      const currentUrl = avatarPreview;
      await removeAvatar(currentUrl);
      const updated = await profileApi.updateMyProfile({ avatarUrl: "" });
      setProfile(updated);
      setAvatarPreview(null);
      updateCurrentUser({ avatar: null, googleAvatar: user.googleAvatar ?? null });
    } catch (err: unknown) {
      setAvatarError((err as { message?: string }).message || "Failed to remove avatar.");
    } finally {
      setIsAvatarSaving(false);
    }
  };

  const handleAddCert = async (cert: CertFormData) => {
    setCertLoading(true);
    setCertError(null);
    setCertSuccess(null);
    try {
      const created = await teacherCertificatesApi.createCertificate(cert);
      setCertificates((prev) => [...prev, created]);
      setShowAddCert(false);
      setCertSuccess("Certificate added successfully.");
      setTimeout(() => setCertSuccess(null), 3000);
    } catch (err) {
      if (isApiError(err)) {
        setCertError(err.message);
      } else {
        setCertError("Failed to add certificate.");
      }
    } finally {
      setCertLoading(false);
    }
  };

  const handleEditCert = async (updated: TeacherCertificate) => {
    setCertLoading(true);
    setCertError(null);
    setCertSuccess(null);
    try {
      const result = await teacherCertificatesApi.updateCertificate(updated.id, {
        title: updated.title,
        issuer: updated.issuer,
        certificateUrl: updated.certificateUrl,
        imageUrl: updated.imageUrl,
        description: updated.description,
      });
      setCertificates((prev) => prev.map((c) => (c.id === updated.id ? result : c)));
      setEditingCert(null);
      setCertSuccess("Certificate updated successfully.");
      setTimeout(() => setCertSuccess(null), 3000);
    } catch (err) {
      if (isApiError(err)) {
        setCertError(err.message);
      } else {
        setCertError("Failed to update certificate.");
      }
    } finally {
      setCertLoading(false);
    }
  };

  const handleRemoveCert = async (id: number | string) => {
    setCertLoading(true);
    setCertError(null);
    setCertSuccess(null);
    try {
      await teacherCertificatesApi.deleteCertificate(id);
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      setShowRemoveCertConfirm(null);
      setCertSuccess("Certificate removed successfully.");
      setTimeout(() => setCertSuccess(null), 3000);
    } catch (err) {
      if (isApiError(err)) {
        setCertError(err.message);
      } else {
        setCertError("Failed to remove certificate.");
      }
    } finally {
      setCertLoading(false);
    }
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
          <button
            onClick={fetchProfile}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state — profile data returned null or undefined
  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            No profile data available.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Please try refreshing the page.
          </p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition"
          >
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
                  disabled={isProfileSaving}
                  className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-semibold backdrop-blur-sm hover:bg-white/30 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isProfileSaving}
                  className="px-3 py-1.5 rounded-lg bg-white text-purple-600 text-xs font-bold backdrop-blur-sm shadow hover:bg-white/90 transition disabled:opacity-60 flex items-center gap-1"
                >
                  {isProfileSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
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

                {/* Camera button only — role badge is in the info section */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
                  <div className="relative">
                    <button
                      onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                      disabled={isAvatarSaving}
                      className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 shadow-md border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 transition disabled:opacity-50"
                    >
                      {isAvatarSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600 dark:text-slate-300" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      )}
                    </button>

                    {/* Avatar Dropdown Menu */}
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
                            {isAvatarSaving ? (
                              <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-indigo-500" />
                            ) : (
                              <Upload className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                            )}
                            <span className="font-medium">
                              {isAvatarSaving ? "Uploading..." : "Change Avatar"}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={isAvatarSaving}
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </label>
                          {hasCustomAvatar && (
                            <button
                              disabled={isAvatarSaving}
                              onClick={() => {
                                setShowRemoveConfirm(true);
                                setShowAvatarMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">Remove Avatar</span>
                            </button>
                          )}
                          {avatarError && (
                            <p className="px-4 py-2 text-[10px] text-red-500 border-t border-slate-100 dark:border-slate-700">
                              {avatarError}
                            </p>
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
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-display font-black bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-primary/40 w-full text-center sm:text-left mb-1"
                  />
                ) : (
                  <>
                    <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">
                      {profile?.displayName || "—"}
                    </h2>
                    {/* Role badge */}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-hero text-white text-xs font-black shadow-sm mt-0.5">
                      Teacher
                    </span>
                  </>
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
                      <Cake className="w-3 h-3" />{" "}
                      {new Date(profile.dateOfBirth).toLocaleDateString()}
                    </span>
                  )}
                  {profile?.createdAt && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" /> Joined{" "}
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {editing ? (
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
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
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-xs outline-none focus:ring-2 focus:ring-primary/40 w-36"
                        placeholder="Location"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-xs outline-none focus:ring-2 focus:ring-primary/40 w-36"
                        placeholder="+84..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editDateOfBirth}
                        onChange={(e) => setEditDateOfBirth(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-xs outline-none focus:ring-2 focus:ring-primary/40 w-36"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 pb-6 grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-slate-600 shadow-sm">
            <div className="font-display font-black text-2xl text-slate-900 dark:text-white">0</div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Students taught</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-slate-600 shadow-sm">
            <div className="font-display font-black text-2xl text-slate-900 dark:text-white">0</div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Classes managed</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-slate-600 shadow-sm">
            <div className="font-display font-black text-2xl text-slate-900 dark:text-white">—</div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Experience</div>
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
          <Award className="w-4 h-4 text-amber-400" />
          My Certificates
        </h3>

        {/* Certificates loading */}
        {certLoading && certificates.length === 0 && (
          <div className="py-6 flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs">Loading certificates...</span>
          </div>
        )}

        {/* Certificates error */}
        {certError && certificates.length === 0 && (
          <div className="py-6 flex flex-col items-center gap-2 text-red-400">
            <AlertCircle className="w-6 h-6" />
            <span className="text-xs">{certError}</span>
            <button
              onClick={fetchCertificates}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Certificate list */}
        {!certLoading && !certError && (
          <div className="space-y-2.5">
            {certificates.map((cert) => (
              <CertCard
                key={cert.id}
                cert={cert}
                onEdit={setEditingCert}
                onRemove={(id) => setShowRemoveCertConfirm(id)}
              />
            ))}
            {certificates.length === 0 && (
              <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
                <Award className="w-8 h-8 opacity-40" />
                <span className="text-sm">No certificates yet</span>
              </div>
            )}
          </div>
        )}

        {/* Certificate success message */}
        {certSuccess && (
          <div className="mt-3 py-2 px-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-xs font-medium text-center">
            {certSuccess}
          </div>
        )}

        {/* Certificate error message */}
        {certError && certificates.length > 0 && (
          <div className="mt-3 py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-500 text-xs font-medium text-center">
            {certError}
          </div>
        )}

        <button
          onClick={() => setShowAddCert(true)}
          disabled={certLoading}
          className="w-full mt-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition flex items-center justify-center gap-1 disabled:opacity-50"
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
              onClick={(e) => e.stopPropagation()}
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
                  disabled={isAvatarSaving}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isAvatarSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Removing...
                    </>
                  ) : (
                    "Remove"
                  )}
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-display font-black text-center mb-2">
                Remove Certificate?
              </h3>
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
            teacherId={user?.id}
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
            teacherId={user?.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
