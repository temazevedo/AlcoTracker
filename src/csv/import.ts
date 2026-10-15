/**
 * CSV Import utilities for AlcoTracker
 * Parses, validates, and detects duplicates in CSV imports
 */

import { DrinkEntryRow, DrinkDefinitionRow } from '@/db/schema';
import { CreateEntryInput, CreateDefinitionInput } from '@/db/repository';

export interface ParsedCsvRow {
  rowNumber: number;
  data: Record<string, string>;
  section: 'definitions' | 'entries' | 'unknown';
}

export interface ParsedCsv {
  definitions: ParsedCsvRow[];
  entries: ParsedCsvRow[];
  errors: ParseError[];
}

export interface ParseError {
  rowNumber: number;
  message: string;
  section: 'definitions' | 'entries' | 'unknown';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidatedRow<T> {
  rowNumber: number;
  data: T;
  isValid: boolean;
  errors: string[];
}

export interface DuplicateEntry {
  rowNumber: number;
  csvData: CreateEntryInput;
  existingEntry: DrinkEntryRow;
  matchType: 'exact' | 'fuzzy';
}

export interface DuplicateDefinition {
  rowNumber: number;
  csvData: CreateDefinitionInput;
  existingDefinition: DrinkDefinitionRow;
}

export interface DuplicateReport {
  entryDuplicates: DuplicateEntry[];
  definitionDuplicates: DuplicateDefinition[];
}

export interface ImportPreviewEntry {
  rowNumber: number;
  data: CreateEntryInput;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
  existingEntry?: DrinkEntryRow;
  userChoice?: 'skip' | 'overwrite' | 'add-new';
}

export interface ImportPreviewDefinition {
  rowNumber: number;
  data: CreateDefinitionInput;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
  existingDefinition?: DrinkDefinitionRow;
  userChoice?: 'skip' | 'overwrite' | 'add-new';
}

export interface ImportPreview {
  totalRows: number;
  validEntries: number;
  duplicateEntries: number;
  errorEntries: number;
  validDefinitions: number;
  duplicateDefinitions: number;
  errorDefinitions: number;
  entries: ImportPreviewEntry[];
  definitions: ImportPreviewDefinition[];
}

/**
 * Parse CSV text into structured data
 */
export function parseCsv(csvText: string): ParsedCsv {
  const lines = csvText.split('\n');
  const result: ParsedCsv = {
    definitions: [],
    entries: [],
    errors: [],
  };
  
  let currentSection: 'definitions' | 'entries' | 'unknown' = 'unknown';
  let headers: string[] = [];
  let inDefinitionsSection = false;
  let inEntriesSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Skip comment lines but detect section markers
    if (line.startsWith('#')) {
      if (line.includes('DRINK_DEFINITIONS')) {
        currentSection = 'definitions';
        inDefinitionsSection = true;
        inEntriesSection = false;
        headers = [];
        continue;
      }
      if (line.includes('DRINK_ENTRIES')) {
        currentSection = 'entries';
        inDefinitionsSection = false;
        inEntriesSection = true;
        headers = [];
        continue;
      }
      if (line.includes('PROFILE_SETTINGS')) {
        currentSection = 'unknown';
        inDefinitionsSection = false;
        inEntriesSection = false;
        headers = [];
        continue;
      }
      if (line.includes('ALCO_TRACKER_EXPORT') || line.includes('version:') || line.includes('exported_at:')) {
        continue;
      }
      // Unknown section marker
      currentSection = 'unknown';
      continue;
    }
    
    // Parse CSV line (simple implementation, handles quoted fields)
    const fields = parseCsvLine(line);
    
    // If no headers yet, this line is the header
    if (headers.length === 0 && (inDefinitionsSection || inEntriesSection)) {
      headers = fields;
      continue;
    }
    
    // Create row object
    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header] = fields[index] ?? '';
    });
    
    if (inDefinitionsSection) {
      result.definitions.push({
        rowNumber: lineNumber,
        data: rowData,
        section: 'definitions',
      });
    } else if (inEntriesSection) {
      result.entries.push({
        rowNumber: lineNumber,
        data: rowData,
        section: 'entries',
      });
    } else {
      result.errors.push({
        rowNumber: lineNumber,
        message: 'Row outside of known section (DRINK_DEFINITIONS or DRINK_ENTRIES)',
        section: 'unknown',
      });
    }
  }
  
  return result;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current);
  return fields;
}

/**
 * Validate a drink definition row
 */
export function validateDefinitionRow(row: ParsedCsvRow): ValidationResult {
  const errors: string[] = [];
  const data = row.data;
  
  // Required fields
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (!data.volume_ml || isNaN(parseInt(data.volume_ml))) {
    errors.push('Volume (ml) is required and must be a number');
  } else if (parseInt(data.volume_ml) <= 0) {
    errors.push('Volume must be positive');
  }
  
  if (!data.abv || isNaN(parseFloat(data.abv))) {
    errors.push('ABV is required and must be a number');
  } else if (parseFloat(data.abv) < 0 || parseFloat(data.abv) > 100) {
    errors.push('ABV must be between 0 and 100');
  }
  
  // Optional fields with defaults
  const isFavorite = data.is_favorite === '1' || data.is_favorite === 'true';
  const isArchived = data.is_archived === '1' || data.is_archived === 'true';
  
  // Validate created_at if present
  if (data.created_at && isNaN(Date.parse(data.created_at))) {
    errors.push('Invalid created_at date format (expected ISO8601)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a drink entry row
 */
export function validateEntryRow(row: ParsedCsvRow): ValidationResult {
  const errors: string[] = [];
  const data = row.data;
  
  // Required fields
  if (!data.name_snapshot || data.name_snapshot.trim() === '') {
    errors.push('Drink name (name_snapshot) is required');
  }
  
  if (!data.volume_ml || isNaN(parseInt(data.volume_ml))) {
    errors.push('Volume (ml) is required and must be a number');
  } else if (parseInt(data.volume_ml) <= 0) {
    errors.push('Volume must be positive');
  }
  
  if (!data.abv || isNaN(parseFloat(data.abv))) {
    errors.push('ABV is required and must be a number');
  } else if (parseFloat(data.abv) < 0 || parseFloat(data.abv) > 100) {
    errors.push('ABV must be between 0 and 100');
  }
  
  if (!data.grams || isNaN(parseFloat(data.grams))) {
    errors.push('Grams is required and must be a number');
  } else if (parseFloat(data.grams) < 0) {
    errors.push('Grams must be non-negative');
  }
  
  if (!data.consumed_at || isNaN(Date.parse(data.consumed_at))) {
    errors.push('Consumed date (consumed_at) is required and must be valid ISO8601');
  }
  
  // Optional fields
  const definitionId = data.definition_id ? parseInt(data.definition_id) : null;
  if (definitionId !== null && isNaN(definitionId)) {
    errors.push('Definition ID must be a number if provided');
  }
  
  const sessionId = data.session_id ? parseInt(data.session_id) : null;
  if (sessionId !== null && isNaN(sessionId)) {
    errors.push('Session ID must be a number if provided');
  }
  
  // Validate created_at if present
  if (data.created_at && isNaN(Date.parse(data.created_at))) {
    errors.push('Invalid created_at date format (expected ISO8601)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Convert validated definition row to CreateDefinitionInput
 */
export function rowToDefinitionInput(row: ParsedCsvRow): CreateDefinitionInput {
  const data = row.data;
  return {
    name: data.name.trim(),
    volume_ml: parseInt(data.volume_ml),
    abv: parseFloat(data.abv),
    is_favorite: data.is_favorite === '1' || data.is_favorite === 'true',
    is_archived: data.is_archived === '1' || data.is_archived === 'true',
  };
}

/**
 * Convert validated entry row to CreateEntryInput
 */
export function rowToEntryInput(row: ParsedCsvRow): CreateEntryInput {
  const data = row.data;
  return {
    definition_id: data.definition_id ? parseInt(data.definition_id) : null,
    name_snapshot: data.name_snapshot.trim(),
    volume_ml: parseInt(data.volume_ml),
    abv: parseFloat(data.abv),
    grams: parseFloat(data.grams),
    consumed_at: data.consumed_at,
    session_id: data.session_id ? parseInt(data.session_id) : null,
    note: data.note || null,
  };
}

/**
 * Detect duplicate entries
 */
export function detectEntryDuplicates(
  entries: CreateEntryInput[],
  existingEntries: DrinkEntryRow[]
): DuplicateEntry[] {
  const duplicates: DuplicateEntry[] = [];
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    // Exact match: same consumed_at, name, volume, abv
    const exactMatch = existingEntries.find(e => 
      e.consumed_at === entry.consumed_at &&
      e.name_snapshot === entry.name_snapshot &&
      e.volume_ml === entry.volume_ml &&
      e.abv === entry.abv
    );
    
    if (exactMatch) {
      duplicates.push({
        rowNumber: i + 1,
        csvData: entry,
        existingEntry: exactMatch,
        matchType: 'exact',
      });
      continue;
    }
    
    // Fuzzy match: same consumed_at (within 5 min) and name
    const fuzzyMatch = existingEntries.find(e => {
      const entryTime = new Date(entry.consumed_at).getTime();
      const existingTime = new Date(e.consumed_at).getTime();
      return Math.abs(entryTime - existingTime) <= 5 * 60 * 1000 &&
        e.name_snapshot.toLowerCase() === entry.name_snapshot.toLowerCase();
    });
    
    if (fuzzyMatch) {
      duplicates.push({
        rowNumber: i + 1,
        csvData: entry,
        existingEntry: fuzzyMatch,
        matchType: 'fuzzy',
      });
    }
  }
  
  return duplicates;
}

/**
 * Detect duplicate definitions
 */
export function detectDefinitionDuplicates(
  definitions: CreateDefinitionInput[],
  existingDefinitions: DrinkDefinitionRow[]
): DuplicateDefinition[] {
  const duplicates: DuplicateDefinition[] = [];
  
  for (let i = 0; i < definitions.length; i++) {
    const def = definitions[i];
    
    // Match by name + volume + abv
    const match = existingDefinitions.find(e => 
      e.name.toLowerCase() === def.name.toLowerCase() &&
      e.volume_ml === def.volume_ml &&
      e.abv === def.abv
    );
    
    if (match) {
      duplicates.push({
        rowNumber: i + 1,
        csvData: def,
        existingDefinition: match,
      });
    }
  }
  
  return duplicates;
}

/**
 * Generate import preview from parsed CSV
 */
export function generateImportPreview(
  parsed: ParsedCsv,
  existingEntries: DrinkEntryRow[],
  existingDefinitions: DrinkDefinitionRow[]
): ImportPreview {
  // Validate definitions
  const validatedDefinitions = parsed.definitions.map(row => ({
    row: row,
    validation: validateDefinitionRow(row),
  }));
  
  // Validate entries
  const validatedEntries = parsed.entries.map(row => ({
    row: row,
    validation: validateEntryRow(row),
  }));
  
  // Convert valid rows to input objects
  const validDefinitions = validatedDefinitions
    .filter(v => v.validation.isValid)
    .map(v => rowToDefinitionInput(v.row));
    
  const validEntries = validatedEntries
    .filter(v => v.validation.isValid)
    .map(v => rowToEntryInput(v.row));
  
  // Detect duplicates
  const definitionDuplicates = detectDefinitionDuplicates(validDefinitions, existingDefinitions);
  const entryDuplicates = detectEntryDuplicates(validEntries, existingEntries);
  
  // Build preview
  const definitionPreview: ImportPreviewDefinition[] = parsed.definitions.map((row, index) => {
    const validation = validateDefinitionRow(row);
    const isDuplicate = definitionDuplicates.some(d => d.rowNumber === index + 1);
    const duplicate = definitionDuplicates.find(d => d.rowNumber === index + 1);
    
    if (!validation.isValid) {
      return {
        rowNumber: row.rowNumber,
        data: rowToDefinitionInput(row),
        status: 'error' as const,
        errorMessage: validation.errors.join('; '),
      };
    }
    
    if (isDuplicate) {
      return {
        rowNumber: row.rowNumber,
        data: rowToDefinitionInput(row),
        status: 'duplicate' as const,
        existingDefinition: duplicate!.existingDefinition,
        userChoice: 'skip',
      };
    }
    
    return {
      rowNumber: row.rowNumber,
      data: rowToDefinitionInput(row),
      status: 'valid' as const,
    };
  });
  
  const entryPreview: ImportPreviewEntry[] = parsed.entries.map((row, index) => {
    const validation = validateEntryRow(row);
    const isDuplicate = entryDuplicates.some(d => d.rowNumber === index + 1);
    const duplicate = entryDuplicates.find(d => d.rowNumber === index + 1);
    
    if (!validation.isValid) {
      return {
        rowNumber: row.rowNumber,
        data: rowToEntryInput(row),
        status: 'error' as const,
        errorMessage: validation.errors.join('; '),
      };
    }
    
    if (isDuplicate) {
      return {
        rowNumber: row.rowNumber,
        data: rowToEntryInput(row),
        status: 'duplicate' as const,
        existingEntry: duplicate!.existingEntry,
        userChoice: 'skip',
      };
    }
    
    return {
      rowNumber: row.rowNumber,
      data: rowToEntryInput(row),
      status: 'valid' as const,
    };
  });
  
  return {
    totalRows: parsed.definitions.length + parsed.entries.length + parsed.errors.length,
    validEntries: entryPreview.filter(e => e.status === 'valid').length,
    duplicateEntries: entryPreview.filter(e => e.status === 'duplicate').length,
    errorEntries: entryPreview.filter(e => e.status === 'error').length,
    validDefinitions: definitionPreview.filter(d => d.status === 'valid').length,
    duplicateDefinitions: definitionPreview.filter(d => d.status === 'duplicate').length,
    errorDefinitions: definitionPreview.filter(d => d.status === 'error').length,
    entries: entryPreview,
    definitions: definitionPreview,
  };
}