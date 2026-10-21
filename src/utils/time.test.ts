import { describe, expect, it } from "vitest";
import { formatCountdown, formatMilestoneAge, formatUploadStamp } from "./time";

const NOW = Date.parse("2026-10-07T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("formatMilestoneAge", () => {
  it.each([
    [0, "Just now"],
    [-60_000, "Just now"],
    [59_999, "Just now"],
    [60_000, "1 minute ago"],
    [120_000, "2 minutes ago"],
    [3_600_000, "1 hour ago"],
    [7_200_000, "2 hours ago"],
    [86_400_000, "1 day ago"],
    [6 * 86_400_000, "6 days ago"],
    [7 * 86_400_000, "1 week ago"],
    [29 * 86_400_000, "4 weeks ago"],
    [30 * 86_400_000, "1 month ago"],
    [60 * 86_400_000, "2 months ago"],
    [365 * 86_400_000, "1 year ago"],
    [730 * 86_400_000, "2 years ago"],
  ])("formats %i milliseconds as %s", (age, expected) => {
    expect(formatMilestoneAge(ago(age), NOW)).toBe(expected);
  });

  it("omits invalid timestamps", () => {
    expect(formatMilestoneAge("", NOW)).toBeNull();
    expect(formatMilestoneAge("not-a-date", NOW)).toBeNull();
  });
});

describe("formatUploadStamp", () => {
  it("says Just now under a minute (and clamps future skew)", () => {
    expect(formatUploadStamp(ago(30_000), NOW)?.text).toBe("Just now");
    expect(formatUploadStamp(ago(-60_000), NOW)?.text).toBe("Just now");
  });

  it("shows minutes then hours under 24h", () => {
    expect(formatUploadStamp(ago(5 * 60_000), NOW)?.text).toBe("5m ago");
    expect(formatUploadStamp(ago(3 * 3_600_000), NOW)?.text).toBe("3h ago");
    expect(formatUploadStamp(ago(23 * 3_600_000), NOW)?.text).toBe("23h ago");
  });

  it("shows the calendar date at and past 24h", () => {
    expect(formatUploadStamp(ago(25 * 3_600_000), NOW)?.text).toBe("Oct 6, 2026");
  });

  it("returns null for missing or invalid input", () => {
    expect(formatUploadStamp("", NOW)).toBeNull();
    expect(formatUploadStamp("not-a-date", NOW)).toBeNull();
  });

  it("always carries tooltip + machine-readable time", () => {
    const stamp = formatUploadStamp(ago(5 * 60_000), NOW);
    expect(stamp?.title).toBeTruthy();
    expect(stamp?.dateTime).toBeTruthy();
  });
});

describe("formatCountdown", () => {
  it("renders m:ss with zero-padded seconds", () => {
    expect(formatCountdown(272)).toBe("4:32");
    expect(formatCountdown(7)).toBe("0:07");
    expect(formatCountdown(60)).toBe("1:00");
  });

  it("clamps bad input to 0:00 and rounds up partial seconds", () => {
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(-5)).toBe("0:00");
    expect(formatCountdown(Number.NaN)).toBe("0:00");
    expect(formatCountdown(4.2)).toBe("0:05");
  });
});
