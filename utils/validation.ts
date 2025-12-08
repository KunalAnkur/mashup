// ============================================
// FILE: utils/validation.ts
// Validation utilities for frontend
// ============================================

/**
 * Validate username format
 * Rules:
 * - No spaces
 * - Only alphanumeric characters and underscores
 * - Minimum 3 characters
 * - Maximum 30 characters
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== "string") {
    return { valid: false, error: "Username is required" };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters long" };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: "Username must be at most 30 characters long" };
  }

  // Check for spaces
  if (/\s/.test(trimmed)) {
    return { valid: false, error: "Username cannot contain spaces" };
  }

  // Only allow alphanumeric characters and underscores
  // This regex allows: letters (a-z, A-Z), numbers (0-9), and underscores (_)
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { 
      valid: false, 
      error: "Username can only contain letters, numbers, and underscores. Special characters are not allowed." 
    };
  }

  return { valid: true };
}

