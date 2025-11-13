/**
 * Sanitizes a filename for safe storage in Firebase Storage
 * @param {string} name - The original filename
 * @returns {string} A sanitized filename
 */
export function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') {
    return 'file';
  }

  // Trim whitespace and convert to lowercase
  let sanitized = name.trim().toLowerCase();

  // Replace spaces with underscores
  sanitized = sanitized.replace(/\s+/g, '_');

  // Remove all characters except a-z, 0-9, dot, underscore, and hyphen
  sanitized = sanitized.replace(/[^a-z0-9._-]/g, '');

  // Remove multiple consecutive dots, underscores, or hyphens
  sanitized = sanitized.replace(/[._-]{2,}/g, '_');

  // Remove leading/trailing dots, underscores, or hyphens
  sanitized = sanitized.replace(/^[._-]+|[._-]+$/g, '');

  // If the result is empty or just an extension, return a default name
  if (!sanitized || sanitized.startsWith('.')) {
    return 'file';
  }

  return sanitized;
}