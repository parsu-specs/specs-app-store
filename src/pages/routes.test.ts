import { describe, expect, it } from "vitest";
import {
  ROUTES,
  appDetailsPath,
  developerProfilePath,
  isProtectedRoute,
  normalizePathname,
} from "./routes";

describe("routes", () => {
  it("normalizes trailing slashes and the root path", () => {
    expect(normalizePathname(`${ROUTES.discover}///`)).toBe(ROUTES.discover);
    expect(normalizePathname("///")).toBe(ROUTES.root);
  });

  it("builds encoded application and developer paths", () => {
    expect(appDetailsPath("app / one")).toBe("/apps/app%20%2F%20one");
    expect(developerProfilePath("profile / one")).toBe("/developers/profile%20%2F%20one");
  });

  it("recognizes protected routes and the legacy community route", () => {
    expect(isProtectedRoute(ROUTES.discover)).toBe(true);
    expect(isProtectedRoute(appDetailsPath("app-1"))).toBe(true);
    expect(isProtectedRoute(developerProfilePath("profile-1"))).toBe(true);
    expect(isProtectedRoute(ROUTES.community)).toBe(true);
    expect(isProtectedRoute(ROUTES.landing)).toBe(false);
  });
});
