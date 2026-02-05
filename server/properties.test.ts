import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createHostContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "host-user",
    email: "host@example.com",
    name: "Host User",
    loginMethod: "manus",
    role: "host",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("properties.list", () => {
  it("returns empty array when no properties exist", async () => {
    const ctx = createHostContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.properties.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("auth.becomeHost", () => {
  it("allows guest user to become host", async () => {
    const guestUser: AuthenticatedUser = {
      id: 3,
      openId: "guest-user",
      email: "guest@example.com",
      name: "Guest User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx: TrpcContext = {
      user: guestUser,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.becomeHost();

    expect(result.success).toBe(true);
    expect(result.message).toContain("proprietario");
  });
});

describe("amenities.list", () => {
  it("returns array of amenities", async () => {
    const ctx = createHostContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.amenities.list();

    expect(Array.isArray(result)).toBe(true);
  });
});
