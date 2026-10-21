# Atomic IQ 💬

Reach your customers on WhatsApp in seconds — no contact clutter, no friction. Chat, call, broadcast, and schedule follow-ups without saving a single number. Built for business owners who move fast. Built with **Expo**, **@expo/ui**, and **SQLite** (Drizzle ORM).

## 👤 Who This Is For

You run a business and your customers are on WhatsApp. You need to reach them quickly — without saving every number to your personal contacts. You send order updates, payment confirmations, appointment reminders, or promotional broadcasts. You don't want a heavy CRM. You want something fast that lives on your phone.

**Perfect for:** real estate agents, delivery services, salons & barbers, freelancers, small retailers, service providers, and anyone who messages customers on WhatsApp daily.

---

## ✨ Features

### 📲 Reach Customers Instantly

- **One-tap Chat or Call**: Type a customer's number and you're talking to them in seconds — no saving to your phonebook, no friction.
- **Smart Clipboard**: Copy a number anywhere (website, email, SMS) and the app detects it automatically. One tap to paste.
- **Recent Customers**: Every number you contact is saved locally in your history, with names pulled from your device contacts so you know who's who.

### 📢 Broadcast to Multiple Customers

- **Broadcast Mode**: Draft one message and send it to a list of customers one by one. Track who's been sent with a progress bar and checklist — pick up right where you left off, even after switching away from the app.
- **Customer Lists by Number**: Add recipients by phone number — no need to have them in your contacts.

### ⏰ Never Drop a Follow-up

- **Follow-up Reminders**: Schedule a reminder for any customer. Get a notification when it's time, tap it, and you're in WhatsApp with the message pre-filled.
- **Reminder Dashboard**: See overdue, upcoming, and completed follow-ups in one place. Mark them done or delete as you go.

### 📝 Message Faster with Templates

- **Quick Response Templates**: Save your most-used messages — order confirmations, payment requests, appointment reminders — and insert them with one tap.
- **Inline Message Composer**: Format your messages with **bold**, _italic_, ~strikethrough~, `monospace`, bullet lists, numbered lists, and blockquotes. A live preview shows exactly how the message will look before you send.

### 🌍 Works Across Borders

- **Auto Country Detection**: Type an international number and the app detects the country from the prefix — no manual selection needed.
- **Searchable Country Picker**: Need to switch countries? Search by name, code, or calling code, with flags for quick visual scanning.

### 🔒 Private by Default

- **On-device Storage**: All customer data stays on your phone (SQLite), not in the cloud. Your customer list is yours alone.
- **Dark Mode**: Easy on the eyes, follows your system preference.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 56](https://expo.dev) + [React Native 0.85](https://reactnative.dev) + [Expo Router](https://docs.expo.dev/router/introduction/)
- **UI**: [@expo/ui](https://docs.expo.dev/versions/latest/sdk/ui/) — every visible component is a native SwiftUI / Jetpack Compose primitive hosted through `@expo/ui`
- **Icons**: [@expo/ui Icon](https://docs.expo.dev/versions/latest/sdk/ui/) with SF Symbols on iOS and [@expo/material-symbols](https://github.com/expo/material-symbols) on Android
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) + [Drizzle ORM](https://orm.drizzle.team)
- **Notifications**: [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — local notifications for follow-up reminders
- **Countries**: [react-native-country-picker-modal](https://github.com/xcarpentier/react-native-country-picker-modal) (country dataset only; all picker UI is `@expo/ui`)
- **Clipboard**: [Expo Clipboard](https://docs.expo.dev/versions/latest/sdk/clipboard/)
- **Haptics**: [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
- **Device Contacts**: [Expo Contacts](https://docs.expo.dev/versions/latest/sdk/contacts/) + [Expo Intent Launcher](https://docs.expo.dev/versions/latest/sdk/intent-launcher/) (Android save-contact intent)
- **Date Formatting**: [date-fns](https://date-fns.org)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Yarn](https://yarnpkg.com/) (or Bun)
- **For Android native builds:**
  - [Android Studio](https://developer.android.com/studio) (install to `/opt/android-studio` on Linux)
  - Android SDK (platform-tools, build-tools, platform, NDK)
  - JDK 21+ (the JetBrains Runtime bundled with Android Studio works)

### Environment Setup (Linux)

Add these to your `~/.zshrc` (or `~/.bashrc`):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/opt/android-studio/jbr/
export PATH=${PATH}:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator:$JAVA_HOME/bin
```

Then reload your shell:

```bash
source ~/.zshrc
```

Verify the setup:

```bash
java -version          # should print OpenJDK 21.x
adb --version          # should print Android Debug Bridge version
sdkmanager --version   # should print version info
```

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/dannysofftie/atomiciq.git
   cd atomiciq
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

### 🏃‍♂️ Run Locally

**Dev server (Expo Go for quick testing):**

```bash
yarn start
```

- Scan the QR code with the **Expo Go** app (Android) or Camera app (iOS).
- Press `a` to open in Android Emulator or `i` to open in iOS Simulator.

Note: Some features (contacts, notifications) require a native dev build. Use the commands below for full functionality.

**Native Android build:**

```bash
yarn run android
```

**Native iOS build:**

```bash
yarn run ios
```

---

## 📦 Building for Production

### Android APK (Direct Install)

```bash
yarn build:android
```

This will generate `build/atomiciq.apk`. You can transfer this file to your phone and install it.

### Android App Bundle (Play Store)

```bash
yarn build:android:aab
```

This will generate `build/atomiciq.aab`.

---

## 📱 Project Structure

```sh
src/
├── app/                    # Expo Router file-based navigation
│   ├── _layout.tsx         # Root layout — theme, notification tap handler, toast viewport
│   ├── index.tsx           # Home — phone card, quick actions, recent contacts
│   ├── broadcast.tsx       # Broadcast list + creates a draft on “+”
│   ├── broadcast/          # Broadcast detail route
│   │   └── [id].tsx        #   Composer + recipient checklist
│   ├── business-events/    # Lead groups with recurring reminders
│   ├── reminders.tsx       # Follow-up reminders — list, filters, calendar
│   ├── templates.tsx       # Quick response templates
│   └── settings.tsx        # Preferences, data, backup, support
├── ui/                     # @expo/ui design system
│   ├── theme.ts            #   Palettes, typography, metrics, safe-area helpers
│   ├── screen.tsx          #   Native host shell (header + content)
│   ├── app-text.tsx        #   Typography wrapper over @expo/ui Text
│   ├── app-text-input.tsx  #   String ↔ native ObservableState bridge
│   ├── app-button.tsx      #   Button variants built from Row/Column
│   ├── app-icon.*.tsx      #   SF Symbols / Material Symbols / web glyphs
│   ├── confirm-sheet.tsx   #   Native bottom-sheet confirmation
│   ├── action-sheet.tsx    #   Native action menu
│   ├── toast.ts            #   In-app toast store
│   ├── toast-viewport.tsx  #   Native toast overlay
│   ├── message/            #   Composer, format bar, preview, template chips
│   ├── country/            #   Country trigger + native picker sheet
│   ├── contacts/           #   Contact rows + note sheet
│   ├── reminders/          #   Rows, sheet, filters, calendar, tag picker
│   ├── business-events/    #   Event rows + event form sheet
│   ├── broadcasts/         #   Broadcast row
│   └── ...
├── db/                     # SQLite database (expo-sqlite + Drizzle ORM)
│   ├── schema.ts           #   Tables — unchanged by the UI redesign
│   ├── client.ts           #   Database client with WAL mode, foreign keys, migrations
│   ├── index.ts            #   Query functions — full CRUD for all tables
│   └── migrations/         #   Drizzle SQL migrations
├── store/                  # Zustand state management (retained)
├── hooks/                  # useIsDark, useSmartClipboard (retained)
└── lib/                    # Haptics wrapper (retained)
```

### UI architecture

`@expo/ui` bridges to native SwiftUI on iOS and Jetpack Compose on Android, so it must be mounted inside a native `Host`. The app therefore keeps a thin React Native shell for routing and overlays, and every screen renders its header and content through `<Host>`:

```tsx
<View style={{ flex: 1 }}>
  <Host colorScheme={scheme} matchContents={{ vertical: true }}>
    <PageHeader title="Reminders" />
  </Host>
  <Host colorScheme={scheme} useViewportSizeMeasurement style={{ flex: 1 }}>
    <ScrollView>…</ScrollView>
  </Host>
  <BottomSheet isPresented={…}>…</BottomSheet>
</View>
```

- **No UI control or content primitive comes from React Native or a third-party UI kit.** Layout, text, buttons, inputs, switches, sheets, menus, list rows, calendar cells and the toast all use `@expo/ui` primitives.
- **React Native is only the navigation/overlay shell.** Transparent `View`s position native hosts and floating footers; `expo-router` owns navigation.
- **Native sheets instead of custom modals.** Confirmations, contact menus, reminder actions, tag picker, note editor, reminder/event forms and the country picker all use `@expo/ui`'s `BottomSheet` (SwiftUI sheet on iOS, Material modal sheet on Android).
- **Native text fields.** `AppTextInput` bridges the string state used by Zustand into the native `ObservableState` required by `@expo/ui`'s `TextInput`.
- **Platform-native icons.** `AppIcon.ios.tsx` uses SF Symbols; `AppIcon.android.tsx` uses Material Symbols XML drawables; `AppIcon.tsx` provides a web glyph fallback.

---

## 🔧 Key Design Details

- **Country auto-detection**: `setPhoneNumber` strips non-digits, searches a preloaded cache of all countries sorted by calling-code length (longest-match-first). Detects the country from the prefix and splits it from the local number in a single pass. Unchanged.
- **Notification deep link**: Tapping a reminder notification opens WhatsApp directly to the contact with the message pre-filled, via `Linking.openURL` in the `_layout.tsx` notification response listener.
- **Broadcast progress**: `sendToContact` marks the recipient as sent and reloads the checklist synchronously, so the progress UI updates immediately without an `AppState` listener.
- **Format-aware message preview**: `message-markup.ts` retains the WhatsApp markdown parser. `message-preview.ios.tsx` renders nested SwiftUI `Text` spans; `message-preview.android.tsx` renders nested Compose `Text` spans.
- **Contact actions**: Swipe gestures were replaced by the same native action sheet used elsewhere. It exposes Call, WhatsApp, SMS, Save contact, Notes & tags, Set reminder and Delete.
- **Theme**: The persisted `theme` setting now calls React Native's `Appearance.setColorScheme` and is passed to every native `Host` as `colorScheme`, so native controls and custom palettes stay in sync.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License.
