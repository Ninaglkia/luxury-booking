import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Generate random 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const verificationRouter = router({
  // Request verification code
  requestCode: protectedProcedure
    .input(z.object({
      phone: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const code = generateVerificationCode();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user with verification code
      await db
        .update(users)
        .set({
          phone: input.phone,
          verificationCode: code,
          verificationCodeExpiry: expiry,
        })
        .where(eq(users.id, ctx.user.id));

      // In production, send SMS via Twilio/AWS SNS
      // For now, return code for testing (remove in production!)
      console.log(`[Verification] Code for user ${ctx.user.id}: ${code}`);

      return {
        success: true,
        message: "Codice di verifica inviato al tuo numero",
        // Remove this in production:
        debugCode: process.env.NODE_ENV === "development" ? code : undefined,
      };
    }),

  // Verify code
  verifyCode: protectedProcedure
    .input(z.object({
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utente non trovato",
        });
      }

      if (!user.verificationCode || !user.verificationCodeExpiry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nessun codice di verifica richiesto",
        });
      }

      if (new Date() > user.verificationCodeExpiry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Codice di verifica scaduto",
        });
      }

      if (user.verificationCode !== input.code) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Codice di verifica non valido",
        });
      }

      // Mark user as verified
      await db
        .update(users)
        .set({
          isVerified: true,
          verificationCode: null,
          verificationCodeExpiry: null,
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Account verificato con successo!",
      };
    }),

  // Upload identity document
  uploadDocument: protectedProcedure
    .input(z.object({
      documentType: z.enum(["passport", "id_card", "driver_license"]),
      documentNumber: z.string(),
      documentUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({
          idDocumentType: input.documentType,
          idDocumentNumber: input.documentNumber,
          idDocumentUrl: input.documentUrl,
          idDocumentVerified: false, // Admin will verify
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Documento caricato con successo. Verrà verificato dal nostro team.",
      };
    }),
});
