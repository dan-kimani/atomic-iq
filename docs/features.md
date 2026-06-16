# Atomic IQ — Feature Blueprint

## What the app does

Atomic IQ lets you open WhatsApp chats and call any phone number without saving it to your contacts first. On top of that, it handles reminders, message templates, and broadcast messaging — all from a single phone number input.

Everything is stored locally on the device. There are no accounts, no servers, no telemetry.

---

## Modules

### 1. Phone input & country detection

The core of the app. You type a number, the app figures out which country it belongs to and opens WhatsApp or the dialer.

- As you type, it detects the country from the international prefix (e.g. `+254` → Kenya) and updates the country selector automatically.
- If you start without a prefix, it uses whatever country you've selected.
- The number is formatted in readable groups as you type. A raw version is kept behind the scenes for programmatic use.
- Validation kicks in at 9+ digits — buttons light up when the number is usable.

**Key components:** `PhoneInput`, `StartChatButton`
**Store:** `useAppStore` (phone state, country selection)

### 2. Country picker

A searchable bottom sheet with every country. Opens when you tap the country trigger on the home screen.

- Search by country name, calling code, or ISO code. Instant filtering.
- Selecting a country updates the phone input context and closes the sheet.
- The country list is sorted so longer calling codes match first (important for countries that share prefixes).

**Key components:** `CountryTrigger`, `CountryPickerSheet`

### 3. Recent contacts

Every number you message or call is automatically saved here. Think of it as a lightweight call log.

- Shows when you last contacted each number ("2 hours ago").
- If you grant contacts permission, it resolves numbers to names from your address book.
- Each contact has a context menu with: Call, WhatsApp, Save to device contacts, Add note, Set reminder.
- Swipe right on a contact → SMS. Swipe left → delete.
- Notes and tags appear as colored badges on the contact row.

**Key components:** `RecentContactsList`, `ContactItem`, `ContactMenu`, `SwipeDeleteAction`, `SwipeSmsAction`

### 4. Contact notes & tags

Attach a free-text note and tags to any recent contact. Opens as a bottom sheet.

- Notes are just a multiline text field — whatever you want to remember about this person.
- Tags are shared across the entire app. The tag pool merges tags from contacts, reminders, and custom tags you've created. You can search and toggle them.
- Tags you add here become available everywhere else (reminders, other contacts).

**Key components:** `NoteSheet`
**Related:** Tags live in a shared pool (`custom_tags`) accessible from any module

### 5. Message editor & formatting

A rich text composer that appears when you want to pre-fill a WhatsApp message.

- Toggle it open with "Add a message" after entering a valid number.
- Format bar with WhatsApp-compatible markers: bold, italic, strikethrough, monospace, bullet lists, numbered lists, blockquotes.
- Select text and tap a format button to wrap it. No selection → inserts markers at the cursor.
- Live preview renders the formatting visually so you can check it before sending.
- Template chips sit above the editor — horizontal scroll of saved snippets. Tap one to insert it.

**Key components:** `MessageEditor`, `FormatBar`, `MessagePreview`, `TemplateChips`

### 6. Message templates (Quick Responses)

A library of reusable message snippets. Lives on its own screen, accessible from the home header.

- Create, edit, copy, or delete templates.
- Templates also appear as chips above the message editor on the home screen and in broadcasts — tap to insert.
- Editing a template opens the full message editor with format bar inline.

**Screen:** Templates
**Components:** `TemplateItem`, `TemplateChips`

### 7. Reminders

Schedule a follow-up WhatsApp message for a specific date and time. The app sends you a local notification; tapping it opens WhatsApp with the number and message pre-filled.

- **Creating:** From a contact's context menu → "Set reminder". Pick a time preset (1 hour, 3 hours, tomorrow 8 AM, tomorrow 11 AM, or custom), write the message, optionally tag it and set priority.
- **List view:** Three sections — Overdue (red), Upcoming, Completed. Filter by My Day (today), High Priority, or specific tags.
- **Calendar view:** Month grid with colored dots showing which dates have reminders (indigo = upcoming, red = overdue, green = done). Tap a date to see its reminders.
- **Managing:** Each reminder has a menu — WhatsApp (opens the chat), Edit/Reschedule, Complete/Reopen, Delete.
- **My Day:** A toggle that pins a reminder to today's view regardless of its scheduled date. Useful for things you want visible now.
- **High Priority:** Starred reminders get an amber badge and their own filter.

**Screen:** Reminders
**Components:** `ReminderSheet`, `ReminderItem`, `ReminderMenu`, `FilterBar`, `CalendarView`, `TagPickerModal`
**Stores:** `useReminderStore` (form state), `useRemindersPageStore` (list/filter/calendar state)

### 8. Broadcasts

Send the same WhatsApp message to multiple recipients, one at a time.

- **Creating:** Tap + from the broadcast list. You land on a detail page with a message editor and an "add contact" input.
- **Adding contacts:** Type a number and tap +. Uses the country code from the home screen. Each contact appears as a checklist row.
- **Sending:** Each contact has a "Send" button that opens WhatsApp with that person and the broadcast message. When you return to the app, it marks that contact as sent.
- **Progress:** A bar shows sent/total. A floating "Send to next contact" button jumps to the next unsent recipient.
- **Done state:** When all contacts are sent, a green banner confirms it.

**Screen:** Broadcast List, Broadcast Detail
**Store:** `useBroadcastStore`

### 9. Smart clipboard detection

When you come back to the app, it checks your clipboard for something that looks like a phone number. If found, a "Paste" chip appears above the phone input. Tapping it fills the number.

This is optional — there's a toggle in Settings to disable it.

**Hook:** `useSmartClipboard`
**Store setting:** `clipboardDetection` in `useAppStore`

### 10. Notifications

The app uses local notifications for reminders. No push notifications, no server.

- On first launch, it asks for notification permission.
- When you create a reminder, the app schedules a local notification for that time.
- Tapping the notification opens WhatsApp with the phone number and message from the reminder.
- If you edit or delete a reminder, the corresponding notification is cancelled and rescheduled.

**Setup:** `_layout.tsx` configures the notification handler

### 11. Settings

A straightforward settings screen accessible from the home header.

|Section|What's there|
|-|-|
|Preferences|Default country (placeholder), clipboard detection toggle|
|Notifications|Reminder sound toggle|
|Appearance|Current theme (follows system), haptic feedback status|
|Data|Clear buttons for contacts, templates, reminders, broadcasts — each with confirmation|
|Privacy|Statement that all data is local|
|Support|Rate app, share, send feedback via WhatsApp|
|About|App version|

**Screen:** Settings

### 12. Dark mode

Follows your device setting automatically. Every screen and component adapts — backgrounds, cards, text, borders, inputs. No manual toggle.

### 13. Haptic feedback

Used throughout the app for tactile feedback: light taps for selections, medium impacts for primary actions (chat, call), success/warning notifications for outcomes.

---

## How the modules connect

```text
Home screen
  ├── Country picker ← sets the country code
  ├── Phone input ← uses country code for placeholder & validation
  ├── Clipboard detection ← feeds into phone input
  ├── Message editor ← uses templates from the templates screen
  │     └── Template chips ← tap inserts text into editor
  ├── Start Chat / Call ← reads phone + country + message
  │     └── On open → auto-saves to recent contacts
  └── Recent contacts list
        ├── Contact menu → Call, WhatsApp, Save to device, Note, Reminder
        ├── Note sheet → writes notes & tags (shared tag pool)
        └── Reminder sheet → schedules notification
                              → appears in Reminders screen

Reminders screen
  ├── Filter bar → My Day, Priority, Tags (shared tag pool)
  ├── Reminder items → menu: WhatsApp, Edit, Complete, Delete
  └── Calendar view → dot indicators link to specific dates

Templates screen
  └── Templates → appear as chips in message editors (home + broadcasts)

Broadcasts
  ├── Message editor → same as home, with template chips
  └── Contact list → each row opens WhatsApp, tracks sent status

Settings
  └── Toggles & data clearing → affects behavior across modules
```

---

## Data that crosses module boundaries

- **Tags** are the main shared entity. A tag created on a reminder is available when tagging a contact, and vice versa. The shared tag pool is the single source of truth. Deleting a tag from the tag picker removes it from all reminders and the shared pool.

- **Templates** live on their own screen but surface as chips in the home screen message editor and broadcast detail. Adding a template inline from the chips also adds it to the templates screen.

- **Recent contacts** are written to automatically whenever you open WhatsApp or the dialer — from the home screen buttons, from the contact menu, from a reminder, or from a broadcast send.

- **Country selection** on the home screen flows into the broadcast "add contact" input so you don't have to re-select it.
