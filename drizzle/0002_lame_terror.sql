CREATE TABLE `wishlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `verificationCodeExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `idDocumentType` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `idDocumentNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `idDocumentUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `idDocumentVerified` boolean DEFAULT false;