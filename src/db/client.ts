import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite";

import migrations from "./migrations/migrations";
import * as schema from "./schema";

const sqlite = openDatabaseSync("atomiciq.db");

sqlite.execSync("PRAGMA journal_mode = WAL");
sqlite.execSync("PRAGMA foreign_keys = ON");

const migrationDb = drizzle(sqlite);

/**
 * `migrate()` is async and commits in the background, so tables added by recent
 * migrations do not exist yet when this module finishes evaluating. Anything that
 * queries the database during startup must await this first, or it can fail with
 * "no such table".
 */
export const dbReady: Promise<void> = migrate(migrationDb, migrations)
  .then(() => undefined)
  .catch((error: unknown) => {
    console.error("[db] migration failed", error);
    throw error;
  });

export const db = drizzle(sqlite, { schema });
