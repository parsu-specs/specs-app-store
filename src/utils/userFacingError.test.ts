import { describe, expect, it } from "vitest";
import { userFacingError } from "./userFacingError";

describe("userFacingError", () => {
  it.each([
    'duplicate key value violates unique constraint "profiles_pkey"',
    "Could not load projects: SELECT * FROM private.users",
    "Invalid API key: secret-value",
    "TypeError: Cannot read properties of undefined\n at App.tsx:32",
    "<html><body>502 Bad Gateway</body></html>",
    null,
    { message: "internal database details" },
  ])("hides unexpected error details: %s", (error) => {
    expect(userFacingError(error)).toBe("Something went wrong. Please try again.");
  });

  it("preserves reviewed validation messages", () => {
    expect(userFacingError(new Error("Password must be at least 6 characters."))).toBe(
      "Password must be at least 6 characters.",
    );
  });

  it("does not pass through appended technical details", () => {
    expect(userFacingError("Name is required. SQLSTATE 23505")).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("turns connection errors into a recovery instruction", () => {
    expect(userFacingError(new Error("Failed to fetch https://private.example/api"))).toBe(
      "We couldn't connect. Check your internet connection and try again.",
    );
  });

  it("preserves vote countdowns without allowing arbitrary pause messages", () => {
    expect(userFacingError("Voting is paused — 4:30 left.")).toBe("Voting is paused — 4:30 left.");
    expect(userFacingError("Voting is paused: database unavailable")).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
