// lib/validation.ts
import { sanitizeInput, isValidUrl, isValidYoutubeUrl, isValidEmail, isValidContentLength, hasMaliciousContent, isValidImageType, isValidFileSize } from "./security";

/**
 * Validate blog title
 */
export const validateBlogTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: "Judul blog tidak boleh kosong" };
  }

  if (title.length > 200) {
    return { valid: false, error: "Judul blog maksimal 200 karakter" };
  }

  if (hasMaliciousContent(title)) {
    return { valid: false, error: "Judul mengandung konten yang tidak diizinkan" };
  }

  return { valid: true };
};

/**
 * Validate blog content
 */
export const validateBlogContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "Konten blog tidak boleh kosong" };
  }

  if (!isValidContentLength(content, 1, 50000)) {
    return { valid: false, error: "Konten blog maksimal 50.000 karakter" };
  }

  if (hasMaliciousContent(content)) {
    return { valid: false, error: "Konten mengandung script atau kode berbahaya" };
  }

  return { valid: true };
};

/**
 * Validate YouTube URL
 */
export const validateYoutubeUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "URL YouTube tidak boleh kosong" };
  }

  if (!isValidYoutubeUrl(url)) {
    return { valid: false, error: "URL YouTube tidak valid" };
  }

  return { valid: true };
};

/**
 * Validate image upload
 */
export const validateImageUpload = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  if (!isValidImageType(file)) {
    return { valid: false, error: "Tipe file harus JPG, PNG, GIF, atau WebP" };
  }

  if (!isValidFileSize(file, 1)) {
    return { valid: false, error: "Ukuran file maksimal 1MB" };
  }

  return { valid: true };
};

/**
 * Validate content block
 */
export const validateContentBlock = (type: string, content: string): { valid: boolean; error?: string } => {
  const validTypes = ["subtitle", "text", "youtube", "image", "code", "file", "video"];

  if (!validTypes.includes(type)) {
    return { valid: false, error: "Tipe konten tidak valid" };
  }

  if (type === "youtube") {
    return validateYoutubeUrl(content);
  }

  if (type === "subtitle" && content.length > 200) {
    return { valid: false, error: "Subjudul maksimal 200 karakter" };
  }

  if (type === "text" && content.length > 10000) {
    return { valid: false, error: "Teks maksimal 10.000 karakter" };
  }

  if (type === "code" && content.length > 5000) {
    return { valid: false, error: "Code block maksimal 5.000 karakter" };
  }

  if (hasMaliciousContent(content)) {
    return { valid: false, error: "Konten mengandung kode berbahaya" };
  }

  return { valid: true };
};

/**
 * Sanitize blog data sebelum disimpan
 */
export const sanitizeBlogData = (data: any) => {
  return {
    ...data,
    title: sanitizeInput(data.title || ""),
    subtitle: data.subtitle ? sanitizeInput(data.subtitle) : undefined,
    content: data.content ? sanitizeInput(data.content) : undefined,
    authorName: sanitizeInput(data.authorName || ""),
    authorEmail: data.authorEmail ? sanitizeInput(data.authorEmail) : undefined,
  };
};

/**
 * Validate user role update
 */
export const validateRoleUpdate = (currentUserRole: string, targetRole: string): { valid: boolean; error?: string } => {
  const validRoles = ["user", "admin", "moderator"];

  if (!validRoles.includes(targetRole)) {
    return { valid: false, error: "Role tidak valid" };
  }

  if (currentUserRole !== "admin") {
    return { valid: false, error: "Hanya admin yang bisa mengubah role" };
  }

  return { valid: true };
};
