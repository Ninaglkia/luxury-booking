import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_UNAVAILABLE, createServerSession, getAuthErrorMessage } from "../client/src/lib/auth-errors";

afterEach(() => vi.unstubAllGlobals());

describe("login errors", () => {
  it.each([
    new TypeError("Failed to fetch"),
    new TypeError("Load failed"),
    { name: "AuthRetryableFetchError", message: "upstream unavailable" },
    { status: 503, message: "internal database details" },
    { code: "request_timeout", message: "request expired" },
  ])("explains service failures without exposing technical details: %o", error => {
    expect(getAuthErrorMessage(error)).toBe(AUTH_UNAVAILABLE);
  });

  it("distinguishes incorrect credentials from service outages", () => {
    expect(getAuthErrorMessage({ code: "invalid_credentials" })).toBe("Email o password non corrette.");
    expect(getAuthErrorMessage({ code: "email_not_confirmed" })).toContain("Conferma la tua email");
  });

  it("handles rejected network requests during session creation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(createServerSession("test-token")).rejects.toThrow(AUTH_UNAVAILABLE);
  });

  it.each([500, 502, 503])("handles server %i including non-JSON responses", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Internal server error", { status })));
    await expect(createServerSession("test-token")).rejects.toThrow(AUTH_UNAVAILABLE);
  });

  it("handles invalid sessions without exposing raw server errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("sensitive detail", { status: 401 })));
    await expect(createServerSession("test-token")).rejects.toThrow("Sessione non valida");
  });

  it("sends the token with cookies and accepts a successful exchange", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"success":true}'));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createServerSession("test-token")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/supabase-session", expect.objectContaining({
      method: "POST", credentials: "include", body: JSON.stringify({ access_token: "test-token" }),
    }));
  });
});
