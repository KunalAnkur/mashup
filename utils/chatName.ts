const GENERIC_NAME_VALUES = new Set([
  "",
  "user",
  "unknown user",
  "unknown",
  "guest",
  "anonymous",
]);

const SOCKET_FALLBACK_PATTERN = /^(user|guest)[-_ ]?[a-z0-9]{6,}$/i;

export const isGenericName = (name?: string | null): boolean => {
  if (!name) return true;

  const normalized = name.trim().toLowerCase();
  if (GENERIC_NAME_VALUES.has(normalized)) return true;

  if (SOCKET_FALLBACK_PATTERN.test(normalized) && /\d/.test(normalized)) {
    return true;
  }

  return false;
};

export const getEmailPrefix = (email?: string | null): string => {
  if (!email) return "";
  return email.split("@")[0]?.trim() || "";
};

export const resolveDisplayName = (
  candidates: Array<string | null | undefined>,
  fallback = "User"
): string => {
  for (const candidate of candidates) {
    const trimmed = (candidate ?? "").trim();
    if (!isGenericName(trimmed)) return trimmed;
  }
  return fallback;
};
