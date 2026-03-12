CREATE TABLE `training_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`material_id` integer NOT NULL,
	`completed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`synced` integer DEFAULT false NOT NULL,
	`last_synced_at` integer,
	`remote_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`material_id`) REFERENCES `training_materials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `completions_user_idx` ON `training_completions` (`user_id`);--> statement-breakpoint
CREATE INDEX `completions_material_idx` ON `training_completions` (`material_id`);--> statement-breakpoint
CREATE INDEX `completions_synced_idx` ON `training_completions` (`synced`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_material_unique` ON `training_completions` (`user_id`,`material_id`);--> statement-breakpoint
CREATE TABLE `training_materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`category_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
