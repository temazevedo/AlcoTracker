/**
 * CSV Export utilities for AlcoTracker
 * Generates CSV content for drink entries and drink definitions
 */

import { DrinkEntryRow, DrinkDefinitionRow } from '@/db/schema';

export interface ExportData {
  entries: DrinkEntryRow[];
  definitions: DrinkDefinitionRow[];
  exportedAt: string;
  version: number;
}

/**
 * Escape CSV field value
 */
export function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // If value contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV header line
 */
function generateHeader(columns: string[]): string {
  return columns.map(escapeCsvField).join(',');
}

/**
 * Generate CSV row from object
 */
function generateRow(obj: Record<string, string | number | null | undefined>, columns: string[]): string {
  return columns.map(col => escapeCsvField(obj[col])).join(',');
}

/**
 * Export drink definitions to CSV format
 */
export function exportDefinitionsToCsv(definitions: DrinkDefinitionRow[]): string {
  const columns = ['id', 'name', 'volume_ml', 'abv', 'is_favorite', 'is_archived', 'created_at'];
  const lines = [generateHeader(columns)];
  
  for (const def of definitions) {
    lines.push(generateRow({
      id: def.id,
      name: def.name,
      volume_ml: def.volume_ml,
      abv: def.abv,
      is_favorite: def.is_favorite ? 1 : 0,
      is_archived: def.is_archived ? 1 : 0,
      created_at: def.created_at,
    }, columns));
  }
  
  return lines.join('\n');
}

/**
 * Export drink entries to CSV format
 */
export function exportEntriesToCsv(entries: DrinkEntryRow[]): string {
  const columns = ['id', 'definition_id', 'name_snapshot', 'volume_ml', 'abv', 'grams', 'consumed_at', 'session_id', 'note', 'created_at'];
  const lines = [generateHeader(columns)];
  
  for (const entry of entries) {
    lines.push(generateRow({
      id: entry.id,
      definition_id: entry.definition_id,
      name_snapshot: entry.name_snapshot,
      volume_ml: entry.volume_ml,
      abv: entry.abv,
      grams: entry.grams,
      consumed_at: entry.consumed_at,
      session_id: entry.session_id,
      note: entry.note,
      created_at: entry.created_at,
    }, columns));
  }
  
  return lines.join('\n');
}

/**
 * Generate full export CSV content
 */
export function generateExportCsv(data: ExportData): string {
  const lines: string[] = [];
  
  // File metadata
  lines.push('# ALCO_TRACKER_EXPORT');
  lines.push(`# version: ${data.version}`);
  lines.push(`# exported_at: ${data.exportedAt}`);
  lines.push('');
  
  // Drink Definitions section
  lines.push('# DRINK_DEFINITIONS');
  lines.push(exportDefinitionsToCsv(data.definitions));
  lines.push('');
  
  // Drink Entries section
  lines.push('# DRINK_ENTRIES');
  lines.push(exportEntriesToCsv(data.entries));
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Create export data structure from repository results
 */
export function createExportData(
  entries: DrinkEntryRow[],
  definitions: DrinkDefinitionRow[]
): ExportData {
  return {
    entries,
    definitions,
    exportedAt: new Date().toISOString(),
    version: 1,
  };
}