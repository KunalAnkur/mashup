export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  const maybeError = error as {
    data?: { message?: unknown };
    message?: unknown;
  };

  if (typeof maybeError.data?.message === "string") {
    return maybeError.data.message;
  }

  if (typeof maybeError.message === "string") {
    return maybeError.message;
  }

  return fallback;
}
