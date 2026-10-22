import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAuthRepo } from "./supabaseRepos";
import { getSupabase } from "./client";

vi.mock("./client", () => ({ getSupabase: vi.fn() }));

type SignUpResult = {
  data: {
    user: { id: string; email: string; identities: unknown[] } | null;
    session: object | null;
  };
  error: { message: string } | null;
};

// The signup flow pre-checks display-name availability against profiles.
function mockProfileNameLookup(profile: { id: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error: null });
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          limit: vi.fn(() => ({ maybeSingle })),
        })),
      })),
    })),
  };
}

function mockSignUp(result: SignUpResult) {
  vi.mocked(getSupabase).mockReturnValue({
    ...mockProfileNameLookup(null),
    auth: { signUp: vi.fn().mockResolvedValue(result) },
  } as never);
}

type MockUser = {
  identities?: { provider?: string }[];
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
};

function mockGetUser(user: MockUser | null, message = "Lookup failed") {
  vi.mocked(getSupabase).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue(
        user
          ? {
              data: {
                user: {
                  identities: user.identities ?? [],
                  app_metadata: user.appMetadata ?? {},
                  user_metadata: user.userMetadata ?? {},
                },
              },
              error: null,
            }
          : { data: { user: null }, error: { message } },
      ),
    },
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

describe("supabase signup display-name pre-check", () => {
  it("rejects a name owned by an existing profile before calling auth.signUp", async () => {
    const signUp = vi.fn();
    vi.mocked(getSupabase).mockReturnValue({
      ...mockProfileNameLookup({ id: "p1" }),
      auth: { signUp },
    } as never);
    await expect(createSupabaseAuthRepo().signup("Ann", "a@x.com", "secret1")).rejects.toThrow(
      "display name is already taken",
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it("surfaces a failed availability lookup instead of signing up blind", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            limit: vi.fn(() => ({ maybeSingle })),
          })),
        })),
      })),
      auth: { signUp: vi.fn() },
    } as never);
    await expect(createSupabaseAuthRepo().signup("Ann", "a@x.com", "secret1")).rejects.toThrow(
      "Could not check display name availability",
    );
  });
});

describe("supabase hasPassword", () => {
  it("is true with an email identity, false for Google-only", async () => {
    const auth = createSupabaseAuthRepo();
    mockGetUser({ identities: [{ provider: "email" }, { provider: "google" }] });
    await expect(auth.hasPassword()).resolves.toBe(true);
    mockGetUser({ identities: [{ provider: "google" }] });
    await expect(auth.hasPassword()).resolves.toBe(false);
    mockGetUser({ identities: [] });
    await expect(auth.hasPassword()).resolves.toBe(false);
  });

  it("honors the metadata flag for Google accounts that added a password", async () => {
    // GoTrue never creates an email identity when an OAuth user sets a
    // password, so updatePassword() writes user_metadata.has_password as the
    // durable signal — the banner must not resurface after a hard refresh.
    const auth = createSupabaseAuthRepo();
    mockGetUser({
      identities: [{ provider: "google" }],
      userMetadata: { has_password: true },
    });
    await expect(auth.hasPassword()).resolves.toBe(true);
    mockGetUser({ identities: [{ provider: "google" }], userMetadata: { name: "Ann" } });
    await expect(auth.hasPassword()).resolves.toBe(false);
  });

  it("treats a failed lookup as unknown, not as 'no password'", async () => {
    const auth = createSupabaseAuthRepo();
    mockGetUser(null, "Network unreachable");
    await expect(auth.hasPassword()).rejects.toThrow("Network unreachable");
  });
});

describe("supabase updatePassword", () => {
  it("stores the password and the has_password flag together", async () => {
    const updateUser = vi.fn().mockResolvedValue({ data: { user: {} }, error: null });
    const refreshSession = vi.fn().mockResolvedValue({});
    vi.mocked(getSupabase).mockReturnValue({ auth: { updateUser, refreshSession } } as never);
    await createSupabaseAuthRepo().updatePassword("secret1");
    expect(updateUser).toHaveBeenCalledWith({
      password: "secret1",
      data: { has_password: true },
    });
    expect(refreshSession).toHaveBeenCalled();
  });

  it("surfaces Supabase errors", async () => {
    const updateUser = vi
      .fn()
      .mockResolvedValue({ data: { user: null }, error: { message: "Weak password" } });
    vi.mocked(getSupabase).mockReturnValue({ auth: { updateUser } } as never);
    await expect(createSupabaseAuthRepo().updatePassword("secret1")).rejects.toThrow(
      "Weak password",
    );
  });

  it("rejects short passwords without touching Supabase", async () => {
    const updateUser = vi.fn();
    vi.mocked(getSupabase).mockReturnValue({ auth: { updateUser } } as never);
    await expect(createSupabaseAuthRepo().updatePassword("short")).rejects.toThrow("at least 6");
    expect(updateUser).not.toHaveBeenCalled();
  });
});
