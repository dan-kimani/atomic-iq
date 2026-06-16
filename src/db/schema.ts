import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const recentContacts = sqliteTable(
  "recent_contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    phoneNumber: text("phone_number").notNull(),
    countryCode: text("country_code").notNull(),
    country: text("country").notNull(),
    flag: text("flag").notNull(),
    usedAt: integer("used_at").notNull(),
    notes: text("notes"),
    tags: text("tags"),
  },
  (table) => [
    index("idx_phone_number").on(table.phoneNumber),
    index("idx_used_at").on(table.usedAt),
  ],
);

export const broadcasts = sqliteTable("broadcasts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message: text("message").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const broadcastContacts = sqliteTable(
  "broadcast_contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    broadcastId: integer("broadcast_id")
      .notNull()
      .references(() => broadcasts.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull(),
    countryCode: text("country_code").notNull(),
    sent: integer("sent").notNull().default(0),
  },
  (table) => [index("idx_broadcast_id").on(table.broadcastId)],
);

export const messageTemplates = sqliteTable("message_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phoneNumber: text("phone_number").notNull(),
  countryCode: text("country_code").notNull(),
  message: text("message").notNull().default(""),
  scheduledAt: integer("scheduled_at").notNull(),
  notificationId: text("notification_id"),
  completed: integer("completed").notNull().default(0),
  priority: integer("priority").notNull().default(0),
  myDay: integer("my_day").notNull().default(0),
  tags: text("tags"),
  createdAt: integer("created_at").notNull(),
});

export const customTags = sqliteTable("custom_tags", {
  name: text("name").primaryKey(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const businessEvents = sqliteTable("business_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tags: text("tags"),
  period: text("period"),
  status: text("status").notNull().default("active"),
  reminderEnabled: integer("reminder_enabled").notNull().default(0),
  reminderInterval: text("reminder_interval"),
  reminderTime: text("reminder_time").notNull().default("09:00"),
  reminderDay: integer("reminder_day"),
  reminderNotificationId: text("reminder_notification_id"),
  lastRemindedAt: integer("last_reminded_at"),
  nextReminderAt: integer("next_reminder_at"),
  createdAt: integer("created_at").notNull(),
});
