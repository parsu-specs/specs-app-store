import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalAuthRepo } from "./localAuth";

const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
});
vi.stubGlobal("window", { setTimeout: setTimeout.bind(globalThis) });

beforeEach(() => {
  store.clear();
});

describe("duplicate emails", () => {
  it("rejects a manual signup reusing an existing email", async () => {
    const auth = createLocalAuthRepo();
    await auth.signup("Ann", "ann@example.com", "secret123");
    await expect(auth.signup("Someone Else", "ann@example.com", "secret123")).rejects.toThrow(
      "That email is already registered. Sign in instead.",
    );
    // Case-insensitive: same address, different casing.
    await expect(auth.signup("Someone Else", "ANN@example.com", "secret123")).rejects.toThrow(
      "That email is already registered. Sign in instead.",
    );
  });

  it("rejects a manual signup reusing a Google-linked email", async () => {
    const auth = createLocalAuthRepo();
    await auth.signinWithGoogleAccount({
      sub: "g-1",
      email: "mia@example.com",
      name: "Mia",
      emailVerified: true,
    });
    await expect(auth.signup("Mia Clone", "mia@example.com", "secret123")).rejects.toThrow(
      "That email is already registered. Sign in instead.",
    );
  });

  it("still signs the original owner in after a duplicate attempt", async () => {
    const auth = createLocalAuthRepo();
    const created = await auth.signup("Ann", "ann@example.com", "secret123");
    await expect(auth.signup("Intruder", "ann@example.com", "different1")).rejects.toThrow(
      "already registered",
    );
    const session = await auth.signin("ann@example.com", "secret123");
    expect(session).toMatchObject({ id: created.id, email: "ann@example.com", name: "Ann" });
  });
});

describe("duplicate display names", () => {
  it("rejects a signup name already owned by a seed profile, case-insensitively", async () => {
    const auth = createLocalAuthRepo();
    await expect(auth.signup("Mia Santos", "new1@example.com", "secret123")).rejects.toThrow(
      "That display name is already taken. Try another.",
    );
    await expect(auth.signup("MIA SANTOS", "new2@example.com", "secret123")).rejects.toThrow(
      "That display name is already taken. Try another.",
    );
  });

  it("rejects a name taken by an earlier signup before its profile row exists", async () => {
    const auth = createLocalAuthRepo();
    await auth.signup("Ann Lee", "ann@example.com", "secret123");
    await expect(auth.signup("Ann Lee", "other@example.com", "secret123")).rejects.toThrow(
      "That display name is already taken. Try another.",
    );
  });

  it("rejects a name taken by a Google user, and still creates fresh names", async () => {
    const auth = createLocalAuthRepo();
    await auth.signinWithGoogleAccount({
      sub: "g-9",
      email: "nia@example.com",
      name: "Nia Nguyen",
      emailVerified: true,
    });
    await expect(auth.signup("Nia Nguyen", "x@example.com", "secret123")).rejects.toThrow(
      "That display name is already taken. Try another.",
    );
    const user = await auth.signup("Brand New Name", "fresh@example.com", "secret123");
    expect(user.name).toBe("Brand New Name");
  });
});

describe("password recovery", () => {
  it("sets a new password for the signed-in email account", async () => {
    const auth = createLocalAuthRepo();
    await auth.signup("Ann", "ann@example.com", "secret123");
    await auth.updatePassword("newsecret1");
    const session = await auth.signin("ann@example.com", "newsecret1");
    expect(session.email).toBe("ann@example.com");
    await expect(auth.signin("ann@example.com", "secret123")).rejects.toThrow();
  });

  it("rejects short passwords and demo reset emails", async () => {
    const auth = createLocalAuthRepo();
    await auth.signup("Ann", "ann@example.com", "secret123");
    await expect(auth.updatePassword("short")).rejects.toThrow("at least 6");
    await expect(auth.requestPasswordReset("ann@example.com")).rejects.toThrow("local demo");
  });
});

describe("local hasPassword", () => {
  it("is true for email accounts, false for Google-linked or signed-out", async () => {
    const auth = createLocalAuthRepo();
    await auth.signup("Ann", "ann@example.com", "secret123");
    await expect(auth.hasPassword()).resolves.toBe(true);
    await auth.signinWithGoogleAccount({
      sub: "google-1",
      email: "mia@example.com",
      name: "Mia",
      emailVerified: true,
    });
    await expect(auth.hasPassword()).resolves.toBe(false);
  });
});
