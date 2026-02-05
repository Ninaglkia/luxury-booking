CREATE TYPE "public"."bookingStatus" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."paymentStatus" AS ENUM('pending', 'paid', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('guest', 'host', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'approved', 'rejected', 'inactive');--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"category" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amenities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "availabilityCalendar" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"date" timestamp NOT NULL,
	"isAvailable" boolean DEFAULT true,
	"reason" text,
	"bookingId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bankAccounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"iban" text NOT NULL,
	"bankName" text NOT NULL,
	"accountHolderName" text NOT NULL,
	"swift" text,
	"isVerified" boolean DEFAULT false,
	"verifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bankAccounts_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"guestId" integer NOT NULL,
	"hostId" integer NOT NULL,
	"checkInDate" timestamp NOT NULL,
	"checkOutDate" timestamp NOT NULL,
	"numberOfGuests" integer NOT NULL,
	"totalPrice" double precision NOT NULL,
	"status" "bookingStatus" DEFAULT 'pending' NOT NULL,
	"stripePaymentIntentId" text,
	"paymentStatus" "paymentStatus" DEFAULT 'pending' NOT NULL,
	"guestName" text NOT NULL,
	"guestEmail" text NOT NULL,
	"guestPhone" text,
	"specialRequests" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"propertyId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"receiverId" integer NOT NULL,
	"content" text NOT NULL,
	"isRead" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"relatedId" integer,
	"isRead" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"hostId" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"propertyType" text NOT NULL,
	"pricePerNight" double precision NOT NULL,
	"maxGuests" integer NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"squareMeters" integer,
	"country" text NOT NULL,
	"city" text NOT NULL,
	"address" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"rejectionReason" text,
	"checkInTime" text DEFAULT '15:00',
	"checkOutTime" text DEFAULT '11:00',
	"minimumStay" integer DEFAULT 1,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyAmenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"amenityId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyImages" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"imageUrl" text NOT NULL,
	"imageKey" text NOT NULL,
	"caption" text,
	"displayOrder" integer DEFAULT 0,
	"isCover" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"propertyId" integer NOT NULL,
	"bookingId" integer NOT NULL,
	"guestId" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"cleanlinessRating" integer,
	"accuracyRating" integer,
	"communicationRating" integer,
	"locationRating" integer,
	"valueRating" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" text NOT NULL,
	"name" text,
	"email" text,
	"loginMethod" text,
	"role" "role" DEFAULT 'guest' NOT NULL,
	"phone" text,
	"bio" text,
	"avatar" text,
	"isVerified" boolean DEFAULT false,
	"verificationCode" text,
	"verificationCodeExpiry" timestamp,
	"idDocumentType" text,
	"idDocumentNumber" text,
	"idDocumentUrl" text,
	"idDocumentVerified" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"propertyId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
