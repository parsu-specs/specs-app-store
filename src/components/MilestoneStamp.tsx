import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { formatMilestoneAge } from "../utils/time";
import { Button } from "./Button";

const FeedTimeContext = createContext<number | null>(null);

/** One clock for the feed; only timestamp consumers update on each tick. */
export function MilestoneTimeProvider({ children }: { children: ReactNode }) {
  const parentNow = useContext(FeedTimeContext);
  const hasParentClock = parentNow !== null;
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (hasParentClock) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const syncVisibility = () => {
      clearInterval(timer);
      timer = undefined;
      if (document.visibilityState === "hidden") return;
      setNow(Date.now());
      timer = setInterval(() => setNow(Date.now()), 60_000);
    };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, [hasParentClock]);

  return <FeedTimeContext.Provider value={parentNow ?? now}>{children}</FeedTimeContext.Provider>;
}

export default function MilestoneStamp({
  createdAt,
  subject = "milestone",
}: {
  createdAt: string;
  subject?: string;
}) {
  const now = useContext(FeedTimeContext);
  const [showExact, setShowExact] = useState(false);
  const exact = useMemo(() => {
    const date = new Date(createdAt);
    return Number.isFinite(date.getTime())
      ? { text: date.toLocaleString(), iso: date.toISOString() }
      : null;
  }, [createdAt]);
  const relative = formatMilestoneAge(createdAt, now ?? Date.now());
  if (!exact || !relative) return null;

  return (
    <Button
      type="button"
      variant="text"
      className="cursor-pointer text-left text-xs font-bold text-muted"
      onClick={() => setShowExact((value) => !value)}
      aria-pressed={showExact}
      aria-label={
        showExact
          ? `Show relative time for this ${subject}`
          : `Show exact date and time for this ${subject}: ${exact.text}`
      }
      title={
        showExact ? "Click to show relative time" : `${exact.text} — click to show date and time`
      }
    >
      <time dateTime={exact.iso}>{showExact ? exact.text : relative}</time>
    </Button>
  );
}
