CREATE TABLE `bankAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`iban` varchar(34) NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`accountHolderName` varchar(255) NOT NULL,
	`swift` varchar(11),
	`isVerified` boolean DEFAULT false,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bankAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bankAccounts_userId_unique` UNIQUE(`userId`)
);
