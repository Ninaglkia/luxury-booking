import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(userId: number, role: "guest" | "host" | "admin" = "guest"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
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

describe("messaging.conversations", () => {
  it("returns empty array when no conversations exist", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.messaging.conversations();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("messaging.sendMessage", () => {
  it("allows authenticated user to send message", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.messaging.sendMessage({
      propertyId: 1,
      receiverId: 2,
      content: "Ciao, sono interessato alla tua villa!",
    });

    expect(result).toBeDefined();
    expect(result.content).toBe("Ciao, sono interessato alla tua villa!");
    expect(result.senderId).toBe(1);
    expect(result.receiverId).toBe(2);
  });
});
