import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalProfileRepo } from "./localProfiles";

const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
});
vi.stubGlobal("window", {
  setTimeout: (fn: (...args: unknown[]) => void, ms?: number) => setTimeout(fn, ms),
});

beforeEach(() => {
  store.clear();
});

describe("updateProfile name guard", () => {
  it("palette-only saves succeed despite a same-named duplicate row", async () => {
    const repo = createLocalProfileRepo();
    const all = await repo.listProfiles();
    const [a] = all;
    // Forge the duplicate-row situation (Google-linking orphans): two rows,
    // one display name. Old code rejected EVERY save with "already taken".
    const raw = JSON.parse(store.get("cc.profiles.v1") as string) as Array<
      Record<string, unknown>
    >;
    const dup = { ...raw[1], id: "dup-1", name: (raw[0] as { name: string }).name };
    store.set("cc.profiles.v1", JSON.stringify([...raw, dup]));
    const updated = await repo.updateProfile(a.id, { palette: "ocean" }, a.id);
    expect(updated.palette).toBe("ocean");
  });

  it("renames to a taken name still fail", async () => {
    const repo = createLocalProfileRepo();
    const all = await repo.listProfiles();
    const [a, b] = all;
    await expect(repo.updateProfile(a.id, { name: b.name }, a.id)).rejects.toThrow(
      "already taken",
    );
  });

  it("creating a profile with a taken name fails", async () => {
    const repo = createLocalProfileRepo();
    const all = await repo.listProfiles();
    const [a] = all;
    await expect(
      repo.ensureUserProfile({ id: "brand-new", email: "n@x.com", name: a.name }),
    ).rejects.toThrow("already taken");
  });
});
