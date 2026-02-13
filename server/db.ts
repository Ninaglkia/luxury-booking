import { eq, and, gte, lte, desc, sql, inArray, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, 
  users, 
  properties, 
  propertyImages, 
  amenities, 
  propertyAmenities,
  bookings,
  reviews,
  messages,
  availabilityCalendar,
  notifications,
  InsertProperty,
  InsertPropertyImage,
  InsertAmenity,
  InsertPropertyAmenity,
  InsertBooking,
  InsertReview,
  InsertMessage,
  InsertAvailabilityCalendar,
  InsertNotification,
  User,
  Property,
  PropertyImage,
  Amenity,
  Booking,
  Review,
  Message,
  Notification
} from "../drizzle/schema.js";
import { ENV } from './_core/env.js';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "bio", "avatar"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
  }
}

export async function getUserByOpenId(openId: string): Promise<User | null> {
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

export async function updateUserRole(userId: number, role: 'guest' | 'host' | 'admin'): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user role:", error);
    throw error;
  }
}

// ============ PROPERTY OPERATIONS ============

export async function getApprovedProperties() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(properties).where(eq(properties.status, 'approved'));
  } catch (error) {
    console.error("[Database] Failed to get approved properties:", error);
    return [];
  }
}

export async function getPropertyById(id: number): Promise<Property | null> {
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

export async function getPropertyImages(propertyId: number): Promise<PropertyImage[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId))
      .orderBy(propertyImages.displayOrder);
  } catch (error) {
    console.error("[Database] Failed to get property images:", error);
    return [];
  }
}

export async function getPropertyAmenities(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Join propertyAmenities with amenities table
    const result = await db.select({
      id: amenities.id,
      name: amenities.name,
      icon: amenities.icon,
      category: amenities.category
    })
    .from(propertyAmenities)
    .innerJoin(amenities, eq(propertyAmenities.amenityId, amenities.id))
    .where(eq(propertyAmenities.propertyId, propertyId));
    
    return result;
  } catch (error) {
    console.error("[Database] Failed to get property amenities:", error);
    return [];
  }
}

export async function getPropertyAverageRating(propertyId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.select({
      avgRating: sql<number>`avg(${reviews.rating})`
    })
    .from(reviews)
    .where(eq(reviews.propertyId, propertyId));

    return Number(result[0]?.avgRating) || 0;
  } catch (error) {
    console.error("[Database] Failed to get property rating:", error);
    return 0;
  }
}

export async function getPropertiesByHost(hostId: number): Promise<Property[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(properties).where(eq(properties.hostId, hostId));
  } catch (error) {
    console.error("[Database] Failed to get properties by host:", error);
    return [];
  }
}

export async function createProperty(data: InsertProperty): Promise<number> {
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

export async function addPropertyImage(data: InsertPropertyImage): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(propertyImages).values(data);
  } catch (error) {
    console.error("[Database] Failed to add property image:", error);
    throw error;
  }
}

export async function addPropertyAmenity(data: InsertPropertyAmenity): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(propertyAmenities).values(data);
  } catch (error) {
    console.error("[Database] Failed to add property amenity:", error);
    throw error;
  }
}

export async function getAllAmenities(): Promise<Amenity[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(amenities);
  } catch (error) {
    console.error("[Database] Failed to get all amenities:", error);
    return [];
  }
}

export async function createAmenity(data: InsertAmenity): Promise<number> {
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

export async function getPendingProperties(): Promise<Property[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(properties).where(eq(properties.status, 'pending'));
  } catch (error) {
    console.error("[Database] Failed to get pending properties:", error);
    return [];
  }
}

export async function updatePropertyStatus(
  propertyId: number, 
  status: 'approved' | 'rejected', 
  rejectionReason?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(properties)
      .set({ status, rejectionReason })
      .where(eq(properties.id, propertyId));
  } catch (error) {
    console.error("[Database] Failed to update property status:", error);
    throw error;
  }
}

// ============ BOOKING OPERATIONS ============

export async function getBookingsByGuest(guestId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Join with properties to get property details
    const result = await db.select({
      booking: bookings,
      property: properties
    })
    .from(bookings)
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(bookings.guestId, guestId))
    .orderBy(desc(bookings.createdAt));
    
    return result.map(r => ({ ...r.booking, property: r.property }));
  } catch (error) {
    console.error("[Database] Failed to get bookings by guest:", error);
    return [];
  }
}

export async function getBookingsByHost(hostId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select({
      booking: bookings,
      property: properties,
      guest: users
    })
    .from(bookings)
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .innerJoin(users, eq(bookings.guestId, users.id))
    .where(eq(bookings.hostId, hostId))
    .orderBy(desc(bookings.createdAt));
    
    return result.map(r => ({ 
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

export async function checkPropertyAvailability(
  propertyId: number, 
  checkIn: Date, 
  checkOut: Date
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Check overlapping bookings
    // Existing booking overlaps if: (StartA <= EndB) and (EndA >= StartB)
    const overlaps = await db.select({ count: count() })
      .from(bookings)
      .where(and(
        eq(bookings.propertyId, propertyId),
        inArray(bookings.status, ['confirmed', 'pending']),
        lte(bookings.checkInDate, checkOut),
        gte(bookings.checkOutDate, checkIn)
      ));
      
    if (overlaps[0].count > 0) return false;

    // Check availability calendar (blocked dates)
    const blocked = await db.select({ count: count() })
      .from(availabilityCalendar)
      .where(and(
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

export async function createBooking(data: InsertBooking): Promise<number> {
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

export async function getBookingById(id: number): Promise<Booking | null> {
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

// ============ REVIEW OPERATIONS ============

export async function getReviewsByProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select({
      review: reviews,
      guest: users
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.guestId, users.id))
    .where(eq(reviews.propertyId, propertyId))
    .orderBy(desc(reviews.createdAt));
    
    return result.map(r => ({
      ...r.review,
      guestName: r.guest.name || 'Anonymous',
      guestAvatar: r.guest.avatar
    }));
  } catch (error) {
    console.error("[Database] Failed to get reviews:", error);
    return [];
  }
}

export async function hasUserReviewedBooking(bookingId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db.select({ count: count() })
      .from(reviews)
      .where(and(
        eq(reviews.bookingId, bookingId),
        eq(reviews.guestId, userId)
      ));
      
    return result[0].count > 0;
  } catch (error) {
    console.error("[Database] Failed to check review status:", error);
    return false;
  }
}

export async function createReview(data: InsertReview): Promise<number> {
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

// ============ MESSAGING OPERATIONS ============

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  } catch (error) {
    console.error("[Database] Failed to get messages:", error);
    return [];
  }
}

export async function createMessage(data: InsertMessage): Promise<number> {
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

export async function markMessagesAsRead(conversationId: string, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));
  } catch (error) {
    console.error("[Database] Failed to mark messages as read:", error);
    throw error;
  }
}

export async function getUnreadMessageCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));
      
    return result[0].count;
  } catch (error) {
    console.error("[Database] Failed to get unread message count:", error);
    return 0;
  }
}

// ============ NOTIFICATION OPERATIONS ============

export async function createNotification(data: InsertNotification): Promise<number> {
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

export async function getUserNotifications(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get user notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  } catch (error) {
    console.error("[Database] Failed to mark notification as read:", error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
      
    return result[0].count;
  } catch (error) {
    console.error("[Database] Failed to get unread notification count:", error);
    return 0;
  }
}
