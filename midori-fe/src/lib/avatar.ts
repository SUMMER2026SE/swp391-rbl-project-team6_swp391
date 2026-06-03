import { supabase } from "./api/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface AvatarUploadResult {
  avatarUrl: string;
}

export interface AvatarUploadError {
  message: string;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<AvatarUploadResult> {
  if (!userId) {
    return Promise.reject({ message: "User ID is required." });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Promise.reject({
      message: "Only JPG, PNG, and WEBP images are allowed.",
    });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Promise.reject({
      message: `File size must be less than ${MAX_SIZE_MB}MB.`,
    });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ALLOWED_TYPES.includes(`image/${ext}`) ? ext : "jpg";
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  const bucket = (import.meta.env.VITE_SUPABASE_AVATAR_BUCKET as string) || "avatars";

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    return Promise.reject({ message: error.message });
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return { avatarUrl: urlData.publicUrl };
}

export async function removeAvatar(
  avatarUrl: string | null | undefined
): Promise<void> {
  if (!avatarUrl || avatarUrl.trim() === "") return;

  const bucket = (import.meta.env.VITE_SUPABASE_AVATAR_BUCKET as string) || "avatars";

  // Extract the storage path from the public URL
  // Format: https://xxx.supabase.co/storage/v1/object/public/avatars/userId/filename
  const marker = `/storage/v1/object/public/${bucket}/`;
  const pathIndex = avatarUrl.indexOf(marker);
  if (pathIndex === -1) return;

  const path = avatarUrl.substring(pathIndex + marker.length);
  if (!path) return;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.warn("[Avatar] Failed to delete old avatar file from storage:", error.message);
  }
}
