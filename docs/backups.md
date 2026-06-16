# Cloud Sync & Backup — Specification

## Philosophy

The app is **local-first**. SQLite is always the source of truth. The remote API is a periodic mirror — not a real-time collaborator. This means:

- Every write hits the local database first and returns instantly. No network round-trip.
- Sync is a background concern: it runs on app foreground/background transitions and on a periodic timer while the app is open.
- If the network fails, the app is unaffected. Sync retries silently next time.
- Signing in is optional. Without an account, the app works exactly as it does today.

---

## 1. Authentication

### 1.1 Sign-in flow

```text
User taps "Sign in with Google"
       │
       ▼
Google Sign-In SDK opens native account picker
       │
       ▼
User selects account → SDK returns idToken
       │
       ▼
POST /api/auth/google  { idToken }
       │
       ▼
Server verifies idToken with Google, creates/looks up user, returns:
  { accessToken, refreshToken, user: { id, email, name, avatarUrl } }
       │
       ▼
Client stores:
  - refreshToken → expo-secure-store (encrypted keychain/keystore)
  - accessToken → in-memory (Zustand store)
  - user profile → in-memory (Zustand store)
```

### 1.2 Session restore (app launch)

```text
App launches
       │
       ▼
Read refreshToken from SecureStore
       │
       ├── not found → user is signed out (normal, no error shown)
       │
       └── found → POST /api/auth/refresh { refreshToken }
                       │
                       ├── success → user is signed in (fresh access token)
                       │
                       └── failure (expired/revoked) → clear SecureStore, signed out
```

### 1.3 Token refresh (during normal use)

```text
API request returns 401
       │
       ▼
Read refreshToken from SecureStore
       │
       ├── not found → sign user out
       │
       └── found → POST /api/auth/refresh
                       │
                       ├── success → store new tokens, retry original request
                       │
                       └── failure → clear SecureStore, sign user out
```

### 1.4 Sign-out

- Clear refresh token from SecureStore
- Clear access token and user from Zustand store
- Local data stays intact (the SQLite database is untouched)
- No API call needed (the server keeps the user's last snapshot; it'll be available if they sign back in)

### 1.5 Token lifetimes

| Token                | Lifetime                     | Storage                                                                 |
| -------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| Google idToken       | 1 hour (Google's default)    | Never stored — used once and discarded                                  |
| Access token (ours)  | 15 minutes                   | Memory only (Zustand)                                                   |
| Refresh token (ours) | 30 days, rotated on each use | `expo-secure-store` (iOS Keychain / Android EncryptedSharedPreferences) |

---

## 2. API Contract

All endpoints are under `https://api.atomiciq.com`. All authenticated endpoints require `Authorization: Bearer <accessToken>`.

### 2.1 Authentication

#### `POST /api/auth/google`

Exchange a Google idToken for our JWT pair.

```text
Request:
  Content-Type: application/json
  { "idToken": "<google-id-token>" }

Response 200:
  {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "user@gmail.com",
      "name": "User Name",
      "avatarUrl": "https://..." | null
    }
  }

Errors: 401 (invalid/expired Google token), 500
```

#### `POST /api/auth/refresh`

Get a new access token from a refresh token.

```text
Request:
  Content-Type: application/json
  { "refreshToken": "<jwt>" }

Response 200:
  {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"     // rotated — old one invalidated
  }

Errors: 401 (expired/revoked refresh token), 500
```

### 2.2 Sync

#### `GET /api/sync/status`

Get metadata about the server-side snapshot.

```text
Response 200:
  {
    "lastSyncedAt": 1717977600000,   // Unix ms timestamp
    "dbSizeBytes": 245760,
    "contactCount": 83,
    "reminderCount": 12,
    "templateCount": 8,
    "broadcastCount": 3
  }

Headers: Authorization required
Errors: 401
```

#### `POST /api/sync/push`

Upload the current local database snapshot.

```text
Request:
  Content-Type: multipart/form-data
  Parts:
    - file: <gzipped SQLite database binary>
    - metadata: (JSON string)
        {
          "appVersion": "0.0.4",
          "deviceTimestamp": 1717977600000,
          "contactCount": 47,
          "reminderCount": 12,
          "templateCount": 8,
          "broadcastCount": 3
        }

Response 200:
  {
    "ok": true,
    "serverTimestamp": 1717977600123
  }

Notes:
  - Server replaces the user's entire snapshot atomically.
  - Server may keep the last N snapshots for point-in-time restore (implementation detail — not needed by client).
  - Upload should use resumable transfer if the payload exceeds 1 MB (unlikely for this app).

Errors: 401, 413 (payload too large), 500
```

#### `GET /api/sync/pull`

Download the server-side database snapshot.

```text
Response 200:
  Content-Type: application/octet-stream
  X-Server-Timestamp: 1717977600123
  Body: <gzipped SQLite database binary>

Response 204:
  No data on server (user has never pushed)

Errors: 401, 500
```

---

## 3. Sync Architecture

### 3.1 The sync unit

The entire SQLite database file (`atomiciq.db`) is the sync unit. After WAL checkpoint, the file is self-contained and consistent. The client gzips it before upload. The server stores it as an opaque binary blob — it does not parse or interpret the data.

**Why full-file instead of delta sync:**

| Property                  | Full-file                                           | Delta (per-row change tracking)                          |
| ------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| Dataset size              | ~50–500 KB gzipped                                  | Same data, different encoding                            |
| Implementation complexity | Trivial — copy file, gzip, upload                   | Requires change-log table, ordering, conflict resolution |
| Restore complexity        | Trivial — download, unzip, replace file             | Replay changes in order, handle conflicts                |
| Failure modes             | Corrupted file (detectable via SQLite header)       | Partial replay, missed rows, ordering bugs               |
| Adequate for this app     | Yes — it's not a chat app with millions of messages | Over-engineered                                          |

Delta sync can be introduced later if the dataset grows significantly. The API contract supports it by adding an `?since=<timestamp>` parameter to `/api/sync/pull` and `/api/sync/push`.

### 3.2 Push flow

```text
1. Gate: if not signed in → skip
2. Gate: if last push < 15 min ago → skip (avoid thrashing)
3. Run PRAGMA wal_checkpoint(TRUNCATE)
     This flushes the write-ahead log into the main .db file.
4. Copy atomiciq.db to a temp file
     FileSystem.copyAsync({ from: dbPath, to: tmpDir + "/atomiciq.db" })
5. Gzip the copy
     The gzip can be done in pure JS (small file) or via a native module.
     Output: tmpDir + "/atomiciq.db.gz"
6. Build metadata: { appVersion, deviceTimestamp, contactCount, ... }
7. POST /api/sync/push (multipart: file + metadata)
8. On success:
     - Store serverTimestamp in SecureStore ("lastSyncTimestamp")
     - Store sync stats in SecureStore ("lastSyncStats")
9. Clean up temp files
10. On failure:
     - Network error → silent (try again next time)
     - 401 → refresh token, retry once. If still 401, sign out.
     - Other errors → log, try next time
```

### 3.3 Pull flow

```text
1. Gate: if not signed in → skip
2. Gate: if last pull < 6 hours ago → skip
3. GET /api/sync/pull
4. If 204 → no data on server, skip
5. Save response body to temp file (atomiciq.db.gz)
6. Gunzip to temp file (atomiciq.db)
7. Validate: check the SQLite file header (first 16 bytes: "SQLite format 3\000")
     If invalid → discard, log error, skip
8. Run PRAGMA wal_checkpoint(TRUNCATE) on current DB
     Ensure current DB is in a clean state before replacing it
9. Close the current Drizzle DB connection
10. Move the downloaded file over the live .db file
     FileSystem.moveAsync({ from: tmpDir + "/atomiciq.db", to: dbPath })
11. Reopen the DB connection
     Re-run the drizzle init logic from src/db/client.ts
12. Refresh all Zustand stores:
     - useAppStore.getState().loadRecentContacts()
     - useAppStore.getState().loadTemplates()
     - useBroadcastStore.getState().loadList()
     - useRemindersPageStore... (whatever is active)
13. Store serverTimestamp in SecureStore
14. Clean up temp files
```

### 3.4 Push/pull coordination

Push and pull never run concurrently. A simple mutex (boolean flag `isSyncing`) gates both. If a sync trigger fires while another sync is in progress, it's skipped — it'll catch the next one.

There's no merge logic. Pull **replaces** local data entirely. This works because:

1. The app always pushes before pulling (so local changes are uploaded before server data overwrites them).
2. Push is best-effort on background transitions.
3. In the rare case where a user made changes on device A, backgrounded (push started but failed), then immediately pulled on device A from device B's changes — device A's unsynced changes would be lost. This is an acceptable tradeoff for an MVP. The fix (if ever needed) is a per-row `updatedAt` timestamp and a simple "newer version wins" merge.

---

## 4. Sync Triggers

| Trigger                      | When                                             | Action                                   | Notes                                                                    |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------ |
| App goes to background       | `AppState` change to `"background"`              | `pushToServer()`                         | Best-effort. If it fails, try next time.                                 |
| App comes to foreground      | `AppState` change to `"active"`                  | `maybePull()`                            | Only pulls if last sync > 6 hours ago. Then pushes after pull completes. |
| Periodic (while app is open) | Every 6 hours from last sync                     | `pushToServer()` then `pullFromServer()` | Simple `setInterval` gated by `lastSyncTimestamp`.                       |
| Manual                       | User taps "Sync now" in settings                 | `pushToServer()` then `pullFromServer()` | Shows loading spinner, then success/failure toast.                       |
| After first sign-in          | Immediately after `signInWithGoogle()` completes | `pullFromServer()`                       | If server has data, ask: "Keep local or restore?" before pulling.        |

---

## 5. First Sign-In Merge

When a user signs in for the first time (or signs in on a new device), the server may already have data from another device. The client must handle this explicitly:

```text
1. User completes Google Sign-In.
2. Check GET /api/sync/status
3. If server has data:
   ┌──────────────────────────────────────────────┐
   │                                              │
   │  You have 47 contacts on this device.        │
   │  Your account has 83 contacts, 12 reminders, │
   │  and 8 templates from another device.        │
   │                                              │
   │  [Keep Local Data]  [Restore from Cloud]     │
   │                                              │
   └──────────────────────────────────────────────┘
4. "Keep Local Data":
     - pushToServer() immediately (overwrites server with local)
   "Restore from Cloud":
     - pullFromServer() (replaces local with server)
```

If the server has no data:

- pushToServer() immediately (upload local state)
- No dialog needed

---

## 6. Settings UI

### 6.1 Signed out

```text
── Account ─────────────────────────────────
  ┌──────────────────────────────────────────┐
  │  Google logo   Sign in with Google    →  │
  │              Sync your data across       │
  │              devices                     │
  └──────────────────────────────────────────┘
```

### 6.2 Signed in

```text
── Account ─────────────────────────────────
  ┌──────────────────────────────────────────┐
  │  Avatar  user@gmail.com                  │
  │          Last synced: 2 hours ago        │
  │          Database size: 245 KB           │
  └──────────────────────────────────────────┘
  ┌──────────────────────────────────────────┐
  │  🔄  Sync now                         →  │
  └──────────────────────────────────────────┘
  ┌──────────────────────────────────────────┐
  │  🚪  Sign out                            │
  └──────────────────────────────────────────┘
```

### 6.3 Sync now button states

| State          | Display                                                 |
| -------------- | ------------------------------------------------------- |
| Idle           | "Sync now" with chevron                                 |
| Syncing        | Spinner + "Syncing..." (disabled)                       |
| Just succeeded | "Synced just now" (for 3 seconds, then reverts to idle) |
| Failed         | "Sync failed — tap to retry"                            |

### 6.4 Privacy section (update)

Current text:

> "Your data stays on-device. All contacts, messages, reminders, and tags are stored locally in SQLite. Nothing leaves your phone."

When signed in, change to:

> "Your data is synced to your Google account. Access it on any device by signing in."

---

## 7. Security

### 7.1 Token storage

- **Refresh token**: `expo-secure-store` — iOS Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`, Android EncryptedSharedPreferences backed by the Android Keystore.
- **Access token**: Memory only (Zustand store). Lost on app restart — that's fine, the refresh token restores it.
- **Google idToken**: Never persisted. Used once during sign-in and discarded.

### 7.2 Network

- All API calls use HTTPS (enforced by the server via HSTS).
- Certificate pinning is not needed for an MVP but should be considered for production.

### 7.3 Data at rest on server

- The server receives the gzipped SQLite file as an opaque binary. Phone numbers, message content, and tags are inside it.
- The server must encrypt stored snapshots at rest (server-side concern, out of scope for mobile).
- For additional privacy, client-side encryption can be added later: encrypt the gzipped blob with a key derived from the user's Google id before upload. The server would store truly opaque data it cannot read. Not in MVP scope.

### 7.4 Sign-out and data removal

- Signing out only removes tokens from the device. Server data persists.
- To delete server data, the user would need a "Delete account" flow (or a server-side mechanism like an automatic purge after 90 days of inactivity).

---

## 8. Dependencies

````json
{
  "@react-native-google-signin/google-signin": "^13.0.0",
  "expo-secure-store": "~56.0.0",
  "expo-file-system": "~56.0.0"
}
```text

### 8.1 Why each dependency

| Dependency                                  | Purpose                                                                                                                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@react-native-google-signin/google-signin` | Native Google Sign-In SDK with account picker. Returns idToken. Requires a config plugin in `app.json` and a `google-services.json` (Android) / `GoogleService-Info.plist` (iOS) from a Firebase project or Google Cloud console. |
| `expo-secure-store`                         | Encrypted storage for the refresh token. Uses iOS Keychain and Android EncryptedSharedPreferences.                                                                                                                                |
| `expo-file-system`                          | Read/copy/move the SQLite database file for sync upload and download. Already commonly used in Expo projects.                                                                                                                     |

### 8.2 `app.json` changes

```json
{
  "expo": {
    "plugins": [
      ...existing plugins,
      "@react-native-google-signin/google-signin",
      "expo-secure-store"
    ],
    "android": {
      "googleServicesFile": "./android/app/google-services.json"
    },
    "ios": {
      "googleServicesFile": "./ios/GoogleService-Info.plist"
    }
  }
}
````

Google Sign-In requires `expo-dev-client` or a custom build — it won't work in Expo Go. The project already uses `eas build`, so this is compatible.

---

## 9. Error Handling

### 9.1 Network errors during sync

- All sync operations are wrapped in try/catch.
- Network failures are silent — the app continues working with local data.
- The next sync trigger will retry. No exponential backoff needed (triggers are spaced hours apart).

### 9.2 Corrupted server snapshot

- On pull: validate the SQLite file header before replacing the live database. If the first 16 bytes don't match `SQLite format 3\0`, discard and log an error.
- On push: the local file is already valid (SQLite is reading from it). If gzip fails, skip sync.

### 9.3 Token expired during sync

- The API client's 401 interceptor handles this: refresh the token, retry the request once.
- If refresh also fails → sign out (clear tokens). The sync silently stops. The user notices next time they check settings and sees they're signed out.

### 9.4 Concurrent sync

- A boolean flag `isSyncing` prevents overlapping sync operations.
- If a trigger fires while a sync is in progress, it logs and returns immediately.

---

## 10. Edge Cases

| Scenario                                                         | Behavior                                                                                                                                                  |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User signs in on device A, already has data on device B          | First sign-in merge dialog: "Keep local" or "Restore from cloud"                                                                                          |
| User signs out and signs back in                                 | `restoreSession` picks up the existing refresh token. If it's still valid, they're signed in seamlessly.                                                  |
| User revokes Google account access (via Google Account settings) | Refresh endpoint returns 401 → tokens cleared → signed out. Local data untouched.                                                                         |
| User clears app data (Android Settings → Clear Data)             | SQLite database deleted. Refresh token deleted (SecureStore is cleared with app data). User sees fresh install — sign in and pull from server to restore. |
| User uninstalls and reinstalls                                   | Same as above — fresh start, pull from server to restore.                                                                                                 |
| Server returns 204 on pull (no data)                             | First-time user — nothing to restore, just push local data.                                                                                               |
| App is killed during sync                                        | The partial temp file is left behind. Cleanup on next launch: delete any temp files in the sync temp directory.                                           |
| Very large database (unlikely but possible)                      | The push uses multipart form upload. If it becomes a concern (> 5 MB), switch to resumable upload with `Content-Range` headers.                           |

---

## 11. What's Explicitly Out of Scope

- **The API server** — defined here as a contract, built separately.
- **Apple Sign-In** — Google only for MVP. Apple will be required by App Store review if Google Sign-In is offered, so it must be added before iOS release.
- **Background fetch / WorkManager** — sync only triggers on foreground/background transitions and periodic in-app timer. No true background scheduling.
- **Client-side encryption** — the database file is uploaded as-is (gzipped). Encryption before upload can be added later.
- **Delta sync** — full file snapshot only. The API contract has `serverTimestamp` to enable `?since=` parameters later.
- **Merge on pull** — pull replaces local data entirely. Push runs first to upload local changes before overwriting.
- **Delete account** — sign out removes local tokens only. Server data persists. Account deletion requires a separate server endpoint.
- **Multi-device real-time sync** — this is periodic backup/restore, not real-time collaboration. Conflicts between devices are resolved by "last push wins."
