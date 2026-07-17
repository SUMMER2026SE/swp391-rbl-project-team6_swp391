/**
 * Normalizes an ISO-8601 timestamp to a format JavaScript Date can parse.
 *
 * Handles these input formats:
 *
 * 1. ISO-8601 string with 1-9 fractional digits:
 *    "2026-07-17T07:40:54.141517Z" (6 digits = microseconds)
 *    "2026-07-17T07:40:54.141Z"     (3 digits = milliseconds)
 *    "2026-07-17T07:40:54.1Z"        (1 digit)
 *    JavaScript Date can only parse up to 3 digits, so we truncate to ms.
 *
 * 2. ISO-8601 string with no fractional seconds:
 *    "2026-07-17T07:40:54Z"
 *    JavaScript parses it directly.
 *
 * 3. Raw epoch milliseconds (number as string): "1752733254141517" or "1752733254141"
 *    Can occur if Jackson serializes Instant as a number instead of a string.
 *    JavaScript Date(number) handles up to ~ms precision safely.
 *
 * 4. Raw epoch milliseconds (number): 1752733254141
 *    Same as above but passed as a raw number.
 *
 * 5. Malformed/garbage strings: "null", "undefined", or any non-date string.
 *    Returns "" so callers can fall back gracefully.
 *
 * Returns "" (empty string) for: null, undefined, "", "null", "undefined",
 * any value that new Date() cannot parse, or a number that produces NaN.
 *
 * Examples:
 *   "2026-07-17T07:40:54.141517Z" → "2026-07-17T07:40:54.141Z"
 *   "2026-07-17T07:40:54.141Z"     → "2026-07-17T07:40:54.141Z" (no-op)
 *   "2026-07-17T07:40:54.1Z"        → "2026-07-17T07:40:54.100Z" (truncated)
 *   "1752733254141"                 → "2026-07-17T07:40:54.141Z" (epoch ms → ISO)
 *   "1752733254141517"              → "2026-07-17T07:40:54.141Z" (epoch μs → ISO)
 *   1752733254141                   → "2026-07-17T07:40:54.141Z" (number → ISO)
 *   null / undefined / "" / "null"  → "" (caller should guard this)
 */
export function normalizeTimestamp(isoString: unknown): string {
  // Guard: handle null, undefined, empty
  if (isoString === null || isoString === undefined || isoString === "") {
    return "";
  }

  // If it's already a number (epoch milliseconds from Jackson timestamp mode),
  // convert it to ISO string directly. JavaScript Date accepts epoch ms.
  if (typeof isoString === "number") {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? "" : date.toISOString();
  }

  // If it's not a string at this point, bail out
  if (typeof isoString !== "string") {
    return "";
  }

  const trimmed = isoString.trim();

  // Guard against garbage strings like "null", "undefined", etc.
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return "";
  }

  // Case 1: Looks like a pure number (epoch ms/μs as string)
  // e.g. "1752733254141517" (13 digits = μs) or "1752733254141" (13 digits = ms)
  // or "1752733254" (10 digits = seconds)
  // These are too large to be a normal date string and contain no alpha chars.
  if (/^\d{10,16}$/.test(trimmed)) {
    let ms: number;
    if (trimmed.length === 10) {
      // 10-digit = epoch seconds → convert to milliseconds
      ms = parseInt(trimmed, 10) * 1000;
    } else if (trimmed.length === 13) {
      // 13-digit = epoch milliseconds
      ms = parseInt(trimmed, 10);
    } else {
      // Anything else (e.g. microseconds "1752733254141517") → treat as ms
      ms = parseInt(trimmed, 10);
    }
    const date = new Date(ms);
    return isNaN(date.getTime()) ? "" : date.toISOString();
  }

  // Case 2: ISO string with fractional seconds (1-9 digits after decimal)
  // e.g. "2026-07-17T07:40:54.141517Z" (6 digits = microseconds)
  //      "2026-07-17T07:40:54.141Z"     (3 digits = milliseconds)
  //      "2026-07-17T07:40:54.1Z"        (1 digit)
  // JavaScript Date can only parse up to 3 fractional digits (milliseconds).
  // We normalize all cases to exactly 3 digits.
  const fractionalNormalized = trimmed.replace(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.)(\d{1,9})(Z)$/,
    (_match, prefix, fraction, suffix) => {
      // Truncate or pad fractional seconds to exactly 3 digits (ms)
      const ms = fraction.slice(0, 3).padEnd(3, "0");
      return `${prefix}${ms}${suffix}`;
    },
  );

  // Validate the result is actually a parseable ISO string — guard against
  // malformed timestamps that pass the regex but produce Invalid Date.
  const testDate = new Date(fractionalNormalized);
  if (isNaN(testDate.getTime())) {
    return "";
  }

  // Case 3: Standard ISO string (already no fractional seconds)
  // JavaScript Date can parse these directly.
  return fractionalNormalized;
}

/**
 * Format a normalized timestamp into a short date string (e.g. "Jul 17, 2026").
 * Returns "" for missing/invalid timestamps so the caller can render an
 * empty cell without surfacing "Invalid Date".
 */
export function formatNotificationDate(isoString: unknown): string {
  const normalized = normalizeTimestamp(isoString);
  if (!normalized) return "";
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a normalized timestamp into a 24h-style time string (e.g. "14:35").
 * Returns "" for missing/invalid timestamps.
 */
export function formatNotificationTime(isoString: unknown): string {
  const normalized = normalizeTimestamp(isoString);
  if (!normalized) return "";
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Formats an ISO-8601 timestamp into a human-friendly relative string.
 * Use this instead of notification.createdAt to display times so that
 * a notification sent today is never shown as "1 day ago" even if its
 * Draft was created yesterday.
 *
 * Accepts any value that normalizeTimestamp() can handle:
 * - ISO string: "2026-07-17T07:40:54.141Z"
 * - ISO string with microseconds: "2026-07-17T07:40:54.141517Z"
 * - Epoch milliseconds as string: "1752733254141"
 * - Epoch milliseconds as number: 1752733254141
 *
 * If the timestamp cannot be parsed (malformed or empty), returns "Recently"
 * instead of "Invalid Date" to avoid a broken UI state.
 */
export function relativeTime(isoString: unknown): string {
  const normalized = normalizeTimestamp(isoString);
  const date = new Date(normalized);

  // Defensive: if the date is still invalid, return a safe fallback instead
  // of exposing "Invalid Date" to the user.
  if (isNaN(date.getTime())) {
    return "Recently";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return diffMins + "m ago";
  if (diffHours < 24) return diffHours + "h ago";
  if (diffDays < 7) return diffDays + "d ago";
  return date.toLocaleDateString();
}
