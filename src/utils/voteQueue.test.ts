import { describe, expect, it } from "vitest";
import { enqueueVote } from "./voteQueue";

const tick = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe("enqueueVote", () => {
  it("runs per-app tasks sequentially in click order", async () => {
    const order: string[] = [];
    const first = enqueueVote("app-a", async () => {
      order.push("a1-start");
      await tick(20);
      order.push("a1-end");
    });
    const second = enqueueVote("app-a", async () => {
      order.push("a2");
    });
    enqueueVote("app-b", async () => {
      order.push("b");
    });
    await Promise.all([first, second, tick(50)]);
    expect(order.indexOf("a1-end")).toBeLessThan(order.indexOf("a2"));
    expect(order).toContain("b");
  });

  it("keeps the chain alive when a task throws", async () => {
    const ran: string[] = [];
    await enqueueVote("app-c", async () => {
      ran.push("boom");
      throw new Error("toggle failed");
    });
    await enqueueVote("app-c", async () => {
      ran.push("after");
    });
    await tick(10);
    expect(ran).toEqual(["boom", "after"]);
  });
});
