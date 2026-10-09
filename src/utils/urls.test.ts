import { describe, expect, it } from "vitest";
import { isSafeHttpUrl, isSafeImageUrl } from "./urls";

describe("isSafeHttpUrl", () => {
  it("allows http and https links", () => {
    expect(isSafeHttpUrl("https://example.com/app")).toBe(true);
    expect(isSafeHttpUrl("http://localhost:3000/discover")).toBe(true);
  });

  it("blocks script and data payloads", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeHttpUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("blocks empty and relative values", () => {
    expect(isSafeHttpUrl("")).toBe(false);
    expect(isSafeHttpUrl(undefined)).toBe(false);
    expect(isSafeHttpUrl("/discover")).toBe(false);
  });
});

describe("isSafeImageUrl", () => {
  it("allows https links and small canvas data URLs", () => {
    expect(isSafeImageUrl("https://example.com/photo.jpg")).toBe(true);
    expect(isSafeImageUrl("data:image/jpeg;base64,/9j/")).toBe(true);
  });

  it("blocks oversized data URLs and dangerous protocols", () => {
    expect(isSafeImageUrl(`data:image/jpeg;base64,${"a".repeat(500_001)}`)).toBe(false);
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeImageUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });
});
