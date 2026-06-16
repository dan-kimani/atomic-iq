CREATE TABLE `business_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `tags` text,
  `period` text,
  `status` text NOT NULL DEFAULT 'active',
  `reminder_enabled` integer NOT NULL DEFAULT 0,
  `reminder_interval` text,
  `reminder_notification_id` text,
  `last_reminded_at` integer,
  `next_reminder_at` integer,
  `created_at` integer NOT NULL
);
