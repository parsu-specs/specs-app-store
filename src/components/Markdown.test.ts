import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown, { sanitizeMarkdownUrl } from "./Markdown";

describe("Markdown rendering", () => {
  it("preserves GFM semantics and code language metadata with custom element renderers", () => {
    const text = [
      "# Documentation",
      "",
      "3. Third item",
      "4. Fourth item",
      "",
      "- [x] Finished",
      "- [ ] Pending",
      "",
      "| Feature | Status |",
      "| --- | --- |",
      "| Docs | Ready |",
      "",
      "```typescript",
      "const ready = true;",
      "```",
    ].join("\n");
    const html = renderToStaticMarkup(createElement(Markdown, { text, fullWidth: true }));

    expect(html).toMatch(/<h1[^>]*>Documentation<\/h1>/);
    expect(html).toMatch(/<ol[^>]*start="3"/);
    expect(html).toContain("contains-task-list");
    expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*disabled=""/);
    expect(html).toContain('checked=""');
    expect(html).toMatch(/<th[^>]*>Feature<\/th>/);
    expect(html).toMatch(/<td[^>]*>Ready<\/td>/);
    expect(html).toContain("language-typescript");
    expect(html).toContain("const ready = true;");
    expect(html).not.toContain("node=");
  });

  it("keeps unsafe links and raw HTML inert when rendering custom elements", () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {
        text: "[unsafe](javascript:alert%281%29) [safe](https://example.com)\n\n<script>alert(1)</script>",
      }),
    );

    expect(html).toMatch(/<a href="#"[^>]*>unsafe<\/a>/);
    expect(html).toMatch(/<a href="https:\/\/example.com"[^>]*>safe<\/a>/);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });
});

describe("sanitizeMarkdownUrl", () => {
  it("passes http, https, mailto, and relative targets through untouched", () => {
    expect(sanitizeMarkdownUrl("https://example.com/x")).toBe("https://example.com/x");
    expect(sanitizeMarkdownUrl("http://example.com")).toBe("http://example.com");
    expect(sanitizeMarkdownUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(sanitizeMarkdownUrl("/apps/123")).toBe("/apps/123");
    expect(sanitizeMarkdownUrl("#section")).toBe("#section");
    expect(sanitizeMarkdownUrl("docs/guide.md")).toBe("docs/guide.md");
  });

  it("neutralizes script-capable protocols (case-insensitive, padded)", () => {
    expect(sanitizeMarkdownUrl("javascript:alert(1)")).toBe("#");
    expect(sanitizeMarkdownUrl("JaVaScRiPt:alert(1)")).toBe("#");
    expect(sanitizeMarkdownUrl("  javascript:alert(1)")).toBe("#");
    expect(sanitizeMarkdownUrl("data:text/html,<script>alert(1)</script>")).toBe("#");
    expect(sanitizeMarkdownUrl("vbscript:msgbox(1)")).toBe("#");
  });

  it("handles missing targets", () => {
    expect(sanitizeMarkdownUrl(undefined)).toBe("#");
  });
});
