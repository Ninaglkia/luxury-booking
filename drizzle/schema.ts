import { pgTable, serial, text, boolean, timestamp, doublePrecision, integer, pgEnum } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extended with role field for guest/host/admin access control
 */
export const roleEnum = pgEnum("role", ["guest", "host", "admin"]);

export const users = pgTable("users", {
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
  idDocumentType: text("idDocumentType"), // passport, id_card, driver_license
  idDocumentNumber: text("idDocumentNumber"),
  idDocumentUrl: text("idDocumentUrl"),
  idDocumentVerified: boolean("idDocumentVerified").default(false),
  
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(), // onUpdateNow not supported directly in pg-core usually, handled by triggers or manual update
  lastSignedIn: timestamp("lastSignedIn").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Properties (Ville di lusso)
 * Stores luxury villa listings with approval workflow
 */
export const statusEnum = pgEnum("status", ["pending", "approved", "rejected", "inactive"]);

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  hostId: integer("hostId").notNull(), // Foreign key to users table
  title: text("title").notNull(),
  description: text("description").notNull(),
  propertyType: text("propertyType").notNull(), // villa, mansion, estate, etc.
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
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Property Images
 * Multiple images per property for professional galleries
 */
export const propertyImages = pgTable("propertyImages", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(), // S3 key for management
  caption: text("caption"),
  displayOrder: integer("displayOrder").default(0),
  isCover: boolean("isCover").default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = typeof propertyImages.$inferInsert;

/**
 * Amenities (Servizi)
 * Luxury amenities like pool, sea view, mountain view, etc.
 */
export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon"), // Lucide icon name
  category: text("category").notNull(), // view, facility, service, etc.
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Amenity = typeof amenities.$inferSelect;
export type InsertAmenity = typeof amenities.$inferInsert;

/**
 * Property Amenities (Many-to-many relationship)
 */
export const propertyAmenities = pgTable("propertyAmenities", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  amenityId: integer("amenityId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type PropertyAmenity = typeof propertyAmenities.$inferSelect;
export type InsertPropertyAmenity = typeof propertyAmenities.$inferInsert;

/**
 * Bookings (Prenotazioni)
 * Stores reservation information with payment status
 */
export const bookingStatusEnum = pgEnum("bookingStatus", ["pending", "confirmed", "cancelled", "completed"]);
export const paymentStatusEnum = pgEnum("paymentStatus", ["pending", "paid", "refunded", "failed"]);

export const bookings = pgTable("bookings", {
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
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Reviews (Recensioni)
 * Guest reviews after completed stays
 */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  bookingId: integer("bookingId").notNull(),
  guestId: integer("guestId").notNull(),
  
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment").notNull(),
  
  // Detailed ratings
  cleanlinessRating: integer("cleanlinessRating"),
  accuracyRating: integer("accuracyRating"),
  communicationRating: integer("communicationRating"),
  locationRating: integer("locationRating"),
  valueRating: integer("valueRating"),
  
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Messages (Messaggistica)
 * Real-time messaging between guests and hosts
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: text("conversationId").notNull(), // Format: "propertyId-guestId-hostId"
  propertyId: integer("propertyId").notNull(),
  senderId: integer("senderId").notNull(),
  receiverId: integer("receiverId").notNull(),
  
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Availability Calendar
 * Tracks blocked dates for each property
 */
export const availabilityCalendar = pgTable("availabilityCalendar", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  date: timestamp("date").notNull(),
  isAvailable: boolean("isAvailable").default(true),
  reason: text("reason"), // booked, blocked_by_host, maintenance
  bookingId: integer("bookingId"), // If blocked due to booking
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type AvailabilityCalendar = typeof availabilityCalendar.$inferSelect;
export type InsertAvailabilityCalendar = typeof availabilityCalendar.$inferInsert;

/**
 * Notifications
 * System notifications for users
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: text("type").notNull(), // booking_request, booking_confirmed, review_received, message_received, property_approved, property_rejected
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("relatedId"), // ID of related entity (booking, property, message, etc.)
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Wishlist (Preferiti)
 * Users can save properties to their wishlist
 */
export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  propertyId: integer("propertyId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Wishlist = typeof wishlist.$inferSelect;
export type InsertWishlist = typeof wishlist.$inferInsert;

/**
 * Bank Accounts
 * Bank account details for property hosts to receive payments
 */
export const bankAccounts = pgTable("bankAccounts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(), // One bank account per host
  
  // Bank details
  iban: text("iban").notNull(), // International Bank Account Number
  bankName: text("bankName").notNull(),
  accountHolderName: text("accountHolderName").notNull(),
  swift: text("swift"), // SWIFT/BIC code (optional)
  
  // Verification
  isVerified: boolean("isVerified").default(false),
  verifiedAt: timestamp("verifiedAt"),
  
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;
