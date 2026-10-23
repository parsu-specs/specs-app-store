// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./authContext";
import type { User } from "../data/types";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  subscribeSession: vi.fn(),
  ensureUserProfile: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("../data/factory", () => ({
  getAuthRepo: () => mocks,
  getProfileRepo: () => mocks,
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

it("follows session changes, preserves profile on token refresh, and ignores stale restoration", async () => {
  let restore!: (user: User | null) => void;
  let notify!: (user: User | null) => void;
  mocks.getSession.mockReturnValue(new Promise((resolve) => (restore = resolve)));
  mocks.subscribeSession.mockImplementation((callback) => {
    notify = callback;
    return mocks.unsubscribe;
  });
  const user = { id: "u1", email: "member@example.com", name: "Member" };
  mocks.ensureUserProfile.mockResolvedValue({ ...user, role: "Builder", bio: "", color: "sky" });
  let auth!: ReturnType<typeof useAuth>;
  function Probe() {
    auth = useAuth();
    return null;
  }
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(AuthProvider, null, createElement(Probe))));
    await act(async () => notify(user));
    expect(auth.user).toEqual(user);
    expect(auth.loading).toBe(false);
    const profile = auth.profile;
    expect(profile?.role).toBe("Builder");

    await act(async () => notify({ ...user }));
    expect(auth.profile).toBe(profile);
    expect(mocks.ensureUserProfile).toHaveBeenCalledTimes(1);

    await act(async () => notify(null));
    expect(auth.user).toBeNull();
    expect(auth.profile).toBeNull();
    await act(async () => restore(user));
    expect(auth.user).toBeNull();
  } finally {
    await act(async () => root.unmount());
    localStorage.clear();
  }
  expect(mocks.unsubscribe).toHaveBeenCalledOnce();
});
