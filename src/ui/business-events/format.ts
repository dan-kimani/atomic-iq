import type { BusinessEventData } from "../../store/useBusinessEventStore";

export function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function fmtReminderSchedule(event: BusinessEventData): string | null {
  if (!event.reminderEnabled || !event.reminderInterval) return null;
  const interval = event.reminderInterval;
  const label = interval.charAt(0).toUpperCase() + interval.slice(1);
  const timeParts = (event.reminderTime ?? "09:00").split(":");
  const hour = parseInt(timeParts[0] ?? "9", 10);
  const minute = parseInt(timeParts[1] ?? "0", 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const time = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;

  if (interval === "daily") return `${label} at ${time}`;

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (interval === "weekly" || interval === "biweekly") {
    const day = event.reminderDay != null ? weekdays[event.reminderDay] : null;
    return day ? `${label} on ${day} at ${time}` : `${label} at ${time}`;
  }
  if (interval === "monthly") {
    const day = event.reminderDay != null ? `${event.reminderDay}th` : null;
    return day ? `${label} on ${day} at ${time}` : `${label} at ${time}`;
  }
  return `${label} at ${time}`;
}

export function formatEventPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  const last = cleaned.slice(-9);
  const groups = last.match(/^(\d{1,3})(\d{1,3})?(\d{1,4})?$/);
  if (!groups) return phone;
  return [groups[1], groups[2], groups[3]].filter(Boolean).join(" ");
}
