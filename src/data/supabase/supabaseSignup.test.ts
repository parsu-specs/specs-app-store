import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAuthRepo } from "./supabaseRepos";
import { getSupabase } from "./client";

vi.mock("./client", () => ({ getSupabase: vi.fn() }));

type SignUpResult = {
  data: { user: { id: string; email: string; identities: unknown[] } | null; session: object | null };
  error: { message: string } | null;
};

function mockSignUp(result: SignUpResult) {
  vi.mocked(getSupabase).mockReturnValue({
    auth: { signUp: vi.fn().mockResolvedValue(result) },
  } as never);
}

function mockGetUser(identities: { provider?: string }[]) {
  vi.mocked(getSupabase).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { identities } } }) },
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("supabase signup duplicate detection", () => {
  it("rejects an already-registered email instead of fake success", async () => {
    // Supabase anti-enumeration shape: obfuscated user, zero identities.
    mockSignUp({
      data: {
        user: { id: "u1", email: "a@x.com", identities: [] },
        session: null,
      },
      error: null,
    });
    await expect(createSupabaseAuthRepo().signup("Ann", "a@x.com", "secret1")).rejects.toThrow(
      "already exists",
    );
  });

  it("maps duplicate error text to the friendly message", async () => {
    mockSignUp({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    await expect(createSupabaseAuthRepo().signup("Ann", "a@x.com", "secret1")).rejects.toThrow(
      "Try signing in instead",
    );
  });

  it("still succeeds for genuinely new accounts", async () => {
    mockSignUp({
      data: {
        user: { id: "u9", email: "new@x.com", identities: [{ id: "i1" }] },
        session: { access_token: "t" },
      },
      error: null,
    });
    const user = await createSupabaseAuthRepo().signup("New", "new@x.com", "secret1");
    expect(user.id).toBe("u9");
  });
});

describe("supabase hasPassword", () => {
  it("is true with an email identity, false for Google-only", async () => {
    const auth = createSupabaseAuthRepo();
    mockGetUser([{ provider: "email" }, { provider: "google" }]);
    await expect(auth.hasPassword()).resolves.toBe(true);
    mockGetUser([{ provider: "google" }]);
    await expect(auth.hasPassword()).resolves.toBe(false);
    mockGetUser([]);
    await expect(auth.hasPassword()).resolves.toBe(false);
  });
});
