# Rules

## Conventions

- Do not run any dev or build commands.
- You can only run test, lint, format-check, and typecheck commands.
- Report the exact command and its output when a check fails; do not "fix" unrelated failures.

## Package manager

- **Bun only.** Never use `npm`, `npx`, `yarn`, or `pnpm` — not for installs, scripts, or one-off binaries.
- Install with `bun add` / `bun add -d`; run scripts with `bun run <script>`; run binaries with `bunx <bin>`.
- `bun.lock` is the only lockfile. Never delete it or regenerate it with another package manager.
- If `bun` is not on `PATH`: `export PATH="$HOME/.bun/bin:$PATH"`.
- `README.md` still says Yarn — it is stale. Use Bun.

## Allowed commands

```bash
bun run lint          # oxlint
bun run format:check  # oxfmt, read-only
bunx tsc --noEmit     # typecheck
```

These rewrite files but are still allowed:

```bash
bun run lint:fix
bun run format
```

There is no test suite yet. Do not invent a test command.

## Forbidden commands

Never run these, or anything that wraps them:

```bash
bun run start android ios web
bun run build:*            # eas build
expo start / run:* / export / prebuild / prebuild --clean
./gradlew ...              # includes app:assembleDebug
eas build
bun run install:aab        # broken: ./scripts/ does not exist
```

`expo prebuild` is especially destructive: `android/` is checked in and hand-tuned.

Ask before running dependency or schema tooling, and use Bun when you do:

```bash
bun add <pkg> / bun remove <pkg>
bunx expo install <pkg>
bunx drizzle-kit generate
```

## Environment

- Android SDK is at `~/Android/Sdk`; `ANDROID_HOME` is not set.
- `android/local.properties` (gitignored, required) must contain `sdk.dir=/home/danny/Android/Sdk`. Do not commit it.
- JDK 17 is what this machine has and it builds; the README's "JDK 21+" is stale.

## Code style

- Format with oxfmt via `.oxfmtrc.json`: double quotes, semicolons, 2-space indent, print width 100, trailing commas, sorted imports. Prefer `bun run format` over hand-formatting.
- Imports are relative. There is no `@/` alias.
- File names are kebab-case (`country-picker-sheet.tsx`).
- Layout: screens in `src/app/` (Expo Router root), components in `src/ui/`, Zustand stores in `src/store/`, Drizzle in `src/db/`.
- Migrations live in `src/db/migrations/*.sql` and are generated, never hand-written or hand-edited.
- `docs/features.md` is the feature blueprint. The README's stack section is stale (it says SDK 56 / RN 0.85; actual is SDK 58 / RN 0.88).

## Guardrails

- Never touch release signing: `android/app/release.keystore`, `keystore.properties`, `*.jks`, `*.key`, `*.pem`.
- Do not edit files under `android/` unless the task is specifically about Android.
- `android/` is checked in and is the source of truth. Native fields in `app.config.js` (`scheme`, `icon`, `orientation`, `userInterfaceStyle`, `android`, `plugins`) are **not** applied by EAS Build or `expo run:android`; a human must run `bunx expo prebuild` after changing them. Expo Doctor's sync check is intentionally disabled for this reason (`expo.doctor.appConfigFieldsNotSyncedCheck` in `package.json`).
- Do not revert or reformat unrelated working-tree changes; this repo often has a large in-progress refactor.

## Commits

Only if asked to commit. Subjects use a short lowercase area prefix, matching history — not Conventional Commits:

```text
ui: extract reusable components
db: add settings key-value table
build: bump version to 0.0.5
```
