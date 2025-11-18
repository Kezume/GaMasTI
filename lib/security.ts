// lib/security.ts

/**
 * Sanitize user input untuk mencegah XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";

  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
};

/**
 * Validate URL untuk memastikan hanya URL yang aman
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    // Hanya izinkan https dan http
    return ["https:", "http:"].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Validate YouTube URL
 */
export const isValidYoutubeUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const validDomains = ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"];
    return validDomains.some((domain) => urlObj.hostname === domain);
  } catch {
    return false;
  }
};

/**
 * Validate GitHub URL
 */
export const isValidGitHubUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.hostname === "github.com";
  } catch {
    return false;
  }
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize filename untuk mencegah path traversal
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return "";

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 255);
};

/**
 * Validate image file type
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  return validTypes.includes(file.type);
};

/**
 * Validate file size (1MB max)
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 1): boolean => {
  const maxSize = maxSizeMB * 1024 * 1024;
  return file.size <= maxSize;
};

/**
 * Rate limiting helper untuk mencegah spam
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  check(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Filter requests dalam window
    const validRequests = userRequests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * Validate content length
 */
export const isValidContentLength = (content: string, minLength: number = 1, maxLength: number = 50000): boolean => {
  if (!content) return false;
  const length = content.trim().length;
  return length >= minLength && length <= maxLength;
};

/**
 * Check for malicious patterns dalam content
 */
export const hasMaliciousContent = (content: string): boolean => {
  if (!content) return false;

  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // event handlers
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];

  return maliciousPatterns.some((pattern) => pattern.test(content));
};

/**
 * Escape HTML untuk preview yang aman
 */
export const escapeHtml = (html: string): string => {
  if (!html) return "";

  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Validate user role
 */
export const isValidRole = (role: string): boolean => {
  const validRoles = ["user", "admin", "moderator"];
  return validRoles.includes(role);
};

/**
 * Check authorization untuk admin actions
 */
export const canPerformAdminAction = (userRole?: string): boolean => {
  return userRole === "admin";
};

/**
 * Check authorization untuk edit/delete own content
 */
export const canEditContent = (contentAuthorId: string, currentUserId?: string, userRole?: string): boolean => {
  if (!currentUserId) return false;
  return contentAuthorId === currentUserId || userRole === "admin";
};

/**
 * Sanitize code block untuk syntax highlighting
 */
export const sanitizeCodeBlock = (code: string): string => {
  if (!code) return "";

  // Encode special HTML characters tapi preserve code structure
  return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

/**
 * Validate programming language untuk code blocks
 */
export const isValidLanguage = (lang: string): boolean => {
  const validLanguages = ["javascript", "typescript", "python", "java", "cpp", "c", "csharp", "go", "rust", "php", "ruby", "swift", "kotlin", "html", "css", "sql", "bash", "shell", "json", "yaml", "markdown", "plaintext"];
  return validLanguages.includes(lang.toLowerCase());
};
