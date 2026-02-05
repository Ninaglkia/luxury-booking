CREATE TABLE `amenities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`icon` varchar(50),
	`category` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `amenities_id` PRIMARY KEY(`id`),
	CONSTRAINT `amenities_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `availabilityCalendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`date` timestamp NOT NULL,
	`isAvailable` boolean DEFAULT true,
	`reason` varchar(100),
	`bookingId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `availabilityCalendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`guestId` int NOT NULL,
	`hostId` int NOT NULL,
	`checkInDate` timestamp NOT NULL,
	`checkOutDate` timestamp NOT NULL,
	`numberOfGuests` int NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`paymentStatus` enum('pending','paid','refunded','failed') NOT NULL DEFAULT 'pending',
	`guestName` varchar(255) NOT NULL,
	`guestEmail` varchar(320) NOT NULL,
	`guestPhone` varchar(20),
	`specialRequests` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` varchar(100) NOT NULL,
	`propertyId` int NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedId` int,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`propertyType` varchar(50) NOT NULL,
	`pricePerNight` decimal(10,2) NOT NULL,
	`maxGuests` int NOT NULL,
	`bedrooms` int NOT NULL,
	`bathrooms` int NOT NULL,
	`squareMeters` int,
	`country` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`address` text NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`status` enum('pending','approved','rejected','inactive') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`checkInTime` varchar(10) DEFAULT '15:00',
	`checkOutTime` varchar(10) DEFAULT '11:00',
	`minimumStay` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAmenities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`amenityId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyAmenities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(255) NOT NULL,
	`caption` varchar(255),
	`displayOrder` int DEFAULT 0,
	`isCover` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`bookingId` int NOT NULL,
	`guestId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text NOT NULL,
	`cleanlinessRating` int,
	`accuracyRating` int,
	`communicationRating` int,
	`locationRating` int,
	`valueRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('guest','host','admin') NOT NULL DEFAULT 'guest';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;