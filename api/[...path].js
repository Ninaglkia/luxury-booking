// api/_handler.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { TRPCError as TRPCError5 } from "@trpc/server";
import { z as z6 } from "zod";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseUrl: (process.env.VITE_SUPABASE_URL ?? "").replace(/\s+/g, ""),
  supabaseAnonKey: (process.env.VITE_SUPABASE_ANON_KEY ?? "").replace(/\s+/g, ""),
  supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").replace(/\s+/g, "")
};

// server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/db.ts
import { eq, and, gte, lte, desc, sql, inArray, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
import { pgTable, serial, text, boolean, timestamp, doublePrecision, integer, pgEnum } from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["guest", "host", "admin"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: roleEnum("role").default("guest").notNull(),
  phone: text("phone"),
  bio: text("bio"),
  avatar: text("avatar"),
  // Verification fields
  isVerified: boolean("isVerified").default(false),
  verificationCode: text("verificationCode"),
  verificationCodeExpiry: timestamp("verificationCodeExpiry"),
  // Identity documents
  idDocumentType: text("idDocumentType"),
  // passport, id_card, driver_license
  idDocumentNumber: text("idDocumentNumber"),
  idDocumentUrl: text("idDocumentUrl"),
  idDocumentVerified: boolean("idDocumentVerified").default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  // onUpdateNow not supported directly in pg-core usually, handled by triggers or manual update
  lastSignedIn: timestamp("lastSignedIn").notNull().defaultNow()
});
var statusEnum = pgEnum("status", ["pending", "approved", "rejected", "inactive"]);
var properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  hostId: integer("hostId").notNull(),
  // Foreign key to users table
  title: text("title").notNull(),
  description: text("description").notNull(),
  propertyType: text("propertyType").notNull(),
  // villa, mansion, estate, etc.
  pricePerNight: doublePrecision("pricePerNight").notNull(),
  maxGuests: integer("maxGuests").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  squareMeters: integer("squareMeters"),
  // Location
  country: text("country").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  // Status and approval
  status: statusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  // Additional info
  checkInTime: text("checkInTime").default("15:00"),
  checkOutTime: text("checkOutTime").default("11:00"),
  minimumStay: integer("minimumStay").default(1),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
});
var propertyImages = pgTable("propertyImages", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(),
  // S3 key for management
  caption: text("caption"),
  displayOrder: integer("displayOrder").default(0),
  isCover: boolean("isCover").default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});
var amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon"),
  // Lucide icon name
  category: text("category").notNull(),
  // view, facility, service, etc.
  createdAt: timestamp("createdAt").notNull().defaultNow()
});
var propertyAmenities = pgTable("propertyAmenities", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  amenityId: integer("amenityId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});
var bookingStatusEnum = pgEnum("bookingStatus", ["pending", "confirmed", "cancelled", "completed"]);
var paymentStatusEnum = pgEnum("paymentStatus", ["pending", "paid", "refunded", "failed"]);
var bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  guestId: integer("guestId").notNull(),
  hostId: integer("hostId").notNull(),
  checkInDate: timestamp("checkInDate").notNull(),
  checkOutDate: timestamp("checkOutDate").notNull(),
  numberOfGuests: integer("numberOfGuests").notNull(),
  totalPrice: doublePrecision("totalPrice").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  // Payment info
  stripePaymentIntentId: text("stripePaymentIntentId"),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  // Guest info
  guestName: text("guestName").notNull(),
  guestEmail: text("guestEmail").notNull(),
  guestPhone: text("guestPhone"),
  specialRequests: text("specialRequests"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
});
var reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  bookingId: integer("bookingId").notNull(),
  guestId: integer("guestId").notNull(),
  rating: integer("rating").notNull(),
  // 1-5 stars
  comment: text("comment").notNull(),
  // Detailed ratings
  cleanlinessRating: integer("cleanlinessRating"),
  accuracyRating: integer("accuracyRating"),
  communicationRating: integer("communicationRating"),
  locationRating: integer("locationRating"),
  valueRating: integer("valueRating"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: text("conversationId").notNull(),
  // Format: "propertyId-guestId-hostId"
  propertyId: integer("propertyId").notNull(),
  senderId: integer("senderId").notNull(),
  receiverId: integer("receiverId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});
var availabilityCalendar = pgTable("availabilityCalendar", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  date: timestamp("date").notNull(),
  isAvailable: boolean("isAvailable").default(true),
  reason: text("reason"),
  // booked, blocked_by_host, maintenance
  bookingId: integer("bookingId"),
  // If blocked due to booking
  createdAt: timestamp("createdAt").notNull().defaultNow()
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: text("type").notNull(),
  // booking_request, booking_confirmed, review_received, message_received, property_approved, property_rejected
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("relatedId"),
  // ID of related entity (booking, property, message, etc.)
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});
var wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  propertyId: integer("propertyId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});
var bankAccounts = pgTable("bankAccounts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  // One bank account per host
  // Bank details
  iban: text("iban").notNull(),
  // International Bank Account Number
  bankName: text("bankName").notNull(),
  accountHolderName: text("accountHolderName").notNull(),
  swift: text("swift"),
  // SWIFT/BIC code (optional)
  // Verification
  isVerified: boolean("isVerified").default(false),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, {
        ssl: "require",
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10
      });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod", "phone", "bio", "avatar"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get user by openId:", error);
    return null;
  }
}
async function updateUserRole(userId, role) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user role:", error);
    throw error;
  }
}
async function getApprovedProperties() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(properties).where(eq(properties.status, "approved"));
  } catch (error) {
    console.error("[Database] Failed to get approved properties:", error);
    return [];
  }
}
async function getPropertyById(id) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get property by id:", error);
    return null;
  }
}
async function getPropertyImages(propertyId) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(propertyImages).where(eq(propertyImages.propertyId, propertyId)).orderBy(propertyImages.displayOrder);
  } catch (error) {
    console.error("[Database] Failed to get property images:", error);
    return [];
  }
}
async function getPropertyAmenities(propertyId) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select({
      id: amenities.id,
      name: amenities.name,
      icon: amenities.icon,
      category: amenities.category
    }).from(propertyAmenities).innerJoin(amenities, eq(propertyAmenities.amenityId, amenities.id)).where(eq(propertyAmenities.propertyId, propertyId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get property amenities:", error);
    return [];
  }
}
async function getPropertyAverageRating(propertyId) {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select({
      avgRating: sql`avg(${reviews.rating})`
    }).from(reviews).where(eq(reviews.propertyId, propertyId));
    return Number(result[0]?.avgRating) || 0;
  } catch (error) {
    console.error("[Database] Failed to get property rating:", error);
    return 0;
  }
}
async function getPropertiesByHost(hostId) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(properties).where(eq(properties.hostId, hostId));
  } catch (error) {
    console.error("[Database] Failed to get properties by host:", error);
    return [];
  }
}
async function createProperty(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const [result] = await db.insert(properties).values(data).returning({ id: properties.id });
    return result.id;
  } catch (error) {
    console.error("[Database] Failed to create property:", error);
    throw error;
  }
}
async function addPropertyImage(data) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(propertyImages).values(data);
  } catch (error) {
    console.error("[Database] Failed to add property image:", error);
    throw error;
  }
}
async function addPropertyAmenity(data) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(propertyAmenities).values(data);
  } catch (error) {
    console.error("[Database] Failed to add property amenity:", error);
    throw error;
  }
}
async function getAllAmenities() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(amenities);
  } catch (error) {
    console.error("[Database] Failed to get all amenities:", error);
    return [];
  }
}
async function createAmenity(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const [result] = await db.insert(amenities).values(data).returning({ id: amenities.id });
    return result.id;
  } catch (error) {
    console.error("[Database] Failed to create amenity:", error);
    throw error;
  }
}
async function getPendingProperties() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(properties).where(eq(properties.status, "pending"));
  } catch (error) {
    console.error("[Database] Failed to get pending properties:", error);
    return [];
  }
}
async function updatePropertyStatus(propertyId, status, rejectionReason) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(properties).set({ status, rejectionReason }).where(eq(properties.id, propertyId));
  } catch (error) {
    console.error("[Database] Failed to update property status:", error);
    throw error;
  }
}
async function getBookingsByGuest(guestId) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select({
      booking: bookings,
      property: properties
    }).from(bookings).innerJoin(properties, eq(bookings.propertyId, properties.id)).where(eq(bookings.guestId, guestId)).orderBy(desc(bookings.createdAt));
    return result.map((r) => ({ ...r.booking, property: r.property }));
  } catch (error) {
    console.error("[Database] Failed to get bookings by guest:", error);
    return [];
  }
}
async function getBookingsByHost(hostId) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select({
      booking: bookings,
      property: properties,
      guest: users
    }).from(bookings).innerJoin(properties, eq(bookings.propertyId, properties.id)).innerJoin(users, eq(bookings.guestId, users.id)).where(eq(bookings.hostId, hostId)).orderBy(desc(bookings.createdAt));
    return result.map((r) => ({
      ...r.booking,
      property: r.property,
      guestName: r.guest.name || r.booking.guestName,
      guestEmail: r.guest.email || r.booking.guestEmail
    }));
  } catch (error) {
    console.error("[Database] Failed to get bookings by host:", error);
    return [];
  }
}
async function checkPropertyAvailability(propertyId, checkIn, checkOut) {
  const db = await getDb();
  if (!db) return false;
  try {
    const overlaps = await db.select({ count: count() }).from(bookings).where(and(
      eq(bookings.propertyId, propertyId),
      inArray(bookings.status, ["confirmed", "pending"]),
      lte(bookings.checkInDate, checkOut),
      gte(bookings.checkOutDate, checkIn)
    ));
    if (overlaps[0].count > 0) return false;
    const blocked = await db.select({ count: count() }).from(availabilityCalendar).where(and(
      eq(availabilityCalendar.propertyId, propertyId),
      eq(availabilityCalendar.isAvailable, false),
      gte(availabilityCalendar.date, checkIn),
      lte(availabilityCalendar.date, checkOut)
    ));
    return blocked[0].count === 0;
  } catch (error) {
    console.error("[Database] Failed to check availability:", error);
    return false;
  }
}
async function createBooking(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const [result] = await db.insert(bookings).values(data).returning({ id: bookings.id });
    return result.id;
  } catch (error) {
    console.error("[Database] Failed to create booking:", error);
    throw error;
  }
}
async function getBookingById(id) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get booking by id:", error);
    return null;
  }
}
async function getReviewsByProperty(propertyId) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select({
      review: reviews,
      guest: users
    }).from(reviews).innerJoin(users, eq(reviews.guestId, users.id)).where(eq(reviews.propertyId, propertyId)).orderBy(desc(reviews.createdAt));
    return result.map((r) => ({
      ...r.review,
      guestName: r.guest.name || "Anonymous",
      guestAvatar: r.guest.avatar
    }));
  } catch (error) {
    console.error("[Database] Failed to get reviews:", error);
    return [];
  }
}
async function hasUserReviewedBooking(bookingId, userId) {
  const db = await getDb();
  if (!db) return false;
  try {
    const result = await db.select({ count: count() }).from(reviews).where(and(
      eq(reviews.bookingId, bookingId),
      eq(reviews.guestId, userId)
    ));
    return result[0].count > 0;
  } catch (error) {
    console.error("[Database] Failed to check review status:", error);
    return false;
  }
}
async function createReview(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const [result] = await db.insert(reviews).values(data).returning({ id: reviews.id });
    return result.id;
  } catch (error) {
    console.error("[Database] Failed to create review:", error);
    throw error;
  }
}
async function getConversationMessages(conversationId) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  } catch (error) {
    console.error("[Database] Failed to get messages:", error);
    return [];
  }
}
async function createMessage(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const [result] = await db.insert(messages).values(data).returning({ id: messages.id });
    return result.id;
  } catch (error) {
    console.error("[Database] Failed to create message:", error);
    throw error;
  }
}
async function markMessagesAsRead(conversationId, userId) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(messages).set({ isRead: true }).where(and(
      eq(messages.conversationId, conversationId),
      eq(messages.receiverId, userId),
      eq(messages.isRead, false)
    ));
  } catch (error) {
    console.error("[Database] Failed to mark messages as read:", error);
    throw error;
  }
}
async function getUnreadMessageCount(userId) {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select({ count: count() }).from(messages).where(and(
      eq(messages.receiverId, userId),
      eq(messages.isRead, false)
    ));
    return result[0].count;
  } catch (error) {
    console.error("[Database] Failed to get unread message count:", error);
    return 0;
  }
}
async function createNotification(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const [result] = await db.insert(notifications).values(data).returning({ id: notifications.id });
    return result.id;
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    throw error;
  }
}
async function getUserNotifications(userId) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get user notifications:", error);
    return [];
  }
}
async function markNotificationAsRead(id) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  } catch (error) {
    console.error("[Database] Failed to mark notification as read:", error);
    throw error;
  }
}
async function getUnreadNotificationCount(userId) {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select({ count: count() }).from(notifications).where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
    return result[0].count;
  } catch (error) {
    console.error("[Database] Failed to get unread notification count:", error);
    return 0;
  }
}

// server/messaging.ts
import { z as z2 } from "zod";
import { and as and2, desc as desc2, eq as eq2, or } from "drizzle-orm";
var messagingRouter = router({
  // Get all conversations for current user
  conversations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = ctx.user.id;
    const userMessages = await db.select().from(messages).where(
      or(
        eq2(messages.senderId, userId),
        eq2(messages.receiverId, userId)
      )
    ).orderBy(desc2(messages.createdAt));
    const conversationsMap = /* @__PURE__ */ new Map();
    for (const msg of userMessages) {
      if (!conversationsMap.has(msg.conversationId)) {
        conversationsMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          propertyId: msg.propertyId,
          otherUserId: msg.senderId === userId ? msg.receiverId : msg.senderId,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0
        });
      }
      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversationsMap.get(msg.conversationId);
        conv.unreadCount++;
      }
    }
    return Array.from(conversationsMap.values());
  }),
  // Get messages for a specific conversation
  getMessages: protectedProcedure.input(z2.object({
    conversationId: z2.string()
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const conversationMessages = await db.select().from(messages).where(eq2(messages.conversationId, input.conversationId)).orderBy(messages.createdAt);
    await db.update(messages).set({ isRead: true }).where(
      and2(
        eq2(messages.conversationId, input.conversationId),
        eq2(messages.receiverId, ctx.user.id),
        eq2(messages.isRead, false)
      )
    );
    return conversationMessages;
  }),
  // Send a new message
  sendMessage: protectedProcedure.input(z2.object({
    propertyId: z2.number(),
    receiverId: z2.number(),
    content: z2.string().min(1)
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const senderId = ctx.user.id;
    const userIds = [senderId, input.receiverId].sort((a, b) => a - b);
    const conversationId = `${input.propertyId}-${userIds[0]}-${userIds[1]}`;
    const [newMessage] = await db.insert(messages).values({
      conversationId,
      propertyId: input.propertyId,
      senderId,
      receiverId: input.receiverId,
      content: input.content,
      isRead: false
    }).returning({ id: messages.id });
    const createdMessage = await db.select().from(messages).where(eq2(messages.id, newMessage.id)).limit(1);
    return createdMessage[0];
  }),
  // Mark conversation as read
  markAsRead: protectedProcedure.input(z2.object({
    conversationId: z2.string()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(messages).set({ isRead: true }).where(
      and2(
        eq2(messages.conversationId, input.conversationId),
        eq2(messages.receiverId, ctx.user.id)
      )
    );
    return { success: true };
  })
});

// server/verification.ts
import { z as z3 } from "zod";
import { eq as eq3 } from "drizzle-orm";
import { TRPCError as TRPCError3 } from "@trpc/server";
function generateVerificationCode() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
var verificationRouter = router({
  // Request verification code
  requestCode: protectedProcedure.input(z3.object({
    phone: z3.string().min(10)
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1e3);
    await db.update(users).set({
      phone: input.phone,
      verificationCode: code,
      verificationCodeExpiry: expiry
    }).where(eq3(users.id, ctx.user.id));
    console.log(`[Verification] Code for user ${ctx.user.id}: ${code}`);
    return {
      success: true,
      message: "Codice di verifica inviato al tuo numero",
      // Remove this in production:
      debugCode: process.env.NODE_ENV === "development" ? code : void 0
    };
  }),
  // Verify code
  verifyCode: protectedProcedure.input(z3.object({
    code: z3.string().length(6)
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq3(users.id, ctx.user.id)).limit(1);
    if (!user) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: "Utente non trovato"
      });
    }
    if (!user.verificationCode || !user.verificationCodeExpiry) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "Nessun codice di verifica richiesto"
      });
    }
    if (/* @__PURE__ */ new Date() > user.verificationCodeExpiry) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "Codice di verifica scaduto"
      });
    }
    if (user.verificationCode !== input.code) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "Codice di verifica non valido"
      });
    }
    await db.update(users).set({
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null
    }).where(eq3(users.id, ctx.user.id));
    return {
      success: true,
      message: "Account verificato con successo!"
    };
  }),
  // Upload identity document
  uploadDocument: protectedProcedure.input(z3.object({
    documentType: z3.enum(["passport", "id_card", "driver_license"]),
    documentNumber: z3.string(),
    documentUrl: z3.string().url()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users).set({
      idDocumentType: input.documentType,
      idDocumentNumber: input.documentNumber,
      idDocumentUrl: input.documentUrl,
      idDocumentVerified: false
      // Admin will verify
    }).where(eq3(users.id, ctx.user.id));
    return {
      success: true,
      message: "Documento caricato con successo. Verr\xE0 verificato dal nostro team."
    };
  })
});

// server/wishlist.ts
import { z as z4 } from "zod";
import { and as and3, eq as eq4 } from "drizzle-orm";
var wishlistRouter = router({
  // Get user's wishlist
  getWishlist: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const items = await db.select({
      id: wishlist.id,
      propertyId: wishlist.propertyId,
      createdAt: wishlist.createdAt,
      property: properties
    }).from(wishlist).leftJoin(properties, eq4(wishlist.propertyId, properties.id)).where(eq4(wishlist.userId, ctx.user.id));
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        if (!item.property) return item;
        const [firstImage] = await db.select().from(propertyImages).where(eq4(propertyImages.propertyId, item.property.id)).limit(1);
        return {
          ...item,
          property: {
            ...item.property,
            firstImage: firstImage?.imageUrl || null
          }
        };
      })
    );
    return enrichedItems;
  }),
  // Add property to wishlist
  addToWishlist: protectedProcedure.input(z4.object({
    propertyId: z4.number()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const existing = await db.select().from(wishlist).where(
      and3(
        eq4(wishlist.userId, ctx.user.id),
        eq4(wishlist.propertyId, input.propertyId)
      )
    ).limit(1);
    if (existing.length > 0) {
      return { success: true, message: "Gi\xE0 nei preferiti" };
    }
    await db.insert(wishlist).values({
      userId: ctx.user.id,
      propertyId: input.propertyId
    });
    return { success: true, message: "Aggiunto ai preferiti" };
  }),
  // Remove from wishlist
  removeFromWishlist: protectedProcedure.input(z4.object({
    propertyId: z4.number()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(wishlist).where(
      and3(
        eq4(wishlist.userId, ctx.user.id),
        eq4(wishlist.propertyId, input.propertyId)
      )
    );
    return { success: true, message: "Rimosso dai preferiti" };
  }),
  // Check if property is in wishlist
  isInWishlist: protectedProcedure.input(z4.object({
    propertyId: z4.number()
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(wishlist).where(
      and3(
        eq4(wishlist.userId, ctx.user.id),
        eq4(wishlist.propertyId, input.propertyId)
      )
    ).limit(1);
    return result.length > 0;
  })
});

// server/bankAccounts.ts
import { z as z5 } from "zod";
import { eq as eq5 } from "drizzle-orm";
import { TRPCError as TRPCError4 } from "@trpc/server";
function validateIBAN(iban) {
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();
  if (cleanIban.length < 15 || cleanIban.length > 34) {
    return false;
  }
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
  if (!ibanRegex.test(cleanIban)) {
    return false;
  }
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numericIban = rearranged.split("").map((char) => {
    const code = char.charCodeAt(0);
    return code >= 65 && code <= 90 ? (code - 55).toString() : char;
  }).join("");
  let remainder = numericIban;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(block.length);
  }
  return parseInt(remainder, 10) % 97 === 1;
}
function maskIBAN(iban) {
  const clean = iban.replace(/\s/g, "");
  if (clean.length <= 8) return iban;
  return `${clean.slice(0, 4)}${"*".repeat(clean.length - 8)}${clean.slice(-4)}`;
}
var bankAccountsRouter = router({
  // Get host's bank account
  getBankAccount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    if (ctx.user.role !== "host" && ctx.user.role !== "admin") {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "Solo i proprietari possono accedere ai dati bancari"
      });
    }
    const [account] = await db.select().from(bankAccounts).where(eq5(bankAccounts.userId, ctx.user.id)).limit(1);
    if (!account) {
      return null;
    }
    return {
      ...account,
      ibanMasked: maskIBAN(account.iban)
    };
  }),
  // Add or update bank account
  upsertBankAccount: protectedProcedure.input(
    z5.object({
      iban: z5.string().min(15).max(34),
      bankName: z5.string().min(2).max(255),
      accountHolderName: z5.string().min(2).max(255),
      swift: z5.string().min(8).max(11).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    if (ctx.user.role !== "host" && ctx.user.role !== "admin") {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "Solo i proprietari possono gestire i dati bancari"
      });
    }
    const cleanIban = input.iban.replace(/\s/g, "").toUpperCase();
    if (!validateIBAN(cleanIban)) {
      throw new TRPCError4({
        code: "BAD_REQUEST",
        message: "IBAN non valido. Verifica il codice inserito."
      });
    }
    const [existing] = await db.select().from(bankAccounts).where(eq5(bankAccounts.userId, ctx.user.id)).limit(1);
    if (existing) {
      await db.update(bankAccounts).set({
        iban: cleanIban,
        bankName: input.bankName,
        accountHolderName: input.accountHolderName,
        swift: input.swift || null,
        isVerified: false,
        // Reset verification on update
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(bankAccounts.userId, ctx.user.id));
      return {
        success: true,
        message: "Dati bancari aggiornati con successo"
      };
    } else {
      await db.insert(bankAccounts).values({
        userId: ctx.user.id,
        iban: cleanIban,
        bankName: input.bankName,
        accountHolderName: input.accountHolderName,
        swift: input.swift || null,
        isVerified: false
      });
      return {
        success: true,
        message: "Dati bancari aggiunti con successo"
      };
    }
  }),
  // Delete bank account
  deleteBankAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    if (ctx.user.role !== "host" && ctx.user.role !== "admin") {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "Solo i proprietari possono eliminare i dati bancari"
      });
    }
    await db.delete(bankAccounts).where(eq5(bankAccounts.userId, ctx.user.id));
    return {
      success: true,
      message: "Dati bancari eliminati con successo"
    };
  })
});

// server/routers.ts
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError5({
      code: "FORBIDDEN",
      message: "Solo gli amministratori possono accedere a questa risorsa"
    });
  }
  return next({ ctx });
});
var hostProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "host" && ctx.user.role !== "admin") {
    throw new TRPCError5({
      code: "FORBIDDEN",
      message: "Solo i proprietari possono accedere a questa risorsa"
    });
  }
  return next({ ctx });
});
var coerceNumber = (value) => {
  if (value === null || value === void 0) return void 0;
  if (typeof value === "string" && value.trim() === "") return void 0;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : void 0;
};
var appRouter = router({
  system: systemRouter,
  messaging: messagingRouter,
  verification: verificationRouter,
  wishlist: wishlistRouter,
  bankAccounts: bankAccountsRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    updateProfile: protectedProcedure.input(z6.object({
      name: z6.string().optional(),
      phone: z6.string().optional(),
      bio: z6.string().optional(),
      avatar: z6.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await upsertUser({
        openId: ctx.user.openId,
        ...input
      });
      return { success: true };
    }),
    becomeHost: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role === "host" || ctx.user.role === "admin") {
        throw new TRPCError5({
          code: "BAD_REQUEST",
          message: "Sei gi\xE0 un proprietario"
        });
      }
      await updateUserRole(ctx.user.id, "host");
      return { success: true, message: "Ora sei un proprietario!" };
    })
  }),
  properties: router({
    // Public: Get all approved properties
    list: publicProcedure.query(async () => {
      const properties2 = await getApprovedProperties();
      return properties2;
    }),
    // Public: Get property by ID with images and amenities
    getById: publicProcedure.input(z6.object({ id: z6.number() })).query(async ({ input }) => {
      const property = await getPropertyById(input.id);
      if (!property) {
        throw new TRPCError5({ code: "NOT_FOUND", message: "Propriet\xE0 non trovata" });
      }
      const images = await getPropertyImages(input.id);
      const amenities2 = await getPropertyAmenities(input.id);
      const rating = await getPropertyAverageRating(input.id);
      return { ...property, images, amenities: amenities2, rating };
    }),
    // Host: Get my properties
    myProperties: hostProcedure.query(async ({ ctx }) => {
      return await getPropertiesByHost(ctx.user.id);
    }),
    // Host: Create new property
    create: hostProcedure.input(z6.object({
      title: z6.string().min(10, "Il titolo deve contenere almeno 10 caratteri"),
      description: z6.string().min(50, "La descrizione deve contenere almeno 50 caratteri"),
      propertyType: z6.string(),
      pricePerNight: z6.preprocess(coerceNumber, z6.number().positive()),
      maxGuests: z6.number().min(1),
      bedrooms: z6.number().min(1),
      bathrooms: z6.number().min(1),
      squareMeters: z6.number().optional(),
      country: z6.string(),
      city: z6.string(),
      address: z6.string(),
      latitude: z6.preprocess(coerceNumber, z6.number()).optional(),
      longitude: z6.preprocess(coerceNumber, z6.number()).optional(),
      checkInTime: z6.string().default("15:00"),
      checkOutTime: z6.string().default("11:00"),
      minimumStay: z6.number().default(1)
    })).mutation(async ({ ctx, input }) => {
      const propertyId = await createProperty({
        ...input,
        hostId: ctx.user.id,
        status: "pending"
      });
      await createNotification({
        userId: ctx.user.id,
        type: "property_submitted",
        title: "Propriet\xE0 inviata per approvazione",
        message: `La tua propriet\xE0 "${input.title}" \xE8 stata inviata per l'approvazione dell'amministratore.`,
        relatedId: propertyId
      });
      return { success: true, propertyId };
    }),
    // Host: Add images to property
    addImages: hostProcedure.input(z6.object({
      propertyId: z6.number(),
      images: z6.array(z6.object({
        imageUrl: z6.string(),
        imageKey: z6.string(),
        caption: z6.string().optional(),
        isCover: z6.boolean().default(false)
      }))
    })).mutation(async ({ ctx, input }) => {
      const property = await getPropertyById(input.propertyId);
      if (!property || property.hostId !== ctx.user.id) {
        throw new TRPCError5({ code: "FORBIDDEN", message: "Non autorizzato" });
      }
      for (let i = 0; i < input.images.length; i++) {
        await addPropertyImage({
          propertyId: input.propertyId,
          ...input.images[i],
          displayOrder: i
        });
      }
      return { success: true };
    }),
    // Host: Add amenities to property
    addAmenities: hostProcedure.input(z6.object({
      propertyId: z6.number(),
      amenityIds: z6.array(z6.number())
    })).mutation(async ({ ctx, input }) => {
      const property = await getPropertyById(input.propertyId);
      if (!property || property.hostId !== ctx.user.id) {
        throw new TRPCError5({ code: "FORBIDDEN", message: "Non autorizzato" });
      }
      for (const amenityId of input.amenityIds) {
        await addPropertyAmenity({
          propertyId: input.propertyId,
          amenityId
        });
      }
      return { success: true };
    })
  }),
  amenities: router({
    // Public: Get all amenities
    list: publicProcedure.query(async () => {
      return await getAllAmenities();
    }),
    // Admin: Create amenity
    create: adminProcedure2.input(z6.object({
      name: z6.string(),
      icon: z6.string().optional(),
      category: z6.string()
    })).mutation(async ({ input }) => {
      const amenityId = await createAmenity(input);
      return { success: true, amenityId };
    })
  }),
  admin: router({
    // Get pending properties for approval
    pendingProperties: adminProcedure2.query(async () => {
      return await getPendingProperties();
    }),
    // Approve or reject property
    reviewProperty: adminProcedure2.input(z6.object({
      propertyId: z6.number(),
      action: z6.enum(["approve", "reject"]),
      rejectionReason: z6.string().optional()
    })).mutation(async ({ input }) => {
      const property = await getPropertyById(input.propertyId);
      if (!property) {
        throw new TRPCError5({ code: "NOT_FOUND", message: "Propriet\xE0 non trovata" });
      }
      const newStatus = input.action === "approve" ? "approved" : "rejected";
      await updatePropertyStatus(input.propertyId, newStatus, input.rejectionReason);
      const message = input.action === "approve" ? `La tua propriet\xE0 "${property.title}" \xE8 stata approvata ed \xE8 ora visibile sulla piattaforma!` : `La tua propriet\xE0 "${property.title}" \xE8 stata rifiutata. Motivo: ${input.rejectionReason || "Non specificato"}`;
      await createNotification({
        userId: property.hostId,
        type: input.action === "approve" ? "property_approved" : "property_rejected",
        title: input.action === "approve" ? "Propriet\xE0 approvata!" : "Propriet\xE0 rifiutata",
        message,
        relatedId: input.propertyId
      });
      return { success: true };
    })
  }),
  bookings: router({
    // Protected: Get my bookings as guest
    myBookings: protectedProcedure.query(async ({ ctx }) => {
      return await getBookingsByGuest(ctx.user.id);
    }),
    // Host: Get bookings for my properties
    hostBookings: hostProcedure.query(async ({ ctx }) => {
      return await getBookingsByHost(ctx.user.id);
    }),
    // Protected: Create booking
    create: protectedProcedure.input(z6.object({
      propertyId: z6.number(),
      checkInDate: z6.date(),
      checkOutDate: z6.date(),
      numberOfGuests: z6.number(),
      guestName: z6.string(),
      guestEmail: z6.string().email(),
      guestPhone: z6.string().optional(),
      specialRequests: z6.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const property = await getPropertyById(input.propertyId);
      if (!property) {
        throw new TRPCError5({ code: "NOT_FOUND", message: "Propriet\xE0 non trovata" });
      }
      const isAvailable = await checkPropertyAvailability(
        input.propertyId,
        input.checkInDate,
        input.checkOutDate
      );
      if (!isAvailable) {
        throw new TRPCError5({
          code: "BAD_REQUEST",
          message: "La propriet\xE0 non \xE8 disponibile per le date selezionate"
        });
      }
      const nights = Math.ceil((input.checkOutDate.getTime() - input.checkInDate.getTime()) / (1e3 * 60 * 60 * 24));
      const totalPrice = Math.round(property.pricePerNight * nights * 100) / 100;
      const bookingId = await createBooking({
        ...input,
        propertyId: input.propertyId,
        guestId: ctx.user.id,
        hostId: property.hostId,
        totalPrice,
        status: "pending",
        paymentStatus: "pending"
      });
      await createNotification({
        userId: property.hostId,
        type: "booking_request",
        title: "Nuova richiesta di prenotazione",
        message: `${input.guestName} ha richiesto una prenotazione per "${property.title}"`,
        relatedId: bookingId
      });
      return { success: true, bookingId, totalPrice };
    }),
    // Get booking by ID
    getById: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ ctx, input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError5({ code: "NOT_FOUND", message: "Prenotazione non trovata" });
      }
      if (booking.guestId !== ctx.user.id && booking.hostId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError5({ code: "FORBIDDEN", message: "Non autorizzato" });
      }
      return booking;
    })
  }),
  reviews: router({
    // Public: Get reviews for a property
    getByProperty: publicProcedure.input(z6.object({ propertyId: z6.number() })).query(async ({ input }) => {
      return await getReviewsByProperty(input.propertyId);
    }),
    // Protected: Create review
    create: protectedProcedure.input(z6.object({
      bookingId: z6.number(),
      propertyId: z6.number(),
      rating: z6.number().min(1).max(5),
      comment: z6.string().min(10),
      cleanlinessRating: z6.number().min(1).max(5).optional(),
      accuracyRating: z6.number().min(1).max(5).optional(),
      communicationRating: z6.number().min(1).max(5).optional(),
      locationRating: z6.number().min(1).max(5).optional(),
      valueRating: z6.number().min(1).max(5).optional()
    })).mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking || booking.guestId !== ctx.user.id) {
        throw new TRPCError5({ code: "FORBIDDEN", message: "Non autorizzato" });
      }
      if (booking.status !== "completed") {
        throw new TRPCError5({
          code: "BAD_REQUEST",
          message: "Puoi recensire solo dopo aver completato il soggiorno"
        });
      }
      const hasReviewed = await hasUserReviewedBooking(input.bookingId, ctx.user.id);
      if (hasReviewed) {
        throw new TRPCError5({
          code: "BAD_REQUEST",
          message: "Hai gi\xE0 recensito questa prenotazione"
        });
      }
      const reviewId = await createReview({
        ...input,
        guestId: ctx.user.id
      });
      await createNotification({
        userId: booking.hostId,
        type: "review_received",
        title: "Nuova recensione ricevuta",
        message: `Hai ricevuto una nuova recensione con ${input.rating} stelle`,
        relatedId: reviewId
      });
      return { success: true, reviewId };
    })
  }),
  messages: router({
    // Get conversation messages
    getConversation: protectedProcedure.input(z6.object({ conversationId: z6.string() })).query(async ({ ctx, input }) => {
      const messages2 = await getConversationMessages(input.conversationId);
      if (messages2.length > 0) {
        const firstMessage = messages2[0];
        if (firstMessage.senderId !== ctx.user.id && firstMessage.receiverId !== ctx.user.id) {
          throw new TRPCError5({ code: "FORBIDDEN", message: "Non autorizzato" });
        }
      }
      return messages2;
    }),
    // Send message
    send: protectedProcedure.input(z6.object({
      propertyId: z6.number(),
      receiverId: z6.number(),
      content: z6.string().min(1)
    })).mutation(async ({ ctx, input }) => {
      const property = await getPropertyById(input.propertyId);
      if (!property) {
        throw new TRPCError5({ code: "NOT_FOUND", message: "Propriet\xE0 non trovata" });
      }
      const conversationId = `${input.propertyId}-${Math.min(ctx.user.id, input.receiverId)}-${Math.max(ctx.user.id, input.receiverId)}`;
      const messageId = await createMessage({
        conversationId,
        propertyId: input.propertyId,
        senderId: ctx.user.id,
        receiverId: input.receiverId,
        content: input.content
      });
      await createNotification({
        userId: input.receiverId,
        type: "message_received",
        title: "Nuovo messaggio",
        message: `Hai ricevuto un nuovo messaggio da ${ctx.user.name || "un utente"}`,
        relatedId: messageId
      });
      return { success: true, messageId };
    }),
    // Mark messages as read
    markAsRead: protectedProcedure.input(z6.object({ conversationId: z6.string() })).mutation(async ({ ctx, input }) => {
      await markMessagesAsRead(input.conversationId, ctx.user.id);
      return { success: true };
    }),
    // Get unread count
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await getUnreadMessageCount(ctx.user.id);
    })
  }),
  notifications: router({
    // Get my notifications
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNotifications(ctx.user.id);
    }),
    // Mark notification as read
    markAsRead: protectedProcedure.input(z6.object({ id: z6.number() })).mutation(async ({ input }) => {
      await markNotificationAsRead(input.id);
      return { success: true };
    }),
    // Get unread count
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await getUnreadNotificationCount(ctx.user.id);
    })
  })
});

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString2(openId) || !isNonEmptyString2(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId: typeof appId === "string" ? appId : "",
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    const user = await getUserByOpenId(sessionUserId);
    if (!user) {
      throw ForbiddenError("User not found");
    }
    upsertUser({ openId: user.openId, lastSignedIn: signedInAt }).catch(() => {
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/oauth.ts
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
function getSupabaseAdmin() {
  if (!ENV.supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL is not set");
  }
  const key = ENV.supabaseServiceRoleKey || ENV.supabaseAnonKey;
  if (!key) {
    throw new Error("Neither SUPABASE_SERVICE_ROLE_KEY nor VITE_SUPABASE_ANON_KEY is set");
  }
  console.log("[Auth] Supabase client using key type:", ENV.supabaseServiceRoleKey ? "service_role" : "anon");
  return createClient(ENV.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
var oauthRouter = Router();
oauthRouter.get("/dev/login", async (req, res) => {
  try {
    const dummyUser = {
      openId: "dev-user-123",
      name: "Developer User",
      email: "dev@example.com",
      loginMethod: "dev",
      lastSignedIn: /* @__PURE__ */ new Date()
    };
    await upsertUser(dummyUser);
    const sessionToken = await sdk.createSessionToken(dummyUser.openId, {
      name: dummyUser.name,
      expiresInMs: ONE_YEAR_MS
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.redirect(302, "/");
  } catch (error) {
    console.error("[Auth] Dev login failed", error);
    res.status(500).json({ error: "Dev login failed" });
  }
});
oauthRouter.post("/auth/supabase-session", async (req, res) => {
  const { access_token } = req.body ?? {};
  if (!access_token || typeof access_token !== "string") {
    res.status(400).json({ error: "access_token is required" });
    return;
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(access_token);
    if (error || !data.user) {
      console.error("[Auth] Invalid Supabase token. Error:", error?.message ?? "no user returned");
      console.error("[Auth] supabaseUrl:", ENV.supabaseUrl ? "set" : "MISSING");
      console.error("[Auth] serviceRoleKey:", ENV.supabaseServiceRoleKey ? "set" : "MISSING");
      console.error("[Auth] anonKey:", ENV.supabaseAnonKey ? "set" : "MISSING");
      res.status(401).json({ error: error?.message ?? "Invalid token" });
      return;
    }
    const supabaseUser = data.user;
    const openId = supabaseUser.id;
    const email = supabaseUser.email ?? null;
    const name = supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? email?.split("@")[0] ?? "User";
    const loginMethod = supabaseUser.app_metadata?.provider ?? "email";
    await upsertUser({
      openId,
      name,
      email,
      loginMethod,
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    const savedUser = await getUserByOpenId(openId);
    if (!savedUser) {
      console.error("[Auth] User not found in DB after upsert \u2014 database connection may be failing");
      res.status(500).json({ error: "Database error: user could not be created" });
      return;
    }
    const sessionToken = await sdk.createSessionToken(openId, {
      name,
      expiresInMs: ONE_YEAR_MS
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ success: true });
  } catch (error) {
    console.error("[Auth] Supabase session error", error);
    res.status(500).json({ error: "Session creation failed" });
  }
});

// api/_handler.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api", oauthRouter);
app.use("/", oauthRouter);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
async function handler(req, res) {
  try {
    return app(req, res);
  } catch (error) {
    console.error("[API] Bootstrap failed", error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "API bootstrap failed", message });
  }
}
export {
  handler as default
};
