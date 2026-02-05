import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { messagingRouter } from "./messaging";
import { verificationRouter } from "./verification";
import { wishlistRouter } from "./wishlist";
import { bankAccountsRouter } from "./bankAccounts";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Solo gli amministratori possono accedere a questa risorsa'
    });
  }
  return next({ ctx });
});

// Host or Admin procedure
const hostProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'host' && ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Solo i proprietari possono accedere a questa risorsa'
    });
  }
  return next({ ctx });
});

const coerceNumber = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export const appRouter = router({
  system: systemRouter,
  messaging: messagingRouter,
  verification: verificationRouter,
  wishlist: wishlistRouter,
  bankAccounts: bankAccountsRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUser({
          openId: ctx.user.openId,
          ...input,
        });
        return { success: true };
      }),

    becomeHost: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role === 'host' || ctx.user.role === 'admin') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Sei già un proprietario'
          });
        }
        
        await db.updateUserRole(ctx.user.id, 'host');
        return { success: true, message: 'Ora sei un proprietario!' };
      }),
  }),

  properties: router({
    // Public: Get all approved properties
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async () => {
        const properties = await db.getApprovedProperties();
        return properties;
      }),

    // Public: Get property by ID with images and amenities
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Proprietà non trovata' });
        }

        const images = await db.getPropertyImages(input.id);
        const amenities = await db.getPropertyAmenities(input.id);
        const rating = await db.getPropertyAverageRating(input.id);

        return { ...property, images, amenities, rating };
      }),

    // Host: Get my properties
    myProperties: hostProcedure
      .query(async ({ ctx }) => {
        return await db.getPropertiesByHost(ctx.user.id);
      }),

    // Host: Create new property
    create: hostProcedure
      .input(z.object({
        title: z.string().min(10, 'Il titolo deve contenere almeno 10 caratteri'),
        description: z.string().min(50, 'La descrizione deve contenere almeno 50 caratteri'),
        propertyType: z.string(),
        pricePerNight: z.preprocess(coerceNumber, z.number().positive()),
        maxGuests: z.number().min(1),
        bedrooms: z.number().min(1),
        bathrooms: z.number().min(1),
        squareMeters: z.number().optional(),
        country: z.string(),
        city: z.string(),
        address: z.string(),
        latitude: z.preprocess(coerceNumber, z.number()).optional(),
        longitude: z.preprocess(coerceNumber, z.number()).optional(),
        checkInTime: z.string().default('15:00'),
        checkOutTime: z.string().default('11:00'),
        minimumStay: z.number().default(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const propertyId = await db.createProperty({
          ...input,
          hostId: ctx.user.id,
          status: 'pending',
        });

        // Create notification for admin
        await db.createNotification({
          userId: ctx.user.id,
          type: 'property_submitted',
          title: 'Proprietà inviata per approvazione',
          message: `La tua proprietà "${input.title}" è stata inviata per l'approvazione dell'amministratore.`,
          relatedId: propertyId,
        });

        return { success: true, propertyId };
      }),

    // Host: Add images to property
    addImages: hostProcedure
      .input(z.object({
        propertyId: z.number(),
        images: z.array(z.object({
          imageUrl: z.string(),
          imageKey: z.string(),
          caption: z.string().optional(),
          isCover: z.boolean().default(false),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.hostId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Non autorizzato' });
        }

        for (let i = 0; i < input.images.length; i++) {
          await db.addPropertyImage({
            propertyId: input.propertyId,
            ...input.images[i],
            displayOrder: i,
          });
        }

        return { success: true };
      }),

    // Host: Add amenities to property
    addAmenities: hostProcedure
      .input(z.object({
        propertyId: z.number(),
        amenityIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.hostId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Non autorizzato' });
        }

        for (const amenityId of input.amenityIds) {
          await db.addPropertyAmenity({
            propertyId: input.propertyId,
            amenityId,
          });
        }

        return { success: true };
      }),
  }),

  amenities: router({
    // Public: Get all amenities
    list: publicProcedure.query(async () => {
      return await db.getAllAmenities();
    }),

    // Admin: Create amenity
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        icon: z.string().optional(),
        category: z.string(),
      }))
      .mutation(async ({ input }) => {
        const amenityId = await db.createAmenity(input);
        return { success: true, amenityId };
      }),
  }),

  admin: router({
    // Get pending properties for approval
    pendingProperties: adminProcedure
      .query(async () => {
        return await db.getPendingProperties();
      }),

    // Approve or reject property
    reviewProperty: adminProcedure
      .input(z.object({
        propertyId: z.number(),
        action: z.enum(['approve', 'reject']),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Proprietà non trovata' });
        }

        const newStatus = input.action === 'approve' ? 'approved' : 'rejected';
        await db.updatePropertyStatus(input.propertyId, newStatus, input.rejectionReason);

        // Notify host
        const message = input.action === 'approve'
          ? `La tua proprietà "${property.title}" è stata approvata ed è ora visibile sulla piattaforma!`
          : `La tua proprietà "${property.title}" è stata rifiutata. Motivo: ${input.rejectionReason || 'Non specificato'}`;

        await db.createNotification({
          userId: property.hostId,
          type: input.action === 'approve' ? 'property_approved' : 'property_rejected',
          title: input.action === 'approve' ? 'Proprietà approvata!' : 'Proprietà rifiutata',
          message,
          relatedId: input.propertyId,
        });

        return { success: true };
      }),
  }),

  bookings: router({
    // Protected: Get my bookings as guest
    myBookings: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getBookingsByGuest(ctx.user.id);
      }),

    // Host: Get bookings for my properties
    hostBookings: hostProcedure
      .query(async ({ ctx }) => {
        return await db.getBookingsByHost(ctx.user.id);
      }),

    // Protected: Create booking
    create: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        checkInDate: z.date(),
        checkOutDate: z.date(),
        numberOfGuests: z.number(),
        guestName: z.string(),
        guestEmail: z.string().email(),
        guestPhone: z.string().optional(),
        specialRequests: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Proprietà non trovata' });
        }

        // Check availability
        const isAvailable = await db.checkPropertyAvailability(
          input.propertyId,
          input.checkInDate,
          input.checkOutDate
        );

        if (!isAvailable) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'La proprietà non è disponibile per le date selezionate' 
          });
        }

        // Calculate total price
        const nights = Math.ceil((input.checkOutDate.getTime() - input.checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = Math.round(property.pricePerNight * nights * 100) / 100;

        const bookingId = await db.createBooking({
          ...input,
          propertyId: input.propertyId,
          guestId: ctx.user.id,
          hostId: property.hostId,
          totalPrice,
          status: 'pending',
          paymentStatus: 'pending',
        });

        // Notify host
        await db.createNotification({
          userId: property.hostId,
          type: 'booking_request',
          title: 'Nuova richiesta di prenotazione',
          message: `${input.guestName} ha richiesto una prenotazione per "${property.title}"`,
          relatedId: bookingId,
        });

        return { success: true, bookingId, totalPrice };
      }),

    // Get booking by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Prenotazione non trovata' });
        }

        // Check authorization
        if (booking.guestId !== ctx.user.id && booking.hostId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Non autorizzato' });
        }

        return booking;
      }),
  }),

  reviews: router({
    // Public: Get reviews for a property
    getByProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getReviewsByProperty(input.propertyId);
      }),

    // Protected: Create review
    create: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        propertyId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().min(10),
        cleanlinessRating: z.number().min(1).max(5).optional(),
        accuracyRating: z.number().min(1).max(5).optional(),
        communicationRating: z.number().min(1).max(5).optional(),
        locationRating: z.number().min(1).max(5).optional(),
        valueRating: z.number().min(1).max(5).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if booking exists and belongs to user
        const booking = await db.getBookingById(input.bookingId);
        if (!booking || booking.guestId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Non autorizzato' });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Puoi recensire solo dopo aver completato il soggiorno' 
          });
        }

        // Check if already reviewed
        const hasReviewed = await db.hasUserReviewedBooking(input.bookingId, ctx.user.id);
        if (hasReviewed) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Hai già recensito questa prenotazione' 
          });
        }

        const reviewId = await db.createReview({
          ...input,
          guestId: ctx.user.id,
        });

        // Notify host
        await db.createNotification({
          userId: booking.hostId,
          type: 'review_received',
          title: 'Nuova recensione ricevuta',
          message: `Hai ricevuto una nuova recensione con ${input.rating} stelle`,
          relatedId: reviewId,
        });

        return { success: true, reviewId };
      }),
  }),

  messages: router({
    // Get conversation messages
    getConversation: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ ctx, input }) => {
        const messages = await db.getConversationMessages(input.conversationId);
        
        // Verify user is part of conversation
        if (messages.length > 0) {
          const firstMessage = messages[0];
          if (firstMessage.senderId !== ctx.user.id && firstMessage.receiverId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Non autorizzato' });
          }
        }

        return messages;
      }),

    // Send message
    send: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        receiverId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Proprietà non trovata' });
        }

        const conversationId = `${input.propertyId}-${Math.min(ctx.user.id, input.receiverId)}-${Math.max(ctx.user.id, input.receiverId)}`;

        const messageId = await db.createMessage({
          conversationId,
          propertyId: input.propertyId,
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          content: input.content,
        });

        // Notify receiver
        await db.createNotification({
          userId: input.receiverId,
          type: 'message_received',
          title: 'Nuovo messaggio',
          message: `Hai ricevuto un nuovo messaggio da ${ctx.user.name || 'un utente'}`,
          relatedId: messageId,
        });

        return { success: true, messageId };
      }),

    // Mark messages as read
    markAsRead: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.markMessagesAsRead(input.conversationId, ctx.user.id);
        return { success: true };
      }),

    // Get unread count
    unreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUnreadMessageCount(ctx.user.id);
      }),
  }),

  notifications: router({
    // Get my notifications
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserNotifications(ctx.user.id);
      }),

    // Mark notification as read
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),

    // Get unread count
    unreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUnreadNotificationCount(ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
