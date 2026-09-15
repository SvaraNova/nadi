import { describe, expect, it } from "vitest";
import { assertLocalRequest, canAccessRequest, isLoopbackAddress } from "../../src/server/access";
import { getSessionContext } from "../../src/server/auth/session";

describe("local access guard", () => {
  it("accepts loopback and rejects remote addresses", () => {
    expect(isLoopbackAddress("127.0.0.1")).toBe(true);
    expect(isLoopbackAddress("::1")).toBe(true);
    expect(isLoopbackAddress("203.0.113.10")).toBe(false);
    expect(canAccessRequest(new Headers({ "x-forwarded-for": "127.0.0.1" }), "local")).toBe(true);
    expect(canAccessRequest(new Headers({ "x-forwarded-for": "203.0.113.10" }), "local")).toBe(false);
  });
  it("does not pretend hosted mode is authenticated", () => expect(canAccessRequest(new Headers(), "authenticated")).toBe(false));
  it("does not accept a client supplied role", () => expect(getSessionContext(new Headers({ "x-nadi-role": "admin", "authorization": "Bearer local" })).role).toBe("analyst"));
  it("rejects remote requests before route work", () => expect(() => assertLocalRequest(new Headers({ "x-forwarded-for": "203.0.113.10" }))).toThrow("UNAUTHORIZED"));
});
