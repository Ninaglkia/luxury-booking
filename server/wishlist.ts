import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { wishlist, properties, propertyImages } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

export const wishlistRouter = router({
  // Get user's wishlist
  getWishlist: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const items = await db
      .select({
        id: wishlist.id,
        propertyId: wishlist.propertyId,
        createdAt: wishlist.createdAt,
        property: properties,
      })
      .from(wishlist)
      .leftJoin(properties, eq(wishlist.propertyId, properties.id))
      .where(eq(wishlist.userId, ctx.user.id));

    // Get first image for each property
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        if (!item.property) return item;

        const [firstImage] = await db
          .select()
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, item.property.id))
          .limit(1);

        return {
          ...item,
          property: {
            ...item.property,
            firstImage: firstImage?.imageUrl || null,
          },
        };
      })
    );

    return enrichedItems;
  }),

  // Add property to wishlist
  addToWishlist: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if already in wishlist
      const existing = await db
        .select()
        .from(wishlist)
        .where(
          and(
            eq(wishlist.userId, ctx.user.id),
            eq(wishlist.propertyId, input.propertyId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { success: true, message: "Già nei preferiti" };
      }

      await db.insert(wishlist).values({
        userId: ctx.user.id,
        propertyId: input.propertyId,
      });

      return { success: true, message: "Aggiunto ai preferiti" };
    }),

  // Remove from wishlist
  removeFromWishlist: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(wishlist)
        .where(
          and(
            eq(wishlist.userId, ctx.user.id),
            eq(wishlist.propertyId, input.propertyId)
          )
        );

      return { success: true, message: "Rimosso dai preferiti" };
    }),

  // Check if property is in wishlist
  isInWishlist: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(wishlist)
        .where(
          and(
            eq(wishlist.userId, ctx.user.id),
            eq(wishlist.propertyId, input.propertyId)
          )
        )
        .limit(1);

      return result.length > 0;
    }),
});
