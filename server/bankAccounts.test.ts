import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createHostContext(): { ctx: TrpcContext } {
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
    phone: "+39 123 456 7890",
    isVerified: true,
    isPhoneVerified: false,
    verificationCode: null,
    verificationCodeExpiry: null,
    idDocument: null,
    idDocumentVerified: false,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createGuestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "guest-user",
    email: "guest@example.com",
    name: "Guest User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    phone: null,
    isVerified: false,
    isPhoneVerified: false,
    verificationCode: null,
    verificationCodeExpiry: null,
    idDocument: null,
    idDocumentVerified: false,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("bankAccounts", () => {
  describe("upsertBankAccount", () => {
    it("rejects invalid IBAN", async () => {
      const { ctx } = createHostContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.bankAccounts.upsertBankAccount({
          iban: "INVALID1234567890", // 18 chars, passa lunghezza ma fallisce checksum
          bankName: "Test Bank",
          accountHolderName: "John Doe",
        })
      ).rejects.toThrow("IBAN non valido");
    });

    it("accepts valid Italian IBAN", async () => {
      const { ctx } = createHostContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.bankAccounts.upsertBankAccount({
        iban: "IT60X0542811101000000123456",
        bankName: "Banca Intesa",
        accountHolderName: "Mario Rossi",
        swift: "BCITITMM",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("successo");
    });

    it("forbids non-host users from adding bank accounts", async () => {
      const { ctx } = createGuestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.bankAccounts.upsertBankAccount({
          iban: "IT60X0542811101000000123456",
          bankName: "Test Bank",
          accountHolderName: "Guest User",
        })
      ).rejects.toThrow("Solo i proprietari possono gestire i dati bancari");
    });
  });

  describe("getBankAccount", () => {
    it("forbids non-host users from accessing bank accounts", async () => {
      const { ctx } = createGuestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.bankAccounts.getBankAccount()).rejects.toThrow(
        "Solo i proprietari possono accedere ai dati bancari"
      );
    });
  });
});
