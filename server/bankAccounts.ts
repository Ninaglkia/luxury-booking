import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { bankAccounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// IBAN validation function
function validateIBAN(iban: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();
  
  // Check length (15-34 characters)
  if (cleanIban.length < 15 || cleanIban.length > 34) {
    return false;
  }
  
  // Check format: 2 letters + 2 digits + alphanumeric
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
  if (!ibanRegex.test(cleanIban)) {
    return false;
  }
  
  // MOD-97 checksum validation
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numericIban = rearranged
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : char;
    })
    .join("");
  
  // Calculate modulo 97
  let remainder = numericIban;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(block.length);
  }
  
  return parseInt(remainder, 10) % 97 === 1;
}

// Mask IBAN for display (show only first 4 and last 4 characters)
function maskIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, "");
  if (clean.length <= 8) return iban;
  return `${clean.slice(0, 4)}${"*".repeat(clean.length - 8)}${clean.slice(-4)}`;
}

export const bankAccountsRouter = router({
  // Get host's bank account
  getBankAccount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Only hosts and admins can access bank accounts
    if (ctx.user.role !== "host" && ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Solo i proprietari possono accedere ai dati bancari",
      });
    }

    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, ctx.user.id))
      .limit(1);

    if (!account) {
      return null;
    }

    // Return account with masked IBAN for security
    return {
      ...account,
      ibanMasked: maskIBAN(account.iban),
    };
  }),

  // Add or update bank account
  upsertBankAccount: protectedProcedure
    .input(
      z.object({
        iban: z.string().min(15).max(34),
        bankName: z.string().min(2).max(255),
        accountHolderName: z.string().min(2).max(255),
        swift: z.string().min(8).max(11).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only hosts and admins can manage bank accounts
      if (ctx.user.role !== "host" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo i proprietari possono gestire i dati bancari",
        });
      }

      // Validate IBAN
      const cleanIban = input.iban.replace(/\s/g, "").toUpperCase();
      if (!validateIBAN(cleanIban)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "IBAN non valido. Verifica il codice inserito.",
        });
      }

      // Check if account already exists
      const [existing] = await db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        // Update existing account
        await db
          .update(bankAccounts)
          .set({
            iban: cleanIban,
            bankName: input.bankName,
            accountHolderName: input.accountHolderName,
            swift: input.swift || null,
            isVerified: false, // Reset verification on update
            updatedAt: new Date(),
          })
          .where(eq(bankAccounts.userId, ctx.user.id));

        return {
          success: true,
          message: "Dati bancari aggiornati con successo",
        };
      } else {
        // Insert new account
        await db.insert(bankAccounts).values({
          userId: ctx.user.id,
          iban: cleanIban,
          bankName: input.bankName,
          accountHolderName: input.accountHolderName,
          swift: input.swift || null,
          isVerified: false,
        });

        return {
          success: true,
          message: "Dati bancari aggiunti con successo",
        };
      }
    }),

  // Delete bank account
  deleteBankAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Only hosts and admins can delete bank accounts
    if (ctx.user.role !== "host" && ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Solo i proprietari possono eliminare i dati bancari",
      });
    }

    await db
      .delete(bankAccounts)
      .where(eq(bankAccounts.userId, ctx.user.id));

    return {
      success: true,
      message: "Dati bancari eliminati con successo",
    };
  }),
});
