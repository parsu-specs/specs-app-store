// @vitest-environment jsdom
// Regression: Turnstile's api.js may only execute once per page — a second
// copy logs "[Cloudflare Turnstile] Turnstile already has been loaded. Was
// Turnstile imported multiple times?". This app triggered it because the
// component's load effect re-ran while the first script was still
// downloading (window.turnstile not set yet): React StrictMode double-mounts
// effects in development, and the login form remounts the widget via `key`
// after every submit. The module-level shared loader must guarantee exactly
// one <script> per page across any sequence of mounts and remounts.
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Options = Record<string, unknown>;

const SCRIPT_SELECTOR = 'script[src*="challenges.cloudflare.com"]';

let onToken: Mock<(token: string | null) => void>;
let onUnavailable: Mock<(message: string) => void>;
let options: Options;
let renderCount: number;
let removed: string[];
let roots: { unmount: () => void }[];
let act: (fn: () => void | Promise<void>) => Promise<unknown>;

async function mountWidget() {
  // Same dynamic-import instance as the component under test (the registry
  // is only reset between tests), so hooks share one React runtime.
  const { default: Turnstile } = await import("./Turnstile");
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(React.createElement(Turnstile, { siteKey: "0x4TEST", onToken, onUnavailable }));
  });
}

function stubTurnstileApi() {
  vi.stubGlobal("turnstile", {
    render: (_el: HTMLElement, o: Options) => {
      options = o;
      renderCount += 1;
      return `w-${renderCount}`;
    },
    remove: (id: string) => removed.push(id),
  });
}

beforeEach(async () => {
  // Fresh module registry: Turnstile's script-loader state is module-level,
  // and each test needs a clean slate (no test-only exports in production).
  vi.resetModules();
  onToken = vi.fn();
  onUnavailable = vi.fn();
  options = {};
  renderCount = 0;
  removed = [];
  roots = [];
  ({ act } = await import("react"));
});

afterEach(async () => {
  for (const root of roots) {
    await act(async () => {
      root.unmount();
    });
  }
  roots = [];
  vi.unstubAllGlobals();
  document.head.querySelectorAll(SCRIPT_SELECTOR).forEach((s) => s.remove());
  document.body.innerHTML = "";
});

describe("Turnstile script loader", () => {
  it("appends the Cloudflare script exactly once across a StrictMode-style double mount", async () => {
    await mountWidget();
    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1);

    await act(async () => {
      roots[0].unmount();
    });
    await mountWidget(); // window.turnstile still unset: same in-flight load
    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1);
  });

  it("renders once api.js is loaded, wires callbacks, and remounts without a second script", async () => {
    await mountWidget();
    stubTurnstileApi();
    const script = document.querySelector(SCRIPT_SELECTOR) as HTMLScriptElement;
    await act(async () => {
      script.onload?.(new Event("load"));
    });
    expect(renderCount).toBe(1);
    expect(options.sitekey).toBe("0x4TEST");

    (options.callback as (t: string) => void)("tok-1");
    expect(onToken).toHaveBeenCalledWith("tok-1");
    (options["expired-callback"] as () => void)();
    expect(onToken).toHaveBeenCalledWith(null);
    (options["error-callback"] as () => void)();
    expect(onToken).toHaveBeenCalledWith(null);

    await act(async () => {
      roots[0].unmount();
    });
    expect(removed).toEqual(["w-1"]);

    await mountWidget(); // api present now: direct render, no script append
    expect(renderCount).toBe(2);
    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1);
  });

  it("reports a failed script load, drops the dead tag, and lets the next mount retry", async () => {
    await mountWidget();
    const script = document.querySelector(SCRIPT_SELECTOR) as HTMLScriptElement;
    await act(async () => {
      script.onerror?.(new Event("error"));
    });
    expect(onUnavailable).toHaveBeenCalledWith(
      "Human check failed to load. Check your connection and reload the page.",
    );
    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(0);

    await act(async () => {
      roots[0].unmount();
    });
    await mountWidget(); // loader was reset on failure: a fresh attempt
    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1);
  });
});
