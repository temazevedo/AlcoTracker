/**
 * Database migration runner for AlcoTracker.
 * Handles versioned SQL migrations with idempotent execution.
 */

import * as SQLite from 'expo-sqlite';
import { TABLE_NAMES } from './schema';

// Migration definitions - each migration has a version number and SQL file path
export const MIGRATIONS = [
  {
    version: 1,
    name: '001_initial_schema.sql',
    description: 'Create all 5 tables + indexes + db_version table',
  },
  {
    version: 2,
    name: '002_seed_definitions.sql',
    description: 'Insert 8 default drink definitions',
  },
] as const;

export type Migration = (typeof MIGRATIONS)[number];

/**
 * Get the current database version from db_version table.
 * Returns 0 if table doesn't exist or is empty.
 */
export async function getDbVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      `SELECT version FROM ${TABLE_NAMES.DB_VERSION} ORDER BY version DESC LIMIT 1`
    );
    return result?.version ?? 0;
  } catch {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Set the database version in db_version table.
 */
export async function setDbVersion(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO ${TABLE_NAMES.DB_VERSION} (version) VALUES (?)`,
    [version]
  );
}

/**
 * Read a migration SQL file from the bundled assets.
 * In Expo, we need to use the filesystem to read SQL files.
 */
async function readMigrationSql(fileName: string): Promise<string> {
  // For Expo, we'll embed the SQL directly in the migration definitions
  // to avoid filesystem complexity. The SQL is defined in the migration files
  // but we'll also embed them here for reliability.
  const migrationsSql: Record<string, string> = {
    '001_initial_schema.sql': `-- Migration 001: Initial schema
-- Creates all 5 tables + indexes + db_version table

-- Drink definitions table
CREATE TABLE IF NOT EXISTS drink_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  volume_ml INTEGER NOT NULL,
  abv REAL NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Drink entries table
CREATE TABLE IF NOT EXISTS drink_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  definition_id INTEGER,
  name_snapshot TEXT NOT NULL,
  volume_ml INTEGER NOT NULL,
  abv REAL NOT NULL,
  grams REAL NOT NULL,
  consumed_at TEXT NOT NULL,
  session_id INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (definition_id) REFERENCES drink_definitions(id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  interval_min INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Day notes table
CREATE TABLE IF NOT EXISTS day_notes (
  date TEXT PRIMARY KEY, -- YYYY-MM-DD format
  note TEXT NOT NULL
);

-- Profile settings table (singleton)
CREATE TABLE IF NOT EXISTS profile_settings (
  weight_kg REAL NOT NULL DEFAULT 70,
  sex TEXT NOT NULL DEFAULT 'male' CHECK (sex IN ('male', 'female')),
  units TEXT NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  bac_unit TEXT NOT NULL DEFAULT 'promille' CHECK (bac_unit IN ('promille', 'percent')),
  elimination_rate REAL NOT NULL DEFAULT 0.15,
  disclaimer_accepted_at TEXT
);

-- Database version tracking table
CREATE TABLE IF NOT EXISTS db_version (
  version INTEGER PRIMARY KEY
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_drink_entries_consumed_at ON drink_entries(consumed_at);
CREATE INDEX IF NOT EXISTS idx_drink_entries_session_id ON drink_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_drink_definitions_archived ON drink_definitions(is_archived);
CREATE INDEX IF NOT EXISTS idx_drink_definitions_favorite ON drink_definitions(is_favorite);`,

    '002_seed_definitions.sql': `-- Migration 002: Seed default drink definitions
-- Inserts 8 default drink definitions

INSERT OR IGNORE INTO drink_definitions (name, volume_ml, abv, is_favorite, is_archived, created_at)
VALUES
  ('Water/Juice', 330, 0.0, 1, 0, datetime('now')),
  ('Small beer', 200, 5.0, 1, 0, datetime('now')),
  ('Can of beer', 330, 5.0, 1, 0, datetime('now')),
  ('Pint', 500, 5.0, 0, 0, datetime('now')),
  ('Wine', 200, 12.0, 1, 0, datetime('now')),
  ('Typical cocktail', 150, 13.0, 0, 0, datetime('now')),
  ('Shot', 40, 40.0, 0, 0, datetime('now')),
  ('Spirit serving', 50, 40.0, 0, 0, datetime('now'));`,
  };

  const sql = migrationsSql[fileName];
  if (!sql) {
    throw new Error(`Migration SQL not found for: ${fileName}`);
  }
  return sql;
}

/**
 * Run all pending migrations.
 * Idempotent: safe to call multiple times.
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const currentVersion = await getDbVersion(db);

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      console.log(`[Migration] Running ${migration.name}: ${migration.description}`);

      const sql = await readMigrationSql(migration.name);

      // Execute migration in a transaction
      // execAsync supports multiple statements; no need to split
      await db.withTransactionAsync(async () => {
        await db.execAsync(sql);

        // Update version
        await setDbVersion(db, migration.version);
      });

      console.log(`[Migration] Completed ${migration.name} (version ${migration.version})`);
    }
  }

  const finalVersion = await getDbVersion(db);
  console.log(`[Migration] Database at version ${finalVersion}`);
}

/**
 * Initialize database connection and run migrations.
 * Returns the database instance.
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('AlcoTracker.db');
  await runMigrations(db);
  return db;
}