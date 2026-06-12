const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface CertificateUploadResult {
  imageUrl: string | null;
  certificateUrl: string | null;
}

export interface CertificateUploadError {
  message: string;
}

function sanitizeFileName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "bin";
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 50);
  return `${base}.${ext}`;
}

export async function uploadCertificateFile(
  file: File,
  teacherId?: string
): Promise<CertificateUploadResult> {
  const { supabase } = await import("./api/supabase");

  const bucket =
    (import.meta.env.VITE_SUPABASE_CERT_BUCKET as string) ||
    (import.meta.env.VITE_SUPABASE_AVATAR_BUCKET as string) ||
    "teacher-certificates";

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Promise.reject({
      message: "Only JPG, PNG, WEBP images and PDF files are allowed.",
    });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Promise.reject({
      message: `File size must be less than ${MAX_SIZE_MB}MB.`,
    });
  }

  const safeFileName = sanitizeFileName(file.name);
  const folder = teacherId ?? "guest";
  const fileName = `${folder}/${Date.now()}-${safeFileName}`;

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

  const isImage = file.type !== "application/pdf";
  return {
    imageUrl: isImage ? urlData.publicUrl : null,
    certificateUrl: isImage ? null : urlData.publicUrl,
  };
}
