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

/**
 * Room codes, as guardian actually issues them.
 *
 * generateUniqueRoomId in guardian/src/services/room.service.ts builds them with
 * `customAlphabet(alphabet, 5)`, so a real code is ALWAYS exactly 5 characters drawn from
 * this set. Keep both constants in step with that function — they are a copy of a rule
 * that lives on the server, and the server stays the authority: passing these checks only
 * means a code is well-formed, never that the room exists.
 *
 * The alphabet is 32 characters, not 36: I, O, 0 and 1 are left out on purpose, because
 * they are the glyphs people confuse when reading a code off someone else's screen. A
 * character outside this set therefore cannot appear in any real code, which is what makes
 * it safe for the input to drop it rather than send a request that can only fail.
 */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const ROOM_CODE_LENGTH = 5;

const ROOM_CODE_DISALLOWED = new RegExp(`[^${ROOM_CODE_ALPHABET}]`, "g");
const ROOM_CODE_SEPARATOR = new RegExp(`[^${ROOM_CODE_ALPHABET}]+`, "g");

/**
 * Turns whatever was typed or pasted into the closest thing to a real code.
 *
 * Uppercases first, so typing lowercase is helped rather than blocked. What happens next
 * depends on whether the input looks like a code or like a message containing one:
 *
 *   1. A standalone run of exactly ROOM_CODE_LENGTH valid characters wins. People paste
 *      whole messages — "code: A8X2D" — and simply deleting the invalid characters would
 *      squash that into CDEA8: five legal characters that look like a code, enable the
 *      button, and cannot possibly match a room. Preferring the intact run finds the real
 *      code inside the sentence instead.
 *   2. Otherwise every usable character is kept in order and the length capped. That is
 *      the ordinary case — someone typing, or a code written out with spaces or dashes
 *      between the characters.
 */
export function sanitizeRoomCode(raw: string): string {
  const upper = raw.toUpperCase();

  const wholeCode = upper
    .split(ROOM_CODE_SEPARATOR)
    .find((run) => run.length === ROOM_CODE_LENGTH);
  if (wholeCode) return wholeCode;

  return upper.replace(ROOM_CODE_DISALLOWED, "").slice(0, ROOM_CODE_LENGTH);
}

/** Whether a sanitized code is long enough to be worth sending to the server. */
export function isCompleteRoomCode(code: string): boolean {
  return code.length === ROOM_CODE_LENGTH;
}
