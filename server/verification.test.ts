import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(userId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "guest",
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

describe("verification.requestCode", () => {
  it("generates verification code for authenticated user", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.verification.requestCode({
      phone: "+39 123 456 7890",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("Codice di verifica inviato");
    // In development mode, debugCode should be present
    if (process.env.NODE_ENV === "development") {
      expect(result.debugCode).toBeDefined();
      expect(result.debugCode?.length).toBe(6);
    }
  });
});

describe("wishlist.addToWishlist", () => {
  it("allows user to add property to wishlist", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.wishlist.addToWishlist({
      propertyId: 1,
    });

    expect(result.success).toBe(true);
  });
});

describe("wishlist.getWishlist", () => {
  it("returns user's wishlist", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.wishlist.getWishlist();

    expect(Array.isArray(result)).toBe(true);
  });
});
