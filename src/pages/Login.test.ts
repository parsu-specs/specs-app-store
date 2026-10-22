// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";

// The repo .env configures Turnstile/Google/Supabase. Stub them BEFORE the
// Login module evaluates its module-level consts so the form renders in the
// plain local mode these tests exercise.
vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");
vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
vi.stubEnv("VITE_DATA_SOURCE", "local");

const { default: Login } = await import("./Login");
const { ROUTES } = await import("./routes");

const signup = vi.hoisted(() => vi.fn());
const lookup = vi.hoisted(() => vi.fn());
vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    signin: vi.fn(),
    signup,
    signinWithGoogleAccount: vi.fn(),
  }),
}));
vi.mock("../data/factory", () => ({
  getAuthRepo: () => ({}),
  getProfileRepo: () => ({ getProfileByName: lookup }),
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let cleanup = () => {};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  window.history.replaceState({}, "", ROUTES.signin);
});

function setInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function renderLogin() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  act(() => root.render(createElement(Login)));
  // Switch to the "Create account" tab.
  const tabs = Array.from(
    container.querySelectorAll('button[role="tab"]'),
  ) as HTMLElement[];
  act(() => {
    tabs.find((b) => b.textContent === "Create account")!.click();
  });
  const name = container.querySelector('input[autocomplete="nickname"]') as HTMLInputElement;
  const email = container.querySelector('input[type="email"]') as HTMLInputElement;
  const password = container.querySelector('input[type="password"]') as HTMLInputElement;
  const submit = () => container.querySelector('button[type="submit"]') as HTMLButtonElement;
  return { container, name, email, password, submit };
}

it("flags a taken display name and blocks account creation", async () => {
  vi.useFakeTimers();
  const { container, name, email, password, submit } = renderLogin();
  lookup.mockResolvedValueOnce({ id: "someone-else" });
  setInput(name, "Mia Santos");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
  // The live flag from the availability checker is visible.
  expect(container.textContent).toContain("That display name is already taken.");
  setInput(email, "newbie@example.com");
  setInput(password, "secret123");
  expect(submit().disabled).toBe(true);
  expect(signup).not.toHaveBeenCalled();
});

it("reports the wait when submitting while the name check is still running", async () => {
  vi.useFakeTimers();
  const { container, name, email, password } = renderLogin();
  let resolveLookup!: (value: unknown) => void;
  lookup.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveLookup = resolve;
      }),
  );
  setInput(name, "Mia Santos");
  setInput(email, "newbie@example.com");
  setInput(password, "secret123");
  // Still "checking": submitting through the form reports the wait.
  const form = container.querySelector("form")!;
  await act(async () => {
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(container.textContent).toContain("Checking display name availability");
  expect(signup).not.toHaveBeenCalled();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
    resolveLookup({ id: "someone-else" });
  });
  expect(container.textContent).toContain("already taken");
  expect(signup).not.toHaveBeenCalled();
});

it("creates the account once a fresh display name is available", async () => {
  vi.useFakeTimers();
  const { name, email, password, submit } = renderLogin();
  lookup.mockResolvedValueOnce(null);
  setInput(name, "Fresh Name");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
  setInput(email, "fresh@example.com");
  setInput(password, "secret123");
  signup.mockResolvedValueOnce(null);
  await act(async () => {
    submit().click();
  });
  expect(signup).toHaveBeenCalledExactlyOnceWith(
    "Fresh Name",
    "fresh@example.com",
    "secret123",
    undefined,
  );
});
