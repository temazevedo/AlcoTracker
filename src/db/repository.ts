/**
 * Database repository for AlcoTracker.
 * Provides CRUD operations for all entities using the singleton database connection.
 */

import * as SQLite from 'expo-sqlite';
import {
  DrinkDefinitionRow,
  DrinkEntryRow,
  SessionRow,
  DayNoteRow,
  ProfileSettingsRow,
  TABLE_NAMES,
} from './schema';
import { runMigrations } from './migrations';

// Singleton database instance
let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Get or create the database instance, running migrations on first init.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  if (!initPromise) {
    initPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('AlcoTracker.db');
      await runMigrations(db);
      dbInstance = db;
      return db;
    })();
  }

  return initPromise;
}

/**
 * Result wrapper for repository operations.
 * T can be nullable for single-item queries.
 */
export type RepositoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// Drink Definitions
// ============================================================================

export async function getAllDefinitions(): Promise<RepositoryResult<DrinkDefinitionRow[]>> {
  try {
    const db = await getDatabase();
    const data = await db.getAllAsync<DrinkDefinitionRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_DEFINITIONS} ORDER BY name`
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to get definitions: ${error}` };
  }
}

export async function getActiveDefinitions(): Promise<RepositoryResult<DrinkDefinitionRow[]>> {
  try {
    const db = await getDatabase();
    const data = await db.getAllAsync<DrinkDefinitionRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_DEFINITIONS} WHERE is_archived = 0 ORDER BY is_favorite DESC, name`
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to get active definitions: ${error}` };
  }
}

export async function getFavorites(): Promise<RepositoryResult<DrinkDefinitionRow[]>> {
  try {
    const db = await getDatabase();
    const data = await db.getAllAsync<DrinkDefinitionRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_DEFINITIONS} WHERE is_favorite = 1 AND is_archived = 0 ORDER BY name`
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to get favorites: ${error}` };
  }
}

export async function getDefinitionById(id: number): Promise<RepositoryResult<DrinkDefinitionRow | null>> {
  try {
    const db = await getDatabase();
    const data = await db.getFirstAsync<DrinkDefinitionRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_DEFINITIONS} WHERE id = ?`,
      [id]
    );
    return { success: true, data: data ?? null };
  } catch (error) {
    return { success: false, error: `Failed to get definition by ID: ${error}` };
  }
}

export async function createDefinition(
  name: string,
  volume_ml: number,
  abv: number,
  is_favorite: boolean = false
): Promise<RepositoryResult<DrinkDefinitionRow>> {
  try {
    const db = await getDatabase();
    const created_at = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.DRINK_DEFINITIONS} (name, volume_ml, abv, is_favorite, is_archived, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [name, volume_ml, abv, is_favorite ? 1 : 0, created_at]
    );
    const newDef = await db.getFirstAsync<DrinkDefinitionRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_DEFINITIONS} WHERE id = ?`,
      [result.lastInsertRowId]
    );
    if (!newDef) throw new Error('Failed to retrieve created definition');
    return { success: true, data: newDef };
  } catch (error) {
    return { success: false, error: `Failed to create definition: ${error}` };
  }
}

export async function updateDefinition(
  id: number,
  updates: Partial<Pick<DrinkDefinitionRow, 'name' | 'volume_ml' | 'abv'>>
): Promise<RepositoryResult<DrinkDefinitionRow | null>> {
  try {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.volume_ml !== undefined) {
      fields.push('volume_ml = ?');
      values.push(updates.volume_ml);
    }
    if (updates.abv !== undefined) {
      fields.push('abv = ?');
      values.push(updates.abv);
    }

    if (fields.length === 0) {
      const existing = await getDefinitionById(id);
      if (!existing.success || !existing.data) {
        return { success: false, error: 'Definition not found' };
      }
      return existing;
    }

    values.push(id);
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.DRINK_DEFINITIONS} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const updated = await getDefinitionById(id);
    return updated;
  } catch (error) {
    return { success: false, error: `Failed to update definition: ${error}` };
  }
}

export async function archiveDefinition(id: number): Promise<RepositoryResult<void>> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.DRINK_DEFINITIONS} SET is_archived = 1 WHERE id = ?`,
      [id]
    );
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: `Failed to archive definition: ${error}` };
  }
}

export async function unarchiveDefinition(id: number): Promise<RepositoryResult<void>> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.DRINK_DEFINITIONS} SET is_archived = 0 WHERE id = ?`,
      [id]
    );
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: `Failed to unarchive definition: ${error}` };
  }
}

export async function toggleFavorite(id: number): Promise<RepositoryResult<DrinkDefinitionRow | null>> {
  try {
    const db = await getDatabase();
    const current = await getDefinitionById(id);
    if (!current.success || !current.data) {
      return { success: false, error: 'Definition not found' };
    }
    const newFavorite = current.data.is_favorite === 1 ? 0 : 1;
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.DRINK_DEFINITIONS} SET is_favorite = ? WHERE id = ?`,
      [newFavorite, id]
    );
    return getDefinitionById(id);
  } catch (error) {
    return { success: false, error: `Failed to toggle favorite: ${error}` };
  }
}

// ============================================================================
// Drink Entries
// ============================================================================

interface CreateEntryInput {
  definition_id: number | null;
  name_snapshot: string;
  volume_ml: number;
  abv: number;
  grams: number;
  consumed_at: string; // ISO8601 UTC
  session_id: number | null;
  note: string | null;
}

export async function createEntry(input: CreateEntryInput): Promise<RepositoryResult<DrinkEntryRow>> {
  try {
    const db = await getDatabase();
    const created_at = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.DRINK_ENTRIES}
       (definition_id, name_snapshot, volume_ml, abv, grams, consumed_at, session_id, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.definition_id,
        input.name_snapshot,
        input.volume_ml,
        input.abv,
        input.grams,
        input.consumed_at,
        input.session_id,
        input.note,
        created_at,
      ]
    );
    const newEntry = await db.getFirstAsync<DrinkEntryRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_ENTRIES} WHERE id = ?`,
      [result.lastInsertRowId]
    );
    if (!newEntry) throw new Error('Failed to retrieve created entry');
    return { success: true, data: newEntry };
  } catch (error) {
    return { success: false, error: `Failed to create entry: ${error}` };
  }
}

export async function getEntryById(id: number): Promise<RepositoryResult<DrinkEntryRow | null>> {
  try {
    const db = await getDatabase();
    const data = await db.getFirstAsync<DrinkEntryRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_ENTRIES} WHERE id = ?`,
      [id]
    );
    return { success: true, data: data ?? null };
  } catch (error) {
    return { success: false, error: `Failed to get entry by ID: ${error}` };
  }
}

export async function getEntriesByDateRange(
  startDate: string, // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
): Promise<RepositoryResult<DrinkEntryRow[]>> {
  try {
    const db = await getDatabase();
    // Convert local date range to UTC timestamps for comparison
    const startUtc = `${startDate}T00:00:00.000Z`;
    const endUtc = `${endDate}T23:59:59.999Z`;
    const data = await db.getAllAsync<DrinkEntryRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_ENTRIES}
       WHERE consumed_at >= ? AND consumed_at <= ?
       ORDER BY consumed_at DESC`,
      [startUtc, endUtc]
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to get entries by date range: ${error}` };
  }
}

export async function getEntriesBySession(
  sessionId: number
): Promise<RepositoryResult<DrinkEntryRow[]>> {
  try {
    const db = await getDatabase();
    const data = await db.getAllAsync<DrinkEntryRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_ENTRIES}
       WHERE session_id = ?
       ORDER BY consumed_at ASC`,
      [sessionId]
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to get entries by session: ${error}` };
  }
}

export async function getEntriesByDate(
  date: string // YYYY-MM-DD
): Promise<RepositoryResult<DrinkEntryRow[]>> {
  return getEntriesByDateRange(date, date);
}

export async function getTodaysEntries(): Promise<RepositoryResult<DrinkEntryRow[]>> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return getEntriesByDate(today);
}

/**
 * Get entries for the last N days (for stats screen)
 */
export async function getEntriesForStats(
  lookbackDays: number
): Promise<RepositoryResult<DrinkEntryRow[]>> {
  try {
    const db = await getDatabase();
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (lookbackDays - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const startUtc = `${startDate}T00:00:00.000Z`;
    const endUtc = `${endDate}T23:59:59.999Z`;
    const data = await db.getAllAsync<DrinkEntryRow>(
      `SELECT * FROM ${TABLE_NAMES.DRINK_ENTRIES}
       WHERE consumed_at >= ? AND consumed_at <= ?
       ORDER BY consumed_at ASC`,
      [startUtc, endUtc]
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to get entries for stats: ${error}` };
  }
}

export async function updateEntry(
  id: number,
  updates: Partial<Pick<DrinkEntryRow, 'name_snapshot' | 'volume_ml' | 'abv' | 'grams' | 'consumed_at' | 'note'>>
): Promise<RepositoryResult<DrinkEntryRow | null>> {
  try {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name_snapshot !== undefined) {
      fields.push('name_snapshot = ?');
      values.push(updates.name_snapshot);
    }
    if (updates.volume_ml !== undefined) {
      fields.push('volume_ml = ?');
      values.push(updates.volume_ml);
    }
    if (updates.abv !== undefined) {
      fields.push('abv = ?');
      values.push(updates.abv);
    }
    if (updates.grams !== undefined) {
      fields.push('grams = ?');
      values.push(updates.grams);
    }
    if (updates.consumed_at !== undefined) {
      fields.push('consumed_at = ?');
      values.push(updates.consumed_at);
    }
    if (updates.note !== undefined) {
      fields.push('note = ?');
      values.push(updates.note);
    }

    if (fields.length === 0) {
      return getEntryById(id);
    }

    values.push(id);
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.DRINK_ENTRIES} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return getEntryById(id);
  } catch (error) {
    return { success: false, error: `Failed to update entry: ${error}` };
  }
}

export async function deleteEntry(id: number): Promise<RepositoryResult<void>> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM ${TABLE_NAMES.DRINK_ENTRIES} WHERE id = ?`,
      [id]
    );
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: `Failed to delete entry: ${error}` };
  }
}

/**
 * Get most recent distinct drinks for quick-add buttons.
 * Returns up to 5 most recent unique drink names with their latest volume/abv.
 */
export async function getRecentDistinctDrinks(limit: number = 5): Promise<RepositoryResult<{
  name: string;
  volume_ml: number;
  abv: number;
  definition_id: number | null;
}[]>> {
  try {
    const db = await getDatabase();
    const data = await db.getAllAsync<{
      name: string;
      volume_ml: number;
      abv: number;
      definition_id: number | null;
    }>(
      `SELECT name_snapshot as name, volume_ml, abv, definition_id
       FROM ${TABLE_NAMES.DRINK_ENTRIES}
       WHERE id IN (
         SELECT MAX(id)
         FROM ${TABLE_NAMES.DRINK_ENTRIES}
         GROUP BY name_snapshot
       )
       ORDER BY consumed_at DESC
       LIMIT ?`,
      [limit]
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to get recent drinks: ${error}` };
  }
}

// ============================================================================
// Sessions
// ============================================================================

interface CreateSessionInput {
  start_at: string; // ISO8601 UTC
  end_at: string;   // ISO8601 UTC
  interval_min: number;
}

export async function createSession(input: CreateSessionInput): Promise<RepositoryResult<SessionRow>> {
  try {
    const db = await getDatabase();
    const created_at = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.SESSIONS} (start_at, end_at, interval_min, status, created_at)
       VALUES (?, ?, ?, 'active', ?)`,
      [input.start_at, input.end_at, input.interval_min, created_at]
    );
    const newSession = await db.getFirstAsync<SessionRow>(
      `SELECT * FROM ${TABLE_NAMES.SESSIONS} WHERE id = ?`,
      [result.lastInsertRowId]
    );
    if (!newSession) throw new Error('Failed to retrieve created session');
    return { success: true, data: newSession };
  } catch (error) {
    return { success: false, error: `Failed to create session: ${error}` };
  }
}

export async function getActiveSession(): Promise<RepositoryResult<SessionRow | null>> {
  try {
    const db = await getDatabase();
    const data = await db.getFirstAsync<SessionRow>(
      `SELECT * FROM ${TABLE_NAMES.SESSIONS} WHERE status = 'active' ORDER BY start_at DESC LIMIT 1`
    );
    return { success: true, data: data ?? null };
  } catch (error) {
    return { success: false, error: `Failed to get active session: ${error}` };
  }
}

export async function getSessionById(id: number): Promise<RepositoryResult<SessionRow | null>> {
  try {
    const db = await getDatabase();
    const data = await db.getFirstAsync<SessionRow>(
      `SELECT * FROM ${TABLE_NAMES.SESSIONS} WHERE id = ?`,
      [id]
    );
    return { success: true, data: data ?? null };
  } catch (error) {
    return { success: false, error: `Failed to get session by ID: ${error}` };
  }
}

export async function endSession(id: number): Promise<RepositoryResult<SessionRow | null>> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.SESSIONS} SET status = 'ended', end_at = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
    return getSessionById(id);
  } catch (error) {
    return { success: false, error: `Failed to end session: ${error}` };
  }
}

export async function cancelSession(id: number): Promise<RepositoryResult<SessionRow | null>> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.SESSIONS} SET status = 'cancelled', end_at = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
    return getSessionById(id);
  } catch (error) {
    return { success: false, error: `Failed to cancel session: ${error}` };
  }
}

export async function updateSessionInterval(id: number, interval_min: number): Promise<RepositoryResult<SessionRow | null>> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.SESSIONS} SET interval_min = ? WHERE id = ?`,
      [interval_min, id]
    );
    return getSessionById(id);
  } catch (error) {
    return { success: false, error: `Failed to update session interval: ${error}` };
  }
}

// ============================================================================
// Day Notes
// ============================================================================

export async function getDayNote(date: string): Promise<RepositoryResult<DayNoteRow | null>> {
  try {
    const db = await getDatabase();
    const data = await db.getFirstAsync<DayNoteRow>(
      `SELECT * FROM ${TABLE_NAMES.DAY_NOTES} WHERE date = ?`,
      [date]
    );
    return { success: true, data: data ?? null };
  } catch (error) {
    return { success: false, error: `Failed to get day note: ${error}` };
  }
}

export async function setDayNote(date: string, note: string): Promise<RepositoryResult<DayNoteRow>> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO ${TABLE_NAMES.DAY_NOTES} (date, note) VALUES (?, ?)`,
      [date, note]
    );
    const data = await db.getFirstAsync<DayNoteRow>(
      `SELECT * FROM ${TABLE_NAMES.DAY_NOTES} WHERE date = ?`,
      [date]
    );
    if (!data) throw new Error('Failed to retrieve day note');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to set day note: ${error}` };
  }
}

export async function deleteDayNote(date: string): Promise<RepositoryResult<void>> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM ${TABLE_NAMES.DAY_NOTES} WHERE date = ?`,
      [date]
    );
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: `Failed to delete day note: ${error}` };
  }
}

// ============================================================================
// Profile Settings (Singleton)
// ============================================================================

interface ProfileInput {
  weight_kg: number;
  sex: 'male' | 'female';
  units: 'metric' | 'imperial';
  bac_unit: 'promille' | 'percent';
  elimination_rate: number;
  disclaimer_accepted_at: string | null;
}

const DEFAULT_PROFILE: ProfileInput = {
  weight_kg: 70,
  sex: 'male',
  units: 'metric',
  bac_unit: 'promille',
  elimination_rate: 0.15,
  disclaimer_accepted_at: null,
};

export async function getProfile(): Promise<RepositoryResult<ProfileSettingsRow>> {
  try {
    const db = await getDatabase();
    let data = await db.getFirstAsync<ProfileSettingsRow>(
      `SELECT * FROM ${TABLE_NAMES.PROFILE_SETTINGS} LIMIT 1`
    );

    if (!data) {
      // Initialize with defaults if empty
      data = await initializeDefaultProfile();
    }

    return { success: true, data: data! };
  } catch (error) {
    return { success: false, error: `Failed to get profile: ${error}` };
  }
}

export async function initializeDefaultProfile(): Promise<ProfileSettingsRow | null> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO ${TABLE_NAMES.PROFILE_SETTINGS}
       (weight_kg, sex, units, bac_unit, elimination_rate, disclaimer_accepted_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        DEFAULT_PROFILE.weight_kg,
        DEFAULT_PROFILE.sex,
        DEFAULT_PROFILE.units,
        DEFAULT_PROFILE.bac_unit,
        DEFAULT_PROFILE.elimination_rate,
        DEFAULT_PROFILE.disclaimer_accepted_at,
      ]
    );
    return db.getFirstAsync<ProfileSettingsRow>(
      `SELECT * FROM ${TABLE_NAMES.PROFILE_SETTINGS} LIMIT 1`
    );
  } catch (error) {
    console.error('Failed to initialize default profile:', error);
    return null;
  }
}

export async function updateProfile(
  updates: Partial<ProfileInput>
): Promise<RepositoryResult<ProfileSettingsRow>> {
  try {
    const db = await getDatabase();
    const current = await getProfile();
    if (!current.success || !current.data) {
      return { success: false, error: 'Profile not found' };
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.weight_kg !== undefined) {
      fields.push('weight_kg = ?');
      values.push(updates.weight_kg);
    }
    if (updates.sex !== undefined) {
      fields.push('sex = ?');
      values.push(updates.sex);
    }
    if (updates.units !== undefined) {
      fields.push('units = ?');
      values.push(updates.units);
    }
    if (updates.bac_unit !== undefined) {
      fields.push('bac_unit = ?');
      values.push(updates.bac_unit);
    }
    if (updates.elimination_rate !== undefined) {
      fields.push('elimination_rate = ?');
      values.push(updates.elimination_rate);
    }
    if (updates.disclaimer_accepted_at !== undefined) {
      fields.push('disclaimer_accepted_at = ?');
      values.push(updates.disclaimer_accepted_at);
    }

    if (fields.length === 0) {
      return current;
    }

    await db.runAsync(
      `UPDATE ${TABLE_NAMES.PROFILE_SETTINGS} SET ${fields.join(', ')}`,
      values
    );

    return getProfile();
  } catch (error) {
    return { success: false, error: `Failed to update profile: ${error}` };
  }
}

export async function acceptDisclaimer(): Promise<RepositoryResult<ProfileSettingsRow>> {
  return updateProfile({ disclaimer_accepted_at: new Date().toISOString() });
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Close the database connection (useful for testing or app shutdown).
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    initPromise = null;
  }
}

/**
 * Reset database to initial state (for testing only).
 */
export async function resetDatabase(): Promise<void> {
  await closeDatabase();
  // The next getDatabase() call will re-run migrations
}

/**
 * Calculate pure alcohol grams from volume and ABV.
 * Formula: grams = volume_ml * (abv / 100) * 0.789
 * 0.789 = density of ethanol (g/ml)
 */
export function calculateGrams(volume_ml: number, abv: number): number {
  return volume_ml * (abv / 100) * 0.789;
}