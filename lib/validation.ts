import { randomUUID } from 'crypto';

/**
 * Validate project name
 * Projects must be lowercase, kebab-case only
 */
export function isValidProjectName(name: string): boolean {
  // Only lowercase letters, numbers, and hyphens
  // Must start and end with a letter or number
  // No consecutive hyphens
  const pattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return pattern.test(name) && name.length >= 1 && name.length <= 63;
}

/**
 * Sanitize project name
 * Convert to lowercase, replace invalid chars with hyphens
 */
export function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a safe filename with UUID prefix to prevent collisions
 */
export function generateSafeFilename(originalFilename: string): string {
  const uuid = randomUUID();
  const sanitizedFilename = sanitizeFilename(originalFilename);
  return `${uuid}-${sanitizedFilename}`;
}

/**
 * Sanitize filename to remove potentially dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let safe = filename.replace(/\.\./g, '').replace(/[/\\]/g, '');

  // Remove null bytes and other control characters
  safe = safe.replace(/[\x00-\x1f\x7f]/g, '');

  // Replace spaces with underscores
  safe = safe.replace(/\s+/g, '_');

  // Only allow safe characters
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Ensure filename isn't empty
  if (!safe || safe === '.') {
    safe = 'unnamed';
  }

  // Limit length
  if (safe.length > 200) {
    const ext = getFileExtension(safe);
    const base = safe.substring(0, 200 - ext.length - 1);
    safe = ext ? `${base}.${ext}` : base;
  }

  return safe;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    return '';
  }
  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Validate content type
 * Returns true if the content type is allowed
 */
export function isAllowedContentType(contentType: string): boolean {
  // Block executable and script types
  const blockedTypes = [
    'application/x-executable',
    'application/x-msdos-program',
    'application/x-msdownload',
    'application/x-sh',
    'application/x-shellscript',
    'text/x-sh',
    'text/x-shellscript',
  ];

  // Block by extension pattern
  const blockedExtensions = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.scr'];

  const normalizedType = contentType.toLowerCase().split(';')[0].trim();

  if (blockedTypes.includes(normalizedType)) {
    return false;
  }

  return true;
}

/**
 * Get default content type based on file extension
 */
export function getContentType(filename: string): string {
  const ext = getFileExtension(filename);

  const contentTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Text
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    md: 'text/markdown',

    // Archives
    zip: 'application/zip',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    rar: 'application/vnd.rar',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',

    // Video
    mp4: 'video/mp4',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',

    // Fonts
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
  };

  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}
