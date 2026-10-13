/**
 * Database schema types for AlcoTracker.
 * These interfaces match the SQLite table structures exactly.
 */

export interface DrinkDefinitionRow {
  id: number;
  name: string;
  volume_ml: number;
  abv: number;
  is_favorite: 0 | 1;
  is_archived: 0 | 1;
  created_at: string; // ISO8601 UTC
}

export interface DrinkEntryRow {
  id: number;
  definition_id: number | null;
  name_snapshot: string;
  volume_ml: number;
  abv: number;
  grams: number;
  consumed_at: string; // ISO8601 UTC
  session_id: number | null;
  note: string | null;
  created_at: string; // ISO8601 UTC
}

export interface SessionRow {
  id: number;
  start_at: string; // ISO8601 UTC
  end_at: string; // ISO8601 UTC
  interval_min: number;
  status: 'active' | 'ended' | 'cancelled';
  created_at: string; // ISO8601 UTC
}

export interface DayNoteRow {
  date: string; // YYYY-MM-DD (local date)
  note: string;
}

export interface ProfileSettingsRow {
  weight_kg: number;
  sex: 'male' | 'female';
  units: 'metric' | 'imperial';
  bac_unit: 'promille' | 'percent';
  elimination_rate: number;
  disclaimer_accepted_at: string | null; // ISO8601 UTC or null
}

export interface DbVersionRow {
  version: number;
}

// Table name constants for migration runner
export const TABLE_NAMES = {
  DRINK_DEFINITIONS: 'drink_definitions',
  DRINK_ENTRIES: 'drink_entries',
  SESSIONS: 'sessions',
  DAY_NOTES: 'day_notes',
  PROFILE_SETTINGS: 'profile_settings',
  DB_VERSION: 'db_version',
} as const;

// Type mapping for migration runner
export type DatabaseSchema = {
  [TABLE_NAMES.DRINK_DEFINITIONS]: DrinkDefinitionRow;
  [TABLE_NAMES.DRINK_ENTRIES]: DrinkEntryRow;
  [TABLE_NAMES.SESSIONS]: SessionRow;
  [TABLE_NAMES.DAY_NOTES]: DayNoteRow;
  [TABLE_NAMES.PROFILE_SETTINGS]: ProfileSettingsRow;
  [TABLE_NAMES.DB_VERSION]: DbVersionRow;
};