import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAppRepo } from "./supabaseRepos";
import { getSupabase } from "./client";

vi.mock("./client", () => ({ getSupabase: vi.fn() }));

const appRow = {
  id: "a1",
  title: "Trail Buddy",
  description: "Plan hikes with friends.",
  creator: "Ann",
  creator_id: "u1",
  category: "Productivity",
  votes: 7,
  color: "mint",
  url: null,
  repo_url: null,
  screenshots: [],
  docs: null,
  collaborators: [],
  created_at: "2026-01-01T00:00:00Z",
};

/**
 * Wires the mocked Supabase client for one toggleVote call: the RPC payload
 * plus the getApp follow-up (apps row, auth lookup, viewer votes, comments).
 */
function mockToggleVote(payload: unknown) {
  const rpc = vi.fn().mockResolvedValue({ data: payload, error: null });
  const from = vi.fn((table: string) => {
    if (table === "apps")
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: appRow, error: null }),
          })),
        })),
      };
    if (table === "app_votes")
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({ data: [{ app_id: appRow.id }] }),
          })),
        })),
      };
    return {
      select: vi.fn(() => ({
        in: vi.fn().mockResolvedValue({ data: [] }),
      })),
    };
  });
  const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } });
  vi.mocked(getSupabase).mockReturnValue({ auth: { getUser }, rpc, from } as never);
  return rpc;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("supabase toggleVote spam-guard mapping", () => {
  it("surfaces pauseStarted and pausedSeconds when the guard trips", async () => {
    mockToggleVote({
      row: { ...appRow, votes: 7 },
      liked: false,
      pause_started: true,
      paused_seconds: 300,
    });
    const result = await createSupabaseAppRepo().toggleVote("a1", "u1");
    // Rejected vote: counter unchanged, viewer state unchanged, but the
    // pause must reach the UI.
    expect(result.votes).toBe(7);
    expect(result.viewerHasVoted).toBe(false);
    expect(result.pauseStarted).toBe(true);
    expect(result.pausedSeconds).toBe(300);
  });

  it("omits pause fields for normal toggles", async () => {
    mockToggleVote({
      row: { ...appRow, votes: 8 },
      liked: true,
      pause_started: false,
      paused_seconds: 0,
    });
    const result = await createSupabaseAppRepo().toggleVote("a1", "u1");
    expect(result.votes).toBe(8);
    expect(result.viewerHasVoted).toBe(true);
    expect(result.pauseStarted).toBeUndefined();
    expect(result.pausedSeconds).toBeUndefined();
  });

  it("treats missing pause fields (older backend) as a normal toggle", async () => {
    mockToggleVote({ row: { ...appRow, votes: 8 }, liked: true });
    const result = await createSupabaseAppRepo().toggleVote("a1", "u1");
    expect(result.pauseStarted).toBeUndefined();
  });

  it("surfaces RPC errors", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Voting is paused for another 4 minutes. Try again later." },
    });
    vi.mocked(getSupabase).mockReturnValue({ auth: {}, rpc } as never);
    await expect(createSupabaseAppRepo().toggleVote("a1", "u1")).rejects.toThrow(
      "Voting is paused for another 4 minutes",
    );
  });

  it("throws NotFoundError when the payload has no row", async () => {
    mockToggleVote({ liked: true });
    await expect(createSupabaseAppRepo().toggleVote("a1", "u1")).rejects.toThrow(
      "Project not found.",
    );
  });
});

describe("supabase getVoteTimeoutSeconds", () => {
  it("returns the remaining seconds, rounded up", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 299.4, error: null });
    vi.mocked(getSupabase).mockReturnValue({ auth: {}, rpc } as never);
    await expect(createSupabaseAppRepo().getVoteTimeoutSeconds()).resolves.toBe(300);
  });

  it("returns 0 on RPC errors — never a fake pause", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    vi.mocked(getSupabase).mockReturnValue({ auth: {}, rpc } as never);
    await expect(createSupabaseAppRepo().getVoteTimeoutSeconds()).resolves.toBe(0);
  });

  it("returns 0 for non-numeric responses", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "later", error: null });
    vi.mocked(getSupabase).mockReturnValue({ auth: {}, rpc } as never);
    await expect(createSupabaseAppRepo().getVoteTimeoutSeconds()).resolves.toBe(0);
  });
});
