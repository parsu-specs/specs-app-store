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
