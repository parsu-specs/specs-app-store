const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Elapsed time for feed posts; months and years use 30 and 365 days. */
export function formatRelativeAge(iso: string, nowMs: number = Date.now()): string | null {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return null;
  const age = Math.max(0, nowMs - timestamp);
  if (age < MINUTE_MS) return "Just now";

  const units = [
    [365 * DAY_MS, "year"],
    [30 * DAY_MS, "month"],
    [7 * DAY_MS, "week"],
    [DAY_MS, "day"],
    [HOUR_MS, "hour"],
    [MINUTE_MS, "minute"],
  ] as const;
  for (const [duration, unit] of units) {
    if (age >= duration) {
      const count = Math.floor(age / duration);
      return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
    }
  }
  return "Just now";
}

export type UploadStamp = {
  /** Visible label: relative (<24h) or calendar date (>=24h). */
  text: string;
  /** Full local date/time for tooltip + accessibility. */
  title: string;
  /** ISO value for <time dateTime>. */
  dateTime: string;
};

/**
 * Format a project upload timestamp.
 *
 * - age < 1m  -> "Just now"
 * - age < 1h  -> "Xm ago"
 * - age < 24h -> "Xh ago"
 * - age >= 24h -> "Sep 20, 2026"
 *
 * Future timestamps (clock skew) clamp to "Just now".
 * Invalid input returns null so callers render nothing.
 */
export function formatUploadStamp(iso: string, nowMs: number = Date.now()): UploadStamp | null {
  if (typeof iso !== "string" || !iso.trim()) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const date = new Date(t);
  const title = date.toLocaleString();
  let dateTime = iso;
  try {
    dateTime = date.toISOString();
  } catch {
    dateTime = iso;
  }

  const diffMs = Math.max(0, nowMs - t);
  if (diffMs < MINUTE_MS) return { text: "Just now", title, dateTime };
  if (diffMs < HOUR_MS) {
    const m = Math.floor(diffMs / MINUTE_MS);
    return { text: `${m}m ago`, title, dateTime };
  }
  if (diffMs < DAY_MS) {
    const h = Math.floor(diffMs / HOUR_MS);
    return { text: `${h}h ago`, title, dateTime };
  }
  const text = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { text, title, dateTime };
}

/**
 * Countdown label for a pause in whole seconds: "4:32", "0:07".
 * Non-positive or non-finite input renders "0:00".
 */
export function formatCountdown(totalSeconds: number): string {
  const safe =
    typeof totalSeconds === "number" && Number.isFinite(totalSeconds)
      ? Math.max(0, Math.ceil(totalSeconds))
      : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
