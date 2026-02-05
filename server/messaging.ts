import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { messages } from "../drizzle/schema";
import { and, desc, eq, or } from "drizzle-orm";

export const messagingRouter = router({
  // Get all conversations for current user
  conversations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userId = ctx.user.id;

    // Get unique conversations with latest message
    const userMessages = await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));

    // Group by conversationId and get latest message for each
    const conversationsMap = new Map();
    
    for (const msg of userMessages) {
      if (!conversationsMap.has(msg.conversationId)) {
        conversationsMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          propertyId: msg.propertyId,
          otherUserId: msg.senderId === userId ? msg.receiverId : msg.senderId,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }
      
      // Count unread messages
      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversationsMap.get(msg.conversationId);
        conv.unreadCount++;
      }
    }

    return Array.from(conversationsMap.values());
  }),

  // Get messages for a specific conversation
  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);

      // Mark messages as read
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
            eq(messages.receiverId, ctx.user.id),
            eq(messages.isRead, false)
          )
        );

      return conversationMessages;
    }),

  // Send a new message
  sendMessage: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      receiverId: z.number(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const senderId = ctx.user.id;
      
      // Create conversationId: property-sender-receiver (sorted by userId to ensure consistency)
      const userIds = [senderId, input.receiverId].sort((a, b) => a - b);
      const conversationId = `${input.propertyId}-${userIds[0]}-${userIds[1]}`;

      const [newMessage] = await db.insert(messages).values({
        conversationId,
        propertyId: input.propertyId,
        senderId,
        receiverId: input.receiverId,
        content: input.content,
        isRead: false,
      }).returning({ id: messages.id });

      // Return the created message
      const createdMessage = await db
        .select()
        .from(messages)
        .where(eq(messages.id, newMessage.id))
        .limit(1);

      return createdMessage[0];
    }),

  // Mark conversation as read
  markAsRead: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
            eq(messages.receiverId, ctx.user.id)
          )
        );

      return { success: true };
    }),
});
